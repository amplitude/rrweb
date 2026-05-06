/**
 * SR-4160 Pillar 0 — Recording Metrics Harness
 *
 * Loads each fixture in Puppeteer, runs the built-in workload while rrweb is
 * recording, and captures:
 *   - main-thread time per 1 000 mutations (ms)
 *   - peak JS heap size (bytes)
 *   - emit latency p50 and p99 (ms, measured around the emit callback)
 *
 * Results are written to test/benchmark/results/<fixture-name>.json so they
 * can be diffed across branches / commits.
 *
 * Run with:
 *   yarn benchmark --reporter=verbose
 *   (or: vitest run test/benchmark/recording-metrics.test.ts)
 */

import type { eventWithTime } from '@amplitude/rrweb-types';
import * as fs from 'fs';
import * as path from 'path';
import { vi } from 'vitest';
import { ISuite, launchPuppeteer, startServer } from '../utils';

// Load the rrweb UMD bundle once at module scope (avoids the dist/main path bug).
const rrwebSource = fs.readFileSync(
  path.resolve(__dirname, '../../dist/rrweb.umd.cjs'),
  'utf8',
);

// ---------------------------------------------------------------------------
// Fixture definitions
// ---------------------------------------------------------------------------

interface FixtureSuite {
  /** Display name used in test titles and result file names */
  name: string;
  /** Filename under test/benchmark/fixtures/ */
  file: string;
  /**
   * JS expression (evaluated in browser context) that starts the workload.
   * Must return a Promise that resolves when all DOM work is complete.
   */
  workload: string;
  /** How many times to repeat the workload for latency statistics. */
  runs: number;
}

const FIXTURES: FixtureSuite[] = [
  {
    name: 'mutation-heavy',
    file: 'mutation-heavy.html',
    workload: 'window.runWorkload(10)',
    runs: 3,
  },
  {
    name: 'scroll-heavy',
    file: 'scroll-heavy.html',
    workload: 'window.runWorkload(3)',
    runs: 3,
  },
];

// ---------------------------------------------------------------------------
// Percentile helper (operates on a sorted numeric array)
// ---------------------------------------------------------------------------

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

interface BenchmarkResult {
  fixture: string;
  runs: number;
  totalEvents: number;
  mutationEvents: number;
  /** Wall-clock duration of the entire workload in ms */
  workloadDurationMs: number;
  /** Main-thread ms per 1 000 mutation events (workloadDurationMs / (mutationEvents / 1000)) */
  msPerK: number;
  peakHeapBytes: number;
  emitLatency: {
    p50Ms: number;
    p99Ms: number;
    samples: number;
  };
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('benchmark: recording metrics', () => {
  vi.setConfig({ testTimeout: 600_000 });

  let page: ISuite['page'];
  let browser: ISuite['browser'];
  let server: ISuite['server'];

  const resultsDir = path.resolve(__dirname, 'results');

  beforeAll(async () => {
    fs.mkdirSync(resultsDir, { recursive: true });
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

  afterEach(async () => {
    if (page && !page.isClosed()) {
      await page.close();
    }
  });

  afterAll(async () => {
    await browser.close();
    server.close();
  });

  for (const fixture of FIXTURES) {
    it(`records and measures: ${fixture.name}`, async () => {
      const fixturePath = path.resolve(__dirname, 'fixtures', fixture.file);
      const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');

      const allResults: BenchmarkResult[] = [];

      for (let run = 0; run < fixture.runs; run++) {
        page = await browser.newPage();
        page.on('console', (msg) =>
          process.stdout.write(
            `[${fixture.name}] ${msg.type().toUpperCase()} ${msg.text()}\n`,
          ),
        );

        // Load fixture HTML.
        await page.goto('about:blank');
        await page.setContent(fixtureHtml, { waitUntil: 'domcontentloaded' });

        // Inject the rrweb bundle via evaluate (avoids the dist/main path bug).
        await page.evaluate(rrwebSource);

        // Run the recording + workload inside the browser context.
        const metrics = (await page.evaluate(async (workloadExpr: string) => {
          const emitLatencies: number[] = [];
          const events: eventWithTime[] = [];
          let mutationCount = 0;
          let peakHeap = 0;

          // Wrap the rrweb emit to measure latency.
          const startTime = performance.now();

          await new Promise<void>((resolve, reject) => {
            const record = (window as any).rrweb.record;

            record({
              emit(event: eventWithTime) {
                const before = performance.now();
                events.push(event);
                // EventType.IncrementalSnapshot = 3
                // IncrementalSource.Mutation = 0
                if (event.type === 3 && (event as any).data?.source === 0) {
                  mutationCount++;
                }
                const after = performance.now();
                emitLatencies.push(after - before);

                // Sample heap if available (Chrome-only).
                if ((performance as any).memory) {
                  const heap = (performance as any).memory.usedJSHeapSize;
                  if (heap > peakHeap) peakHeap = heap;
                }
              },
            });

            // Evaluate the workload expression as a Promise.
            const workloadFn = new Function(
              `return (async () => { return await ${workloadExpr}; })`,
            )();
            workloadFn()
              .then(() => resolve())
              .catch(reject);
          });

          const workloadDurationMs = performance.now() - startTime;

          const sorted = emitLatencies.slice().sort((a, b) => a - b);

          function pct(arr: number[], p: number): number {
            if (arr.length === 0) return 0;
            const idx = Math.ceil((p / 100) * arr.length) - 1;
            return arr[Math.max(0, Math.min(idx, arr.length - 1))];
          }

          return {
            totalEvents: events.length,
            mutationEvents: mutationCount,
            workloadDurationMs,
            peakHeapBytes: peakHeap,
            emitLatencyP50: pct(sorted, 50),
            emitLatencyP99: pct(sorted, 99),
            emitSamples: emitLatencies.length,
          };
        }, fixture.workload)) as {
          totalEvents: number;
          mutationEvents: number;
          workloadDurationMs: number;
          peakHeapBytes: number;
          emitLatencyP50: number;
          emitLatencyP99: number;
          emitSamples: number;
        };

        const msPerK =
          metrics.mutationEvents > 0
            ? metrics.workloadDurationMs / (metrics.mutationEvents / 1000)
            : 0;

        const result: BenchmarkResult = {
          fixture: fixture.name,
          runs: run + 1,
          totalEvents: metrics.totalEvents,
          mutationEvents: metrics.mutationEvents,
          workloadDurationMs:
            Math.round(metrics.workloadDurationMs * 100) / 100,
          msPerK: Math.round(msPerK * 100) / 100,
          peakHeapBytes: metrics.peakHeapBytes,
          emitLatency: {
            p50Ms: Math.round(metrics.emitLatencyP50 * 1000) / 1000,
            p99Ms: Math.round(metrics.emitLatencyP99 * 1000) / 1000,
            samples: metrics.emitSamples,
          },
          timestamp: new Date().toISOString(),
        };

        allResults.push(result);

        console.table([
          {
            fixture: fixture.name,
            run: run + 1,
            'total events': result.totalEvents,
            'mutation events': result.mutationEvents,
            'workload ms': result.workloadDurationMs,
            'ms/1k mutations': result.msPerK,
            'peak heap MB': result.peakHeapBytes
              ? (result.peakHeapBytes / 1_048_576).toFixed(1)
              : 'n/a',
            'emit p50 ms': result.emitLatency.p50Ms,
            'emit p99 ms': result.emitLatency.p99Ms,
          },
        ]);

        await page.close();
      }

      // Write aggregated results to disk.
      const outPath = path.join(resultsDir, `${fixture.name}.json`);
      fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2));
      console.log(`[${fixture.name}] Results written to ${outPath}`);

      // Sanity assertions: the harness must have captured events.
      expect(allResults[0].totalEvents).toBeGreaterThan(0);
    });
  }
});
