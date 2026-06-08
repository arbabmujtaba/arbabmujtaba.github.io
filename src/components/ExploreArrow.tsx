import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface ExploreArrowProps {
  label?: string;
  onClick?: () => void;
  direction?: 'right' | 'down' | 'up-right' | 'up';
}

export default function ExploreArrow({ label = "Explore deeper", onClick, direction = 'right' }: ExploreArrowProps) {
  const getRotation = () => {
    switch (direction) {
      case 'down': return 90;
      case 'up': return -90;
      case 'up-right': return -45;
      case 'right': default: return 0;
    }
  };

  return (
    <motion.div 
      className="group inline-flex items-center gap-4 cursor-pointer"
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      whileHover="hover"
      initial="rest"
    >
      <span className="font-sans text-[10px] md:text-xs uppercase tracking-[0.2em] text-zinc-500 group-hover:text-zinc-200 transition-colors duration-500 font-light relative z-10">
        {label}
      </span>
      <div className="relative flex items-center justify-center">
        <motion.div
           variants={{
             rest: { opacity: 0, scale: 0.5 },
             hover: { opacity: 1, scale: 1.5 }
           }}
           transition={{ duration: 0.5, ease: "easeOut" }}
           className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"
        />
        <motion.div
           variants={{
             rest: { backgroundColor: "transparent", borderColor: "rgba(63, 63, 70, 0.4)" },
             hover: { backgroundColor: "rgba(249, 115, 22, 0.1)", borderColor: "rgba(249, 115, 22, 0.4)" }
           }}
           transition={{ duration: 0.4 }}
           className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-zinc-700/40 flex items-center justify-center relative z-10 backdrop-blur-sm"
        >
          <motion.div
            variants={{
              rest: { x: 0, y: 0 },
              hover: { 
                x: direction === 'right' ? 3 : direction === 'up-right' ? 2 : 0,
                y: direction === 'down' ? 3 : direction === 'up' ? -3 : direction === 'up-right' ? -2 : 0 
              }
            }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            style={{ rotate: getRotation() }}
          >
             <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors duration-500" strokeWidth={1} />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
