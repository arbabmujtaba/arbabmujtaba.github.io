import { LazyMotion } from 'motion/react';
import type { ReactNode } from 'react';

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
