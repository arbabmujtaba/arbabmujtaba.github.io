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

const CARD_SIZES = '(min-width: 768px) 46vw, 92vw';

/**
 * One card, revealed by the scroll itself.
 *
 * While the card travels from the bottom of the screen to its upper third,
 * the frame opens from a small window in the middle to its full size and the
 * photograph inside settles from a zoom to rest — so it develops at whatever
 * pace the reader scrolls, and runs backwards if they scroll back. On wide
 * screens the photograph then keeps drifting gently inside its frame. Only
 * transform and opacity move. Under reduced motion it is still.
 */
function Card({
  item,
  index,
  collection,
  parallax,
}: {
  item: BigCardItem;
  index: number;
  collection: DetailCollection;
  parallax: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const reduced = !!useReducedMotion();
  const openEntry = useOpenEntry();
  const [stage, setStage] = useState<'webp' | 'original' | 'failed'>('webp');

  // The reveal: card top at the bottom edge → card top at 30% of the screen.
  // The frame opens from a window in its middle (64% × 52%, what used to be a
  // clip-path of inset 24% 18%) while the photograph settles from 1.4 to rest.
  // A scroll-scrubbed clip-path repaints the photograph on the main thread on
  // every scroll frame; this draws the same thing with transforms, which the
  // compositor handles: the frame scales to the window, and the photograph is
  // counter-scaled per axis so its net size is exactly the zoom at every frame.
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ['start end', 'start 0.3'] });
  const frameX = useTransform(enter, [0, 1], [0.64, 1]);
  const frameY = useTransform(enter, [0, 1], [0.52, 1]);
  const zoom = useTransform(enter, [0, 1], [1.4, 1]);
  const photoX = useTransform(() => zoom.get() / frameX.get());
  const photoY = useTransform(() => zoom.get() / frameY.get());
  const captionOpacity = useTransform(enter, [0.55, 1], [0, 1]);
  const captionY = useTransform(enter, [0.55, 1], [18, 0]);

  // The drift, over the card's whole pass through the screen (desktop only).
  const { scrollYProgress: pass } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const drift = useTransform(pass, [0, 1], ['-6%', '6%']);

  const src = ownerArchiveImage(item.image);
  const sources = src ? getLocalWebpSources(src, CARD_SIZES) : undefined;

  return (
    <li ref={ref} className={index % 2 === 1 ? 'md:translate-y-40' : ''}>
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
        <m.div
          className="relative aspect-[4/5] w-full overflow-hidden bg-canvas-deep"
          style={reduced ? undefined : { scaleX: frameX, scaleY: frameY }}
        >
          {src && stage !== 'failed' ? (
            <m.div className="absolute inset-x-0 -top-[7%] h-[114%]" style={parallax ? { y: drift } : undefined}>
              {/* will-change pins this layer's raster scale. Without it the
                  browser re-rasterises the photograph at every new scale as
                  the frame opens, on each scroll frame; with it the layer is
                  drawn once, at the 1.4× it starts from, and only moved. */}
              <m.div className="h-full w-full will-change-transform" style={reduced ? undefined : { scaleX: photoX, scaleY: photoY }}>
                <picture key={stage}>
                  {sources && stage === 'webp' && <source type="image/webp" srcSet={sources.srcSet} sizes={sources.sizes} />}
                  <img
                    src={src}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    onError={() => setStage(stage === 'webp' && sources ? 'original' : 'failed')}
                    style={getCardImageStyle(item.customization)}
                    className="h-full w-full object-cover transition-[filter] duration-700 group-hover/card:brightness-110"
                  />
                </picture>
              </m.div>
            </m.div>
          ) : (
            <m.div
              className="hairline-grid absolute inset-0 flex items-end p-6"
              style={reduced ? undefined : { scaleX: photoX, scaleY: photoY }}
            >
              <span className="font-book text-4xl italic text-zinc-500">{item.title}</span>
            </m.div>
          )}
        </m.div>

        <m.div
          className="mt-5 flex items-start justify-between gap-6 border-t border-zinc-800 pt-5"
          style={reduced ? undefined : { opacity: captionOpacity, y: captionY }}
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
  );
}

/**
 * BigCards — a few large photographs, two staggered columns on wider screens
 * (the right one sits lower) and one on phones. Every card is a real link to
 * the entry; a plain click opens it as a quick look over the page.
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
  return (
    <ol className={`grid gap-x-6 gap-y-14 md:grid-cols-2 md:gap-y-24 md:pb-40 lg:gap-x-10 ${className}`}>
      {items.map((item, index) => (
        <Card key={item.slug} item={item} index={index} collection={collection} parallax={parallax} />
      ))}
    </ol>
  );
}
