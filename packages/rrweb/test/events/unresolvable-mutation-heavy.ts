import type { eventWithTime } from '@amplitude/rrweb-types';
import { EventType, IncrementalSource } from '@amplitude/rrweb-types';

/**
 * Sized to resemble the production stall: many mutation events whose leftover
 * queue cannot make progress. Before the early-exit fix each of those events
 * spun until the 500ms resolve-loop timeout (~BATCHES * 500ms of main-thread
 * work). After the fix the same events should apply in well under one timeout.
 *
 * Each batch also includes work that *must still resolve* so the early exit
 * cannot be a false win:
 *   - a sibling whose `nextId` appears later in the same `adds` list
 *   - a child of that delayed node
 *   - a missing parent (dropped, not retried)
 *   - never-serialized `nextId`s (the stall case)
 */
export const HEAVY_UNRESOLVABLE_BATCHES = 20;
export const HEAVY_RESOLVABLE_ROWS = 12;
export const HEAVY_CELLS_PER_ROW = 4;
export const HEAVY_UNRESOLVABLE_PER_BATCH = 30;

const BODY_ID = 100;
const NEVER_SERIALIZED_NEXT_ID = 8_888_888;
const MISSING_PARENT_ID = 8_888_887;

type SerializedElement = {
  id: number;
  type: 2;
  tagName: string;
  attributes: Record<string, string>;
  childNodes: [];
};

type Add = {
  parentId: number;
  nextId: number | null;
  node: SerializedElement;
};

function element(
  id: number,
  tagName: string,
  attributes: Record<string, string>,
): SerializedElement {
  return { id, type: 2, tagName, attributes, childNodes: [] };
}

function add(
  parentId: number,
  nextId: number | null,
  node: SerializedElement,
): Add {
  return { parentId, nextId, node };
}

function bootstrap(now: number): eventWithTime[] {
  return [
    { type: EventType.DomContentLoaded, data: {}, timestamp: now },
    { type: EventType.Load, data: {}, timestamp: now + 10 },
    {
      type: EventType.Meta,
      data: { href: 'http://localhost', width: 1200, height: 800 },
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
                  id: BODY_ID,
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
  ] as unknown as eventWithTime[];
}

function batchAdds(batch: number): Add[] {
  const idBase = 10_000 + batch * 1_000;
  const containerId = idBase + 1;
  const waiterId = idBase + 300;
  const waiterChildId = idBase + 301;
  const siblingId = idBase + 302;
  const adds: Add[] = [
    add(
      BODY_ID,
      null,
      element(containerId, 'div', {
        class: 'batch',
        'data-batch': String(batch),
      }),
    ),
  ];

  for (let row = 0; row < HEAVY_RESOLVABLE_ROWS; row++) {
    const rowId = idBase + 10 + row;
    adds.push(
      add(
        containerId,
        null,
        element(rowId, 'div', {
          class: 'row',
          'data-batch': String(batch),
        }),
      ),
    );
    for (let cell = 0; cell < HEAVY_CELLS_PER_ROW; cell++) {
      adds.push(
        add(
          rowId,
          null,
          element(idBase + 100 + row * 10 + cell, 'span', {
            class: 'cell',
            'data-batch': String(batch),
          }),
        ),
      );
    }
  }

  // Waiter is listed *before* its next sibling so the first append pass
  // queues it, then a later resolve pass must still attach it and its child.
  adds.push(
    add(
      containerId,
      siblingId,
      element(waiterId, 'div', {
        class: 'delayed-waiter',
        'data-batch': String(batch),
      }),
    ),
    add(
      waiterId,
      null,
      element(waiterChildId, 'span', {
        class: 'delayed-child',
        'data-batch': String(batch),
      }),
    ),
    add(
      containerId,
      null,
      element(siblingId, 'div', {
        class: 'delayed-sibling',
        'data-batch': String(batch),
      }),
    ),
  );

  for (let i = 0; i < HEAVY_UNRESOLVABLE_PER_BATCH; i++) {
    adds.push(
      add(
        containerId,
        NEVER_SERIALIZED_NEXT_ID,
        element(idBase + 400 + i, 'div', {
          class: 'never-next',
          'data-batch': String(batch),
        }),
      ),
    );
  }

  adds.push(
    add(
      MISSING_PARENT_ID,
      null,
      element(idBase + 500, 'div', {
        class: 'missing-parent',
        'data-batch': String(batch),
      }),
    ),
  );

  return adds;
}

export function expectedHeavyUnresolvableDom() {
  return {
    batches: HEAVY_UNRESOLVABLE_BATCHES,
    rows: HEAVY_UNRESOLVABLE_BATCHES * HEAVY_RESOLVABLE_ROWS,
    cells:
      HEAVY_UNRESOLVABLE_BATCHES * HEAVY_RESOLVABLE_ROWS * HEAVY_CELLS_PER_ROW,
    delayedWaiters: HEAVY_UNRESOLVABLE_BATCHES,
    delayedChildren: HEAVY_UNRESOLVABLE_BATCHES,
    delayedSiblings: HEAVY_UNRESOLVABLE_BATCHES,
    neverNext: 0,
    missingParent: 0,
  };
}

const now = Date.now();

const events: eventWithTime[] = [
  ...bootstrap(now),
  ...Array.from({ length: HEAVY_UNRESOLVABLE_BATCHES }, (_, batch) => ({
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.Mutation,
      texts: [],
      attributes: [],
      removes: [],
      adds: batchAdds(batch),
    },
    timestamp: now + 100 + batch * 10,
  })),
] as unknown as eventWithTime[];

export default events;
