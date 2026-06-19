/**
 * Section Resolver
 *
 * Server-side module that resolves section definitions to actual content items.
 * Reads content files from disk using gray-matter and applies section filters.
 */

import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { SECTIONS, type SectionDef } from './sections';

const CONTENT_DIR = path.join(process.cwd(), 'content');

// ============================================================
// TYPES
// ============================================================

export interface ContentItem {
  collection: string;
  slug: string;
  title: string;
  data: Record<string, unknown>;
  body: string;
  filePath: string;
}

export interface SearchResult {
  sectionId: string;
  collection: string;
  slug: string;
  title: string;
  snippet: string;
  matchField: string;
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Get a section definition by its ID.
 */
export function getSectionById(id: string): SectionDef | undefined {
  return SECTIONS.find((s) => s.id === id);
}

/**
 * Get all content items for a section, applying collection and filter constraints.
 * For singletons, returns a single-item array (or empty if not found).
 * For collections, returns all matching items.
 */
export async function getSectionItems(id: string): Promise<ContentItem[]> {
  const section = getSectionById(id);
  if (!section) {
    return [];
  }

  const colDir = path.join(CONTENT_DIR, section.collection);
  if (!(await fs.pathExists(colDir))) {
    return [];
  }

  // For singletons, look up the specific slug
  if (section.kind === 'singleton' && section.slug) {
    const filePath = path.join(colDir, `${section.slug}.md`);
    if (!(await fs.pathExists(filePath))) {
      return [];
    }
    const raw = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(raw);
    return [
      {
        collection: section.collection,
        slug: (data.slug as string) || section.slug,
        title: (data.title as string) || 'Untitled',
        data: data as Record<string, unknown>,
        body: content,
        filePath: `content/${section.collection}/${section.slug}.md`,
      },
    ];
  }

  // For collections, read all .md files and apply filter
  const files = await fs.readdir(colDir);
  const items: ContentItem[] = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = path.join(colDir, file);
    const raw = await fs.readFile(filePath, 'utf-8');

    let data: Record<string, unknown>;
    let content: string;
    try {
      const parsed = matter(raw);
      data = parsed.data as Record<string, unknown>;
      content = parsed.content;
    } catch {
      // Skip files with malformed frontmatter
      continue;
    }

    // Apply filter if defined
    if (section.filter && !matchesFilter(data, section.filter)) {
      continue;
    }

    const slug = (data.slug as string) || file.replace('.md', '');
    items.push({
      collection: section.collection,
      slug,
      title: (data.title as string) || 'Untitled',
      data,
      body: content,
      filePath: `content/${section.collection}/${file}`,
    });
  }

  return items;
}

/**
 * Search across all content files for a query string.
 * Scans titles, frontmatter values, and body text.
 * Returns matches with section id, slug, title, and a context snippet.
 * Results are capped at `limit` (default 50) to prevent unbounded responses.
 */
export async function searchContent(query: string, limit = 50): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  // Get all collections from the SECTIONS registry
  const collections = [...new Set(SECTIONS.map((s) => s.collection))];

  for (const collection of collections) {
    if (results.length >= limit) break;

    const colDir = path.join(CONTENT_DIR, collection);
    if (!(await fs.pathExists(colDir))) continue;

    const files = await fs.readdir(colDir);

    for (const file of files) {
      if (results.length >= limit) break;
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(colDir, file);
      const raw = await fs.readFile(filePath, 'utf-8');

      let data: Record<string, unknown>;
      let content: string;
      try {
        const parsed = matter(raw);
        data = parsed.data as Record<string, unknown>;
        content = parsed.content;
      } catch {
        // Skip files with malformed frontmatter
        continue;
      }

      const slug = (data.slug as string) || file.replace('.md', '');
      const title = (data.title as string) || 'Untitled';

      // Determine which section this item belongs to
      const sectionId = findSectionForItem(collection, data);

      // Check title match
      if (title.toLowerCase().includes(lowerQuery)) {
        results.push({
          sectionId,
          collection,
          slug,
          title,
          snippet: buildSnippet(title, lowerQuery),
          matchField: 'title',
        });
        continue; // Skip further checks for this file to avoid duplicates
      }

      // Check frontmatter values
      const frontmatterMatch = searchFrontmatter(data, lowerQuery);
      if (frontmatterMatch) {
        results.push({
          sectionId,
          collection,
          slug,
          title,
          snippet: buildSnippet(frontmatterMatch.value, lowerQuery),
          matchField: frontmatterMatch.field,
        });
        continue;
      }

      // Check body text
      if (content.toLowerCase().includes(lowerQuery)) {
        results.push({
          sectionId,
          collection,
          slug,
          title,
          snippet: buildSnippet(content, lowerQuery),
          matchField: 'body',
        });
      }
    }
  }

  return results;
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

/**
 * Check if a content item's frontmatter matches a section filter.
 * Filter values can be a single string or an array of valid values.
 */
function matchesFilter(
  data: Record<string, unknown>,
  filter: Record<string, string | string[]>
): boolean {
  for (const [key, expected] of Object.entries(filter)) {
    const actual = data[key];
    if (Array.isArray(expected)) {
      // Item must have one of the listed values
      if (!expected.includes(String(actual))) {
        return false;
      }
    } else {
      // Exact match
      if (String(actual) !== expected) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Find the best-matching section ID for a content item.
 * Prefers more specific sections (those with filters) over unfiltered ones.
 */
function findSectionForItem(
  collection: string,
  data: Record<string, unknown>
): string {
  // First try sections with filters (more specific)
  const filteredSections = SECTIONS.filter(
    (s) => s.collection === collection && s.filter
  );
  for (const section of filteredSections) {
    if (matchesFilter(data, section.filter!)) {
      return section.id;
    }
  }

  // Fall back to unfiltered sections for this collection
  const unfilteredSection = SECTIONS.find(
    (s) => s.collection === collection && !s.filter
  );
  if (unfilteredSection) {
    return unfilteredSection.id;
  }

  // Last resort: return collection name as section id
  return collection;
}

/**
 * Search frontmatter key-value pairs (excluding title, which is checked separately).
 * Skips non-primitive values (objects/arrays) that would produce garbage via String().
 */
function searchFrontmatter(
  data: Record<string, unknown>,
  lowerQuery: string
): { field: string; value: string } | null {
  for (const [key, value] of Object.entries(data)) {
    if (key === 'title') continue;
    if (value == null) continue;

    // Only search primitive values (string, number, boolean)
    // Objects and arrays would produce "[object Object]" via String()
    const valueType = typeof value;
    if (valueType === 'object') continue;

    const strValue = String(value);
    if (strValue.toLowerCase().includes(lowerQuery)) {
      return { field: key, value: strValue };
    }
  }
  return null;
}

/**
 * Build a snippet of approximately 50 characters around the first match.
 */
function buildSnippet(text: string, lowerQuery: string): string {
  const lowerText = text.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return text.slice(0, 100);
  }

  const snippetRadius = 50;
  const start = Math.max(0, matchIndex - snippetRadius);
  const end = Math.min(text.length, matchIndex + lowerQuery.length + snippetRadius);

  let snippet = text.slice(start, end).trim();

  // Clean up line breaks
  snippet = snippet.replace(/\n+/g, ' ').replace(/\s+/g, ' ');

  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}
