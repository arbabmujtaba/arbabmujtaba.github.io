import { motion, useReducedMotion } from 'motion/react';

const ease = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className="max-w-5xl relative z-20 pointer-events-none mt-10 md:mt-16">
        <div className="font-serif text-4xl sm:text-5xl md:text-[5.5rem] lg:text-[6.5rem] leading-[0.98] tracking-tighter text-zinc-100 mb-4 md:mb-14">
          Arbab <br /> Mujtaba
        </div>
        <div className="mb-10 md:mb-16 space-y-1 lg:ml-3">
          <div className="font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl leading-[1.1] tracking-tight text-white/90">
            Software engineer & photographer,
          </div>
          <div className="font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl leading-[1.1] tracking-tight text-orange-500/80 italic lg:ml-8">
            drawn to where systems and stories meet.
          </div>
        </div>
        <div className="font-sans uppercase lg:ml-4">
          <p className="font-light tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs text-zinc-400 leading-relaxed max-w-sm">
            Building systems, documenting light, <br />
            chasing quiet mysteries.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl relative z-20 pointer-events-none mt-10 md:mt-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6, delay: 0.1, ease }}
        className="font-serif text-4xl sm:text-5xl md:text-[5.5rem] lg:text-[6.5rem] leading-[0.98] tracking-tighter text-zinc-100 mb-4 md:mb-14"
      >
        Arbab <br /> Mujtaba
      </motion.div>

      <div className="mb-10 md:mb-16 space-y-1 lg:ml-3">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.3, ease }}
          className="font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl leading-[1.1] tracking-tight text-white/90"
        >
          Software engineer & photographer,
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.5, ease }}
          className="font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl leading-[1.1] tracking-tight text-orange-500/80 italic lg:ml-8"
        >
          drawn to where systems and stories meet.
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 1, ease }}
        className="font-sans uppercase lg:ml-4"
      >
        <p className="font-light tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs text-zinc-400 leading-relaxed max-w-sm">
          Building systems, documenting light, <br />
          chasing quiet mysteries.
        </p>
      </motion.div>
    </div>
  );
}
