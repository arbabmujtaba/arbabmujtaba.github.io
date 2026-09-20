import { motion } from 'motion/react';

const navItems = [
  { id: 'portfolio', num: '01', label: 'Work' },
  { id: 'journal', num: '02', label: 'Journal' },
  { id: 'tech', num: '03', label: 'Logs' },
  { id: 'photography', num: '04', label: 'Frames' },
  { id: 'collection', num: '05', label: 'Index' },
];

interface NavigationProps {
  activeView: string;
  setView: (view: string) => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Navigation — flat uppercase link row on desktop, fixed bottom bar on phones.
 *
 * The bottom bar is deliberately retained from the previous mobile work: it
 * keeps every section one tap away and respects the safe-area inset. Touch
 * targets are 44px in both layouts.
 */
export default function Navigation({ activeView, setView }: NavigationProps) {
  return (
    <>
      {/* Desktop */}
      <nav className="relative z-20 hidden items-center gap-7 font-mono text-[11px] uppercase tracking-[0.16em] md:flex">
        {navItems.map((item, index) => {
          const isActive = activeView === item.id;

          return (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 + index * 0.07, ease: EASE }}
              onClick={() => setView(item.id)}
              className="group relative cursor-pointer py-1"
            >
              <span
                className={`transition-colors duration-400 ${
                  isActive ? 'text-zinc-50' : 'text-zinc-500 group-hover:text-zinc-200'
                }`}
              >
                {item.label}
              </span>

              {isActive && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute -bottom-1.5 left-0 right-0 h-px bg-accent"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Mobile */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-canvas/92 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex w-full px-1 pb-2 pt-2 min-[360px]:px-2 min-[390px]:px-3">
          {navItems.map((item) => {
            const isActive = activeView === item.id;

            return (
              <button
                key={`mobile-${item.id}`}
                type="button"
                onClick={() => setView(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className="relative flex min-h-[44px] flex-1 touch-manipulation flex-col items-center justify-center gap-1 py-1.5 transition-opacity active:opacity-60"
              >
                <span
                  className={`h-1 w-1 rounded-full transition-all duration-300 ${
                    isActive ? 'scale-100 bg-accent' : 'scale-75 bg-transparent'
                  }`}
                />
                <span
                  className={`font-mono text-[6.5px] leading-none tracking-[0.06em] min-[360px]:text-[7px] min-[390px]:text-[8px] ${
                    isActive ? 'text-accent' : 'text-zinc-600'
                  }`}
                >
                  {item.num}
                </span>
                <span
                  className={`whitespace-nowrap font-mono text-[7px] uppercase leading-none tracking-[0.04em] min-[360px]:text-[8px] min-[390px]:text-[9px] ${
                    isActive ? 'text-zinc-50' : 'text-zinc-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
