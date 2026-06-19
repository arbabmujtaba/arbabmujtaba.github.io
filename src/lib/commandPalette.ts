/**
 * Command Palette Logic
 *
 * Pure functions for the global search command palette:
 * - Keyboard shortcut detection (Cmd+K / Ctrl+K)
 * - Search debouncing
 * - Result filtering (page, state, content type)
 * - Result grouping by section
 * - Navigation target resolution (sectionId + slug)
 */

// ============================================================
// TYPES
// ============================================================

export interface SearchResult {
  sectionId: string;
  collection: string;
  slug: string;
  title: string;
  snippet: string;
  matchField: string;
}

export interface NavigationTarget {
  sectionId: string;
  slug: string | null;
}

export type FilterType = 'page' | 'state' | 'contentType';

export interface SearchFilters {
  page: string | null;
  state: string | null;
  contentType: 'singleton' | 'collection' | null;
}

export interface GroupedResults {
  sectionId: string;
  sectionTitle: string;
  page: string;
  items: SearchResult[];
}

// Section metadata for grouping/display
interface SectionMeta {
  id: string;
  title: string;
  page: string;
  kind: 'singleton' | 'collection';
}

// ============================================================
// KEYBOARD SHORTCUT
// ============================================================

/**
 * Detect whether a keyboard event matches the command palette trigger.
 * Returns true for Cmd+K (Mac) or Ctrl+K (Windows/Linux).
 */
export function isCommandPaletteShortcut(event: {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
}): boolean {
  return event.key === 'k' && (event.metaKey || event.ctrlKey);
}

// ============================================================
// DEBOUNCE
// ============================================================

/**
 * Creates a debounced version of a function.
 * Returns the debounced function and a cancel method.
 */
export function createDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): { debounced: (...args: Parameters<T>) => void; cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { debounced, cancel };
}

// ============================================================
// NAVIGATION TARGET
// ============================================================

/**
 * Resolve a search result into a navigation target.
 * For collection items, includes the slug so the editor can expand it.
 * For singletons, slug is null (the section IS the item).
 */
export function resolveNavigationTarget(
  result: SearchResult,
  sectionsMeta: SectionMeta[]
): NavigationTarget {
  const section = sectionsMeta.find((s) => s.id === result.sectionId);

  if (!section || section.kind === 'singleton') {
    return {
      sectionId: result.sectionId,
      slug: null,
    };
  }

  return {
    sectionId: result.sectionId,
    slug: result.slug,
  };
}

// ============================================================
// FILTERS
// ============================================================

/**
 * Apply search filters to a list of results.
 * Filters by page, state (from the snippet/matchField context), and content type.
 */
export function applyFilters(
  results: SearchResult[],
  filters: SearchFilters,
  sectionsMeta: SectionMeta[]
): SearchResult[] {
  let filtered = results;

  // Filter by page
  if (filters.page) {
    const pageLower = filters.page.toLowerCase();
    const matchingSectionIds = sectionsMeta
      .filter((s) => s.page.toLowerCase() === pageLower)
      .map((s) => s.id);
    filtered = filtered.filter((r) => matchingSectionIds.includes(r.sectionId));
  }

  // Filter by content type (singleton vs collection)
  if (filters.contentType) {
    const matchingSectionIds = sectionsMeta
      .filter((s) => s.kind === filters.contentType)
      .map((s) => s.id);
    filtered = filtered.filter((r) => matchingSectionIds.includes(r.sectionId));
  }

  // Filter by state - check if the result's snippet or matchField suggests a state
  if (filters.state) {
    const stateLower = filters.state.toLowerCase();
    filtered = filtered.filter((r) => {
      // If the matchField is 'state' field data, check snippet
      if (r.matchField === 'state') {
        return r.snippet.toLowerCase().includes(stateLower);
      }
      // For other results, we keep them (state filter applies loosely to match context)
      // This is best-effort since the API doesn't return state info directly
      return true;
    });
  }

  return filtered;
}

// ============================================================
// GROUPING
// ============================================================

/**
 * Group search results by section for display.
 * Returns an array of grouped results sorted by page, then section title.
 */
export function groupResultsBySection(
  results: SearchResult[],
  sectionsMeta: SectionMeta[]
): GroupedResults[] {
  const groups = new Map<string, GroupedResults>();

  for (const result of results) {
    const section = sectionsMeta.find((s) => s.id === result.sectionId);
    const sectionTitle = section?.title || result.sectionId;
    const page = section?.page || 'unknown';

    if (!groups.has(result.sectionId)) {
      groups.set(result.sectionId, {
        sectionId: result.sectionId,
        sectionTitle,
        page,
        items: [],
      });
    }

    groups.get(result.sectionId)!.items.push(result);
  }

  // Sort groups by page name, then section title
  return Array.from(groups.values()).sort((a, b) => {
    if (a.page !== b.page) return a.page.localeCompare(b.page);
    return a.sectionTitle.localeCompare(b.sectionTitle);
  });
}

// ============================================================
// SNIPPET HIGHLIGHTING
// ============================================================

/**
 * Split a snippet into parts for highlighting.
 * Returns segments with a `highlight` flag.
 */
export function highlightSnippet(
  snippet: string,
  query: string
): Array<{ text: string; highlight: boolean }> {
  if (!query.trim()) {
    return [{ text: snippet, highlight: false }];
  }

  const parts: Array<{ text: string; highlight: boolean }> = [];
  const lowerSnippet = snippet.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let lastIndex = 0;

  let matchIndex = lowerSnippet.indexOf(lowerQuery, lastIndex);
  while (matchIndex !== -1) {
    // Add non-matching prefix
    if (matchIndex > lastIndex) {
      parts.push({ text: snippet.slice(lastIndex, matchIndex), highlight: false });
    }
    // Add matching portion (preserve original case)
    parts.push({
      text: snippet.slice(matchIndex, matchIndex + query.length),
      highlight: true,
    });
    lastIndex = matchIndex + query.length;
    matchIndex = lowerSnippet.indexOf(lowerQuery, lastIndex);
  }

  // Add remaining text
  if (lastIndex < snippet.length) {
    parts.push({ text: snippet.slice(lastIndex), highlight: false });
  }

  return parts;
}

// ============================================================
// SEARCH API
// ============================================================

/**
 * Perform a search against the API endpoint.
 * Returns the array of search results.
 */
export async function fetchSearchResults(
  query: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal });
  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }
  return res.json();
}

// ============================================================
// AVAILABLE FILTER OPTIONS
// ============================================================

/** Get unique page names from sections metadata */
export function getPageFilterOptions(sectionsMeta: SectionMeta[]): string[] {
  const pages = new Set(sectionsMeta.map((s) => s.page));
  return Array.from(pages).sort();
}

/** Available states for filtering */
export const STATE_OPTIONS = ['draft', 'review', 'published', 'archived'] as const;

/** Content type options */
export const CONTENT_TYPE_OPTIONS = ['singleton', 'collection'] as const;
