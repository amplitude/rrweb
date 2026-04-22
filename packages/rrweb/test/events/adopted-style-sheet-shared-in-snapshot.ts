import type { eventWithTime } from '@amplitude/rrweb-types';
import { EventType } from '@amplitude/rrweb-types';

/**
 * Events where two shadow hosts share the same CSSStyleSheet (styleId 1).
 * The first host carries the full rules; the second carries rules: [] because
 * the recorder de-duplicates and only emits rules once per styleId.
 * The replayer should reuse the same CSSStyleSheet object for both hosts.
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
                  { type: 3, textContent: '\n  ', id: 6 },
                  {
                    type: 2,
                    tagName: 'div',
                    attributes: { id: 'shadow-host-1' },
                    childNodes: [
                      {
                        type: 2,
                        tagName: 'span',
                        attributes: {},
                        childNodes: [
                          { type: 3, textContent: 'text in shadow 1', id: 9 },
                        ],
                        id: 8,
                        isShadow: true,
                      },
                    ],
                    id: 7,
                    isShadowHost: true,
                    // First encounter: full rules emitted
                    adoptedStyleSheets: [
                      {
                        styleId: 1,
                        rules: [{ rule: 'span { color: red; }', index: 0 }],
                      },
                    ],
                  },
                  { type: 3, textContent: '\n  ', id: 10 },
                  {
                    type: 2,
                    tagName: 'div',
                    attributes: { id: 'shadow-host-2' },
                    childNodes: [
                      {
                        type: 2,
                        tagName: 'span',
                        attributes: {},
                        childNodes: [
                          { type: 3, textContent: 'text in shadow 2', id: 13 },
                        ],
                        id: 12,
                        isShadow: true,
                      },
                    ],
                    id: 11,
                    isShadowHost: true,
                    // Second encounter: rules: [] because recorder de-duplicated
                    adoptedStyleSheets: [
                      {
                        styleId: 1,
                        rules: [],
                      },
                    ],
                  },
                  { type: 3, textContent: '\n', id: 14 },
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
];

export default events;
