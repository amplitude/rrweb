/**
 * @vitest-environment jsdom
 *
 * Integration tests for the opt-in `freezeTransitions` replayer option.
 *
 * Fixture: two `position: absolute; width: 100%` sibling nodes whose inline
 * `style` crossfades `opacity` across several incremental mutations — the exact
 * shape that produces stacked, mid-crossfade text in replay. With
 * `freezeTransitions: true` the replayer must inject a stylesheet into the
 * replay iframe that zeroes out `transition-duration`, suppressing the artifact.
 * With the option off (default) no such rule is injected.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { EventType, IncrementalSource } from '@amplitude/rrweb-types';
import type { eventWithTime } from '@amplitude/rrweb-types';
import { Replayer } from '../../src/replay';

const T0 = 1_000_000;

// ids: document=1, html=2, head=3, body=4, slideA=5, slideB=6
const SLIDE_A_ID = 5;
const SLIDE_B_ID = 6;

function absoluteSlide(id: number, opacity: number) {
  return {
    type: 2, // Element
    tagName: 'div',
    attributes: {
      style: `position: absolute; width: 100%; opacity: ${opacity}; transition: opacity 0.3s ease;`,
    },
    childNodes: [
      {
        type: 3, // Text
        textContent: id === SLIDE_A_ID ? 'Slide A' : 'Slide B',
        id: id + 100,
      },
    ],
    id,
  };
}

function makeEvents(): eventWithTime[] {
  const events: eventWithTime[] = [
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
          type: 0,
          childNodes: [
            {
              type: 2,
              tagName: 'html',
              attributes: {},
              childNodes: [
                {
                  type: 2,
                  tagName: 'head',
                  attributes: {},
                  childNodes: [],
                  id: 3,
                },
                {
                  type: 2,
                  tagName: 'body',
                  attributes: {},
                  childNodes: [
                    absoluteSlide(SLIDE_A_ID, 1),
                    absoluteSlide(SLIDE_B_ID, 0),
                  ],
                  id: 4,
                },
              ],
              id: 2,
            },
          ],
          id: 1,
        },
        initialOffset: { top: 0, left: 0 },
      },
      timestamp: T0,
    },
  ];

  // Crossfade A→B over several per-frame inline-style mutations.
  for (let i = 1; i <= 5; i++) {
    const t = i / 5; // 0.2 .. 1.0
    events.push({
      type: EventType.IncrementalSnapshot,
      data: {
        source: IncrementalSource.Mutation,
        texts: [],
        attributes: [
          {
            id: SLIDE_A_ID,
            attributes: {
              style: `position: absolute; width: 100%; opacity: ${
                1 - t
              }; transition: opacity 0.3s ease;`,
            },
          },
          {
            id: SLIDE_B_ID,
            attributes: {
              style: `position: absolute; width: 100%; opacity: ${t}; transition: opacity 0.3s ease;`,
            },
          },
        ],
        removes: [],
        adds: [],
      },
      timestamp: T0 + i * 60,
    } as eventWithTime);
  }

  return events;
}

function makeReplayer(opts: Record<string, unknown> = {}) {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const replayer = new Replayer(makeEvents(), {
    root,
    showWarning: false,
    showDebug: false,
    // Force the real-DOM rebuild path so insertStyleRules materializes a
    // <style> element in the iframe (the virtual-dom path keeps rules in an
    // in-memory tree that isn't synchronously diffed here).
    useVirtualDom: false,
    logger: { log: () => {}, warn: () => {} },
    ...opts,
  });
  return replayer;
}

// Collect the CSS text injected into every <style> element of the replay iframe,
// reading both `textContent` and any CSSOM rules (the non-virtual path uses
// `sheet.insertRule`, which leaves `textContent` empty).
function injectedIframeCss(replayer: Replayer): string {
  const doc = replayer.iframe.contentDocument!;
  let css = '';
  doc.querySelectorAll('style').forEach((styleEl) => {
    css += styleEl.textContent ?? '';
    const sheet = styleEl.sheet;
    if (sheet) {
      for (let i = 0; i < sheet.cssRules.length; i++) {
        css += sheet.cssRules[i].cssText;
      }
    }
  });
  return css;
}

describe('Replayer freezeTransitions option', () => {
  vi.useFakeTimers();

  afterEach(() => {
    vi.clearAllTimers();
    document.body.innerHTML = '';
  });

  it('injects a transition-disabling rule when freezeTransitions is true', async () => {
    const replayer = makeReplayer({ freezeTransitions: true });
    // Let the mount-time poster rebuild fire (setTimeout(…, 1)), which runs
    // insertStyleRules and materializes the injected <style> in the iframe.
    await vi.runAllTimersAsync();

    const css = injectedIframeCss(replayer);
    expect(css).toContain('transition-duration: 0s');
    expect(css).toContain('transition-delay: 0s');
  });

  it('does not inject a transition-disabling rule by default', async () => {
    const replayer = makeReplayer();
    await vi.runAllTimersAsync();

    const css = injectedIframeCss(replayer);
    expect(css).not.toContain('transition-duration: 0s');
  });
});
