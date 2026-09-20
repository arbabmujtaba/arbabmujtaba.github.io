import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface CountUpProps {
  value: number;
  /** Rendered immediately after the number, e.g. "+" or "M+". */
  suffix?: string;
  /** Seconds the count takes. */
  duration?: number;
  className?: string;
}

/**
 * CountUp — a number that ticks up to its value the first time it scrolls into
 * view.
 *
 * Driven by requestAnimationFrame with an eased curve, and cancelled on unmount
 * so a fast route change cannot leave a frame loop running. Under
 * prefers-reduced-motion the final value renders immediately, so the
 * information is never withheld.
 */
export default function CountUp({
  value,
  suffix = '',
  duration = 1.6,
  className = '',
}: CountUpProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(shouldReduceMotion ? value : 0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplay(value);
      return;
    }

    const node = ref.current;
    if (!node) return;

    let frame = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasRun.current) return;
        hasRun.current = true;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const elapsed = (now - start) / (duration * 1000);
          const progress = Math.min(elapsed, 1);
          // easeOutExpo — fast start, long settle
          const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          setDisplay(Math.round(value * eased));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [value, duration, shouldReduceMotion]);

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}
