import type { eventWithTime } from '@amplitude/rrweb-types';
import { EventType, IncrementalSource } from '@amplitude/rrweb-types';

/**
 * Simulates the recorder-side bug where an adoptedStyleSheet (styleId=1)
 * was introduced by a transient shadow host that was removed before a checkout
 * FullSnapshot.  The checkout FS omits the host, so styleId=1 rules are lost.
 *
 * The fix synthesises a source-15 event immediately after the checkout FS that
 * carries the orphaned rules (styles: [{styleId:1, rules:[...]}], styleIds:[]).
 * This file models the FIXED event stream — i.e. the synthetic event is present.
 *
 * Event timeline:
 *  t=100  Meta + initial FullSnapshot — shadow-host (#10) present, styleId=1 inlined
 *  t=200  source-15: shadow-host2 (#16) adopts styleId=1 (rules:[] — already known)
 *  t=300  Mutation: removes shadow-host (#10) from DOM
 *  t=400  Checkout Meta + checkout FullSnapshot — shadow-host is gone, styleId=1 absent
 *  t=410  Synthetic source-15: re-emits orphaned styleId=1 rules (styleIds:[], id:1=doc)
 *  t=500  Mutation: adds shadow-host2 back (it was never really removed; this re-adopts)
 *  t=550  source-15: shadow-host2 re-adopts styleId=1 (rules:[] — mirror now has them)
 *
 * Without the fix (t=410 event missing), the source-15 at t=550 references a
 * styleId unknown to the replayer after the checkout rebuild, and shadow-host2
 * ends up with no adoptedStyleSheets (retry loop exhausted).
 *
 * With the fix, the replayer has styleId=1 in its mirror before t=550 arrives,
 * and the adoption succeeds.
 */

const now = Date.now();

const events: eventWithTime[] = [
  { type: EventType.DomContentLoaded, data: {}, timestamp: now },
  // ── initial snapshot ────────────────────────────────────────────────────────
  {
    type: EventType.Meta,
    data: { href: 'about:blank', width: 1920, height: 1080 },
    timestamp: now + 100,
  },
  {
    type: EventType.FullSnapshot,
    data: {
      node: {
        type: 0,
        childNodes: [
          { type: 1, name: 'html', publicId: '', systemId: '', id: 2 },
          {
            type: 2,
            tagName: 'html',
            attributes: {},
            childNodes: [
              { type: 2, tagName: 'head', attributes: {}, childNodes: [], id: 4 },
              {
                type: 2,
                tagName: 'body',
                attributes: {},
                childNodes: [
                  {
                    // shadow-host: transient host that gets removed before checkout
                    type: 2,
                    tagName: 'div',
                    attributes: { id: 'shadow-host' },
                    childNodes: [
                      {
                        type: 2,
                        tagName: 'span',
                        attributes: {},
                        childNodes: [
                          { type: 3, textContent: 'transient content', id: 8 },
                        ],
                        id: 7,
                        isShadow: true,
                      },
                    ],
                    id: 6,
                    isShadowHost: true,
                    // styleId=1 rules are inlined here in the initial FS
                    adoptedStyleSheets: [
                      {
                        styleId: 1,
                        rules: [{ rule: 'span { color: red; }', index: 0 }],
                      },
                    ],
                  },
                  {
                    // shadow-host2: persists across the checkout, will re-adopt styleId=1 later
                    type: 2,
                    tagName: 'div',
                    attributes: { id: 'shadow-host2' },
                    childNodes: [
                      {
                        type: 2,
                        tagName: 'span',
                        attributes: {},
                        childNodes: [
                          { type: 3, textContent: 'persistent content', id: 11 },
                        ],
                        id: 10,
                        isShadow: true,
                      },
                    ],
                    id: 9,
                    isShadowHost: true,
                    // shadow-host2 also adopts styleId=1 — rules already known from above
                    adoptedStyleSheets: [{ styleId: 1, rules: [] }],
                  },
                ],
                id: 5,
              },
            ],
            id: 3,
          },
        ],
        id: 1,
      },
      initialOffset: { left: 0, top: 0 },
    },
    timestamp: now + 100,
  },
  // ── remove the transient shadow-host ────────────────────────────────────────
  {
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.Mutation,
      adds: [],
      removes: [{ parentId: 5, id: 6 }],
      texts: [],
      attributes: [],
    },
    timestamp: now + 300,
  },
  // ── checkout FullSnapshot (shadow-host gone; styleId=1 NOT inlined) ─────────
  {
    type: EventType.Meta,
    data: { href: 'about:blank', width: 1920, height: 1080 },
    timestamp: now + 400,
  },
  {
    type: EventType.FullSnapshot,
    data: {
      node: {
        type: 0,
        childNodes: [
          { type: 1, name: 'html', publicId: '', systemId: '', id: 2 },
          {
            type: 2,
            tagName: 'html',
            attributes: {},
            childNodes: [
              { type: 2, tagName: 'head', attributes: {}, childNodes: [], id: 4 },
              {
                type: 2,
                tagName: 'body',
                attributes: {},
                childNodes: [
                  {
                    // shadow-host is gone from the checkout snapshot — styleId=1 rules lost
                    type: 2,
                    tagName: 'div',
                    attributes: { id: 'shadow-host2' },
                    childNodes: [
                      {
                        type: 2,
                        tagName: 'span',
                        attributes: {},
                        childNodes: [
                          { type: 3, textContent: 'persistent content', id: 11 },
                        ],
                        id: 10,
                        isShadow: true,
                      },
                    ],
                    id: 9,
                    isShadowHost: true,
                    // No adoptedStyleSheets here: host2 still adopts styleId=1 but rules
                    // can't be inlined because styleId=1 is orphaned (shadow-host is gone).
                    // Without the fix, the replayer never learns about styleId=1's rules.
                  },
                ],
                id: 5,
              },
            ],
            id: 3,
          },
        ],
        id: 1,
      },
      initialOffset: { left: 0, top: 0 },
    },
    timestamp: now + 400,
  },
  // ── synthetic source-15 carrying orphaned styleId=1 rules ───────────────────
  // This is the event the FIXED recorder emits right after the checkout FS.
  // id=1 is the root document node (always present after rebuildFullSnapshot).
  // styleIds=[] means: don't actually adopt anything on the document, just
  // populate the replayer's styleMirror so later references to styleId=1 work.
  {
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.AdoptedStyleSheet,
      id: 1,
      styleIds: [],
      styles: [{ styleId: 1, rules: [{ rule: 'span { color: red; }', index: 0 }] }],
    },
    timestamp: now + 410,
  },
  // ── source-15: shadow-host2 re-adopts styleId=1 ────────────────────────────
  // References the rules the synthetic event just restored to the mirror.
  {
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.AdoptedStyleSheet,
      id: 9,
      styleIds: [1],
      styles: [],
    },
    timestamp: now + 550,
  },
];

export default events;
