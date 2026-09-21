import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import fs from 'fs-extra';
import multer from 'multer';
import matter from 'gray-matter';
import { createServer as createViteServer } from 'vite';
import http from 'http';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { transitionState, getItem, getAllItems, saveItem, createItem, deleteItem, initialize, getStateStats, ContentState } from './src/lib/contentState';
import { PreviewDocument } from './src/components/PreviewDocument';
import { PublishingService } from './src/services/PublishingService';
import { DeploymentService } from './src/services/DeploymentService';
import {
  SOURCE_EXTENSIONS,
  getOptimizationStatus,
  normalizeUploadToWebp,
  optimizeAll,
  queueDerivatives,
} from './src/services/ImageDerivativeService';

const app = express();
/**
 * 3000 by default. Overridable so a second instance can be started alongside a
 * running one (checking an API change without taking the live editor down).
 */
const PORT = Number(process.env.PORT) || 3000;
const HOST = '127.0.0.1';

/**
 * CANONICAL COLLECTION LIST
 * Single source of truth for every route that maps user input onto a directory.
 * Anything not in this list is rejected before it reaches the filesystem.
 */
const COLLECTIONS = [
  'journal',
  'tech',
  'photography',
  'portfolio',
  'gear',
  'timeline',
  'favorites',
  'home',
  'gallery'
] as const;

// Uploads may additionally land in a shared bucket for un-scoped media.
const UPLOAD_COLLECTIONS = [...COLLECTIONS, 'general'] as const;

/**
 * Mirrors SLUG_PATTERN in src/services/ValidationService.ts but is defined locally so the
 * server has no import-time dependency on the browser-side validation layer.
 */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

function isValidCollection(value: unknown): value is (typeof COLLECTIONS)[number] {
  return typeof value === 'string' && (COLLECTIONS as readonly string[]).includes(value);
}

function isValidUploadCollection(value: unknown): value is (typeof UPLOAD_COLLECTIONS)[number] {
  return typeof value === 'string' && (UPLOAD_COLLECTIONS as readonly string[]).includes(value);
}

function isValidSlug(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 120) return false;
  if (value.includes('..') || value.includes('/') || value.includes('\\')) return false;
  if (value.includes('\0')) return false;
  return SLUG_PATTERN.test(value);
}

const INVALID_COLLECTION_MESSAGE = `Invalid collection. Allowed collections: ${COLLECTIONS.join(', ')}.`;
const INVALID_SLUG_MESSAGE = 'Invalid slug. Slugs must match /^[a-z0-9][a-z0-9-]*$/ and may not contain ".." or "/".';

/**
 * PATH CONTAINMENT GUARD
 * Resolves segments against a base directory and returns null when the result escapes it.
 * Belt-and-braces backstop behind the collection/slug allowlists.
 */
function resolveInside(baseDir: string, ...segments: string[]): string | null {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, ...segments);
  if (target !== base && !target.startsWith(base + path.sep)) return null;
  return target;
}

/**
 * Route guard for any endpoint carrying :collection and/or :slug params.
 * Returns 400 (never 500) with a clear JSON error for rejected input, and never
 * echoes the raw user value back to the client.
 */
function validateContentParams(req: Request, res: Response, next: NextFunction) {
  if ('collection' in req.params && !isValidCollection(req.params.collection)) {
    return res.status(400).json({ error: INVALID_COLLECTION_MESSAGE });
  }
  if ('slug' in req.params && !isValidSlug(req.params.slug)) {
    return res.status(400).json({ error: INVALID_SLUG_MESSAGE });
  }
  next();
}

// Restrict CORS to the local authoring origins only — a wildcard lets any site
// the browser visits drive this API while `npm run dev` is running.
const ALLOWED_ORIGINS = [`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Vary', 'Origin');
  res.header(
    'Access-Control-Allow-Origin',
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Studio-Token');
  res.header('Access-Control-Expose-Headers', 'Content-Type, X-Content-Length, X-File-Name');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Enable robust JSON parsing for incoming editor requests
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * Respond 500 and leave a trace.
 *
 * Handlers used to answer `res.status(500).json({ error: error.message })` and
 * log nothing, so a failed request showed up in the browser as "Failed to load
 * dynamic contents" with no corresponding line anywhere on the server — there
 * was no way to find out what had actually thrown. Anything that reaches here
 * now names the route and prints the stack.
 */
function fail(res: Response, error: unknown, context: string): void {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(`[api] ${context} failed: ${err.message}`);
  if (err.stack) console.error(err.stack);
  res.status(500).json({ error: err.message, context });
}

/**
 * MUTATION GUARD
 * When STUDIO_TOKEN is set in the environment (.env is now loaded via dotenv), every
 * mutating /api request must present a matching x-studio-token header. When it is not
 * set, requests pass through and a single warning is emitted at startup so local
 * authoring stays frictionless while lockdown remains one env var away.
 */
const STUDIO_TOKEN = process.env.STUDIO_TOKEN?.trim() || '';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

app.use((req, res, next) => {
  if (!STUDIO_TOKEN) return next();
  if (!req.path.startsWith('/api/')) return next();
  if (!MUTATING_METHODS.has(req.method)) return next();

  const provided = req.headers['x-studio-token'];
  if (typeof provided === 'string' && provided === STUDIO_TOKEN) return next();

  return res.status(401).json({ error: 'Unauthorized. A valid x-studio-token header is required for mutating requests.' });
});

const CONTENT_DIR = path.join(process.cwd(), 'content');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

// Ensure system directories exist
fs.ensureDirSync(CONTENT_DIR);
fs.ensureDirSync(UPLOADS_DIR);
COLLECTIONS.forEach(col => {
  fs.ensureDirSync(path.join(CONTENT_DIR, col));
  fs.ensureDirSync(path.join(UPLOADS_DIR, col));
});

// Serve uploaded images explicitly — needed in production where only dist/ is served
// In dev, Vite also serves public/ but this ensures consistency
app.use('/uploads', express.static(UPLOADS_DIR));

/**
 * Resolves the upload bucket from a multipart body field.
 * Returns 'general' when absent, or null when the value is not an allowed collection —
 * previously this value was used raw, allowing writes outside public/uploads.
 */
function resolveUploadCollection(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return 'general';
  return isValidUploadCollection(value) ? value : null;
}

// Configure Multer storage to place images in collection-specific uploads directories
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const col = resolveUploadCollection(req.body?.collection);
    if (!col) {
      return cb(new Error(INVALID_COLLECTION_MESSAGE), '');
    }
    const targetDir = resolveInside(UPLOADS_DIR, col);
    if (!targetDir) {
      return cb(new Error(INVALID_COLLECTION_MESSAGE), '');
    }
    fs.ensureDirSync(targetDir);
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

/**
 * UPLOAD TYPES
 * Stills and short motion clips. GIF is accepted because it is what a phone
 * screen recording usually becomes, and mp4/webm because a GIF of any real
 * length is an order of magnitude larger than the equivalent video.
 *
 * The still list comes from the WebP layer (ImageDerivativeService) rather than
 * being repeated here: anything sharp can read is accepted, and the formats a
 * browser cannot render — HEIC off a phone, TIFF off a scanner — are transcoded
 * to a real WebP original before the URL is handed back.
 *
 * The cap exists because uploads are committed to the repository and
 * redeployed on every build: `public/uploads` is already the largest thing in
 * the tree, and an unbounded clip would dominate it.
 */
const ALLOWED_IMAGE_EXTENSIONS = SOURCE_EXTENSIONS;
const ALLOWED_MOTION_EXTENSIONS = ['.gif', '.mp4', '.webm'] as const;
const MAX_UPLOAD_BYTES = 40 * 1024 * 1024; // 40 MB

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_MOTION_EXTENSIONS] as readonly string[];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type "${ext || 'unknown'}". Images: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}. Motion: ${ALLOWED_MOTION_EXTENSIONS.join(', ')}.`
        )
      );
    }
  }
});

/**
 * SLUGIFY HELPER
 * Generates an elegant and sanitized URL-friendly slug from custom text.
 * Output is constrained to the SLUG_PATTERN character set so it can never
 * contribute a path separator or traversal segment.
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')        // Replace spaces and underscores with -
    .replace(/[^a-z0-9-]+/g, '')    // Remove everything outside the slug charset
    .replace(/-{2,}/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
}

// ----------------------------------------------------
// EXPRESS API ENDPOINTS
// ----------------------------------------------------

/**
 * POST /api/upload
 * Handles visual image uploads, returning relative URL paths for reference in frontmatter.
 *
 * THE WEBP LAYER
 * Every still that lands here becomes WebP automatically, so
 * `npm run optimize:images` is no longer something to remember:
 *
 *   1. The upload is rewritten as a full-size `.webp` original — a JPEG as much
 *      as a HEIC — *before* responding, because the URL in the response is what
 *      gets written into the front-matter and committed. An image too large for
 *      WebP to represent keeps its original and says so.
 *   2. The responsive 480/768/1536 derivatives are then queued and generated in
 *      the background, so the admin gets its URL back immediately instead of
 *      waiting on libvips. Progress is readable at GET /api/uploads/optimization,
 *      and the publishing pipeline waits for the queue before it stages — an
 *      image can never be pushed without the derivatives its <source> points at.
 */
app.post(
  '/api/upload',
  (req, res, next) => {
    // Surface multer rejections (bad collection, unsupported extension) as 400s, not 500s
    upload.single('image')(req, res, (err: any) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }
      const collection = resolveUploadCollection(req.body?.collection);
      if (!collection) {
        return res.status(400).json({ error: INVALID_COLLECTION_MESSAGE });
      }

      let storedPath = req.file.path;
      let converted: { from: string; to: string } | undefined;
      let conversionNote: string | undefined;

      // Step 1 — rewrite as a WebP original. Awaited: the URL depends on it.
      try {
        const normalized = await normalizeUploadToWebp(storedPath);
        if (normalized.converted) {
          storedPath = normalized.path;
          converted = { from: normalized.from ?? '', to: '.webp' };
          console.log(`[upload] ${normalized.from} converted to webp: ${path.basename(storedPath)}`);
        } else if (normalized.reason) {
          conversionNote = normalized.reason;
          console.warn(`[upload] ${path.basename(storedPath)}: ${normalized.reason}`);
        }
      } catch (error: any) {
        await fs.remove(storedPath).catch(() => {});
        return res.status(400).json({
          error: `Could not read this image (${path.extname(req.file.originalname) || 'unknown format'}): ${error.message}`,
        });
      }

      // Step 2 — derivatives in the background.
      void queueDerivatives(storedPath);

      // Return path relative to the public router domain
      const relativeUrl = `/uploads/${collection}/${path.basename(storedPath)}`;
      res.json({
        success: true,
        url: relativeUrl,
        converted,
        note: conversionNote,
        optimization: getOptimizationStatus(),
      });
    } catch (error: any) {
      fail(res, error, 'POST /api/upload');
    }
  }
);

/**
 * GET /api/uploads/optimization
 * Background WebP queue state, so the admin can show conversion as it happens
 * rather than leaving it invisible.
 */
app.get('/api/uploads/optimization', (_req, res) => {
  res.json(getOptimizationStatus());
});

/**
 * POST /api/uploads/optimization
 * Sweep the whole archive — the backstop for images copied into public/uploads
 * by hand instead of uploaded through the admin. Body: { force?: boolean }.
 */
app.post('/api/uploads/optimization', async (req, res) => {
  try {
    const force = req.body?.force === true;
    const summary = await optimizeAll({ force });
    res.json({ success: summary.failed === 0, summary, optimization: getOptimizationStatus() });
  } catch (error: any) {
    fail(res, error, 'POST /api/uploads/optimization');
  }
});

/**
 * GET /api/content
 * Crawls and compiles summaries of all existing items from all collections
 * Merges publishing state from the content state registry
 */
app.get('/api/content', async (req, res) => {
  try {
    const collections = COLLECTIONS;
    const allItems: any[] = [];

    /**
     * One registry read for the whole request.
     *
     * This previously called getItem() per markdown file, and getItem re-reads
     * and re-parses content-state.json every time — around a hundred reads of
     * the same file to serve one listing. Besides the waste, it left a wide
     * window in which a concurrent registry write could make a read fail and
     * turn the whole listing into a 500.
     */
    const registryIndex = new Map(
      (await getAllItems()).map((item) => [`${item.collection}/${item.slug}`, item])
    );

    for (const col of collections) {
      const colDir = path.join(CONTENT_DIR, col);
      if (!(await fs.pathExists(colDir))) continue;

      const files = await fs.readdir(colDir);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(colDir, file);
        const raw = await fs.readFile(filePath, 'utf-8');

        /**
         * Parse per file, and survive a bad one.
         *
         * A single malformed front-matter block used to throw out of this loop
         * and turn the whole listing into a 500 — one stray character in one
         * gear file made the entire admin unusable, and because the browser's
         * markdown parser is more forgiving the public site looked fine, so
         * there was nothing to point at. Now the broken file is reported as an
         * item carrying its own error, which is what lets it be found and fixed.
         */
        let data: Record<string, any> = {};
        let frontMatterError: string | undefined;
        try {
          ({ data } = matter(raw) as { data: Record<string, any> });
        } catch (parseError: any) {
          frontMatterError = String(parseError?.message || parseError).split('\n')[0];
          console.error(`[api] invalid front-matter in content/${col}/${file}: ${frontMatterError}`);
        }

        const slug = data.slug || file.replace('.md', '');

        // Merge publishing state from registry
        const registryItem = registryIndex.get(`${col}/${slug}`);

        allItems.push({
          collection: col,
          slug,
          title: data.title || data.projectImage ? data.title || 'Untitled Project' : data.title || 'Untitled',
          date: data.date || '',
          category: data.category || '',
          featured: !!data.featured,
          coverImage: data.coverImage || data.featuredImage || data.projectImage || data.image || '',
          excerpt: data.excerpt || data.description || '',
          filePath: `content/${col}/${file}`,
          frontMatterError,
          state: registryItem?.state || 'draft',
          unsavedChanges: registryItem?.unsavedChanges || false,
          publishedAt: registryItem?.publishedAt
        });
      }
    }

    // Sort by date (descending) where available
    allItems.sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      return dateB - dateA;
    });

    res.json(allItems);
  } catch (error: any) {
    fail(res, error, 'GET /api/content');
  }
});

/**
 * GET /api/content/:collection
 * Retrieves list of items matching a specific collection
 */
app.get('/api/content/:collection', validateContentParams, async (req, res) => {
  try {
    const { collection } = req.params;
    const colDir = resolveInside(CONTENT_DIR, collection);
    if (!colDir) {
      return res.status(400).json({ error: INVALID_COLLECTION_MESSAGE });
    }
    if (!(await fs.pathExists(colDir))) {
      return res.status(404).json({ error: `Collection ${collection} does not exist.` });
    }

    const files = await fs.readdir(colDir);
    const items: any[] = [];

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(colDir, file);
      const raw = await fs.readFile(filePath, 'utf-8');
      const { data, content } = matter(raw);

      items.push({
        slug: data.slug || file.replace('.md', ''),
        data,
        body: content,
        filePath: `content/${collection}/${file}`
      });
    }

    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/content/:collection/:slug
 * Reads detailed single document information
 */
app.get('/api/content/:collection/:slug', validateContentParams, async (req, res) => {
  try {
    const { collection, slug } = req.params;
    const filePath = resolveInside(CONTENT_DIR, collection, `${slug}.md`);
    if (!filePath) {
      return res.status(400).json({ error: INVALID_SLUG_MESSAGE });
    }

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: `File not found at content/${collection}/${slug}.md` });
    }

    const raw = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(raw);

    res.json({
      collection,
      slug,
      data,
      body: content
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// CONTENT STATE LIFECYCLE ENDPOINTS
// ----------------------------------------------------

/**
 * GET /api/content/:collection/:slug/state
 * Returns the publishing state and metadata for a content item
 */
app.get('/api/content/:collection/:slug/state', validateContentParams, async (req, res) => {
  try {
    const { collection, slug } = req.params;
    const item = await getItem(collection, slug);

    if (!item) {
      return res.status(404).json({ error: `Item not found: ${collection}/${slug}` });
    }

    res.json({
      state: item.state,
      unsavedChanges: item.unsavedChanges,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      publishedAt: item.publishedAt,
      lastReviewedAt: item.lastReviewedAt,
      archivedAt: item.archivedAt,
      versions: item.versions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/content/:collection/:slug/state
 * Transitions content through the publishing lifecycle.
 * Valid transitions: draft→review, review→published, review→draft,
 *                    published→archived, archived→draft
 */
app.patch('/api/content/:collection/:slug/state', validateContentParams, async (req, res) => {
  try {
    const { collection, slug } = req.params;
    const { state, notes } = req.body;

    if (!state || !['draft', 'review', 'published', 'archived'].includes(state)) {
      return res.status(400).json({ error: 'Invalid state. Must be draft, review, published, or archived.' });
    }

    const result = await transitionState(collection, slug, state as ContentState, { notes });

    res.json({
      success: true,
      item: result
    });
  } catch (error: any) {
    if (error.name === 'ContentNotFoundError') {
      return res.status(404).json({ error: error.message });
    }
    if (error.name === 'InvalidTransitionError') {
      return res.status(422).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/registry/state-stats
 * Aggregate statistics across all content states
 */
app.get('/api/registry/state-stats', async (_req, res) => {
  try {
    const stats = await getStateStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// PREVIEW SYSTEM
// ============================================================

/**
 * GET /preview/:collection/:slug
 * Renders a production-like preview of content using SSR.
 * Inlines the site's Tailwind index.css via Vite dev server.
 */
app.get('/preview/:collection/:slug', async (req, res) => {
  const errorPage = (heading: string, message: string) =>
    `<html><body style="background:#0a0a09;color:#999;font-family:sans-serif;padding:2rem;"><h1>${heading}</h1><p>${message}</p></body></html>`;

  try {
    const { collection, slug } = req.params;

    if (!isValidCollection(collection)) {
      res.set('Content-Type', 'text/html');
      return res.status(400).send(errorPage('400', 'Invalid collection.'));
    }
    if (!isValidSlug(slug)) {
      res.set('Content-Type', 'text/html');
      return res.status(400).send(errorPage('400', 'Invalid slug.'));
    }

    const filePath = resolveInside(CONTENT_DIR, collection, `${slug}.md`);
    if (!filePath) {
      res.set('Content-Type', 'text/html');
      return res.status(400).send(errorPage('400', 'Invalid content path.'));
    }

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).send(errorPage('404', 'Content not found.'));
    }

    const raw = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(raw);

    const html = renderToString(
      React.createElement(PreviewDocument, {
        frontmatter: data,
        body: content,
        collection
      })
    );

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview — ${data.title || 'Untitled'}</title>
  <link rel="stylesheet" href="/src/index.css">
</head>
<body>
  ${html}
</body>
</html>`;

    res.set('Content-Type', 'text/html');
    res.send(fullHtml);
  } catch (error: any) {
    res.status(500).send(`<html><body style="background:#0a0a09;color:#999;font-family:sans-serif;padding:2rem;"><h1>Preview Error</h1><pre>${error.message}</pre></body></html>`);
  }
});

// ============================================================
// PUBLISHING PIPELINE
// ============================================================

const publishingService = new PublishingService();
const deploymentService = new DeploymentService(publishingService);

/**
 * POST /api/publish
 * Triggers the full 11-step publishing pipeline.
 * Returns a job ID immediately; pipeline runs asynchronously.
 */
app.post('/api/publish', async (req, res) => {
  try {
    const { collection, slug, title, body, frontmatter, images } = req.body;

    if (!collection || !slug || !title) {
      return res.status(400).json({ error: 'collection, slug, and title are required' });
    }

    if (!isValidCollection(collection)) {
      return res.status(400).json({ error: INVALID_COLLECTION_MESSAGE });
    }
    if (!isValidSlug(slug)) {
      return res.status(400).json({ error: INVALID_SLUG_MESSAGE });
    }

    const job = await publishingService.publish({
      collection,
      slug,
      title,
      body: body || '',
      frontmatter: frontmatter || {},
      images,
    });

    res.json({
      success: true,
      jobId: job.id,
      status: job.status,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/publish/:jobId
 * Retrieves the current state of a publishing job.
 */
app.get('/api/publish/:jobId', (req, res) => {
  const job = publishingService.getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

/**
 * GET /api/publish/:jobId/progress
 * Server-Sent Events stream for real-time publishing progress.
 */
app.get('/api/publish/:jobId/progress', (req, res) => {
  const { jobId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendUpdate = (job: any) => {
    res.write(`data: ${JSON.stringify(job)}\n\n`);
  };

  // Subscribe to job updates
  const unsubscribe = publishingService.subscribe(jobId, sendUpdate);

  // Send initial state
  const job = publishingService.getJob(jobId);
  if (job) {
    sendUpdate(job);
  } else {
    res.write(`data: ${JSON.stringify({ error: 'Job not found' })}\n\n`);
    res.end();
    return;
  }

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 15000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
});

/**
 * GET /api/deploy/status
 * Returns current deployment status for the Deployment Center.
 */
app.get('/api/deploy/status', async (_req, res) => {
  try {
    const status = await deploymentService.getStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/deploy/commits
 * Returns recent git commit history.
 */
app.get('/api/deploy/commits', async (_req, res) => {
  try {
    const commits = await deploymentService.getCommitHistory(30);
    res.json(commits);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/content
 * Creates a brand new markdown document with secure frontmatter serialization
 */
app.post('/api/content', async (req, res) => {
  try {
    const { collection, data = {}, body = '' } = req.body;

    if (!collection) {
      return res.status(400).json({ error: 'Collection is a required parameter' });
    }

    if (!isValidCollection(collection)) {
      return res.status(400).json({ error: INVALID_COLLECTION_MESSAGE });
    }

    // Auto-generate Slug if missing or empty
    let slug = req.body.slug;
    if (!slug) {
      const titleToSlug = data.title || 'untitled';
      slug = slugify(titleToSlug);
    } else {
      slug = slugify(slug);
    }

    if (!isValidSlug(slug)) {
      return res.status(400).json({ error: INVALID_SLUG_MESSAGE });
    }

    // Ensure slug doesn't collide
    const colDir = resolveInside(CONTENT_DIR, collection);
    if (!colDir) {
      return res.status(400).json({ error: INVALID_COLLECTION_MESSAGE });
    }
    await fs.ensureDir(colDir);

    let filePath = resolveInside(colDir, `${slug}.md`);
    if (!filePath) {
      return res.status(400).json({ error: INVALID_SLUG_MESSAGE });
    }
    let counter = 1;
    let finalSlug = slug;
    while (await fs.pathExists(filePath)) {
      finalSlug = `${slug}-${counter}`;
      const nextPath = resolveInside(colDir, `${finalSlug}.md`);
      if (!nextPath) {
        return res.status(400).json({ error: INVALID_SLUG_MESSAGE });
      }
      filePath = nextPath;
      counter++;
    }

    data.slug = finalSlug;
    if (!data.date) {
      data.date = new Date().toISOString().split('T')[0];
    }

    // Matter-stringify contents
    const markdownStr = matter.stringify(body, data);
    await fs.writeFile(filePath, markdownStr, 'utf-8');

    // Register in content state as draft
    await createItem(collection, finalSlug, data.title || finalSlug, `content/${collection}/${finalSlug}.md`);

    res.json({ success: true, slug: finalSlug, filePath });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/content
 * Updates an existing resource file, supporting filename renaming in case of slug alterations
 */
app.put('/api/content', async (req, res) => {
  try {
    const { collection, slug, data = {}, body = '', newSlug } = req.body;

    if (!collection || !slug) {
      return res.status(400).json({ error: 'parameters: "collection" and "slug" are required' });
    }

    if (!isValidCollection(collection)) {
      return res.status(400).json({ error: INVALID_COLLECTION_MESSAGE });
    }
    if (!isValidSlug(slug)) {
      return res.status(400).json({ error: INVALID_SLUG_MESSAGE });
    }

    const colDir = resolveInside(CONTENT_DIR, collection);
    const sourcePath = colDir && resolveInside(colDir, `${slug}.md`);
    if (!colDir || !sourcePath) {
      return res.status(400).json({ error: INVALID_SLUG_MESSAGE });
    }

    if (!(await fs.pathExists(sourcePath))) {
      return res.status(404).json({ error: `Original file does not exist at content/${collection}/${slug}.md` });
    }

    let finalSlug = slug;
    let targetPath = sourcePath;

    if (newSlug && slugify(newSlug) !== slug) {
      finalSlug = slugify(newSlug);
      if (!isValidSlug(finalSlug)) {
        return res.status(400).json({ error: INVALID_SLUG_MESSAGE });
      }
      const renamedPath = resolveInside(colDir, `${finalSlug}.md`);
      if (!renamedPath) {
        return res.status(400).json({ error: INVALID_SLUG_MESSAGE });
      }
      targetPath = renamedPath;

      // Ensure target doesn't collision with other distinct files
      if (await fs.pathExists(targetPath)) {
        return res.status(400).json({ error: `Cannot rename to "${finalSlug}" as a file with this name already exists.` });
      }

      // Remove the original file
      await fs.remove(sourcePath);
    }

    data.slug = finalSlug;

    const markdownStr = matter.stringify(body, data);
    await fs.writeFile(targetPath, markdownStr, 'utf-8');

    // Update registry entry on slug change or metadata update
    const existingItem = await getItem(collection, slug);
    if (existingItem) {
      existingItem.slug = finalSlug;
      existingItem.title = data.title || existingItem.title;
      existingItem.filePath = `content/${collection}/${finalSlug}.md`;
      existingItem.updatedAt = new Date().toISOString();
      await saveItem(existingItem);
    }

    res.json({ success: true, slug: finalSlug, filePath: targetPath });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/content
 * Removes documents from directories
 */
app.delete('/api/content', async (req, res) => {
  try {
    const { collection, slug } = req.body;

    if (!collection || !slug) {
      return res.status(400).json({ error: 'Both collection and slug parameters are required' });
    }

    if (!isValidCollection(collection)) {
      return res.status(400).json({ error: INVALID_COLLECTION_MESSAGE });
    }
    if (!isValidSlug(slug)) {
      return res.status(400).json({ error: INVALID_SLUG_MESSAGE });
    }

    const filePath = resolveInside(CONTENT_DIR, collection, `${slug}.md`);
    if (!filePath) {
      return res.status(400).json({ error: INVALID_SLUG_MESSAGE });
    }
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: `File not found at content/${collection}/${slug}.md` });
    }

    await fs.remove(filePath);
    await deleteItem(collection, slug);
    res.json({ success: true, message: `Successfully deleted content ${slug}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Extra convenient path-based deletions
app.delete('/api/content/:collection/:slug', validateContentParams, async (req, res) => {
  try {
    const { collection, slug } = req.params;
    const filePath = resolveInside(CONTENT_DIR, collection, `${slug}.md`);
    if (!filePath) {
      return res.status(400).json({ error: INVALID_SLUG_MESSAGE });
    }
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: `File not found` });
    }
    await fs.remove(filePath);
    await deleteItem(collection, slug);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// DECAP CMS GITHUB OAUTH AUTHENTICATION ENDPOINTS
// ============================================================

/**
 * POST /api/auth
 * Handles GitHub OAuth token exchange
 * Used by Decap CMS for secure GitHub authentication in production
 */
app.post('/api/auth', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    if (!process.env.VITE_GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      console.warn('GitHub OAuth credentials not configured. Set VITE_GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.');
      return res.status(501).json({ error: 'OAuth not configured. Use Personal Access Token instead.' });
    }

    // Import axios dynamically to handle the HTTP request
    const axios = await import('axios');
    const response = await axios.default.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.VITE_GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/callback`
    }, {
      headers: { Accept: 'application/json' }
    });

    const { access_token, error } = response.data;
    
    if (error) {
      return res.status(401).json({ error: `GitHub OAuth error: ${error}` });
    }

    // Return token for Decap CMS to use
    res.json({ token: access_token });
  } catch (error: any) {
    console.error('OAuth token exchange error:', error.message);
    res.status(500).json({ error: 'Failed to exchange OAuth code for token' });
  }
});

/**
 * GET /api/auth/callback
 * GitHub OAuth callback redirect handler
 * Redirects back to admin panel with authorization code
 */
app.get('/api/auth/callback', (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.redirect(`/admin?error=${error}`);
  }
  
  if (code) {
    res.redirect(`/admin?code=${code}`);
  } else {
    res.redirect('/admin?error=no_code');
  }
});

// Configure Vite integration wrapper inside Express serving context
async function startServer() {
  // Initialize content state registry on startup
  try {
    await initialize({ autoMigrate: true });
    console.log('[ContentState] Registry initialized');
  } catch (err: any) {
    console.warn('[ContentState] Registry init warning:', err.message);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  /**
   * Last-resort error handler. Registered after every route and after the Vite
   * middleware, so anything that throws without its own try/catch still names
   * itself in the server log instead of surfacing as a bare 500 in the browser.
   */
  app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(error);
    fail(res, error, `${req.method} ${req.originalUrl}`);
  });

  app.listen(PORT, HOST, () => {
    console.log(`Server is booted at http://localhost:${PORT} (bound to ${HOST} only)`);
    if (STUDIO_TOKEN) {
      console.log('[Security] STUDIO_TOKEN is set — mutating /api requests require the x-studio-token header.');
    } else {
      console.warn('[Security] STUDIO_TOKEN is not set — mutating /api requests are unauthenticated. Set STUDIO_TOKEN in .env to require an x-studio-token header.');
    }
  });
}

startServer();
