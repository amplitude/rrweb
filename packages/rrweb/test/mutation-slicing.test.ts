import { IncrementalSource, type mutationData } from '@amplitude/rrweb-types';
import { Replayer } from '../src/replay';

describe('large live mutation slicing', () => {
  it('keeps mutation phases ordered while yielding between addition chunks', async () => {
    const animationFrames: FrameRequestCallback[] = [];
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        animationFrames.push(callback);
        return animationFrames.length;
      }),
    );

    const replayer = Object.create(Replayer.prototype) as Replayer;
    const appliedChunks: mutationData[] = [];
    Object.defineProperty(replayer, 'applyMutation', {
      value: (chunk: mutationData) => appliedChunks.push(chunk),
    });

    const mutation = {
      source: IncrementalSource.Mutation,
      removes: [{ id: 1, parentId: 0 }],
      adds: [2, 3, 4, 5, 6].map((id) => ({
        parentId: 0,
        nextId: null,
        node: { id },
      })),
      texts: [{ id: 6, value: 'done' }],
      attributes: [{ id: 6, attributes: { title: 'done' } }],
    } as mutationData;
    const applyInFrames = (
      replayer as unknown as {
        applyMutationInFrames(
          data: mutationData,
          chunkSize: number,
        ): Promise<void>;
      }
    ).applyMutationInFrames.bind(replayer);

    const completion = applyInFrames(mutation, 2);

    expect(appliedChunks).toHaveLength(1);
    expect(appliedChunks[0].removes).toEqual(mutation.removes);
    expect(appliedChunks[0].adds.map(({ node }) => node.id)).toEqual([2, 3]);
    expect(appliedChunks[0].texts).toEqual([]);
    expect(appliedChunks[0].attributes).toEqual([]);

    animationFrames.shift()?.(0);
    expect(appliedChunks[1].removes).toEqual([]);
    expect(appliedChunks[1].adds.map(({ node }) => node.id)).toEqual([4, 5]);
    expect(appliedChunks[1].texts).toEqual([]);

    animationFrames.shift()?.(0);
    await completion;

    expect(appliedChunks[2].adds.map(({ node }) => node.id)).toEqual([6]);
    expect(appliedChunks[2].texts).toEqual(mutation.texts);
    expect(appliedChunks[2].attributes).toEqual(mutation.attributes);

    vi.unstubAllGlobals();
  });
});
