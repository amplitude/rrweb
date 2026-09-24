import type { eventWithTime } from '@amplitude/rrweb-types';
import { EventType, IncrementalSource } from '@amplitude/rrweb-types';

/**
 * Simulates a Lit-style web component added after the initial full snapshot via
 * a DOM mutation. adoptedStyleSheets are embedded inline on the added shadow host
 * node (captureAdoptedStyleSheets), with no incremental AdoptedStyleSheet event.
 * This is the SR-4938 failure mode: setTimeout(0) incremental events for
 * post-snapshot shadow roots were silently dropped, leaving icons unstyled.
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
              {
                type: 2,
                tagName: 'head',
                attributes: {},
                childNodes: [],
                id: 4,
              },
              {
                type: 2,
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
      initialOffset: { left: 0, top: 0 },
    },
    timestamp: now + 100,
  },
  {
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.Mutation,
      adds: [
        {
          parentId: 5,
          nextId: null,
          node: {
            type: 2,
            tagName: 'dsf-icon',
            attributes: { id: 'dynamic-icon' },
            childNodes: [],
            id: 7,
            isShadowHost: true,
            adoptedStyleSheets: [
              {
                styleId: 1,
                rules: [
                  {
                    rule: 'svg { width: 24px; height: 24px; }',
                    index: 0,
                  },
                ],
              },
            ],
          },
        },
        {
          parentId: 7,
          nextId: null,
          node: {
            type: 2,
            tagName: 'svg',
            attributes: { viewBox: '0 0 24 24' },
            childNodes: [],
            id: 8,
            isSVG: true,
            isShadow: true,
          },
        },
      ],
      removes: [],
      texts: [],
      attributes: [],
    },
    timestamp: now + 200,
  },
];

export default events;
