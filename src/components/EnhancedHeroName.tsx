import { motion, useReducedMotion } from 'motion/react';

const nameLines = ['ARBAB', 'MUJTABA'];
const titles = ['Engineer.', 'Photographer.', 'Explorer.'];
const editorialEase = [0.16, 1, 0.3, 1] as const;

export default function EnhancedHeroName() {
  const shouldReduceMotion = useReducedMotion();

  const letterVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 64,
      filter: shouldReduceMotion ? 'blur(0px)' : 'blur(10px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.85,
        ease: editorialEase,
      },
    },
  };

  return (
    <div className="relative z-20 max-w-[96rem] pointer-events-none">
      <motion.div
        className="mb-4 md:mb-10 max-w-[95vw]"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: shouldReduceMotion ? 0 : 0.045,
              delayChildren: 0.15,
            },
          },
        }}
        aria-label="Arbab Mujtaba"
      >
        {nameLines.map((line, lineIdx) => (
          <div
            key={line}
            className={`flex overflow-hidden font-serif text-[14vw] font-medium uppercase leading-[0.78] tracking-tighter sm:text-[15vw] md:text-[13vw] lg:text-[10.8vw] xl:text-[9.6rem] ${lineIdx === 1 ? 'text-orange-500/85' : 'text-zinc-100'}`}
          >
            {line.split('').map((letter, index) => (
              <motion.span
                key={`${line}-${letter}-${index}`}
                variants={letterVariants}
                className="inline-block"
              >
                {letter}
              </motion.span>
            ))}
          </div>
        ))}
      </motion.div>

      <div className="grid max-w-3xl gap-3 md:ml-2 md:grid-cols-3 md:gap-6">
        {titles.map((title, index) => (
          <motion.div
            key={title}
            initial={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : 24,
              clipPath: 'inset(0 100% 0 0)',
            }}
            animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0% 0 0)' }}
            transition={{
              duration: 0.9,
              delay: 1.05 + index * 0.32,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`font-serif text-xl leading-none tracking-tight md:text-2xl lg:text-3xl ${
              index === 1 ? 'italic text-orange-400/85' : 'text-zinc-200'
            }`}
          >
            {title}
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mt-8 max-w-sm font-sans text-[10px] font-light uppercase leading-relaxed tracking-[0.28em] text-zinc-500 md:ml-2"
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 2.05, ease: [0.16, 1, 0.3, 1] }}
      >
        Building systems, collecting stories, capturing moments.
      </motion.div>
    </div>
  );
}
