# rrweb Benchmark & Parity Harness

> SR-4160 · Pillar 0 — Safety net for Pillars 1–3 engine work.
>
> **This is a first draft, not merge-ready.**
> See the PR for open questions and deferred items.

---

## What's in here

| File                           | Purpose                                                                    |
| ------------------------------ | -------------------------------------------------------------------------- |
| `fixtures/mutation-heavy.html` | React-style reconciliation loop (1 000 nodes, create → reconcile → remove) |
| `fixtures/scroll-heavy.html`   | Long page (100 000 px), throttled scroll passes                            |
| `recording-metrics.test.ts`    | Per-fixture: workload duration, ms/1k mutations, peak heap, emit p50/p99   |
| `parity.test.ts`               | Record → replay DOM equality assertion                                     |
| `results/`                     | JSON result files written by `recording-metrics.test.ts`                   |
| `dom-mutation.test.ts`         | Pre-existing CPU/tracing benchmark (unchanged)                             |
| `replay-fast-forward.test.ts`  | Pre-existing fast-forward benchmark (unchanged)                            |

---

## How to run

From `packages/rrweb`:

```sh
# Build first (required – tests load dist/rrweb.umd.cjs)
yarn build

# Run all benchmark tests (single-threaded, no parallelism)
yarn benchmark

# Run only the new harnesses
yarn vitest run test/benchmark/recording-metrics.test.ts
yarn vitest run test/benchmark/parity.test.ts
```

Results land in `test/benchmark/results/<fixture-name>.json`.

---

## Metrics captured (`recording-metrics.test.ts`)

| Metric               | Description                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `workloadDurationMs` | Wall-clock time for the entire fixture workload                                           |
| `msPerK`             | `workloadDurationMs / (mutationEvents / 1000)` — main-thread cost per 1 k mutation events |
| `peakHeapBytes`      | Peak `performance.memory.usedJSHeapSize` (Chrome only; 0 elsewhere)                       |
| `emitLatency.p50Ms`  | Median time inside the `emit` callback (measures serialization cost)                      |
| `emitLatency.p99Ms`  | 99th-percentile emit time (highlights worst-case spikes)                                  |

---

## How it would attach to CI

> TODO for a follow-up PR (not wired in here).

Proposed approach:

1. **Master baseline job** — runs `yarn benchmark` on every push to `master`,
   writes result JSONs as GitHub Actions artifacts, and caches them under a
   known artifact name (e.g. `benchmark-baseline-<sha>`).

2. **PR comparison job** — on every PR, downloads the latest master baseline
   artifact, runs the same benchmark against the PR branch, and diffs the
   `msPerK` and `emitLatency.p99Ms` fields.

3. **Gate rule** — fail (or post a warning comment) if any metric regresses by
   more than 10% compared to the baseline.

4. **Parity gate** — `parity.test.ts` already runs in `yarn benchmark`; CI
   failure on any parity mismatch above the 1% threshold blocks the PR.

Example GitHub Actions step (sketch — not authoritative):

```yaml
- name: Download baseline benchmark
  uses: actions/download-artifact@v4
  with:
    name: benchmark-baseline-${{ needs.find-baseline.outputs.sha }}
    path: baseline-results/

- name: Run benchmark
  run: |
    cd packages/rrweb
    yarn build
    yarn benchmark

- name: Compare results
  run: node scripts/compare-benchmarks.js baseline-results/ test/benchmark/results/
```

The comparison script (`scripts/compare-benchmarks.js`) does not exist yet —
it would be added in the CI wiring PR.

---

## Deferred / known gaps

- `canvas-2d.html` and `attribute-churn.html` fixtures — skipped in this draft.
- `recording-metrics.test.ts` does **not** do CPU throttling (unlike `dom-mutation.test.ts`).
  Add a `Emulation.setCPUThrottlingRate` call before the workload for a more
  realistic mobile baseline.
- The parity comparison uses a lenient "source ⊆ replay" match with a 1%
  tolerance. A stricter tree-walk diff (order-sensitive) is deferred.
- happy-dom is available as a devDep but is not used in the current parity
  harness — the Replayer requires a real browser DOM (iframe sandbox).
  A future iteration could use happy-dom for a lightweight unit-level snapshot
  check of the serialized event stream.
