/**
 * @vitest-environment jsdom
 *
 * Regression coverage for SR-4667: the dominant root cause of the GoFundMe
 * mobile-web "text rendered on top of itself" replay was a capture-side CSS
 * serialization gap. Real Chrome serializes the `grid` / `grid-template`
 * shorthand lossily — a multi-row `grid-template-areas` value combined with
 * named grid lines collapses to a single-row template in `CSSStyleRule.cssText`,
 * so children pinned to named areas overlap on replay.
 *
 * IMPORTANT TEST-ENV CAVEAT: neither jsdom nor happy-dom reproduces Chrome's
 * lossy CSSOM serialization. They store the grid shorthand verbatim (which
 * actually preserves the template) and return "" from
 * `rule.style.getPropertyValue('grid-template-areas')` for shorthand input.
 * The original capture-side loss therefore cannot be reproduced here; it can
 * only be confirmed definitively with a real-Chrome capture. These tests
 * exercise the defensive fix directly against a simulated lossy rule, plus a
 * round-trip guard through `stringifyStylesheet`.
 */
import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  fixGridTemplateSerialization,
  stringifyStylesheet,
} from '../src/utils';

/**
 * Build a minimal `CSSStyleRule` stand-in that mimics Chrome's behaviour: the
 * CSSOM longhands are intact, but the serialized `cssText` has dropped the
 * multi-row areas down to a single-row template.
 */
function makeRule(
  cssText: string,
  longhands: Record<string, string>,
): CSSStyleRule {
  return {
    selectorText: '.p-campaign',
    cssText,
    style: {
      getPropertyValue: (prop: string) => longhands[prop] ?? '',
    },
  } as unknown as CSSStyleRule;
}

describe('fixGridTemplateSerialization (SR-4667)', () => {
  it('re-emits grid-template longhands when the serialized rule has collapsed a multi-row areas template', () => {
    const lossyCssText =
      '.p-campaign { display: grid; grid-template: "partner-banner" / 1fr; }';
    const rule = makeRule(lossyCssText, {
      'grid-template-areas':
        '"header" "collage" "byline" "content" "description" "sidebar"',
      'grid-template-rows': 'auto auto auto 1fr auto auto',
      'grid-template-columns': '1fr',
    });

    const out = fixGridTemplateSerialization(rule, lossyCssText);

    expect(out).toContain(
      'grid-template-areas: "header" "collage" "byline" "content" "description" "sidebar"',
    );
    expect(out).toContain('grid-template-rows: auto auto auto 1fr auto auto');
    expect(out).toContain('grid-template-columns: 1fr');
    // existing declarations are preserved
    expect(out).toContain('display: grid');
    // output is still a well-formed single rule
    expect(out.match(/}/g)).toHaveLength(1);
    expect(out.trimEnd().endsWith('}')).toBe(true);
  });

  it('omits grid-template-rows / -columns longhands that are not set', () => {
    const lossyCssText = '.p-campaign { grid-template: "a" / none; }';
    const rule = makeRule(lossyCssText, {
      'grid-template-areas': '"header" "content"',
    });

    const out = fixGridTemplateSerialization(rule, lossyCssText);

    expect(out).toContain('grid-template-areas: "header" "content"');
    expect(out).not.toContain('grid-template-rows');
    expect(out).not.toContain('grid-template-columns');
  });

  it('is a no-op when the serialized rule already contains the full areas value', () => {
    const cssText =
      '.p-campaign { grid-template-areas: "header" "content" "description"; }';
    const rule = makeRule(cssText, {
      'grid-template-areas': '"header" "content" "description"',
    });

    expect(fixGridTemplateSerialization(rule, cssText)).toBe(cssText);
  });

  it('is a no-op when grid-template-areas is unset or none', () => {
    const cssText = '.box { color: red; }';
    expect(fixGridTemplateSerialization(makeRule(cssText, {}), cssText)).toBe(
      cssText,
    );
    expect(
      fixGridTemplateSerialization(
        makeRule(cssText, { 'grid-template-areas': 'none' }),
        cssText,
      ),
    ).toBe(cssText);
  });

  it('does not throw when rule.style is unavailable', () => {
    const cssText = '.box { color: red; }';
    const brokenRule = {
      selectorText: '.box',
      cssText,
      get style(): CSSStyleDeclaration {
        throw new Error('no style');
      },
    } as unknown as CSSStyleRule;
    expect(fixGridTemplateSerialization(brokenRule, cssText)).toBe(cssText);
  });

  it('preserves a multi-row grid-template-areas authored as longhands through stringifyStylesheet', () => {
    // Round-trip guard: authoring the longhands directly should always survive
    // serialization (this path is faithful even in real Chrome).
    const dom = new JSDOM(
      `<style>.p-campaign{display:grid;grid-template-areas:"header" "content" "description";grid-template-rows:auto 1fr auto;grid-template-columns:1fr;}</style>`,
    );
    const style = dom.window.document.querySelector('style');
    const out = stringifyStylesheet(style!.sheet as unknown as CSSStyleSheet);
    expect(out).toContain('"header" "content" "description"');
  });
});
