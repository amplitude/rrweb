import type { eventWithTime } from '@amplitude/rrweb-types';
import { EventType } from '@amplitude/rrweb-types';

/**
 * Tests the post-order replay hazard: the outer shadow host's adoptedStyleSheets
 * carry the full rules (serialized first by the recorder, top-down), but the inner
 * shadow host's carry rules:[] (serialized second, de-duped). During replay,
 * afterAppend fires bottom-up, so the inner host is processed first — creating an
 * empty CSSStyleSheet under styleId 1 — before the outer host's rules arrive.
 * The replayer must back-fill the rules onto the existing shared sheet.
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
                    attributes: { id: 'outer-host' },
                    childNodes: [
                      // inner shadow host — nested inside outer's shadow root
                      {
                        type: 2,
                        tagName: 'div',
                        attributes: { id: 'inner-host' },
                        childNodes: [
                          {
                            type: 2,
                            tagName: 'span',
                            attributes: {},
                            childNodes: [
                              {
                                type: 3,
                                textContent: 'inner span',
                                id: 10,
                              },
                            ],
                            id: 9,
                            isShadow: true,
                          },
                        ],
                        id: 8,
                        isShadow: true,
                        isShadowHost: true,
                        // Second encounter of styleId 1 — rules: [] (recorder de-dup)
                        adoptedStyleSheets: [{ styleId: 1, rules: [] }],
                      },
                      // span directly in outer shadow root
                      {
                        type: 2,
                        tagName: 'span',
                        attributes: {},
                        childNodes: [
                          { type: 3, textContent: 'outer span', id: 12 },
                        ],
                        id: 11,
                        isShadow: true,
                      },
                    ],
                    id: 7,
                    isShadowHost: true,
                    // First encounter of styleId 1 — full rules emitted by recorder
                    adoptedStyleSheets: [
                      {
                        styleId: 1,
                        rules: [{ rule: 'span { color: red; }', index: 0 }],
                      },
                    ],
                  },
                  { type: 3, textContent: '\n', id: 13 },
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
