import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ExternalLink,
  Film,
  Home,
  Link2,
  Loader2,
  PenLine,
  Rocket,
  Save,
  Search,
  Sparkles,
} from 'lucide-react';
import type { PostCustomization } from '../../types';
import { createDoc, getDoc, startPublish, updateDoc } from './api';
import type { EditorMode } from './EntryEditor';
import { LivePreview } from './LivePreview';
import { ClipField, type Notify } from './MediaField';
import {
  STYLED_COLLECTIONS,
  WEBSITE_STRUCTURE,
  destinationFor,
  emptyForm,
  publicPath,
  serializeForm,
  slugify,
  type CollectionId,
  type FormState,
  type ListItem,
} from './model';
import { StyleStudio } from './StyleStudio';
import { ConfirmDialog, Field, Group, Segmented, StandingBadge, Toggle } from './ui';

type Target = 'reel' | 'attach' | 'post';

const TARGETS: { id: Target; title: string; blurb: string; icon: typeof Home; where: string }[] = [
  {
    id: 'reel',
    title: 'Home page reel',
    blurb: 'A looping clip in “Frames that keep moving” on the landing page.',
    icon: Home,
    where: 'Home page',
  },
  {
    id: 'attach',
    title: 'Add to an existing entry',
    blurb: 'Give a journal entry, build log, photo story or case study a motion clip.',
    icon: Link2,
    where: 'That entry’s page',
  },
  {
    id: 'post',
    title: 'Start a new post',
    blurb: 'Open the editor with this clip already attached, and write around it.',
    icon: PenLine,
    where: 'A new page',
  },
];

const POST_KINDS = WEBSITE_STRUCTURE.flatMap((section) => section.destinations).filter((dest) =>
  STYLED_COLLECTIONS.includes(dest.collection)
);

interface Saved {
  collection: CollectionId;
  slug: string;
  title: string;
  data: Record<string, any>;
  body: string;
  published: boolean;
}

/**
 * Publish a reel — one screen from "I have a clip" to "it is on the site".
 *
 * The author picks a clip, says where it should go, and sees that place. Nothing is
 * written until Save, and nothing is pushed until Save & publish.
 */
export function ReelPublisher({
  items,
  notify,
  onChanged,
  onPublish,
  onOpenEditor,
  onOpenEntry,
}: {
  items: ListItem[];
  notify: Notify;
  onChanged: () => void;
  onPublish: (jobId: string) => void;
  onOpenEditor: (mode: EditorMode) => void;
  onOpenEntry: (collection: CollectionId, slug: string) => void;
}) {
  const [target, setTarget] = useState<Target>('reel');
  const [video, setVideo] = useState('');
  const [poster, setPoster] = useState('');

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [visible, setVisible] = useState(true);
  const [customization, setCustomization] = useState<PostCustomization>({});
  const [replay, setReplay] = useState(0);

  const reels = useMemo(
    () => items.filter((item) => item.collection === 'home' && item.configType === 'reel'),
    [items]
  );
  const nextOrder = useMemo(
    () => reels.reduce((max, item) => Math.max(max, typeof item.order === 'number' ? item.order : 0), 0) + 1,
    [reels]
  );
  const [order, setOrder] = useState<number | null>(null);
  const effectiveOrder = order ?? nextOrder;

  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<{ collection: CollectionId; slug: string } | null>(null);
  const [kind, setKind] = useState<CollectionId>('journal');

  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);

  const candidates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items
      .filter((item) => STYLED_COLLECTIONS.includes(item.collection) || (item.collection === 'home' && item.configType === 'reel'))
      .filter((item) => !needle || `${item.title} ${item.slug} ${item.collection}`.toLowerCase().includes(needle))
      .slice(0, 60);
  }, [items, query]);

  const pickedItem = picked && items.find((item) => item.collection === picked.collection && item.slug === picked.slug);

  const slug = `reel-${slugify(title) || 'untitled'}`;

  const reelForm: FormState = useMemo(() => {
    const base = emptyForm('home', 'reel');
    return {
      ...base,
      slug,
      title: title || 'Untitled reel',
      label: caption,
      excerpt: description,
      video,
      videoPoster: poster,
      order: effectiveOrder,
      visible,
      customization,
    };
  }, [slug, title, caption, description, video, poster, effectiveOrder, visible, customization]);

  const ready = Boolean(video);
  const reelReady = ready && title.trim().length > 0;
  const attachReady = ready && !!pickedItem;
  const postReady = ready && title.trim().length > 0;
  const canGo = target === 'reel' ? reelReady : target === 'attach' ? attachReady : postReady;

  const reset = () => {
    setSaved(null);
    setVideo('');
    setPoster('');
    setTitle('');
    setCaption('');
    setDescription('');
    setCustomization({});
    setPicked(null);
    setOrder(null);
    setVisible(true);
  };

  const saveReel = async (): Promise<Saved | null> => {
    const form = { ...reelForm, title: title.trim() };
    const { data, body } = serializeForm(form);
    const created = await createDoc('home', form.slug, data, body || 'Reel published from the admin.');
    const result: Saved = { collection: 'home', slug: created.slug, title: form.title, data, body, published: false };
    if (created.slug !== form.slug) notify('info', `Saved as “${created.slug}” — that address was already taken.`);
    return result;
  };

  const attach = async (): Promise<Saved | null> => {
    if (!pickedItem) return null;
    const doc = await getDoc(pickedItem.collection, pickedItem.slug);
    const data = { ...doc.data, video, ...(poster ? { videoPoster: poster } : {}) };
    await updateDoc(pickedItem.collection, pickedItem.slug, pickedItem.slug, data, doc.body);
    return {
      collection: pickedItem.collection,
      slug: pickedItem.slug,
      title: pickedItem.title,
      data,
      body: doc.body,
      published: false,
    };
  };

  const run = async (andPublish: boolean) => {
    setConfirm(false);
    if (!canGo) return;
    setBusy(true);
    try {
      let result: Saved | null = null;
      if (target === 'reel') result = await saveReel();
      else if (target === 'attach') result = await attach();
      if (!result) return;

      if (andPublish) {
        const { jobId } = await startPublish({
          collection: result.collection,
          slug: result.slug,
          title: result.title,
          body: result.body,
          frontmatter: result.data,
        });
        result = { ...result, published: true };
        onPublish(jobId);
      }
      setSaved(result);
      onChanged();
      notify('success', andPublish ? 'Saved — publishing now.' : 'Saved to your content folder.');
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Could not save the reel');
    } finally {
      setBusy(false);
    }
  };

  const publishSaved = async () => {
    if (!saved) return;
    setBusy(true);
    try {
      const { jobId } = await startPublish({
        collection: saved.collection,
        slug: saved.slug,
        title: saved.title,
        body: saved.body,
        frontmatter: saved.data,
      });
      setSaved({ ...saved, published: true });
      onPublish(jobId);
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Publishing failed to start');
    } finally {
      setBusy(false);
    }
  };

  const openPost = () => {
    onOpenEditor({
      kind: 'new',
      collection: kind,
      seedKey: `clip-${Date.now()}`,
      seed: {
        title: title.trim(),
        video,
        videoPoster: poster,
        cover: poster,
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Success
  // ---------------------------------------------------------------------------

  if (saved) {
    const address = publicPath(saved.collection, saved.slug);
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 st-rise">
        <div className="st-card st-card-pad text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
            <Check size={22} />
          </div>
          <h2 className="st-title text-2xl">{saved.published ? 'On its way to the site' : 'Saved'}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
            {saved.published
              ? 'The clip is being committed and pushed. The site rebuilds in a minute or two — watch Deployments.'
              : 'The clip is in your content folder and already shows on this machine. It reaches the public site when you publish.'}
          </p>
          <div className="st-well mx-auto mt-6 max-w-sm px-4 py-3 text-left">
            <p className="st-eyebrow">It lives at</p>
            <p className="mt-1 font-mono text-[0.8125rem] text-zinc-200">{address}</p>
            <p className="mt-1 text-[0.6875rem] text-zinc-500">
              {saved.collection === 'home'
                ? 'Home page › Frames that keep moving'
                : `${destinationFor(saved.collection)?.label ?? saved.collection} › ${saved.title}`}
            </p>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {!saved.published && (
              <button type="button" className="st-btn st-btn-primary" disabled={busy} onClick={publishSaved}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />} Publish to the site
              </button>
            )}
            <a className="st-btn" href={address} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Open on the site
            </a>
            <button type="button" className="st-btn" onClick={() => onOpenEntry(saved.collection, saved.slug)}>
              <PenLine size={14} /> Edit it
            </button>
            <button type="button" className="st-btn st-btn-ghost" onClick={reset}>
              Publish another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Wizard
  // ---------------------------------------------------------------------------

  const step = (n: number, label: string) => (
    <span className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700 font-mono text-[10px] text-zinc-400">
        {n}
      </span>
      {label}
    </span>
  );

  return (
    <div className="mx-auto grid max-w-[88rem] gap-8 px-6 py-8 xl:grid-cols-[minmax(0,1fr)_28rem]">
      <div className="min-w-0 space-y-2">
        <header className="mb-4">
          <p className="st-eyebrow flex items-center gap-1.5">
            <Film size={11} /> Reels &amp; video
          </p>
          <h1 className="st-title mt-2 text-[2rem] leading-tight">Publish a reel</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
            Add a clip, choose where it should appear, and see that place before anything is written.
          </p>
        </header>

        <div className="st-card st-card-pad">
          <Group title={step(1, 'Add the clip')}>
            <ClipField video={video} poster={poster} onVideo={setVideo} onPoster={setPoster} collection="home" notify={notify} />
          </Group>

          <Group title={step(2, 'Where should it go?')}>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {TARGETS.map(({ id, title: name, blurb, icon: Icon }) => {
                const active = target === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTarget(id)}
                    className={`rounded-lg border p-3.5 text-left transition ${
                      active
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                        : 'border-zinc-800 bg-[var(--bg-deep)] hover:border-zinc-600'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-[var(--accent)]' : 'text-zinc-500'} />
                    <p className="mt-2.5 text-[0.8125rem] font-medium text-zinc-100">{name}</p>
                    <p className="mt-1 text-[0.6875rem] leading-snug text-zinc-500">{blurb}</p>
                  </button>
                );
              })}
            </div>
          </Group>

          {target === 'reel' && (
            <>
              <Group title={step(3, 'Describe it')}>
                <Field label="Title" hint="Shown to screen readers and used for the address.">
                  <input className="st-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Dusk over the poplars" />
                </Field>
                <Field label="Caption" hint="The line under the clip.">
                  <input className="st-input" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Srinagar — six seconds" />
                </Field>
                <Field label="Longer note" hint="Optional. Used when there is no caption.">
                  <textarea className="st-textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Position in the strip" hint={`Lower numbers come first. ${reels.length} reel${reels.length === 1 ? '' : 's'} on the site now.`}>
                    <input
                      type="number"
                      min={0}
                      className="st-input"
                      value={effectiveOrder}
                      onChange={(e) => setOrder(Number.isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber)}
                    />
                  </Field>
                  <Field label="Show on the Home page" hint="Turn off to keep it saved but out of the strip.">
                    <Toggle checked={visible} onChange={setVisible} label={visible ? 'Visible' : 'Hidden'} />
                  </Field>
                </div>
              </Group>

              <Group
                title={step(4, 'Grade it')}
                description="Optional colour, grain and vignette — the same look controls a post has."
                collapsible
                defaultOpen={false}
              >
                <StyleStudio
                  value={customization}
                  onChange={setCustomization}
                  cover={poster}
                  onReplay={() => setReplay((n) => n + 1)}
                  collection="home"
                  notify={notify}
                  only={['effects']}
                />
              </Group>
            </>
          )}

          {target === 'attach' && (
            <Group title={step(3, 'Pick the entry')} description="The clip is added to its front matter; nothing else about it changes.">
              <div className="relative">
                <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="st-input !pl-8" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search entries…" />
              </div>
              <div className="st-well st-scroll max-h-72 overflow-y-auto">
                {candidates.length === 0 && <p className="p-4 text-center text-xs text-zinc-500">Nothing matches.</p>}
                {candidates.map((item) => {
                  const active = picked?.collection === item.collection && picked.slug === item.slug;
                  return (
                    <button
                      key={`${item.collection}/${item.slug}`}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPicked({ collection: item.collection, slug: item.slug })}
                      className={`flex w-full items-center gap-3 border-b border-zinc-800/70 px-3 py-2 text-left last:border-b-0 ${
                        active ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--well)]'
                      }`}
                    >
                      <span className="st-thumb">
                        {(item.coverImage || item.videoPoster) && <img src={item.coverImage || item.videoPoster} alt="" loading="lazy" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.8125rem] text-zinc-100">{item.title}</span>
                        <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                          {item.collection === 'home' ? 'home reel' : item.collection}
                          {item.hasVideo ? ' · has a clip' : ''}
                        </span>
                      </span>
                      <StandingBadge item={item} />
                      {active && <Check size={14} className="text-[var(--accent)]" />}
                    </button>
                  );
                })}
              </div>
              {pickedItem?.hasVideo && (
                <p className="st-hint !text-amber-400">“{pickedItem.title}” already has a clip. This replaces it.</p>
              )}
            </Group>
          )}

          {target === 'post' && (
            <Group title={step(3, 'Start the post')}>
              <Field label="What kind of post?">
                <Segmented
                  value={kind}
                  onChange={(value) => setKind(value as CollectionId)}
                  options={POST_KINDS.map((dest) => ({ id: dest.collection, label: dest.label.split(' ')[0], title: dest.label }))}
                />
              </Field>
              <p className="st-hint">{destinationFor(kind)?.blurb}</p>
              <Field label="Working title">
                <input className="st-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is the clip of?" />
              </Field>
            </Group>
          )}
        </div>

        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-2 border-t border-zinc-800 bg-[var(--bg)]/95 px-1 py-4 backdrop-blur">
          {target === 'post' ? (
            <button type="button" className="st-btn st-btn-primary" disabled={!canGo} onClick={openPost}>
              <ArrowRight size={14} /> Open the editor
            </button>
          ) : (
            <>
              <button type="button" className="st-btn st-btn-primary" disabled={!canGo || busy} onClick={() => setConfirm(true)}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />} Save &amp; publish
              </button>
              <button type="button" className="st-btn" disabled={!canGo || busy} onClick={() => void run(false)}>
                <Save size={14} /> Save only
              </button>
            </>
          )}
          <p className="ml-1 text-[0.6875rem] text-zinc-500">
            {!ready
              ? 'Add a clip to continue.'
              : target === 'attach' && !pickedItem
                ? 'Pick the entry to attach it to.'
                : target !== 'attach' && !title.trim()
                  ? 'Give it a title.'
                  : !poster && target !== 'post'
                    ? 'No poster yet — the strip shows an empty frame until the clip loads.'
                    : 'Save keeps it on this machine. Publish also pushes it to the site.'}
          </p>
        </div>
      </div>

      {/* ---- Where it will appear ------------------------------------------ */}
      <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
        <div className="st-card overflow-hidden">
          <div className="border-b border-zinc-800 px-4 py-3">
            <p className="st-eyebrow flex items-center gap-1.5">
              <Sparkles size={11} /> Where it will appear
            </p>
            <p className="mt-1.5 text-[0.8125rem] text-zinc-200">
              {target === 'reel' && (
                <>
                  Home page › <span className="text-[var(--accent)]">Frames that keep moving</span>
                </>
              )}
              {target === 'attach' && (pickedItem ? <>On the page of <span className="text-[var(--accent)]">{pickedItem.title}</span></> : 'Pick an entry to see where.')}
              {target === 'post' && (
                <>
                  A new <span className="text-[var(--accent)]">{destinationFor(kind)?.label.toLowerCase()}</span> on{' '}
                  {destinationFor(kind)?.listPath}
                </>
              )}
            </p>
            {target === 'reel' && (
              <p className="mt-1 font-mono text-[10px] text-zinc-500">
                /  ·  position {effectiveOrder}  ·  {visible ? 'visible' : 'hidden'}
              </p>
            )}
          </div>

          {target === 'reel' ? (
            <>
              <div className="h-[26rem]">
                <LivePreview form={reelForm} replay={replay} onReplay={() => setReplay((n) => n + 1)} canPage={false} defaultDevice="mobile" />
              </div>
              <div className="border-t border-zinc-800 p-4">
                <p className="st-eyebrow mb-2">The strip right now</p>
                <div className="flex flex-wrap gap-2">
                  {reels
                    .filter((item) => item.visible)
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((item) => (
                      <span key={item.slug} className="st-thumb !h-12 !w-[4.5rem]" title={item.title}>
                        {(item.videoPoster || item.coverImage) && <img src={item.videoPoster || item.coverImage} alt="" />}
                      </span>
                    ))}
                  <span
                    className="st-thumb !h-12 !w-[4.5rem] !border-dashed !border-[var(--accent)]"
                    title="This reel"
                  >
                    {poster && <img src={poster} alt="" />}
                  </span>
                </div>
                <p className="mt-2 text-[0.6875rem] leading-snug text-zinc-500">
                  {reels.length === 0
                    ? 'This will be the first reel — the strip appears on the Home page once it has one.'
                    : 'The first reel plays as the main plate; the rest join the strip beneath it — pick any to play.'}
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-3 p-5 text-[0.8125rem] leading-relaxed text-zinc-400">
              {video ? (
                <video src={video} poster={poster || undefined} className="w-full rounded border border-zinc-800 bg-black" muted loop playsInline controls />
              ) : (
                <div className="st-well flex h-40 items-center justify-center text-zinc-600">
                  <Film size={22} />
                </div>
              )}
              {target === 'attach' ? (
                <p>
                  The clip is stored in <span className="font-mono text-zinc-300">video</span> on the entry. Posts show it above the
                  story and in the list; open the entry afterwards to style or reorder it.
                </p>
              ) : (
                <p>
                  The editor opens a new entry with the clip, its poster and the poster as the cover, so the preview works at once.
                  Nothing is saved until you save there.
                </p>
              )}
            </div>
          )}
        </div>
      </aside>

      <ConfirmDialog
        open={confirm}
        title="Save and publish?"
        message="This writes the reel, commits it, and pushes to GitHub. The public site rebuilds in a minute or two."
        confirmLabel="Save & publish"
        onConfirm={() => void run(true)}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
