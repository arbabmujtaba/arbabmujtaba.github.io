import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import Glyph from './Glyph';
import { castSpell, useMagic, type Spell, type ThemePref } from '../../lib/magic';
import { navigate } from '../../lib/navigation';
import { lockScroll } from '../../lib/scrollLock';
import { getJournalEntries, getPhotographyEntries, getPortfolioProjects, getTechEntries } from '../../lib/cms';

const EASE = [0.16, 1, 0.3, 1] as const;

type Group = 'places' | 'spells' | 'light' | 'archive';

interface Item {
  id: string;
  group: Group;
  label: string;
  hint?: string;
  /** Extra words the filter matches on but the list does not show. */
  keywords?: string;
  glyph?: string;
  date?: number;
  run: () => void;
}

const GROUP_LABEL: Record<Group, string> = {
  places: 'go to',
  spells: 'cast',
  light: 'light',
  archive: 'from the archive',
};

function time(date?: string) {
  const t = date ? new Date(date).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Palette — the index. ⌘K / Ctrl+K or "/" anywhere outside a text field (and
 * "Search the archive" in the ledger, for a phone). One input over every page,
 * every entry in the archive, the spells and the light. Built from the same
 * bundled content as the pages, so nothing is fetched and it can never list
 * something that is not on the site.
 */
export default function Palette({ onClose }: { onClose: () => void }) {
  const reduced = useReducedMotion();
  const { setWand, setThemePref } = useMagic();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const items = useMemo<Item[]>(() => {
    const go = (path: string) => () => navigate(path);
    const spell = (name: Spell) => () => {
      setWand(true);
      castSpell(name);
    };
    const light = (pref: ThemePref) => () => setThemePref(pref);

    const places: Item[] = [
      { id: 'p-home', group: 'places', label: 'Home', hint: 'the front of the archive', keywords: 'index start', glyph: 'door', run: go('/') },
      { id: 'p-work', group: 'places', label: 'Work', hint: 'things built', keywords: 'portfolio projects', glyph: 'door', run: go('/portfolio') },
      { id: 'p-journal', group: 'places', label: 'Journal', hint: 'every volume', keywords: 'writing volumes', glyph: 'quill', run: go('/journal') },
      { id: 'p-logs', group: 'places', label: 'Logs', hint: 'build notes', keywords: 'tech', glyph: 'door', run: go('/tech') },
      { id: 'p-frames', group: 'places', label: 'Frames', hint: 'photographs', keywords: 'photography photos', glyph: 'lens', run: go('/photography') },
    ];
    const spells: Item[] = [
      { id: 's-lumos', group: 'spells', label: 'Lumos', hint: 'light the margins', keywords: 'light ink', glyph: 'lantern', run: spell('lumos') },
      { id: 's-nox', group: 'spells', label: 'Nox', hint: 'put the light out', keywords: 'dark', glyph: 'moon', run: () => castSpell('nox') },
      { id: 's-revelio', group: 'spells', label: 'Revelio', hint: 'show what is hiding on this screen', keywords: 'reveal hidden secret', glyph: 'star', run: spell('revelio') },
      { id: 's-accio', group: 'spells', label: 'Accio', hint: 'summon a line from the journal', keywords: 'summon quote', glyph: 'quill', run: spell('accio') },
      { id: 's-leviosa', group: 'spells', label: 'Wingardium leviosa', hint: 'lift the page a little', keywords: 'levitate float', glyph: 'wand', run: spell('leviosa') },
    ];
    const lights: Item[] = [
      { id: 'l-night', group: 'light', label: 'Night', hint: 'ink, a few stars', keywords: 'dark theme', glyph: 'moon', run: light('night') },
      { id: 'l-day', group: 'light', label: 'Day', hint: 'paper, plain light', keywords: 'light theme', glyph: 'sun', run: light('day') },
      { id: 'l-auto', group: 'light', label: 'Follow the clock', hint: 'day from 6 to 6', keywords: 'auto theme', glyph: 'clock', run: light('auto') },
    ];
    const archive: Item[] = [
      ...getJournalEntries().map((e) => ({
        id: `journal/${e.slug}`,
        group: 'archive' as const,
        label: e.title,
        hint: e.volume ? `journal · vol. ${String(e.volume).padStart(2, '0')}` : 'journal',
        keywords: `${e.excerpt ?? ''} ${(e.tags ?? []).join(' ')}`,
        glyph: 'quill',
        date: time(e.date),
        run: go(`/journal/${e.slug}`),
      })),
      ...getPortfolioProjects().map((p) => ({
        id: `portfolio/${p.slug}`,
        group: 'archive' as const,
        label: p.title,
        hint: 'work',
        keywords: `${p.description ?? ''} ${(p.techStack as (string | { tech: string })[]).map((t) => (typeof t === 'string' ? t : t.tech)).join(' ')}`,
        glyph: 'compass',
        date: 0,
        run: go(`/portfolio/${p.slug}`),
      })),
      ...getTechEntries().map((t) => ({
        id: `tech/${t.slug}`,
        group: 'archive' as const,
        label: t.title,
        hint: `log · ${t.category.toLowerCase()}`,
        keywords: t.excerpt ?? '',
        glyph: 'door',
        date: time(t.date),
        run: go(`/tech/${t.slug}`),
      })),
      ...getPhotographyEntries().map((p) => ({
        id: `photography/${p.slug}`,
        group: 'archive' as const,
        label: p.title,
        hint: `frame · ${p.category.toLowerCase()}`,
        keywords: p.description ?? '',
        glyph: 'lens',
        date: time(p.date),
        run: go(`/photography/${p.slug}`),
      })),
    ];
    return [...places, ...spells, ...lights, ...archive];
  }, [setWand, setThemePref]);

  const results = useMemo(() => {
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      // Nothing typed: the ways around, the spells, and the five newest things.
      const newest = items
        .filter((i) => i.group === 'archive')
        .sort((a, b) => (b.date ?? 0) - (a.date ?? 0))
        .slice(0, 5);
      return [...items.filter((i) => i.group !== 'archive'), ...newest];
    }
    return items
      .map((item) => {
        const label = item.label.toLowerCase();
        const hay = `${label} ${item.hint ?? ''} ${item.keywords ?? ''}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return null;
        const score = (label.startsWith(words[0]) ? 0 : label.includes(words[0]) ? 1 : 2) + (item.group === 'archive' ? 0.5 : 0);
        return { item, score };
      })
      .filter((r): r is { item: Item; score: number } => r !== null)
      .sort((a, b) => a.score - b.score)
      .slice(0, 40)
      .map((r) => r.item);
  }, [items, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const release = lockScroll();
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => {
      release();
      previous?.focus?.();
    };
  }, []);

  // Keep the active option in view.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (item: Item | undefined) => {
    if (!item) return;
    onClose();
    item.run();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(results[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'Tab') {
      // The input is the only stop; Tab walks the list instead of leaving it.
      event.preventDefault();
      setActive((i) => (results.length ? (i + (event.shiftKey ? -1 : 1) + results.length) % results.length : 0));
    }
  };

  let lastGroup: Group | null = null;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-start justify-center px-3 pt-[10vh] md:pt-[14vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button type="button" aria-label="Close the index" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-default bg-canvas-deep/75" />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="The index"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="relative flex max-h-[min(70vh,34rem)] w-full max-w-xl flex-col overflow-hidden rounded-[4px] border border-zinc-700 bg-canvas-raised shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)]"
      >
        {/* one scan down the panel as it opens */}
        {!reduced && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-transparent via-accent/10 to-transparent"
            initial={{ y: '-100%' }}
            animate={{ y: '900%' }}
            transition={{ duration: 0.9, ease: EASE }}
          />
        )}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 pb-2 pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-alarm" />
            the index
          </span>
          <span>{results.length} found</span>
        </div>
        <label className="flex items-center gap-3 border-b border-zinc-800 px-4">
          <span aria-hidden="true" className="font-mono text-sm text-accent">
            ›
          </span>
          <span className="sr-only">Search the archive, the spells and the light</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            aria-autocomplete="list"
            placeholder="a title, a place, a spell…"
            autoComplete="off"
            spellCheck={false}
            className="min-h-[52px] w-full bg-transparent font-mono text-sm text-zinc-50 placeholder:text-zinc-600 focus:outline-none"
          />
        </label>

        <ul ref={listRef} id={listId} role="listbox" aria-label="Results" className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain py-2">
          {results.length === 0 && (
            <li className="px-4 py-8 text-center font-book text-lg italic text-zinc-400">Nothing in the archive by that name.</li>
          )}
          {results.map((item, index) => {
            const heading = item.group !== lastGroup ? GROUP_LABEL[item.group] : null;
            lastGroup = item.group;
            const isActive = index === active;
            return (
              <li key={item.id} role="presentation">
                {heading && (
                  <p aria-hidden="true" className="px-4 pb-1 pt-3 font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-600">
                    {heading}
                  </p>
                )}
                <div
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={isActive}
                  data-index={index}
                  onPointerMove={() => !isActive && setActive(index)}
                  onClick={() => choose(item)}
                  className={`relative mx-2 flex min-h-[44px] cursor-pointer items-center gap-3 rounded-[3px] px-3 py-2 transition-colors ${
                    isActive ? 'bg-well text-zinc-50' : 'text-zinc-300'
                  }`}
                >
                  {isActive && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-px bg-accent" />}
                  <Glyph
                    name={item.glyph ?? 'door'}
                    size={15}
                    className={item.group === 'spells' ? 'text-gilt' : isActive ? 'text-accent' : 'text-zinc-500'}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">{item.label}</span>
                  {item.hint && (
                    <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 sm:inline">{item.hint}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-4 border-t border-zinc-800 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600 md:flex">
          <span>↑ ↓ move</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
