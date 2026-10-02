import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bold,
  Code,
  ExternalLink,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  Loader2,
  Quote,
  Rocket,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { getGearItems } from '../../lib/cms';
import { useMediaQuery } from '../../lib/useMediaQuery';
import {
  INK_SECTIONS,
  SECRET_ROOMS,
  SECRET_TRIGGERS,
  type InkSection,
  type PostCustomization,
  type SecretKind,
  type SecretRoomId,
  type SecretTrigger,
} from '../../types';
import { createDoc, deleteDoc, getDoc, setState, startPublish, updateDoc, uploadFile } from './api';
import { DestinationPanel } from './DestinationPanel';
import { ImageCropper } from './ImageCropper';
import { LivePreview } from './LivePreview';
import { ClipField, MediaField, type Notify } from './MediaField';
import {
  INK_SECTION_LABELS,
  MOTION_COLLECTIONS,
  PLACE_SUGGESTIONS,
  SECRET_KIND_HELP,
  SECRET_ROOM_LABELS,
  SECRET_TRIGGER_HELP,
  SECRET_TRIGGER_LABELS,
  STYLED_COLLECTIONS,
  categoryLabelFor,
  destinationFor,
  emptyForm,
  fingerprint,
  formFromDoc,
  isSnippetCollection,
  publicPath,
  serializeForm,
  slugify,
  visibilityLabel,
  type CollectionId,
  type FormState,
  type ListItem,
  type WorkflowState,
} from './model';
import { StyleStudio } from './StyleStudio';
import { ConfirmDialog, Field, Group, SavedTick, StandingBadge, TagInput, Toggle } from './ui';

export type EditorMode =
  | { kind: 'edit'; collection: CollectionId; slug: string }
  | { kind: 'new'; collection: CollectionId; seed?: Partial<FormState>; seedKey: string };

type TabId = 'content' | 'media' | 'style' | 'publish' | 'preview';

interface StoredDraft {
  form: FormState;
  savedAt: number;
}

const draftKey = (collection: string, id: string) => `adm_draft::${collection}::${id}`;

const readDraft = (key: string): StoredDraft | null => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as StoredDraft) : null;
  } catch {
    return null;
  }
};

const timeAgo = (ms: number): string => {
  const minutes = Math.round((Date.now() - ms) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
};

const NEXT_STATES: Record<WorkflowState, { to: WorkflowState; label: string; hint: string }[]> = {
  draft: [{ to: 'review', label: 'Move to review', hint: 'Mark it ready to be published.' }],
  review: [{ to: 'draft', label: 'Back to draft', hint: 'Needs more work.' }],
  published: [{ to: 'archived', label: 'Archive', hint: 'Take it out of circulation.' }],
  archived: [{ to: 'draft', label: 'Restore as draft', hint: 'Bring it back for editing.' }],
};

// ---------------------------------------------------------------------------
// Markdown box
// ---------------------------------------------------------------------------

function MarkdownBox({
  value,
  onChange,
  collection,
  notify,
  rows = 16,
}: {
  value: string;
  onChange: (value: string) => void;
  collection: string;
  notify: Notify;
  rows?: number;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const edit = (transform: (selected: string, before: string, after: string) => { text: string; select: [number, number] }) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const result = transform(value.slice(start, end), value.slice(0, start), value.slice(end));
    onChange(result.text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.select[0], result.select[1]);
    });
  };

  const wrap = (open: string, close = open, placeholder = 'text') =>
    edit((selected, before, after) => {
      const inner = selected || placeholder;
      return {
        text: `${before}${open}${inner}${close}${after}`,
        select: [before.length + open.length, before.length + open.length + inner.length],
      };
    });

  const prefixLines = (prefix: string) =>
    edit((selected, before, after) => {
      const lineStart = before.lastIndexOf('\n') + 1;
      const head = before.slice(0, lineStart);
      const lead = before.slice(lineStart);
      const block = (lead + selected || 'text')
        .split('\n')
        .map((line) => (line.startsWith(prefix) ? line : prefix + line))
        .join('\n');
      return { text: head + block + after, select: [head.length, head.length + block.length] };
    });

  const link = () =>
    edit((selected, before, after) => {
      const label = selected || 'link text';
      const text = `${before}[${label}](https://)${after}`;
      const urlStart = before.length + label.length + 3;
      return { text, select: [urlStart, urlStart + 8] };
    });

  const insertImage = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadFile(file, collection);
      edit((_selected, before, after) => {
        const insert = `\n\n![${file.name.replace(/\.[^.]+$/, '')}](${url})\n\n`;
        return { text: before + insert + after, select: [before.length + insert.length, before.length + insert.length] };
      });
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const tools = [
    { label: 'Heading', icon: Heading2, run: () => prefixLines('## ') },
    { label: 'Bold (Ctrl+B)', icon: Bold, run: () => wrap('**') },
    { label: 'Italic (Ctrl+I)', icon: Italic, run: () => wrap('*') },
    { label: 'Link', icon: Link2, run: link },
    { label: 'Quote', icon: Quote, run: () => prefixLines('> ') },
    { label: 'List', icon: List, run: () => prefixLines('- ') },
    { label: 'Code', icon: Code, run: () => wrap('`') },
  ];

  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 border-zinc-800 bg-zinc-950 px-1.5 py-1">
        {tools.map(({ label, icon: Icon, run }) => (
          <button key={label} type="button" title={label} aria-label={label} className="st-btn st-btn-ghost st-btn-icon !h-7 !min-h-7 !w-7" onClick={run}>
            <Icon size={13} />
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-zinc-800" />
        <button type="button" title="Insert image" aria-label="Insert image" className="st-btn st-btn-ghost st-btn-icon !h-7 !min-h-7 !w-7" disabled={uploading} onClick={() => picker.current?.click()}>
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
        </button>
        <input
          ref={picker}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void insertImage(file);
          }}
        />
        <span className="ml-auto pr-2 font-mono text-[10px] text-zinc-600">
          {words} words · ~{Math.max(1, Math.round(words / 220))} min
        </span>
      </div>
      <textarea
        ref={area}
        rows={rows}
        value={value}
        spellCheck
        className="st-textarea !rounded-t-none st-mono !text-[0.8125rem] !leading-relaxed"
        placeholder="Write in Markdown — headings, **bold**, [links](https://…), images and lists all work."
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
            event.preventDefault();
            wrap('**');
          } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'i') {
            event.preventDefault();
            wrap('*');
          }
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Photography gallery
// ---------------------------------------------------------------------------

function GalleryField({
  images,
  onChange,
  notify,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  notify: Notify;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const add = async (files: FileList) => {
    setBusy(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      try {
        urls.push((await uploadFile(file, 'photography')).url);
      } catch (error) {
        notify('error', `${file.name}: ${error instanceof Error ? error.message : 'upload failed'}`);
      }
    }
    setBusy(false);
    if (urls.length) onChange([...images, ...urls]);
  };

  return (
    <Field label="More frames" hint="Extra photographs shown under the story. Hover a frame to reorder or remove it.">
      <div className="grid grid-cols-4 gap-2">
        {images.map((url, index) => (
          <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-md border border-zinc-800">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-between bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                className="st-btn st-btn-icon st-btn-sm !h-6 !min-h-6 !w-6"
                disabled={index === 0}
                aria-label="Move earlier"
                onClick={() => {
                  const next = [...images];
                  [next[index - 1], next[index]] = [next[index], next[index - 1]];
                  onChange(next);
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="st-btn st-btn-danger st-btn-icon st-btn-sm !h-6 !min-h-6 !w-6"
                aria-label="Remove frame"
                onClick={() => onChange(images.filter((_, i) => i !== index))}
              >
                <X size={11} />
              </button>
              <button
                type="button"
                className="st-btn st-btn-icon st-btn-sm !h-6 !min-h-6 !w-6"
                disabled={index === images.length - 1}
                aria-label="Move later"
                onClick={() => {
                  const next = [...images];
                  [next[index + 1], next[index]] = [next[index], next[index + 1]];
                  onChange(next);
                }}
              >
                ›
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="st-dropzone flex aspect-square flex-col items-center justify-center gap-1 text-zinc-500"
          disabled={busy}
          onClick={() => picker.current?.click()}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={18} />}
          <span className="text-[10px]">{busy ? 'Uploading' : 'Add'}</span>
        </button>
        <input
          ref={picker}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files?.length) void add(event.target.files);
            event.target.value = '';
          }}
        />
      </div>
    </Field>
  );
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

export function EntryEditor({
  mode,
  item,
  notify,
  onExit,
  onChanged,
  onPublish,
}: {
  mode: EditorMode;
  /** The listing row for this entry, when it exists — carries the workflow state. */
  item?: ListItem;
  notify: Notify;
  onExit: () => void;
  /** Something on disk changed; refresh the listing. */
  onChanged: () => void;
  onPublish: (jobId: string) => void;
}) {
  const wide = useMediaQuery('(min-width: 1280px)');
  const [form, setForm] = useState<FormState | null>(null);
  const [baseline, setBaseline] = useState('');
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState<TabId>('content');
  const [replay, setReplay] = useState(0);
  const [recovered, setRecovered] = useState<StoredDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [confirm, setConfirm] = useState<'delete' | 'publish' | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowState | undefined>(item?.state);

  useEffect(() => setWorkflow(item?.state), [item?.state]);

  const seedId = mode.kind === 'new' ? `new:${mode.seedKey}` : mode.slug;
  const keys = useRef<string[]>([]);

  // ---- load -------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    setForm(null);
    setLoadError('');
    setRecovered(null);
    setTab('content');

    const stored = readDraft(draftKey(mode.collection, seedId));
    keys.current = [draftKey(mode.collection, seedId)];

    (async () => {
      try {
        if (mode.kind === 'edit') {
          const doc = await getDoc(mode.collection, mode.slug);
          if (cancelled) return;
          const loaded = formFromDoc(mode.collection, mode.slug, doc.data, doc.body);
          setForm(loaded);
          setBaseline(fingerprint(loaded));
          if (stored && fingerprint(stored.form) !== fingerprint(loaded)) setRecovered(stored);
        } else {
          const blank = emptyForm(mode.collection);
          const seeded: FormState = { ...blank, ...mode.seed, collection: mode.collection, isNew: true };
          if (!seeded.slugTouched) seeded.slug = slugify(seeded.title);
          setForm(seeded);
          setBaseline(fingerprint(blank));
          if (stored && fingerprint(stored.form) !== fingerprint(seeded)) setRecovered(stored);
        }
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Could not open this entry');
      }
    })();

    return () => {
      cancelled = true;
    };
    // The editor is keyed by the shell, so `mode` never changes under a mounted instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = !!form && fingerprint(form) !== baseline;

  // ---- local draft (one slot per entry, never shared) ---------------------
  useEffect(() => {
    if (!form || recovered) return;
    const key = keys.current[0];
    const timer = window.setTimeout(() => {
      try {
        if (dirty) window.localStorage.setItem(key, JSON.stringify({ form, savedAt: Date.now() } satisfies StoredDraft));
        else window.localStorage.removeItem(key);
      } catch {
        // Storage can be full or blocked; the draft is a convenience, not the save.
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [form, dirty, recovered]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // ---- editing helpers ----------------------------------------------------
  const patch = useCallback((next: Partial<FormState>) => setForm((current) => (current ? { ...current, ...next } : current)), []);

  const setTitle = (title: string) =>
    setForm((current) => {
      if (!current) return current;
      const next = { ...current, title };
      if (current.isNew && !current.slugTouched) next.slug = slugify(title);
      return next;
    });

  const changeCollection = (collection: CollectionId) =>
    setForm((current) => {
      if (!current || current.collection === collection) return current;
      const next = emptyForm(collection);
      const keepMotion = MOTION_COLLECTIONS.includes(collection);
      return {
        ...next,
        title: current.title,
        slug: current.slugTouched ? current.slug : slugify(current.title),
        slugTouched: current.slugTouched,
        date: current.date,
        cover: current.cover,
        video: keepMotion ? current.video : '',
        videoPoster: keepMotion ? current.videoPoster : '',
        excerpt: current.excerpt,
        body: current.body,
        customization: STYLED_COLLECTIONS.includes(collection) ? current.customization : {},
      };
    });

  const gearSuggestions = useMemo(() => {
    try {
      return getGearItems().filter((gear) => gear.visible !== false).map((gear) => gear.title);
    } catch {
      return [];
    }
  }, []);

  // ---- save / publish -----------------------------------------------------
  const problem = (current: FormState): string | null => {
    if (!(current.title.trim() || (current.collection === 'home' && current.label.trim()))) return 'Give it a title first.';
    if (!(current.slug || slugify(current.title || current.label))) return 'The address (slug) is empty.';
    return null;
  };

  const save = useCallback(async (): Promise<{ form: FormState; data: Record<string, any>; body: string } | null> => {
    if (!form) return null;
    const issue = problem(form);
    if (issue) {
      notify('error', issue);
      setTab('content');
      return null;
    }
    const toSave = { ...form, title: form.title || form.label };
    toSave.slug = toSave.slug || slugify(toSave.title);
    setSaving(true);
    try {
      const { data, body } = serializeForm(toSave);
      let finalSlug = toSave.slug;
      if (toSave.isNew) finalSlug = (await createDoc(toSave.collection, toSave.slug, data, body)).slug;
      else finalSlug = (await updateDoc(toSave.collection, toSave.originalSlug, toSave.slug, data, body)).slug;

      const saved: FormState = { ...toSave, isNew: false, originalSlug: finalSlug, slug: finalSlug, slugTouched: true };
      setForm(saved);
      setBaseline(fingerprint(saved));
      for (const key of keys.current) window.localStorage.removeItem(key);
      keys.current = [draftKey(saved.collection, saved.originalSlug)];
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2200);
      onChanged();
      if (toSave.isNew && finalSlug !== toSave.slug) notify('info', `Saved as “${finalSlug}” — that address was already taken.`);
      return { form: saved, data, body };
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Could not save');
      return null;
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, notify, onChanged]);

  const saveAndPublish = async () => {
    setConfirm(null);
    const result = await save();
    if (!result) return;
    try {
      const { jobId } = await startPublish({
        collection: result.form.collection,
        slug: result.form.slug,
        title: result.form.title || result.form.label,
        body: result.body,
        frontmatter: result.data,
      });
      onPublish(jobId);
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Publishing failed to start');
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  const changeWorkflow = async (to: WorkflowState) => {
    if (!form) return;
    try {
      await setState(form.collection, form.originalSlug, to);
      setWorkflow(to);
      onChanged();
      notify('success', `Moved to ${to}.`);
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Could not change the state');
    }
  };

  const remove = async () => {
    if (!form) return;
    setConfirm(null);
    try {
      await deleteDoc(form.collection, form.originalSlug);
      for (const key of keys.current) window.localStorage.removeItem(key);
      notify('success', `Deleted “${form.title}”.`);
      onChanged();
      onExit();
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Could not delete');
    }
  };

  const leave = () => {
    if (dirty && !window.confirm('You have unsaved changes. Leave without saving? (A recoverable copy is kept in this browser.)')) return;
    onExit();
  };

  // ---- render -------------------------------------------------------------
  if (loadError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="st-title text-xl">This entry could not be opened</p>
        <p className="max-w-md text-sm text-zinc-500">{loadError}</p>
        <button type="button" className="st-btn" onClick={onExit}>
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    );
  }
  if (!form) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  const dest = destinationFor(form.collection);
  const styled = STYLED_COLLECTIONS.includes(form.collection);
  const reel = form.collection === 'home' && form.category === 'reel';
  const secret = form.collection === 'secrets';
  const secretKind = (form.category || 'note') as SecretKind;
  // A secret has no cover, no clip and no style studio — only an optional image.
  const motion = MOTION_COLLECTIONS.includes(form.collection);
  const isConfig = isSnippetCollection(form.collection);
  const customization = form.customization;
  const setCustomization = (next: PostCustomization) => patch({ customization: next });

  const tabs: { id: TabId; label: string }[] = [
    { id: 'content', label: 'Content' },
    { id: 'media', label: secret ? 'Image' : 'Media' },
    ...(styled || reel ? [{ id: 'style' as TabId, label: reel ? 'Effects' : 'Style' }] : []),
    { id: 'publish', label: 'Where & publish' },
    ...(wide ? [] : [{ id: 'preview' as TabId, label: 'Preview' }]),
  ];
  const activeTab = tabs.some((entry) => entry.id === tab) ? tab : 'content';

  const titleLabel = secret
    ? secretKind === 'ink'
      ? 'The handwritten line'
      : secretKind === 'room'
        ? 'Room name'
        : secretKind === 'egg'
          ? 'What it reveals (heading)'
          : 'Note title'
    : form.collection === 'home'
      ? form.category === 'quote' || form.category === 'thought'
        ? 'The line itself'
        : 'Title (internal name)'
      : 'Title';

  const excerptLabel = secret
    ? secretKind === 'ink'
      ? 'Second line (small)'
      : secretKind === 'room'
        ? 'One-line intro'
        : secretKind === 'egg'
          ? 'Subtitle'
          : 'Signature line'
    : form.collection === 'portfolio'
      ? 'Short description'
      : ['journal', 'tech'].includes(form.collection)
        ? 'Excerpt'
        : form.collection === 'home' && (form.category === 'quote' || form.category === 'thought')
          ? 'Source / aside'
          : 'Description';

  const bodyLabel = secret
    ? secretKind === 'ink'
      ? 'Body (not used for ink)'
      : secretKind === 'room'
        ? 'Intro paragraph'
        : secretKind === 'egg'
          ? 'The copy it reveals'
          : 'The note'
    : form.collection === 'photography'
      ? 'Story'
      : isConfig
        ? 'Details (optional)'
        : 'Body';

  const coverLabel = form.collection === 'portfolio' ? 'Project image' : form.collection === 'photography' ? 'Cover photograph' : 'Cover image';
  const visibility = visibilityLabel(form.collection, form.category);

  const address = publicPath(form.collection, form.slug || '…');

  const livePreview = (
    <LivePreview form={form} replay={replay} onReplay={() => setReplay((n) => n + 1)} canPage={!!dest?.hasPage} />
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <header className="flex flex-none flex-wrap items-center gap-3 border-b border-zinc-800 px-5 py-3">
        <button type="button" className="st-btn st-btn-icon st-btn-ghost" onClick={leave} aria-label="Back to content">
          <ArrowLeft size={15} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="st-eyebrow">
            {dest?.label ?? form.collection}
            {(secret || form.collection === 'home') && form.category ? ` · ${categoryLabelFor(form.collection, form.category)}` : ''} ·{' '}
            {form.isNew ? 'new' : 'editing'}
          </p>
          <h1 className="st-title truncate text-lg">{form.title || form.label || 'Untitled'}</h1>
        </div>
        {workflow && !form.isNew && <StandingBadge item={{ state: workflow, visible: item?.visible ?? true }} />}
        {form.isNew && <span className="st-badge" data-tone="draft">New</span>}
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          {dirty ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> unsaved
            </>
          ) : (
            <SavedTick show={justSaved} />
          )}
        </span>
        {!form.isNew && dest?.hasPage && (
          <a className="st-btn st-btn-ghost" href={address} target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> View
          </a>
        )}
        <button type="button" className="st-btn" disabled={saving || !dirty} onClick={() => void save()} title="Ctrl/Cmd + S">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
        </button>
        <button type="button" className="st-btn st-btn-primary" disabled={saving} onClick={() => setConfirm('publish')}>
          <Rocket size={14} /> Save &amp; publish
        </button>
      </header>

      {recovered && (
        <div className="flex flex-none items-center gap-3 border-b border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-[0.8125rem] text-amber-200">
          <span className="min-w-0 flex-1">
            Unsaved edits from this entry were found in this browser ({timeAgo(recovered.savedAt)}).
          </span>
          <button
            type="button"
            className="st-btn st-btn-sm"
            onClick={() => {
              setForm(recovered.form);
              setRecovered(null);
            }}
          >
            Restore them
          </button>
          <button
            type="button"
            className="st-btn st-btn-sm st-btn-ghost"
            onClick={() => {
              for (const key of keys.current) window.localStorage.removeItem(key);
              setRecovered(null);
            }}
          >
            Discard
          </button>
        </div>
      )}

      <div className={`grid min-h-0 flex-1 ${wide ? 'grid-cols-[minmax(460px,0.82fr)_minmax(0,1.18fr)]' : 'grid-cols-1'}`}>
        <div className="flex min-h-0 flex-col border-r border-zinc-800">
          <div className="flex flex-none gap-1 overflow-x-auto border-b border-zinc-800 px-4" role="tablist">
            {tabs.map((entry) => (
              <button key={entry.id} type="button" role="tab" aria-selected={activeTab === entry.id} className="st-tab" onClick={() => setTab(entry.id)}>
                {entry.label}
              </button>
            ))}
          </div>

          {activeTab === 'preview' ? (
            <div className="min-h-0 flex-1">{livePreview}</div>
          ) : (
            <div className="st-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {activeTab === 'content' && (
                <div className="space-y-6">
                  <Field label={titleLabel} htmlFor="entry-title">
                    <input
                      id="entry-title"
                      className="st-input !h-12 !text-lg"
                      value={form.title}
                      placeholder="A title worth opening"
                      onChange={(event) => setTitle(event.target.value)}
                      autoFocus={form.isNew}
                    />
                  </Field>

                  <div className="grid grid-cols-[1fr_auto] gap-4">
                    <Field
                      label="Address (slug)"
                      hint={dest?.hasPage ? <>Public link: <span className="font-mono">{address}</span></> : 'Used as the file name.'}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          className="st-input st-mono"
                          value={form.slug}
                          spellCheck={false}
                          onChange={(event) => patch({ slug: slugify(event.target.value), slugTouched: true })}
                        />
                        {form.slugTouched && form.isNew && (
                          <button type="button" className="st-btn st-btn-sm st-btn-ghost" onClick={() => patch({ slug: slugify(form.title), slugTouched: false })}>
                            Auto
                          </button>
                        )}
                      </div>
                    </Field>
                    {(styled || secret) && (
                      <Field label="Date" hint={secret ? 'Optional.' : undefined}>
                        <input type="date" className="st-input" value={form.date} onChange={(event) => patch({ date: event.target.value })} />
                      </Field>
                    )}
                  </div>

                  <Field label={excerptLabel} hint={['journal', 'tech'].includes(form.collection) ? 'Shown on cards and in search results.' : undefined}>
                    <textarea className="st-textarea" rows={3} value={form.excerpt} onChange={(event) => patch({ excerpt: event.target.value })} />
                  </Field>

                  <CollectionFields form={form} patch={patch} gearSuggestions={gearSuggestions} />

                  {!(secret && secretKind === 'ink') && (
                    <Field label={bodyLabel}>
                      <MarkdownBox
                        value={form.body}
                        onChange={(body) => patch({ body })}
                        collection={form.collection}
                        notify={notify}
                        rows={isConfig ? 6 : 18}
                      />
                    </Field>
                  )}
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-6">
                  <MediaField
                    label={secret ? 'Image (optional)' : coverLabel}
                    value={form.cover}
                    onChange={(cover) => patch({ cover })}
                    collection={form.collection}
                    notify={notify}
                    hint={
                      reel
                        ? 'Optional — the poster below is used when this is empty.'
                        : secret
                          ? 'Shown with the note or the room, if the hidden layer has a place for it.'
                          : undefined
                    }
                  />

                  {styled && form.cover && !/\.(mp4|webm)(\?|$)/i.test(form.cover) && (
                    <Group title="Crop & frame" description="Choose the shape, what stays in frame, and where the photo sits.">
                      <ImageCropper
                        src={form.cover}
                        value={customization.image}
                        onChange={(image) => setCustomization({ ...customization, image })}
                        onBake={(cover) => patch({ cover })}
                        collection={form.collection}
                        notify={notify}
                      />
                    </Group>
                  )}

                  {form.collection === 'photography' && <GalleryField images={form.gallery} onChange={(gallery) => patch({ gallery })} notify={notify} />}

                  {motion && (
                    <Group
                      title="Reel / clip"
                      description={
                        form.collection === 'home'
                          ? 'A moving frame for the home page.'
                          : 'Optional. A short clip that plays inside the entry — muted, looping, only while visible.'
                      }
                    >
                      <ClipField
                        video={form.video}
                        poster={form.videoPoster}
                        onVideo={(video) => patch({ video })}
                        onPoster={(videoPoster) => patch({ videoPoster })}
                        collection={form.collection}
                        notify={notify}
                      />
                    </Group>
                  )}
                </div>
              )}

              {activeTab === 'style' && (
                <StyleStudio
                  value={customization}
                  onChange={setCustomization}
                  cover={form.cover || form.videoPoster}
                  onReplay={() => setReplay((n) => n + 1)}
                  collection={form.collection}
                  notify={notify}
                  only={reel ? ['effects'] : undefined}
                />
              )}

              {activeTab === 'publish' && (
                <div className="space-y-6">
                  <DestinationPanel
                    form={form}
                    onCollection={changeCollection}
                    onCategory={(category) => patch({ category })}
                  />

                  <Group title="Visibility">
                    {form.collection === 'journal' && (
                      <Toggle checked={form.published} onChange={(published) => patch({ published })} label="Show on site" hint="Off keeps the entry out of the Journal even after it is published." />
                    )}
                    {isConfig && (
                      <Toggle checked={form.visible} onChange={(visible) => patch({ visible })} label={visibility.label} hint={visibility.hint} />
                    )}
                    {form.collection === 'portfolio' && (
                      <Toggle checked={form.featured} onChange={(featured) => patch({ featured })} label="Featured" hint="Pinned to the top of the Portfolio." />
                    )}
                    {!isConfig && form.collection !== 'journal' && form.collection !== 'portfolio' && (
                      <p className="text-[0.75rem] text-zinc-500">This entry shows on the site as soon as it is published.</p>
                    )}
                    {secret && (
                      <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[0.75rem] leading-relaxed text-amber-200">
                        Hidden is not private. Whatever you publish here is bundled into the public site exactly like
                        the rest of <span className="font-mono">content/</span> — a visitor can read it in the browser’s
                        network panel without finding the door. Switching it off is the only way to keep it off the site.
                      </p>
                    )}
                  </Group>

                  {!form.isNew && workflow && (
                    <Group title="Workflow" description="A label for you — “has this been pushed to the live site?”">
                      <div className="flex flex-wrap items-center gap-2">
                        <StandingBadge item={{ state: workflow, visible: form.collection === 'journal' ? form.published : isConfig ? form.visible : true }} />
                        {NEXT_STATES[workflow].map((next) => (
                          <button key={next.to} type="button" className="st-btn st-btn-sm" title={next.hint} onClick={() => void changeWorkflow(next.to)}>
                            {next.label}
                          </button>
                        ))}
                      </div>
                      {item?.unsavedChanges && (
                        <p className="text-[0.75rem] text-amber-300">Saved here, but changed since it was last published — use “Save &amp; publish” to push it.</p>
                      )}
                    </Group>
                  )}

                  {!form.isNew && (
                    <Group title="Danger zone">
                      <button type="button" className="st-btn st-btn-danger" onClick={() => setConfirm('delete')}>
                        <Trash2 size={14} /> Delete this entry
                      </button>
                    </Group>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {wide && <div className="min-h-0 min-w-0">{livePreview}</div>}
      </div>

      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete this entry?"
        message={
          <>
            “{form.title}” and its file will be removed from the project. Uploaded images stay in the media library. This can’t be undone from here.
          </>
        }
        confirmLabel="Delete"
        danger
        onConfirm={() => void remove()}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'publish'}
        title="Publish to the live site?"
        message={
          <>
            This saves the entry, commits it and pushes it so GitHub Pages can deploy it
            {dest?.hasPage ? (
              <>
                {' '}at <span className="font-mono text-zinc-200">{address}</span>
              </>
            ) : (
              <>
                {' '}on the <span className="font-medium text-zinc-200">{dest?.listPath === '/' ? 'Home' : dest?.listPath.slice(1)}</span> page
              </>
            )}
            .
          </>
        }
        confirmLabel="Save & publish"
        onConfirm={() => void saveAndPublish()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fields that only some collections have
// ---------------------------------------------------------------------------

function NumberField({ label, value, onChange, hint }: { label: string; value: number; onChange: (n: number) => void; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <input type="number" className="st-input" value={value} onChange={(event) => onChange(parseInt(event.target.value, 10) || 0)} />
    </Field>
  );
}

function CollectionFields({
  form,
  patch,
  gearSuggestions,
}: {
  form: FormState;
  patch: (next: Partial<FormState>) => void;
  gearSuggestions: string[];
}) {
  switch (form.collection) {
    case 'journal':
      return (
        <div className="space-y-5">
          <Field label="Tags">
            <TagInput values={form.tags} onChange={(tags) => patch({ tags })} placeholder="Add a tag and press Enter" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Issue number" hint="Blank = numbered automatically.">
              <input className="st-input" inputMode="numeric" value={form.volume} onChange={(event) => patch({ volume: event.target.value.replace(/\D/g, '') })} />
            </Field>
            <Field label="Reading time" hint="Blank = worked out from the text.">
              <input className="st-input" value={form.readingTime} placeholder="5 min read" onChange={(event) => patch({ readingTime: event.target.value })} />
            </Field>
          </div>
        </div>
      );
    case 'portfolio':
      return (
        <div className="space-y-5">
          <Field label="Tech stack">
            <TagInput values={form.techStack} onChange={(techStack) => patch({ techStack })} placeholder="React, TypeScript, …" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="GitHub link">
              <input className="st-input st-mono" value={form.githubLink} placeholder="https://github.com/…" onChange={(event) => patch({ githubLink: event.target.value })} />
            </Field>
            <Field label="Live link">
              <input className="st-input st-mono" value={form.liveLink} placeholder="https://…" onChange={(event) => patch({ liveLink: event.target.value })} />
            </Field>
          </div>
        </div>
      );
    case 'photography':
      return (
        <div className="space-y-5">
          <Field label="Gear used" hint="Shown with the photograph. Pick from your gear list or type your own.">
            <TagInput values={form.gear} onChange={(gear) => patch({ gear })} placeholder="Camera, lens…" suggestions={gearSuggestions} />
          </Field>
          <Field label="Capture mode">
            <input className="st-input" value={form.captureMode} placeholder="Natural light · 35 mm f/1.8" onChange={(event) => patch({ captureMode: event.target.value })} />
          </Field>
        </div>
      );
    case 'gear':
      return (
        <div className="space-y-5">
          <Field label="Specs">
            <TagInput values={form.specs} onChange={(specs) => patch({ specs })} placeholder="24 MP, 6K video…" />
          </Field>
          <NumberField label="Order" value={form.order} onChange={(order) => patch({ order })} hint="Lower numbers come first." />
        </div>
      );
    case 'timeline':
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Year">
              <input className="st-input" value={form.year} placeholder="2024" onChange={(event) => patch({ year: event.target.value })} />
            </Field>
            <Field label="Place" hint="Where the chapter happened. Any text works.">
              <input
                className="st-input"
                list="timeline-places"
                value={form.place}
                placeholder="Sopore"
                onChange={(event) => patch({ place: event.target.value })}
              />
              <datalist id="timeline-places">
                {PLACE_SUGGESTIONS.map((place) => (
                  <option key={place} value={place} />
                ))}
              </datalist>
            </Field>
            <NumberField label="Order" value={form.order} onChange={(order) => patch({ order })} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="st-eyebrow mr-1">quick add</span>
            {PLACE_SUGGESTIONS.filter((place) => place !== form.place).map((place) => (
              <button
                key={place}
                type="button"
                className="st-chip cursor-pointer !bg-transparent transition-colors hover:!border-[var(--accent)] hover:!text-[var(--accent)]"
                onClick={() => patch({ place })}
              >
                {place}
              </button>
            ))}
          </div>
        </div>
      );
    case 'favorites':
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Icon">
              <input className="st-input" value={form.icon} placeholder="Terminal" onChange={(event) => patch({ icon: event.target.value })} />
            </Field>
            <Field label="Group">
              <input className="st-input" value={form.group} onChange={(event) => patch({ group: event.target.value })} />
            </Field>
          </div>
          <Field label="Link">
            <input className="st-input st-mono" value={form.link} placeholder="https://…" onChange={(event) => patch({ link: event.target.value })} />
          </Field>
          <NumberField label="Order" value={form.order} onChange={(order) => patch({ order })} />
        </div>
      );
    case 'secrets':
      return <SecretFields form={form} patch={patch} />;
    case 'home':
      return (
        <div className="space-y-5">
          <Field
            label={form.category === 'reel' ? 'Caption' : 'Label'}
            hint={
              form.category === 'reel'
                ? 'Shown under the reel on the Home page.'
                : form.category === 'gateway'
                  ? 'The small line above the door, e.g. “02 // Thinker”.'
                  : undefined
            }
          >
            <input className="st-input" value={form.label} onChange={(event) => patch({ label: event.target.value })} />
          </Field>
          {form.category === 'quote' && (
            <Field label="Attribution" hint="Optional. Left blank, the note stands on its own.">
              <input
                className="st-input"
                value={form.author}
                placeholder="— from The Missed Train"
                onChange={(event) => patch({ author: event.target.value })}
              />
            </Field>
          )}
          {form.category === 'thought' && (
            <p className="st-hint !mt-0">
              The title above is the thought itself and the description is an optional source — one is drawn at
              random for the thought drawer.
            </p>
          )}
          {form.category === 'gateway' && (
            <Field label="Opens which page" hint="The page this door leads to.">
              <select
                className="st-select"
                value={form.navTarget.replace(/^\/+/, '')}
                onChange={(event) => patch({ navTarget: event.target.value })}
              >
                {!NAV_TARGETS.includes(form.navTarget.replace(/^\/+/, '')) && (
                  <option value={form.navTarget.replace(/^\/+/, '')}>{form.navTarget || '—'}</option>
                )}
                {NAV_TARGETS.map((target) => (
                  <option key={target} value={target}>
                    /{target}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <NumberField label="Order" value={form.order} onChange={(order) => patch({ order })} hint="Lower numbers come first." />
        </div>
      );
    default:
      return null;
  }
}

/** The pages a home gateway can open. The site builds the link as `/${navTarget}`. */
const NAV_TARGETS = ['journal', 'photography', 'tech', 'portfolio'];

/**
 * The hidden layer's fields.
 *
 * A secret carries exactly one of room / trigger / section, decided by its
 * kind, so the other two are never shown — and `serializeForm` never writes
 * them, so a note cannot end up with a stale trigger nobody can explain.
 */
function SecretFields({ form, patch }: { form: FormState; patch: (next: Partial<FormState>) => void }) {
  const kind = (form.category || 'note') as SecretKind;
  return (
    <div className="space-y-5">
      <div className="st-well px-3 py-2.5">
        <p className="text-[0.75rem] leading-relaxed text-zinc-400">{SECRET_KIND_HELP[kind]}</p>
      </div>

      {(kind === 'room' || kind === 'note') && (
        <Field label="Which room" hint={kind === 'room' ? 'The room this entry configures.' : 'The room this note is filed in.'}>
          <select
            className="st-select"
            value={form.room || 'library'}
            onChange={(event) => patch({ room: event.target.value as SecretRoomId })}
          >
            {SECRET_ROOMS.map((room) => (
              <option key={room} value={room}>
                {SECRET_ROOM_LABELS[room]}
              </option>
            ))}
          </select>
        </Field>
      )}

      {kind === 'egg' && (
        <Field label="Which easter egg" hint={SECRET_TRIGGER_HELP[(form.trigger || 'seal') as SecretTrigger]}>
          <select
            className="st-select"
            value={form.trigger || 'seal'}
            onChange={(event) => patch({ trigger: event.target.value as SecretTrigger })}
          >
            {SECRET_TRIGGERS.map((trigger) => (
              <option key={trigger} value={trigger}>
                {SECRET_TRIGGER_LABELS[trigger]}
              </option>
            ))}
          </select>
        </Field>
      )}

      {kind === 'ink' && (
        <Field label="Which section of the home page" hint="The marginalia sits beside this section, readable only under the wand’s light.">
          <select
            className="st-select"
            value={form.section || 'hero'}
            onChange={(event) => patch({ section: event.target.value as InkSection })}
          >
            {INK_SECTIONS.map((section) => (
              <option key={section} value={section}>
                {INK_SECTION_LABELS[section]}
              </option>
            ))}
          </select>
        </Field>
      )}

      <NumberField label="Order" value={form.order} onChange={(order) => patch({ order })} hint="Lower numbers come first." />
    </div>
  );
}
