const OVERFLOW_SCROLLABLE = new Set(['auto', 'scroll', 'overlay', 'hidden']);
const MAX_ELEMENTS_TO_CHECK = 2000;

/**
 * Returns the full page dimension (height or width) by combining standard
 * document/body measurements with a scan for nested scroll containers.
 *
 * Handles the common SPA pattern where html/body are `height:100%; overflow:hidden`
 * and a deeper descendant is the real scroll container.
 *
 * @param excludeEl - An optional element to skip during the scan (e.g. an
 *                    injected host element that should not influence measurements).
 */
export function getFullPageDimension(
  axis: 'height' | 'width',
  excludeEl?: HTMLElement | null,
): number {
  const isHeight = axis === 'height';
  const doc = document.documentElement;
  const body = document.body;

  let max = isHeight
    ? Math.max(body.scrollHeight, body.offsetHeight, doc.scrollHeight, doc.offsetHeight, doc.clientHeight)
    : Math.max(body.scrollWidth, body.offsetWidth, doc.scrollWidth, doc.offsetWidth, doc.clientWidth);

  const els = document.body.querySelectorAll('*');
  const limit = Math.min(els.length, MAX_ELEMENTS_TO_CHECK);
  for (let i = 0; i < limit; i++) {
    const el = els[i];
    if (el === excludeEl || !(el instanceof HTMLElement)) continue;

    const scrollDim = isHeight ? el.scrollHeight : el.scrollWidth;
    const clientDim = isHeight ? el.clientHeight : el.clientWidth;
    if (scrollDim <= clientDim) continue;

    const style = getComputedStyle(el);
    const overflow = isHeight ? style.overflowY : style.overflowX;
    if (OVERFLOW_SCROLLABLE.has(overflow)) {
      max = Math.max(max, scrollDim);
    }
  }

  return max;
}

const FREEZE_ANIMATIONS_CSS = `*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
}`;

/**
 * Finishes all running animations/transitions so the DOM reflects end-state,
 * then injects a stylesheet that prevents them from replaying when the
 * snapshot is rendered.
 *
 * @returns A cleanup function that removes the injected stylesheet.
 */
export function freezeAnimations(): () => void {
  for (const anim of document.getAnimations()) {
    try {
      anim.finish();
    } catch {
      // finish() throws on infinite animations; cancel them instead
      // so they don't leave elements in a mid-animation state.
      anim.cancel();
    }
  }

  const style = document.createElement('style');
  style.setAttribute('data-amp-freeze', '');
  style.textContent = FREEZE_ANIMATIONS_CSS;
  document.head.appendChild(style);

  return () => style.remove();
}
