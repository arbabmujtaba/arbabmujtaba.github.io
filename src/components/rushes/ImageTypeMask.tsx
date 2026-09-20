import { motion, useReducedMotion } from 'motion/react';
import { normalizeImagePath } from '../../lib/image';

interface ImageTypeMaskProps {
  /** The word to render. Kept short — this is a wordmark treatment. */
  text: string;
  /** Image revealed through the letterforms. */
  image?: string;
  /** Tailwind size classes for the wordmark. */
  size?: string;
  className?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * ImageTypeMask — oversized wordmark with a photograph showing through the
 * letterforms.
 *
 * Uses background-clip: text. Where the image is missing or the browser lacks
 * support, the type falls back to solid ink rather than disappearing, and the
 * word is always present in the DOM as real selectable text.
 */
export default function ImageTypeMask({
  text,
  image,
  size = 'text-[18vw] md:text-[15vw]',
  className = '',
}: ImageTypeMaskProps) {
  const shouldReduceMotion = useReducedMotion();
  const resolved = normalizeImagePath(image);

  return (
    <motion.div
      className={`w-full overflow-hidden ${className}`}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1.1, ease: EASE }}
    >
      <span
        className={`block text-center font-display font-bold uppercase leading-[0.82] tracking-[-0.055em] ${size} ${
          resolved ? 'text-transparent' : 'text-zinc-800'
        }`}
        style={
          resolved
            ? {
                backgroundImage: `url(${resolved})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 40%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }
            : undefined
        }
      >
        {text}
      </span>
    </motion.div>
  );
}
