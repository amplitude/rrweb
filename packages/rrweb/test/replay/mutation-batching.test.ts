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

type MutationMetrics = {
  name: string;
  addCount: number;
  batched: boolean;
  liveInsertions: number;
  fragmentInsertions: number;
  elementInsertions: number;
  minApplyMs: number;
  medianApplyMs: number;
  maxApplyMs: number;
  minLiveInsertMs: number;
  medianLiveInsertMs: number;
  maxLiveInsertMs: number;
  medianUsPerAdd: number;
  medianLayoutMs: number;
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
];

const ITERATIONS = 3;
const collectedMetrics: MutationMetrics[] = [];

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function round(value: number, digits = 3): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

describe('large live mutation batching', () => {
  vi.setConfig({ testTimeout: 60_000 });

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
    console.log('\nLive mutation batching performance');
    console.table(
      collectedMetrics.map((row) => ({
        name: row.name,
        adds: row.addCount,
        batched: row.batched,
        liveInserts: row.liveInsertions,
        fragments: row.fragmentInsertions,
        minApplyMs: row.minApplyMs,
        medianApplyMs: row.medianApplyMs,
        maxApplyMs: row.maxApplyMs,
        medianInsertMs: row.medianLiveInsertMs,
        medianUsPerAdd: row.medianUsPerAdd,
        medianLayoutMs: row.medianLayoutMs,
      })),
    );
    await browser.close();
  });

  it.each(CASES)(
    'applies $name ($roots roots × $childrenPerRoot children)',
    async ({ name, roots, childrenPerRoot }) => {
      const totalAdds = roots * (1 + childrenPerRoot);
      const expectBatched = totalAdds >= 200;
      const result = await page.evaluate(
        async (
          rootCount: number,
          childCount: number,
          iterations: number,
        ) => {
          const rrweb = (
            window as unknown as { rrweb: typeof import('../../src') }
          ).rrweb;
          const originalApplyMutation = (
            rrweb.Replayer.prototype as unknown as {
              applyMutation: (data: unknown, isSync: boolean) => void;
            }
          ).applyMutation;

          const samples: Array<{
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
          }> = [];

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
              for (
                let childIndex = 0;
                childIndex < childCount;
                childIndex++
              ) {
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
              },
            );

            const container = replayer.iframe.contentDocument?.querySelector(
              '#container',
            ) as HTMLDivElement;
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
              }, 5_000);
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
        ITERATIONS,
      );

      const last = result[result.length - 1];
      expect(last).toMatchObject({
        addCount: totalAdds,
        applyIsSync: false,
        liveInsertions: expectBatched ? 1 : roots,
        fragmentInsertions: expectBatched ? 1 : 0,
        elementInsertions: expectBatched ? 0 : roots,
        rootCount: roots,
        childCount: roots * childrenPerRoot,
        firstIndex: String(roots - 1),
        lastIndex: '0',
        anchorStillLast: true,
      });

      const applySamples = result.map((sample) => sample.applyMutationMs);
      const insertSamples = result.map((sample) => sample.liveInsertMs);
      const layoutSamples = result.map((sample) => sample.layoutMs);
      const metrics: MutationMetrics = {
        name,
        addCount: totalAdds,
        batched: expectBatched,
        liveInsertions: last.liveInsertions,
        fragmentInsertions: last.fragmentInsertions,
        elementInsertions: last.elementInsertions,
        minApplyMs: round(Math.min(...applySamples)),
        medianApplyMs: round(median(applySamples)),
        maxApplyMs: round(Math.max(...applySamples)),
        minLiveInsertMs: round(Math.min(...insertSamples)),
        medianLiveInsertMs: round(median(insertSamples)),
        maxLiveInsertMs: round(Math.max(...insertSamples)),
        medianUsPerAdd: round((median(applySamples) / totalAdds) * 1_000, 1),
        medianLayoutMs: round(median(layoutSamples)),
      };
      collectedMetrics.push(metrics);

      expect(median(applySamples)).toBeGreaterThan(0);
      expect(median(applySamples)).toBeLessThan(5_000);
    },
  );
});
