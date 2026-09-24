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

| Case                                   |  Adds | Baseline inserts | Batched inserts | Baseline apply | Batched apply | Speedup |
| -------------------------------------- | ----: | ---------------: | --------------: | -------------: | ------------: | ------: |
| below threshold                        |    20 |               10 |              10 |          0.2ms |         0.2ms |      1x |
| just below threshold                   |   198 |               99 |              99 |          1.0ms |         0.6ms |   1.67x |
| at threshold                           |   200 |              100 |               1 |          1.5ms |         0.6ms |    2.5x |
| 200 root-only                          |   200 |              200 |               1 |          0.9ms |         0.7ms |   1.29x |
| one large subtree                      |   251 |                1 |               1 |          1.0ms |         0.8ms |   1.25x |
| wide forest                            |   450 |              150 |               1 |          1.4ms |         1.4ms |      1x |
| virtualized rows                       | 3,045 |               21 |               1 |          6.5ms |         4.7ms |   1.38x |
| oversized grid                         | 8,700 |               60 |               1 |         15.7ms |        13.2ms |   1.19x |
| virtualized rows, layout read per node | 3,045 |               21 |               1 |        199.4ms |        14.6ms |   13.7x |
| oversized grid, layout read per node   | 8,700 |               60 |               1 |        735.5ms |        33.1ms |   22.2x |

Below the threshold both arms use the same insertion strategy, so speedup is noise. At and above 200 adds, batched insert count drops to 1 for contiguous root runs.

## Real recording payloads

The synthetic cases above are constructed trees. To check behavior on real data, the 46 incremental events from the 604–609s window of session `679541` (which contains the 3,044-add mutation) were grafted onto a host snapshot and replayed through both arms.

| Arm      | `applyMutation` total |    Largest mutation | Live inserts | Fragment commits | Detached inserts | Nodes |
| -------- | --------------------: | ------------------: | -----------: | ---------------: | ---------------: | ----: |
| baseline |                35.3ms | 12.5ms (3,044 adds) |        6,553 |                0 |               62 | 5,146 |
| batched  |                33.5ms | 12.0ms (3,044 adds) |          619 |                8 |            6,004 | 5,146 |

Resulting DOM is byte-identical between arms.

Batching does what it is designed to do — live insertions drop roughly 10x, and the 21 real roots under parent `659149` collapse into a single fragment commit — but **apply time is unchanged within noise**. That is the honest result on this data.

Two caveats on that measurement: the uploaded events contain no FullSnapshot, so the host DOM and stylesheets are reconstructed rather than real; and nothing in the harness reads layout during apply.

## Where the time actually goes

The harness splits each `applyMutation` into time spent inside DOM insertion calls (measured by patching the replay iframe's `Node.prototype`) and everything else — building elements, setting attributes, masking, mirror bookkeeping. Real 604–609s events, live path:

| Arm      |  total | insertion | build/other | live inserts | fragment commits |
| -------- | -----: | --------: | ----------: | -----------: | ---------------: |
| baseline | 40.3ms |     3.2ms |      37.1ms |        6,550 |                0 |
| batched  | 40.6ms |     0.9ms |      39.7ms |          616 |                8 |

For the 3,044-add mutation on its own: baseline 14.1ms total with 1.5ms in insertion; batched 16.8ms total with 0.4ms in insertion.

**Insertion is about 8% of apply time.** Batching removes most of that 8% — a real reduction, and the DOM-call count drops from 6,550 to 616 — but it cannot move the total, because roughly 92% of the cost is constructing nodes, not attaching them. Identical end-to-end timings between the two arms are the expected result, not a sign the flag failed to engage; check the `live inserts` and `fragments` columns to confirm the arms differ.

This bounds what this optimization can ever be worth on this workload. Making the 8s stall meaningfully shorter requires attacking node construction, reducing how many nodes arrive, or not doing the work synchronously — not reducing insertion count.

## How to read this

Reducing insertion count is not by itself a speedup. Without CSS or forced layout reads, the browser coalesces style and layout until the next frame no matter how many times `insertBefore` is called, so the inert cases and the real-payload run are a wash (roughly 1x–1.3x, within run-to-run noise).

The 13–22x rows are a specific scenario, not a general claim: a plugin reads `offsetHeight` in `onBuild`, so every insertion forces a synchronous reflow. Batching defers those reads until after one fragment commit, which removes the thrash.

So the win depends entirely on whether anything reads layout between insertions during apply. If the embedding player does, batching is a large win; if it does not, expect roughly no change. Before rolling this out, confirm which case the target player is in — a Chrome performance profile showing repeated "Recalculate Style" / "Layout" entries interleaved with insertions during `applyIncremental` is the signal that batching will help.

## Profiling harness

The synthetic tests and incremental-only dumps are not a substitute for the product player. Use the local harness with a **full** session export (Meta + FullSnapshot + incrementals):

```sh
pnpm --filter @amplitude/rrweb profile-replay -- /path/to/session.json
```

Exports that are split into chunks can be passed as several paths or as a
directory, and are merged in the browser:

```sh
pnpm --filter @amplitude/rrweb profile-replay -- /path/to/chunk-1.json /path/to/chunk-2.json
pnpm --filter @amplitude/rrweb profile-replay -- /path/to/session-dir
```

You can also select several files in the picker or drop them on the page. Parts
are ordered by their first timestamp and the merged list is stably sorted, so
chunk filenames do not have to sort correctly. Events repeated across
overlapping chunks are deduped (only against events sharing a timestamp), and
the meta line reports how many were dropped. Each file may be a JSON array, an
`{events}` / `{data.events}` envelope, or newline-delimited JSON. If incremental
events precede the first FullSnapshot, the meta line warns that a leading chunk
is missing.

That serves:

- `http://127.0.0.1:4177/?batch=on` — this PR, threshold 200
- `http://127.0.0.1:4177/?batch=off` — same build, per-node inserts (`Infinity`)

The player patches `applyMutation` with `performance.mark` / `performance.measure` named `rrweb.applyMutation … adds live|seek`, so a Chrome Performance recording of the **parent** page shows each mutation as its own measure. Use **Jump then play live** at ~24s so the stall is applied on the live path (batching is off during seek).

The footer table breaks each mutation into total / insertion / build time plus live insert and fragment counts, and **Log summary** (or `window.__profileReport()`) prints run totals. Compare `insertMs` against `buildMs` before assuming insertion is the bottleneck, and use the insert counts to confirm the two arms really differ.

**Download report JSON** includes:

- every live and synchronous mutation with replay time and input counts
- core phase timings: virtual DOM setup, removes, setup, mirror lookup, node build, insertion, missing-node resolution, fragment flush, `afterAppend`, texts, and attributes
- queue counters: missing parent/next, missing root, resolved/dropped trees, and legacy missing nodes
- the 20 slowest `buildNodeWithSN` calls per mutation (node id/type/tag, attribute count, text length)
- aggregate DOM API timing and counts for node creation and attributes, plus tag/attribute histograms
- FullSnapshot rebuild timing, warnings, long tasks, and worst animation-frame gaps

Optional query flags: `skipInactive=1`, `layoutRead=1` (reads `offsetHeight` in `onBuild`), `t=24`, `speed=1`, `autoload=0`. If no path is passed, drop JSON files on the page, or put a session at `packages/rrweb/temp/session.json` or chunks in `packages/rrweb/temp/session/`.

### Transport

The transport bar has a play/pause toggle, ±5s steps, and a scrubber. The
scrubber seeks on release rather than on every input event, because each seek
replays synchronously from the previous snapshot. `skipInactive` and `speed`
now apply to the running player through `setConfig` instead of only at
construction, so they no longer need a rebuild.

Note that `getCurrentTime()` is relative to `baselineTime`, which is `0` until
the first seek — so on a freshly built player it returns roughly `-Date.now()`.
The harness therefore keeps its own playhead and only trusts `getCurrentTime()`
once the player has a real baseline. Passing that raw value back into `play()`
is what made the old Play button appear to do nothing.

`skipInactive` in this fork jumps the playhead with `playInternal` rather than
fast-forwarding, and never emits `SkipStart`, so the harness infers skips by
comparing replay-time advance against wall-clock advance and briefly shows
`skipped N.Ns idle`.

## Caveats

- Times are median of 5 runs on this VM; they will move with CPU, Chrome version, and whether the machine is busy.
- Synthetic markup is `div` + `span`. Production rows include table cells, classes, and stylesheets.
- `one large subtree` has a single live root even in the baseline, so insert count cannot show a batching win; apply time is still compared.
- Seek / FullSnapshot rebuild is out of scope. Live play is the path that uses fragments. If playback feels slow while scrubbing, this change is not involved: seeking runs through the virtual DOM, where batching is disabled.
- To A/B in a real player, set `liveMutationBatchThreshold: Infinity` to get the original per-node behavior with no other differences.
