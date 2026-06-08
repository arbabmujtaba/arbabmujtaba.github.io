import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import multer from 'multer';
import matter from 'gray-matter';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Enable robust JSON parsing for incoming editor requests
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const CONTENT_DIR = path.join(process.cwd(), 'content');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

// Ensure system directories exist
fs.ensureDirSync(CONTENT_DIR);
fs.ensureDirSync(UPLOADS_DIR);
['journal', 'tech', 'photography', 'collection', 'portfolio'].forEach(col => {
  fs.ensureDirSync(path.join(CONTENT_DIR, col));
  fs.ensureDirSync(path.join(UPLOADS_DIR, col));
});

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
 */
app.get('/api/content', async (req, res) => {
  try {
    const collections = ['journal', 'tech', 'photography', 'collection', 'portfolio'];
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

        allItems.push({
          collection: col,
          slug: data.slug || file.replace('.md', ''),
          title: data.title || data.projectImage ? data.title || 'Untitled Project' : data.title || 'Untitled',
          date: data.date || '',
          category: data.category || '',
          featured: !!data.featured,
          coverImage: data.coverImage || data.projectImage || '',
          excerpt: data.excerpt || data.description || '',
          filePath: `content/${col}/${file}`
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
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Configure Vite integration wrapper inside Express serving context
async function startServer() {
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
