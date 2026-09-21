/**
 * ImageDerivativeService
 *
 * The WebP layer. One module owns every rule about turning an original under
 * public/uploads into the responsive derivatives that `getLocalWebpSources`
 * (src/lib/image.ts) points a `<picture><source srcset>` at. Because a
 * `<source>` has no automatic fallback, a missing derivative renders a broken
 * image — so a derivative must exist at every width in WIDTHS for every
 * original, and the only way to guarantee that is to make generation part of
 * upload and publish instead of a command someone has to remember.
 *
 * Output contract, mirrored exactly from getLocalWebpSources:
 *   /uploads/foo/bar.jpeg -> public/uploads/optimized/foo/bar-{480,768,1536}.webp
 *   /portrait.jpg         -> public/uploads/optimized/portrait-{480,768,1536}.webp
 *
 * Three entry points, one worker:
 *   queueDerivatives()   fire-and-forget, used by POST /api/upload so the
 *                        response does not wait on libvips
 *   ensureDerivatives()  awaited, used by the publishing pipeline so nothing
 *                        is ever committed without its derivatives
 *   optimizeAll()        the sweep behind `npm run optimize:images`
 *
 * Node-only: it imports sharp and touches the filesystem. Nothing in the
 * browser bundle may import it.
 */

import { existsSync } from 'node:fs';
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp, { type WebpOptions } from 'sharp';

// ============================================================
// CONTRACT CONSTANTS
// ============================================================

/** Widths must stay in sync with getLocalWebpSources in src/lib/image.ts. */
export const WIDTHS = [480, 768, 1536] as const;

export const WEBP_OPTIONS: WebpOptions = {
  quality: 78,
  effort: 5,
};

/**
 * Formats a browser can render directly, so the original stays on disk as the
 * `<img src>` fallback behind the WebP sources.
 */
export const WEB_SAFE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

/**
 * Formats sharp can read but browsers cannot be trusted to display. A camera
 * roll is full of these. They are transcoded to a real `.webp` original on
 * upload — keeping one would leave the fallback `<img>` pointing at a file
 * Chrome refuses to paint.
 */
export const TRANSCODE_EXTENSIONS = ['.heic', '.heif', '.avif', '.tif', '.tiff', '.bmp'] as const;

/** Every still image extension the pipeline accepts as an input. */
export const SOURCE_EXTENSIONS: readonly string[] = [
  ...WEB_SAFE_EXTENSIONS,
  ...TRANSCODE_EXTENSIONS,
];

/** Directory name inside uploads that holds generated output (never an input). */
export const OPTIMIZED_DIRNAME = 'optimized';

// ============================================================
// PATHS
// ============================================================

/**
 * Resolved from the working directory, like CONTENT_DIR/UPLOADS_DIR elsewhere
 * in the server. Every entry point (npm scripts, the dev server) runs from the
 * package root.
 */
const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, 'public');
const uploadsDir = path.join(publicDir, 'uploads');
const optimizedDir = path.join(uploadsDir, OPTIMIZED_DIRNAME);
const portraitPath = path.join(publicDir, 'portrait.jpg');

export const PATHS = { publicDir, uploadsDir, optimizedDir, portraitPath } as const;

// ============================================================
// TYPES
// ============================================================

export interface DerivativeResult {
  /** Absolute path of the source image. */
  source: string;
  /** `/uploads/...`-style label for logs and API responses. */
  label: string;
  /** Absolute paths of every derivative that now exists for this source. */
  outputs: string[];
  generated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface OptimizationStatus {
  /** Sources waiting for the worker. */
  queued: number;
  /** The source currently being converted, if any. */
  active: string | null;
  /** Sources completed since the server started. */
  processed: number;
  /** Derivatives written since the server started. */
  generated: number;
  /** Most recent failures, newest last. */
  failures: { label: string; error: string }[];
  /** True when nothing is queued and nothing is in flight. */
  idle: boolean;
}

type LogFn = (line: string) => void;

// ============================================================
// PATH MAPPING — the half that must mirror getLocalWebpSources
// ============================================================

function stripExtension(filePath: string): string {
  const ext = path.extname(filePath);
  return ext ? filePath.slice(0, -ext.length) : filePath;
}

export function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function isInside(baseDir: string, target: string): boolean {
  const base = path.resolve(baseDir);
  const resolved = path.resolve(target);
  return resolved === base || resolved.startsWith(base + path.sep);
}

/**
 * The derivative base path for a source: its location under
 * public/uploads/optimized minus the `-<width>.webp` suffix. Returns null for
 * anything outside the archive, which is exactly the set getLocalWebpSources
 * declines to rewrite.
 */
export function basePathFor(absolutePath: string): string | null {
  const resolved = path.resolve(absolutePath);

  if (resolved === path.resolve(portraitPath)) return 'portrait';

  if (!isInside(uploadsDir, resolved)) return null;
  // Generated output is never an input.
  if (isInside(optimizedDir, resolved)) return null;

  const relative = path.relative(uploadsDir, resolved);
  if (!path.extname(relative)) return null;

  return stripExtension(relative);
}

/** Absolute paths of the derivatives a source is required to have. */
export function derivativeOutputs(absolutePath: string): string[] {
  const basePath = basePathFor(absolutePath);
  if (basePath === null) return [];
  return WIDTHS.map((width) => path.join(optimizedDir, `${basePath}-${width}.webp`));
}

/** The public URL a file under public/ is served at. */
export function publicUrlFor(absolutePath: string): string {
  return `/${toPosix(path.relative(publicDir, path.resolve(absolutePath)))}`;
}

/** Human-readable label for an original, used in logs and API payloads. */
export function labelFor(absolutePath: string): string {
  return publicUrlFor(absolutePath);
}

export function isStillImage(filePath: string): boolean {
  return SOURCE_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}

export function needsTranscode(filePath: string): boolean {
  return (TRANSCODE_EXTENSIONS as readonly string[]).includes(
    path.extname(filePath).toLowerCase()
  );
}

// ============================================================
// CONVERSION
// ============================================================

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * A derivative is fresh when it exists and is at least as new as its source.
 * Keeps repeat runs cheap and makes generation safe to call on every publish.
 */
async function isFresh(outputPath: string, sourceMtimeMs: number): Promise<boolean> {
  try {
    const outputStat = await stat(outputPath);
    return outputStat.mtimeMs >= sourceMtimeMs;
  } catch {
    return false;
  }
}

/**
 * Generate every missing derivative for one source. Never throws: a failure is
 * reported in the result so a bad file cannot take down an upload or a publish.
 */
export async function generateDerivatives(
  absolutePath: string,
  options: { force?: boolean; log?: LogFn } = {}
): Promise<DerivativeResult> {
  const { force = false, log } = options;
  const label = labelFor(absolutePath);
  const outputs = derivativeOutputs(absolutePath);

  const result: DerivativeResult = {
    source: path.resolve(absolutePath),
    label,
    outputs,
    generated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  if (outputs.length === 0) {
    result.errors.push('outside the archive — no derivative path is defined for it');
    return result;
  }

  let sourceMtimeMs: number;
  let sourceWidth: number | undefined;
  try {
    const sourceStat = await stat(absolutePath);
    sourceMtimeMs = sourceStat.mtimeMs;
    sourceWidth = (await sharp(absolutePath).metadata()).width;
  } catch (error) {
    result.failed = outputs.length;
    result.errors.push(`unreadable — ${describeError(error)}`);
    log?.(`  FAIL ${label}: unreadable — ${describeError(error)}`);
    return result;
  }

  for (const [index, width] of WIDTHS.entries()) {
    const outputPath = outputs[index];

    if (!force && (await isFresh(outputPath, sourceMtimeMs))) {
      result.skipped += 1;
      continue;
    }

    try {
      await mkdir(path.dirname(outputPath), { recursive: true });

      // withoutEnlargement caps the output at the source width rather than
      // upscaling, so a narrow original still yields every required width —
      // just no larger than the pixels actually available.
      const buffer = await sharp(absolutePath)
        .rotate() // honour EXIF orientation before resizing
        .resize({ width, withoutEnlargement: true })
        .webp(WEBP_OPTIONS)
        .toBuffer();

      await writeFile(outputPath, buffer);
      result.generated += 1;

      const capped =
        typeof sourceWidth === 'number' && sourceWidth < width
          ? ` (capped at ${sourceWidth}w)`
          : '';
      log?.(`  gen  ${toPosix(path.relative(publicDir, outputPath))}${capped}`);
    } catch (error) {
      result.failed += 1;
      result.errors.push(`${path.basename(outputPath)}: ${describeError(error)}`);
      log?.(
        `  FAIL ${toPosix(path.relative(publicDir, outputPath))}: ${describeError(error)}`
      );
    }
  }

  return result;
}

/**
 * Turn a format browsers cannot render into a full-size WebP original beside
 * it, then drop the source. Returns the path to use from here on, so the
 * caller hands back a URL that actually resolves.
 *
 * Web-safe originals are returned untouched: they are the fallback the
 * `<picture>` element falls back *to*.
 */
export async function normalizeUploadToWebp(
  absolutePath: string
): Promise<{ path: string; converted: boolean; from?: string }> {
  if (!needsTranscode(absolutePath)) {
    return { path: absolutePath, converted: false };
  }

  const from = path.extname(absolutePath).toLowerCase();
  const target = uniquePath(`${stripExtension(absolutePath)}.webp`);

  const buffer = await sharp(absolutePath)
    .rotate()
    .webp({ ...WEBP_OPTIONS, quality: 88 }) // the new original: keep more than a derivative does
    .toBuffer();

  await writeFile(target, buffer);
  await rm(absolutePath, { force: true });

  return { path: target, converted: true, from };
}

function uniquePath(candidate: string): string {
  if (!existsSync(candidate)) return candidate;
  const dir = path.dirname(candidate);
  const ext = path.extname(candidate);
  const stem = path.basename(candidate, ext);
  for (let i = 2; i < 1000; i += 1) {
    const next = path.join(dir, `${stem}-${i}${ext}`);
    if (!existsSync(next)) return next;
  }
  return path.join(dir, `${stem}-${Date.now()}${ext}`);
}

// ============================================================
// BACKGROUND QUEUE
// ============================================================

/**
 * One FIFO worker. sharp already parallelises inside libvips, so running
 * conversions one at a time keeps peak memory bounded and leaves the machine
 * responsive while the admin keeps editing — the reason this is a queue rather
 * than a bare `void generateDerivatives(...)`.
 */
const queue: { absolutePath: string; force: boolean }[] = [];
const inFlight = new Map<string, Promise<DerivativeResult>>();
const resolvers = new Map<string, ((result: DerivativeResult) => void)[]>();

let activeLabel: string | null = null;
let workerRunning = false;
let idleWaiters: (() => void)[] = [];
const counters = { processed: 0, generated: 0 };
const failures: { label: string; error: string }[] = [];
const MAX_TRACKED_FAILURES = 20;

const DEBUG = process.env.DEBUG_IMAGES === '1';

/**
 * Queue derivative generation and return without waiting. Duplicate requests
 * for a path already queued collapse onto the same promise.
 */
export function queueDerivatives(
  absolutePath: string,
  options: { force?: boolean } = {}
): Promise<DerivativeResult> {
  const resolved = path.resolve(absolutePath);

  if (!isStillImage(resolved) || derivativeOutputs(resolved).length === 0) {
    return Promise.resolve({
      source: resolved,
      label: labelFor(resolved),
      outputs: [],
      generated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    });
  }

  const existing = inFlight.get(resolved);
  if (existing) return existing;

  const promise = new Promise<DerivativeResult>((resolve) => {
    const list = resolvers.get(resolved) ?? [];
    list.push(resolve);
    resolvers.set(resolved, list);
  });

  inFlight.set(resolved, promise);
  queue.push({ absolutePath: resolved, force: options.force ?? false });
  void runWorker();

  return promise;
}

async function runWorker(): Promise<void> {
  if (workerRunning) return;
  workerRunning = true;

  try {
    while (queue.length > 0) {
      const job = queue.shift()!;
      activeLabel = labelFor(job.absolutePath);

      const result = await generateDerivatives(job.absolutePath, {
        force: job.force,
        log: DEBUG ? (line) => console.log(`[images]${line}`) : undefined,
      });

      counters.processed += 1;
      counters.generated += result.generated;

      if (result.failed > 0 || result.errors.length > 0) {
        failures.push({ label: result.label, error: result.errors.join('; ') });
        if (failures.length > MAX_TRACKED_FAILURES) failures.shift();
        console.error(
          `[images] ${result.label}: ${result.errors.join('; ') || 'derivative generation failed'}`
        );
      } else if (result.generated > 0) {
        console.log(
          `[images] ${result.label} -> ${result.generated} webp derivative(s)`
        );
      }

      activeLabel = null;
      inFlight.delete(job.absolutePath);
      for (const resolve of resolvers.get(job.absolutePath) ?? []) resolve(result);
      resolvers.delete(job.absolutePath);
    }
  } finally {
    workerRunning = false;
    activeLabel = null;
    if (queue.length === 0) {
      const waiters = idleWaiters;
      idleWaiters = [];
      for (const waiter of waiters) waiter();
    } else {
      // A job arrived while the queue was draining.
      void runWorker();
    }
  }
}

/** Resolves once the background queue has nothing left to do. */
export function waitForQueueIdle(): Promise<void> {
  if (!workerRunning && queue.length === 0) return Promise.resolve();
  return new Promise<void>((resolve) => {
    idleWaiters.push(resolve);
  });
}

export function getOptimizationStatus(): OptimizationStatus {
  return {
    queued: queue.length,
    active: activeLabel,
    processed: counters.processed,
    generated: counters.generated,
    failures: [...failures],
    idle: !workerRunning && queue.length === 0,
  };
}

// ============================================================
// AWAITED ENTRY POINTS
// ============================================================

/**
 * Guarantee derivatives for a set of files, and return the absolute paths that
 * must be committed alongside them. Non-image paths (motion clips) are ignored,
 * so callers can hand over every asset a document references.
 *
 * Throws when a derivative could not be produced: the publishing pipeline calls
 * this, and pushing an original whose `<source>` has no file behind it is a
 * broken image on the live site.
 */
export async function ensureDerivatives(
  absolutePaths: string[],
  options: { force?: boolean } = {}
): Promise<string[]> {
  // Anything already converting in the background finishes first, so a fresh
  // upload cannot be half-written when we look at it.
  await waitForQueueIdle();

  const stills = [...new Set(absolutePaths.map((p) => path.resolve(p)))].filter(
    (p) => isStillImage(p) && derivativeOutputs(p).length > 0 && existsSync(p)
  );

  const produced: string[] = [];
  const problems: string[] = [];

  for (const source of stills) {
    const result = await generateDerivatives(source, options);
    if (result.failed > 0 || result.errors.length > 0) {
      problems.push(`${result.label} (${result.errors.join('; ')})`);
      continue;
    }
    produced.push(...result.outputs.filter((output) => existsSync(output)));
  }

  if (problems.length > 0) {
    throw new Error(`WebP conversion failed for ${problems.join(', ')}`);
  }

  return produced;
}

/** Every original the pipeline is responsible for, sorted for stable logs. */
export async function collectSources(): Promise<string[]> {
  const found = await walk(uploadsDir);
  if (existsSync(portraitPath)) found.push(portraitPath);
  return found.sort((a, b) => labelFor(a).localeCompare(labelFor(b)));
}

async function walk(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];

  const results: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (path.resolve(absolutePath) === path.resolve(optimizedDir)) continue;
      results.push(...(await walk(absolutePath)));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!isStillImage(entry.name)) continue;

    results.push(absolutePath);
  }

  return results;
}

export interface SweepSummary {
  sources: number;
  generated: number;
  skipped: number;
  failed: number;
  expected: number;
}

/**
 * Sweep the whole archive. Backs `npm run optimize:images` and the admin's
 * "convert everything" endpoint, and is the safety net for images copied into
 * public/uploads by hand rather than uploaded through the admin.
 */
export async function optimizeAll(
  options: { force?: boolean; log?: LogFn } = {}
): Promise<SweepSummary> {
  const { force = false, log } = options;
  const sources = await collectSources();

  const summary: SweepSummary = {
    sources: sources.length,
    generated: 0,
    skipped: 0,
    failed: 0,
    expected: sources.length * WIDTHS.length,
  };

  for (const source of sources) {
    const result = await generateDerivatives(source, { force, log });
    summary.generated += result.generated;
    summary.skipped += result.skipped;
    summary.failed += result.failed;
  }

  return summary;
}
