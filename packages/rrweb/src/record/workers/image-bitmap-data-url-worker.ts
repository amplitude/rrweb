import { encode } from 'base64-arraybuffer';
import type {
  DataURLOptions,
  ImageBitmapDataURLWorkerParams,
  ImageBitmapDataURLWorkerResponse,
  ImageBitmapEncodeWorkerParams,
  ImageBitmapEncodeWorkerResponse,
} from '@amplitude/rrweb-types';

const lastBlobMap: Map<number, string> = new Map();
const transparentBlobMap: Map<string, string> = new Map();

export interface ImageBitmapDataURLRequestWorker {
  postMessage: (
    message: ImageBitmapDataURLWorkerParams | ImageBitmapEncodeWorkerParams,
    transfer?: [ImageBitmap],
  ) => void;
  onmessage: (
    message: MessageEvent<
      ImageBitmapDataURLWorkerResponse | ImageBitmapEncodeWorkerResponse
    >,
  ) => void;
}

interface ImageBitmapDataURLResponseWorker {
  onmessage:
    | null
    | ((
        message: MessageEvent<
          ImageBitmapDataURLWorkerParams | ImageBitmapEncodeWorkerParams
        >,
      ) => void);
  postMessage(
    e: ImageBitmapDataURLWorkerResponse | ImageBitmapEncodeWorkerResponse,
  ): void;
}

async function getTransparentBlobFor(
  width: number,
  height: number,
  dataURLOptions: DataURLOptions,
): Promise<string> {
  const id = `${width}-${height}`;
  if ('OffscreenCanvas' in globalThis) {
    if (transparentBlobMap.has(id)) return transparentBlobMap.get(id)!;
    const offscreen = new OffscreenCanvas(width, height);
    offscreen.getContext('2d'); // creates rendering context for `converToBlob`
    const blob = await offscreen.convertToBlob(dataURLOptions); // takes a while
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = encode(arrayBuffer); // cpu intensive
    transparentBlobMap.set(id, base64);
    return base64;
  } else {
    return '';
  }
}

// `as any` because: https://github.com/Microsoft/TypeScript/issues/20595
const worker: ImageBitmapDataURLResponseWorker = self;

/**
 * Encode an ImageBitmap to a base64 string using OffscreenCanvas.
 * Used by both the FPS sampling path and the 2D fast-path.
 */
async function encodeBitmap(
  bitmap: ImageBitmap,
  dataURLOptions: DataURLOptions,
): Promise<{ base64: string; type: string }> {
  const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = offscreen.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await offscreen.convertToBlob(dataURLOptions);
  const type = blob.type;
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = encode(arrayBuffer);
  return { base64, type };
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
worker.onmessage = async function (e) {
  if ('OffscreenCanvas' in globalThis) {
    // One-shot encode path: used by the 2D transferToImageBitmap fast-path in
    // serialize-args.ts. Identified by the presence of `encodeId`.
    if ('encodeId' in e.data) {
      const { encodeId, bitmap, dataURLOptions } = e.data;
      const { base64, type } = await encodeBitmap(bitmap, dataURLOptions);
      return worker.postMessage({ encodeId, base64, type });
    }

    // FPS sampling path (original behaviour).
    const { id, bitmap, width, height, dataURLOptions } = e.data;

    const transparentBase64 = getTransparentBlobFor(
      width,
      height,
      dataURLOptions,
    );

    const offscreen = new OffscreenCanvas(width, height);
    const ctx = offscreen.getContext('2d')!;

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await offscreen.convertToBlob(dataURLOptions); // takes a while
    const type = blob.type;
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = encode(arrayBuffer); // cpu intensive

    // on first try we should check if canvas is transparent,
    // no need to save it's contents in that case
    if (!lastBlobMap.has(id) && (await transparentBase64) === base64) {
      lastBlobMap.set(id, base64);
      return worker.postMessage({ id });
    }

    if (lastBlobMap.get(id) === base64) return worker.postMessage({ id }); // unchanged
    worker.postMessage({
      id,
      type,
      base64,
      width,
      height,
    });
    lastBlobMap.set(id, base64);
  } else {
    if ('encodeId' in e.data) {
      // OffscreenCanvas unavailable — caller must fall back to toDataURL.
      return;
    }
    return worker.postMessage({ id: e.data.id });
  }
};
