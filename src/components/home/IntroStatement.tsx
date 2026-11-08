import { useRef } from 'react';
import { m, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { RecLabel } from '../rushes';

function Word({ word, index, count, progress }: { word: string; index: number; count: number; progress: MotionValue<number> }) {
  const start = index / count;
  const opacity = useTransform(progress, [start, Math.min(1, start + 1.5 / count)], [0.16, 1]);
  return (
    <m.span style={{ opacity }} className="inline">
      {word}{' '}
    </m.span>
  );
}

/**
 * IntroStatement — one large sentence under the hero that lights up word by
 * word as it scrolls through the screen. Opacity only, scrubbed by the window
 * scroll; under reduced motion the sentence is simply there.
 *
 * The text is the Intro line block from /admin, rendered verbatim (the words
 * keep their spaces), so the live editor can still find it by its text.
 */
export default function IntroStatement({ label, text }: { label: string; text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'end 0.5'] });
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,4fr)] md:gap-12">
      <div className="md:pt-4">
        <RecLabel>{label}</RecLabel>
      </div>
      <p
        ref={ref}
        className="font-book text-[2.4rem] font-normal leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-6xl lg:text-[5.25rem]"
      >
        {reduced
          ? text
          : words.map((word, index) => (
              <Word key={`${word}-${index}`} word={word} index={index} count={words.length} progress={scrollYProgress} />
            ))}
      </p>
    </div>
  );
}
