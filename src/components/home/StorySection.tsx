import { Fragment, useRef, useState } from 'react';
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { RecLabel } from '../rushes';
import { getCardImageStyle } from '../../lib/customization';
import { getLocalWebpSources, ownerArchiveImage } from '../../lib/image';
import type { PostCustomization } from '../../types';
import { LANDED, lift } from '../../lib/motion';

const EASE = [0.16, 1, 0.3, 1] as const;
const PORTRAIT_SIZES = '(min-width: 1024px) 38vw, 92vw';

/** `**bold**` and `*italic*`, nothing else — the story is a few short paragraphs. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-medium text-zinc-50">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={index} className="font-book text-[1.12em] italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

function Portrait({ image, customization, parallax }: { image?: string; customization?: PostCustomization; parallax: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const [stage, setStage] = useState<'webp' | 'original' | 'failed'>('webp');
  const src = ownerArchiveImage(image);
  const sources = src ? getLocalWebpSources(src, PORTRAIT_SIZES) : undefined;

  return (
    // Observed on an unclipped wrapper (a fully clipped box is never "in view").
    <m.div ref={ref} initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.2 }}>
    <m.div
      className="relative aspect-[4/5] w-full overflow-hidden bg-canvas-deep"
      variants={{
        hidden: reduced ? { opacity: 0 } : { clipPath: 'inset(0% 0% 100% 0%)' },
        shown: reduced ? { opacity: 1 } : { clipPath: 'inset(0% 0% 0% 0%)' },
      }}
      transition={{ duration: reduced ? 0.4 : 1.4, ease: EASE }}
    >
      {src && stage !== 'failed' ? (
        <m.div className="absolute inset-x-0 -top-[9%] h-[118%]" style={parallax ? { y } : undefined}>
          <picture key={stage}>
            {sources && stage === 'webp' && <source type="image/webp" srcSet={sources.srcSet} sizes={sources.sizes} />}
            <img
              src={src}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setStage(stage === 'webp' && sources ? 'original' : 'failed')}
              style={getCardImageStyle(customization)}
              className="h-full w-full object-cover"
            />
          </picture>
        </m.div>
      ) : (
        <div className="hairline-grid absolute inset-0" />
      )}
    </m.div>
    </m.div>
  );
}

export interface StoryContent {
  label: string;
  heading: string;
  lead?: string;
  body?: string;
  image?: string;
  customization?: PostCustomization;
}

/**
 * StorySection — a portrait beside a heading and a few paragraphs.
 *
 * On large screens the portrait stays put (sticky) while the words scroll past
 * it, and drifts inside its frame. Everything comes from the Story block in
 * /admin and is rendered verbatim, so the live editor can find it.
 */
export default function StorySection({
  story,
  parallax,
  footer,
}: {
  story: StoryContent;
  parallax: boolean;
  footer?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const paragraphs = (story.body || '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);

  const rise = (delay: number) => ({
    initial: lift(reduced ? 0 : 22),
    whileInView: LANDED,
    viewport: { once: true, amount: 0.4 },
    transition: { duration: 0.9, delay, ease: EASE },
  });

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Portrait image={story.image} customization={story.customization} parallax={parallax} />
      </div>

      <div className="lg:pt-10">
        <RecLabel>{story.label}</RecLabel>
        <m.h2
          {...rise(0)}
          className="mt-8 font-book text-4xl font-normal leading-[1.02] tracking-[-0.025em] text-zinc-50 md:text-6xl lg:text-[4.4rem]"
        >
          <span aria-hidden="true" className="text-accent-ink">“</span>
          {story.heading}
          <span aria-hidden="true" className="text-accent-ink">”</span>
        </m.h2>
        {story.lead && (
          <m.p {...rise(0.1)} className="mt-10 max-w-xl text-lg font-light leading-relaxed text-zinc-200 md:text-xl">
            {story.lead}
          </m.p>
        )}
        <div className="mt-8 max-w-xl space-y-6">
          {paragraphs.map((paragraph, index) => (
            <m.p key={index} {...rise(0.05)} className="text-base font-light leading-relaxed text-zinc-400 md:text-[1.05rem]">
              <Inline text={paragraph} />
            </m.p>
          ))}
        </div>
        {footer && <m.div {...rise(0.1)} className="mt-12">{footer}</m.div>}
      </div>
    </div>
  );
}
