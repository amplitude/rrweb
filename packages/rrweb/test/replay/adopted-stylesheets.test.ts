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
import { EventType } from '@amplitude/rrweb-types';
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
  // populated before tests run.  pause(1) seeks to timeOffset=1ms (i.e.
  // T0+1ms absolute), which places all T0-timestamped events in the sync
  // batch, populating the mirror.
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
    // Construct the sheet from the replayer's iframe window — the same
    // targetWindow that the replay engine will use for the constructor check.
    // (In real browsers, the outer window and an iframe window have different
    // CSSStyleSheet constructors; jsdom shares them as a quirk, so using the
    // iframe window here makes the intent explicit and avoids relying on that
    // jsdom quirk.)
    const iframeWindow = (replayer as any).iframe.contentWindow as Window &
      typeof globalThis;
    const sheet = new iframeWindow.CSSStyleSheet();
    sheet.insertRule('div { color: red; }');

    const styleMirror = (replayer as any).styleMirror;
    styleMirror.add(sheet, 100);

    const mirror = (replayer as any).mirror;
    const docNode = mirror.getNode(1) as Document | null;
    expect(docNode).not.toBeNull();
    if (!docNode) return;

    // accessing private method for testing
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

    // accessing private method for testing
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

  it('falls back to the original sheet when inner cloning fails (cssRules throws)', () => {
    // cssRules getter throws to simulate a cross-origin restriction that
    // prevents copying rules. The clone attempt throws internally, so the
    // fallback returns the original sheet. jsdom allows adoption of the
    // fallback sheet, so the outer assignment does NOT throw and warn is
    // not called.
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

    const warnSpy = vi.spyOn(replayer as any, 'warn');

    // Should not throw even when cloning fails
    expect(() => {
      // accessing private method for testing
      (replayer as any).applyAdoptedStyleSheet({
        id: 1,
        styleIds: [102],
        styles: [],
      });
    }).not.toThrow();

    // Inner clone failed → fallback sheet used → jsdom adoption succeeded →
    // warn should NOT have been called.
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('calls warn() when clone succeeds but adoptedStyleSheets assignment throws', () => {
    // Clone succeeds (cssRules is accessible) but the assignment setter throws,
    // simulating a browser cross-document rejection at the adoption step.
    const foreignSheet = makeForeignSheet(['div { color: red; }']);

    const styleMirror = (replayer as any).styleMirror;
    styleMirror.add(foreignSheet, 104);

    const mirror = (replayer as any).mirror;
    const docNode = mirror.getNode(1) as Document | null;
    expect(docNode).not.toBeNull();
    if (!docNode) return;

    // Override the adoptedStyleSheets setter to throw after cloning succeeds.
    Object.defineProperty(docNode, 'adoptedStyleSheets', {
      set: () => {
        throw new Error('cross-document assignment blocked');
      },
      configurable: true,
    });

    const warnSpy = vi.spyOn(replayer as any, 'warn');

    expect(() => {
      (replayer as any).applyAdoptedStyleSheet({
        id: 1,
        styleIds: [104],
        styles: [],
      });
    }).not.toThrow();

    // The outer try/catch must have caught the setter error and warned.
    expect(warnSpy).toHaveBeenCalledWith(
      'adoptedStyleSheets assignment failed',
      expect.any(Error),
    );
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
      // accessing private method for testing
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

  it('uses insertRule fallback when replaceSync is unavailable on the cloned sheet', () => {
    // The replay engine uses the iframe's window (targetWindow) to construct
    // the clone, not the test's outer window. In jsdom, these are separate
    // window objects, so we must replace CSSStyleSheet on the iframe window.
    const iframeWindow = (replayer as any).iframe.contentWindow as Window &
      typeof globalThis;
    const OriginalCSSStyleSheet = iframeWindow.CSSStyleSheet;
    const insertRuleSpy = vi.fn();

    // Build a subclass whose instances have replaceSync set to undefined,
    // forcing the `typeof clone.replaceSync === 'function'` check to fail
    // and driving execution into the insertRule fallback branch.
    class FakeCSSStyleSheet extends OriginalCSSStyleSheet {
      declare replaceSync: undefined;
      insertRule = insertRuleSpy;
    }
    Object.defineProperty(FakeCSSStyleSheet.prototype, 'replaceSync', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    Object.defineProperty(iframeWindow, 'CSSStyleSheet', {
      value: FakeCSSStyleSheet,
      configurable: true,
      writable: true,
    });

    try {
      const foreignSheet = makeForeignSheet(['p { color: purple; }']);
      const styleMirror = (replayer as any).styleMirror;
      styleMirror.add(foreignSheet, 105);

      expect(() => {
        (replayer as any).applyAdoptedStyleSheet({
          id: 1,
          styleIds: [105],
          styles: [],
        });
      }).not.toThrow();

      // insertRule should have been called once for the single non-@import rule
      expect(insertRuleSpy).toHaveBeenCalledWith('p { color: purple; }', 0);
    } finally {
      // Always restore the original constructor to avoid test pollution.
      Object.defineProperty(iframeWindow, 'CSSStyleSheet', {
        value: OriginalCSSStyleSheet,
        configurable: true,
        writable: true,
      });
    }
  });

  // ---------------------------------------------------------------------------
  // applySnapshotAdoptedStyleSheets path (issue 4)
  // ---------------------------------------------------------------------------

  it('applySnapshotAdoptedStyleSheets: clones a foreign-window sheet and adopts it on a document node', () => {
    const foreignSheet = makeForeignSheet(['span { color: orange; }']);

    const styleMirror = (replayer as any).styleMirror;
    styleMirror.add(foreignSheet, 300);

    const mirror = (replayer as any).mirror;
    const docNode = mirror.getNode(1) as Document | null;
    expect(docNode).not.toBeNull();
    if (!docNode) return;

    (replayer as any).applySnapshotAdoptedStyleSheets(docNode, [
      { styleId: 300, rules: [] },
    ]);

    const adopted = docNode.adoptedStyleSheets?.[0];
    // A clone must have been made — different instance from the foreign sheet
    expect(adopted).not.toBe(foreignSheet);
    // The clone is a real CSSStyleSheet
    expect(adopted).toBeInstanceOf(
      (replayer as any).iframe.contentWindow.CSSStyleSheet,
    );
    // CSS rules were copied into the clone
    expect(adopted?.cssRules[0]?.cssText).toContain('color: orange');
    // The mirror must have been updated to point at the clone
    expect(styleMirror.getStyle(300)).toBe(adopted);
  });

  it('applySnapshotAdoptedStyleSheets: does not update mirror when outer assignment throws', () => {
    const foreignSheet = makeForeignSheet(['h1 { font-size: 2em; }']);

    const styleMirror = (replayer as any).styleMirror;
    styleMirror.add(foreignSheet, 301);

    const mirror = (replayer as any).mirror;
    const docNode = mirror.getNode(1) as Document | null;
    expect(docNode).not.toBeNull();
    if (!docNode) return;

    // Make the outer assignment throw so the mirror should NOT be updated.
    Object.defineProperty(docNode, 'adoptedStyleSheets', {
      set: () => {
        throw new Error('blocked');
      },
      configurable: true,
    });

    const warnSpy = vi.spyOn(replayer as any, 'warn');

    (replayer as any).applySnapshotAdoptedStyleSheets(docNode, [
      { styleId: 301, rules: [] },
    ]);

    // warn must have been called (outer try/catch fired)
    expect(warnSpy).toHaveBeenCalledWith(
      'adoptedStyleSheets assignment failed',
      expect.any(Error),
    );
    // The mirror must still point at the original foreign sheet — not a clone
    expect(styleMirror.getStyle(301)).toBe(foreignSheet);
  });

  it('applySnapshotAdoptedStyleSheets: adopts sheet on shadow host', () => {
    const iframeWindow = (replayer as any).iframe.contentWindow as Window &
      typeof globalThis;
    const sheet = new iframeWindow.CSSStyleSheet();
    sheet.insertRule('em { font-style: normal; }');

    const styleMirror = (replayer as any).styleMirror;
    styleMirror.add(sheet, 302);

    // Create a host element with a shadow root
    const host = document.createElement('div');
    host.attachShadow({ mode: 'open' });
    document.body.appendChild(host);

    try {
      (replayer as any).applySnapshotAdoptedStyleSheets(host, [
        { styleId: 302, rules: [] },
      ]);

      expect(host.shadowRoot!.adoptedStyleSheets).toHaveLength(1);
      expect(host.shadowRoot!.adoptedStyleSheets[0]).toBe(sheet);
    } finally {
      host.remove();
    }
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

    // accessing private method for testing
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
