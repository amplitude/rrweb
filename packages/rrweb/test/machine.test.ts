import {
  EventType,
  IncrementalSource,
} from '@amplitude/rrweb-types';
import type { eventWithTime, Emitter } from '@amplitude/rrweb-types';
import {
  createPlayerService,
  discardPriorSnapshots,
} from '../src/replay/machine';
import { Timer } from '../src/replay/timer';
import { sampleEvents } from './utils';

const events = sampleEvents.filter(
  (e) => ![EventType.DomContentLoaded, EventType.Load].includes(e.type),
);
const nextEvents = events.map((e) => ({
  ...e,
  timestamp: e.timestamp + 1000,
}));
const nextNextEvents = nextEvents.map((e) => ({
  ...e,
  timestamp: e.timestamp + 1000,
}));

describe('get last session', () => {
  it('will return all the events when there is only one session', () => {
    expect(discardPriorSnapshots(events, events[0].timestamp)).toEqual(events);
  });

  it('will return last session when there is more than one in the events', () => {
    const multiple = events.concat(nextEvents).concat(nextNextEvents);
    expect(
      discardPriorSnapshots(
        multiple,
        nextNextEvents[nextNextEvents.length - 1].timestamp,
      ),
    ).toEqual(nextNextEvents);
  });

  it('will return last session when baseline time is future time', () => {
    const multiple = events.concat(nextEvents).concat(nextNextEvents);
    expect(
      discardPriorSnapshots(
        multiple,
        nextNextEvents[nextNextEvents.length - 1].timestamp + 1000,
      ),
    ).toEqual(nextNextEvents);
  });

  it('will return all sessions when baseline time is prior time', () => {
    expect(discardPriorSnapshots(events, events[0].timestamp - 1000)).toEqual(
      events,
    );
  });
});

describe('addEvent deduplication', () => {
  it('does not add the same event object twice to the events array', () => {
    // Arrange — create initial events
    const NOW = 1700000000000;
    const initialEvents: eventWithTime[] = [
      {
        type: EventType.Meta,
        data: { href: 'http://localhost', width: 1000, height: 800 },
        timestamp: NOW,
      },
      {
        type: EventType.FullSnapshot,
        data: {
          node: { type: 0, childNodes: [], id: 1 },
          initialOffset: { top: 0, left: 0 },
        },
        timestamp: NOW + 1,
      },
    ];

    // Arrange — create the player service
    const emitter: Emitter = {
      on: vi.fn(),
      emit: vi.fn(),
      off: vi.fn(),
    };
    const service = createPlayerService(
      {
        events: [...initialEvents],
        timer: new Timer([], { speed: 1 }),
        timeOffset: 0,
        baselineTime: NOW,
        lastPlayedEvent: null,
      },
      {
        getCastFn: () => vi.fn(),
        applyEventsSynchronously: vi.fn(),
        emitter,
      },
    );
    service.start();

    // Arrange — create a new event to add
    const newEvent: eventWithTime = {
      type: EventType.IncrementalSnapshot,
      data: {
        source: IncrementalSource.Scroll,
        id: 1,
        x: 0,
        y: 200,
      },
      timestamp: NOW + 2000,
    };

    // Act — add the same event object twice
    service.send({ type: 'ADD_EVENT', payload: { event: newEvent } });
    service.send({ type: 'ADD_EVENT', payload: { event: newEvent } });

    // Assert — event should appear exactly once
    const contextEvents = service.state.context.events;
    const matchingEvents = contextEvents.filter(
      (e) => e.timestamp === NOW + 2000,
    );
    expect(matchingEvents).toHaveLength(1);
  });
});
