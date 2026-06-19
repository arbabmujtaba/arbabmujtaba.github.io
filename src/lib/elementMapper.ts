/**
 * elementMapper.ts
 *
 * Maps clicked element info (from the live edit bridge) to a content item
 * using text matching, image matching, and page/section context.
 */

export interface ClickedElementPayload {
  tagName: string;
  textContent: string;
  src: string;
  href: string;
  classList: string[];
  nearestHeading: string;
  sectionId: string;
  pageUrl: string;
}

export interface ContentItem {
  collection: string;
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  category?: string;
}

export interface MappedElement {
  collection: string;
  slug: string;
  field: 'title' | 'body' | 'excerpt' | 'coverImage' | 'unknown';
  currentValue: string;
}

// Map page paths to collections
const PAGE_COLLECTION_MAP: Record<string, string> = {
  '/journal': 'journal',
  '/tech': 'tech',
  '/photography': 'photography',
  '/portfolio': 'portfolio',
  '/collection': 'collection',
};

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

function textMatches(a: string, b: string): boolean {
  if (!a || !b) return false;
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  if (normA === normB) return true;
  // Substring match - check if one contains the other (for truncated text)
  if (normA.length > 10 && normB.includes(normA)) return true;
  if (normB.length > 10 && normA.includes(normB)) return true;
  return false;
}

function imagePathMatches(src: string, coverImage: string): boolean {
  if (!src || !coverImage) return false;
  // Normalize paths: strip leading slash, compare filenames
  const srcFile = src.split('/').pop()?.toLowerCase() || '';
  const coverFile = coverImage.split('/').pop()?.toLowerCase() || '';
  if (srcFile && coverFile && srcFile === coverFile) return true;
  // Also check if coverImage path is contained in src
  if (src.includes(coverImage) || coverImage.includes(src.split('/').slice(-2).join('/'))) return true;
  return false;
}

export function mapElementToContent(
  payload: ClickedElementPayload,
  contentItems: ContentItem[]
): MappedElement | null {
  const { tagName, textContent, src, nearestHeading, pageUrl } = payload;

  // Scope content items by page if we can identify the collection
  let scopedItems = contentItems;
  const pageCollection = PAGE_COLLECTION_MAP[pageUrl];
  if (pageCollection) {
    const filtered = contentItems.filter(item => item.collection === pageCollection);
    if (filtered.length > 0) {
      scopedItems = filtered;
    }
  }

  // 1. Check if textContent matches a title exactly or closely
  for (const item of scopedItems) {
    if (textMatches(textContent, item.title)) {
      return {
        collection: item.collection,
        slug: item.slug,
        field: 'title',
        currentValue: item.title,
      };
    }
  }

  // 2. Check if textContent matches an excerpt
  for (const item of scopedItems) {
    if (item.excerpt && textMatches(textContent, item.excerpt)) {
      return {
        collection: item.collection,
        slug: item.slug,
        field: 'excerpt',
        currentValue: item.excerpt,
      };
    }
  }

  // 3. Check if src matches a known coverImage path
  if (src || tagName === 'IMG') {
    for (const item of scopedItems) {
      if (item.coverImage && imagePathMatches(src, item.coverImage)) {
        return {
          collection: item.collection,
          slug: item.slug,
          field: 'coverImage',
          currentValue: item.coverImage,
        };
      }
    }
  }

  // 4. Check if nearestHeading matches a content title
  if (nearestHeading) {
    for (const item of scopedItems) {
      if (textMatches(nearestHeading, item.title)) {
        // The clicked element is within a content item identified by heading
        const field = tagName === 'IMG' ? 'coverImage' : 
                      tagName === 'P' ? 'body' : 'unknown';
        return {
          collection: item.collection,
          slug: item.slug,
          field,
          currentValue: field === 'coverImage' ? (item.coverImage || '') : textContent,
        };
      }
    }
  }

  // 5. Fallback: try matching across all items (not just scoped)
  if (scopedItems !== contentItems) {
    for (const item of contentItems) {
      if (textMatches(textContent, item.title)) {
        return {
          collection: item.collection,
          slug: item.slug,
          field: 'title',
          currentValue: item.title,
        };
      }
    }
  }

  return null;
}
