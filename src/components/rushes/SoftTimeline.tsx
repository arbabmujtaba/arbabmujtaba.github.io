import { useRef, type RefObject } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import type { TimelineMilestone } from '../../types';

interface SoftTimelineProps {
  milestones: TimelineMilestone[];
  /** The element that scrolls — Home scrolls an inner div, not the window. */
  scrollContainer?: RefObject<HTMLElement | null>;
  className?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * SoftTimeline — the years, drawn as you read them.
 *
 * A single hairline runs down the page; a warm line is drawn over it in step
 * with the scroll, and each year's marker fills as the line reaches it.
 * Entries alternate sides on wide screens and stack to one side on phones.
 * No boxes and no hard borders: the old bordered tiles read like error cards.
 *
 * Chronological top to bottom, so the line grows in the same direction time
 * does. Under prefers-reduced-motion the line is drawn in full and entries
 * simply fade.
 */
export default function SoftTimeline({ milestones, scrollContainer, className = '' }: SoftTimelineProps) {
  const shouldReduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    container: scrollContainer as RefObject<HTMLElement> | undefined,
    offset: ['start 70%', 'end 55%'],
  });
  const drawn = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });

  const ordered = [...milestones].sort((a, b) => Number(a.year) - Number(b.year) || a.order - b.order);

  return (
    <div ref={trackRef} className={`relative ${className}`}>
      {/* the rail */}
      <div aria-hidden="true" className="absolute bottom-0 left-[7px] top-0 w-px bg-zinc-800 md:left-1/2 md:-translate-x-1/2">
        <motion.div
          className="absolute inset-0 origin-top bg-gradient-to-b from-accent via-accent to-[var(--accent-soft)]"
          style={{ scaleY: shouldReduceMotion ? 1 : drawn }}
        />
      </div>

      <ol className="space-y-14 md:space-y-4">
        {ordered.map((milestone, index) => {
          const right = index % 2 === 1;
          return (
            <li key={milestone.slug} className="relative grid grid-cols-1 pl-10 md:grid-cols-2 md:pl-0">
              {/* marker */}
              <motion.span
                aria-hidden="true"
                className="absolute left-0 top-2 flex h-[15px] w-[15px] items-center justify-center rounded-full border border-zinc-700 bg-canvas md:left-1/2 md:top-3 md:-translate-x-1/2"
                initial={{ scale: shouldReduceMotion ? 1 : 0.6, borderColor: 'var(--rule-strong)' }}
                whileInView={{ scale: 1, borderColor: 'var(--accent)' }}
                viewport={{ once: true, margin: '0px 0px -35% 0px' }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <motion.span
                  className="block h-[7px] w-[7px] rounded-full bg-accent"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, margin: '0px 0px -35% 0px' }}
                  transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
                />
              </motion.span>

              <motion.div
                className={`md:py-6 ${right ? 'md:col-start-2 md:pl-16' : 'md:col-start-1 md:pr-16 md:text-right'}`}
                initial={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, x: right ? 28 : -28, filter: 'blur(6px)' }
                }
                whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: shouldReduceMotion ? 0.3 : 1, ease: EASE }}
              >
                <span className="block font-display text-5xl font-medium leading-none tracking-[-0.06em] text-zinc-600 md:text-7xl">
                  {milestone.year}
                </span>
                <h3 className="mt-3 font-display text-xl font-medium tracking-[-0.03em] text-zinc-50 md:text-2xl">
                  {milestone.title}
                </h3>
                <p
                  className={`mt-3 max-w-md text-sm font-light leading-relaxed text-zinc-400 ${
                    right ? '' : 'md:ml-auto'
                  }`}
                >
                  {milestone.description}
                </p>
              </motion.div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
