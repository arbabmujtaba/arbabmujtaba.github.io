/**
 * Image derivative sweep (CLI).
 *
 * Thin wrapper over src/services/ImageDerivativeService, which is the same
 * module the dev server's upload endpoint and the publishing pipeline use — so
 * a derivative generated here is byte-for-byte the one generated on upload, and
 * the output contract lives in exactly one place.
 *
 * Uploads through /admin are converted automatically. This command is the
 * safety net for anything dropped into public/uploads by hand, and for
 * rebuilding everything after a quality or width change.
 *
 * Usage:
 *   npx tsx scripts/optimize-images.ts           incremental (default)
 *   npx tsx scripts/optimize-images.ts --force   regenerate everything
 *
 * Exits non-zero if any derivative fails to generate.
 */

import { existsSync } from 'node:fs';
import process from 'node:process';
import {
  PATHS,
  WIDTHS,
  collectSources,
  optimizeAll,
} from '../src/services/ImageDerivativeService';

async function main(): Promise<void> {
  const force = process.argv.slice(2).includes('--force');

  if (!existsSync(PATHS.uploadsDir)) {
    console.error(`No uploads directory at ${PATHS.uploadsDir}`);
    process.exitCode = 1;
    return;
  }

  const sources = await collectSources();
  console.log(
    `optimize-images: ${sources.length} source image(s), widths ${WIDTHS.join('/')}${
      force ? ' [--force]' : ''
    }`
  );

  const summary = await optimizeAll({ force, log: (line) => console.log(line) });

  console.log(
    `\nSummary: generated ${summary.generated}, skipped ${summary.skipped}, failed ${summary.failed} ` +
      `(expected ${summary.expected} derivative(s))`
  );

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`optimize-images failed: ${message}`);
  process.exitCode = 1;
});
