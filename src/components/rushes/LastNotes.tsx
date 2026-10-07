import { useCallback, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion, type PanInfo, type Variants } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMediaQuery } from '../../lib/useMediaQuery';

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
/** A swipe turns the leaf past this distance, or on a flick faster than this. */
const SWIPE_PX = 56;
const SWIPE_VELOCITY = 380;

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
 *
 * On a touch screen the top sheet can be swiped: left for the next leaf, right
 * for the one before, and it leaves the stack the way it was thrown. Drag is
 * horizontal only (motion sets `touch-action: pan-y`), so scrolling past the
 * stack still scrolls. A mouse doesn't drag it — that would fight selecting
 * the text.
 */
export default function LastNotes({ notes, className = '', duration = 9000, intro }: LastNotesProps) {
  const shouldReduceMotion = useReducedMotion();
  const touch = useMediaQuery('(pointer: coarse)');
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.35 });
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [held, setHeld] = useState(false);
  const [dragging, setDragging] = useState(false);

  const count = notes.length;
  const go = useCallback(
    (delta: number) => {
      setDirection(delta >= 0 ? 1 : -1);
      setActive((i) => (i + delta + count) % count);
    },
    [count]
  );

  const onSwipe = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    setDragging(false);
    const { offset, velocity } = info;
    if (offset.x < -SWIPE_PX || velocity.x < -SWIPE_VELOCITY) go(1);
    else if (offset.x > SWIPE_PX || velocity.x > SWIPE_VELOCITY) go(-1);
  };

  if (count === 0) return null;
  const note = notes[active];
  const words = note.text.split(/\s+/).filter(Boolean);
  const paused = held || dragging || !inView;
  const autoplay = !shouldReduceMotion && count > 1;
  const swipeable = touch && count > 1;

  // The top sheet: lifted in, then thrown off the way it is going. `leave`
  // takes the direction from AnimatePresence's `custom`, because the exiting
  // sheet's own props are from the render before the turn.
  const sheet: Variants = {
    enter: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 0, y: 18, scale: 0.97, rotate: -1.2 },
    rest: { opacity: 1, x: 0, y: 0, scale: 1, rotate: -0.4 },
    leave: (dir: number) =>
      shouldReduceMotion
        ? { opacity: 0, transition: { duration: 0.3 } }
        : {
            opacity: 0,
            x: dir > 0 ? -200 : 200,
            y: -50,
            rotate: dir > 0 ? -9 : 9,
            transition: { duration: 0.6, ease: [0.55, 0, 0.75, 0.2] },
          },
  };

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
            variants={sheet}
            initial="enter"
            animate="rest"
            exit="leave"
            className="manuscript leaf-sheet relative min-h-[22rem] overflow-hidden rounded-[2px] px-7 pb-10 pt-14 text-zinc-100 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)] will-change-transform md:min-h-[26rem] md:px-12 md:pb-12 md:pt-16"
            transition={{ duration: 0.8, ease: EASE }}
            style={{ zIndex: 2 }}
            drag={swipeable ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.75}
            dragMomentum={false}
            onDragStart={() => setDragging(true)}
            onDragEnd={onSwipe}
            whileDrag={shouldReduceMotion ? undefined : { scale: 1.015, rotate: 0 }}
          >
            {/* grain on its own layer, rasterised once — see .leaf-sheet */}
            <span aria-hidden="true" className="leaf-grain" />
            {/* tape — no backdrop blur: on a moving sheet it re-samples what's behind every frame */}
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-[-6px] h-7 w-28 -translate-x-1/2 rotate-[-2deg] bg-[rgba(226,97,47,0.22)]"
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
                {/* A CSS animation per word (opacity + transform only), so the
                    compositor runs it — no blur, no per-frame JS. */}
                {words.map((word, i) => (
                  <span
                    key={`${note.id}-${i}`}
                    className="leaf-word inline-block whitespace-pre"
                    style={{ animationDelay: `${250 + i * 65}ms` }}
                  >
                    {word}
                    {i < words.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </p>

              {(note.aside || note.author) && (
                <figcaption className="leaf-caption mt-10" style={{ animationDelay: `${350 + words.length * 65}ms` }}>
                  {note.aside && (
                    <span className="font-book text-lg leading-relaxed text-zinc-300 md:text-xl">{note.aside}</span>
                  )}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 220 14"
                    className="mt-3 block h-3 w-44 text-accent"
                    fill="none"
                  >
                    <path
                      d="M2 9 C 40 3, 70 12, 110 7 S 180 3, 218 8"
                      pathLength={1}
                      className="leaf-stroke"
                      style={{ animationDelay: `${550 + words.length * 65}ms` }}
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  {note.author && (
                    <cite className="mt-4 block font-mono text-[10px] uppercase not-italic tracking-[0.2em] text-zinc-500">
                      — {note.author}
                    </cite>
                  )}
                </figcaption>
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
                {swipeable ? 'swipe the leaf' : paused && autoplay ? 'held' : autoplay ? 'turning' : ''}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
