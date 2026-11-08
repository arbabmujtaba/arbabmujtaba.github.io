/**
 * The home hero mosaic — a wall of the owner's photographs behind the name.
 *
 * Where the tiles come from, in order:
 *   1. the lead hero photo (`resolveHero`, the lowest-order Hero block) — it
 *      always sits in the centre tile, and index.html preloads exactly it;
 *   2. every other visible Hero block, by order — so adding Hero photos in
 *      /admin is how the author chooses the mosaic;
 *   3. photography covers, then journal covers, then archive-door images.
 * Duplicates are dropped; if the archive is short the list is cycled so the
 * wall is always full.
 *
 * Pure on purpose (no React) so the order is easy to test.
 */
import { getCardImageStyle } from './customization';
import { getLocalWebpSources, ownerArchiveImage } from './image';
import type { HeroImage } from './hero';
import type { PostCustomization } from '../types';

/** Five columns on md+ screens, the middle three on phones. */
export const MOSAIC_COLUMNS = 5;
export const MOSAIC_ROWS = 5;
/** Column 2, row 2: the centre of the wall on every screen size. */
export const MOSAIC_LEAD_INDEX = 2 * MOSAIC_ROWS + 2;
/**
 * The tiles' `sizes`. index.html preloads the lead tile with the same value,
 * so the preload and the painted tile are one request.
 */
export const MOSAIC_TILE_SIZES = '(min-width: 768px) 20vw, 34vw';

export interface MosaicSource {
  image?: string;
  customization?: PostCustomization;
}

export interface MosaicTile {
  key: string;
  src: string;
  srcSet?: string;
  objectPosition?: string;
  lead: boolean;
}

interface HeroBlockLike extends MosaicSource {
  configType?: string;
  visible?: boolean;
  order?: number;
}

export function buildMosaic(
  lead: HeroImage,
  blocks: readonly HeroBlockLike[],
  ...pools: readonly (readonly MosaicSource[])[]
): MosaicTile[] {
  const total = MOSAIC_COLUMNS * MOSAIC_ROWS;
  const seen = new Set<string>([lead.src]);
  const others: Omit<MosaicTile, 'key'>[] = [];

  const add = (source: MosaicSource) => {
    const src = ownerArchiveImage(source.image);
    if (!src || seen.has(src)) return;
    seen.add(src);
    const position = getCardImageStyle(source.customization)?.objectPosition;
    others.push({
      src,
      srcSet: getLocalWebpSources(src)?.srcSet,
      objectPosition: position === undefined ? undefined : String(position),
      lead: false,
    });
  };

  [...blocks]
    .filter((block) => block.configType === 'hero' && block.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach(add);
  pools.forEach((pool) => pool.forEach(add));

  const leadTile: Omit<MosaicTile, 'key'> = {
    src: lead.src,
    srcSet: lead.tallSrcSet,
    objectPosition: lead.objectPosition,
    lead: true,
  };

  const tiles: MosaicTile[] = [];
  let cursor = 0;
  for (let index = 0; index < total; index += 1) {
    if (index === MOSAIC_LEAD_INDEX || others.length === 0) {
      tiles.push({ ...(index === MOSAIC_LEAD_INDEX ? leadTile : { ...leadTile, lead: false }), key: `tile-${index}` });
      continue;
    }
    tiles.push({ ...others[cursor % others.length], key: `tile-${index}` });
    cursor += 1;
  }
  return tiles;
}

/** Split the flat list into columns of `MOSAIC_ROWS`. */
export function mosaicColumns(tiles: readonly MosaicTile[]): MosaicTile[][] {
  const columns: MosaicTile[][] = [];
  for (let column = 0; column < MOSAIC_COLUMNS; column += 1) {
    columns.push(tiles.slice(column * MOSAIC_ROWS, (column + 1) * MOSAIC_ROWS));
  }
  return columns;
}
