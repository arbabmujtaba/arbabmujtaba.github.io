import { motion, useReducedMotion } from 'motion/react';

interface StackedHeadingProps {
  /** Two display lines. The second is rendered in a muted ink. */
  lines: [string, string?];
  /** Supporting paragraph under the heading. */
  body?: string;
  /** Tailwind size classes for the display lines. */
  size?: string;
  className?: string;
  as?: 'h1' | 'h2';
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * StackedHeading — the two-line lowercase display heading.
 *
 * Each line wipes up from a clipped box. The clip animation is skipped under
 * prefers-reduced-motion (the text simply fades), and because the wipe uses
 * clip-path on a wrapper rather than the text node itself, descenders are never
 * cropped.
 */
export default function StackedHeading({
  lines,
  body,
  size = 'text-4xl md:text-6xl lg:text-7xl',
  className = '',
  as = 'h2',
}: StackedHeadingProps) {
  const shouldReduceMotion = useReducedMotion();
  const Tag = as;

  return (
    <div className={`max-w-3xl ${className}`}>
      <Tag
        className={`font-display font-medium lowercase leading-[0.94] tracking-[-0.055em] text-zinc-50 ${size}`}
      >
        {lines.filter(Boolean).map((line, index) => (
          <span key={line} className="block overflow-hidden pb-[0.06em]">
            <motion.span
              className={`block ${index === 1 ? 'text-zinc-400' : ''}`}
              initial={
                shouldReduceMotion ? { opacity: 0 } : { y: '105%', opacity: 0 }
              }
              whileInView={{ y: 0, opacity: 1 }}
              /* `some` rather than a ratio: the span starts translated fully out
                 of its clipping wrapper, so a percentage threshold can never be
                 satisfied and the heading would stay permanently hidden. */
              viewport={{ once: true, amount: 'some' }}
              transition={{
                duration: shouldReduceMotion ? 0.3 : 0.95,
                delay: shouldReduceMotion ? 0 : index * 0.12,
                ease: EASE,
              }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </Tag>

      {body && (
        <motion.p
          className="mt-6 max-w-lg text-sm font-light leading-relaxed text-zinc-400 md:text-base"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 'some' }}
          transition={{
            duration: shouldReduceMotion ? 0.3 : 0.8,
            delay: shouldReduceMotion ? 0 : 0.2,
            ease: EASE,
          }}
        >
          {body}
        </motion.p>
      )}
    </div>
  );
}
