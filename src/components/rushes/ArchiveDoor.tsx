import { motion, useReducedMotion } from 'motion/react';
import SafeImage from '../SafeImage';
import { shouldInterceptClick } from '../../lib/navigation';

interface ArchiveDoorProps {
  title: string;
  image?: string;
  index: string;
  role?: string;
  description?: string;
  href: string;
  onOpen: () => void;
  delay?: number;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * ArchiveDoor — one way into the archive, drawn as an arched doorway. The
 * photograph is the view through it; on hover the doorway warms, the view
 * steps a little closer, and a line of gilt traces the arch.
 */
export default function ArchiveDoor({ title, image, index, role, description, href, onOpen, delay = 0 }: ArchiveDoorProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: reduced ? 0.3 : 0.9, delay: reduced ? 0 : delay, ease: EASE }}
      data-levitate
    >
      <a
        href={href}
        onClick={(event) => {
          if (!shouldInterceptClick(event)) return;
          event.preventDefault();
          onOpen();
        }}
        className="group block focus-visible:outline-none"
      >
        <span
          data-surface="ink"
          className="relative block aspect-[3/4] overflow-hidden rounded-t-[999px] border border-zinc-800 bg-canvas-deep transition-[border-color] duration-700 group-hover:border-gilt/60 group-focus-visible:border-gilt"
        >
          <SafeImage
            src={image}
            alt=""
            className="h-full w-full object-cover opacity-85 transition-[scale,opacity,filter] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06] group-hover:opacity-100"
            fallback={<span className="hairline-grid block h-full w-full" />}
          />
          {/* the light inside the doorway */}
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-t-[999px] opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-focus-visible:opacity-100"
            style={{ boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--gilt) 70%, transparent), inset 0 40px 80px -40px color-mix(in srgb, var(--gilt) 45%, transparent)' }}
          />
          <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
            <span>
              <span className="block font-mono text-[10px] tracking-[0.2em] text-zinc-400">{index}</span>
              <span className="mt-1 block font-book text-3xl italic leading-none text-zinc-50">{title}</span>
            </span>
            {role && <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gilt">{role}</span>}
          </span>
        </span>
        {description && <span className="mt-4 block max-w-xs text-sm font-light leading-relaxed text-zinc-400">{description}</span>}
      </a>
    </motion.div>
  );
}
