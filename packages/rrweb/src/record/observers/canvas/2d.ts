import {
  type blockClass,
  CanvasContext,
  type canvasManagerMutationCallback,
  type DataURLOptions,
  type IWindow,
  type listenerHandler,
} from '@amplitude/rrweb-types';
import { hookSetter, isBlocked, patch } from '../../../utils';
import { serializeArgs } from './serialize-args';

export default function initCanvas2DMutationObserver(
  cb: canvasManagerMutationCallback,
  win: IWindow,
  blockClass: blockClass,
  blockSelector: string | null,
  dataURLOptions: DataURLOptions = {},
): listenerHandler {
  const handlers: listenerHandler[] = [];
  const props2D = Object.getOwnPropertyNames(
    win.CanvasRenderingContext2D.prototype,
  );
  for (const prop of props2D) {
    try {
      if (
        typeof win.CanvasRenderingContext2D.prototype[
          prop as keyof CanvasRenderingContext2D
        ] !== 'function'
      ) {
        continue;
      }
      const restoreHandler = patch(
        win.CanvasRenderingContext2D.prototype,
        prop,
        function (
          original: (
            this: CanvasRenderingContext2D,
            ...args: unknown[]
          ) => void,
        ) {
          return function (
            this: CanvasRenderingContext2D,
            ...args: Array<unknown>
          ) {
            if (!isBlocked(this.canvas, blockClass, blockSelector, true)) {
              // Using setTimeout to avoid blocking the main thread.
              // serializeArgs may return Promises for canvas args (2D fast-path),
              // so we await all of them before firing the callback.
              setTimeout(() => {
                void (async () => {
                  const rawArgs = serializeArgs(
                    args,
                    win,
                    this,
                    dataURLOptions,
                  );
                  const recordArgs = await Promise.all(rawArgs);
                  cb(this.canvas, {
                    type: CanvasContext['2D'],
                    property: prop,
                    args: recordArgs,
                  });
                })();
              }, 0);
            }
            return original.apply(this, args);
          };
        },
      );
      handlers.push(restoreHandler);
    } catch {
      const hookHandler = hookSetter<CanvasRenderingContext2D>(
        win.CanvasRenderingContext2D.prototype,
        prop,
        {
          set(v) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            cb(this.canvas, {
              type: CanvasContext['2D'],
              property: prop,
              args: [v],
              setter: true,
            });
          },
        },
      );
      handlers.push(hookHandler);
    }
  }
  return () => {
    handlers.forEach((h) => h());
  };
}
