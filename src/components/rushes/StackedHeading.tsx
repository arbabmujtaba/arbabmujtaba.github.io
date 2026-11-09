import { m, useReducedMotion } from 'motion/react';
import { LANDED, lift } from '../../lib/motion';

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
 * StackedHeading — the two-line display heading: grotesk, then book italic.
 *
 * Each line rises out of a clipped box and swings flat as it comes: it starts
 * tipped back 70° on its baseline, with its own perspective, so the type reads
 * as a card turning up toward you rather than a slide. Transform and opacity
 * only. Under prefers-reduced-motion the text simply fades. The clip is on a
 * wrapper, never the text node itself, so descenders are never cropped.
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
    <div data-levitate className={`max-w-3xl ${className}`}>
      <Tag
        className={`font-display font-medium leading-[0.94] tracking-[-0.055em] text-zinc-50 ${size}`}
      >
        {lines.filter(Boolean).map((line, index) => (
          /* The wrapper is what is watched for visibility, not the line. The
             line starts translated fully out of this clipping box, and an
             IntersectionObserver clips by overflow ancestors, so watching the
             line itself never fired: the headings stayed invisible and left
             blank gaps in every section. The wrapper sits in the layout, so
             it intersects normally and hands the state down by variant. */
          <m.span
            key={line}
            className="block overflow-hidden pb-[0.06em]"
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, amount: 'some' }}
          >
            <m.span
              /* The second line is the manuscript voice: the book serif, in
                 italic, a step quieter. One pairing used on every page.
                 The tilt is one transform string, perspective included, so
                 the browser plays it on the compositor (see lib/motion). */
              className={`block origin-bottom ${index === 1 ? 'font-book font-normal italic tracking-[-0.025em] text-zinc-400' : ''}`}
              variants={{
                hidden: shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, transform: 'perspective(700px) translateY(105%) rotateX(-70deg)' },
                shown: shouldReduceMotion
                  ? { opacity: 1 }
                  : {
                      opacity: 1,
                      transform: 'perspective(700px) translateY(0%) rotateX(0deg)',
                      transitionEnd: { transform: 'none' },
                    },
              }}
              transition={{
                duration: shouldReduceMotion ? 0.3 : 0.95,
                delay: shouldReduceMotion ? 0 : index * 0.12,
                ease: EASE,
              }}
            >
              {line}
            </m.span>
          </m.span>
        ))}
      </Tag>

      {body && (
        <m.p
          className="mt-6 max-w-lg text-sm font-light leading-relaxed text-zinc-400 md:text-base"
          initial={shouldReduceMotion ? { opacity: 0 } : lift(14)}
          whileInView={LANDED}
          viewport={{ once: true, amount: 'some' }}
          transition={{
            duration: shouldReduceMotion ? 0.3 : 0.8,
            delay: shouldReduceMotion ? 0 : 0.2,
            ease: EASE,
          }}
        >
          {body}
        </m.p>
      )}
    </div>
  );
}
