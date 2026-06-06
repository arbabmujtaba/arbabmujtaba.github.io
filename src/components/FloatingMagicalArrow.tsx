import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Sparkle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function FloatingMagicalArrow() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.classList && target.classList.contains('custom-scrollbar')) {
        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 200) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    
    // Initial check
    setTimeout(() => {
      const container = document.querySelector('.custom-scrollbar');
      if (container) {
        if (container.scrollHeight <= container.clientHeight + 200) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }
    }, 500);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const scrollDown = () => {
    const containers = document.querySelectorAll('.custom-scrollbar');
    containers.forEach(container => {
      if (container.scrollHeight > container.clientHeight) {
        container.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
      }
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30, scale: 0.8 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 md:bottom-12 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none"
        >
          <motion.button
            onClick={scrollDown}
            className="relative group flex items-center justify-center outline-none pointer-events-auto cursor-pointer"
            initial="rest"
            whileHover="hover"
            animate="animate"
          >
            {/* Main Ambient Glow */}
            <motion.div
              className="absolute w-32 h-32 md:w-40 md:h-40 bg-amber-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none"
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
              className="absolute w-16 h-16 md:w-20 md:h-20 bg-amber-400/30 rounded-full blur-2xl mix-blend-screen pointer-events-none"
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
              className="absolute w-8 h-8 md:w-12 md:h-12 bg-yellow-200/40 rounded-full blur-lg mix-blend-screen pointer-events-none"
              variants={{
                rest: { opacity: 0.7 },
                animate: { 
                  opacity: [0.5, 1, 0.5],
                  scale: [0.9, 1.1, 0.9],
                  transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                }
              }}
            />

            {/* Icon Group */}
            <motion.div
              variants={{
                rest: { y: 0 },
                hover: { y: 10 },
                animate: { 
                  y: [0, 8, 0], 
                  transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } 
                }
              }}
              className="relative z-10 text-amber-200 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] group-hover:text-amber-100 group-hover:drop-shadow-[0_0_20px_rgba(251,191,36,1)] transition-all duration-300 flex items-center justify-center"
            >
              <Sparkle className="absolute -top-2 -right-4 w-4 h-4 md:w-5 md:h-5 text-amber-300 animate-pulse opacity-70 drop-shadow-[0_0_8px_rgba(251,191,36,1)]" />
              <Sparkle className="absolute -bottom-1 -left-3 w-3 h-3 text-amber-400 animate-bounce opacity-50 delay-700 drop-shadow-[0_0_5px_rgba(251,191,36,1)]" />
              <ChevronDown className="w-12 h-12 md:w-16 md:h-16" strokeWidth={1} />
            </motion.div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
