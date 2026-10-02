import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { shouldInterceptClick, navigate } from '../../lib/navigation';
import { getArchiveThoughts, type Thought } from '../../lib/thoughts';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * ThoughtDrawer — pull one loose page out of the archive. Every line is real:
 * a note from the desk, a `thought` written in /admin, or a sentence lifted
 * from a journal volume, with a link back to where it was written. The drawer
 * never repeats itself until it has been emptied.
 */
export default function ThoughtDrawer({ className = '' }: { className?: string }) {
  const reduced = useReducedMotion();
  const thoughts = useMemo(() => getArchiveThoughts(), []);
  const [order] = useState(() => {
    const list = thoughts.map((_, i) => i);
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  });
  const [cursor, setCursor] = useState(0);
  const [pulled, setPulled] = useState(0);
  const pull = useCallback(() => {
    setCursor((c) => (c + 1) % Math.max(1, order.length));
    setPulled((p) => p + 1);
  }, [order.length]);

  if (thoughts.length === 0) return null;
  const thought: Thought = thoughts[order[cursor]];

  return (
    <div className={`grid grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto] ${className}`}>
      <div className="relative min-h-[11rem]" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.figure
            key={thought.id}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 26, rotate: -1.2 }}
            animate={{ opacity: 1, y: 0, rotate: -0.3 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -16, rotate: 1.5, transition: { duration: 0.35 } }}
            transition={{ duration: 0.7, ease: EASE }}
            className="manuscript relative rounded-[2px] px-7 py-7 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.75)] md:px-10"
          >
            <blockquote className="font-book text-2xl italic leading-snug text-zinc-50 md:text-[1.9rem]">“{thought.text}”</blockquote>
            <figcaption className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              {thought.href ? (
                <a
                  href={thought.href}
                  onClick={(event) => {
                    if (!shouldInterceptClick(event)) return;
                    event.preventDefault();
                    navigate(thought.href!);
                  }}
                  className="underline-offset-4 hover:text-accent hover:underline"
                >
                  {thought.source} →
                </a>
              ) : (
                thought.source
              )}
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>
      <div className="flex flex-col items-start gap-3 md:items-end">
        <button
          type="button"
          onClick={pull}
          className="inline-flex min-h-[48px] items-center gap-3 rounded-full border border-zinc-700 px-6 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-100 transition-colors hover:border-accent hover:bg-accent hover:text-canvas"
        >
          <span aria-hidden="true">❦</span> another thought
        </button>
        <span className="font-mono text-[10px] tracking-[0.14em] text-zinc-500">
          {pulled === 0 ? `${thoughts.length} loose pages in the drawer` : `${Math.min(pulled + 1, thoughts.length)} of ${thoughts.length} read`}
        </span>
      </div>
    </div>
  );
}
