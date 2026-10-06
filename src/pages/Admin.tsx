import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Film,
  LayoutDashboard,
  Library,
  MousePointerClick,
  PenSquare,
  Rocket,
  Wand2,
} from 'lucide-react';
import DeploymentCenter from '../components/DeploymentCenter';
import LiveEditor from '../components/LiveEditor';
import PublishingModal, { ACTIVE_JOB_KEY } from '../components/PublishingModal';
import { ToastContainer, type ToastItem, type ToastType } from '../components/Toast';
import { getPublishJob, listContent } from '../components/admin/api';
import { ContentList, DEFAULT_FILTER, type ListFilter } from '../components/admin/ContentList';
import { Dashboard } from '../components/admin/Dashboard';
import { EntryEditor, type EditorMode } from '../components/admin/EntryEditor';
import type { CollectionId, ListItem } from '../components/admin/model';
import { ReelPublisher } from '../components/admin/ReelPublisher';
import { SecretsPanel } from '../components/admin/SecretsPanel';
import '../components/admin/studio.css';

type View = 'dashboard' | 'content' | 'editor' | 'reel' | 'secrets' | 'deploy' | 'live';

const NAV: { id: Exclude<View, 'editor'>; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'content', label: 'Content', icon: Library },
  { id: 'reel', label: 'Publish a reel', icon: Film },
  { id: 'secrets', label: 'Secrets', icon: Wand2 },
  { id: 'live', label: 'Live editor', icon: MousePointerClick },
  { id: 'deploy', label: 'Deployments', icon: Rocket },
];

let toastCounter = 0;

/**
 * The Editorial Hub.
 *
 * A thin shell: it owns the listing, the toasts and the publish dialog, and decides which
 * workspace is on screen. Everything an author does lives in components/admin/*.
 */
export default function Admin({ setView }: { setView: (view: string) => void }) {
  const [view, setWorkspace] = useState<View>('dashboard');
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<ListFilter>(DEFAULT_FILTER);
  const [editor, setEditor] = useState<(EditorMode & { nonce: number }) | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const notify = useCallback((type: ToastType, message: string) => {
    toastCounter += 1;
    const id = `t${toastCounter}`;
    setToasts((current) => [...current.slice(-3), { id, type, message, duration: type === 'error' ? 7000 : 4000 }]);
  }, []);

  const removeToast = useCallback((id: string) => setToasts((current) => current.filter((t) => t.id !== id)), []);

  const refresh = useCallback(async () => {
    try {
      const next = await listContent();
      if (!mounted.current) return;
      setItems(next);
      setLoadError('');
    } catch (error) {
      if (mounted.current) setLoadError(error instanceof Error ? error.message : 'Could not load content');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Pick a publish back up after a reload (Vite reloads the page when content changes mid-publish).
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.sessionStorage.getItem(ACTIVE_JOB_KEY);
    } catch {
      stored = null;
    }
    if (!stored) return;
    void getPublishJob(stored)
      .then((job) => {
        if (!mounted.current) return;
        if (job && job.status !== 'success') {
          setJobId(job.id);
          setPublishOpen(true);
        } else {
          window.sessionStorage.removeItem(ACTIVE_JOB_KEY);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Editorial Hub';
    return () => {
      document.title = previous;
    };
  }, []);

  const go = useCallback((next: View) => setWorkspace(next), []);

  const openEntry = useCallback((collection: CollectionId, slug: string) => {
    setEditor({ kind: 'edit', collection, slug, nonce: Date.now() });
    setWorkspace('editor');
  }, []);

  const openNew = useCallback((collection: CollectionId = 'journal') => {
    const nonce = Date.now();
    setEditor({ kind: 'new', collection, seedKey: String(nonce), nonce });
    setWorkspace('editor');
  }, []);

  const openEditor = useCallback((mode: EditorMode) => {
    setEditor({ ...mode, nonce: Date.now() });
    setWorkspace('editor');
  }, []);

  const openContent = useCallback((patch?: Partial<ListFilter>) => {
    setFilter({ ...DEFAULT_FILTER, ...patch });
    setWorkspace('content');
  }, []);

  const startPublishing = useCallback((id: string) => {
    setJobId(id);
    setPublishOpen(true);
  }, []);

  const editingItem = useMemo(
    () => (editor?.kind === 'edit' ? items.find((item) => item.collection === editor.collection && item.slug === editor.slug) : undefined),
    [editor, items]
  );

  const onPublishClose = useCallback(() => {
    setPublishOpen(false);
    setJobId(null);
    void refresh();
  }, [refresh]);

  const active: View = view;
  const pendingCount = useMemo(
    () => items.filter((item) => item.state === 'draft' || item.state === 'review').length,
    [items]
  );

  return (
    <div className="studio flex h-screen flex-col overflow-hidden lg:flex-row">
      <aside className="flex flex-none flex-col border-b border-zinc-800 bg-[var(--bg-deep)] lg:w-[var(--studio-sidebar)] lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-5 py-4 lg:py-6">
          <span className="st-title text-xl font-semibold uppercase tracking-[-0.04em]">
            AM<span className="text-[var(--accent)]">.</span>
          </span>
          <span className="st-eyebrow !text-[0.5625rem]">Editorial Hub</span>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Studio">
          <button
            type="button"
            className="st-btn st-btn-primary mb-3 hidden w-full justify-center lg:inline-flex"
            onClick={() => openNew()}
          >
            <PenSquare size={14} /> New entry
          </button>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className="st-nav !w-auto flex-none lg:!w-full lg:flex-initial"
              aria-current={active === id || (active === 'editor' && id === 'content') ? 'page' : undefined}
              onClick={() => (id === 'content' ? openContent() : go(id))}
            >
              <Icon size={15} />
              <span className="whitespace-nowrap">{label}</span>
              {id === 'content' && pendingCount > 0 && (
                <span className="ml-auto hidden rounded-full bg-amber-400/15 px-1.5 font-mono text-[10px] text-amber-300 lg:inline" title="Drafts and entries in review">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="hidden space-y-1 border-t border-zinc-800 p-3 lg:block">
          <a className="st-nav" href="/" target="_blank" rel="noreferrer">
            <ExternalLink size={15} /> Open the site
          </a>
          <button type="button" className="st-nav" onClick={() => setView('home')}>
            <ArrowLeft size={15} /> Back to website
          </button>
        </div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1">
        {loadError && (
          <div className="flex items-center gap-3 border-b border-red-500/30 bg-red-500/10 px-6 py-2.5 text-[0.8125rem] text-red-200">
            <span className="flex-1">{loadError}. Is the dev server running?</span>
            <button type="button" className="st-btn st-btn-sm" onClick={() => void refresh()}>
              Retry
            </button>
          </div>
        )}

        {view === 'editor' && editor ? (
          <div className="h-full">
            <EntryEditor
              key={editor.nonce}
              mode={editor}
              item={editingItem}
              notify={notify}
              onExit={() => go('content')}
              onChanged={() => void refresh()}
              onPublish={startPublishing}
            />
          </div>
        ) : (
          <div className="st-scroll h-full overflow-y-auto">
            {view === 'dashboard' && (
              <Dashboard
                items={items}
                loading={loading}
                onContent={openContent}
                onEdit={openEntry}
                onNew={openNew}
                onReel={() => go('reel')}
                onDeploy={() => go('deploy')}
              />
            )}
            {view === 'content' && (
              <ContentList
                items={items}
                loading={loading}
                filter={filter}
                onFilter={setFilter}
                notify={notify}
                onEdit={openEntry}
                onNew={openNew}
                onChanged={() => void refresh()}
                onPublish={startPublishing}
              />
            )}
            {view === 'reel' && (
              <ReelPublisher
                items={items}
                notify={notify}
                onChanged={() => void refresh()}
                onPublish={startPublishing}
                onOpenEditor={openEditor}
                onOpenEntry={openEntry}
              />
            )}
            {view === 'secrets' && (
              <SecretsPanel
                items={items}
                loading={loading}
                notify={notify}
                onChanged={() => void refresh()}
                onEdit={(slug) => openEntry('secrets', slug)}
                onOpenEditor={openEditor}
              />
            )}
            {view === 'deploy' && (
              <DeploymentCenter
                items={items}
                onEditReel={(slug) => openEntry('home', slug)}
                onPublishReel={() => go('reel')}
              />
            )}
            {view === 'live' && (
              <div className="h-full">
                <LiveEditor
                  content={items}
                  onNavigateToEditor={(item) => openEntry(item.collection as CollectionId, item.slug)}
                  onToast={notify}
                  onPublish={startPublishing}
                />
              </div>
            )}
          </div>
        )}
      </main>

      <PublishingModal isOpen={publishOpen} onClose={onPublishClose} jobId={jobId} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
