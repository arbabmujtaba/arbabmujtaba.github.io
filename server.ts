import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import multer from 'multer';
import matter from 'gray-matter';
import { createServer as createViteServer } from 'vite';
import http from 'http';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { transitionState, getItem, saveItem, createItem, deleteItem, initialize, getStateStats, ContentState } from './src/lib/contentState';
import { PreviewDocument } from './src/components/PreviewDocument';
import { PublishingService } from './src/services/PublishingService';
import { DeploymentService } from './src/services/DeploymentService';

const app = express();
const PORT = 3000;

// Enable CORS for Decap CMS local backend development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Expose-Headers', 'Content-Type, X-Content-Length, X-File-Name');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Enable robust JSON parsing for incoming editor requests
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const CONTENT_DIR = path.join(process.cwd(), 'content');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

// Ensure system directories exist
fs.ensureDirSync(CONTENT_DIR);
fs.ensureDirSync(UPLOADS_DIR);
['journal', 'tech', 'photography', 'collection', 'portfolio', 'gear', 'timeline', 'favorites', 'home', 'gallery'].forEach(col => {
  fs.ensureDirSync(path.join(CONTENT_DIR, col));
  fs.ensureDirSync(path.join(UPLOADS_DIR, col));
});

// Serve uploaded images explicitly — needed in production where only dist/ is served
// In dev, Vite also serves public/ but this ensures consistency
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure Multer storage to place images in collection-specific uploads directories
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const col = req.body.collection || 'general';
    const targetDir = path.join(UPLOADS_DIR, col);
    fs.ensureDirSync(targetDir);
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, and WEBP image uploads are supported.'));
    }
  }
});

/**
 * SLUGIFY HELPER
 * Generates an elegant and sanitized URL-friendly slug from custom text.
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
}

// ----------------------------------------------------
// EXPRESS API ENDPOINTS
// ----------------------------------------------------

/**
 * POST /api/upload
 * Handles visual image uploads, returning relative URL paths for reference in frontmatter
 */
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const collection = req.body.collection || 'general';
    // Return path relative to the public router domain
    const relativeUrl = `/uploads/${collection}/${req.file.filename}`;
    res.json({ success: true, url: relativeUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/content
 * Crawls and compiles summaries of all existing items from all collections
 * Merges publishing state from the content state registry
 */
app.get('/api/content', async (req, res) => {
  try {
    const collections = ['journal', 'tech', 'photography', 'collection', 'portfolio', 'gear', 'timeline', 'favorites', 'home', 'gallery'];
    const allItems: any[] = [];

    for (const col of collections) {
      const colDir = path.join(CONTENT_DIR, col);
      if (!(await fs.pathExists(colDir))) continue;

      const files = await fs.readdir(colDir);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(colDir, file);
        const raw = await fs.readFile(filePath, 'utf-8');
        const { data, content } = matter(raw);
        const slug = data.slug || file.replace('.md', '');

        // Merge publishing state from registry
        const registryItem = await getItem(col, slug);

        allItems.push({
          collection: col,
          slug,
          title: data.title || data.projectImage ? data.title || 'Untitled Project' : data.title || 'Untitled',
          date: data.date || '',
          category: data.category || '',
          featured: !!data.featured,
          coverImage: data.coverImage || data.projectImage || '',
          excerpt: data.excerpt || data.description || '',
          filePath: `content/${col}/${file}`,
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
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/content/:collection
 * Retrieves list of items matching a specific collection
 */
app.get('/api/content/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const colDir = path.join(CONTENT_DIR, collection);
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
app.get('/api/content/:collection/:slug', async (req, res) => {
  try {
    const { collection, slug } = req.params;
    const filePath = path.join(CONTENT_DIR, collection, `${slug}.md`);

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: `File not found at ${filePath}` });
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
app.get('/api/content/:collection/:slug/state', async (req, res) => {
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
app.patch('/api/content/:collection/:slug/state', async (req, res) => {
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
  try {
    const { collection, slug } = req.params;
    const filePath = path.join(CONTENT_DIR, collection, `${slug}.md`);

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).send('<html><body style="background:#0a0a09;color:#999;font-family:sans-serif;padding:2rem;"><h1>404</h1><p>Content not found.</p></body></html>');
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

    // Auto-generate Slug if missing or empty
    let slug = req.body.slug;
    if (!slug) {
      const titleToSlug = data.title || 'untitled';
      slug = slugify(titleToSlug);
    } else {
      slug = slugify(slug);
    }

    // Ensure slug doesn't collide
    const colDir = path.join(CONTENT_DIR, collection);
    await fs.ensureDir(colDir);
    
    let filePath = path.join(colDir, `${slug}.md`);
    let counter = 1;
    let finalSlug = slug;
    while (await fs.pathExists(filePath)) {
      finalSlug = `${slug}-${counter}`;
      filePath = path.join(colDir, `${finalSlug}.md`);
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

    const colDir = path.join(CONTENT_DIR, collection);
    const sourcePath = path.join(colDir, `${slug}.md`);

    if (!(await fs.pathExists(sourcePath))) {
      return res.status(404).json({ error: `Original file does not exist at ${sourcePath}` });
    }

    let finalSlug = slug;
    let targetPath = sourcePath;

    if (newSlug && slugify(newSlug) !== slug) {
      finalSlug = slugify(newSlug);
      targetPath = path.join(colDir, `${finalSlug}.md`);

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

    const filePath = path.join(CONTENT_DIR, collection, `${slug}.md`);
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: `File not found at ${filePath}` });
    }

    await fs.remove(filePath);
    await deleteItem(collection, slug);
    res.json({ success: true, message: `Successfully deleted content ${slug}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Extra convenient path-based deletions
app.delete('/api/content/:collection/:slug', async (req, res) => {
  try {
    const { collection, slug } = req.params;
    const filePath = path.join(CONTENT_DIR, collection, `${slug}.md`);
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is booted at http://localhost:${PORT}`);
  });
}

startServer();
