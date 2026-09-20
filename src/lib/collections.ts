/**
 * Collection identity — deliberately dependency-free.
 *
 * The router, the navigation helpers and every card need to name a collection
 * and build its path. None of them should pull in `cms.ts`, which inlines all
 * 90-odd markdown files at build time: importing it from `App` moved the entire
 * content bundle into the initial chunk (measured: 340 kB → 410 kB). Those
 * constants therefore live here, and the entry *resolvers* live in `entries.ts`,
 * which is only reached from lazily-loaded surfaces.
 */

export const DETAIL_COLLECTIONS = [
  'portfolio',
  'journal',
  'tech',
  'photography',
  'collection',
] as const;

export type DetailCollection = (typeof DETAIL_COLLECTIONS)[number];

/** Human label for the collection, used in breadcrumbs and page eyebrows. */
export const COLLECTION_LABEL: Record<DetailCollection, string> = {
  portfolio: 'work',
  journal: 'journal',
  tech: 'logs',
  photography: 'frames',
  collection: 'index',
};

export function isDetailCollection(value: string): value is DetailCollection {
  return (DETAIL_COLLECTIONS as readonly string[]).includes(value);
}

export function detailPath(collection: DetailCollection, slug: string): string {
  return `/${collection}/${slug}`;
}
