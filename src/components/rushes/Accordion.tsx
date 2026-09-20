import { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Plus } from 'lucide-react';
import { resolveIcon } from '../../lib/icons';

export interface AccordionEntry {
  id: string;
  title: string;
  /** Short line shown on the right of the trigger row. */
  meta?: string;
  body?: string;
  /** Lucide icon name from the entry's front-matter. Unknown names are ignored. */
  icon?: string;
  /** Reference link for the entry, shown inside the open panel. */
  href?: string;
}

interface AccordionProps {
  items: AccordionEntry[];
  className?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Accordion — accessible disclosure list.
 *
 * One panel open at a time. Each trigger is a real button carrying
 * aria-expanded and aria-controls, the panel is labelled by its trigger, and
 * the row is 44px minimum for touch. The height animation is skipped under
 * prefers-reduced-motion.
 */
export default function Accordion({ items, className = '' }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const baseId = useId();

  return (
    <div className={`border-t border-zinc-800 ${className}`}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        const triggerId = `${baseId}-${item.id}-trigger`;
        const panelId = `${baseId}-${item.id}-panel`;

        return (
          <div key={item.id} className="border-b border-zinc-800">
            <button
              type="button"
              id={triggerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="flex min-h-[64px] w-full items-center gap-5 py-5 text-left transition-colors hover:text-zinc-50"
            >
              {(() => {
                /* The `icon` field has been in the content all along; this is
                   the first surface to render it. */
                const Icon = resolveIcon(item.icon);
                return Icon ? (
                  <Icon
                    size={15}
                    strokeWidth={1.6}
                    aria-hidden="true"
                    className="shrink-0 text-zinc-500"
                  />
                ) : null;
              })()}

              <span className="min-w-0 flex-1 text-base leading-snug text-zinc-100 md:text-lg">
                {item.title}
              </span>

              {item.meta && (
                <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 sm:block">
                  {item.meta}
                </span>
              )}

              <motion.span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas-lift text-zinc-300"
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <Plus size={14} strokeWidth={1.75} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (item.body || item.href) && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : { height: 'auto', opacity: 1 }
                  }
                  exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0.2 : 0.45, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="pb-6">
                    <p className="max-w-2xl text-sm font-light leading-relaxed text-zinc-400">
                      {item.body}
                    </p>

                    {item.href && (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link mt-4 inline-flex min-h-[44px] items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-accent"
                      >
                        reference
                        <ArrowUpRight
                          size={12}
                          strokeWidth={1.8}
                          className="transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
                        />
                      </a>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
