import { useRef, useState } from 'react';
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { shouldInterceptClick } from '../../lib/navigation';
import { useOpenEntry } from '../../lib/entryNavigation';
import { getCardImageStyle } from '../../lib/customization';
import { getLocalWebpSources, ownerArchiveImage } from '../../lib/image';
import type { DetailCollection } from '../../lib/collections';
import type { PostCustomization } from '../../types';

export interface BigCardItem {
  slug: string;
  title: string;
  image?: string;
  customization?: PostCustomization;
  /** Small line under the title, e.g. "Portrait · 2025". */
  meta?: string;
  /** Small accent word beside the number, e.g. "featured". */
  flag?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;
const CARD_SIZES = '(min-width: 768px) 46vw, 92vw';

function Plate({ item, parallax }: { item: BigCardItem; parallax: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-7%', '7%']);
  const [stage, setStage] = useState<'webp' | 'original' | 'failed'>('webp');

  const src = ownerArchiveImage(item.image);
  const sources = src ? getLocalWebpSources(src, CARD_SIZES) : undefined;

  return (
    // Observed on an unclipped wrapper: a box clipped to nothing never counts
    // as "in view", so the wipe would wait forever.
    <m.div ref={ref} initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.15 }}>
    <m.div
      className="relative aspect-[4/5] w-full overflow-hidden bg-canvas-deep"
      variants={{
        hidden: reduced ? { opacity: 0 } : { clipPath: 'inset(100% 0% 0% 0%)' },
        shown: reduced ? { opacity: 1 } : { clipPath: 'inset(0% 0% 0% 0%)' },
      }}
      transition={{ duration: reduced ? 0.4 : 1.3, ease: EASE }}
    >
      {src && stage !== 'failed' ? (
        <m.div className="absolute inset-x-0 -top-[8%] h-[116%]" style={parallax ? { y } : undefined}>
          <picture key={stage}>
            {sources && stage === 'webp' && <source type="image/webp" srcSet={sources.srcSet} sizes={sources.sizes} />}
            <img
              src={src}
              alt={item.title}
              loading="lazy"
              decoding="async"
              onError={() => setStage(stage === 'webp' && sources ? 'original' : 'failed')}
              style={getCardImageStyle(item.customization)}
              className="h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/card:scale-[1.05]"
            />
          </picture>
        </m.div>
      ) : (
        <div className="hairline-grid absolute inset-0 flex items-end p-6">
          <span className="font-book text-4xl italic text-zinc-500">{item.title}</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canvas-deep/60 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover/card:opacity-100" />
    </m.div>
    </m.div>
  );
}

/**
 * BigCards — large photographs in two staggered columns (one on phones).
 *
 * Each plate is wiped up into view once, drifts slightly against the scroll on
 * desktop, and zooms on hover; the cursor reads "view". Every card is a real
 * link to the entry, and a plain click opens it as a quick look over the page.
 */
export default function BigCards({
  items,
  collection,
  parallax,
  className = '',
}: {
  items: BigCardItem[];
  collection: DetailCollection;
  parallax: boolean;
  className?: string;
}) {
  const openEntry = useOpenEntry();
  const reduced = useReducedMotion();

  return (
    <ol className={`grid gap-x-6 gap-y-16 md:grid-cols-2 md:pb-40 lg:gap-x-10 lg:gap-y-24 ${className}`}>
      {items.map((item, index) => (
        <li key={item.slug} className={index % 2 === 1 ? 'md:translate-y-40' : ''}>
          <a
            href={`/${collection}/${item.slug}`}
            data-cursor-label="view"
            onClick={(event) => {
              if (!shouldInterceptClick(event)) return;
              event.preventDefault();
              openEntry(collection, item.slug);
            }}
            className="group/card block focus-visible:outline-none"
          >
            <Plate item={item} parallax={parallax} />
            <m.div
              className="mt-5 flex items-start justify-between gap-6 border-t border-zinc-800 pt-5"
              initial={{ opacity: 0, y: reduced ? 0 : 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
            >
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  {String(index + 1).padStart(2, '0')}
                  {item.flag && <span className="ml-3 text-accent-ink">{item.flag}</span>}
                </p>
                <h3 className="mt-3 font-book text-3xl leading-[1.02] tracking-[-0.02em] text-zinc-50 transition-colors duration-500 group-hover/card:text-accent-ink group-focus-visible/card:text-accent-ink md:text-[2.6rem]">
                  {item.title}
                </h3>
                {item.meta && <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">{item.meta}</p>}
              </div>
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-800 text-zinc-400 transition-all duration-500 group-hover/card:rotate-45 group-hover/card:border-accent group-hover/card:bg-accent group-hover/card:text-on-accent">
                <ArrowUpRight size={16} strokeWidth={1.6} />
              </span>
            </m.div>
          </a>
        </li>
      ))}
    </ol>
  );
}
