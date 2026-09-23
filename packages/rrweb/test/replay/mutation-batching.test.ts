import * as fs from 'fs';
import * as path from 'path';
import type * as puppeteer from 'puppeteer';
import { vi } from 'vitest';
import { launchPuppeteer } from '../utils';

describe('large live mutation batching', () => {
  vi.setConfig({ testTimeout: 30_000 });

  let browser: puppeteer.Browser;
  let page: puppeteer.Page;
  let code: string;

  beforeAll(async () => {
    browser = await launchPuppeteer();
    code = fs.readFileSync(
      path.resolve(__dirname, '../../dist/rrweb.umd.cjs'),
      'utf8',
    );
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('about:blank');
    await page.evaluate(code);
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('commits a large contiguous root run with one live-DOM insertion', async () => {
    const result = await page.evaluate(async () => {
      const startedAt = Date.now();
      const adds: Array<Record<string, unknown>> = [];
      for (let index = 0; index < 100; index++) {
        const rootId = 1_000 + index;
        adds.push({
          parentId: 5,
          nextId: index === 0 ? 6 : rootId - 1,
          node: {
            type: 2,
            tagName: 'div',
            attributes: { 'data-index': String(index) },
            childNodes: [],
            id: rootId,
          },
        });
        adds.push({
          parentId: rootId,
          nextId: null,
          node: {
            type: 2,
            tagName: 'span',
            attributes: {},
            childNodes: [],
            id: 2_000 + index,
          },
        });
      }

      const events = [
        {
          type: 4,
          timestamp: startedAt,
          data: { href: 'about:blank', width: 800, height: 600 },
        },
        {
          type: 2,
          timestamp: startedAt + 1,
          data: {
            node: {
              type: 0,
              childNodes: [
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
                      id: 3,
                    },
                    {
                      type: 2,
                      tagName: 'body',
                      attributes: {},
                      childNodes: [
                        {
                          type: 2,
                          tagName: 'div',
                          attributes: { id: 'container' },
                          childNodes: [
                            {
                              type: 2,
                              tagName: 'div',
                              attributes: { id: 'anchor' },
                              childNodes: [],
                              id: 6,
                            },
                          ],
                          id: 5,
                        },
                      ],
                      id: 4,
                    },
                  ],
                  id: 2,
                },
              ],
              id: 1,
            },
            initialOffset: { top: 0, left: 0 },
          },
        },
        {
          type: 3,
          timestamp: startedAt + 300,
          data: {
            source: 0,
            texts: [],
            attributes: [],
            removes: [],
            adds,
          },
        },
      ];

      const rrweb = (window as unknown as { rrweb: typeof import('../../src') })
        .rrweb;
      const replayer = new rrweb.Replayer(
        events as ConstructorParameters<typeof rrweb.Replayer>[0],
        {
          root: document.body,
        },
      );
      replayer.play();

      await new Promise((resolve) => setTimeout(resolve, 100));
      const container = replayer.iframe.contentDocument?.querySelector(
        '#container',
      ) as HTMLDivElement & { liveInsertions?: number };
      container.liveInsertions = 0;
      const originalInsertBefore = container.insertBefore.bind(container);
      container.insertBefore = ((node: Node, child: Node | null) => {
        container.liveInsertions = (container.liveInsertions || 0) + 1;
        return originalInsertBefore(node, child);
      }) as typeof container.insertBefore;

      await new Promise((resolve) => setTimeout(resolve, 350));
      const roots = Array.from(
        container.querySelectorAll(':scope > [data-index]'),
      );
      return {
        liveInsertions: container.liveInsertions,
        rootCount: roots.length,
        childCount: container.querySelectorAll(':scope > [data-index] > span')
          .length,
        firstIndex: roots[0]?.getAttribute('data-index'),
        lastIndex: roots.at(-1)?.getAttribute('data-index'),
      };
    });

    expect(result).toEqual({
      liveInsertions: 1,
      rootCount: 100,
      childCount: 100,
      firstIndex: '99',
      lastIndex: '0',
    });
  });
});
