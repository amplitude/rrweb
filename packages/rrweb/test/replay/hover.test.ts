import * as fs from 'fs';
import * as path from 'path';
import { vi } from 'vitest';
import { hideMouseAnimation, launchPuppeteer, waitForRAF } from '../utils';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import type * as puppeteer from 'puppeteer';
import events from '../events/hover';

interface ISuite {
  code: string;
  styles: string;
  browser: puppeteer.Browser;
  page: puppeteer.Page;
}

expect.extend({ toMatchImageSnapshot });

describe('replayer', function () {
  vi.setConfig({ testTimeout: 20_000, hookTimeout: 30_000 });

  let code: ISuite['code'];
  let styles: ISuite['styles'];
  let browser: ISuite['browser'];
  let page: ISuite['page'];

  beforeAll(async () => {
    browser = await launchPuppeteer();

    const bundlePath = path.resolve(__dirname, '../../dist/rrweb.umd.cjs');
    const stylePath = path.resolve(
      __dirname,
      '../../src/replay/styles/style.css',
    );
    code = fs.readFileSync(bundlePath, 'utf8');
    styles = fs.readFileSync(stylePath, 'utf8');
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('about:blank');
    await page.addStyleTag({
      content: styles,
    });
    await page.evaluate(code);
    await page.evaluate(`let events = ${JSON.stringify(events)}`);
    await hideMouseAnimation(page);

    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('hover', () => {
    it('should trigger hover on mouseDown', async () => {
      await page.evaluate(`
      const { Replayer } = rrweb;
      window.replayer = new Replayer(events);
      window.replayer.pause(110); // mouseDown event is at 100
    `);

      await page.waitForFunction(() => {
        const iframe = document.querySelector('.replayer-wrapper iframe');
        const doc = iframe?.contentDocument;
        const div = doc?.querySelector('div');
        if (!div || !doc?.defaultView) return false;
        return (
          doc.defaultView.getComputedStyle(div).backgroundColor ===
          'rgb(255, 215, 0)'
        );
      });

      await waitForRAF(page);

      const image = await page.screenshot();
      expect(image).toMatchImageSnapshot({
        failureThreshold: 0.05,
        failureThresholdType: 'percent',
      });
    });
  });
});
