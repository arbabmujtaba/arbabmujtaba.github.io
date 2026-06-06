import { motion } from 'motion/react';

export default function ScrollIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, delay: 1.5, ease: 'easeOut' }}
      className="absolute bottom-6 md:bottom-12 left-6 md:left-12 flex items-center space-x-6 z-20"
    >
      <span className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-sans font-light origin-left transform -rotate-90 md:rotate-0 translate-y-8 md:translate-y-0">
        Discover
      </span>
      <div className="w-[1px] h-16 md:h-24 bg-zinc-800/80 overflow-hidden relative">
        <motion.div
          className="w-full h-1/3 bg-zinc-400 absolute top-0 left-0"
          animate={{ y: ['-150%', '350%'] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: [0.6, 0.05, 0.4, 0.9],
          }}
        />
      </div>
    </motion.div>
  );
}
