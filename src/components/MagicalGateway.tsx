import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

interface MagicalGatewayProps {
  label: string;
  title: string;
  description: string;
  onClick: () => void;
  image: string;
  index: number;
  featured?: boolean;
}

const sparkPositions = [
  { x: '18%', y: '26%', delay: 0 },
  { x: '78%', y: '18%', delay: 0.14 },
  { x: '66%', y: '72%', delay: 0.28 },
  { x: '32%', y: '82%', delay: 0.42 },
];

export default function MagicalGateway({
  label,
  title,
  description,
  onClick,
  image,
  index,
  featured = false,
}: MagicalGatewayProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 46, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.28 }}
      transition={{ duration: 0.85, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={shouldReduceMotion ? undefined : { y: -6 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={`group relative min-h-[14rem] sm:min-h-[18rem] overflow-hidden border border-zinc-800/55 bg-zinc-950/35 text-left outline-none backdrop-blur-sm transition-colors duration-500 hover:border-orange-400/50 focus-visible:border-orange-400 focus-visible:ring-2 focus-visible:ring-orange-400/30 md:min-h-[26rem] ${
        featured ? 'md:col-span-4' : 'md:col-span-3'
      } ${index === 4 ? 'md:col-span-6 lg:col-span-2' : ''}`}
    >
      <motion.div
        className="absolute inset-0"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1.04, 1.08, 1.04],
              }
        }
        transition={{ duration: 14 + index, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-36 grayscale transition-all duration-700 group-hover:opacity-58 group-hover:grayscale-[28%]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a09] via-[#0a0a09]/55 to-[#0a0a09]/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(249,115,22,0.16),transparent_34%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      </motion.div>

      <div className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/65 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-orange-400/35 to-transparent" />
        {sparkPositions.map((spark) => (
          <motion.span
            key={`${title}-${spark.x}-${spark.y}`}
            className="absolute h-1 w-1 rounded-full bg-orange-300 shadow-[0_0_18px_rgba(251,146,60,0.95)]"
            style={{ left: spark.x, top: spark.y }}
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: [0, 0.9, 0],
                    scale: [0.4, 1.35, 0.4],
                    y: [0, -12, -24],
                  }
            }
            transition={{
              duration: 2.4,
              delay: spark.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex h-full min-h-[21rem] flex-col justify-between p-6 md:min-h-[26rem] md:p-8">
        <div>
          <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-orange-400/78">
            {label}
          </span>
          <h3 className="max-w-[12ch] font-serif text-4xl leading-none tracking-tighter text-zinc-100 transition-colors duration-500 group-hover:text-white md:text-5xl lg:text-6xl">
            {title}
          </h3>
        </div>

        <div>
          <p className="max-w-md font-sans text-sm font-light leading-relaxed text-zinc-400 transition-colors duration-500 group-hover:text-zinc-300">
            {description}
          </p>
          <div className="mt-7 inline-flex items-center gap-3">
            <span className="font-sans text-[10px] uppercase tracking-[0.24em] text-zinc-500 transition-colors duration-500 group-hover:text-orange-300">
              Enter Chapter
            </span>
            <motion.span
              className="flex h-10 w-10 items-center justify-center border border-zinc-700/60 text-zinc-400 transition-colors duration-500 group-hover:border-orange-400/55 group-hover:text-orange-200"
              animate={shouldReduceMotion ? undefined : { x: [0, 3, 0], y: [0, -3, 0] }}
              transition={{ duration: 2.3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.3} />
            </motion.span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
