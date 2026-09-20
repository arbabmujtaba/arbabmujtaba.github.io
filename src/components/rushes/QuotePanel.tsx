import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export interface QuoteEntry {
  id: string;
  quote: string;
  /** Attribution name. Optional — many of these are unattributed notes. */
  name?: string;
  /** Smaller uppercase line under the name. */
  role?: string;
}

interface QuotePanelProps {
  entries: QuoteEntry[];
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * QuotePanel — the raised panel that holds one quote at a time.
 *
 * The quote is set in tracked uppercase mono so it reads as a transcript rather
 * than a pull quote. Navigation dots are real buttons with labels, and the
 * crossfade is skipped under prefers-reduced-motion.
 */
export default function QuotePanel({
  entries,
  activeIndex,
  onSelect,
  className = '',
}: QuotePanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const active = entries[activeIndex];

  if (!active) return null;

  return (
    <div
      className={`relative border border-zinc-800 bg-canvas-raised px-5 py-14 md:px-16 md:py-24 ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.blockquote
          key={active.id}
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="font-mono text-xs uppercase leading-[1.9] tracking-[0.06em] text-zinc-200 md:text-base md:leading-[2]">
            {active.quote}
          </p>

          {(active.name || active.role) && (
            <footer className="mt-10">
              <span
                aria-hidden="true"
                className="mx-auto mb-6 block h-1 w-1 rotate-45 bg-zinc-600"
              />
              {active.name && (
                <cite className="block font-display text-base not-italic text-zinc-300">
                  {active.name}
                </cite>
              )}
              {active.role && (
                <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  {active.role}
                </span>
              )}
            </footer>
          )}
        </motion.blockquote>
      </AnimatePresence>

      {entries.length > 1 && (
        <div className="mt-12 flex items-center justify-center gap-3">
          {entries.map((entry, index) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`Show note ${index + 1} of ${entries.length}`}
              aria-current={index === activeIndex}
              className="flex h-11 w-6 items-center justify-center"
            >
              <span
                className={`block h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? 'scale-125 bg-accent'
                    : 'bg-zinc-700 hover:bg-zinc-500'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
