import type {
  CanvasArg,
  DataURLOptions,
  ImageBitmapEncodeWorkerParams,
  ImageBitmapEncodeWorkerResponse,
  IWindow,
} from '@amplitude/rrweb-types';
import { encode } from 'base64-arraybuffer';
import ImageBitmapDataURLWorker from '../../workers/image-bitmap-data-url-worker?worker&inline';
import type { ImageBitmapDataURLRequestWorker } from '../../workers/image-bitmap-data-url-worker';

// ---------------------------------------------------------------------------
// Module-level lazy worker for 2D canvas fast-path encoding.
// The worker is shared across all calls within a single recording session and
// is created only on the first canvas-arg serialization that needs it.
// ---------------------------------------------------------------------------

let _encodeWorker: ImageBitmapDataURLRequestWorker | null = null;
const _pendingEncodes = new Map<string, (arg: CanvasArg) => void>();

function getEncodeWorker(): ImageBitmapDataURLRequestWorker | null {
  if (typeof Worker === 'undefined') return null;
  if (!_encodeWorker) {
    try {
      _encodeWorker =
        new ImageBitmapDataURLWorker() as ImageBitmapDataURLRequestWorker;
      _encodeWorker.onmessage = (
        e: MessageEvent<ImageBitmapEncodeWorkerResponse>,
      ) => {
        const { encodeId, base64, type } = e.data;
        const resolve = _pendingEncodes.get(encodeId);
        if (resolve) {
          _pendingEncodes.delete(encodeId);
          resolve({
            rr_type: 'HTMLImageElement',
            src: `data:${type};base64,${base64}`,
          });
        }
      };
    } catch {
      _encodeWorker = null;
    }
  }
  return _encodeWorker;
}

/** Reset the encode worker (call on rrweb stop to avoid leaks). */
export function resetEncodeWorker(): void {
  _pendingEncodes.clear();
  _encodeWorker = null;
}

let _encodeIdCounter = 0;
function nextEncodeId(): string {
  return `enc_${++_encodeIdCounter}_${Date.now()}`;
}

/**
 * Returns true when the browser supports the 2D fast-path:
 *  - transferToImageBitmap (Chrome 66+, Firefox 119+, Safari 18.2+)
 *  - OffscreenCanvas (needed by the worker for encoding)
 */
function supports2DFastPath(): boolean {
  return (
    typeof OffscreenCanvas !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof (HTMLCanvasElement.prototype as unknown as Record<string, unknown>)
      .transferToImageBitmap === 'function'
  );
}

/**
 * Asynchronously serialize an HTMLCanvasElement argument using the 2D
 * transferToImageBitmap fast-path. The bitmap is transferred (zero-copy) to
 * the encode worker which runs convertToBlob off the main thread.
 *
 * Falls back to the synchronous toDataURL path when the fast-path is
 * unavailable or the canvas is not a 2D context.
 */
function serializeCanvas2DFastPath(
  canvas: HTMLCanvasElement,
  dataURLOptions: DataURLOptions,
): CanvasArg | Promise<CanvasArg> {
  const worker = getEncodeWorker();
  if (!worker) {
    // No worker available — synchronous fallback.
    const src = canvas.toDataURL(dataURLOptions.type, dataURLOptions.quality);
    return { rr_type: 'HTMLImageElement', src };
  }

  try {
    // transferToImageBitmap transfers the canvas frame to an ImageBitmap
    // without copying pixels; the canvas is cleared but we are inside a
    // patched method call so the next draw will restore it.
    const bitmap = (
      canvas as unknown as {
        transferToImageBitmap(): ImageBitmap;
      }
    ).transferToImageBitmap();

    const encodeId = nextEncodeId();
    const message: ImageBitmapEncodeWorkerParams = {
      encodeId,
      bitmap,
      dataURLOptions,
    };

    return new Promise<CanvasArg>((resolve) => {
      _pendingEncodes.set(encodeId, resolve);
      (
        worker as unknown as {
          postMessage(
            msg: ImageBitmapEncodeWorkerParams,
            transfer: Transferable[],
          ): void;
        }
      ).postMessage(message, [bitmap]);
    });
  } catch {
    // transferToImageBitmap can throw if canvas is 0×0 or cross-origin.
    const src = canvas.toDataURL(dataURLOptions.type, dataURLOptions.quality);
    return { rr_type: 'HTMLImageElement', src };
  }
}

// TODO: unify with `replay/webgl.ts`
type CanvasVarMap = Map<string, unknown[]>;
const canvasVarMap: Map<RenderingContext, CanvasVarMap> = new Map();
export function variableListFor(ctx: RenderingContext, ctor: string) {
  let contextMap = canvasVarMap.get(ctx);
  if (!contextMap) {
    contextMap = new Map();
    canvasVarMap.set(ctx, contextMap);
  }
  if (!contextMap.has(ctor)) {
    contextMap.set(ctor, []);
  }
  return contextMap.get(ctor) as unknown[];
}

export const saveWebGLVar = (
  value: unknown,
  win: IWindow,
  ctx: RenderingContext,
): number | void => {
  if (
    !value ||
    !(isInstanceOfWebGLObject(value, win) || typeof value === 'object')
  )
    return;

  const name = value.constructor.name;
  const list = variableListFor(ctx, name);
  let index = list.indexOf(value);

  if (index === -1) {
    index = list.length;
    list.push(value);
  }
  return index;
};

// from webgl-recorder: https://github.com/evanw/webgl-recorder/blob/bef0e65596e981ee382126587e2dcbe0fc7748e2/webgl-recorder.js#L50-L77
//
// NOTE: The return type is `CanvasArg | Promise<CanvasArg>`. Most branches are
// synchronous; only `HTMLCanvasElement` with a 2D context can be async (when
// the transferToImageBitmap fast-path is active). Callers that need a resolved
// value must await with `Promise.resolve(result)`.
export function serializeArg(
  value: unknown,
  win: IWindow,
  ctx: RenderingContext,
  dataURLOptions: DataURLOptions = {},
): CanvasArg | Promise<CanvasArg> {
  if (value instanceof Array) {
    return value.map((arg) =>
      serializeArg(arg, win, ctx, dataURLOptions),
    ) as CanvasArg;
  } else if (value === null) {
    return value;
  } else if (
    value instanceof Float32Array ||
    value instanceof Float64Array ||
    value instanceof Int32Array ||
    value instanceof Uint32Array ||
    value instanceof Uint8Array ||
    value instanceof Uint16Array ||
    value instanceof Int16Array ||
    value instanceof Int8Array ||
    value instanceof Uint8ClampedArray
  ) {
    const name = value.constructor.name;
    return {
      rr_type: name,
      args: [Object.values(value)],
    };
  } else if (
    // SharedArrayBuffer disabled on most browsers due to spectre.
    // More info: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer/SharedArrayBuffer
    // value instanceof SharedArrayBuffer ||
    value instanceof ArrayBuffer
  ) {
    const name = value.constructor.name as 'ArrayBuffer';
    const base64 = encode(value);

    return {
      rr_type: name,
      base64,
    };
  } else if (value instanceof DataView) {
    const name = value.constructor.name;
    // DataView's buffer is always an ArrayBuffer — never an HTMLCanvasElement —
    // so serializeArg returns a synchronous CanvasArg here.
    return {
      rr_type: name,
      args: [
        serializeArg(value.buffer, win, ctx, dataURLOptions) as CanvasArg,
        value.byteOffset,
        value.byteLength,
      ],
    };
  } else if (value instanceof HTMLImageElement) {
    const name = value.constructor.name;
    const { src } = value;
    return {
      rr_type: name,
      src,
    };
  } else if (value instanceof HTMLCanvasElement) {
    // 2D fast-path: transfer the current frame as an ImageBitmap and encode
    // off the main thread via the image-bitmap-data-url worker. Only applies
    // when `transferToImageBitmap` and `OffscreenCanvas` are both available.
    // Falls back to synchronous `toDataURL` otherwise.
    if (supports2DFastPath()) {
      return serializeCanvas2DFastPath(value, dataURLOptions);
    }
    // Synchronous fallback (old path — preserved for back-compat).
    // TODO: move `toDataURL` to web worker if possible (this path remains
    //       for environments without OffscreenCanvas / transferToImageBitmap)
    const src = value.toDataURL(dataURLOptions.type, dataURLOptions.quality);
    return { rr_type: 'HTMLImageElement', src };
  } else if (value instanceof ImageData) {
    const name = value.constructor.name;
    // ImageData.data is a Uint8ClampedArray — never an HTMLCanvasElement —
    // so serializeArg returns a synchronous CanvasArg here.
    return {
      rr_type: name,
      args: [
        serializeArg(value.data, win, ctx, dataURLOptions) as CanvasArg,
        value.width,
        value.height,
      ],
    };
    // } else if (value instanceof Blob) {
    //   const name = value.constructor.name;
    //   return {
    //     rr_type: name,
    //     data: [serializeArg(await value.arrayBuffer(), win, ctx)],
    //     type: value.type,
    //   };
  } else if (isInstanceOfWebGLObject(value, win) || typeof value === 'object') {
    const name = value.constructor.name;
    const index = saveWebGLVar(value, win, ctx) as number;

    return {
      rr_type: name,
      index: index,
    };
  }

  return value as unknown as CanvasArg;
}

export const serializeArgs = (
  args: Array<unknown>,
  win: IWindow,
  ctx: RenderingContext,
  dataURLOptions: DataURLOptions = {},
): Array<CanvasArg | Promise<CanvasArg>> => {
  return args.map((arg) => serializeArg(arg, win, ctx, dataURLOptions));
};

export const isInstanceOfWebGLObject = (
  value: unknown,
  win: IWindow,
): value is
  | WebGLActiveInfo
  | WebGLBuffer
  | WebGLFramebuffer
  | WebGLProgram
  | WebGLRenderbuffer
  | WebGLShader
  | WebGLShaderPrecisionFormat
  | WebGLTexture
  | WebGLUniformLocation
  | WebGLVertexArrayObject => {
  const webGLConstructorNames: string[] = [
    'WebGLActiveInfo',
    'WebGLBuffer',
    'WebGLFramebuffer',
    'WebGLProgram',
    'WebGLRenderbuffer',
    'WebGLShader',
    'WebGLShaderPrecisionFormat',
    'WebGLTexture',
    'WebGLUniformLocation',
    'WebGLVertexArrayObject',
    // In old Chrome versions, value won't be an instanceof WebGLVertexArrayObject.
    'WebGLVertexArrayObjectOES',
  ];
  const supportedWebGLConstructorNames = webGLConstructorNames.filter(
    (name: string) => typeof win[name as keyof Window] === 'function',
  );
  return Boolean(
    supportedWebGLConstructorNames.find(
      (name: string) => value instanceof win[name as keyof Window],
    ),
  );
};
