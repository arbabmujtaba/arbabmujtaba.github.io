/**
 * Post-build: make every route reachable on GitHub Pages, and describable.
 *
 * The problem this solves was verified before the fix: `dist/` contained a
 * single `index.html`, so GitHub Pages answered a shared link or a hard refresh
 * of `/journal` — let alone `/journal/<slug>` — with GitHub's own 404 page. The
 * SPA never got a chance to route.
 *
 * Three outputs, in order of importance:
 *
 *  1. `dist/<route>/index.html` for every known route. Pages serves these with
 *     HTTP 200 at the real URL, so deep links work without the usual
 *     404-and-redirect shim, and crawlers get a per-route <title>, description,
 *     canonical and Open Graph block instead of the homepage's.
 *  2. `dist/404.html`, a copy of the shell, as the catch-all for anything not
 *     pre-rendered (a stale slug, a typo). The SPA reads the URL and renders its
 *     own 404 view.
 *  3. `dist/sitemap.xml` listing exactly those routes.
 *
 * These are shells, not pre-rendered content: the markup is the same empty
 * `#root` the SPA hydrates. Only the <head> differs per route.
 *
 * Usage: npx tsx scripts/postbuild.ts   (wired as `postbuild` in package.json)
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { collectRoutes, SITE_ORIGIN, type RouteRecord } from './routes';

const projectRoot = path.resolve(import.meta.dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const shellPath = path.join(distDir, 'index.html');

const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/portrait.jpg`;

/** Escape for use in an XML text node or an HTML attribute value. */
function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Replace the content of a <meta> tag matched by attribute, if present. */
function replaceMeta(
  html: string,
  attribute: 'name' | 'property',
  key: string,
  value: string
): string {
  // The built index.html keeps multi-line meta tags, so [\s\S] rather than `.`.
  const pattern = new RegExp(
    `(<meta\\s+${attribute}="${key}"[\\s\\S]*?content=")[\\s\\S]*?(")`,
    'i'
  );
  if (!pattern.test(html)) return html;
  return html.replace(pattern, `$1${escape(value)}$2`);
}

/** Build the per-route shell from the compiled index.html. */
function shellFor(shell: string, record: RouteRecord): string {
  const url = `${SITE_ORIGIN}${record.route === '/' ? '/' : record.route}`;
  const image = record.image ?? DEFAULT_OG_IMAGE;

  let html = shell;

  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escape(record.title)}</title>`
  );
  html = replaceMeta(html, 'name', 'description', record.description);
  html = replaceMeta(html, 'property', 'og:title', record.title);
  html = replaceMeta(html, 'property', 'og:description', record.description);
  html = replaceMeta(html, 'property', 'og:url', url);
  html = replaceMeta(html, 'property', 'og:image', image);
  html = replaceMeta(html, 'name', 'twitter:title', record.title);
  html = replaceMeta(html, 'name', 'twitter:description', record.description);
  html = replaceMeta(html, 'name', 'twitter:image', image);

  // An entry is an article, not the site itself.
  if (record.collection) {
    html = replaceMeta(html, 'property', 'og:type', 'article');
  }

  // Canonical is absent from the source head, so it is inserted rather than
  // replaced. Without it, the same shell at two URLs looks like duplication.
  html = html.replace(
    /<\/head>/i,
    `  <link rel="canonical" href="${escape(url)}" />\n  </head>`
  );

  return html;
}

function sitemapFor(records: RouteRecord[]): string {
  const entries = records
    .map((record) => {
      const url = `${SITE_ORIGIN}${record.route}`;
      const lastmod =
        record.isoDate && !Number.isNaN(new Date(record.isoDate).getTime())
          ? `\n    <lastmod>${new Date(record.isoDate).toISOString().slice(0, 10)}</lastmod>`
          : '';
      // Top-level pages are the entry points; entries sit one step below.
      const priority = record.route === '/' ? '1.0' : record.collection ? '0.6' : '0.8';

      return `  <url>\n    <loc>${escape(url)}</loc>${lastmod}\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

async function main(): Promise<void> {
  if (!existsSync(shellPath)) {
    console.error(
      `postbuild: ${path.relative(projectRoot, shellPath)} not found — run \`vite build\` first.`
    );
    process.exit(1);
  }

  const shell = await readFile(shellPath, 'utf8');
  const records = await collectRoutes();

  let written = 0;

  for (const record of records) {
    const html = shellFor(shell, record);

    if (record.route === '/') {
      // The root shell is index.html itself; rewrite it so the homepage also
      // carries a canonical link.
      await writeFile(shellPath, html, 'utf8');
    } else {
      const dir = path.join(distDir, record.route.slice(1));
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, 'index.html'), html, 'utf8');
    }
    written += 1;
  }

  // Catch-all. Uses the 404 copy so the status page describes itself correctly
  // even before the SPA boots.
  await writeFile(
    path.join(distDir, '404.html'),
    shellFor(shell, {
      route: '/404',
      title: 'Not found — Arbab Mujtaba',
      description:
        'This address does not exist in the archive. It may have been renamed, or it may never have been written.',
    }),
    'utf8'
  );

  await writeFile(path.join(distDir, 'sitemap.xml'), sitemapFor(records), 'utf8');

  const entryCount = records.filter((record) => record.collection).length;
  console.log(
    `postbuild: ${written} route shells (${records.length - entryCount} pages, ${entryCount} entries), 404.html, sitemap.xml`
  );
}

main().catch((error) => {
  console.error('postbuild failed:', error);
  process.exit(1);
});
