import { useState, type ReactNode } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { useMagic } from '../../lib/magic';
import { getEgg, isEggEnabled } from '../../lib/secrets';

/**
 * The last letter of the name. With the wand out it is an object: touch it
 * and it rocks on the line and catches the light — the archive is still being
 * written, so the name was never really finished. Without the wand it is a
 * letter. (The egg keeps its original `fullstop` trigger id so existing CMS
 * entries still apply.)
 */
export default function LastLetter({ children }: { children: ReactNode }) {
  const { wand, whisperOf } = useMagic();
  const reduced = useReducedMotion();
  const [lifted, setLifted] = useState(false);

  if (!wand || !isEggEnabled('fullstop')) {
    return <>{children}</>;
  }

  return (
    <button
      type="button"
      data-enchanted="fullstop"
      aria-label="The last letter"
      onClick={() => {
        setLifted(true);
        const egg = getEgg('fullstop');
        whisperOf(egg?.title || 'Not the last letter', egg?.body || 'The name is still being written, like the archive.', 'quill');
        window.setTimeout(() => setLifted(false), reduced ? 1200 : 3200);
      }}
      className="relative inline-block font-[inherit] leading-[inherit] tracking-[inherit] text-inherit focus-visible:outline-none"
    >
      <m.span
        className="inline-block origin-bottom"
        animate={lifted && !reduced ? { rotate: [0, 9, -6, 12, 0], x: ['0em', '0.03em', '-0.02em', '0.04em', '0em'] } : { rotate: 0 }}
        transition={{ duration: 3, ease: 'easeInOut' }}
        style={{
          color: lifted ? 'var(--gilt)' : undefined,
          textShadow: lifted ? '0 0 24px color-mix(in srgb, var(--gilt) 80%, transparent)' : undefined,
          transition: 'color 0.6s ease',
        }}
      >
        {children}
      </m.span>
    </button>
  );
}
