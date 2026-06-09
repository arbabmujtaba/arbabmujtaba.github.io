import { motion } from 'motion/react';

export default function Hero() {
  return (
    <div className="max-w-5xl relative z-20 pointer-events-none mt-10 md:mt-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="font-serif text-4xl sm:text-5xl md:text-[5.5rem] lg:text-[6.5rem] leading-[0.98] tracking-tighter text-zinc-100 mb-8 md:mb-14 -ml-1 md:-ml-2"
      >
        Arbab <br /> Mujtaba
      </motion.div>

      <div className="mb-10 md:mb-16 space-y-3 lg:ml-3">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl leading-[1.1] tracking-tight text-white/90"
        >
          Engineer.
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl leading-[1.1] tracking-tight text-orange-500/80 italic lg:ml-8"
        >
          Photographer.
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl leading-[1.1] tracking-tight text-white/90 lg:ml-3"
        >
          Explorer.
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 1, ease: [0.16, 1, 0.3, 1] }}
        className="font-sans uppercase lg:ml-4"
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
