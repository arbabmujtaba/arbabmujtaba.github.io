/**
 * Image derivative pipeline.
 *
 * Generates the responsive WebP derivatives that `getLocalWebpSources`
 * (src/lib/image.ts) points a <picture><source srcset> at. Because a <source>
 * has no automatic fallback, a missing derivative renders a broken image — so
 * every original under public/uploads (plus public/portrait.jpg) must have a
 * derivative at every width in WIDTHS.
 *
 * Output contract, mirrored exactly from getLocalWebpSources:
 *   /uploads/foo/bar.jpeg -> public/uploads/optimized/foo/bar-{480,768,1536}.webp
 *   /portrait.jpg         -> public/uploads/optimized/portrait-{480,768,1536}.webp
 *
 * Usage:
 *   npx tsx scripts/optimize-images.ts           incremental (default)
 *   npx tsx scripts/optimize-images.ts --force   regenerate everything
 *
 * Exits non-zero if any derivative fails to generate.
 */

import { existsSync } from 'node:fs';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp, { type WebpOptions } from 'sharp';

/** Widths must stay in sync with getLocalWebpSources in src/lib/image.ts. */
const WIDTHS = [480, 768, 1536] as const;

/** Extensions we treat as optimizable originals. */
const SOURCE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/** Directory name inside uploads that holds generated output (never an input). */
const OPTIMIZED_DIRNAME = 'optimized';

const WEBP_OPTIONS: WebpOptions = {
  quality: 78,
  effort: 5,
};

const projectRoot = path.resolve(import.meta.dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const uploadsDir = path.join(publicDir, 'uploads');
const optimizedDir = path.join(uploadsDir, OPTIMIZED_DIRNAME);
const portraitPath = path.join(publicDir, 'portrait.jpg');

interface SourceImage {
  /** Absolute path to the original. */
  absolutePath: string;
  /**
   * Path of the derivative relative to public/uploads/optimized, without the
   * `-<width>.webp` suffix. Mirrors `basePath` in getLocalWebpSources.
   */
  basePath: string;
  /** Human-readable label for logs. */
  label: string;
}

interface Stats {
  generated: number;
  skipped: number;
  failed: number;
}

/** Recursively collect optimizable originals under `dir`, skipping `optimized/`. */
async function collectUploads(dir: string): Promise<SourceImage[]> {
  if (!existsSync(dir)) return [];

  const results: SourceImage[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Never treat generated output as an input.
      if (path.resolve(absolutePath) === path.resolve(optimizedDir)) continue;
      results.push(...(await collectUploads(absolutePath)));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;

    const relativeToUploads = path.relative(uploadsDir, absolutePath);
    const basePath = stripExtension(relativeToUploads);

    results.push({
      absolutePath,
      basePath,
      label: `/uploads/${toPosix(relativeToUploads)}`,
    });
  }

  return results;
}

function stripExtension(filePath: string): string {
  const ext = path.extname(filePath);
  return ext ? filePath.slice(0, -ext.length) : filePath;
}

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

/** Collect every source image: the uploads tree plus the standalone portrait. */
async function collectSources(): Promise<SourceImage[]> {
  const sources = await collectUploads(uploadsDir);

  // portrait.jpg lives at the public root but getLocalWebpSources maps it into
  // the same optimized/ folder as `portrait`.
  if (existsSync(portraitPath)) {
    sources.push({
      absolutePath: portraitPath,
      basePath: 'portrait',
      label: '/portrait.jpg',
    });
  }

  return sources.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * A derivative is fresh when it exists and is at least as new as its source.
 * Keeps repeat runs cheap and makes the script safe to call from a build.
 */
async function isFresh(outputPath: string, sourceMtimeMs: number): Promise<boolean> {
  try {
    const outputStat = await stat(outputPath);
    return outputStat.mtimeMs >= sourceMtimeMs;
  } catch {
    return false;
  }
}

async function processSource(
  source: SourceImage,
  force: boolean,
  stats: Stats
): Promise<void> {
  let sourceMtimeMs: number;
  let sourceWidth: number | undefined;

  try {
    const sourceStat = await stat(source.absolutePath);
    sourceMtimeMs = sourceStat.mtimeMs;
    sourceWidth = (await sharp(source.absolutePath).metadata()).width;
  } catch (error) {
    stats.failed += WIDTHS.length;
    console.error(`  FAIL ${source.label}: unreadable — ${describeError(error)}`);
    return;
  }

  for (const width of WIDTHS) {
    const outputPath = path.join(optimizedDir, `${source.basePath}-${width}.webp`);

    if (!force && (await isFresh(outputPath, sourceMtimeMs))) {
      stats.skipped += 1;
      continue;
    }

    try {
      await mkdir(path.dirname(outputPath), { recursive: true });

      // withoutEnlargement caps the output at the source width rather than
      // upscaling, so a narrow original still yields every required width —
      // just no larger than the pixels actually available.
      const buffer = await sharp(source.absolutePath)
        .rotate() // honour EXIF orientation before resizing
        .resize({ width, withoutEnlargement: true })
        .webp(WEBP_OPTIONS)
        .toBuffer();

      await writeFile(outputPath, buffer);
      stats.generated += 1;

      const capped =
        typeof sourceWidth === 'number' && sourceWidth < width
          ? ` (capped at ${sourceWidth}w)`
          : '';
      console.log(
        `  gen  ${toPosix(path.relative(publicDir, outputPath))}${capped}`
      );
    } catch (error) {
      stats.failed += 1;
      console.error(
        `  FAIL ${toPosix(path.relative(publicDir, outputPath))}: ${describeError(error)}`
      );
    }
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function main(): Promise<void> {
  const force = process.argv.slice(2).includes('--force');

  if (!existsSync(uploadsDir)) {
    console.error(`No uploads directory at ${uploadsDir}`);
    process.exitCode = 1;
    return;
  }

  const sources = await collectSources();
  console.log(
    `optimize-images: ${sources.length} source image(s), widths ${WIDTHS.join('/')}${
      force ? ' [--force]' : ''
    }`
  );

  const stats: Stats = { generated: 0, skipped: 0, failed: 0 };
  for (const source of sources) {
    await processSource(source, force, stats);
  }

  console.log(
    `\nSummary: generated ${stats.generated}, skipped ${stats.skipped}, failed ${stats.failed} ` +
      `(expected ${sources.length * WIDTHS.length} derivative(s))`
  );

  if (stats.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`optimize-images failed: ${describeError(error)}`);
  process.exitCode = 1;
});
