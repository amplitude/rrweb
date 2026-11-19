import { Timer } from '../src/replay/timer';

describe('Timer asynchronous actions', () => {
  let callbacks: FrameRequestCallback[];
  let now: number;

  beforeEach(() => {
    callbacks = [];
    now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        callbacks.push(callback);
        return callbacks.length;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('waits for an asynchronous action before running later actions', async () => {
    const calls: string[] = [];
    let finishFirstAction: () => void = () => undefined;
    const firstAction = new Promise<void>((resolve) => {
      finishFirstAction = resolve;
    });
    const timer = new Timer(
      [
        {
          delay: 0,
          doAction: () => {
            calls.push('first');
            return firstAction;
          },
        },
        {
          delay: 0,
          doAction: () => {
            calls.push('second');
          },
        },
      ],
      { speed: 1 },
    );

    timer.start();
    callbacks.shift()?.(now);

    expect(calls).toEqual(['first']);
    expect(callbacks).toHaveLength(0);

    now = 5_000;
    finishFirstAction();
    await firstAction;
    await Promise.resolve();

    expect(callbacks).toHaveLength(1);
    callbacks.shift()?.(now);
    expect(calls).toEqual(['first', 'second']);
    expect(timer.timeOffset).toBe(0);
  });
});
