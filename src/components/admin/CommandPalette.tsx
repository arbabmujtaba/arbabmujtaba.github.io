/**
 * CommandPalette
 *
 * Global search overlay triggered by Cmd+K / Ctrl+K.
 * Searches across all content via GET /api/search?q= and displays
 * results grouped by section with highlighted snippets.
 * Supports keyboard navigation (arrows + Enter) and filters.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Command, X, Filter, FileText, Layers } from 'lucide-react';
import {
  createDebounce,
  fetchSearchResults,
  applyFilters,
  groupResultsBySection,
  highlightSnippet,
  resolveNavigationTarget,
  getPageFilterOptions,
  STATE_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  type SearchResult,
  type SearchFilters,
  type NavigationTarget,
  type GroupedResults,
} from '../../lib/commandPalette';

// ============================================================
// Types
// ============================================================

interface SectionMeta {
  id: string;
  title: string;
  page: string;
  kind: 'singleton' | 'collection';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (target: NavigationTarget) => void;
  sectionsMeta: SectionMeta[];
}

// ============================================================
// Component
// ============================================================

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  sectionsMeta,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    page: null,
    state: null,
    contentType: null,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Page filter options derived from sections
  const pageOptions = useMemo(
    () => getPageFilterOptions(sectionsMeta),
    [sectionsMeta]
  );

  // Apply filters to results
  const filteredResults = useMemo(
    () => applyFilters(results, filters, sectionsMeta),
    [results, filters, sectionsMeta]
  );

  // Group filtered results by section
  const groupedResults = useMemo(
    () => groupResultsBySection(filteredResults, sectionsMeta),
    [filteredResults, sectionsMeta]
  );

  // Flat list for keyboard navigation
  const flatItems = useMemo(() => {
    const items: SearchResult[] = [];
    for (const group of groupedResults) {
      items.push(...group.items);
    }
    return items;
  }, [groupedResults]);

  // Debounced search function
  const { debounced: debouncedSearch, cancel: cancelSearch } = useMemo(
    () =>
      createDebounce(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
          setResults([]);
          setLoading(false);
          return;
        }

        // Abort previous request
        if (abortRef.current) {
          abortRef.current.abort();
        }
        const controller = new AbortController();
        abortRef.current = controller;

        try {
          const data = await fetchSearchResults(searchQuery, controller.signal);
          setResults(data);
          setActiveIndex(0);
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            setResults([]);
          }
        } finally {
          setLoading(false);
        }
      }, 300),
    []
  );

  // Handle query change
  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      setLoading(true);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  // Handle result selection
  const handleSelect = useCallback(
    (result: SearchResult) => {
      const target = resolveNavigationTarget(result, sectionsMeta);
      onNavigate(target);
      onClose();
    },
    [sectionsMeta, onNavigate, onClose]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatItems[activeIndex]) {
            handleSelect(flatItems[activeIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [flatItems, activeIndex, handleSelect, onClose]
  );

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure the DOM is ready
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Reset state when closed
      setQuery('');
      setResults([]);
      setActiveIndex(0);
      setShowFilters(false);
      setFilters({ page: null, state: null, contentType: null });
      cancelSearch();
    }
  }, [isOpen, cancelSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelSearch();
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [cancelSearch]);

  // Track cumulative index for keyboard navigation
  let cumulativeIndex = 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-xl mx-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
              <Search size={16} className="text-zinc-500 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleQueryChange}
                placeholder="Search content..."
                className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
              />
              {loading && (
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-orange-500 rounded-full animate-spin" />
              )}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1 rounded transition-colors ${
                  showFilters || filters.page || filters.state || filters.contentType
                    ? 'text-orange-500 bg-orange-500/10'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Toggle filters"
              >
                <Filter size={14} />
              </button>
              <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-mono border border-zinc-700 rounded px-1.5 py-0.5">
                <Command size={10} />K
              </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden border-b border-zinc-800"
                >
                  <div className="px-4 py-3 flex flex-wrap gap-2">
                    {/* Page filter */}
                    <select
                      value={filters.page || ''}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, page: e.target.value || null }))
                      }
                      className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded px-2 py-1 outline-none focus:border-orange-500/50"
                    >
                      <option value="">All pages</option>
                      {pageOptions.map((page) => (
                        <option key={page} value={page}>
                          {page.charAt(0).toUpperCase() + page.slice(1)}
                        </option>
                      ))}
                    </select>

                    {/* State filter */}
                    <select
                      value={filters.state || ''}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, state: e.target.value || null }))
                      }
                      className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded px-2 py-1 outline-none focus:border-orange-500/50"
                    >
                      <option value="">All states</option>
                      {STATE_OPTIONS.map((state) => (
                        <option key={state} value={state}>
                          {state.charAt(0).toUpperCase() + state.slice(1)}
                        </option>
                      ))}
                    </select>

                    {/* Content type filter */}
                    <select
                      value={filters.contentType || ''}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          contentType: (e.target.value as 'singleton' | 'collection') || null,
                        }))
                      }
                      className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded px-2 py-1 outline-none focus:border-orange-500/50"
                    >
                      <option value="">All types</option>
                      {CONTENT_TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>

                    {/* Clear filters */}
                    {(filters.page || filters.state || filters.contentType) && (
                      <button
                        type="button"
                        onClick={() =>
                          setFilters({ page: null, state: null, contentType: null })
                        }
                        className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
                      >
                        <X size={10} />
                        Clear
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <div
              ref={listRef}
              className="max-h-[50vh] overflow-y-auto"
            >
              {/* Empty state: no query */}
              {!query.trim() && !loading && (
                <div className="px-4 py-8 text-center">
                  <Search size={24} className="mx-auto mb-2 text-zinc-700" />
                  <p className="text-sm text-zinc-500">
                    Search across all sections and content
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Use filters to narrow by page, state, or content type
                  </p>
                </div>
              )}

              {/* Empty state: no results */}
              {query.trim() && !loading && filteredResults.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-zinc-500">No results found</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Try a different search term or adjust filters
                  </p>
                </div>
              )}

              {/* Grouped results */}
              {groupedResults.map((group: GroupedResults) => (
                <div key={group.sectionId}>
                  {/* Section header */}
                  <div className="px-4 py-1.5 bg-zinc-800/50 border-b border-zinc-800 sticky top-0">
                    <div className="flex items-center gap-2">
                      {sectionsMeta.find((s) => s.id === group.sectionId)?.kind ===
                      'singleton' ? (
                        <FileText size={10} className="text-zinc-600" />
                      ) : (
                        <Layers size={10} className="text-zinc-600" />
                      )}
                      <span className="text-[10px] font-mono uppercase text-zinc-500">
                        {group.page}
                      </span>
                      <span className="text-zinc-700">/</span>
                      <span className="text-xs text-zinc-400">
                        {group.sectionTitle}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  {group.items.map((item) => {
                    const itemIndex = cumulativeIndex++;
                    const isActive = itemIndex === activeIndex;
                    return (
                      <button
                        key={`${item.collection}/${item.slug}`}
                        type="button"
                        data-active={isActive}
                        onClick={() => handleSelect(item)}
                        className={`w-full text-left px-4 py-2.5 flex flex-col gap-0.5 transition-colors ${
                          isActive
                            ? 'bg-orange-500/10 border-l-2 border-orange-500'
                            : 'hover:bg-zinc-800/50 border-l-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-200 truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded flex-shrink-0">
                            {item.matchField}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500 truncate">
                          {highlightSnippet(item.snippet, query).map((part, i) =>
                            part.highlight ? (
                              <span
                                key={i}
                                className="text-orange-400 font-medium"
                              >
                                {part.text}
                              </span>
                            ) : (
                              <span key={i}>{part.text}</span>
                            )
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] text-zinc-600 font-mono">
                <span>
                  <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[9px]">
                    ↑↓
                  </kbd>{' '}
                  navigate
                </span>
                <span>
                  <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[9px]">
                    ↵
                  </kbd>{' '}
                  select
                </span>
                <span>
                  <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[9px]">
                    esc
                  </kbd>{' '}
                  close
                </span>
              </div>
              {filteredResults.length > 0 && (
                <span className="text-[10px] text-zinc-600 font-mono">
                  {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
