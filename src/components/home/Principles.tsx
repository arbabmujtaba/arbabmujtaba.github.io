import { m, useReducedMotion } from 'motion/react';

const EASE = [0.16, 1, 0.3, 1] as const;

export interface Principle {
  slug: string;
  label?: string;
  title: string;
  description?: string;
}

/**
 * Principles — the Principle blocks from /admin as a numbered list: a number,
 * a small label, a large serif title and one line. Rows rise in one after
 * another; on hover a wash sweeps in and the title steps forward.
 */
export default function Principles({ items, className = '' }: { items: Principle[]; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <ol className={`border-t border-zinc-800 ${className}`}>
      {items.map((item, index) => (
        <m.li
          key={item.slug}
          initial={{ opacity: 0, y: reduced ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.85, delay: reduced ? 0 : index * 0.06, ease: EASE }}
          className="group/row relative grid gap-4 overflow-hidden border-b border-zinc-800 py-10 md:grid-cols-[6rem_minmax(0,1.2fr)_minmax(0,1fr)] md:items-baseline md:gap-10 md:py-14"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-[var(--accent-soft)] via-[var(--well)] to-transparent transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/row:scale-x-100"
          />
          <span className="relative font-mono text-[11px] text-zinc-500 transition-colors group-hover/row:text-accent-ink">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="relative">
            {item.label && (
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-accent-ink">{item.label}</p>
            )}
            <h3 className="font-book text-4xl leading-[1] tracking-[-0.02em] text-zinc-50 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/row:translate-x-3 md:text-6xl">
              {item.title}
            </h3>
          </div>
          {item.description && (
            <p className="relative max-w-md text-sm font-light leading-relaxed text-zinc-400 md:text-base">{item.description}</p>
          )}
        </m.li>
      ))}
    </ol>
  );
}
