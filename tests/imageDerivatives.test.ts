/**
 * Image Derivative Tests
 *
 * The WebP layer has one hard contract: the files it writes must be the files
 * `getLocalWebpSources` asks the browser for. A `<picture><source>` has no
 * fallback, so a one-character disagreement between the two — a width, a
 * directory, an extension — is a broken image on the live site, and nothing in
 * typecheck or the build would catch it. These tests hold the two halves
 * together.
 *
 * Run with: npx tsx tests/imageDerivatives.test.ts
 */

import path from 'node:path';
import { getLocalWebpSources } from '../src/lib/image';
import {
  SOURCE_EXTENSIONS,
  WIDTHS,
  basePathFor,
  derivativeOutputs,
  isStillImage,
  needsWebpOriginal,
  publicUrlFor,
  PATHS,
} from '../src/services/ImageDerivativeService';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (e: any) {
      failed++;
      console.log(`  ✗ ${name}: ${e.message}`);
    }
  };
}

function assertEqual(actual: any, expected: any, msg?: string) {
  if (actual !== expected) {
    throw new Error(`${msg || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value: boolean, msg?: string) {
  if (!value) throw new Error(msg || 'Expected true');
}

/** The URLs the renderer asks for, in srcset order. */
function rendererUrls(publicPath: string): string[] {
  const sources = getLocalWebpSources(publicPath);
  if (!sources) throw new Error(`getLocalWebpSources returned nothing for ${publicPath}`);
  return sources.srcSet.split(',').map((entry) => entry.trim().split(' ')[0]);
}

/** The URLs the pipeline writes, for the same image. */
function pipelineUrls(publicPath: string): string[] {
  const absolute = path.join(PATHS.publicDir, publicPath);
  return derivativeOutputs(absolute).map(publicUrlFor);
}

async function runTests() {
  console.log('\n=== Image Derivative Tests ===\n');

  const tests = [
    // ------------------------------------------------- renderer/pipeline parity
    test('an upload writes exactly the derivatives the renderer requests', () => {
      const written = pipelineUrls('/uploads/journal/1737000000000-42.jpg');
      const requested = rendererUrls('/uploads/journal/1737000000000-42.jpg');
      assertEqual(written.join('|'), requested.join('|'), 'derivative URLs must match');
    }),

    test('nested upload directories keep their shape under optimized/', () => {
      assertEqual(
        pipelineUrls('/uploads/photography/series/frame-01.jpeg').join('|'),
        rendererUrls('/uploads/photography/series/frame-01.jpeg').join('|')
      );
    }),

    test('portrait.jpg maps into optimized/ the same way for both halves', () => {
      assertEqual(
        pipelineUrls('/portrait.jpg').join('|'),
        rendererUrls('/portrait.jpg').join('|')
      );
      assertEqual(basePathFor(PATHS.portraitPath), 'portrait');
    }),

    test('every accepted still format produces the same three derivative paths', () => {
      for (const ext of SOURCE_EXTENSIONS) {
        const publicPath = `/uploads/general/sample${ext}`;
        const written = pipelineUrls(publicPath);
        assertEqual(written.length, WIDTHS.length, `${ext} should yield ${WIDTHS.length} outputs`);
        // An upload is rewritten as `.webp` before this point, but the mapping
        // must be defined for the source extension too — the sweep still has to
        // find derivatives for the JPEGs already in the archive.
        assertEqual(written.join('|'), rendererUrls(publicPath).join('|'), `${ext} mapping`);
      }
    }),

    test('a converted upload lands on the same derivative paths as its source', () => {
      // `1737-42.jpg` becomes `1737-42.webp`, and the stem is what the mapping
      // keys on — so conversion never orphans a derivative.
      assertEqual(
        pipelineUrls('/uploads/journal/1737000000000-42.webp').join('|'),
        pipelineUrls('/uploads/journal/1737000000000-42.jpg').join('|')
      );
    }),

    test('derivative filenames carry every width in WIDTHS', () => {
      const written = pipelineUrls('/uploads/tech/build-log.png');
      for (const width of WIDTHS) {
        assertTrue(
          written.some((url) => url.endsWith(`-${width}.webp`)),
          `missing the ${width}w derivative`
        );
      }
    }),

    // ---------------------------------------------------------- source scoping
    test('generated output is never treated as a source', () => {
      assertEqual(
        basePathFor(path.join(PATHS.optimizedDir, 'journal', 'frame-480.webp')),
        null
      );
    }),

    test('files outside the archive have no derivative path', () => {
      assertEqual(basePathFor(path.join(PATHS.publicDir, 'favicon.png')), null);
      assertEqual(basePathFor('/etc/passwd'), null);
      // ...which is exactly what the renderer declines to rewrite.
      assertEqual(getLocalWebpSources('https://example.com/photo.jpg'), undefined);
      assertEqual(getLocalWebpSources('/favicon.png'), undefined);
    }),

    test('traversal out of uploads/ is not mapped back in', () => {
      assertEqual(basePathFor(path.join(PATHS.uploadsDir, '..', '..', 'secret.jpg')), null);
    }),

    // ------------------------------------------------------- format classification
    test('every upload becomes a WebP original except one already WebP', () => {
      for (const ext of SOURCE_EXTENSIONS) {
        const file = `frame${ext}`;
        assertTrue(isStillImage(file), `${file} must be accepted as a still`);
        assertEqual(
          needsWebpOriginal(file),
          ext !== '.webp',
          `${ext} conversion decision`
        );
      }
      // Case does not decide it either.
      assertTrue(needsWebpOriginal('frame.JPG'), 'uppercase .JPG must still convert');
      assertTrue(!needsWebpOriginal('frame.WEBP'), 'uppercase .WEBP is already converted');
    }),

    test('motion clips are never converted', () => {
      for (const file of ['clip.mp4', 'clip.webm', 'loop.gif']) {
        assertTrue(!isStillImage(file), `${file} must not be queued for conversion`);
        assertTrue(!needsWebpOriginal(file), `${file} must not be rewritten`);
      }
    }),
  ];

  for (const t of tests) await t();

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests();
