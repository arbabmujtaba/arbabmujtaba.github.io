/**
 * The home hero — the photograph behind the name.
 *
 * Chosen in /admin as a Home block of type `hero` (content/home/*.md with
 * `configType: hero` and an `image`); the focal point set in its Media tab is
 * honoured. With no such block — or one switched off, or without an image —
 * the archive's default frame is used.
 *
 * Pure on purpose: Home.tsx renders from this, and the Vite plugin in
 * vite.config.ts uses the same answer to write the hero preload into
 * index.html, so the preload and the painted image are always one request.
 */
import { getCardImageStyle } from './customization';
import { getLocalWebpSources, ownerArchiveImage } from './image';
import type { PostCustomization } from '../types';

/** Assigned in `.kiro/IMAGE_MAP.md`: the darkest large photograph in the archive. */
export const DEFAULT_HERO_IMAGE = '/uploads/photography/1785134270800-642096424.jpeg';

/**
 * The default frame is a portrait; `npm run hero:image` bakes a 3:2 band out of
 * it at full resolution for landscape screens. Only that frame has a band.
 */
const DEFAULT_WIDE_SRCSET = [1280, 1920, 2560]
  .map((width) => `/uploads/optimized/home/hero-dusk-wide-${width}.webp ${width}w`)
  .join(', ');

/** Where the default frame sits in its plate (the sun, the tree line). */
const DEFAULT_POSITION = '50% 42%';

export interface HeroBlock {
  configType?: string;
  image?: string;
  visible?: boolean;
  order?: number;
  customization?: PostCustomization;
}

export interface HeroImage {
  src: string;
  /** For `(orientation: landscape)`. */
  wideSrcSet?: string;
  /** Every other screen. */
  tallSrcSet?: string;
  objectPosition: string;
  isDefault: boolean;
}

/** The live hero block with the lowest order, if any has an image of the owner's. */
export function pickHeroBlock<T extends HeroBlock>(blocks: readonly T[]): T | undefined {
  return [...blocks]
    .filter((b) => b.configType === 'hero' && b.visible !== false && ownerArchiveImage(b.image))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
}

export function resolveHero(blocks: readonly HeroBlock[]): HeroImage {
  const block = pickHeroBlock(blocks);
  const src = block ? ownerArchiveImage(block.image)! : DEFAULT_HERO_IMAGE;
  const position = getCardImageStyle(block?.customization)?.objectPosition;
  const focal = position === undefined ? undefined : String(position);

  if (src === DEFAULT_HERO_IMAGE && !focal) {
    return {
      src,
      wideSrcSet: DEFAULT_WIDE_SRCSET,
      tallSrcSet: getLocalWebpSources(src)?.srcSet,
      objectPosition: DEFAULT_POSITION,
      isDefault: true,
    };
  }

  // Any other frame: the shared derivatives (up to 1536 px) for phones, and on
  // landscape screens the full-size original on top of them, so a 1920 or 2×
  // laptop is not handed a soft 1536 px plate. Uploads are full-size WebP.
  const derivatives = getLocalWebpSources(src)?.srcSet;
  const isWebp = /\.webp(\?|#|$)/i.test(src);
  return {
    src,
    wideSrcSet: derivatives && isWebp ? `${derivatives}, ${src} 2560w` : derivatives,
    tallSrcSet: derivatives,
    objectPosition: focal ?? '50% 50%',
    isDefault: false,
  };
}

