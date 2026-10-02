import { useCallback, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Note {
  id: string;
  /** The note itself. */
  text: string;
  /** The line written under it. */
  aside?: string;
  author?: string;
}

interface LastNotesProps {
  notes: Note[];
  className?: string;
  /** Milliseconds each note stays up before the next is turned over. */
  duration?: number;
  /** Heading block shown beside the stack, above the controls. */
  intro?: ReactNode;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * LastNotes — the closing notes, as a small stack of paper.
 *
 * The note on top is a bone sheet with a strip of tape; two sheets sit
 * askew beneath it. Each note writes itself in word by word (each word
 * resolving out of a soft blur), its aside is underlined by a hand-drawn
 * stroke, and after a while the sheet is lifted off the stack to reveal the
 * next.
 *
 * Timing lives in a CSS animation on the progress segment, so pausing — on
 * hover, on focus, or when the stack scrolls out of view — is one
 * `animation-play-state` and the next note is turned exactly when the bar
 * fills. Under prefers-reduced-motion nothing advances on its own and the
 * words appear at once; the arrows still turn the notes.
 */
export default function LastNotes({ notes, className = '', duration = 9000, intro }: LastNotesProps) {
  const shouldReduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.35 });
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [held, setHeld] = useState(false);

  const count = notes.length;
  const go = useCallback(
    (delta: number) => {
      setDirection(delta >= 0 ? 1 : -1);
      setActive((i) => (i + delta + count) % count);
    },
    [count]
  );

  if (count === 0) return null;
  const note = notes[active];
  const words = note.text.split(/\s+/).filter(Boolean);
  const paused = held || !inView;
  const autoplay = !shouldReduceMotion && count > 1;

  return (
    <div
      ref={rootRef}
      className={`grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20 ${className}`}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
    >
      {/* ---- the stack ---- */}
      <div className="relative order-2 mx-auto w-full max-w-xl" aria-live="polite">
        {/* sheets underneath */}
        <span
          aria-hidden="true"
          className="manuscript absolute inset-0 translate-x-3 translate-y-4 rotate-[3.2deg] rounded-[2px] opacity-45 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]"
        />
        <span
          aria-hidden="true"
          className="manuscript absolute inset-0 -translate-x-2 translate-y-2 -rotate-[1.8deg] rounded-[2px] opacity-70 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]"
        />

        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.figure
            key={note.id}
            custom={direction}
            className="manuscript relative min-h-[22rem] overflow-hidden rounded-[2px] px-7 pb-10 pt-14 text-zinc-100 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)] md:min-h-[26rem] md:px-12 md:pb-12 md:pt-16"
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 18, scale: 0.97, rotate: -1.2 }
            }
            animate={{ opacity: 1, y: 0, scale: 1, rotate: -0.4 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    x: direction > 0 ? -140 : 140,
                    y: -50,
                    rotate: direction > 0 ? -9 : 9,
                    transition: { duration: 0.7, ease: [0.55, 0, 0.75, 0.2] },
                  }
            }
            transition={{ duration: 0.8, ease: EASE }}
            style={{ zIndex: 2 }}
          >
            {/* tape */}
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-[-6px] h-7 w-28 -translate-x-1/2 rotate-[-2deg] bg-[rgba(226,97,47,0.22)] backdrop-blur-[1px]"
              style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}
            />
            {/* faint ruling */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to bottom, transparent 0, transparent 2.35rem, var(--rule) 2.35rem, var(--rule) calc(2.35rem + 1px))',
                backgroundPositionY: '3.2rem',
              }}
            />

            <div className="relative flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              <span>leaf {String(active + 1).padStart(2, '0')}</span>
              <span>of {String(count).padStart(2, '0')}</span>
            </div>

            <blockquote className="relative mt-8">
              <p className="font-book text-[2rem] italic leading-[1.12] tracking-[-0.015em] text-zinc-50 md:text-[2.9rem]">
                {words.map((word, i) => (
                  <motion.span
                    key={`${note.id}-${i}`}
                    className="inline-block whitespace-pre"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: '0.35em', filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.7, delay: 0.25 + i * 0.065, ease: EASE }}
                  >
                    {word}
                    {i < words.length - 1 ? ' ' : ''}
                  </motion.span>
                ))}
              </p>

              {(note.aside || note.author) && (
                <motion.figcaption
                  className="mt-10"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.35 + words.length * 0.065, ease: EASE }}
                >
                  {note.aside && (
                    <span className="font-book text-lg leading-relaxed text-zinc-300 md:text-xl">{note.aside}</span>
                  )}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 220 14"
                    className="mt-3 block h-3 w-44 text-accent"
                    fill="none"
                  >
                    <motion.path
                      d="M2 9 C 40 3, 70 12, 110 7 S 180 3, 218 8"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.1, delay: 0.55 + words.length * 0.065, ease: EASE }}
                    />
                  </svg>
                  {note.author && (
                    <cite className="mt-4 block font-mono text-[10px] uppercase not-italic tracking-[0.2em] text-zinc-500">
                      — {note.author}
                    </cite>
                  )}
                </motion.figcaption>
              )}
            </blockquote>
          </motion.figure>
        </AnimatePresence>
      </div>

      {/* ---- controls ---- */}
      <div className="order-1">
        {intro}
        {count > 1 && (
          <>
            <div className={`flex gap-1.5 ${intro ? 'mt-12' : ''}`} aria-label="Notes">
              {notes.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  aria-current={i === active}
                  aria-label={`Note ${i + 1} of ${count}`}
                  onClick={() => {
                    setDirection(i >= active ? 1 : -1);
                    setActive(i);
                  }}
                  className="group flex h-8 flex-1 items-center focus-visible:outline-none"
                >
                  <span className="relative block h-[2px] w-full overflow-hidden rounded-full bg-zinc-800 group-focus-visible:bg-zinc-600">
                    {i < active && <span className="absolute inset-0 bg-zinc-500" />}
                    {i === active &&
                      (autoplay ? (
                        <span
                          key={`${item.id}-${active}`}
                          className="absolute inset-y-0 left-0 w-full origin-left bg-accent"
                          style={{
                            animation: `last-notes-progress ${duration}ms linear forwards`,
                            animationPlayState: paused ? 'paused' : 'running',
                          }}
                          onAnimationEnd={() => go(1)}
                        />
                      ) : (
                        <span className="absolute inset-0 bg-accent" />
                      ))}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              {[
                { delta: -1, label: 'Previous note', Icon: ChevronLeft },
                { delta: 1, label: 'Next note', Icon: ChevronRight },
              ].map(({ delta, label, Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => go(delta)}
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-800 text-zinc-300 transition hover:border-accent hover:bg-accent hover:text-canvas focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                >
                  <Icon size={17} strokeWidth={1.6} />
                </button>
              ))}
              <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                {paused && autoplay ? 'held' : autoplay ? 'turning' : ''}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
