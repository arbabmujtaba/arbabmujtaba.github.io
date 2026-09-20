import { useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

interface MarqueeProps {
  children: ReactNode;
  /** Seconds for one full pass. Lower is faster. */
  duration?: number;
  /** Scroll right-to-left (default) or left-to-right. */
  reverse?: boolean;
  /** Fade the left/right edges into the canvas. */
  fade?: boolean;
  className?: string;
}

/**
 * Marquee — seamless horizontal ticker.
 *
 * The track holds three copies of the children so the loop has no visible seam
 * at any viewport width, and the animation is pure CSS (see @keyframes
 * rushes-marquee in index.css) so it runs off the compositor rather than the
 * main thread. Under prefers-reduced-motion the track renders once, static and
 * horizontally scrollable, so no content becomes unreachable.
 */
export default function Marquee({
  children,
  duration = 32,
  reverse = false,
  fade = true,
  className = '',
}: MarqueeProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div
        className={`custom-scrollbar flex w-full gap-10 overflow-x-auto ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`group relative w-full overflow-hidden ${className}`}
      data-marquee-fade={fade ? 'true' : undefined}
    >
      <div
        className="flex w-max gap-10 will-change-transform group-hover:[animation-play-state:paused]"
        style={{
          animation: `rushes-marquee ${duration}s linear infinite${
            reverse ? ' reverse' : ''
          }`,
        }}
      >
        <div className="flex shrink-0 items-center gap-10">{children}</div>
        <div aria-hidden="true" className="flex shrink-0 items-center gap-10">
          {children}
        </div>
        <div aria-hidden="true" className="flex shrink-0 items-center gap-10">
          {children}
        </div>
      </div>
    </div>
  );
}
