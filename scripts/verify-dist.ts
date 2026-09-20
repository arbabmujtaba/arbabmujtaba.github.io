/**
 * Verify `dist/` the way GitHub Pages will serve it.
 *
 * Pages resolves `/journal/growing-up` to `dist/journal/growing-up/index.html`
 * and falls back to `dist/404.html` when no file matches. This script walks the
 * route manifest and asserts that resolution succeeds for every public route,
 * that each shell carries its own canonical URL and can actually boot the app,
 * and that the sitemap agrees with the manifest.
 *
 * It exists because the failure it guards against is silent: the build stays
 * green while every shared link 404s. That was the state of the site before the
 * post-build step, verified at the time.
 *
 * Usage: npx tsx scripts/verify-dist.ts   (`npm run verify:dist`)
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { collectRoutes, SITE_ORIGIN } from './routes';

const projectRoot = path.resolve(import.meta.dirname, '..');
const distDir = path.join(projectRoot, 'dist');

const failures: string[] = [];
let checks = 0;

function check(condition: boolean, message: string): void {
  checks += 1;
  if (!condition) failures.push(message);
}

/** The file GitHub Pages serves for a route, or null when it would 404. */
function servedFile(route: string): string | null {
  const candidate =
    route === '/'
      ? path.join(distDir, 'index.html')
      : path.join(distDir, route.slice(1), 'index.html');
  return existsSync(candidate) ? candidate : null;
}

function extract(html: string, pattern: RegExp): string | undefined {
  return html.match(pattern)?.[1]?.trim();
}

async function main(): Promise<void> {
  if (!existsSync(distDir)) {
    console.error('verify-dist: dist/ not found — run `npm run build` first.');
    process.exit(1);
  }

  const records = await collectRoutes();

  // ---------------------------------------------------------------- route shells
  for (const record of records) {
    const file = servedFile(record.route);
    check(file !== null, `no shell for ${record.route} — GitHub Pages would 404`);
    if (!file) continue;

    const html = await readFile(file, 'utf8');
    const expectedUrl = `${SITE_ORIGIN}${record.route}`;

    const canonical = extract(html, /<link rel="canonical" href="([^"]+)"/i);
    check(
      canonical === expectedUrl,
      `${record.route}: canonical is ${canonical ?? 'missing'}, expected ${expectedUrl}`
    );

    const ogUrl = extract(html, /<meta property="og:url" content="([^"]+)"/i);
    check(ogUrl === expectedUrl, `${record.route}: og:url is ${ogUrl ?? 'missing'}`);

    const title = extract(html, /<title>([\s\S]*?)<\/title>/i);
    check(title !== undefined && title.length > 0, `${record.route}: empty <title>`);

    // A shell that cannot load the bundle renders a blank page.
    check(
      /<script type="module"[^>]+src="\/assets\/index-[^"]+\.js"/.test(html),
      `${record.route}: shell does not reference the built entry bundle`
    );

    // Entries are articles; the six top-level pages are the website itself.
    const ogType = extract(html, /<meta property="og:type" content="([^"]+)"/i);
    check(
      ogType === (record.collection ? 'article' : 'website'),
      `${record.route}: og:type is ${ogType ?? 'missing'}`
    );
  }

  // -------------------------------------------------------------------- catch-all
  const notFoundPath = path.join(distDir, '404.html');
  check(existsSync(notFoundPath), '404.html is missing — deep links have no fallback');
  if (existsSync(notFoundPath)) {
    const html = await readFile(notFoundPath, 'utf8');
    check(
      /<title>Not found/i.test(html),
      '404.html does not describe itself as a not-found page'
    );
    check(
      /<script type="module"[^>]+src="\/assets\/index-[^"]+\.js"/.test(html),
      '404.html cannot boot the app, so it cannot render the 404 view'
    );
  }

  // A slug that does not exist must fall through to 404.html rather than
  // resolving to some other shell.
  check(
    servedFile('/journal/this-slug-does-not-exist') === null,
    'an unknown slug unexpectedly resolves to a shell'
  );

  // ---------------------------------------------------------------------- sitemap
  const sitemapPath = path.join(distDir, 'sitemap.xml');
  check(existsSync(sitemapPath), 'sitemap.xml is missing');
  if (existsSync(sitemapPath)) {
    const xml = await readFile(sitemapPath, 'utf8');
    const listed = new Set(
      Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1])
    );

    check(
      listed.size === records.length,
      `sitemap lists ${listed.size} URLs, manifest has ${records.length}`
    );

    for (const record of records) {
      const url = `${SITE_ORIGIN}${record.route}`;
      check(listed.has(url), `sitemap is missing ${url}`);
    }

    check(
      !xml.includes('/admin'),
      'sitemap must not advertise the admin route'
    );
  }

  // ---------------------------------------------------------------------- robots
  const robotsPath = path.join(distDir, 'robots.txt');
  check(existsSync(robotsPath), 'robots.txt was not copied into dist');
  if (existsSync(robotsPath)) {
    const robots = await readFile(robotsPath, 'utf8');
    check(
      robots.includes(`${SITE_ORIGIN}/sitemap.xml`),
      'robots.txt does not point at the sitemap'
    );
  }

  // ----------------------------------------------------------------------- report
  if (failures.length > 0) {
    console.error(`\nverify-dist: ${failures.length} of ${checks} checks failed\n`);
    for (const failure of failures) console.error(`  ✗ ${failure}`);
    console.error('');
    process.exit(1);
  }

  const entryCount = records.filter((record) => record.collection).length;
  console.log(
    `verify-dist: ${checks} checks passed across ${records.length} routes ` +
      `(${records.length - entryCount} pages, ${entryCount} entries), 404.html, sitemap.xml, robots.txt`
  );
}

main().catch((error) => {
  console.error('verify-dist failed:', error);
  process.exit(1);
});
