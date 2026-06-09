import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Sparkle } from 'lucide-react';
import { useEffect, useState } from 'react';

// Get and sort the unique scroll target offsets within the scrollable container
const getScrollTargets = (container: HTMLElement) => {
  const targets: number[] = [0];
  
  // Direct children of the scroll container
  const directChildren = Array.from(container.children);
  directChildren.forEach(child => {
    const htmlChild = child as HTMLElement;
    if (htmlChild.offsetHeight > 100) {
      targets.push(htmlChild.offsetTop);
    }
  });

  // Query nested logical sections or elements
  const customElements = Array.from(container.querySelectorAll('section, article, .border-t, [class*="section"]'));
  customElements.forEach(el => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.offsetHeight > 100) {
      targets.push(htmlEl.offsetTop);
    }
  });

  // Sort and filter duplicate/overlapping scroll target values
  const sorted = Array.from(new Set(targets))
    .map(t => Math.round(t))
    .sort((a, b) => a - b);

  const uniqueTargets: number[] = [];
  sorted.forEach(t => {
    if (uniqueTargets.length === 0) {
      uniqueTargets.push(t);
    } else {
      const last = uniqueTargets[uniqueTargets.length - 1];
      if (t - last > 120) {
        uniqueTargets.push(t);
      }
    }
  });

  // Append maxScroll if not already closely present
  const maxScroll = container.scrollHeight - container.clientHeight;
  if (maxScroll > 0 && !uniqueTargets.some(t => Math.abs(t - maxScroll) < 100)) {
    uniqueTargets.push(maxScroll);
  }

  return uniqueTargets.sort((a, b) => a - b);
};

export default function FloatingMagicalArrow() {
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const updateScrollState = () => {
      // Find the active, currently displayed scroll container in the viewport
      const container = Array.from(document.querySelectorAll('.custom-scrollbar')).find(
        el => el.getBoundingClientRect().width > 0
      ) as HTMLElement | null;

      if (container) {
        const maxScroll = container.scrollHeight - container.clientHeight;
        setIsScrollable(maxScroll > 50);
        setIsAtBottom(container.scrollTop >= maxScroll - 45);
      } else {
        setIsScrollable(false);
        setIsAtBottom(false);
      }
    };

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.classList && target.classList.contains('custom-scrollbar')) {
        const maxScroll = target.scrollHeight - target.clientHeight;
        setIsScrollable(maxScroll > 50);
        setIsAtBottom(target.scrollTop >= maxScroll - 45);
      }
    };

    // Use capturing event listener to intercept all scroll events inside custom-scrollbar elements
    window.addEventListener('scroll', handleScroll, true);

    // Periodically sweep the DOM to keep scroll controls synchronized with dynamically loaded contents
    const interval = setInterval(updateScrollState, 400);
    updateScrollState();

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      clearInterval(interval);
    };
  }, []);

  const scrollDown = (e: React.MouseEvent) => {
    // Avoid double events or bubbles
    e.stopPropagation();
    e.preventDefault();

    const container = Array.from(document.querySelectorAll('.custom-scrollbar')).find(
      el => el.getBoundingClientRect().width > 0
    ) as HTMLElement | null;

    if (!container) return;

    const scrollTop = container.scrollTop;
    const maxScroll = container.scrollHeight - container.clientHeight;

    // Scroll to top if we're already at the bottom
    if (scrollTop >= maxScroll - 45) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Get the unique list of section boundary targets
    const targets = getScrollTargets(container);
    // Find first target past current scrolling position with 15px fractional buffer
    const nextTarget = targets.find(t => t > scrollTop + 15);

    if (nextTarget !== undefined) {
      container.scrollTo({ top: nextTarget, behavior: 'smooth' });
    } else {
      container.scrollTo({ top: maxScroll, behavior: 'smooth' });
    }
  };

  return (
    <AnimatePresence>
      {isScrollable && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30, scale: 0.8 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 md:bottom-12 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-auto"
        >
          <motion.button
            onClick={scrollDown}
            className="relative group flex items-center justify-center outline-none pointer-events-auto cursor-pointer border-0 bg-transparent p-0"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            initial="rest"
            whileHover="hover"
            animate="animate"
          >
            {/* Main Ambient Glow */}
            <motion.div
              className="absolute w-32 h-32 md:w-40 md:h-40 bg-orange-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"
              variants={{
                rest: { scale: 0.8, opacity: 0.3 },
                hover: { scale: 1.2, opacity: 0.6 },
                animate: { 
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.2, 0.5, 0.2],
                  transition: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                }
              }}
            />
            {/* Core Focused Glow */}
            <motion.div
              className="absolute w-16 h-16 md:w-20 md:h-20 bg-orange-400/16 rounded-full blur-2xl mix-blend-screen pointer-events-none"
              variants={{
                rest: { scale: 0.8, opacity: 0.5 },
                hover: { scale: 1.3, opacity: 0.9 },
                animate: { 
                  scale: [0.8, 1.3, 0.8],
                  opacity: [0.4, 0.7, 0.4],
                  transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.5 }
                }
              }}
            />
            {/* Inner Core */}
            <motion.div
              className="absolute w-8 h-8 md:w-12 md:h-12 bg-orange-200/18 rounded-full blur-lg mix-blend-screen pointer-events-none"
              variants={{
                rest: { opacity: 0.7 },
                animate: { 
                  opacity: [0.5, 1, 0.5],
                  scale: [0.9, 1.1, 0.9],
                  transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                }
              }}
            />

            {/* Icon Group - Rotates dynamically 180 degrees when isAtBottom is reached */}
            <motion.div
              animate={{ rotate: isAtBottom ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="relative z-10 text-orange-200 drop-shadow-[0_0_14px_rgba(251,146,60,0.42)] group-hover:text-orange-100 group-hover:drop-shadow-[0_0_18px_rgba(251,146,60,0.62)] transition-all duration-300 flex items-center justify-center pointer-events-none"
            >
              <Sparkle className="absolute -top-2 -right-4 w-4 h-4 md:w-5 md:h-5 text-orange-300 animate-pulse opacity-55 drop-shadow-[0_0_8px_rgba(251,146,60,0.62)]" />
              <Sparkle className="absolute -bottom-1 -left-3 w-3 h-3 text-orange-400 animate-bounce opacity-40 delay-700 drop-shadow-[0_0_5px_rgba(251,146,60,0.48)]" />
              <ChevronDown className="w-12 h-12 md:w-16 md:h-16" strokeWidth={1} />
            </motion.div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
