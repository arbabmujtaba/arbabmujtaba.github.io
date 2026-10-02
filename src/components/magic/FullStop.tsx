import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useMagic } from '../../lib/magic';
import { getEgg, isEggEnabled } from '../../lib/secrets';

/**
 * The full stop after the name. With the wand out it is an object: touch it
 * and it lifts off the line — the archive is still being written, so the
 * sentence was never really over. Without the wand it is punctuation.
 */
export default function FullStop() {
  const { wand, whisperOf } = useMagic();
  const reduced = useReducedMotion();
  const [lifted, setLifted] = useState(false);

  if (!wand || !isEggEnabled('fullstop')) {
    return <span className="text-accent">.</span>;
  }

  return (
    <button
      type="button"
      data-enchanted="fullstop"
      aria-label="The full stop"
      onClick={() => {
        setLifted(true);
        const egg = getEgg('fullstop');
        whisperOf(egg?.title || 'Not a full stop', egg?.body || 'It only looks like the end of the sentence.', 'quill');
        window.setTimeout(() => setLifted(false), reduced ? 1200 : 3200);
      }}
      className="relative inline-block text-accent focus-visible:outline-none"
    >
      <motion.span
        className="inline-block"
        animate={
          lifted && !reduced
            ? { y: ['0em', '-0.55em', '-0.45em', '-0.6em', '0em'], x: ['0em', '0.08em', '-0.05em', '0.1em', '0em'], rotate: [0, 12, -8, 16, 0] }
            : { y: '0em' }
        }
        transition={{ duration: 3, ease: 'easeInOut' }}
        style={{ textShadow: lifted ? '0 0 24px color-mix(in srgb, var(--gilt) 80%, transparent)' : undefined }}
      >
        .
      </motion.span>
    </button>
  );
}
