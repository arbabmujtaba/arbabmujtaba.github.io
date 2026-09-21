/**
 * Convert originals already in the archive to WebP.
 *
 * Uploads through /admin are converted on the way in, but anything that landed
 * before that — or was copied into `public/uploads/` by hand — is still a JPEG
 * or a PNG, and is still the version being committed and served. This rewrites
 * those files as WebP originals, repoints every reference to them, and
 * regenerates their derivatives.
 *
 * References are rewritten in `content/` (front-matter and body) and in
 * `content-state.json`, which is every place a URL is stored. A file is only
 * deleted after its replacement and its derivatives exist.
 *
 * `public/portrait.jpg` is deliberately skipped: that path is written into
 * src/lib/image.ts and the route shells, not into content.
 *
 * Usage:
 *   npx tsx scripts/convert-uploads-to-webp.ts                 # everything not already WebP
 *   npx tsx scripts/convert-uploads-to-webp.ts <substring> ... # only matching files
 *   npx tsx scripts/convert-uploads-to-webp.ts --dry-run       # report, change nothing
 */

import { existsSync } from 'node:fs';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  PATHS,
  collectSources,
  ensureDerivatives,
  needsWebpOriginal,
  normalizeUploadToWebp,
  publicUrlFor,
} from '../src/services/ImageDerivativeService';

const projectRoot = process.cwd();
const contentDir = path.join(projectRoot, 'content');
const registryPath = path.join(projectRoot, 'content-state.json');

/** Every text file that can hold an image URL. */
async function referenceFiles(): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string) {
    if (!existsSync(dir)) return;
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(absolute);
    }
  }

  await walk(contentDir);
  if (existsSync(registryPath)) files.push(registryPath);
  return files;
}

async function rewriteReferences(
  files: string[],
  fromUrl: string,
  toUrl: string,
  dryRun: boolean
): Promise<string[]> {
  const touched: string[] = [];

  for (const file of files) {
    const before = await readFile(file, 'utf-8');
    if (!before.includes(fromUrl)) continue;
    touched.push(path.relative(projectRoot, file));
    if (!dryRun) {
      await writeFile(file, before.split(fromUrl).join(toUrl), 'utf-8');
    }
  }

  return touched;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const filters = args.filter((arg) => !arg.startsWith('--'));

  const candidates = (await collectSources()).filter((source) => {
    if (path.resolve(source) === path.resolve(PATHS.portraitPath)) return false;
    if (!needsWebpOriginal(source)) return false;
    if (filters.length === 0) return true;
    return filters.some((filter) => source.includes(filter));
  });

  console.log(
    `convert-uploads-to-webp: ${candidates.length} original(s) to convert${dryRun ? ' [--dry-run]' : ''}`
  );
  if (candidates.length === 0) return;

  const files = await referenceFiles();
  let converted = 0;
  let failed = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;

  for (const source of candidates) {
    const fromUrl = publicUrlFor(source);
    const sizeBefore = (await stat(source)).size;

    if (dryRun) {
      const touched = await rewriteReferences(files, fromUrl, fromUrl, true);
      console.log(
        `  would convert ${fromUrl} (${(sizeBefore / 1024).toFixed(0)} kB)` +
          `${touched.length > 0 ? ` — referenced in ${touched.join(', ')}` : ' — unreferenced'}`
      );
      continue;
    }

    try {
      const result = await normalizeUploadToWebp(source);
      if (!result.converted) {
        console.log(`  skip ${fromUrl}${result.reason ? ` — ${result.reason}` : ''}`);
        continue;
      }

      const toUrl = publicUrlFor(result.path);
      const derivatives = await ensureDerivatives([result.path]);
      const touched = await rewriteReferences(files, fromUrl, toUrl, false);
      const sizeAfter = (await stat(result.path)).size;

      bytesBefore += sizeBefore;
      bytesAfter += sizeAfter;
      converted += 1;

      console.log(
        `  ${fromUrl} -> ${toUrl} ` +
          `(${(sizeBefore / 1024).toFixed(0)} kB -> ${(sizeAfter / 1024).toFixed(0)} kB, ` +
          `${derivatives.length} derivative(s)` +
          `${touched.length > 0 ? `, referenced in ${touched.join(', ')}` : ', unreferenced'})`
      );
    } catch (error) {
      failed += 1;
      console.error(
        `  FAIL ${fromUrl}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (!dryRun) {
    const saved = bytesBefore - bytesAfter;
    console.log(
      `\nConverted ${converted}, failed ${failed}` +
        (converted > 0
          ? ` — ${(bytesBefore / 1024 / 1024).toFixed(1)} MB of originals became ` +
            `${(bytesAfter / 1024 / 1024).toFixed(1)} MB (${(saved / 1024 / 1024).toFixed(1)} MB smaller)`
          : '')
    );
  }

  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(
    `convert-uploads-to-webp failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
});
