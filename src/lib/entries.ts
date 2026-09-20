/**
 * Detail-entry resolver.
 *
 * Every collection that has its own shareable URL (`/journal/<slug>`) is
 * flattened here into one `DetailEntry` shape. Before this existed, each page
 * built those props inline for `ContentModal`, so the same entry could not be
 * rendered anywhere else. Now there is a single mapping used by:
 *
 *   - the quick-look overlay hoisted into `App`
 *   - the full page at `/<collection>/<slug>`
 *
 * Collections that are presentational fragments rather than documents
 * (`gear`, `timeline`, `favorites`, `home`, `gallery`) are deliberately absent:
 * they have no standalone body worth a URL.
 *
 * This module imports `cms.ts`, which inlines every markdown file, so it must
 * only be reached from lazily-loaded code. Collection names and paths live in
 * the dependency-free `collections.ts` for that reason.
 */

import {
  getCollectionEntries,
  getJournalEntries,
  getPhotographyEntries,
  getPortfolioProjects,
  getTechEntries,
} from './cms';
import { detailPath, isDetailCollection, type DetailCollection } from './collections';
import { normalizeImagePath, ownerArchiveImage } from './image';
import type { PostCustomization } from '../types';

export interface DetailMetadata {
  githubLink?: string;
  liveLink?: string;
  techStack?: string[];
  galleryImages?: string[];
  gear?: string[];
  captureMode?: string;
}

export interface DetailEntry {
  collection: DetailCollection;
  slug: string;
  /** Canonical in-site path, e.g. `/journal/growing-up`. */
  path: string;
  title: string;
  category: string;
  /** Raw ISO-ish date from front-matter, kept for `<time>` and the sitemap. */
  isoDate?: string;
  /** Pre-formatted display date, matching the rest of the site. */
  date?: string;
  coverImage?: string;
  /** Short clip or GIF, rendered as a motion plate above the body. */
  video?: string;
  /** Still shown before the clip plays. Falls back to the cover image. */
  videoPoster?: string;
  excerpt?: string;
  body: string;
  metadata?: DetailMetadata;
  customization?: PostCustomization;
}

/** Format a front-matter date the way every card and modal on the site does. */
function displayDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** `techStack` and `galleryImages` may be strings or single-key objects. */
function flattenList(raw: unknown, key: string): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const picked = record[key] ?? Object.values(record)[0];
        return typeof picked === 'string' ? picked : '';
      }
      return '';
    })
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function fromJournal(): DetailEntry[] {
  return getJournalEntries().map((entry) => ({
    collection: 'journal' as const,
    slug: entry.slug,
    path: detailPath('journal', entry.slug),
    title: entry.title,
    category: entry.category,
    isoDate: entry.date,
    date: displayDate(entry.date),
    // The journal placeholder is applied by the card and the modal alike; the
    // page view inherits it so a cover-less entry still gets a plate.
    coverImage:
      normalizeImagePath(entry.featuredImage || entry.coverImage) ||
      DEFAULT_JOURNAL_COVER,
    video: entry.video,
    videoPoster: entry.videoPoster,
    excerpt: entry.excerpt,
    body: entry.body,
    customization: entry.customization,
  }));
}

function fromTech(): DetailEntry[] {
  return getTechEntries().map((entry) => ({
    collection: 'tech' as const,
    slug: entry.slug,
    path: detailPath('tech', entry.slug),
    title: entry.title,
    category: entry.category,
    isoDate: entry.date,
    date: displayDate(entry.date),
    // Deliberately no cover: the only two tech covers in the archive are
    // screenshots at 480px and 320px, which cannot fill a 16:9 plate.
    video: entry.video,
    videoPoster: entry.videoPoster,
    excerpt: entry.excerpt,
    body: entry.body,
    customization: entry.customization,
  }));
}

function fromPhotography(): DetailEntry[] {
  return getPhotographyEntries().map((entry) => ({
    collection: 'photography' as const,
    slug: entry.slug,
    path: detailPath('photography', entry.slug),
    title: entry.title,
    category: entry.category,
    isoDate: entry.date,
    date: displayDate(entry.date),
    coverImage: normalizeImagePath(entry.coverImage) || undefined,
    video: entry.video,
    videoPoster: entry.videoPoster,
    excerpt: entry.description,
    body: entry.story,
    metadata: {
      galleryImages: flattenList(entry.galleryImages, 'image'),
      gear: entry.gear,
      captureMode: entry.captureMode,
    },
    customization: entry.customization,
  }));
}

function fromPortfolio(): DetailEntry[] {
  return getPortfolioProjects().map((entry) => ({
    collection: 'portfolio' as const,
    slug: entry.slug,
    path: detailPath('portfolio', entry.slug),
    title: entry.title,
    category: 'Case Study',
    coverImage: ownerArchiveImage(entry.projectImage),
    video: entry.video,
    videoPoster: entry.videoPoster,
    excerpt: entry.description,
    body: entry.body,
    metadata: {
      githubLink: entry.githubLink,
      liveLink: entry.liveLink,
      techStack: flattenList(entry.techStack, 'tech'),
    },
    customization: entry.customization,
  }));
}

function fromCollection(): DetailEntry[] {
  return getCollectionEntries().map((entry) => ({
    collection: 'collection' as const,
    slug: entry.slug,
    path: detailPath('collection', entry.slug),
    title: entry.title,
    category: entry.category,
    coverImage: normalizeImagePath(entry.coverImage) || undefined,
    video: entry.video,
    videoPoster: entry.videoPoster,
    excerpt: entry.description,
    body: entry.body,
    customization: entry.customization,
  }));
}

/** Journal cover placeholder, duplicated from JournalCard to avoid importing a component into lib. */
const DEFAULT_JOURNAL_COVER = '/assets/journal-placeholder.svg';

const LOADERS: Record<DetailCollection, () => DetailEntry[]> = {
  portfolio: fromPortfolio,
  journal: fromJournal,
  tech: fromTech,
  photography: fromPhotography,
  collection: fromCollection,
};

/**
 * All entries in a collection, in the same order the listing page shows them,
 * so prev/next on a detail page matches the index the reader came from.
 */
export function getDetailEntries(collection: DetailCollection): DetailEntry[] {
  return LOADERS[collection]();
}

export function getDetailEntry(
  collection: string,
  slug: string
): DetailEntry | null {
  if (!isDetailCollection(collection)) return null;
  return getDetailEntries(collection).find((entry) => entry.slug === slug) ?? null;
}

export interface DetailNeighbours {
  previous?: DetailEntry;
  next?: DetailEntry;
}

/** Neighbouring entries for the footer navigation on a detail page. */
export function getDetailNeighbours(entry: DetailEntry): DetailNeighbours {
  const siblings = getDetailEntries(entry.collection);
  const index = siblings.findIndex((candidate) => candidate.slug === entry.slug);
  if (index === -1) return {};
  return {
    previous: index > 0 ? siblings[index - 1] : undefined,
    next: index < siblings.length - 1 ? siblings[index + 1] : undefined,
  };
}
