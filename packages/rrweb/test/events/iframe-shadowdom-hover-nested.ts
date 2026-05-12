import type { eventWithTime } from '@amplitude/rrweb-types';
import { EventType, IncrementalSource } from '@amplitude/rrweb-types';

const now = Date.now();

/**
 * Event fixture for testing hover traversal across 2 levels of shadow DOM nesting.
 *
 * DOM structure inside the iframe:
 *   body#11
 *   ├── div#12 (shadow host)
 *   │   └── [shadowRoot]
 *   │       ├── div#13 (shadow host, nested)
 *   │       │   └── [shadowRoot]
 *   │       │       └── span#14  ← innermost hover target
 *   │       └── span#15          ← outer shadow hover target
 *   └── span#16                  ← regular element
 */
const events: eventWithTime[] = [
  {
    type: EventType.DomContentLoaded,
    data: {},
    timestamp: now,
  },
  {
    type: EventType.Load,
    data: {},
    timestamp: now + 100,
  },
  {
    type: EventType.Meta,
    data: {
      href: 'http://localhost',
      width: 1200,
      height: 500,
    },
    timestamp: now + 100,
  },
  {
    type: EventType.FullSnapshot,
    data: {
      node: {
        id: 1,
        type: 0,
        childNodes: [
          { id: 2, name: 'html', type: 1, publicId: '', systemId: '' },
          {
            id: 3,
            type: 2,
            tagName: 'html',
            attributes: { lang: 'en' },
            childNodes: [
              {
                id: 4,
                type: 2,
                tagName: 'head',
                attributes: {},
                childNodes: [],
              },
              {
                id: 5,
                type: 2,
                tagName: 'body',
                attributes: {},
                childNodes: [
                  {
                    id: 6,
                    type: 2,
                    tagName: 'iframe',
                    attributes: {},
                    childNodes: [],
                  },
                ],
              },
            ],
          },
        ],
      },
      initialOffset: { top: 0, left: 0 },
    },
    timestamp: now + 200,
  },
  // Attach iframe content with 2-level nested shadow DOM
  {
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.Mutation,
      adds: [
        {
          parentId: 6,
          nextId: null,
          node: {
            type: 0,
            childNodes: [
              {
                type: 1,
                name: 'html',
                publicId: '',
                systemId: '',
                rootId: 7,
                id: 8,
              },
              {
                type: 2,
                tagName: 'html',
                attributes: { lang: 'en' },
                childNodes: [
                  {
                    type: 2,
                    tagName: 'head',
                    attributes: {},
                    childNodes: [],
                    rootId: 7,
                    id: 10,
                  },
                  {
                    type: 2,
                    tagName: 'body',
                    attributes: {},
                    childNodes: [
                      // Outer shadow host
                      {
                        type: 2,
                        tagName: 'div',
                        attributes: {},
                        childNodes: [
                          // Inner shadow host (inside outer's shadow root)
                          {
                            type: 2,
                            tagName: 'div',
                            attributes: {},
                            childNodes: [
                              // Innermost span (inside inner's shadow root)
                              {
                                type: 2,
                                tagName: 'span',
                                attributes: {},
                                childNodes: [],
                                rootId: 7,
                                id: 14,
                                isShadow: true,
                              },
                            ],
                            isShadowHost: true,
                            isShadow: true,
                            rootId: 7,
                            id: 13,
                          },
                          // Span in outer's shadow root
                          {
                            type: 2,
                            tagName: 'span',
                            attributes: {},
                            childNodes: [],
                            rootId: 7,
                            id: 15,
                            isShadow: true,
                          },
                        ],
                        isShadowHost: true,
                        rootId: 7,
                        id: 12,
                      },
                      // Regular span in body
                      {
                        type: 2,
                        tagName: 'span',
                        attributes: {},
                        childNodes: [],
                        rootId: 7,
                        id: 16,
                      },
                    ],
                    rootId: 7,
                    id: 11,
                  },
                ],
                rootId: 7,
                id: 9,
              },
            ],
            id: 7,
          },
        },
      ],
      removes: [],
      texts: [],
      attributes: [],
      isAttachIframe: true,
    },
    timestamp: now + 500,
  },
  // Hover regular span in iframe
  {
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.MouseMove,
      positions: [{ x: 0, y: 0, id: 16, timeOffset: 0 }],
    },
    timestamp: now + 500,
  },
  // Hover innermost span (2 levels deep in shadow DOM)
  {
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.MouseMove,
      positions: [{ x: 0, y: 0, id: 14, timeOffset: 0 }],
    },
    timestamp: now + 1000,
  },
  // Hover outer shadow span (1 level deep)
  {
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.MouseMove,
      positions: [{ x: 0, y: 0, id: 15, timeOffset: 0 }],
    },
    timestamp: now + 1500,
  },
  // Hover regular span again
  {
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.MouseMove,
      positions: [{ x: 0, y: 0, id: 16, timeOffset: 0 }],
    },
    timestamp: now + 2000,
  },
];

export default events;
