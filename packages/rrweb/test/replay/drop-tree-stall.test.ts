/**
 * @vitest-environment jsdom
 *
 * Guard against the replayer hanging the main thread when mutation adds cannot
 * be attached: a node waits on a next sibling whose resolve tree is dropped
 * because the sibling's parent was never found.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { EventType, IncrementalSource, NodeType } from '@amplitude/rrweb-types';
import type { eventWithTime } from '@amplitude/rrweb-types';
import { Replayer } from '../../src/replay';

const T0 = 1_000_000;

function snapshotEvents(): eventWithTime[] {
  return [
    {
      type: EventType.DomContentLoaded,
      data: {},
      timestamp: T0,
    },
    {
      type: EventType.Load,
      data: {},
      timestamp: T0,
    },
    {
      type: EventType.Meta,
      data: { href: 'http://localhost', width: 800, height: 600 },
      timestamp: T0,
    },
    {
      type: EventType.FullSnapshot,
      data: {
        node: {
          type: NodeType.Document,
          childNodes: [
            {
              type: NodeType.DocumentType,
              name: 'html',
              publicId: '',
              systemId: '',
              id: 2,
            },
            {
              type: NodeType.Element,
              tagName: 'html',
              attributes: {},
              childNodes: [
                {
                  type: NodeType.Element,
                  tagName: 'head',
                  attributes: {},
                  childNodes: [],
                  id: 4,
                },
                {
                  type: NodeType.Element,
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
        initialOffset: { top: 0, left: 0 },
      },
      timestamp: T0,
    },
  ];
}

function makeReplayer(
  events: eventWithTime[],
  opts: Record<string, unknown> = {},
) {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const warn = vi.fn();
  const replayer = new Replayer(events, {
    root,
    showWarning: true,
    showDebug: true,
    useVirtualDom: false,
    logger: { log: () => {}, warn },
    ...opts,
  });
  const iframeWindow = replayer.iframe.contentWindow as Window | null;
  if (iframeWindow) {
    iframeWindow.scrollTo = () => {};
  }
  return { replayer, root, warn };
}

describe('replayer drop-tree resolve loop', () => {
  vi.useFakeTimers();

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('does not hang when a queued add waits on a dropped next sibling', () => {
    const events: eventWithTime[] = [
      ...snapshotEvents(),
      {
        type: EventType.IncrementalSnapshot,
        timestamp: T0 + 100,
        data: {
          source: IncrementalSource.Mutation,
          texts: [{ id: 201, value: 'missing' }],
          attributes: [],
          removes: [],
          adds: [
            {
              parentId: 5,
              nextId: 201,
              node: {
                type: NodeType.Element,
                tagName: 'div',
                attributes: { id: 'waiting-on-sibling' },
                childNodes: [],
                id: 200,
              },
            },
            {
              parentId: 999999,
              nextId: null,
              node: {
                type: NodeType.Element,
                tagName: 'div',
                attributes: { id: 'orphaned' },
                childNodes: [],
                id: 201,
              },
            },
          ],
        },
      },
    ];

    const { replayer, warn } = makeReplayer(events);

    expect(() => replayer.pause(200)).not.toThrow();

    expect(warn).toHaveBeenCalled();
    const messages = warn.mock.calls.map((args) => String(args[1] ?? args[0]));
    expect(
      messages.some((msg) => msg.includes('Stopped resolving mutation queue')),
    ).toBe(true);
    expect(messages.some((msg) => msg.includes('Node with id'))).toBe(true);
  });

  it('still attaches well-formed adds', () => {
    const events: eventWithTime[] = [
      ...snapshotEvents(),
      {
        type: EventType.IncrementalSnapshot,
        timestamp: T0 + 100,
        data: {
          source: IncrementalSource.Mutation,
          texts: [],
          attributes: [],
          removes: [],
          adds: [
            {
              parentId: 5,
              nextId: null,
              node: {
                type: NodeType.Element,
                tagName: 'div',
                attributes: { id: 'ok' },
                childNodes: [],
                id: 200,
              },
            },
          ],
        },
      },
    ];

    const { replayer } = makeReplayer(events);
    replayer.pause(200);

    const added = replayer.iframe.contentDocument?.getElementById('ok');
    expect(added).not.toBeNull();
    expect(added?.tagName).toBe('DIV');
  });
});
