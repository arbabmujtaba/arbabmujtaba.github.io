import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import SafeImage from '../SafeImage';
import { shouldInterceptClick } from '../../lib/navigation';

export interface ArchiveIndexDoor {
  key: string;
  title: string;
  image?: string;
  index: string;
  role?: string;
  description?: string;
  href: string;
  onOpen: () => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * ArchiveIndex — the ways into the archive on a phone.
 *
 * Four full-width arched doors stacked on a 390 px screen came to well over
 * 2,500 px of scrolling for four links. Here each door is one row of a table
 * of contents: a small arch with the view through it, the number, the name in
 * the manuscript voice, its role and one line, and an arrow. The whole row is
 * the link (64 px+ tall), so it is an easy thumb target. Desktop keeps the
 * arched doors (ArchiveDoor).
 */
export default function ArchiveIndex({ doors, className = '' }: { doors: ArchiveIndexDoor[]; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <ol className={`border-t border-zinc-800 ${className}`}>
      {doors.map((door, i) => (
        <motion.li
          key={door.key}
          className="border-b border-zinc-800"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reduced ? 0.3 : 0.7, delay: reduced ? 0 : i * 0.06, ease: EASE }}
        >
          <a
            href={door.href}
            onClick={(event) => {
              if (!shouldInterceptClick(event)) return;
              event.preventDefault();
              door.onOpen();
            }}
            className="group grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-4 py-4 focus-visible:outline-none"
          >
            {/* the doorway, small */}
            <span
              data-surface="ink"
              className="relative block aspect-[3/4] w-14 overflow-hidden rounded-t-[999px] border border-zinc-800 bg-canvas-deep transition-[border-color] duration-500 group-active:border-gilt/60 group-focus-visible:border-gilt"
            >
              <SafeImage
                src={door.image}
                alt=""
                className="h-full w-full object-cover opacity-90"
                fallback={<span className="hairline-grid block h-full w-full" />}
              />
            </span>

            <span className="min-w-0">
              <span className="flex items-baseline gap-2">
                <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-500">{door.index}</span>
                {door.role && (
                  <span className="truncate font-mono text-[9px] uppercase tracking-[0.2em] text-gilt">{door.role}</span>
                )}
              </span>
              <span className="mt-1 block font-book text-[1.75rem] italic leading-none text-zinc-50 transition-colors group-active:text-accent group-focus-visible:text-accent">
                {door.title}
              </span>
              {door.description && (
                <span className="mt-1.5 line-clamp-2 block text-[0.8125rem] font-light leading-snug text-zinc-400">
                  {door.description}
                </span>
              )}
            </span>

            <ArrowUpRight size={18} aria-hidden="true" className="text-zinc-500 transition-colors group-active:text-accent" />
          </a>
        </motion.li>
      ))}
    </ol>
  );
}
