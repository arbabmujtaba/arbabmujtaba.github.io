import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import InkNote from '../magic/InkNote';
import { distanceKm, formatLat, PLACES } from '../../lib/places';
import type { TimelineMilestone } from '../../types';

const EASE = [0.16, 1, 0.3, 1] as const;
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

interface ChapterTimelineProps {
  milestones: TimelineMilestone[];
  className?: string;
}

/**
 * The passage between the last chapter in one city and the first in the next.
 * A line is drawn south as you scroll past it, from one latitude to the other.
 */
function Passage({ from, to }: { from: string; to: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 35%'] });
  const drawn = useSpring(scrollYProgress, { stiffness: 80, damping: 22, mass: 0.4 });
  const dot = useTransform(drawn, [0, 1], ['0%', '100%']);
  const a = PLACES.find((p) => p.name.toLowerCase() === from.toLowerCase());
  const b = PLACES.find((p) => p.name.toLowerCase() === to.toLowerCase());
  const km = a && b ? Math.round(distanceKm(a, b) / 100) * 100 : null;

  return (
    <div ref={ref} className="relative my-16 overflow-hidden rounded-[3px] border border-zinc-800 bg-canvas-raised/60 px-6 py-12 md:my-24 md:px-14 md:py-16">
      <InkNote section="timeline" className="absolute right-6 top-5 text-right md:right-12" />
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">the passage</p>
      <div className="mt-8 grid items-center gap-8 md:grid-cols-[1fr_minmax(0,2fr)_1fr]">
        <div>
          <p className="font-book text-5xl italic leading-none text-zinc-50 md:text-6xl">{from}</p>
          {a && <p className="mt-3 font-mono text-[10px] tracking-[0.18em] text-zinc-500">{formatLat(a.lat)}</p>}
        </div>

        <div className="relative h-14" aria-hidden="true">
          <svg viewBox="0 0 400 56" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
            <path d="M2 28 C 110 0, 290 56, 398 28" fill="none" stroke="var(--rule-strong)" strokeWidth="1" strokeDasharray="2 6" vectorEffect="non-scaling-stroke" />
            <motion.path
              d="M2 28 C 110 0, 290 56, 398 28"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ pathLength: reduced ? 1 : drawn }}
            />
          </svg>
          {!reduced && (
            <motion.span
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_14px_var(--accent)]"
              style={{ left: dot }}
            />
          )}
        </div>

        <div className="md:text-right">
          <p className="font-book text-5xl italic leading-none text-zinc-50 md:text-6xl">{to}</p>
          {b && <p className="mt-3 font-mono text-[10px] tracking-[0.18em] text-zinc-500">{formatLat(b.lat)}</p>}
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-xl text-center text-sm font-light leading-relaxed text-zinc-400 md:text-base">
        {km ? `About ${km.toLocaleString('en-IN')} km south. ` : ''}
        A new city, new people, a different way of living — and everything from home, carried along.
      </p>
      <a
        href="#memory-map"
        onClick={(event) => {
          const target = document.getElementById('memory-map');
          if (!target) return;
          event.preventDefault();
          target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        }}
        className="mx-auto mt-6 block w-fit font-mono text-[10px] uppercase tracking-[0.2em] text-accent underline-offset-4 hover:underline"
      >
        see it on the map ↓
      </a>
    </div>
  );
}

/**
 * ChapterTimeline — eight years as the chapters of a journal.
 *
 * A rail is drawn down the left margin as you read; each chapter is a Roman
 * numeral, a year, a title in the book face and a few lines. "Turn the page"
 * opens the rest of a chapter. Where the city changes, the chapters are
 * interrupted by the passage. A strip of years stays at hand on wide screens
 * and jumps between chapters.
 */
export default function ChapterTimeline({ milestones, className = '' }: ChapterTimelineProps) {
  const reduced = useReducedMotion();
  const railRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: railRef, offset: ['start 70%', 'end 60%'] });
  const drawn = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });
  const [open, setOpen] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

  const chapters = [...milestones]
    .filter((m) => m.visible)
    .sort((a, b) => Number(a.year) - Number(b.year) || a.order - b.order);

  // Which chapter is being read, for the year strip.
  useEffect(() => {
    const nodes = chapters.map((c) => document.getElementById(`chapter-${c.slug}`)).filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => entry.isIntersecting && setCurrent(entry.target.getAttribute('data-slug')));
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [chapters.map((c) => c.slug).join('|')]);

  const jump = (slug: string) => {
    document.getElementById(`chapter-${slug}`)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  };

  return (
    <div className={`relative ${className}`}>
      {/* the year strip */}
      <nav aria-label="Years" className="sticky top-3 z-20 -mx-2 mb-12 hidden md:block">
        <ol className="mx-auto flex w-fit items-center gap-1 rounded-full border border-zinc-800 bg-canvas/85 px-2 py-1.5 backdrop-blur">
          {chapters.map((chapter) => (
            <li key={chapter.slug}>
              <button
                type="button"
                onClick={() => jump(chapter.slug)}
                aria-current={current === chapter.slug ? 'step' : undefined}
                className={`rounded-full px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] transition-colors ${
                  current === chapter.slug ? 'bg-accent text-canvas' : 'text-zinc-500 hover:text-zinc-100'
                }`}
              >
                {chapter.year}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <ol ref={railRef} className="relative">
        <div aria-hidden="true" className="absolute bottom-0 left-[11px] top-0 w-px bg-zinc-800 md:left-[7.5rem]">
          <motion.div
            className="absolute inset-0 origin-top bg-gradient-to-b from-accent via-accent to-[var(--accent-soft)]"
            style={{ scaleY: reduced ? 1 : drawn }}
          />
        </div>

        {chapters.map((chapter, index) => {
          const previous = chapters[index - 1];
          const moved = previous?.place && chapter.place && previous.place !== chapter.place;
          const isOpen = open === chapter.slug;
          return (
            <li key={chapter.slug} className="relative">
              {moved && <Passage from={previous.place!} to={chapter.place!} />}
              <motion.article
                id={`chapter-${chapter.slug}`}
                data-slug={chapter.slug}
                className="relative grid grid-cols-1 gap-3 pb-16 pl-10 md:grid-cols-[7.5rem_1fr] md:gap-14 md:pb-24 md:pl-0"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: reduced ? 0.3 : 0.9, ease: EASE }}
              >
                {/* marker */}
                <span
                  aria-hidden="true"
                  className="absolute left-[5px] top-3 h-[13px] w-[13px] rounded-full border border-accent bg-canvas md:left-[calc(7.5rem-6px)]"
                >
                  <span className="absolute inset-[3px] rounded-full bg-accent" />
                </span>

                <div className="md:pr-8 md:text-right">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    chapter {ROMAN[index] ?? index + 1}
                  </p>
                  <p className="mt-1 font-display text-4xl font-medium leading-none tracking-[-0.06em] text-zinc-600 md:text-5xl">
                    {chapter.year}
                  </p>
                </div>

                <div className="max-w-2xl md:pl-6">
                  <h3 className="font-book text-3xl italic leading-[1.05] tracking-[-0.015em] text-zinc-50 md:text-[2.75rem]">
                    {chapter.title}
                  </h3>
                  {chapter.place && (
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">{chapter.place}</p>
                  )}
                  <p className="mt-4 text-[0.95rem] font-light leading-relaxed text-zinc-300 md:text-base">{chapter.description}</p>

                  {chapter.body.trim() && (
                    <>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            id={`chapter-body-${chapter.slug}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: reduced ? 0.2 : 0.6, ease: EASE }}
                            className="overflow-hidden"
                          >
                            <p className="mt-5 border-l border-gilt/50 pl-5 font-book text-xl italic leading-relaxed text-zinc-200">
                              {chapter.body.trim()}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`chapter-body-${chapter.slug}`}
                        onClick={() => setOpen(isOpen ? null : chapter.slug)}
                        className="mt-5 inline-flex min-h-[44px] items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-accent"
                      >
                        <span aria-hidden="true" className={`inline-block transition-transform duration-500 ${isOpen ? 'rotate-90' : ''}`}>
                          ❧
                        </span>
                        {isOpen ? 'close the page' : 'turn the page'}
                      </button>
                    </>
                  )}
                </div>
              </motion.article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
