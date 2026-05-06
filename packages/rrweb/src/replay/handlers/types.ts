/**
 * Shared context and handler type for per-source incremental replay handlers.
 *
 * ## Design rationale
 *
 * The `applyIncremental` switch in `replay/index.ts` has grown to ~270 LOC and
 * handles a dozen IncrementalSource variants inline.  Extracting each variant
 * into its own module makes the code easier to read, test, and extend without
 * touching the main replayer class.
 *
 * Each handler is a pure function of the form:
 *
 *   `(ctx: ApplyContext, data: TData, isSync: boolean) => void`
 *
 * The function must be a **pure refactor** of the original inline code: no
 * observable behavior change, no new side-effects.
 *
 * ## Invariants all handlers may rely on
 *
 * - `ctx.mirror` has been populated by `rebuildFullSnapshot` before any
 *   incremental event is applied (i.e. a FullSnapshot always precedes
 *   incremental events).
 * - `ctx.iframe` is the live iframe element mounted in the replayer wrapper.
 *   Its `contentDocument` may be null only during setup; by the time any
 *   IncrementalSnapshot is applied it is non-null.
 * - `isSync` is true during the fast-forward (seek) path; false during live
 *   playback.  Handlers that animate (scroll behavior, etc.) should use
 *   `'auto'` when `isSync` is true and `'smooth'` when false.
 */

import type { Mirror } from '@amplitude/rrweb-snapshot';
import type { Emitter } from '@amplitude/rrweb-types';
import type { scrollData, selectionData } from '@amplitude/rrweb-types';
import type { RRDocument } from '@amplitude/rrdom';

/**
 * Minimal context object passed to every handler.
 *
 * Keep this as small as possible — only add fields that are needed by at least
 * one of the extracted handlers.  Large, god-object contexts defeat the purpose
 * of decomposition.
 */
export type ApplyContext = {
  /** The rrweb node mirror (recording-side IDs → live DOM nodes). */
  mirror: Mirror;

  /** The root iframe element owned by the Replayer. */
  iframe: HTMLIFrameElement;

  /**
   * The mitt-based event emitter.  Handlers should only *emit* events, never
   * subscribe (subscriptions belong in the Replayer constructor).
   */
  emitter: Emitter;

  /**
   * True while the VirtualDom optimisation is active (fast-forward with node
   * mutations).  When true, some handlers write to `virtualDom` instead of the
   * live DOM so that changes can be batched and applied in a single `diff()`.
   */
  usingVirtualDom: boolean;

  /**
   * The virtual DOM document used during fast-forward.  Only valid when
   * `usingVirtualDom` is true.
   */
  virtualDom: RRDocument;

  /**
   * Applies a scroll event to the live DOM.  Provided as a callable so
   * handlers don't need to re-implement or import the logic.
   *
   * This remains a method on the Replayer class because it is also called
   * from the VirtualDom `replayerHandler` passed to `diff()`.
   */
  applyScroll: (d: scrollData, isSync: boolean) => void;

  /**
   * Applies a text-selection event to the live DOM.
   *
   * This remains a method on the Replayer class because it is also invoked
   * from the Flush handler when `lastSelectionData` is drained.
   */
  applySelection: (d: selectionData) => void;

  /**
   * Logs a debug message when a node referenced by id is absent from the
   * mirror.  This is a normal occurrence (DOM events are macrotasks,
   * MutationObserver callbacks are microtasks; a removed node can fire events
   * after its removal mutation is recorded).
   */
  debugNodeNotFound: (d: unknown, id: number) => void;

  /**
   * Stores the most-recent selection data during fast-forward so the correct
   * final state is applied once at the Flush boundary.
   *
   * Handlers write to this via the setter; Replayer reads/clears it in the
   * Flush handler.
   */
  setLastSelectionData: (d: selectionData | null) => void;
};

/**
 * The canonical handler signature.
 *
 * @typeParam TData - The incremental event data type for this source.
 */
export type Handler<TData> = (
  ctx: ApplyContext,
  data: TData,
  isSync: boolean,
) => void;
