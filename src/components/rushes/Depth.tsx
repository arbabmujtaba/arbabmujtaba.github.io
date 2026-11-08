import { useRef, type ReactNode } from 'react';
import { m, useScroll, useSpring, useTransform } from 'motion/react';
import { useScrollDepth } from '../../lib/depth';

interface RiseProps {
  children: ReactNode;
  className?: string;
  /** Starting tilt, in degrees, as the block enters from below. */
  tilt?: number;
}

/**
 * Rise — a block that swings up into place in 3D as it scrolls into view.
 *
 * Scrubbed, not triggered: the angle follows the scroll position, so the
 * block settles flat exactly as it reaches the reading line and tips back if
 * you scroll up again. It pivots on its top edge with its own perspective,
 * like a page being lifted toward you.
 *
 * Only the transform is driven, by a spring on scroll progress, and once the
 * block is flat its transform is `none` — so a section the reader has
 * reached costs nothing. Flat (a plain wrapper) on touch, below 1024px and
 * under reduced motion: see useScrollDepth.
 */
export function Rise({ children, className = '', tilt = 10 }: RiseProps) {
  const enabled = useScrollDepth();
  const ref = useRef<HTMLDivElement>(null);
  // 0 when the block's top meets the bottom of the window, 1 when it reaches 70% up.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.7'] });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.5 });
  const rotateX = useTransform(progress, [0, 1], [tilt, 0]);
  const y = useTransform(progress, [0, 1], [48, 0]);
  const scale = useTransform(progress, [0, 1], [0.96, 1]);

  if (!enabled)
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  return (
    <m.div
      ref={ref}
      className={className}
      style={{ rotateX, y, scale, transformPerspective: 1600, transformOrigin: '50% 0%' }}
    >
      {children}
    </m.div>
  );
}
