import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { shouldInterceptClick } from '../../lib/navigation';
import { useOpenEntry } from '../../lib/entryNavigation';
import type { DetailCollection } from '../../lib/collections';

export interface NotebookItem {
  collection: DetailCollection;
  slug: string;
  title: string;
  excerpt?: string;
  date: string;
  /** Top-left mark: `Vol. 05`, `Log`, … */
  kicker: string;
  meta?: string;
}

interface NotebookProps {
  items: NotebookItem[];
  className?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Notebook — the latest writing, set like pages torn from a notebook.
 *
 * Text only, on purpose: the photographs already have their section, and the
 * journal is the part of the archive that is about words. The rule above each
 * page draws itself in as the page arrives.
 */
export default function Notebook({ items, className = '' }: NotebookProps) {
  const shouldReduceMotion = useReducedMotion();
  const openEntry = useOpenEntry();

  return (
    <div className={`grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3 ${className}`}>
      {items.map((item, index) => {
        const href = `/${item.collection}/${item.slug}`;
        return (
          <motion.article
            key={`${item.collection}/${item.slug}`}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: shouldReduceMotion ? 0.3 : 0.85, delay: shouldReduceMotion ? 0 : index * 0.1, ease: EASE }}
          >
            <a
              href={href}
              onClick={(event) => {
                if (!shouldInterceptClick(event)) return;
                event.preventDefault();
                openEntry(item.collection, item.slug);
              }}
              className="group block focus-visible:outline-none"
            >
              <span aria-hidden="true" className="relative block h-px w-full bg-zinc-800">
                <motion.span
                  className="absolute inset-y-0 left-0 block w-full origin-left bg-accent"
                  initial={{ scaleX: shouldReduceMotion ? 1 : 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.2 + index * 0.12, ease: EASE }}
                  style={{ opacity: 0.55 }}
                />
              </span>

              <div className="mt-5 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.18em]">
                <span className="text-accent">{item.kicker}</span>
                <span className="text-zinc-500">{formatDate(item.date)}</span>
              </div>

              <h3 className="mt-6 font-display text-2xl font-medium leading-[1.08] tracking-[-0.035em] text-zinc-50 transition-colors group-hover:text-accent group-focus-visible:text-accent md:text-[1.75rem]">
                {item.title}
              </h3>

              {item.excerpt && (
                <p className="mt-4 line-clamp-3 text-sm font-light leading-relaxed text-zinc-400">{item.excerpt}</p>
              )}

              <span className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-300 transition-colors group-hover:text-accent">
                {item.meta || 'read'}
                <ArrowUpRight size={12} className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </a>
          </motion.article>
        );
      })}
    </div>
  );
}
