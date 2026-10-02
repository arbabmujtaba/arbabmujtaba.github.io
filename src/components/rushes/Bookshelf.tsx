import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { shouldInterceptClick } from '../../lib/navigation';
import { useOpenEntry } from '../../lib/entryNavigation';
import { useMagic } from '../../lib/magic';
import { isRoomEnabled } from '../../lib/secrets';
import type { JournalEntry } from '../../types';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Spine heights and widths, so the shelf looks shelved rather than stamped. */
const SIZES = [
  [124, 34],
  [138, 38],
  [116, 32],
  [142, 36],
  [130, 40],
  [120, 34],
  [134, 30],
];

/**
 * Bookshelf — every journal volume as a spine, oldest on the left. Each spine
 * opens its volume. At the end of the shelf one book has no title and leans a
 * little: pull it, and the shelf swings aside onto the Restricted Section.
 */
export default function Bookshelf({ volumes, className = '' }: { volumes: JournalEntry[]; className?: string }) {
  const reduced = useReducedMotion();
  const openEntry = useOpenEntry();
  const { openRoom, wand } = useMagic();
  const [pulled, setPulled] = useState(false);
  const door = isRoomEnabled('library');
  const shelf = [...volumes].sort((a, b) => (a.volume ?? 0) - (b.volume ?? 0));

  const pull = () => {
    if (pulled) return;
    setPulled(true);
    window.setTimeout(() => {
      openRoom('library');
      setPulled(false);
    }, reduced ? 50 : 900);
  };

  return (
    <motion.div
      className={`relative ${className}`}
      animate={pulled && !reduced ? { rotateY: -8, x: -10 } : { rotateY: 0, x: 0 }}
      transition={{ duration: 0.9, ease: EASE }}
      style={{ transformPerspective: 1200, transformOrigin: 'left center' }}
    >
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">the shelf · every volume so far</p>
      <div className="flex items-end gap-[3px] overflow-x-auto pb-px [scrollbar-width:none]">
        {shelf.map((entry, i) => {
          const [h, w] = SIZES[i % SIZES.length];
          return (
            <a
              key={entry.slug}
              href={`/journal/${entry.slug}`}
              onClick={(event) => {
                if (!shouldInterceptClick(event)) return;
                event.preventDefault();
                openEntry('journal', entry.slug);
              }}
              title={entry.title}
              aria-label={`Vol. ${String(entry.volume ?? i + 1).padStart(2, '0')} — ${entry.title}`}
              className="group relative flex shrink-0 flex-col items-center gap-2 overflow-hidden rounded-t-[2px] border border-zinc-700 bg-canvas-raised px-1 pb-2 pt-2.5 transition-[translate,border-color,background-color] duration-500 hover:-translate-y-2 hover:border-accent focus-visible:-translate-y-2 focus-visible:border-accent focus-visible:outline-none"
              style={{ height: h, width: w }}
            >
              <span className="h-px w-full shrink-0 bg-gilt/50" />
              <span className="min-h-0 flex-1 overflow-hidden whitespace-nowrap font-book text-[13px] italic leading-none text-zinc-300 [text-overflow:ellipsis] [writing-mode:vertical-rl] group-hover:text-zinc-50">
                {entry.title}
              </span>
              <span className="shrink-0 font-mono text-[9px] text-gilt">{String(entry.volume ?? i + 1).padStart(2, '0')}</span>
            </a>
          );
        })}

        {door && (
          <motion.button
            type="button"
            onClick={pull}
            data-enchanted="shelf"
            aria-label="A book with no title, leaning slightly"
            className="relative ml-1 flex shrink-0 items-start justify-center rounded-t-[2px] border border-zinc-700 bg-canvas-lift focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gilt"
            style={{ height: 128, width: 30, transformOrigin: 'bottom left' }}
            initial={false}
            animate={{ rotate: pulled ? -24 : wand ? -9 : -5 }}
            whileHover={reduced ? undefined : { rotate: -11 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="mt-2 h-px w-3/4 bg-gilt/40" />
          </motion.button>
        )}
      </div>
      {/* the plank */}
      <div aria-hidden="true" className="h-[6px] w-full rounded-[1px] bg-gradient-to-b from-zinc-700 to-transparent" />
    </motion.div>
  );
}
