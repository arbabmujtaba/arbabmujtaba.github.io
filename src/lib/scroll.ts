/**
 * The smooth scroller, when one is running (components/SmoothScroll.tsx — fine
 * pointers only, never under reduced motion). It keeps its own idea of where
 * the page is, so a jump that bypasses it would be undone on the next frame.
 */
export interface SmoothScroller {
  scrollTo(target: number | HTMLElement, options?: { offset?: number; immediate?: boolean; force?: boolean }): void;
}

let smooth: SmoothScroller | null = null;

export function registerSmoothScroll(scroller: SmoothScroller): () => void {
  smooth = scroller;
  return () => {
    if (smooth === scroller) smooth = null;
  };
}

export function resetAllScrolls(): void {
  smooth?.scrollTo(0, { immediate: true, force: true });
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }
  if (typeof document !== 'undefined') {
    document.querySelectorAll('.custom-scrollbar').forEach((el) => {
      el.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }
}

/** Glide to an element: through the smooth scroller when it runs, natively otherwise. */
export function scrollToElement(element: HTMLElement, offset = 0): void {
  if (smooth) {
    smooth.scrollTo(element, { offset });
    return;
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = element.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
}
