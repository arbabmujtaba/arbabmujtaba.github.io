import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { shouldInterceptClick } from '../../lib/navigation';
import { useOpenEntry } from '../../lib/entryNavigation';
import { cue, prefetchRooms, useMagic } from '../../lib/magic';
import { isRoomEnabled } from '../../lib/secrets';
import { useMediaQuery } from '../../lib/useMediaQuery';
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

/** Dust that comes off the odd book when it is pulled: x drift (px), rise (px), delay (s). */
const DUST = [
  [-14, 62, 0],
  [-4, 84, 0.05],
  [6, 70, 0.1],
  [16, 92, 0.03],
  [-20, 48, 0.12],
  [10, 54, 0.16],
  [0, 100, 0.08],
];

/** How long the book takes to come off the shelf before the room opens. */
const PULL_MS = 420;

/**
 * Bookshelf — every journal volume as a spine, oldest on the left. Each spine
 * opens its volume. At the end of the shelf one book has no title and leans a
 * little: the volumes beside it lean away from it, it catches the wand's light,
 * and under Lumos it shows a keyhole. Pull it and the Restricted Section opens.
 *
 * The door used to wait 900ms on the shelf swinging and then fetch the room's
 * chunk; now the chunk is warmed as soon as a pointer comes near the book and
 * the room opens while the book is still coming off the shelf.
 */
export default function Bookshelf({ volumes, className = '' }: { volumes: JournalEntry[]; className?: string }) {
  const reduced = useReducedMotion();
  const coarse = useMediaQuery('(pointer: coarse), (max-width: 767px)');
  const openEntry = useOpenEntry();
  const { openRoom, wand, lumos } = useMagic();
  const [pulled, setPulled] = useState(false);
  const [near, setNear] = useState(false);
  const door = isRoomEnabled('library');
  const shelf = [...volumes].sort((a, b) => (a.volume ?? 0) - (b.volume ?? 0));

  const warm = () => {
    void prefetchRooms().catch(() => undefined);
  };
  const approach = () => {
    warm();
    setNear(true);
  };

  const pull = () => {
    if (pulled) return;
    warm();
    setPulled(true);
    if (!reduced) cue('spark');
    window.setTimeout(
      () => {
        openRoom('library');
        setPulled(false);
        setNear(false);
      },
      reduced ? 0 : PULL_MS
    );
  };

  const lit = wand || lumos;

  return (
    <div className={`relative ${className}`}>
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        the shelf · every volume so far
      </p>
      {/* pt leaves headroom for a lifted spine and for the dust, which the
          horizontal scroller would otherwise clip */}
      <div className="flex items-end gap-[3px] overflow-x-auto pb-px pt-6 [scrollbar-width:none]">
        {shelf.map((entry, i) => {
          const [h, w] = SIZES[i % SIZES.length];
          // The two volumes beside the odd book lean away from it as it is approached.
          const fromEnd = shelf.length - 1 - i;
          const lean = door && (near || pulled) && fromEnd < 2 ? (fromEnd === 0 ? '-rotate-[3deg]' : '-rotate-1') : '';
          const volume = String(entry.volume ?? i + 1).padStart(2, '0');
          return (
            <motion.a
              key={entry.slug}
              href={`/journal/${entry.slug}`}
              onClick={(event) => {
                if (!shouldInterceptClick(event)) return;
                event.preventDefault();
                openEntry('journal', entry.slug);
              }}
              title={entry.title}
              aria-label={`Vol. ${volume} — ${entry.title}`}
              // the volumes settle onto the shelf one after another, once
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: reduced ? 0.3 : 0.7, delay: reduced ? 0 : i * 0.06, ease: EASE }}
              className={`group relative flex shrink-0 origin-bottom-left flex-col items-center gap-2 overflow-hidden rounded-t-[2px] border border-zinc-700 bg-canvas-raised px-1 pb-2 pt-2.5 transition-[translate,rotate,border-color,background-color,box-shadow] duration-500 hover:-translate-y-2 hover:border-accent focus-visible:-translate-y-2 focus-visible:border-accent focus-visible:outline-none ${lean}`}
              style={{ height: h, width: coarse ? Math.max(w, 44) : w }}
            >
              <span className="h-px w-full shrink-0 bg-gilt/50" />
              <span className="min-h-0 flex-1 overflow-hidden whitespace-nowrap font-book text-[13px] italic leading-none text-zinc-300 [text-overflow:ellipsis] [writing-mode:vertical-rl] group-hover:text-zinc-50">
                {entry.title}
              </span>
              <span className="shrink-0 font-mono text-[9px] text-gilt">{volume}</span>
            </motion.a>
          );
        })}

        {door && (
          <button
            type="button"
            onClick={pull}
            onPointerEnter={approach}
            onPointerLeave={() => !pulled && setNear(false)}
            onPointerDown={warm}
            onFocus={approach}
            onBlur={() => !pulled && setNear(false)}
            data-enchanted="shelf"
            aria-label="A book with no title, leaning slightly"
            // 44px of target around a 30px book
            className="group relative ml-0.5 flex h-[140px] w-11 shrink-0 items-end justify-center focus-visible:outline-none"
          >
            <motion.span
              aria-hidden="true"
              className={`relative flex flex-col items-center overflow-hidden rounded-t-[2px] border bg-canvas-lift transition-[border-color,box-shadow] duration-700 group-focus-visible:ring-1 group-focus-visible:ring-gilt ${
                lit ? 'border-gilt/60 shadow-[0_0_22px_-4px_var(--gilt)]' : 'border-zinc-700'
              }`}
              style={{ height: 128, width: 30, transformOrigin: 'bottom left' }}
              initial={false}
              animate={
                pulled
                  ? { rotate: -24, y: reduced ? 0 : -8 }
                  : { rotate: near ? -11 : lit ? -9 : -5, y: 0 }
              }
              transition={{ duration: pulled ? PULL_MS / 1000 : 0.6, ease: EASE }}
            >
              <span className="mt-2 h-px w-3/4 bg-gilt/40" />
              {/* invisible ink: a keyhole, readable under Lumos or with the wand out */}
              <svg
                viewBox="0 0 10 16"
                className={`mt-auto mb-5 h-4 w-2.5 text-gilt transition-opacity duration-700 ${lit ? 'opacity-90' : 'opacity-0'}`}
              >
                <circle cx="5" cy="5" r="3" fill="currentColor" />
                <path d="M3.4 7 L2.4 14.5 H7.6 L6.6 7 Z" fill="currentColor" />
              </svg>
              {/* one pass of light up the spine as the shelf comes into view */}
              {!reduced && (
                <motion.span
                  className="pointer-events-none absolute inset-x-0 h-1/2 bg-gradient-to-b from-transparent via-gilt/25 to-transparent"
                  initial={{ y: '210%' }}
                  whileInView={{ y: '-110%' }}
                  viewport={{ once: true, amount: 0.8 }}
                  transition={{ duration: 1.6, delay: shelf.length * 0.06 + 0.5, ease: EASE }}
                />
              )}
            </motion.span>

            {/* dust off the top of the book as it comes away */}
            <AnimatePresence>
              {pulled && !reduced && (
                <span aria-hidden="true" className="pointer-events-none absolute bottom-[120px] left-1/2">
                  {DUST.map(([dx, rise, delay], k) => (
                    <motion.span
                      key={k}
                      className="absolute h-1 w-1 rounded-full bg-gilt"
                      initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
                      animate={{ opacity: [0, 1, 0], x: dx, y: -rise, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.9, delay, ease: EASE }}
                    />
                  ))}
                </span>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>
      {/* the plank */}
      <div aria-hidden="true" className="h-[6px] w-full rounded-[1px] bg-gradient-to-b from-zinc-700 to-transparent" />
    </div>
  );
}
