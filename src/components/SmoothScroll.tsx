import { useEffect } from 'react';
import Lenis from 'lenis';
import { registerSmoothScroll } from '../lib/scroll';
import { isScrollLocked, onScrollLockChange } from '../lib/scrollLock';

/**
 * SmoothScroll — inertial wheel scrolling for the whole site (Lenis).
 *
 * It still scrolls the window, so `useScroll()`, `position: sticky` and every
 * `whileInView` keep working unchanged. App.tsx mounts it only for a fine
 * pointer without reduced motion, and never on /admin; touch keeps native
 * momentum scrolling.
 *
 * Three agreements with the rest of the site:
 *   - a scroll lock (quick look, lightbox, rooms, palette) stops it, so the
 *     page behind an overlay cannot drift;
 *   - nested scroll areas (`.custom-scrollbar`, modal bodies, anything marked
 *     `data-lenis-prevent`) scroll natively;
 *   - `resetAllScrolls()` jumps it to the top on every route change.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      smoothWheel: true,
      allowNestedScroll: true,
      prevent: (node) => !!node.closest?.('[data-lenis-prevent], .custom-scrollbar, [role="dialog"]'),
    });

    if (isScrollLocked()) lenis.stop();
    const offLock = onScrollLockChange((locked) => (locked ? lenis.stop() : lenis.start()));
    const offRegistry = registerSmoothScroll({
      scrollTo: (target, options) => lenis.scrollTo(target, options),
    });

    return () => {
      offLock();
      offRegistry();
      lenis.destroy();
    };
  }, []);

  return null;
}
