import { useState } from 'react';
import { m, useReducedMotion, useTransform, type MotionValue } from 'motion/react';
import { MOSAIC_LEAD_INDEX, MOSAIC_ROWS, MOSAIC_TILE_SIZES, mosaicColumns, type MosaicTile } from '../../lib/mosaic';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * How far each column travels over the first screen of scroll, in px. Odd
 * columns rise and even ones sink, so the wall shears apart as the page
 * leaves it. Index 2 is the centre column with the lead photograph.
 */
const DRIFT = [-150, 90, -40, 120, -170];
/** Where each column rests, so the rows never line up into a plain grid. */
const REST = ['-14%', '-4%', '-9%', '-1%', '-12%'];
/** Columns 0 and 4 are hidden on phones, where the middle three fill the width. */
const COLUMN_VISIBILITY = ['hidden md:flex', 'flex', 'flex', 'flex', 'hidden md:flex'];

function Tile({ tile, delay, reduced }: { tile: MosaicTile; delay: number; reduced: boolean }) {
  // A missing derivative fails the whole <picture>; retry the original once.
  const [plain, setPlain] = useState(false);
  const [gone, setGone] = useState(false);
  if (gone) return <div className="hairline-grid aspect-[3/4] w-full bg-canvas-deep" />;

  const img = (
    <img
      src={tile.src}
      alt=""
      loading={tile.lead ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={tile.lead ? 'high' : 'low'}
      onError={() => (plain || !tile.srcSet ? setGone(true) : setPlain(true))}
      style={{ objectPosition: tile.objectPosition }}
      className="h-full w-full object-cover transition-[transform,filter] duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/tile:scale-[1.06] group-hover/tile:brightness-125"
    />
  );

  const transition = { duration: reduced ? 0.4 : 1.5, delay: reduced ? 0 : delay, ease: EASE };

  // The tile develops from a window in its middle while the whole tile
  // settles from a 1.12 zoom. That used to be an animated clip-path
  // (inset 14% 10%, under scale 1.12), which repaints every tile on the main
  // thread for every frame of the 1.5 s entrance — 25 tiles at once, right
  // while the page is loading. The same picture is drawn with transforms
  // only: the frame scales to the window it used to clip to (0.8 × 1.12 by
  // 0.72 × 1.12), and the photograph inside is counter-scaled so its net size
  // is still the 1.12 zoom. Written as whole `transform` strings so motion
  // hands them to the browser (WAAPI) and they run off the main thread; the
  // individual scaleX / scaleY values would be stepped in JS every frame.
  return (
    <m.div
      className={`group/tile relative aspect-[3/4] w-full overflow-hidden bg-canvas-deep ${tile.lead ? 'z-10' : ''}`}
      initial={reduced ? { opacity: 0 } : { opacity: 0, transform: `scale(${0.8 * 1.12}, ${0.72 * 1.12})` }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, transform: 'scale(1, 1)' }}
      transition={transition}
    >
      <m.div
        className="h-full w-full"
        initial={reduced ? false : { transform: `scale(${1 / 0.8}, ${1 / 0.72})` }}
        animate={reduced ? undefined : { transform: 'scale(1, 1)' }}
        transition={transition}
      >
        {tile.srcSet && !plain ? (
          <picture>
            <source type="image/webp" srcSet={tile.srcSet} sizes={MOSAIC_TILE_SIZES} />
            {img}
          </picture>
        ) : (
          img
        )}
      </m.div>
      {/* The rest of the wall stays a step down so the lead frame and the name carry the screen. */}
      {!tile.lead && (
        <div className="pointer-events-none absolute inset-0 bg-[var(--bg-deep)] opacity-45 transition-opacity duration-700 group-hover/tile:opacity-0" />
      )}
    </m.div>
  );
}

function Column({
  tiles,
  column,
  scrollY,
  parallax,
  reduced,
}: {
  tiles: MosaicTile[];
  column: number;
  scrollY: MotionValue<number>;
  parallax: boolean;
  reduced: boolean;
}) {
  const y = useTransform(scrollY, [0, 900], [0, DRIFT[column]]);
  return (
    <m.div
      className={`${COLUMN_VISIBILITY[column]} min-w-0 flex-1 flex-col gap-2 md:gap-3`}
      style={{ marginTop: REST[column], ...(parallax ? { y } : {}) }}
    >
      {tiles.map((tile, row) => {
        const index = column * MOSAIC_ROWS + row;
        // Out from the lead frame: the centre develops first, the edges last.
        const distance = Math.abs(column - 2) + Math.abs(row - 2);
        const delay = index === MOSAIC_LEAD_INDEX ? 0.05 : 0.15 + distance * 0.09;
        return <Tile key={tile.key} tile={tile} delay={delay} reduced={reduced} />;
      })}
    </m.div>
  );
}

/**
 * HeroMosaic — the wall of photographs behind the name.
 *
 * Tiles develop outward from the lead frame on arrival (clip and scale), and
 * on desktop the columns drift at different speeds as the page scrolls.
 * Transform, clip-path and opacity only. Decorative: the whole wall is
 * aria-hidden and every image has an empty alt.
 */
export default function HeroMosaic({
  tiles,
  scrollY,
  parallax,
}: {
  tiles: MosaicTile[];
  scrollY: MotionValue<number>;
  parallax: boolean;
}) {
  const reduced = !!useReducedMotion();
  return (
    // Centred, and taller than the screen, so the middle row (the lead frame)
    // sits behind the name and the wall runs off every edge.
    <div aria-hidden="true" className="absolute inset-[-4%] flex items-center gap-2 md:gap-3">
      {mosaicColumns(tiles).map((column, index) => (
        <Column key={index} tiles={column} column={index} scrollY={scrollY} parallax={parallax} reduced={reduced} />
      ))}
    </div>
  );
}
