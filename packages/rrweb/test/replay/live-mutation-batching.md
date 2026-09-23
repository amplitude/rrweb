# Live mutation batching comparison

Fragment-batch large live incremental `adds` versus the original per-node insertion path. Measured in headless Chrome from `packages/rrweb/test/replay/mutation-batching.test.ts`.

## What changed

Eligible live mutations (`adds.length >= 200`, not virtual DOM, not documents / iframes / shadow roots / legacy `-1` siblings) stage new root subtrees in a `DocumentFragment` and commit each contiguous root run with a single `insertBefore` into the connected replay iframe.

`playerConfig.liveMutationBatchThreshold` defaults to `200`. Set it to `Infinity` to restore per-node inserts.

This only covers live incremental `adds`. It does not change recording payloads, FullSnapshot rebuilds, seek cache, or timer yielding.

## Method

Each case replays the **same mutation payload twice**:

1. **Baseline** — `liveMutationBatchThreshold: Number.MAX_SAFE_INTEGER`, so every root is inserted live.
2. **Batched** — `liveMutationBatchThreshold: 200`.

Both arms must produce the same live DOM (root count, child count, sibling order, anchor still last) before timings are compared.

Metrics (median of 5 runs):

- `applyMutation` wall time on the live path (`isSync === false`)
- live-parent `insertBefore` count and duration
- forced layout after apply (`getBoundingClientRect`)

Two workload families:

- **Inert nodes** — bare `div` / `span` trees. Chrome can coalesce style and layout until the next frame.
- **Layout-sensitive** — a replay plugin reads `offsetHeight` in `onBuild`, which is what player integrations commonly do. The per-node path then forces a reflow between insertions; the batched path defers those reads until after the fragment is committed.

Command:

```sh
PUPPETEER_HEADLESS=true pnpm --filter @amplitude/rrweb exec vitest run test/replay/mutation-batching.test.ts
```

## Results

Median of 5 runs, headless Chrome (this environment, 2026-09-23).

| Case | Adds | Baseline inserts | Batched inserts | Baseline apply | Batched apply | Speedup |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| below threshold | 20 | 10 | 10 | 0.2ms | 0.2ms | 1x |
| just below threshold | 198 | 99 | 99 | 1.0ms | 0.6ms | 1.67x |
| at threshold | 200 | 100 | 1 | 1.5ms | 0.6ms | 2.5x |
| 200 root-only | 200 | 200 | 1 | 0.9ms | 0.7ms | 1.29x |
| one large subtree | 251 | 1 | 1 | 1.0ms | 0.8ms | 1.25x |
| wide forest | 450 | 150 | 1 | 1.4ms | 1.4ms | 1x |
| virtualized rows | 3,045 | 21 | 1 | 6.5ms | 4.7ms | 1.38x |
| oversized grid | 8,700 | 60 | 1 | 15.7ms | 13.2ms | 1.19x |
| virtualized rows, layout read per node | 3,045 | 21 | 1 | 199.4ms | 14.6ms | 13.7x |
| oversized grid, layout read per node | 8,700 | 60 | 1 | 735.5ms | 33.1ms | 22.2x |

Below the threshold both arms use the same insertion strategy, so speedup is noise. At and above 200 adds, batched insert count drops to 1 for contiguous root runs.

## How to read this

On inert synthetic nodes the win is small (about 1.2–1.4x on the large trees). That is a floor, not a prediction of production cost: these nodes have no CSS, no table layout, and nothing reads geometry during apply, so the browser coalesces work regardless of how many times `insertBefore` is called.

The last two rows are the relevant comparison. Reading layout in `onBuild` turns the per-node path into repeated forced reflow. Batching keeps those reads off the live tree until one fragment commit, which is a 13–22x reduction on these payloads.

That profile matches the production Session Replay trace: an ~8s `applyIncremental` on a mutation with 3,044 adds (21 virtualized table rows, ~145 nodes per row). The synthetic 3,045-add “virtualized rows” case uses the same shape (21 × 144) but not the same CSS or plugins, so it cannot reproduce the 8s number. It does show that the cost that batching removes is live-tree layout work, not node construction.

## Caveats

- Times are median of 5 runs on this VM; they will move with CPU, Chrome version, and whether the machine is busy.
- Synthetic markup is `div` + `span`. Production rows include table cells, classes, and stylesheets.
- `one large subtree` has a single live root even in the baseline, so insert count cannot show a batching win; apply time is still compared.
- Seek / FullSnapshot rebuild is out of scope. Live play is the path that uses fragments.
