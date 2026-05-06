/**
 * @vitest-environment jsdom
 *
 * Tests for the 2D canvas transferToImageBitmap fast-path (SR-4163).
 *
 * We test the behaviour of serializeArg for HTMLCanvasElement in two
 * scenarios:
 *
 *  A. FAST-PATH environment (both OffscreenCanvas and transferToImageBitmap
 *     present, Worker available):
 *     - serializeArg returns a Promise
 *     - The Promise resolves to { rr_type: 'HTMLImageElement', src: 'data:...' }
 *     once the worker encode response is simulated.
 *
 *  B. FALLBACK environment (OffscreenCanvas or transferToImageBitmap absent):
 *     - serializeArg returns a synchronous CanvasArg via toDataURL.
 *
 *  C. REPLAY back-compat:
 *     - deserializeArg handles the { rr_type: 'HTMLImageElement', src } form
 *       regardless of which record path produced it.
 *
 * NOTE: because the fast-path uses a module-level singleton worker and the
 * Vite ?worker&inline import cannot be easily tree-shaken in jsdom, we test
 * the fast-path by directly exposing the `_getWorkerForTest` helper and
 * injecting a fake worker instance.  This avoids fighting vi.mock hoisting
 * and the Worker global availability in jsdom.
 */
import { vi } from 'vitest';
import { polyfillWebGLGlobals } from '../utils';

polyfillWebGLGlobals();

// We import after mocking so module-level init picks up the mocked Worker.
vi.mock(
  '../../src/record/workers/image-bitmap-data-url-worker?worker&inline',
  () => {
    return {
      default: vi.fn().mockImplementation(() => ({
        postMessage: vi.fn(),
        onmessage: null as null | ((e: MessageEvent) => void),
      })),
    };
  },
);

import {
  serializeArg,
  resetEncodeWorker,
} from '../../src/record/observers/canvas/serialize-args';
import { deserializeArg } from '../../src/replay/canvas/deserialize-args';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const createContext = () => new WebGL2RenderingContext();

function makeCanvas(dataURL = 'data:image/png;base64,FAKE'): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  canvas.toDataURL = vi.fn().mockReturnValue(dataURL);
  return canvas;
}

function addTransferToImageBitmap(canvas: HTMLCanvasElement) {
  const fakeBitmap = { width: 100, height: 100, close: vi.fn() };
  (canvas as unknown as Record<string, unknown>).transferToImageBitmap =
    vi.fn().mockReturnValue(fakeBitmap);
  return fakeBitmap;
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('canvas 2D fast-path (SR-4163)', () => {
  let context: WebGL2RenderingContext;

  beforeEach(() => {
    context = createContext();
    resetEncodeWorker();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetEncodeWorker();
  });

  // ── A. Fallback — OffscreenCanvas absent ─────────────────────────────────────

  describe('fallback: OffscreenCanvas absent → synchronous toDataURL', () => {
    beforeEach(() => {
      // Hide OffscreenCanvas so supports2DFastPath() returns false.
      vi.stubGlobal('OffscreenCanvas', undefined);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('returns a synchronous CanvasArg (not a Promise)', () => {
      const canvas = makeCanvas('data:image/png;base64,SYNC');
      const result = serializeArg(canvas, window, context);
      expect(result).not.toBeInstanceOf(Promise);
      expect(result).toStrictEqual({
        rr_type: 'HTMLImageElement',
        src: 'data:image/png;base64,SYNC',
      });
    });

    it('passes dataURLOptions to toDataURL', () => {
      const canvas = makeCanvas();
      serializeArg(canvas, window, context, { type: 'image/webp', quality: 0.7 });
      expect(canvas.toDataURL).toHaveBeenCalledWith('image/webp', 0.7);
    });
  });

  // ── B. Fallback — transferToImageBitmap absent (OffscreenCanvas present) ────

  describe('fallback: transferToImageBitmap absent → synchronous toDataURL', () => {
    beforeEach(() => {
      vi.stubGlobal('OffscreenCanvas', class FakeOffscreen {});
      // DO NOT add transferToImageBitmap to HTMLCanvasElement.prototype
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('returns a synchronous CanvasArg when transferToImageBitmap is absent', () => {
      const canvas = makeCanvas('data:image/png;base64,NOTRANSFER');
      const result = serializeArg(canvas, window, context);
      expect(result).not.toBeInstanceOf(Promise);
      expect(result).toMatchObject({ rr_type: 'HTMLImageElement' });
    });
  });

  // ── C. Fast-path — worker encodes off-thread ──────────────────────────────────

  describe('fast-path: Worker + OffscreenCanvas + transferToImageBitmap available', () => {
    let FakeWorkerConstructor: ReturnType<typeof vi.fn>;
    let fakeWorkerInstance: {
      postMessage: ReturnType<typeof vi.fn>;
      onmessage: null | ((e: MessageEvent) => void);
    };

    beforeEach(async () => {
      // Expose OffscreenCanvas.
      vi.stubGlobal('OffscreenCanvas', class FakeOffscreen {});
      // Expose Worker constructor so getEncodeWorker() doesn't bail out.
      vi.stubGlobal('Worker', vi.fn());

      // Re-import the mocked module and capture the next instance created.
      const mod = await import(
        '../../src/record/workers/image-bitmap-data-url-worker?worker&inline'
      );
      FakeWorkerConstructor = mod.default as ReturnType<typeof vi.fn>;
      FakeWorkerConstructor.mockImplementation(() => {
        fakeWorkerInstance = {
          postMessage: vi.fn(),
          onmessage: null,
        };
        return fakeWorkerInstance;
      });

      // Ensure the singleton is cleared so the next call to getEncodeWorker()
      // creates a fresh instance with the mocked constructor.
      resetEncodeWorker();

      // Add transferToImageBitmap to the prototype (global — all canvases).
      const fakeBitmap = { width: 100, height: 100, close: vi.fn() };
      Object.defineProperty(HTMLCanvasElement.prototype, 'transferToImageBitmap', {
        configurable: true,
        value: vi.fn().mockReturnValue(fakeBitmap),
      });
    });

    afterEach(() => {
      // Clean up the prototype addition.
      delete (HTMLCanvasElement.prototype as unknown as Record<string, unknown>)
        .transferToImageBitmap;
      vi.unstubAllGlobals();
    });

    it('returns a Promise', () => {
      const canvas = makeCanvas();
      const result = serializeArg(canvas, window, context, {});
      expect(result).toBeInstanceOf(Promise);
    });

    it('posts a message with encodeId and bitmap to the worker', () => {
      const canvas = makeCanvas();
      serializeArg(canvas, window, context, {});
      expect(fakeWorkerInstance.postMessage).toHaveBeenCalledOnce();
      const [msg] = fakeWorkerInstance.postMessage.mock.calls[0] as [
        { encodeId: string; bitmap: unknown },
        unknown,
      ];
      expect(typeof msg.encodeId).toBe('string');
      expect(msg.bitmap).toBeDefined();
    });

    it('resolves to { rr_type: HTMLImageElement, src: data:... } on worker response', async () => {
      const canvas = makeCanvas();
      const promise = serializeArg(canvas, window, context, {}) as Promise<unknown>;

      // Grab the encodeId from the worker message.
      const [msg] = fakeWorkerInstance.postMessage.mock.calls[0] as [
        { encodeId: string },
        unknown,
      ];

      // Simulate the worker posting back.
      fakeWorkerInstance.onmessage!(
        new MessageEvent('message', {
          data: { encodeId: msg.encodeId, base64: 'ENCODED==', type: 'image/png' },
        }),
      );

      const result = await promise;
      expect(result).toStrictEqual({
        rr_type: 'HTMLImageElement',
        src: 'data:image/png;base64,ENCODED==',
      });
    });
  });

  // ── D. Replay back-compat ────────────────────────────────────────────────────

  describe('replay back-compat: deserializeArg handles HTMLImageElement src', () => {
    it('deserializes recorded fast-path output to an HTMLImageElement', async () => {
      const recorded = {
        rr_type: 'HTMLImageElement',
        src: 'data:image/png;base64,REPLAYTEST',
      };
      const imageMap = new Map<unknown, HTMLImageElement>();
      const result = await deserializeArg(imageMap, null)(recorded);
      expect(result).toBeInstanceOf(HTMLImageElement);
      expect((result as HTMLImageElement).src).toContain('REPLAYTEST');
    });

    it('deserializes synchronous fallback output (old recordings) identically', async () => {
      const recorded = {
        rr_type: 'HTMLImageElement',
        src: 'data:image/png;base64,OLDRECORDING',
      };
      const imageMap = new Map<unknown, HTMLImageElement>();
      const result = await deserializeArg(imageMap, null)(recorded);
      expect(result).toBeInstanceOf(HTMLImageElement);
    });
  });
});
