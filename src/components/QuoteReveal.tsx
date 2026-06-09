import { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';

interface QuoteRevealProps {
  quote: string;
  author?: string;
  containerRef: React.RefObject<HTMLDivElement>;
}

export default function QuoteReveal({ quote, author, containerRef }: QuoteRevealProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: targetRef,
    container: containerRef,
    offset: ['start end', 'end start'],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 26,
    restDelta: 0.001,
  });

  const opacity = useTransform(progress, [0, 0.25, 0.76, 1], [0, 1, 1, 0]);
  const y = useTransform(progress, [0, 0.5, 1], [80, 0, -80]);
  const scale = useTransform(progress, [0, 0.5, 1], [0.94, 1, 0.96]);
  const words = quote.split(' ');

  return (
    <motion.section
      ref={targetRef}
      style={shouldReduceMotion ? undefined : { opacity, y, scale }}
      className="relative z-20 flex min-h-screen items-center justify-center overflow-hidden px-6 py-28 md:px-12 lg:px-16"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.026),transparent_54%)]" />
      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-px w-[70vw] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-orange-400/20 to-transparent"
        animate={shouldReduceMotion ? undefined : { rotate: [-2, 2, -2], opacity: [0.16, 0.34, 0.16] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mb-8 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-orange-400/35" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-orange-400/70">
            Interlude
          </span>
          <span className="h-px w-12 bg-orange-400/35" />
        </div>

        <h2 className="font-serif text-4xl leading-[1.08] tracking-tighter text-zinc-100 md:text-6xl lg:text-7xl">
          {words.map((word, index) => (
            <motion.span
              key={`${word}-${index}`}
              className="inline-block overflow-hidden align-bottom"
            >
              <motion.span
                className="inline-block pr-[0.22em]"
                initial={{ y: shouldReduceMotion ? 0 : '100%', opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{
                  duration: 0.78,
                  delay: index * 0.045,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {word}
              </motion.span>
            </motion.span>
          ))}
        </h2>

        {author && (
          <motion.p
            className="mt-10 font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {author}
          </motion.p>
        )}
      </div>
    </motion.section>
  );
}
