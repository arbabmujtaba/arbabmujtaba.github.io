import { motion } from 'motion/react';

export default function Hero() {
  return (
    <div className="max-w-4xl relative z-20 pointer-events-none">
      <div className="mb-12 md:mb-20 space-y-2">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight text-zinc-100"
        >
          Engineer.
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight text-zinc-600 italic lg:ml-12"
        >
          Photographer.
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight text-zinc-100 lg:ml-4"
        >
          Explorer.
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 1, ease: [0.16, 1, 0.3, 1] }}
        className="font-sans uppercase"
      >
        <p className="font-light tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs text-zinc-400 leading-relaxed max-w-sm">
          Building systems, <br />
          collecting stories, <br />
          capturing moments.
        </p>
      </motion.div>
    </div>
  );
}
