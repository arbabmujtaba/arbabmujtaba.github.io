import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ChevronDown, Sparkle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '../lib/useMediaQuery';

/**
 * Section boundaries on the current page, in document coordinates.
 *
 * The page scrolls the window. Every page used to wrap itself in an
 * `overflow-y-auto` box that was meant to be the scroller, but the shell above
 * it has no bounded height, so that box grew to fit its content and never
 * scrolled. This control (and the hero parallax, and the timeline rail) read
 * the box's scrollTop, saw 0 for ever, and silently did nothing — on the dev
 * server and on the live site alike.
 */
function sectionTargets(): number[] {
  const main = document.querySelector('main') ?? document.body;
  const tops = Array.from(main.querySelectorAll<HTMLElement>('section, footer'))
    .filter((el) => el.offsetHeight > 160)
    .map((el) => Math.round(el.getBoundingClientRect().top + window.scrollY));
  const unique: number[] = [];
  for (const top of [...new Set(tops)].sort((a, b) => a - b)) {
    if (!unique.length || top - unique[unique.length - 1] > 120) unique.push(top);
  }
  return unique;
}

export default function FloatingMagicalArrow() {
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const reduced = useReducedMotion();
  const supportsDesktopControl = useMediaQuery('(min-width: 768px) and (hover: hover) and (pointer: fine)');

  useEffect(() => {
    if (!supportsDesktopControl) return;
    let frame = 0;
    // The document height is measured only when it can change (resize, the
    // body growing). Reading scrollHeight on every scroll frame forced a
    // synchronous layout in the middle of the frame.
    let max = 0;
    const update = () => {
      frame = 0;
      setIsScrollable(max > 50);
      setIsAtBottom(window.scrollY >= max - 45);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const measure = () => {
      max = document.documentElement.scrollHeight - window.innerHeight;
      schedule();
    };
    measure();
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    // Content arrives lazily (images, routes); watch the document grow instead of polling it.
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      observer.disconnect();
    };
  }, [supportsDesktopControl]);

  if (!supportsDesktopControl) return null;

  const scrollDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth';
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (window.scrollY >= max - 45) {
      window.scrollTo({ top: 0, behavior });
      return;
    }
    const next = sectionTargets().find((top) => top > window.scrollY + 15);
    window.scrollTo({ top: next ?? max, behavior });
  };

  return (
    <AnimatePresence>
      {isScrollable && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30, scale: 0.8 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto fixed bottom-6 right-6 z-[100] hidden md:bottom-10 md:right-10 md:block"
        >
          <motion.button
            type="button"
            onClick={scrollDown}
            aria-label={isAtBottom ? 'Back to the top' : 'Next section'}
            className="group relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-1 focus-visible:ring-accent"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            initial="rest"
            whileHover="hover"
            animate="rest"
          >
            <motion.div
              className="pointer-events-none absolute h-24 w-24 rounded-full bg-accent/10 blur-2xl"
              variants={{ rest: { scale: 0.8, opacity: 0.35 }, hover: { scale: 1.15, opacity: 0.8 } }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              animate={{ rotate: isAtBottom ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="pointer-events-none relative z-10 flex items-center justify-center text-accent transition-colors duration-300 group-hover:text-zinc-50"
            >
              <Sparkle className="absolute -right-3 -top-2 h-3.5 w-3.5 opacity-60" />
              <ChevronDown className="h-10 w-10" strokeWidth={1} />
            </motion.div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
