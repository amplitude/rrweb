import type { eventWithTime } from '@amplitude/rrweb-types';
import { EventType, IncrementalSource } from '@amplitude/rrweb-types';

/**
 * Events where adoptedStyleSheets CSS content is embedded inline in the full
 * snapshot (new behavior), with NO subsequent incremental AdoptedStyleSheet
 * events carrying CSS rules. This simulates the case where incremental events
 * were dropped in transit but the snapshot itself is self-contained.
 */
const now = Date.now();

const events: eventWithTime[] = [
  { type: EventType.DomContentLoaded, data: {}, timestamp: now },
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
                  { type: 3, textContent: '\n      ', id: 6 },
                  {
                    type: 2,
                    tagName: 'div',
                    attributes: { id: 'shadow-host' },
                    childNodes: [
                      {
                        type: 2,
                        tagName: 'span',
                        attributes: {},
                        childNodes: [
                          { type: 3, textContent: 'text in shadow dom', id: 9 },
                        ],
                        id: 8,
                        isShadow: true,
                      },
                    ],
                    id: 7,
                    isShadowHost: true,
                    // CSS content embedded inline — no incremental events needed
                    adoptedStyleSheets: [
                      {
                        styleId: 1,
                        rules: [{ rule: 'span { color: red; }', index: 0 }],
                      },
                    ],
                  },
                  { type: 3, textContent: '\n    ', id: 10 },
                ],
                id: 5,
              },
            ],
            id: 3,
          },
        ],
        id: 1,
        // document-level adoptedStyleSheet embedded inline
        adoptedStyleSheets: [
          {
            styleId: 2,
            rules: [{ rule: 'body { background-color: rgb(0, 128, 0); }', index: 0 }],
          },
        ],
      },
      initialOffset: { left: 0, top: 0 },
    },
    timestamp: now + 100,
  },
  // Subsequent event re-adopts using styleIds only (no CSS rules) — simulating
  // what happens after the initial snapshot when incremental events reference
  // sheets already known from the snapshot.
  {
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.AdoptedStyleSheet,
      id: 7,
      styleIds: [1],
    },
    timestamp: now + 200,
  },
];

export default events;
