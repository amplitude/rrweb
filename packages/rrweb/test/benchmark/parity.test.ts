/**
 * SR-4160 Pillar 0 — Parity Harness
 *
 * Verifies that what rrweb records is faithfully reproduced by the Replayer.
 *
 * Strategy per fixture:
 *  1. Load the fixture in Puppeteer, inject rrweb, run the workload and collect
 *     events.
 *  2. Capture a "source snapshot" of the live DOM at the end of the workload
 *     (tagName, attributes, textContent of every element).
 *  3. Load a fresh Puppeteer page, replay the recorded events to completion
 *     (fast-forward to the end), then capture the same snapshot from the
 *     replay iframe.
 *  4. Assert node-by-node equality.
 *
 * "Parity" here means structural fidelity — not pixel-perfect rendering.
 * Attributes that are rrweb-internal (data-rr-*) or volatile (scroll position)
 * are excluded from the comparison.
 *
 * Run with:
 *   yarn benchmark --reporter=verbose
 *   (or: vitest run test/benchmark/parity.test.ts)
 */

import type { eventWithTime } from '@amplitude/rrweb-types';
import * as fs from 'fs';
import * as path from 'path';
import { vi } from 'vitest';
import { ISuite, launchPuppeteer } from '../utils';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

interface ParityFixture {
  name: string;
  file: string;
  /** JS expression that drives the workload; must return a Promise. */
  workload: string;
  /**
   * Minimum number of source nodes expected after the workload completes.
   * A single mount() produces ~1 000 nodes; 0 would indicate the DOM was
   * unexpectedly empty (e.g. workload ended with unmount).
   */
  expectedMinSourceNodes: number;
}

const FIXTURES: ParityFixture[] = [
  {
    name: 'mutation-heavy',
    file: 'mutation-heavy.html',
    // Use runWorkloadKeepFinalState so the DOM is populated after the workload.
    // runWorkload() ends with unmount(), leaving only <body><div id="root">.
    // A near-empty snapshot makes parity meaningless: Pillar-1's dropped-<li>
    // regression would pass because there's nothing to compare.  This variant
    // runs the same mount→reconcile cycles but skips the final unmount, leaving
    // ~1 000 <div class="item"> nodes on-screen for the snapshot comparison.
    // (SR-4160 critical fix #1)
    workload: 'window.runWorkloadKeepFinalState(5)',
    // 1 000 items + the <body> wrapper + the #root div = at least 1 000 nodes.
    // If this ever drops below 500 the workload likely ended with unmount().
    expectedMinSourceNodes: 500,
  },
  {
    name: 'scroll-heavy',
    file: 'scroll-heavy.html',
    workload: 'window.runWorkload(1)',
    // 500 sections × 3 descendant elements (div, h2, p) = ~1 500 nodes.
    expectedMinSourceNodes: 100,
  },
];

// ---------------------------------------------------------------------------
// DOM snapshot helpers
// ---------------------------------------------------------------------------

/**
 * Represents one serialized DOM node for equality comparison.
 */
interface NodeSnapshot {
  tagName: string;
  attributes: Record<string, string>;
  textContent: string;
  childCount: number;
}

/** Serialized flat walk of a DOM subtree, returned from page.evaluate(). */
type FlatSnapshot = NodeSnapshot[];

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('parity: record → replay DOM equality', () => {
  // 120 s is well above the measured ~30 s for 5-cycle mutation-heavy workload;
  // 10-minute timeouts hide flake and slow feedback.  (SR-4160 minor fix #13)
  vi.setConfig({ testTimeout: 120_000 });

  let browser: ISuite['browser'];
  // rrwebCode is loaded in beforeAll so a missing build gives a clear error
  // ("Run 'yarn build' first") rather than silently using stale code.
  // (SR-4160 minor fix #11)
  let rrwebCode: string;

  beforeAll(async () => {
    const bundlePath = path.resolve(__dirname, '../../dist/rrweb.umd.cjs');
    if (!fs.existsSync(bundlePath)) {
      throw new Error(
        `rrweb bundle not found at ${bundlePath}. Run "yarn build" first.`,
      );
    }
    rrwebCode = fs.readFileSync(bundlePath, 'utf8');

    // startServer() is not used: fixtures are loaded via page.setContent(),
    // not over HTTP.  (SR-4160 minor fix #12)
    browser = await launchPuppeteer({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  for (const fixture of FIXTURES) {
    it(`DOM parity: ${fixture.name}`, async () => {
      const fixturePath = path.resolve(__dirname, 'fixtures', fixture.file);
      const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');

      // ------------------------------------------------------------------
      // Phase 1 – Record
      // ------------------------------------------------------------------
      const recordPage = await browser.newPage();
      recordPage.on('console', (msg) =>
        process.stdout.write(
          `[${fixture.name}:record] ${msg
            .type()
            .toUpperCase()} ${msg.text()}\n`,
        ),
      );

      await recordPage.goto('about:blank');
      await recordPage.setContent(fixtureHtml, {
        waitUntil: 'domcontentloaded',
      });

      // Inject rrweb via evaluate (avoids the dist/main path bug).
      await recordPage.evaluate(rrwebCode);

      // Start recording, run workload, collect events.
      const eventsJson: string = (await recordPage.evaluate(
        async (workloadExpr: string) => {
          const events: eventWithTime[] = [];
          const record = (window as any).rrweb.record;
          record({
            emit(event: eventWithTime) {
              events.push(event);
            },
          });
          const workloadFn = new Function(
            `return (async () => { return await ${workloadExpr}; })`,
          )();
          await workloadFn();
          return JSON.stringify(events);
        },
        fixture.workload,
      )) as string;

      // Capture the live DOM snapshot after the workload.
      const sourceSnapshot: FlatSnapshot = await recordPage.evaluate(() => {
        const ignoredAttrPrefixes = ['data-rr-', 'rr_'];
        const ignoredAttrs = new Set(['style']);
        const results: Array<{
          tagName: string;
          attributes: Record<string, string>;
          textContent: string;
          childCount: number;
        }> = [];

        function walk(el: Element, depth: number): void {
          if (depth > 20) return; // safety cap
          const tag = el.tagName.toLowerCase();
          // Skip script/style/head and rrweb injected elements.
          if (['script', 'style', 'head', 'link'].includes(tag)) return;

          const attrs: Record<string, string> = {};
          for (const attr of Array.from(el.attributes)) {
            const name = attr.name;
            if (ignoredAttrPrefixes.some((p) => name.startsWith(p))) continue;
            if (ignoredAttrs.has(name)) continue;
            attrs[name] = attr.value;
          }

          // Direct text nodes only (not descendant text).
          let directText = '';
          for (const child of Array.from(el.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) {
              directText += (child.textContent || '').trim();
            }
          }

          results.push({
            tagName: tag,
            attributes: attrs,
            textContent: directText,
            childCount: el.children.length,
          });

          for (const child of Array.from(el.children)) {
            walk(child, depth + 1);
          }
        }

        // Walk body only (head/meta is less interesting for structural parity).
        if (document.body) walk(document.body, 0);
        return results;
      });

      await recordPage.close();

      const events: eventWithTime[] = JSON.parse(eventsJson);
      // Harness sanity: at least some events must have been recorded.
      expect(events.length).toBeGreaterThan(0);
      // Guard against the workload ending with unmount() and leaving an empty
      // DOM — that would make the parity comparison meaningless.  The floor is
      // per-fixture; see expectedMinSourceNodes above.  (SR-4160 major fix #5)
      expect(sourceSnapshot.length).toBeGreaterThanOrEqual(
        fixture.expectedMinSourceNodes,
      );

      // ------------------------------------------------------------------
      // Phase 2 – Replay
      // ------------------------------------------------------------------
      const replayPage = await browser.newPage();
      replayPage.on('console', (msg) =>
        process.stdout.write(
          `[${fixture.name}:replay] ${msg
            .type()
            .toUpperCase()} ${msg.text()}\n`,
        ),
      );

      await replayPage.goto('about:blank');
      await replayPage.setContent(
        `<html><head></head><body><div id="replay-root"></div></body></html>`,
        { waitUntil: 'domcontentloaded' },
      );

      // Inject rrweb + events, play to end (synchronously via pause).
      await replayPage.evaluate(rrwebCode);
      await replayPage.evaluate((eventsJson: string) => {
        (window as any).__parity_events = JSON.parse(eventsJson);
      }, eventsJson);

      // Replay by pausing at the end of the recording.
      // replayer.getMetaData().totalTime is the authoritative recording
      // duration; we use it directly rather than recomputing lastTs - firstTs.
      // We add 1 ms because the replayer applies events with timestamp <
      // pauseTime (strict less-than): pausing at exactly totalTime skips the
      // last event(s) whose relative timestamp equals totalTime.  +1 ms is the
      // minimal deterministic fix — not a guess about workload duration.
      // (SR-4160 major fix #7)
      await replayPage.evaluate(() => {
        const events: eventWithTime[] = (window as any).__parity_events;

        const { Replayer } = (window as any).rrweb;
        const container = document.getElementById('replay-root')!;
        const replayer = new Replayer(events, { root: container });

        const totalTime = replayer.getMetaData().totalTime;
        replayer.pause(totalTime + 1); // +1 ms: include events at totalTime boundary
        (window as any).__parity_replayer = replayer;
      });

      // Give the replayer one animation frame to flush any pending DOM work
      // queued during pause() (e.g. style/attribute patches applied lazily).
      // A single rAF is sufficient; the double-rAF was vestigial and removed.
      await replayPage.evaluate(
        () => new Promise<void>((r) => requestAnimationFrame(r)),
      );

      // Capture the replay DOM snapshot from inside the replay iframe.
      const replaySnapshot: FlatSnapshot = await replayPage.evaluate(() => {
        const ignoredAttrPrefixes = ['data-rr-', 'rr_'];
        const ignoredAttrs = new Set(['style']);

        const replayer = (window as any).__parity_replayer;
        if (!replayer || !replayer.iframe) return [];
        const iframeDoc = replayer.iframe.contentDocument;
        if (!iframeDoc || !iframeDoc.body) return [];

        const results: Array<{
          tagName: string;
          attributes: Record<string, string>;
          textContent: string;
          childCount: number;
        }> = [];

        function walk(el: Element, depth: number): void {
          if (depth > 20) return;
          const tag = el.tagName.toLowerCase();
          if (['script', 'style', 'head', 'link'].includes(tag)) return;

          const attrs: Record<string, string> = {};
          for (const attr of Array.from(el.attributes)) {
            const name = attr.name;
            if (ignoredAttrPrefixes.some((p) => name.startsWith(p))) continue;
            if (ignoredAttrs.has(name)) continue;
            attrs[name] = attr.value;
          }

          let directText = '';
          for (const child of Array.from(el.childNodes)) {
            if (child.nodeType === 3 /* TEXT_NODE */) {
              directText += (child.textContent || '').trim();
            }
          }

          results.push({
            tagName: tag,
            attributes: attrs,
            textContent: directText,
            childCount: el.children.length,
          });

          for (const child of Array.from(el.children)) {
            walk(child, depth + 1);
          }
        }

        walk(iframeDoc.body, 0);
        return results;
      });

      await replayPage.close();

      // ------------------------------------------------------------------
      // Phase 3 – Compare
      // ------------------------------------------------------------------
      expect(replaySnapshot.length).toBeGreaterThan(0);

      // Order-sensitive node matching: walk source and replay in parallel,
      // skipping over replayer-injected wrapper nodes (e.g. the mouse-cursor
      // div, replay-root wrapper) that have no source counterpart.
      //
      // Matching strategy:
      //   - For each source node (in document order) advance a replay cursor
      //     until we find a node whose tagName + attributes + textContent all
      //     match the source node, or we exhaust replay candidates.
      //   - A node consumed by one source match cannot be reused by another —
      //     this is the critical property that prevents Pillar-1's
      //     "1 <li> in replay matches 1 000 source <li>s" false-positive.
      //   - Order is enforced: the replay cursor only moves forward.
      //
      // MAX_ALLOWED_MISMATCHES = 1 tolerates exactly one source node that has no
      // replay counterpart. This is a deliberate small blind spot for noise (e.g.
      // async style/font work that hasn't settled by the time we snapshot); it is
      // NOT a tolerance for replayer-injected wrapper nodes — those live outside
      // iframeDoc.body and are filtered by walking only the iframe's body subtree.
      // (SR-4160 critical fixes #2, #3; major fix #4)
      //
      // TODO(SR-4160 follow-up): extend to detect sibling-reorder regressions
      // by also asserting that the relative ordering of matched siblings within
      // a common parent is preserved.

      function nodesMatch(src: NodeSnapshot, rep: NodeSnapshot): boolean {
        if (src.tagName !== rep.tagName) return false;
        for (const [k, v] of Object.entries(src.attributes)) {
          if (rep.attributes[k] !== v) return false;
        }
        if (src.textContent && rep.textContent !== src.textContent)
          return false;
        return true;
      }

      const matchFailures: string[] = [];
      let replayCursor = 0;

      for (const srcNode of sourceSnapshot) {
        // Advance replay cursor until we find a match or run out of candidates.
        let found = false;
        while (replayCursor < replaySnapshot.length) {
          if (nodesMatch(srcNode, replaySnapshot[replayCursor])) {
            replayCursor++; // consume this replay node
            found = true;
            break;
          }
          replayCursor++;
        }
        if (!found) {
          matchFailures.push(
            `<${srcNode.tagName} ${JSON.stringify(srcNode.attributes)}> "${
              srcNode.textContent
            }"`,
          );
        }
      }

      // Allow at most 1 unmatched source node (noise tolerance for async work
      // that may not have settled by snapshot time; replayer wrapper nodes live
      // outside iframeDoc.body and are not in scope here).
      const MAX_ALLOWED_MISMATCHES = 1;

      if (matchFailures.length > MAX_ALLOWED_MISMATCHES) {
        const preview = matchFailures.slice(0, 10).join('\n  ');
        throw new Error(
          `[${fixture.name}] ${matchFailures.length}/${sourceSnapshot.length} ` +
            `nodes did not match in replay (threshold: ${MAX_ALLOWED_MISMATCHES}).\n` +
            `First failures:\n  ${preview}`,
        );
      }

      console.log(
        `[${fixture.name}] parity OK: ${sourceSnapshot.length} source nodes, ` +
          `${replaySnapshot.length} replay nodes, ` +
          `${matchFailures.length} unmatched (threshold: ${MAX_ALLOWED_MISMATCHES})`,
      );
    });
  }
});
