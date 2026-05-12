/**
 * Handler for `IncrementalSource.Scroll` events.
 *
 * ## What this handler does
 *
 * A scroll event carries a target node ID (`data.id`) and `x`/`y` offsets.
 *
 * - If `data.id === -1`: the event was recorded on an unserialized node (e.g.
 *   a node that was created programmatically and never assigned a recording-side
 *   ID).  The event is silently discarded.
 *
 * - If `ctx.usingVirtualDom` is true (VirtualDom fast-forward path): the
 *   target is looked up in `ctx.virtualDom.mirror` and its `scrollData`
 *   property is set so that the `diff()` pass applies the scroll when
 *   materializing real nodes.  If the node is missing from the virtual mirror,
 *   `ctx.debugNodeNotFound` is called and the handler returns early.
 *
 * - Otherwise (live playback, or fast-forward without VirtualDom): delegates
 *   to `ctx.applyScroll` which performs the actual `scrollTo` call on the live
 *   DOM node.
 *
 * ## Invariants
 *
 * - Assumes `ctx.mirror` has been populated by `rebuildFullSnapshot` for the
 *   non-virtual path.
 * - When `ctx.usingVirtualDom` is true, `ctx.virtualDom.mirror` must contain
 *   the node for `data.id`.  If it does not, the event is treated as a debug
 *   condition (not a hard error) consistent with the rest of the replayer.
 * - `ctx.applyScroll` handles iframe-document targets as well as ordinary
 *   element targets; this handler does not need to distinguish them.
 * - `isSync` is forwarded to `ctx.applyScroll` so it can choose
 *   `behavior: 'auto'` vs `behavior: 'smooth'` correctly.
 */

import type { scrollData } from '@amplitude/rrweb-types';
import type { RRElement } from '@amplitude/rrdom';
import type { ApplyContext, Handler } from './types';

export const applyScrollHandler: Handler<scrollData> = (
  ctx: ApplyContext,
  data: scrollData,
  isSync: boolean,
): void => {
  // id === -1 means the target was not serialized; nothing to replay.
  if (data.id === -1) {
    return;
  }

  if (ctx.usingVirtualDom) {
    const target = ctx.virtualDom.mirror.getNode(data.id) as RRElement;
    if (!target) {
      ctx.debugNodeNotFound(data, data.id);
      return;
    }
    target.scrollData = data;
    return;
  }

  // Use isSync rather than ctx.usingVirtualDom because not every fast-forward
  // process uses virtual dom optimization.
  ctx.applyScroll(data, isSync);
};
