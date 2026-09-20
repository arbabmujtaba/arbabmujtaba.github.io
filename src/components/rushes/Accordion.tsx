import { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Plus } from 'lucide-react';

export interface AccordionEntry {
  id: string;
  title: string;
  /** Short line shown on the right of the trigger row. */
  meta?: string;
  body?: string;
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
              {isOpen && item.body && (
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
                  <p className="max-w-2xl pb-6 text-sm font-light leading-relaxed text-zinc-400">
                    {item.body}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
