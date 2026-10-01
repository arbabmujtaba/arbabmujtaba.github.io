import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  Check,
  ExternalLink,
  Film,
  Loader2,
  MoreHorizontal,
  PenLine,
  Plus,
  RotateCcw,
  Rocket,
  Search,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { deleteDoc, getDoc, setState, startPublish } from './api';
import type { Notify } from './MediaField';
import {
  WEBSITE_STRUCTURE,
  destinationFor,
  prettyCategory,
  publicPath,
  sectionFor,
  standingOf,
  type CollectionId,
  type ListItem,
  type Standing,
  type WorkflowState,
} from './model';
import { ConfirmDialog, StandingBadge } from './ui';

export type StateFilter = 'all' | Standing;

export interface ListFilter {
  section: string;
  state: StateFilter;
  query: string;
}

export const DEFAULT_FILTER: ListFilter = { section: 'all', state: 'all', query: '' };

const STATE_FILTERS: { id: StateFilter; label: string; hint: string }[] = [
  { id: 'all', label: 'All', hint: 'Everything' },
  { id: 'live', label: 'Live', hint: 'Shown on the site' },
  { id: 'draft', label: 'Draft', hint: 'Saved here, not published yet' },
  { id: 'review', label: 'Review', hint: 'Marked ready to publish' },
  { id: 'hidden', label: 'Hidden', hint: 'Published but switched off on the site' },
  { id: 'archived', label: 'Archived', hint: 'Taken out of circulation' },
];

const PAGE_SIZE = 40;

const dateLabel = (value: string): string => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value || '—';
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const thumbOf = (item: ListItem): string => item.coverImage || item.videoPoster || '';

/** What a row calls the thing: home blocks are named by their type, not "home". */
export const kindLabel = (item: ListItem): string => {
  if (item.collection === 'home') return item.configType ? `Home · ${item.configType}` : 'Home block';
  return destinationFor(item.collection)?.label ?? item.collection;
};

function RowMenu({ children }: { children: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        className="st-btn st-btn-sm st-btn-icon st-btn-ghost"
        aria-label="More actions"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-lg border border-zinc-700 bg-[var(--bg-raised)] py-1 shadow-2xl st-rise">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

const MenuItem = ({
  icon,
  children,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition hover:bg-[var(--well)] ${
      danger ? 'text-[#f0816f]' : 'text-zinc-300'
    }`}
  >
    {icon}
    {children}
  </button>
);

export function matchesFilter(item: ListItem, filter: ListFilter): boolean {
  if (filter.section !== 'all' && sectionFor(item.collection)?.id !== filter.section) return false;
  if (filter.state !== 'all' && standingOf(item) !== filter.state) return false;
  const needle = filter.query.trim().toLowerCase();
  if (needle) {
    const haystack = `${item.title} ${item.slug} ${item.category} ${item.collection} ${item.label ?? ''}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

/**
 * Every entry, filterable by the part of the site it feeds and by how it stands.
 * The badge is the item's real standing — live, hidden, draft — never just the registry label.
 */
export function ContentList({
  items,
  loading,
  filter,
  onFilter,
  notify,
  onEdit,
  onNew,
  onChanged,
  onPublish,
}: {
  items: ListItem[];
  loading: boolean;
  filter: ListFilter;
  onFilter: (next: ListFilter) => void;
  notify: Notify;
  onEdit: (collection: CollectionId, slug: string) => void;
  onNew: (collection?: CollectionId) => void;
  onChanged: () => void;
  onPublish: (jobId: string) => void;
}) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ListItem | null>(null);

  useEffect(() => setLimit(PAGE_SIZE), [filter]);

  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    for (const item of items) {
      if (filter.state !== 'all' && standingOf(item) !== filter.state) continue;
      counts.all += 1;
      const id = sectionFor(item.collection)?.id;
      if (id) counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  }, [items, filter.state]);

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    for (const item of items) {
      if (filter.section !== 'all' && sectionFor(item.collection)?.id !== filter.section) continue;
      counts.all += 1;
      const standing = standingOf(item);
      counts[standing] = (counts[standing] ?? 0) + 1;
    }
    return counts;
  }, [items, filter.section]);

  const rows = useMemo(() => items.filter((item) => matchesFilter(item, filter)), [items, filter]);

  const keyOf = (item: ListItem) => `${item.collection}/${item.slug}`;

  const move = async (item: ListItem, to: WorkflowState, done: string) => {
    setBusy(keyOf(item));
    try {
      await setState(item.collection, item.slug, to);
      notify('success', done);
      onChanged();
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Could not change the state');
    } finally {
      setBusy(null);
    }
  };

  const publish = async (item: ListItem) => {
    setBusy(keyOf(item));
    try {
      const doc = await getDoc(item.collection, item.slug);
      const { jobId } = await startPublish({
        collection: item.collection,
        slug: item.slug,
        title: item.title,
        body: doc.body,
        frontmatter: doc.data,
      });
      onPublish(jobId);
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Publishing failed to start');
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    const item = pendingDelete;
    setPendingDelete(null);
    if (!item) return;
    setBusy(keyOf(item));
    try {
      await deleteDoc(item.collection, item.slug);
      notify('success', `Deleted “${item.title}”.`);
      onChanged();
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Could not delete');
    } finally {
      setBusy(null);
    }
  };

  const filtered = filter.section !== 'all' || filter.state !== 'all' || filter.query.trim() !== '';

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="st-eyebrow">Library</p>
          <h1 className="st-title mt-2 text-[2rem] leading-tight">Content</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {loading ? 'Loading…' : `${rows.length} of ${items.length} entries`}
          </p>
        </div>
        <button type="button" className="st-btn st-btn-primary" onClick={() => onNew(filter.section === 'all' ? undefined : (WEBSITE_STRUCTURE.find((s) => s.id === filter.section)?.destinations[0].collection))}>
          <Plus size={14} /> New entry
        </button>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-x-5 border-b border-zinc-800" role="tablist" aria-label="Website section">
        {[{ id: 'all', label: 'Everything' }, ...WEBSITE_STRUCTURE.map((s) => ({ id: s.id, label: s.label }))].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className="st-tab"
            aria-selected={filter.section === tab.id}
            onClick={() => onFilter({ ...filter, section: tab.id })}
          >
            {tab.label}
            <span className="ml-1.5 font-mono text-[10px] text-zinc-600">{sectionCounts[tab.id] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="st-seg" role="group" aria-label="Standing">
          {STATE_FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              title={option.hint}
              aria-pressed={filter.state === option.id}
              onClick={() => onFilter({ ...filter, state: option.id })}
            >
              {option.label}
              <span className="ml-1 font-mono text-[9px] opacity-60">{stateCounts[option.id] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-72">
          <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            className="st-input !pl-8"
            value={filter.query}
            onChange={(e) => onFilter({ ...filter, query: e.target.value })}
            placeholder="Search title, slug, category…"
            aria-label="Search entries"
          />
        </div>
      </div>

      <div className="st-card overflow-visible">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-zinc-500">
            <Loader2 size={16} className="animate-spin" /> Reading the content folders…
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="st-title text-xl">{filtered ? 'Nothing matches' : 'Nothing here yet'}</p>
            <p className="mt-2 text-sm text-zinc-500">
              {filtered ? 'Try another section or standing, or clear the search.' : 'Create your first entry.'}
            </p>
            {filtered && (
              <button type="button" className="st-btn mt-5" onClick={() => onFilter(DEFAULT_FILTER)}>
                <RotateCcw size={13} /> Clear filters
              </button>
            )}
          </div>
        ) : (
          rows.slice(0, limit).map((item) => {
            const href = publicPath(item.collection, item.slug);
            const working = busy === keyOf(item);
            const standing = standingOf(item);
            return (
              <div key={keyOf(item)} className="st-row grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[auto_minmax(0,1fr)_7rem_6.5rem_auto]">
                <button type="button" className="st-thumb" onClick={() => onEdit(item.collection, item.slug)} aria-label={`Edit ${item.title}`}>
                  {thumbOf(item) ? (
                    <img src={thumbOf(item)} alt="" loading="lazy" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-zinc-700">
                      {item.hasVideo ? <Film size={14} /> : <PenLine size={14} />}
                    </span>
                  )}
                </button>

                <div className="min-w-0">
                  <button
                    type="button"
                    className="block max-w-full truncate text-left text-[0.875rem] font-medium text-zinc-100 hover:text-[var(--accent)]"
                    onClick={() => onEdit(item.collection, item.slug)}
                  >
                    {item.title || item.slug}
                  </button>
                  <p className="mt-0.5 flex min-w-0 items-center gap-2 text-[0.6875rem] text-zinc-500">
                    <span className="truncate">{kindLabel(item)}</span>
                    {item.category && item.collection !== 'home' && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="truncate">{prettyCategory(item.category)}</span>
                      </>
                    )}
                    {item.hasVideo && (
                      <span className="inline-flex items-center gap-1 text-zinc-400" title="Has a motion clip">
                        <Film size={10} /> clip
                      </span>
                    )}
                    {item.frontMatterError && (
                      <span className="inline-flex items-center gap-1 text-amber-400" title={item.frontMatterError}>
                        <TriangleAlert size={10} /> front matter
                      </span>
                    )}
                  </p>
                </div>

                <span className="hidden font-mono text-[0.6875rem] text-zinc-500 sm:block">{dateLabel(item.date)}</span>

                <span className="hidden items-center gap-1.5 sm:flex">
                  <StandingBadge item={item} />
                  {item.unsavedChanges && standing === 'live' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Edited since it was last published" />
                  )}
                </span>

                <div className="flex items-center gap-1">
                  {working ? (
                    <Loader2 size={14} className="mx-2 animate-spin text-zinc-500" />
                  ) : (
                    <>
                      <button type="button" className="st-btn st-btn-sm" onClick={() => onEdit(item.collection, item.slug)}>
                        <PenLine size={12} /> Edit
                      </button>
                      <RowMenu>
                        {(close) => (
                          <>
                            <a
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              onClick={close}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-[var(--well)]"
                            >
                              <ExternalLink size={13} /> Open on the site
                            </a>
                            <MenuItem
                              icon={<Rocket size={13} />}
                              onClick={() => {
                                close();
                                void publish(item);
                              }}
                            >
                              {standing === 'live' ? 'Publish changes' : 'Publish to the site'}
                            </MenuItem>
                            {item.state === 'draft' && (
                              <MenuItem icon={<Check size={13} />} onClick={() => { close(); void move(item, 'review', 'Marked ready for review.'); }}>
                                Mark ready for review
                              </MenuItem>
                            )}
                            {item.state === 'review' && (
                              <MenuItem icon={<RotateCcw size={13} />} onClick={() => { close(); void move(item, 'draft', 'Moved back to draft.'); }}>
                                Back to draft
                              </MenuItem>
                            )}
                            {item.state === 'published' && (
                              <MenuItem icon={<Archive size={13} />} onClick={() => { close(); void move(item, 'archived', 'Archived.'); }}>
                                Archive
                              </MenuItem>
                            )}
                            {item.state === 'archived' && (
                              <MenuItem icon={<RotateCcw size={13} />} onClick={() => { close(); void move(item, 'draft', 'Restored as a draft.'); }}>
                                Restore as draft
                              </MenuItem>
                            )}
                            <div className="my-1 border-t border-zinc-800" />
                            <MenuItem danger icon={<Trash2 size={13} />} onClick={() => { close(); setPendingDelete(item); }}>
                              Delete…
                            </MenuItem>
                          </>
                        )}
                      </RowMenu>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {rows.length > limit && (
        <div className="mt-4 text-center">
          <button type="button" className="st-btn" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
            Show {Math.min(PAGE_SIZE, rows.length - limit)} more
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        danger
        title="Delete this entry?"
        message={
          pendingDelete
            ? `“${pendingDelete.title}” and its file in content/${pendingDelete.collection}/ will be removed from this machine. Nothing is touched on the live site until you publish.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={() => void remove()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
