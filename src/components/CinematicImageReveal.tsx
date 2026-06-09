import { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';

interface CinematicImageRevealProps {
  containerRef: React.RefObject<HTMLDivElement>;
  imageUrl?: string;
}

export default function CinematicImageReveal({
  containerRef,
  imageUrl = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2400&q=80',
}: CinematicImageRevealProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: targetRef,
    container: containerRef,
    offset: ['start end', 'end start'],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 24,
    restDelta: 0.001,
  });

  const frameScale = useTransform(progress, [0, 0.35, 1], [0.88, 1, 0.96]);
  const frameOpacity = useTransform(progress, [0, 0.18, 0.86, 1], [0, 1, 1, 0.65]);
  const imageScale = useTransform(progress, [0, 1], [1.18, 1.02]);
  const imageY = useTransform(progress, [0, 1], ['-8%', '8%']);
  const blurAmount = useTransform(progress, [0, 0.35], [12, 0]);
  const brightness = useTransform(progress, [0, 0.45], [0.62, 1]);
  const filter = useTransform(
    [blurAmount, brightness],
    ([blur, bright]) => `blur(${blur}px) brightness(${bright})`
  );

  return (
    <section
      ref={targetRef}
      className="relative z-20 flex min-h-[72vh] items-center px-6 py-20 md:min-h-screen md:px-12 lg:px-16"
    >
      <motion.div
        style={shouldReduceMotion ? undefined : { scale: frameScale, opacity: frameOpacity }}
        className="group relative mx-auto aspect-[16/10] w-full max-w-6xl overflow-hidden border border-zinc-800/55 bg-zinc-950 shadow-2xl shadow-black/55"
      >
        <motion.img
          src={imageUrl}
          alt="A cinematic mountain landscape revealing the visual archive"
          className="h-[118%] w-full object-cover opacity-80 grayscale-[30%] transition-all duration-700 group-hover:grayscale-[12%]"
          style={shouldReduceMotion ? undefined : { y: imageY, scale: imageScale, filter }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a09]/92 via-[#0a0a09]/20 to-[#0a0a09]/35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,transparent_0%,rgba(10,10,9,0.20)_48%,rgba(10,10,9,0.74)_100%)]" />

        <motion.div
          className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-orange-300/45 to-transparent md:inset-x-14"
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />

        <div className="absolute bottom-7 left-7 right-7 z-10 flex flex-col justify-between gap-6 md:bottom-10 md:left-10 md:right-10 md:flex-row md:items-end">
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.32em] text-orange-300/75">
              First Discovery
            </p>
            <h2 className="max-w-xl font-serif text-3xl leading-[1.02] tracking-tighter text-zinc-50 md:text-5xl">
              A photograph as the first opened page.
            </h2>
          </div>
          <p className="max-w-xs font-sans text-xs font-light uppercase leading-relaxed tracking-[0.22em] text-zinc-400">
            Scroll reveals depth, clarity, and the quiet atmosphere of the archive.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
