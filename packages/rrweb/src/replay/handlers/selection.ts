/**
 * Handler for `IncrementalSource.Selection` events.
 *
 * ## What this handler does
 *
 * During live playback (`isSync === false`): delegates immediately to
 * `ctx.applySelection`, which walks the selection ranges and applies them to
 * the live DOM via the `Selection` / `Range` APIs.
 *
 * During fast-forward (`isSync === true`): stores the data via
 * `ctx.setLastSelectionData` so that only the *final* selection state is
 * applied at the Flush boundary.  This avoids thrashing the DOM with
 * intermediate selection states that would never be visible to the user.
 *
 * ## Invariants
 *
 * - Assumes `ctx.mirror` has been populated by `rebuildFullSnapshot` before
 *   this handler runs.  Nodes referenced by `data.ranges[*].start` and
 *   `data.ranges[*].end` must exist in the mirror (if absent,
 *   `applySelection` silently skips the range).
 * - `ctx.applySelection` catches any DOM exceptions internally; this handler
 *   does not need its own try/catch.
 * - `ctx.setLastSelectionData` is idempotent across multiple calls during a
 *   single fast-forward batch; only the last stored value matters (it is read
 *   and cleared once in the Flush handler).
 */

import type { selectionData } from '@amplitude/rrweb-types';
import type { ApplyContext, Handler } from './types';

export const applySelectionHandler: Handler<selectionData> = (
  ctx: ApplyContext,
  data: selectionData,
  isSync: boolean,
): void => {
  if (isSync) {
    ctx.setLastSelectionData(data);
    return;
  }
  ctx.applySelection(data);
};
