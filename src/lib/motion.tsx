import { LazyMotion, type TargetAndTransition } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Entrance motion that runs on the compositor.
 *
 * motion hands `opacity` and a `transform` string to the browser as a Web
 * Animation, which the compositor plays without the main thread. Its
 * shorthand `y`, `scale` and `rotateX` are stepped in JavaScript instead,
 * writing styles on every frame. With a dozen blocks fading up at once as a
 * section scrolls in, that was most of the main-thread work mid-page.
 *
 * `lift(18)` is the hidden state; `LANDED` the shown one (or `landed(...)`
 * with the identity of any extra functions passed to `lift`, so the two
 * lists match). A perspective, if the block turns in 3D, goes in the string
 * too: motion's `transformPerspective` on the same element would rebuild
 * the transform itself. Once it lands the transform is cleared, so the block
 * leaves no stacking context behind.
 */
const transform = (offset: string, extra: string, perspective?: number) =>
  [perspective ? `perspective(${perspective}px)` : '', `translateY(${offset})`, extra].filter(Boolean).join(' ');

export function lift(y: number | string, extra = '', perspective?: number): TargetAndTransition {
  return { opacity: 0, transform: transform(typeof y === 'number' ? `${y}px` : y, extra, perspective) };
}

export function landed(extra = '', perspective?: number): TargetAndTransition {
  return { opacity: 1, transform: transform('0px', extra, perspective), transitionEnd: { transform: 'none' } };
}

export const LANDED = landed();

/**
 * Drag, pan and shared-layout animation live in motion's `domMax` bundle,
 * which the root provider (main.tsx) leaves out. A component that needs them
 * wraps itself in <MaxMotion>; the features arrive in their own chunk on
 * first use and stay registered for the rest of the visit.
 */
const loadDomMax = () => import('./motionMax').then((mod) => mod.default);

export function MaxMotion({ children }: { children: ReactNode }) {
  return <LazyMotion features={loadDomMax}>{children}</LazyMotion>;
}
