/**
 * @vitest-environment jsdom
 *
 * The skipInactive lookahead runs on every incremental event during real-time
 * playback. It used to walk the whole event list from index 0 each time, which
 * made playing a long recording O(N^2) and froze the tab with nothing logged.
 * These tests pin both the behaviour and the scaling.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { EventType, IncrementalSource, NodeType } from '@amplitude/rrweb-types';
import type { eventWithTime } from '@amplitude/rrweb-types';
import { Replayer } from '../../src/replay';

const T0 = 1_000_000;

function baseEvents(): eventWithTime[] {
  return [
    { type: EventType.DomContentLoaded, data: {}, timestamp: T0 },
    { type: EventType.Load, data: {}, timestamp: T0 },
    {
      type: EventType.Meta,
      data: { href: 'http://localhost', width: 800, height: 600 },
      timestamp: T0,
    },
    {
      type: EventType.FullSnapshot,
      data: {
        node: {
          type: NodeType.Document,
          childNodes: [
            {
              type: NodeType.Element,
              tagName: 'html',
              attributes: {},
              childNodes: [
                {
                  type: NodeType.Element,
                  tagName: 'head',
                  attributes: {},
                  childNodes: [],
                  id: 4,
                },
                {
                  type: NodeType.Element,
                  tagName: 'body',
                  attributes: {},
                  childNodes: [],
                  id: 5,
                },
              ],
              id: 3,
            },
          ],
          id: 1,
        },
        initialOffset: { top: 0, left: 0 },
      },
      timestamp: T0,
    },
  ];
}

function mutationEvent(offset: number): eventWithTime {
  return {
    type: EventType.IncrementalSnapshot,
    timestamp: T0 + offset,
    delay: offset,
    data: {
      source: IncrementalSource.Mutation,
      texts: [],
      attributes: [],
      removes: [],
      adds: [],
    },
  } as eventWithTime;
}

function interactionEvent(offset: number): eventWithTime {
  return {
    type: EventType.IncrementalSnapshot,
    timestamp: T0 + offset,
    delay: offset,
    data: {
      source: IncrementalSource.MouseInteraction,
      type: 1,
      id: 5,
      x: 0,
      y: 0,
    },
  } as eventWithTime;
}

function makeReplayer(events: eventWithTime[], opts: Record<string, unknown>) {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const replayer = new Replayer(events, {
    root,
    showWarning: false,
    showDebug: false,
    logger: { log: () => {}, warn: () => {} },
    ...opts,
  });
  const iframeWindow = replayer.iframe.contentWindow as Window | null;
  if (iframeWindow) {
    iframeWindow.scrollTo = () => {};
  }
  return replayer;
}

/** Drive an event exactly as the playback timer would (isSync = false). */
function castLive(replayer: Replayer, event: eventWithTime) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (replayer as any).getCastFn(event, false)();
}

describe('skipInactive lookahead', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('still skips ahead to a user interaction past a long inactive gap', () => {
    const start = mutationEvent(100);
    const events = [...baseEvents(), start, interactionEvent(120_000)];
    const replayer = makeReplayer(events, {
      skipInactive: true,
      inactivePeriodThreshold: 5_000,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jump = vi.spyOn(replayer as any, 'playInternal');
    castLive(replayer, start);

    expect(jump).toHaveBeenCalledTimes(1);
  });

  it('does not skip when the next interaction is within the threshold', () => {
    const start = mutationEvent(100);
    const events = [...baseEvents(), start, interactionEvent(200)];
    const replayer = makeReplayer(events, {
      skipInactive: true,
      inactivePeriodThreshold: 5_000,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jump = vi.spyOn(replayer as any, 'playInternal');
    castLive(replayer, start);

    expect(jump).not.toHaveBeenCalled();
  });

  it('re-examines the tail after new events arrive', () => {
    const start = mutationEvent(100);
    const events = [...baseEvents(), start];
    const replayer = makeReplayer(events, {
      skipInactive: true,
      inactivePeriodThreshold: 5_000,
    });

    // No interaction exists yet, so the lookahead gives up and latches.
    castLive(replayer, start);

    // A late-arriving interaction must clear that latch.
    replayer.addEvent(interactionEvent(120_000));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((replayer as any).noFurtherUserInteraction).toBe(false);
  });

  it('scales linearly with event count during playback', () => {
    // Worst case: every event is a cheap mutation, so the lookahead never
    // finds an interaction and previously scanned the full list every time.
    const n = 32_000;
    const events = [...baseEvents()];
    for (let i = 0; i < n; i++) {
      events.push(mutationEvent(100 + i));
    }
    const replayer = makeReplayer(events, {
      skipInactive: true,
      inactivePeriodThreshold: 5_000,
    });

    const incrementals = events.filter(
      (e) => e.type === EventType.IncrementalSnapshot,
    );
    const started = performance.now();
    for (const e of incrementals) {
      castLive(replayer, e);
    }
    const elapsed = performance.now() - started;

    // Measured ~9900ms before the fix and ~30ms after, on the same machine.
    // The bound leaves ~100x headroom for slower CI hardware while still
    // failing loudly if the quadratic scan comes back.
    expect(elapsed).toBeLessThan(3_000);
  });
});
