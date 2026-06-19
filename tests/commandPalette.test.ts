/**
 * Command Palette Tests
 *
 * Tests for:
 * - Keyboard shortcut detection (Cmd+K / Ctrl+K)
 * - Search debouncing logic
 * - Result selection produces correct sectionId and slug
 * - Filter application narrows results
 * - Result grouping by section
 * - Snippet highlighting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isCommandPaletteShortcut,
  createDebounce,
  resolveNavigationTarget,
  applyFilters,
  groupResultsBySection,
  highlightSnippet,
  fetchSearchResults,
  getPageFilterOptions,
  STATE_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  type SearchResult,
  type SearchFilters,
} from '../src/lib/commandPalette';

// ============================================================
// Test data
// ============================================================

const sectionsMeta = [
  { id: 'home-profile', title: 'Profile Bio', page: 'home', kind: 'singleton' as const },
  { id: 'home-gateways', title: 'Gateways', page: 'home', kind: 'collection' as const },
  { id: 'journal', title: 'Journal', page: 'journal', kind: 'collection' as const },
  { id: 'tech-notes', title: 'Tech Notes', page: 'tech', kind: 'collection' as const },
  { id: 'photography-entries', title: 'Photography Entries', page: 'photography', kind: 'collection' as const },
  { id: 'portfolio-projects', title: 'Portfolio Projects', page: 'portfolio', kind: 'collection' as const },
];

const mockResults: SearchResult[] = [
  {
    sectionId: 'journal',
    collection: 'journal',
    slug: 'growing-up',
    title: 'Growing Up',
    snippet: '...learned to write a compiler in college...',
    matchField: 'body',
  },
  {
    sectionId: 'home-gateways',
    collection: 'home',
    slug: 'gateway-photography',
    title: 'Photography Gateway',
    snippet: '...explore photography and visual storytelling...',
    matchField: 'title',
  },
  {
    sectionId: 'tech-notes',
    collection: 'tech',
    slug: 'kashmiri-ai',
    title: 'Kashmiri AI Assistant',
    snippet: '...building an AI assistant for Kashmiri language...',
    matchField: 'title',
  },
  {
    sectionId: 'home-profile',
    collection: 'home',
    slug: 'profile-bio',
    title: 'Profile Bio',
    snippet: '...software engineer and photographer...',
    matchField: 'body',
  },
  {
    sectionId: 'photography-entries',
    collection: 'photography',
    slug: 'spring-2024',
    title: 'Spring 2024',
    snippet: '...capturing the beauty of spring...',
    matchField: 'body',
  },
];

// ============================================================
// Tests: Keyboard shortcut detection
// ============================================================

describe('isCommandPaletteShortcut', () => {
  it('returns true for Cmd+K (macOS)', () => {
    expect(isCommandPaletteShortcut({ key: 'k', metaKey: true, ctrlKey: false })).toBe(true);
  });

  it('returns true for Ctrl+K (Windows/Linux)', () => {
    expect(isCommandPaletteShortcut({ key: 'k', metaKey: false, ctrlKey: true })).toBe(true);
  });

  it('returns false for K without modifier', () => {
    expect(isCommandPaletteShortcut({ key: 'k', metaKey: false, ctrlKey: false })).toBe(false);
  });

  it('returns false for Cmd+J', () => {
    expect(isCommandPaletteShortcut({ key: 'j', metaKey: true, ctrlKey: false })).toBe(false);
  });

  it('returns false for Cmd+Shift+K (uppercase K)', () => {
    expect(isCommandPaletteShortcut({ key: 'K', metaKey: true, ctrlKey: false })).toBe(false);
  });

  it('returns true when both metaKey and ctrlKey are true', () => {
    expect(isCommandPaletteShortcut({ key: 'k', metaKey: true, ctrlKey: true })).toBe(true);
  });
});

// ============================================================
// Tests: Debounce
// ============================================================

describe('createDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays execution by the specified amount', () => {
    const fn = vi.fn();
    const { debounced } = createDebounce(fn, 300);

    debounced('test');
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledWith('test');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('only executes the last call within the debounce window', () => {
    const fn = vi.fn();
    const { debounced } = createDebounce(fn, 300);

    debounced('first');
    vi.advanceTimersByTime(100);
    debounced('second');
    vi.advanceTimersByTime(100);
    debounced('third');
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('third');
  });

  it('can be cancelled', () => {
    const fn = vi.fn();
    const { debounced, cancel } = createDebounce(fn, 300);

    debounced('test');
    vi.advanceTimersByTime(150);
    cancel();
    vi.advanceTimersByTime(300);

    expect(fn).not.toHaveBeenCalled();
  });

  it('executes multiple times if called after debounce window', () => {
    const fn = vi.fn();
    const { debounced } = createDebounce(fn, 300);

    debounced('first');
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledWith('first');

    debounced('second');
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledWith('second');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

// ============================================================
// Tests: Navigation target resolution
// ============================================================

describe('resolveNavigationTarget', () => {
  it('returns sectionId and slug for collection items', () => {
    const result: SearchResult = {
      sectionId: 'journal',
      collection: 'journal',
      slug: 'growing-up',
      title: 'Growing Up',
      snippet: '...',
      matchField: 'body',
    };

    const target = resolveNavigationTarget(result, sectionsMeta);
    expect(target.sectionId).toBe('journal');
    expect(target.slug).toBe('growing-up');
  });

  it('returns sectionId with null slug for singleton items', () => {
    const result: SearchResult = {
      sectionId: 'home-profile',
      collection: 'home',
      slug: 'profile-bio',
      title: 'Profile Bio',
      snippet: '...',
      matchField: 'body',
    };

    const target = resolveNavigationTarget(result, sectionsMeta);
    expect(target.sectionId).toBe('home-profile');
    expect(target.slug).toBeNull();
  });

  it('returns null slug for unknown sections (no metadata)', () => {
    const result: SearchResult = {
      sectionId: 'unknown-section',
      collection: 'unknown',
      slug: 'some-slug',
      title: 'Unknown',
      snippet: '...',
      matchField: 'body',
    };

    const target = resolveNavigationTarget(result, sectionsMeta);
    expect(target.sectionId).toBe('unknown-section');
    expect(target.slug).toBeNull();
  });

  it('returns correct slug for home-gateways collection item', () => {
    const result: SearchResult = {
      sectionId: 'home-gateways',
      collection: 'home',
      slug: 'gateway-photography',
      title: 'Photography Gateway',
      snippet: '...',
      matchField: 'title',
    };

    const target = resolveNavigationTarget(result, sectionsMeta);
    expect(target.sectionId).toBe('home-gateways');
    expect(target.slug).toBe('gateway-photography');
  });
});

// ============================================================
// Tests: Filters
// ============================================================

describe('applyFilters', () => {
  const noFilters: SearchFilters = { page: null, state: null, contentType: null };

  it('returns all results when no filters are applied', () => {
    const filtered = applyFilters(mockResults, noFilters, sectionsMeta);
    expect(filtered).toHaveLength(mockResults.length);
  });

  it('filters by page: home', () => {
    const filters: SearchFilters = { page: 'home', state: null, contentType: null };
    const filtered = applyFilters(mockResults, filters, sectionsMeta);

    expect(filtered.length).toBe(2);
    expect(filtered.every((r) => r.sectionId.startsWith('home-'))).toBe(true);
  });

  it('filters by page: journal', () => {
    const filters: SearchFilters = { page: 'journal', state: null, contentType: null };
    const filtered = applyFilters(mockResults, filters, sectionsMeta);

    expect(filtered.length).toBe(1);
    expect(filtered[0].sectionId).toBe('journal');
  });

  it('filters by page: tech', () => {
    const filters: SearchFilters = { page: 'tech', state: null, contentType: null };
    const filtered = applyFilters(mockResults, filters, sectionsMeta);

    expect(filtered.length).toBe(1);
    expect(filtered[0].sectionId).toBe('tech-notes');
  });

  it('filters by content type: singleton', () => {
    const filters: SearchFilters = { page: null, state: null, contentType: 'singleton' };
    const filtered = applyFilters(mockResults, filters, sectionsMeta);

    expect(filtered.length).toBe(1);
    expect(filtered[0].sectionId).toBe('home-profile');
  });

  it('filters by content type: collection', () => {
    const filters: SearchFilters = { page: null, state: null, contentType: 'collection' };
    const filtered = applyFilters(mockResults, filters, sectionsMeta);

    expect(filtered.length).toBe(4);
    expect(filtered.every((r) => r.sectionId !== 'home-profile')).toBe(true);
  });

  it('combines page and content type filters', () => {
    const filters: SearchFilters = { page: 'home', state: null, contentType: 'collection' };
    const filtered = applyFilters(mockResults, filters, sectionsMeta);

    expect(filtered.length).toBe(1);
    expect(filtered[0].sectionId).toBe('home-gateways');
  });

  it('page filter is case-insensitive', () => {
    const filters: SearchFilters = { page: 'Home', state: null, contentType: null };
    const filtered = applyFilters(mockResults, filters, sectionsMeta);

    expect(filtered.length).toBe(2);
  });

  it('returns empty for non-matching page', () => {
    const filters: SearchFilters = { page: 'nonexistent', state: null, contentType: null };
    const filtered = applyFilters(mockResults, filters, sectionsMeta);

    expect(filtered).toHaveLength(0);
  });
});

// ============================================================
// Tests: Grouping
// ============================================================

describe('groupResultsBySection', () => {
  it('groups results by section ID', () => {
    const groups = groupResultsBySection(mockResults, sectionsMeta);

    expect(groups.length).toBe(5);
    const journalGroup = groups.find((g) => g.sectionId === 'journal');
    expect(journalGroup).toBeDefined();
    expect(journalGroup!.items).toHaveLength(1);
    expect(journalGroup!.sectionTitle).toBe('Journal');
    expect(journalGroup!.page).toBe('journal');
  });

  it('sorts groups by page, then section title', () => {
    const groups = groupResultsBySection(mockResults, sectionsMeta);

    const pages = groups.map((g) => g.page);
    expect(pages).toEqual([...pages].sort());
  });

  it('returns empty array for empty results', () => {
    const groups = groupResultsBySection([], sectionsMeta);
    expect(groups).toEqual([]);
  });

  it('groups multiple items in same section together', () => {
    const resultsWithDuplicateSection: SearchResult[] = [
      { sectionId: 'journal', collection: 'journal', slug: 'a', title: 'A', snippet: '...', matchField: 'title' },
      { sectionId: 'journal', collection: 'journal', slug: 'b', title: 'B', snippet: '...', matchField: 'title' },
      { sectionId: 'tech-notes', collection: 'tech', slug: 'c', title: 'C', snippet: '...', matchField: 'title' },
    ];

    const groups = groupResultsBySection(resultsWithDuplicateSection, sectionsMeta);
    const journalGroup = groups.find((g) => g.sectionId === 'journal');
    expect(journalGroup!.items).toHaveLength(2);
  });
});

// ============================================================
// Tests: Snippet highlighting
// ============================================================

describe('highlightSnippet', () => {
  it('highlights the matching portion of the snippet', () => {
    const parts = highlightSnippet('Hello World', 'world');

    expect(parts).toEqual([
      { text: 'Hello ', highlight: false },
      { text: 'World', highlight: true },
    ]);
  });

  it('handles case-insensitive matching', () => {
    const parts = highlightSnippet('Building an AI Assistant', 'ai');

    expect(parts).toEqual([
      { text: 'Building an ', highlight: false },
      { text: 'AI', highlight: true },
      { text: ' Assistant', highlight: false },
    ]);
  });

  it('returns unhighlighted text for empty query', () => {
    const parts = highlightSnippet('Some text', '');
    expect(parts).toEqual([{ text: 'Some text', highlight: false }]);
  });

  it('returns unhighlighted text for whitespace-only query', () => {
    const parts = highlightSnippet('Some text', '   ');
    expect(parts).toEqual([{ text: 'Some text', highlight: false }]);
  });

  it('highlights multiple occurrences', () => {
    const parts = highlightSnippet('cat and cat', 'cat');

    expect(parts).toEqual([
      { text: 'cat', highlight: true },
      { text: ' and ', highlight: false },
      { text: 'cat', highlight: true },
    ]);
  });

  it('handles match at the start', () => {
    const parts = highlightSnippet('Hello World', 'hello');

    expect(parts).toEqual([
      { text: 'Hello', highlight: true },
      { text: ' World', highlight: false },
    ]);
  });

  it('handles match at the end', () => {
    const parts = highlightSnippet('Hello World', 'world');

    expect(parts).toEqual([
      { text: 'Hello ', highlight: false },
      { text: 'World', highlight: true },
    ]);
  });
});

// ============================================================
// Tests: fetchSearchResults (mock fetch)
// ============================================================

describe('fetchSearchResults', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns empty array for empty query', async () => {
    const results = await fetchSearchResults('');
    expect(results).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns empty array for whitespace-only query', async () => {
    const results = await fetchSearchResults('   ');
    expect(results).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('calls API with encoded query', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve(mockResults) };
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    const results = await fetchSearchResults('hello world');

    expect(fetch).toHaveBeenCalledWith(
      '/api/search?q=hello%20world',
      expect.objectContaining({})
    );
    expect(results).toEqual(mockResults);
  });

  it('throws on non-OK response', async () => {
    const mockResponse = { ok: false, status: 500, json: () => Promise.resolve({}) };
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    await expect(fetchSearchResults('test')).rejects.toThrow('Search failed: 500');
  });

  it('passes AbortSignal to fetch', async () => {
    const controller = new AbortController();
    const mockResponse = { ok: true, json: () => Promise.resolve([]) };
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    await fetchSearchResults('test', controller.signal);

    expect(fetch).toHaveBeenCalledWith(
      '/api/search?q=test',
      expect.objectContaining({ signal: controller.signal })
    );
  });
});

// ============================================================
// Tests: Filter options
// ============================================================

describe('getPageFilterOptions', () => {
  it('returns unique page names sorted alphabetically', () => {
    const pages = getPageFilterOptions(sectionsMeta);
    expect(pages).toEqual(['home', 'journal', 'photography', 'portfolio', 'tech']);
  });

  it('returns empty array for empty sections', () => {
    const pages = getPageFilterOptions([]);
    expect(pages).toEqual([]);
  });
});

describe('constants', () => {
  it('STATE_OPTIONS contains expected values', () => {
    expect(STATE_OPTIONS).toEqual(['draft', 'review', 'published', 'archived']);
  });

  it('CONTENT_TYPE_OPTIONS contains singleton and collection', () => {
    expect(CONTENT_TYPE_OPTIONS).toEqual(['singleton', 'collection']);
  });
});
