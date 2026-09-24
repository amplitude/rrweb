import type { eventWithTime } from '@amplitude/rrweb-types';
import { EventType, IncrementalSource } from '@amplitude/rrweb-types';

const now = Date.now();

/**
 * A mutation where some added nodes reference a `nextId` that is never
 * serialized, so they can never be taken off the replayer's resolve queue.
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
    timestamp: now + 10,
  },
  {
    type: EventType.Meta,
    data: {
      href: 'http://localhost',
      width: 1000,
      height: 800,
    },
    timestamp: now + 10,
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
                id: 100,
                type: 2,
                tagName: 'body',
                attributes: {},
                childNodes: [],
              },
            ],
          },
        ],
      },
      initialOffset: { top: 0, left: 0 },
    },
    timestamp: now + 20,
  },
  {
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.Mutation,
      texts: [],
      attributes: [],
      removes: [],
      adds: [
        {
          parentId: 100,
          nextId: null,
          node: {
            id: 200,
            type: 2,
            tagName: 'div',
            attributes: { id: 'resolvable' },
            childNodes: [],
          },
        },
        ...[201, 202, 203, 204, 205].map((id) => ({
          parentId: 100,
          // 9999 is never added by any event, so this add can never resolve
          nextId: 9999,
          node: {
            id,
            type: 2,
            tagName: 'div',
            attributes: { id: `unresolvable-${id}` },
            childNodes: [],
          },
        })),
      ],
    },
    timestamp: now + 100,
  },
] as unknown as eventWithTime[];

export default events;
