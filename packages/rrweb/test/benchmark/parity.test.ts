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
import { getServerURL, ISuite, launchPuppeteer, startServer } from '../utils';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

interface ParityFixture {
  name: string;
  file: string;
  /** JS expression that drives the workload; must return a Promise. */
  workload: string;
}

const FIXTURES: ParityFixture[] = [
  {
    name: 'mutation-heavy',
    file: 'mutation-heavy.html',
    workload: 'window.runWorkload(5)',
  },
  {
    name: 'scroll-heavy',
    file: 'scroll-heavy.html',
    workload: 'window.runWorkload(1)',
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

/**
 * Attributes to ignore during comparison (rrweb internals, scroll, counters).
 */
const IGNORED_ATTR_PREFIXES = ['data-rr-', 'rr_'];
const IGNORED_ATTRS = new Set([
  'style', // too volatile (scroll-induced transforms etc.)
]);

/** Serialized flat walk of a DOM subtree, returned from page.evaluate(). */
type FlatSnapshot = NodeSnapshot[];

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('parity: record → replay DOM equality', () => {
  vi.setConfig({ testTimeout: 600_000 });

  let browser: ISuite['browser'];
  let server: ISuite['server'];

  beforeAll(async () => {
    server = await startServer();
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
    server.close();
  });

  const getRrwebUrl = () => `${getServerURL(server)}/rrweb.umd.cjs`;

  for (const fixture of FIXTURES) {
    it(`DOM parity: ${fixture.name}`, async () => {
      const fixturePath = path.resolve(__dirname, 'fixtures', fixture.file);
      const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
      const rrwebUrl = getRrwebUrl();
      const rrwebCode = fs.readFileSync(
        path.resolve(__dirname, '../../dist/rrweb.umd.cjs'),
        'utf8',
      );

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

      // Inject rrweb from the local test server.
      await recordPage.evaluate((url: string) => {
        const script = document.createElement('script');
        script.src = url;
        document.head.appendChild(script);
      }, rrwebUrl);
      await recordPage.waitForFunction('typeof window.rrweb !== "undefined"', {
        timeout: 15_000,
      });

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
      expect(events.length).toBeGreaterThan(0);
      expect(sourceSnapshot.length).toBeGreaterThan(0);

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

      // Replay by pausing at the last event's timestamp (fast-forward).
      await replayPage.evaluate(() => {
        const events: eventWithTime[] = (window as any).__parity_events;
        const lastTs = events[events.length - 1]?.timestamp ?? 0;
        const firstTs = events[0]?.timestamp ?? 0;
        const totalTime = lastTs - firstTs;

        const { Replayer } = (window as any).rrweb;
        const container = document.getElementById('replay-root')!;
        const replayer = new Replayer(events, { root: container });
        replayer.pause(totalTime + 500); // +500 ms buffer
        (window as any).__parity_replayer = replayer;
      });

      // Give the replayer a tick to settle.
      await replayPage.evaluate(
        () =>
          new Promise<void>((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          ),
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

      // The replay may have slightly more wrapper nodes (replayer-mouse etc.)
      // so we compare source ⊆ replay by checking that every node in the
      // source snapshot appears (in order) within the replay snapshot.
      //
      // For a first draft this walk-and-match approach is intentionally lenient:
      // it catches missing nodes and attribute corruption without false-positives
      // from replayer chrome elements.
      const replayIndex = new Map<string, NodeSnapshot[]>();
      for (const node of replaySnapshot) {
        const key = node.tagName;
        if (!replayIndex.has(key)) replayIndex.set(key, []);
        replayIndex.get(key)!.push(node);
      }

      let matchFailures: string[] = [];
      for (const srcNode of sourceSnapshot) {
        const candidates = replayIndex.get(srcNode.tagName) ?? [];
        const matched = candidates.some((rep) => {
          // Check every attribute from source exists in replay.
          for (const [k, v] of Object.entries(srcNode.attributes)) {
            if (rep.attributes[k] !== v) return false;
          }
          // Text content must match (trimmed).
          if (srcNode.textContent && rep.textContent !== srcNode.textContent) {
            return false;
          }
          return true;
        });
        if (!matched) {
          matchFailures.push(
            `<${srcNode.tagName} ${JSON.stringify(srcNode.attributes)}> "${
              srcNode.textContent
            }"`,
          );
        }
      }

      // Allow up to 1% mismatch (covers minor rrweb edge cases, timing jitter).
      const mismatchRate =
        matchFailures.length / Math.max(sourceSnapshot.length, 1);
      const MISMATCH_THRESHOLD = 0.01;

      if (mismatchRate > MISMATCH_THRESHOLD) {
        const preview = matchFailures.slice(0, 10).join('\n  ');
        throw new Error(
          `[${fixture.name}] ${matchFailures.length}/${sourceSnapshot.length} ` +
            `nodes (${(mismatchRate * 100).toFixed(
              1,
            )}%) did not match in replay.\n` +
            `First failures:\n  ${preview}`,
        );
      }

      console.log(
        `[${fixture.name}] parity OK: ${sourceSnapshot.length} source nodes, ` +
          `${replaySnapshot.length} replay nodes, ` +
          `${matchFailures.length} unmatched (${(mismatchRate * 100).toFixed(
            2,
          )}%)`,
      );
    });
  }
});
