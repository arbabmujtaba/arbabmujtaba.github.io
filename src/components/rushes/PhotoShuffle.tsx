import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import SafeImage from '../SafeImage';
import Lightbox, { type LightboxFrame } from '../Lightbox';
import { getLocalWebpSources, ownerArchiveImage } from '../../lib/image';
import { getCardImageStyle } from '../../lib/customization';
import { useOpenEntry } from '../../lib/entryNavigation';
import type { PhotographyEntry } from '../../types';

interface Frame {
  key: string;
  src: string;
  title: string;
  slug: string;
  category: string;
  style?: React.CSSProperties;
}

interface PhotoShuffleProps {
  entries: PhotographyEntry[];
  className?: string;
  /** Milliseconds between swaps. */
  interval?: number;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Grid spans for seven tiles. On a 4-column grid they tile three rows exactly:
 *   [0 0 1 2]
 *   [0 0 3 2]
 *   [4 5 5 6]
 * On phones the grid is two columns and `grid-flow-dense` packs the same list.
 */
const TILE_SPANS = [
  'col-span-2 row-span-1 md:col-span-2 md:row-span-2',
  'col-span-1 row-span-1',
  'col-span-1 row-span-2',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-2 row-span-1 md:col-span-2',
  'col-span-1 row-span-1',
];

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Warm the browser cache with the exact candidate the tile will pick. */
function preload(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    const sources = getLocalWebpSources(src);
    if (sources) {
      img.sizes = '(min-width: 768px) 25vw, 50vw';
      img.srcset = sources.srcSet;
    }
    img.src = src;
    const done = () => resolve();
    img.onload = done;
    img.onerror = done;
    window.setTimeout(done, 2500);
  });
}

/**
 * PhotoShuffle — a contact sheet that never sits still.
 *
 * Seven tiles drawn at random from the Favorites shelf of the photography
 * archive. Every few seconds one tile, chosen at random, wipes over to a frame
 * that is not currently on screen. The replacement is decoded before the wipe
 * starts, so a swap never flashes an empty plate.
 *
 * When Favorites alone cannot keep the rotation fresh (fewer frames than tiles
 * plus a few spares), the rest of the archive tops the pool up — Favorites are
 * still placed first on load.
 *
 * Rotation pauses off-screen and while the pointer rests on the grid, and is
 * off entirely under prefers-reduced-motion. A click opens the frame at full
 * size in the shared Lightbox.
 */
export default function PhotoShuffle({ entries, className = '', interval = 3400 }: PhotoShuffleProps) {
  const shouldReduceMotion = useReducedMotion();
  const openEntry = useOpenEntry();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.25 });
  const [hovering, setHovering] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const pool = useMemo(() => {
    const toFrames = (list: PhotographyEntry[]): Frame[] =>
      list.flatMap((entry) => {
        const images = [entry.coverImage, ...(entry.galleryImages as (string | { image: string })[]).map((g) =>
          typeof g === 'string' ? g : g.image
        )];
        return images
          .map((raw) => ownerArchiveImage(raw))
          .filter((src): src is string => !!src)
          .map((src, i) => ({
            key: `${entry.slug}:${src}`,
            src,
            title: entry.title,
            slug: entry.slug,
            category: entry.category,
            // The cover honours the author's focal point; gallery frames centre.
            style: i === 0 ? getCardImageStyle(entry.customization) : undefined,
          }));
      });

    const favorites = shuffle(toFrames(entries.filter((e) => e.category === 'Favorites')));
    const rest = shuffle(toFrames(entries.filter((e) => e.category !== 'Favorites')));
    const unique = (list: Frame[]) => list.filter((f, i) => list.findIndex((g) => g.src === f.src) === i);
    return unique(favorites.length >= TILE_SPANS.length + 4 ? favorites : [...favorites, ...rest]);
  }, [entries]);

  const tileCount = Math.min(TILE_SPANS.length, pool.length);
  const [tiles, setTiles] = useState<Frame[]>(() => pool.slice(0, tileCount));
  const lastSwapped = useRef<number>(-1);

  const swap = useCallback(async () => {
    const onScreen = new Set(tiles.map((t) => t.src));
    const candidates = pool.filter((f) => !onScreen.has(f.src));
    if (candidates.length === 0) return;
    let slot = Math.floor(Math.random() * tiles.length);
    if (slot === lastSwapped.current && tiles.length > 1) slot = (slot + 1) % tiles.length;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    await preload(next.src);
    lastSwapped.current = slot;
    setTiles((current) => current.map((tile, i) => (i === slot ? next : tile)));
  }, [pool, tiles]);

  const running = !shouldReduceMotion && inView && !hovering && lightbox === null && pool.length > tileCount;

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === 'visible') void swap();
    }, interval);
    return () => window.clearTimeout(timer);
  }, [running, swap, interval, tiles]);

  const frames: LightboxFrame[] = tiles.map((tile, i) => ({
    src: tile.src,
    alt: tile.title,
    title: tile.title,
    index: `frame ${String(i + 1).padStart(2, '0')}`,
    caption: tile.category,
    href: `/photography/${tile.slug}`,
    onOpenStory: () => {
      setLightbox(null);
      openEntry('photography', tile.slug);
    },
  }));

  if (tileCount === 0) return null;

  return (
    <div className={className}>
      <div
        ref={rootRef}
        onPointerEnter={() => setHovering(true)}
        onPointerLeave={() => setHovering(false)}
        className="grid grid-flow-dense auto-rows-[42vw] grid-cols-2 gap-2 sm:auto-rows-[30vw] md:auto-rows-[15vw] md:grid-cols-4 md:gap-3 xl:auto-rows-[13.5rem]"
      >
        {tiles.map((tile, index) => (
          <motion.button
            key={index}
            type="button"
            onClick={() => setLightbox(index)}
            aria-label={`Open ${tile.title} at full size`}
            className={`group relative overflow-hidden rounded-[3px] bg-well focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${TILE_SPANS[index]}`}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: shouldReduceMotion ? 0.3 : 0.9, delay: shouldReduceMotion ? 0 : index * 0.07, ease: EASE }}
          >
            <AnimatePresence initial={false}>
              <motion.span
                key={tile.src}
                className="absolute inset-0 block"
                /* The incoming frame wipes up over the outgoing one, which is
                   held (and kept underneath) until the wipe has finished. */
                style={{ zIndex: 2 }}
                initial={{ clipPath: 'inset(100% 0% 0% 0%)', scale: 1.12 }}
                animate={{ clipPath: 'inset(0% 0% 0% 0%)', scale: 1 }}
                exit={{ zIndex: 1, opacity: 0.999, transition: { duration: 1.1 } }}
                transition={{ duration: 1.1, ease: EASE }}
              >
                <SafeImage
                  src={tile.src}
                  alt={tile.title}
                  style={tile.style}
                  className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]"
                  fallback={<span className="hairline-grid block h-full w-full bg-well" />}
                />
              </motion.span>
            </AnimatePresence>

            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 items-end justify-between gap-3 p-3 text-left opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 md:p-4">
              <span className="font-display text-sm font-medium tracking-[-0.02em] text-white md:text-base">
                {tile.title}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/70">{tile.category}</span>
            </span>
          </motion.button>
        ))}
      </div>

      <Lightbox
        frames={frames}
        openIndex={lightbox}
        onClose={() => setLightbox(null)}
        onNavigate={setLightbox}
      />
    </div>
  );
}
