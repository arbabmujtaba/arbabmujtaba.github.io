import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Camera,
  CircleAlert,
  Cpu,
  Film,
  FolderGit2,
  Globe,
  Home,
  Loader2,
  PenLine,
  Plus,
  Rocket,
} from 'lucide-react';
import { kindLabel, thumbOf, type ListFilter } from './ContentList';
import { standingOf, type CollectionId, type ListItem } from './model';
import { StandingBadge } from './ui';

interface DeployStatus {
  currentStatus?: 'idle' | 'building' | 'success' | 'failed';
  lastDeployment?: { timestamp: string; status: 'success' | 'failed'; message?: string } | null;
  websiteUrl?: string | null;
}

const ago = (iso?: string): string => {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return '';
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
};

const QUICK: { collection: CollectionId; label: string; blurb: string; icon: typeof BookOpen }[] = [
  { collection: 'journal', label: 'Journal entry', blurb: 'Write', icon: BookOpen },
  { collection: 'photography', label: 'Photo story', blurb: 'Show', icon: Camera },
  { collection: 'tech', label: 'Build log', blurb: 'Document', icon: Cpu },
  { collection: 'portfolio', label: 'Case study', blurb: 'Present', icon: FolderGit2 },
];

/** Where things stand, and what to do next. */
export function Dashboard({
  items,
  loading,
  onContent,
  onEdit,
  onNew,
  onReel,
  onDeploy,
}: {
  items: ListItem[];
  loading: boolean;
  onContent: (filter?: Partial<ListFilter>) => void;
  onEdit: (collection: CollectionId, slug: string) => void;
  onNew: (collection?: CollectionId) => void;
  onReel: () => void;
  onDeploy: () => void;
}) {
  const [deploy, setDeploy] = useState<DeployStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/deploy/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => !cancelled && setDeploy(data))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    let live = 0;
    let draft = 0;
    let review = 0;
    let hidden = 0;
    let reels = 0;
    for (const item of items) {
      const standing = standingOf(item);
      if (standing === 'live') live += 1;
      else if (standing === 'draft') draft += 1;
      else if (standing === 'review') review += 1;
      else if (standing === 'hidden') hidden += 1;
      if (item.collection === 'home' && item.configType === 'reel') reels += 1;
    }
    return { live, draft, review, hidden, reels, total: items.length };
  }, [items]);

  const attention = useMemo(
    () =>
      items
        .filter((item) => item.state === 'draft' || item.state === 'review' || item.unsavedChanges || item.frontMatterError)
        .slice(0, 6),
    [items]
  );

  const recent = useMemo(
    () =>
      [...items]
        .filter((item) => item.collection !== 'home' && item.collection !== 'timeline' && item.collection !== 'favorites' && item.collection !== 'gear')
        .sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0))
        .slice(0, 5),
    [items]
  );

  const cards: { label: string; value: number; hint: string; tone: string; go: Partial<ListFilter> }[] = [
    { label: 'Live', value: stats.live, hint: 'Showing on the site', tone: 'text-emerald-400', go: { state: 'live' } },
    { label: 'Drafts', value: stats.draft + stats.review, hint: 'Saved, not published', tone: 'text-amber-400', go: { state: 'draft' } },
    { label: 'Hidden', value: stats.hidden, hint: 'Switched off', tone: 'text-zinc-400', go: { state: 'hidden' } },
    { label: 'Reels', value: stats.reels, hint: 'On the Home page', tone: 'text-[var(--accent)]', go: { section: 'home', query: 'reel' } },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="st-eyebrow">Editorial Hub</p>
          <h1 className="st-title mt-2 text-[2.25rem] leading-tight">Your studio</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">
            Write, shape and publish everything on the site — and see it exactly as visitors will.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="st-btn" onClick={onReel}>
            <Film size={14} /> Publish a reel
          </button>
          <button type="button" className="st-btn st-btn-primary" onClick={() => onNew()}>
            <Plus size={14} /> New entry
          </button>
        </div>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Site at a glance">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => onContent(card.go)}
            className="st-card group p-4 text-left transition hover:border-zinc-600"
          >
            <p className="st-eyebrow">{card.label}</p>
            <p className={`st-title mt-2 text-4xl tabular-nums ${card.tone}`}>{loading ? '–' : card.value}</p>
            <p className="mt-1 flex items-center justify-between text-[0.6875rem] text-zinc-500">
              {card.hint}
              <ArrowRight size={12} className="opacity-0 transition group-hover:opacity-100" />
            </p>
          </button>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <section className="st-card">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
              <h2 className="st-title text-base">Start something</h2>
            </div>
            <div className="grid grid-cols-2 gap-px bg-zinc-800 sm:grid-cols-4">
              {QUICK.map(({ collection, label, blurb, icon: Icon }) => (
                <button
                  key={collection}
                  type="button"
                  onClick={() => onNew(collection)}
                  className="group bg-[var(--bg-raised)] p-4 text-left transition hover:bg-[var(--well)]"
                >
                  <Icon size={16} className="text-zinc-500 transition group-hover:text-[var(--accent)]" />
                  <p className="mt-3 text-[0.8125rem] text-zinc-100">{label}</p>
                  <p className="text-[0.6875rem] text-zinc-500">{blurb}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="st-card">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
              <h2 className="st-title text-base">Latest entries</h2>
              <button type="button" className="text-[0.6875rem] text-zinc-400 hover:text-white" onClick={() => onContent()}>
                See all {stats.total} →
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-10 text-zinc-500">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : (
              recent.map((item) => (
                <button
                  key={`${item.collection}/${item.slug}`}
                  type="button"
                  onClick={() => onEdit(item.collection, item.slug)}
                  className="st-row w-full grid-cols-[auto_minmax(0,1fr)_auto] text-left"
                >
                  <span className="st-thumb">{thumbOf(item) && <img src={thumbOf(item)} alt="" loading="lazy" />}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[0.8125rem] text-zinc-100">{item.title}</span>
                    <span className="block truncate text-[0.6875rem] text-zinc-500">{kindLabel(item)}</span>
                  </span>
                  <StandingBadge item={item} />
                </button>
              ))
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          <section className="st-card">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
              <h2 className="st-title text-base">Site</h2>
              <Globe size={14} className="text-zinc-600" />
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-center gap-2 text-[0.8125rem] text-zinc-200">
                <span
                  className={`h-2 w-2 rounded-full ${
                    deploy?.currentStatus === 'building'
                      ? 'st-pulse bg-amber-400'
                      : deploy?.currentStatus === 'failed'
                        ? 'bg-red-400'
                        : deploy
                          ? 'bg-emerald-400'
                          : 'bg-zinc-600'
                  }`}
                />
                {deploy?.currentStatus === 'building'
                  ? 'Building…'
                  : deploy?.currentStatus === 'failed'
                    ? 'Last build failed'
                    : deploy
                      ? 'Up to date'
                      : 'Status unavailable'}
              </div>
              {deploy?.lastDeployment && (
                <p className="text-[0.6875rem] leading-snug text-zinc-500">
                  Last deploy {ago(deploy.lastDeployment.timestamp)}
                  {deploy.lastDeployment.message ? ` — ${deploy.lastDeployment.message}` : ''}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" className="st-btn st-btn-sm" onClick={onDeploy}>
                  <Rocket size={12} /> Deployments
                </button>
                <a className="st-btn st-btn-sm st-btn-ghost" href="/" target="_blank" rel="noreferrer">
                  <Home size={12} /> Open site
                </a>
              </div>
            </div>
          </section>

          <section className="st-card">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
              <h2 className="st-title text-base">Needs a look</h2>
              <CircleAlert size={14} className="text-zinc-600" />
            </div>
            {attention.length === 0 ? (
              <p className="p-5 text-[0.75rem] text-zinc-500">Nothing waiting. Everything saved is published.</p>
            ) : (
              <div>
                {attention.map((item) => (
                  <button
                    key={`${item.collection}/${item.slug}`}
                    type="button"
                    onClick={() => onEdit(item.collection, item.slug)}
                    className="flex w-full items-center gap-3 border-b border-zinc-800/70 px-5 py-2.5 text-left last:border-b-0 hover:bg-[var(--well)]"
                  >
                    <PenLine size={12} className="flex-none text-zinc-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.75rem] text-zinc-200">{item.title}</span>
                      <span className="block text-[0.625rem] text-zinc-500">
                        {item.frontMatterError
                          ? 'Front matter needs fixing'
                          : item.state === 'draft'
                            ? 'Draft — not published yet'
                            : item.state === 'review'
                              ? 'Ready for review'
                              : 'Edited since publishing'}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
