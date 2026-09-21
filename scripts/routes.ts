/**
 * Route manifest, derived from the markdown on disk.
 *
 * The browser gets its routes from `src/lib/cms.ts`, which uses
 * `import.meta.glob` and therefore only exists inside a Vite build. Node-side
 * tooling (the post-build shells, the sitemap) needs the same list, so this
 * module reads `content/` directly with the `gray-matter` parser that is already
 * a project dependency.
 *
 * The two sources must agree. What keeps them honest:
 *   - the collection list mirrors DETAIL_COLLECTIONS in src/lib/collections.ts
 *   - the slug rule mirrors cms.ts: front-matter `slug`, else the filename
 *   - the published rule mirrors getJournalEntries: `published: false` hides it
 */

import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export const SITE_ORIGIN = 'https://arbabmujtaba.github.io';

/** Mirrors DETAIL_COLLECTIONS in src/lib/collections.ts. */
export const DETAIL_COLLECTIONS = [
  'portfolio',
  'journal',
  'tech',
  'photography',
] as const;

export type DetailCollection = (typeof DETAIL_COLLECTIONS)[number];

/** Top-level views. `/admin` is excluded: it is not public. */
export const LIST_ROUTES = [
  '/',
  '/portfolio',
  '/journal',
  '/tech',
  '/photography',
] as const;

export interface RouteRecord {
  /** Path as served, e.g. `/journal/growing-up`. */
  route: string;
  title: string;
  description: string;
  /** ISO date when the front-matter carries one — used for sitemap lastmod. */
  isoDate?: string;
  /** Front-matter image path, made absolute for Open Graph. */
  image?: string;
  collection?: DetailCollection;
}

const projectRoot = path.resolve(import.meta.dirname, '..');
const contentDir = path.join(projectRoot, 'content');

/** Copy for the six top-level pages. Mirrors the intro text on each page. */
const LIST_META: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Arbab Mujtaba — Archive',
    description:
      'An archive still being written. Engineering projects, essays, photography, and a working index of tools and references.',
  },
  '/portfolio': {
    title: 'Work — Arbab Mujtaba',
    description:
      'Engineering projects: what was built, the stack behind it, and what each one was trying to answer.',
  },
  '/journal': {
    title: 'Journal — Arbab Mujtaba',
    description:
      'A personal archive of thoughts, late-night reflections, and milestones. Writing as a tool for figuring things out.',
  },
  '/tech': {
    title: 'Logs — Arbab Mujtaba',
    description:
      'Build logs, experiments, Linux and networking notes, and the tools that earn a place in the setup.',
  },
  '/photography': {
    title: 'Frames — Arbab Mujtaba',
    description:
      'Photographs of light, place, and passing weather, with the story and the gear behind selected frames.',
  },
};

/** First paragraph of a markdown body, flattened for use as a description. */
function firstParagraph(body: string): string {
  const paragraph = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find((block) => block.length > 0 && !block.startsWith('#') && !block.startsWith('!['));

  if (!paragraph) return '';

  return paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function clamp(value: string, max = 180): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function absoluteImage(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "''" || trimmed === '""') return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${SITE_ORIGIN}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

/** Every published entry in a collection, as a route record. */
async function collectionRoutes(collection: DetailCollection): Promise<RouteRecord[]> {
  const dir = path.join(contentDir, collection);
  if (!existsSync(dir)) return [];

  const files = (await readdir(dir)).filter((name) => name.endsWith('.md'));
  const records: RouteRecord[] = [];

  for (const file of files) {
    const raw = await readFile(path.join(dir, file), 'utf8');
    const { data, content } = matter(raw);

    // Mirrors the published filter in getJournalEntries.
    if (data.published === false) continue;

    const slug =
      (typeof data.slug === 'string' && data.slug.trim()) || file.replace(/\.md$/, '');

    // The manifest must mirror what the site actually links to, or a clickable
    // card leads to a URL with no shell (a 404 on GitHub Pages). Every card on
    // every listing opens — ten photography frames carry no story text but
    // still have a cover, a description, gear and a gallery, so they are real
    // pages.

    const description =
      (typeof data.excerpt === 'string' && data.excerpt.trim()) ||
      (typeof data.description === 'string' && data.description.trim()) ||
      firstParagraph(content);

    records.push({
      route: `/${collection}/${slug}`,
      title: `${typeof data.title === 'string' ? data.title : slug} — Arbab Mujtaba`,
      description: clamp(description || LIST_META[`/${collection}`].description),
      isoDate: typeof data.date === 'string' ? data.date : undefined,
      image: absoluteImage(data.featuredImage ?? data.coverImage ?? data.projectImage),
      collection,
    });
  }

  return records.sort((a, b) => a.route.localeCompare(b.route));
}

/** Every public route on the site: the six pages plus every entry. */
export async function collectRoutes(): Promise<RouteRecord[]> {
  const lists: RouteRecord[] = LIST_ROUTES.map((route) => ({
    route,
    ...LIST_META[route],
  }));

  const entries = await Promise.all(DETAIL_COLLECTIONS.map(collectionRoutes));

  return [...lists, ...entries.flat()];
}
