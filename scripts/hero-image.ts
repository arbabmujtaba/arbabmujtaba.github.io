/**
 * The home hero's wide crop.
 *
 * The hero photograph (dusk over the poplars) is a portrait frame — 3024×4032
 * once its EXIF rotation is applied — shown full-bleed in a landscape band on
 * every screen wider than it is tall. Through the shared derivative contract
 * the largest file a desktop could get was the 1536 px portrait derivative,
 * cropped to its middle: soft on a 1920 screen or a 2× laptop, with the clouds
 * cut off and the sun hidden behind the name.
 *
 * This bakes a 3:2 band out of the original — clouds, the low sun, the tree
 * line — at the frame's full 3024 px width, in three widths. Phones keep the
 * portrait derivatives (art direction is in src/pages/Home.tsx, and the
 * preload in index.html mirrors it). Output goes under uploads/optimized/,
 * which the derivative sweep skips, so these files are never treated as
 * originals of their own.
 *
 *   npm run hero:image
 */
import path from 'node:path';
import { mkdirSync, statSync } from 'node:fs';
import sharp from 'sharp';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'public/uploads/photography/1785134270800-642096424.jpeg');
const OUT_DIR = path.join(ROOT, 'public/uploads/optimized/home');
export const HERO_WIDE_WIDTHS = [1280, 1920, 2560] as const;

/** The band, in displayed (rotated) pixels of the 3024×4032 frame. */
const BAND = { left: 0, top: 520, width: 3024, height: 2016 };

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  // rotate() first: sharp would otherwise crop the stored, un-rotated pixels.
  const band = await sharp(SOURCE).rotate().extract(BAND).toBuffer();
  for (const width of HERO_WIDE_WIDTHS) {
    const out = path.join(OUT_DIR, `hero-dusk-wide-${width}.webp`);
    await sharp(band).resize({ width }).webp({ quality: 80, effort: 5, smartSubsample: true }).toFile(out);
    console.log(`${path.relative(ROOT, out)}  ${(statSync(out).size / 1024).toFixed(0)} KB`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
