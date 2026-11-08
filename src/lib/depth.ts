import { useReducedMotion } from 'motion/react';
import { useMediaQuery } from './useMediaQuery';

/**
 * The 3D layer's one switch.
 *
 * Pointer-driven depth (tilting cards, the hero leaning toward the cursor)
 * only makes sense with a real hovering pointer, so it is off on touch
 * screens, on narrow viewports and under prefers-reduced-motion, where every
 * 3D effect on the site falls back to the flat version it replaced.
 *
 * Every effect that reads this follows the same performance contract:
 *   - only `transform` and `opacity` move, so the compositor does the work;
 *   - values live in motion values and springs, never React state, so a
 *     pointer move or a scroll never re-renders a component;
 *   - nothing is promoted to its own layer (`will-change`) until it is
 *     actually moving, and identity transforms are written as `none`.
 */
export function usePointerDepth(): boolean {
  const reduced = useReducedMotion();
  const fine = useMediaQuery('(hover: hover) and (pointer: fine) and (min-width: 768px)');
  return fine && !reduced;
}

/**
 * Scroll-scrubbed depth (sections rotating up into place, the hero tilting
 * away) is cheaper than pointer depth and reads well with a trackpad or a
 * wheel, but on phones it fights momentum scrolling and costs battery, so it
 * is desktop-only too — and off under reduced motion.
 */
export function useScrollDepth(): boolean {
  const reduced = useReducedMotion();
  const wide = useMediaQuery('(min-width: 1024px) and (pointer: fine)');
  return wide && !reduced;
}
