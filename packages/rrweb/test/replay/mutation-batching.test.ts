import * as fs from 'fs';
import * as path from 'path';
import type * as puppeteer from 'puppeteer';
import { vi } from 'vitest';
import { launchPuppeteer } from '../utils';

type BatchingCase = {
  name: string;
  roots: number;
  childrenPerRoot: number;
};

type Sample = {
  applyMutationMs: number;
  applyIsSync: boolean;
  liveInsertions: number;
  fragmentInsertions: number;
  elementInsertions: number;
  liveInsertMs: number;
  layoutMs: number;
  addCount: number;
  rootCount: number;
  childCount: number;
  firstIndex: string | null;
  lastIndex: string | null;
  anchorStillLast: boolean;
};

const CASES: BatchingCase[] = [
  { name: 'well below the 200-add threshold', roots: 10, childrenPerRoot: 1 },
  { name: 'just below the 200-add threshold', roots: 99, childrenPerRoot: 1 },
  { name: 'exactly at the 200-add threshold', roots: 100, childrenPerRoot: 1 },
  { name: '200 root-only adds', roots: 200, childrenPerRoot: 0 },
  { name: 'one large subtree', roots: 1, childrenPerRoot: 250 },
  { name: 'above-threshold wide forest', roots: 150, childrenPerRoot: 2 },
  {
    name: 'virtualized-row shaped tree (~145 nodes per row)',
    roots: 21,
    childrenPerRoot: 144,
  },
  { name: 'oversized virtualized grid', roots: 60, childrenPerRoot: 144 },
];

// Replay plugins and player integrations commonly read layout in `onBuild`,
// which turns per-node insertion into repeated forced reflow.
const LAYOUT_SENSITIVE_CASES: BatchingCase[] = [
  { name: 'virtualized rows', roots: 21, childrenPerRoot: 144 },
  { name: 'oversized virtualized grid', roots: 60, childrenPerRoot: 144 },
];

const ITERATIONS = 5;

// Batching only engages at or above the threshold, so the baseline arm raises
// the threshold out of reach to force the original per-node insertion path.
const BATCHED_THRESHOLD = 200;
const UNBATCHED_THRESHOLD = Number.MAX_SAFE_INTEGER;

const comparisons: Array<Record<string, unknown>> = [];

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function domShape(sample: Sample) {
  return {
    addCount: sample.addCount,
    rootCount: sample.rootCount,
    childCount: sample.childCount,
    firstIndex: sample.firstIndex,
    lastIndex: sample.lastIndex,
    anchorStillLast: sample.anchorStillLast,
  };
}

describe('large live mutation batching', () => {
  vi.setConfig({ testTimeout: 120_000 });

  let browser: puppeteer.Browser;
  let page: puppeteer.Page;
  let code: string;

  beforeAll(async () => {
    browser = await launchPuppeteer();
    code = fs.readFileSync(
      path.resolve(__dirname, '../../dist/rrweb.umd.cjs'),
      'utf8',
    );
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('about:blank');
    await page.evaluate(code);
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    console.log(
      `\nLive mutation apply: per-node baseline vs fragment batching (median of ${ITERATIONS} runs)`,
    );
    console.table(comparisons);
    await browser.close();
  });

  const runArm = async (
    roots: number,
    childrenPerRoot: number,
    threshold: number,
    readLayoutOnBuild = false,
  ): Promise<Sample[]> =>
    page.evaluate(
      async (
        rootCount: number,
        childCount: number,
        batchThreshold: number,
        iterations: number,
        readLayout: boolean,
      ) => {
        const rrweb = (
          window as unknown as { rrweb: typeof import('../../src') }
        ).rrweb;
        const originalApplyMutation = (
          rrweb.Replayer.prototype as unknown as {
            applyMutation: (data: unknown, isSync: boolean) => void;
          }
        ).applyMutation;

        const samples = [];

        for (let iteration = 0; iteration < iterations; iteration++) {
          let applyMutationMs = 0;
          let applyIsSync = true;
          (
            rrweb.Replayer.prototype as unknown as {
              applyMutation: (data: unknown, isSync: boolean) => void;
            }
          ).applyMutation = function (data: unknown, isSync: boolean) {
            const start = performance.now();
            const applied = originalApplyMutation.call(this, data, isSync);
            applyMutationMs = performance.now() - start;
            applyIsSync = isSync;
            return applied;
          };

          const startedAt = Date.now();
          const adds: Array<Record<string, unknown>> = [];
          for (let index = 0; index < rootCount; index++) {
            const rootId = 1_000 + index;
            adds.push({
              parentId: 5,
              nextId: index === 0 ? 6 : rootId - 1,
              node: {
                type: 2,
                tagName: 'div',
                attributes: { 'data-index': String(index) },
                childNodes: [],
                id: rootId,
              },
            });
            for (let childIndex = 0; childIndex < childCount; childIndex++) {
              adds.push({
                parentId: rootId,
                nextId: null,
                node: {
                  type: 2,
                  tagName: 'span',
                  attributes: { 'data-child': String(childIndex) },
                  childNodes: [],
                  id: 10_000 + index * 1_000 + childIndex,
                },
              });
            }
          }

          const events = [
            {
              type: 4,
              timestamp: startedAt,
              data: { href: 'about:blank', width: 800, height: 600 },
            },
            {
              type: 2,
              timestamp: startedAt + 1,
              data: {
                node: {
                  type: 0,
                  childNodes: [
                    {
                      type: 2,
                      tagName: 'html',
                      attributes: {},
                      childNodes: [
                        {
                          type: 2,
                          tagName: 'head',
                          attributes: {},
                          childNodes: [],
                          id: 3,
                        },
                        {
                          type: 2,
                          tagName: 'body',
                          attributes: {},
                          childNodes: [
                            {
                              type: 2,
                              tagName: 'div',
                              attributes: { id: 'container' },
                              childNodes: [
                                {
                                  type: 2,
                                  tagName: 'div',
                                  attributes: { id: 'anchor' },
                                  childNodes: [],
                                  id: 6,
                                },
                              ],
                              id: 5,
                            },
                          ],
                          id: 4,
                        },
                      ],
                      id: 2,
                    },
                  ],
                  id: 1,
                },
                initialOffset: { top: 0, left: 0 },
              },
            },
            {
              type: 3,
              timestamp: startedAt + 50,
              data: {
                source: 0,
                texts: [],
                attributes: [],
                removes: [],
                adds,
              },
            },
          ];

          const host = document.createElement('div');
          document.body.appendChild(host);
          const replayer = new rrweb.Replayer(
            events as ConstructorParameters<typeof rrweb.Replayer>[0],
            {
              root: host,
              liveMutationBatchThreshold: batchThreshold,
              plugins: readLayout
                ? [
                    {
                      onBuild: (node: Node) => {
                        // Reading layout between insertions is what makes the
                        // per-node path thrash; batching defers these reads
                        // until after the fragment is committed.
                        void (node as HTMLElement).offsetHeight;
                      },
                    },
                  ]
                : undefined,
            },
          );
          await new Promise((resolve) => setTimeout(resolve, 20));

          const container = replayer.iframe.contentDocument?.querySelector(
            '#container',
          ) as HTMLDivElement;
          if (!container) {
            throw new Error('replay snapshot did not create #container');
          }
          const originalInsertBefore = container.insertBefore.bind(container);
          let liveInsertMs = 0;
          let liveInsertions = 0;
          let fragmentInsertions = 0;
          let elementInsertions = 0;
          container.insertBefore = ((node: Node, child: Node | null) => {
            liveInsertions += 1;
            if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
              fragmentInsertions += 1;
            } else {
              elementInsertions += 1;
            }
            const start = performance.now();
            const inserted = originalInsertBefore(node, child);
            liveInsertMs += performance.now() - start;
            return inserted;
          }) as typeof container.insertBefore;

          await new Promise<void>((resolve, reject) => {
            const timeout = window.setTimeout(() => {
              reject(new Error('timed out waiting for incremental mutation'));
            }, 20_000);
            replayer.on('event-cast', (event) => {
              if (event.type === 3) {
                window.clearTimeout(timeout);
                resolve();
              }
            });
            replayer.play();
          });

          const layoutStart = performance.now();
          container.getBoundingClientRect();
          const layoutMs = performance.now() - layoutStart;

          const liveRoots = Array.from(
            container.querySelectorAll(':scope > [data-index]'),
          );
          samples.push({
            applyMutationMs,
            applyIsSync,
            liveInsertions,
            fragmentInsertions,
            elementInsertions,
            liveInsertMs,
            layoutMs,
            addCount: adds.length,
            rootCount: liveRoots.length,
            childCount: container.querySelectorAll(
              ':scope > [data-index] > span',
            ).length,
            firstIndex: liveRoots[0]?.getAttribute('data-index') ?? null,
            lastIndex: liveRoots.at(-1)?.getAttribute('data-index') ?? null,
            anchorStillLast: container.lastElementChild?.id === 'anchor',
          });

          replayer.pause();
          host.remove();
        }

        (
          rrweb.Replayer.prototype as unknown as {
            applyMutation: typeof originalApplyMutation;
          }
        ).applyMutation = originalApplyMutation;

        return samples;
      },
      roots,
      childrenPerRoot,
      threshold,
      ITERATIONS,
      readLayoutOnBuild,
    );

  it.each(CASES)(
    'compares batched and per-node apply for $name ($roots roots × $childrenPerRoot children)',
    async ({ name, roots, childrenPerRoot }) => {
      const totalAdds = roots * (1 + childrenPerRoot);
      const expectBatched = totalAdds >= BATCHED_THRESHOLD;

      const baseline = await runArm(
        roots,
        childrenPerRoot,
        UNBATCHED_THRESHOLD,
      );
      const batched = await runArm(roots, childrenPerRoot, BATCHED_THRESHOLD);

      const lastBaseline = baseline[baseline.length - 1];
      const lastBatched = batched[batched.length - 1];

      // Both arms must produce the same live DOM; only the insertion strategy differs.
      expect(domShape(lastBatched)).toEqual(domShape(lastBaseline));
      expect(domShape(lastBatched)).toEqual({
        addCount: totalAdds,
        rootCount: roots,
        childCount: roots * childrenPerRoot,
        firstIndex: String(roots - 1),
        lastIndex: '0',
        anchorStillLast: true,
      });

      expect(lastBaseline).toMatchObject({
        applyIsSync: false,
        liveInsertions: roots,
        fragmentInsertions: 0,
        elementInsertions: roots,
      });
      expect(lastBatched).toMatchObject({
        applyIsSync: false,
        liveInsertions: expectBatched ? 1 : roots,
        fragmentInsertions: expectBatched ? 1 : 0,
        elementInsertions: expectBatched ? 0 : roots,
      });

      const baselineApply = median(baseline.map((s) => s.applyMutationMs));
      const batchedApply = median(batched.map((s) => s.applyMutationMs));
      const baselineInsert = median(baseline.map((s) => s.liveInsertMs));
      const batchedInsert = median(batched.map((s) => s.liveInsertMs));

      comparisons.push({
        case: name,
        adds: totalAdds,
        baselineInserts: lastBaseline.liveInsertions,
        batchedInserts: lastBatched.liveInsertions,
        baselineApplyMs: round(baselineApply),
        batchedApplyMs: round(batchedApply),
        applyDeltaMs: round(baselineApply - batchedApply),
        applySpeedup: `${round(baselineApply / batchedApply)}x`,
        baselineInsertMs: round(baselineInsert, 3),
        batchedInsertMs: round(batchedInsert, 3),
        baselineLayoutMs: round(median(baseline.map((s) => s.layoutMs))),
        batchedLayoutMs: round(median(batched.map((s) => s.layoutMs))),
      });

      expect(baselineApply).toBeGreaterThan(0);
      expect(batchedApply).toBeGreaterThan(0);
      if (expectBatched) {
        // Batching may not win on tiny payloads, but it must not regress badly.
        expect(batchedApply).toBeLessThan(baselineApply * 1.5);
      }
    },
  );

  it.each(LAYOUT_SENSITIVE_CASES)(
    'compares layout-sensitive apply for $name ($roots roots × $childrenPerRoot children)',
    async ({ name, roots, childrenPerRoot }) => {
      const totalAdds = roots * (1 + childrenPerRoot);

      const baseline = await runArm(
        roots,
        childrenPerRoot,
        UNBATCHED_THRESHOLD,
        true,
      );
      const batched = await runArm(
        roots,
        childrenPerRoot,
        BATCHED_THRESHOLD,
        true,
      );

      const lastBaseline = baseline[baseline.length - 1];
      const lastBatched = batched[batched.length - 1];

      expect(domShape(lastBatched)).toEqual(domShape(lastBaseline));
      expect(lastBaseline.liveInsertions).toBe(roots);
      expect(lastBatched.liveInsertions).toBe(1);

      const baselineApply = median(baseline.map((s) => s.applyMutationMs));
      const batchedApply = median(batched.map((s) => s.applyMutationMs));

      comparisons.push({
        case: `${name} (layout read per node)`,
        adds: totalAdds,
        baselineInserts: lastBaseline.liveInsertions,
        batchedInserts: lastBatched.liveInsertions,
        baselineApplyMs: round(baselineApply),
        batchedApplyMs: round(batchedApply),
        applyDeltaMs: round(baselineApply - batchedApply),
        applySpeedup: `${round(baselineApply / batchedApply)}x`,
        baselineInsertMs: round(
          median(baseline.map((s) => s.liveInsertMs)),
          3,
        ),
        batchedInsertMs: round(median(batched.map((s) => s.liveInsertMs)), 3),
        baselineLayoutMs: round(median(baseline.map((s) => s.layoutMs))),
        batchedLayoutMs: round(median(batched.map((s) => s.layoutMs))),
      });

      expect(batchedApply).toBeLessThan(baselineApply);
    },
  );
});
