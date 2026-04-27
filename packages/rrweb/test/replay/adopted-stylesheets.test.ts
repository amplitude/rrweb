/**
 * @vitest-environment jsdom
 *
 * Unit tests for cross-document CSSStyleSheet cloning in adoptStyleSheets (SR-2960).
 *
 * The fix guards against the browser restriction that a CSSStyleSheet instance
 * created in one document cannot be directly adopted into another document. When
 * the target window's CSSStyleSheet constructor differs from the sheet's
 * constructor, the replay engine clones the sheet before adopting it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventType, IncrementalSource } from '@amplitude/rrweb-types';
import type { eventWithTime } from '@amplitude/rrweb-types';

import { Replayer } from '../../src/replay';

// ---------------------------------------------------------------------------
// Minimal event fixture
// ---------------------------------------------------------------------------

const T0 = 1_000_000;

function makeMinimalEvents(): eventWithTime[] {
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
          type: 0, // Document
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
                  childNodes: [],
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
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReplayer(): { replayer: Replayer; root: HTMLElement } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const replayer = new Replayer(makeMinimalEvents(), {
    root,
    showWarning: false,
    showDebug: false,
    logger: { log: () => {}, warn: () => {} },
  });
  // Process the FullSnapshot event synchronously so mirror.getNode(1) is
  // populated before tests run.  pause(1) sets baselineTime = T0+1, which
  // places all T0-timestamped events into the sync batch, populating the mirror.
  replayer.pause(1);
  return { replayer, root };
}

/** Create a fake "foreign" CSSStyleSheet whose constructor !== window.CSSStyleSheet */
function makeForeignSheet(cssRules: string[] = []): CSSStyleSheet {
  const sheet = Object.create(CSSStyleSheet.prototype) as CSSStyleSheet;
  class ForeignCSSStyleSheet {}
  Object.defineProperty(sheet, 'constructor', {
    value: ForeignCSSStyleSheet,
    configurable: true,
  });
  Object.defineProperty(sheet, 'cssRules', {
    value: cssRules.map((cssText) => ({ cssText })),
    configurable: true,
  });
  return sheet;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('adoptStyleSheets — cross-document CSSStyleSheet cloning (SR-2960)', () => {
  let replayer: Replayer;
  let root: HTMLElement;

  beforeEach(() => {
    ({ replayer, root } = makeReplayer());
  });

  afterEach(() => {
    root.remove();
  });

  it('uses a same-window sheet as-is without cloning', () => {
    // A sheet whose constructor matches the target window's CSSStyleSheet
    const sheet = new window.CSSStyleSheet();
    sheet.insertRule('div { color: red; }');

    const styleMirror = (replayer as any).styleMirror;
    styleMirror.add(sheet, 100);

    const mirror = (replayer as any).mirror;
    const docNode = mirror.getNode(1) as Document | null;
    expect(docNode).not.toBeNull();
    if (!docNode) return;

    (replayer as any).applyAdoptedStyleSheet({
      id: 1,
      styleIds: [100],
      styles: [],
    });

    // The same instance should be used — no unnecessary clone
    expect(docNode.adoptedStyleSheets?.[0]).toBe(sheet);
  });

  it('clones a cross-window sheet before adopting it', () => {
    const foreignSheet = makeForeignSheet(['div { color: blue; }']);

    const styleMirror = (replayer as any).styleMirror;
    styleMirror.add(foreignSheet, 101);

    const mirror = (replayer as any).mirror;
    const docNode = mirror.getNode(1) as Document | null;
    expect(docNode).not.toBeNull();
    if (!docNode) return;

    (replayer as any).applyAdoptedStyleSheet({
      id: 1,
      styleIds: [101],
      styles: [],
    });

    const adopted = docNode.adoptedStyleSheets?.[0];
    // A clone should have been made — different instance
    expect(adopted).not.toBe(foreignSheet);
    // The clone should be a real CSSStyleSheet (same-window constructor)
    expect(adopted).toBeInstanceOf(window.CSSStyleSheet);
    // The CSS rules must have been copied into the clone
    expect(adopted?.cssRules[0]?.cssText).toContain('color: blue');
  });

  it('falls back to the original sheet when cloning fails', () => {
    // cssRules getter throws to simulate a cross-origin restriction
    const brokenSheet = Object.create(CSSStyleSheet.prototype) as CSSStyleSheet;
    class ForeignCSSStyleSheet {}
    Object.defineProperty(brokenSheet, 'constructor', {
      value: ForeignCSSStyleSheet,
      configurable: true,
    });
    Object.defineProperty(brokenSheet, 'cssRules', {
      get: () => {
        throw new Error('Cannot access cross-origin cssRules');
      },
      configurable: true,
    });

    const styleMirror = (replayer as any).styleMirror;
    styleMirror.add(brokenSheet, 102);

    const mirror = (replayer as any).mirror;
    const docNode = mirror.getNode(1) as Document | null;
    expect(docNode).not.toBeNull();
    if (!docNode) return;

    // Should not throw even when cloning fails
    expect(() => {
      (replayer as any).applyAdoptedStyleSheet({
        id: 1,
        styleIds: [102],
        styles: [],
      });
    }).not.toThrow();

    // Falls back gracefully — original sheet is adopted
    expect(docNode.adoptedStyleSheets?.[0]).toBe(brokenSheet);
  });

  it('calls warn() and does not throw when adoptedStyleSheets assignment is blocked', () => {
    const sheet = new window.CSSStyleSheet();

    const styleMirror = (replayer as any).styleMirror;
    styleMirror.add(sheet, 103);

    const mirror = (replayer as any).mirror;
    const docNode = mirror.getNode(1) as Document | null;
    expect(docNode).not.toBeNull();
    if (!docNode) return;

    // Override adoptedStyleSheets setter on this node to throw
    Object.defineProperty(docNode, 'adoptedStyleSheets', {
      set: () => {
        throw new Error('cross-origin blocked');
      },
      configurable: true,
    });

    const warnSpy = vi.spyOn(replayer as any, 'warn');

    expect(() => {
      (replayer as any).applyAdoptedStyleSheet({
        id: 1,
        styleIds: [103],
        styles: [],
      });
    }).not.toThrow();

    expect(warnSpy).toHaveBeenCalledWith(
      'adoptedStyleSheets assignment failed',
      expect.any(Error),
    );
  });

  it('applies an adopted stylesheet to a shadow host', () => {
    const sheet = new window.CSSStyleSheet();
    sheet.insertRule('p { color: green; }');

    const styleMirror = (replayer as any).styleMirror;
    styleMirror.add(sheet, 200);

    // Create a host element with a shadow root and register it in the mirror
    const host = document.createElement('div');
    host.attachShadow({ mode: 'open' });
    document.body.appendChild(host);

    const mirror = (replayer as any).mirror;
    // Use a node id that won't collide with the snapshot ids (1–4)
    const shadowHostId = 999;
    mirror.add(host, {
      id: shadowHostId,
      type: 2,
      tagName: 'div',
      attributes: {},
      childNodes: [],
    });

    (replayer as any).applyAdoptedStyleSheet({
      id: shadowHostId,
      styleIds: [200],
      styles: [],
    });

    expect(host.shadowRoot!.adoptedStyleSheets).toHaveLength(1);
    expect(host.shadowRoot!.adoptedStyleSheets[0]).toBe(sheet);

    // Cleanup
    host.remove();
  });
});
