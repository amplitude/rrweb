/**
 * Handler for `IncrementalSource.ViewportResize` events.
 *
 * ## What this handler does
 *
 * Emits a `ReplayerEvents.Resize` event on the replayer emitter so that the
 * `handleResize` listener (which adjusts the iframe and mouse-tail canvas
 * dimensions) is triggered.
 *
 * ## Invariants
 *
 * - This handler is **stateless**: it performs no reads from or writes to the
 *   mirror, the virtual DOM, or any other replayer state.
 * - `isSync` is intentionally unused; a resize is always applied immediately
 *   regardless of playback mode.
 * - `ctx.emitter` must be the same mitt instance used to construct the
 *   Replayer, so that the `handleResize` listener registered in
 *   `this.emitter.on(ReplayerEvents.Resize, this.handleResize)` fires.
 */

import { ReplayerEvents } from '@amplitude/rrweb-types';
import type { viewportResizeDimension } from '@amplitude/rrweb-types';
import type { ApplyContext, Handler } from './types';

export const applyViewportResize: Handler<viewportResizeDimension> = (
  ctx: ApplyContext,
  data: viewportResizeDimension,
  _isSync: boolean,
): void => {
  ctx.emitter.emit(ReplayerEvents.Resize, {
    width: data.width,
    height: data.height,
  });
};
