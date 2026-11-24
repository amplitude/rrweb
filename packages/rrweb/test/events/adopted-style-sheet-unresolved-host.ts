import type { eventWithTime } from '@amplitude/rrweb-types';
import { EventType, IncrementalSource } from '@amplitude/rrweb-types';

/**
 * A shared CSSStyleSheet whose rules arrive on an AdoptedStyleSheet event for
 * a host the replayer can't resolve. The recorder emits `id: -1` when the
 * host isn't serialized yet. Its mirror still registers the sheet, so later
 * hosts that share it reference styleId 1 without the rules.
 *
 * Two variants of the unresolved host are covered: styleId 1 comes with
 * `id: -1`, and styleId 2 comes with an id that never appears in the stream.
 */
const now = Date.now();

const shadowHost = (hostId: number, label: string) => ({
  type: 2,
  tagName: 'div',
  attributes: { id: label },
  childNodes: [
    {
      type: 2,
      tagName: 'span',
      attributes: {},
      childNodes: [
        { type: 3, textContent: `text in ${label}`, id: hostId + 2 },
      ],
      id: hostId + 1,
      isShadow: true,
    },
  ],
  id: hostId,
  isShadowHost: true,
});

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
                childNodes: [
                  shadowHost(10, 'shadow-host-1'),
                  shadowHost(20, 'shadow-host-2'),
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
  {
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.AdoptedStyleSheet,
      id: -1,
      styleIds: [1],
      styles: [
        { styleId: 1, rules: [{ rule: 'span { color: red; }', index: 0 }] },
      ],
    },
    timestamp: now + 200,
  },
  {
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.AdoptedStyleSheet,
      id: 999,
      styleIds: [2],
      styles: [
        {
          styleId: 2,
          rules: [{ rule: 'span { font-size: 24px; }', index: 0 }],
        },
      ],
    },
    timestamp: now + 200,
  },
  {
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.AdoptedStyleSheet,
      id: 10,
      styleIds: [1, 2],
    },
    timestamp: now + 300,
  },
  {
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.AdoptedStyleSheet,
      id: 20,
      styleIds: [1, 2],
    },
    timestamp: now + 300,
  },
];

export default events;
