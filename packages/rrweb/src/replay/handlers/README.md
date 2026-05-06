# `replay/handlers/`

Per-source incremental-event handlers extracted from `replay/index.ts`.

## Why this directory exists

`replay/index.ts` grew to ~2600 LOC. The largest contributor is the
`applyIncremental` switch statement, which handles a different `IncrementalSource`
variant in each `case` block. Extracting these into individual modules makes
each source easy to read, test, and modify in isolation.

This directory is the result of **Pillar 2** of the rrweb engine overhaul
(Linear SR-4162). The full decomposition is gated on the parity harness from
Pillar 0 (SR-4160); only the simplest, most self-contained handlers have been
extracted so far.

## Handler contract

Every handler must satisfy the following contract:

```ts
export const applyXxx: Handler<TData> = (
  ctx: ApplyContext,
  data: TData,
  isSync: boolean,
): void => { ... };
```

See `types.ts` for the full `ApplyContext` and `Handler<TData>` definitions.

### Rules

1. **Pure refactor** — a handler must produce exactly the same observable
   DOM/emitter side-effects as the inline code it replaced. No behavior
   changes.

2. **Explicit invariants** — every handler file must have a JSDoc block listing
   the invariants it relies on (e.g. "mirror has been populated",
   "usingVirtualDom implies virtualDom.mirror is consistent").

3. **No imports from `../index.ts`** — handlers must not import the `Replayer`
   class itself. Anything they need must be threaded through `ApplyContext`.
   This keeps the dependency graph a DAG and prevents circular imports.

4. **Keep `ApplyContext` minimal** — only add a field to `ApplyContext` if it
   is required by at least one handler. Large context objects defeat the
   purpose of decomposition.

5. **Private methods stay on `Replayer`** — methods like `applyScroll` and
   `applySelection` that are also called from other parts of the class (e.g.
   the VirtualDom `replayerHandler` and the `Flush` handler) remain as private
   methods. Handlers call them through the context object.

## Extracted handlers

| File           | IncrementalSource | Notes                                                                                          |
| -------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| `viewport.ts`  | `ViewportResize`  | Stateless — just emits a Resize event.                                                         |
| `selection.ts` | `Selection`       | Defers to `applySelection`; in sync mode stores to `lastSelectionData` for the Flush boundary. |
| `scroll.ts`    | `Scroll`          | VirtualDom-aware; delegates to `applyScroll` for the live-DOM path.                            |

## Intentionally deferred handlers

The following sources were **not** extracted in this PR. Each is blocked on
its own precondition:

- **`Mutation`** — largest and most coupled handler in the file (~500 LOC).
  Extraction is gated on the parity harness from Pillar 0 (SR-4160) so that
  behavior equivalence can be verified automatically.
- **`CanvasMutation`** — async deserialization pipeline; needs dedicated
  testing before it can be safely moved.
- **`StyleSheetRule` / `StyleDeclaration` / `AdoptedStyleSheet`** — touch the
  CSSOM; require careful cross-browser testing.
- **`Input`** — couples form-state to the virtual DOM; best extracted together
  with `Mutation`.
- **`MediaInteraction`** — delegates entirely to `MediaManager`; extract as
  part of the `MediaManager` refactor.

## Adding a new handler

1. Create `handlers/<source-name>.ts`.
2. Export an `applyXxx: Handler<TXxxData>` function.
3. Add any new fields required by your handler to `ApplyContext` in `types.ts`
   with a JSDoc comment explaining the field's contract.
4. In `replay/index.ts`:
   - Import the new handler.
   - Build/update the `applyContext` object passed to all handlers.
   - Replace the relevant `switch` case body with a call to the handler.
5. Run `yarn build && yarn retest` from `packages/rrweb` and verify all tests
   still pass.
