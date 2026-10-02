import { useMemo, useState } from 'react';
import {
  DoorOpen,
  EyeOff,
  FileWarning,
  Loader2,
  PenLine,
  Plus,
  Sparkles,
  TriangleAlert,
  Wand2,
} from 'lucide-react';
import { INK_SECTIONS, SECRET_ROOMS, SECRET_TRIGGERS } from '../../types';
import { getDoc, updateDoc } from './api';
import type { EditorMode } from './EntryEditor';
import type { Notify } from './MediaField';
import {
  INK_SECTION_LABELS,
  SECRET_KIND_HELP,
  SECRET_ROOM_LABELS,
  SECRET_TRIGGER_HELP,
  SECRET_TRIGGER_LABELS,
  type FormState,
  type ListItem,
} from './model';
import { Toggle } from './ui';

/**
 * The hidden layer, as one screen.
 *
 * Three rooms, six easter eggs, seven slots of invisible ink. Each switch is a
 * real write: the markdown file is read back, `visible` is changed and
 * everything else — every other key and the whole body — is written through
 * untouched, so flipping a room off can never lose the room's intro paragraph.
 */
export function SecretsPanel({
  items,
  loading,
  notify,
  onChanged,
  onEdit,
  onOpenEditor,
}: {
  items: ListItem[];
  loading: boolean;
  notify: Notify;
  onChanged: () => void;
  onEdit: (slug: string) => void;
  onOpenEditor: (mode: EditorMode) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const secrets = useMemo(() => items.filter((item) => item.collection === 'secrets'), [items]);
  const of = (kind: string) => secrets.filter((item) => (item.kind ?? item.category) === kind);

  const rooms = of('room');
  const notes = of('note');
  const eggs = of('egg');
  const inks = of('ink');

  /**
   * Flip `visible` on one secret.
   *
   * Reads the document first and writes the whole of it back, so the switch
   * cannot drop a field the admin does not model.
   */
  const setVisible = async (item: ListItem, visible: boolean) => {
    setBusy(item.slug);
    try {
      const doc = await getDoc('secrets', item.slug);
      await updateDoc('secrets', item.slug, item.slug, { ...doc.data, visible }, doc.body);
      notify('success', `“${item.title}” is ${visible ? 'on' : 'off'}.`);
      onChanged();
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Could not change the switch');
    } finally {
      setBusy(null);
    }
  };

  /** Open the editor on a brand-new secret of one kind, pre-filled. */
  const newSecret = (kind: 'note' | 'ink' | 'egg' | 'room', seed: Partial<FormState> = {}) =>
    onOpenEditor({
      kind: 'new',
      collection: 'secrets',
      seedKey: `secret-${kind}-${Date.now()}`,
      // `category` carries the kind through the form; serializeForm writes it as `kind`.
      seed: { category: kind, ...seed },
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-500">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6">
        <p className="st-eyebrow flex items-center gap-1.5">
          <Wand2 size={11} /> The hidden layer
        </p>
        <h1 className="st-title mt-2 text-[2rem] leading-tight">Secrets</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Three rooms, six easter eggs and the invisible ink in the margins of the home page. Switching one off here
          disables it on the site; the file stays where it is.
        </p>
      </header>

      <div className="mb-8 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <EyeOff size={15} className="mt-0.5 flex-none text-amber-400" />
        <p className="text-[0.8125rem] leading-relaxed text-amber-200">
          <strong className="font-medium">Hidden is not private.</strong> Everything published here ships inside the
          public site bundle, exactly like the rest of <span className="font-mono text-[0.75rem]">content/</span>. A
          visitor who never finds a single door can still read every word of it in the browser’s network panel. Do not
          put anything here you would not publish.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className="st-btn st-btn-primary" onClick={() => newSecret('note')}>
          <Plus size={14} /> New note
        </button>
        <button type="button" className="st-btn" onClick={() => newSecret('ink')}>
          <Plus size={14} /> New ink
        </button>
      </div>

      {/* ---- Rooms --------------------------------------------------------- */}
      <Block
        icon={<DoorOpen size={13} />}
        title="Secret rooms"
        blurb={SECRET_KIND_HELP.room}
        count={`${rooms.filter((room) => room.visible).length} of ${SECRET_ROOMS.length} open`}
      >
        {SECRET_ROOMS.map((room) => {
          const config = rooms.find((item) => item.room === room);
          const roomNotes = notes.filter((item) => item.room === room);
          const liveNotes = roomNotes.filter((item) => item.visible).length;
          return (
            <div key={room} className="st-row grid-cols-[minmax(0,1fr)_auto_auto] !items-start">
              <div className="min-w-0">
                <p className="truncate text-[0.875rem] text-zinc-100">{config?.title || SECRET_ROOM_LABELS[room]}</p>
                <p className="mt-0.5 text-[0.6875rem] leading-snug text-zinc-500">
                  {config?.excerpt || <span className="text-amber-400">No room entry yet — the door uses its built-in copy.</span>}
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-zinc-500">
                  <span>{room}</span>
                  <span aria-hidden>·</span>
                  <span>
                    {liveNotes} of {roomNotes.length} note{roomNotes.length === 1 ? '' : 's'} on the shelf
                  </span>
                </p>
                {roomNotes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {roomNotes.map((note) => (
                      <button
                        key={note.slug}
                        type="button"
                        className={`st-chip cursor-pointer transition-colors hover:!border-[var(--accent)] ${note.visible ? '' : '!text-zinc-600 line-through'}`}
                        title={note.visible ? 'On the shelf — click to edit' : 'Switched off — click to edit'}
                        onClick={() => onEdit(note.slug)}
                      >
                        {note.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {config && (
                  <button
                    type="button"
                    className="st-btn st-btn-sm st-btn-icon"
                    aria-label={`Edit ${config.title}`}
                    title="Edit the room"
                    onClick={() => onEdit(config.slug)}
                  >
                    <PenLine size={12} />
                  </button>
                )}
                <button type="button" className="st-btn st-btn-sm" title="Add a note to this room" onClick={() => newSecret('note', { room })}>
                  <Plus size={12} /> Note
                </button>
              </div>
              <Switch
                item={config}
                busy={busy}
                label="Door open"
                missing="No entry — the door is open by default."
                onChange={setVisible}
                onCreate={() => newSecret('room', { room, title: SECRET_ROOM_LABELS[room] })}
              />
            </div>
          );
        })}
      </Block>

      {/* ---- Easter eggs --------------------------------------------------- */}
      <Block
        icon={<Sparkles size={13} />}
        title="Easter eggs"
        blurb={SECRET_KIND_HELP.egg}
        count={`${SECRET_TRIGGERS.filter((trigger) => (eggs.find((item) => item.trigger === trigger)?.visible ?? true)).length} of ${SECRET_TRIGGERS.length} on`}
      >
        {SECRET_TRIGGERS.map((trigger) => {
          const egg = eggs.find((item) => item.trigger === trigger);
          return (
            <div key={trigger} className="st-row grid-cols-[minmax(0,1fr)_auto_auto] !items-start">
              <div className="min-w-0">
                <p className="truncate text-[0.875rem] text-zinc-100">{egg?.title || SECRET_TRIGGER_LABELS[trigger]}</p>
                <p className="mt-0.5 text-[0.6875rem] leading-snug text-zinc-400">
                  {egg?.excerpt || <span className="text-amber-400">No copy written — the egg falls back to its built-in line.</span>}
                </p>
                <p className="mt-1.5 text-[0.6875rem] leading-snug text-zinc-500">
                  <span className="font-mono text-[10px] text-zinc-600">{trigger}</span> — {SECRET_TRIGGER_HELP[trigger]}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {egg && (
                  <button
                    type="button"
                    className="st-btn st-btn-sm st-btn-icon"
                    aria-label={`Edit ${egg.title}`}
                    title="Edit the copy"
                    onClick={() => onEdit(egg.slug)}
                  >
                    <PenLine size={12} />
                  </button>
                )}
              </div>
              <Switch
                item={egg}
                busy={busy}
                label="Switched on"
                missing="No entry — the egg is on, with built-in copy."
                onChange={setVisible}
                onCreate={() => newSecret('egg', { trigger, title: SECRET_TRIGGER_LABELS[trigger] })}
              />
            </div>
          );
        })}
      </Block>

      {/* ---- Invisible ink ------------------------------------------------- */}
      <Block
        icon={<Wand2 size={13} />}
        title="Invisible ink"
        blurb={SECRET_KIND_HELP.ink}
        count={`${inks.filter((ink) => ink.visible).length} line${inks.filter((ink) => ink.visible).length === 1 ? '' : 's'} readable`}
      >
        {INK_SECTIONS.map((section) => {
          const lines = inks.filter((item) => item.section === section);
          return (
            <div key={section} className="st-row grid-cols-[10rem_minmax(0,1fr)_auto] !items-start">
              <div>
                <p className="text-[0.8125rem] text-zinc-200">{INK_SECTION_LABELS[section].split(' — ')[0]}</p>
                <p className="font-mono text-[10px] text-zinc-600">{section}</p>
              </div>
              <div className="min-w-0 space-y-2">
                {lines.length === 0 && <p className="text-[0.75rem] text-zinc-600">Nothing in the margin here.</p>}
                {lines.map((line) => (
                  <div key={line.slug} className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={`text-[0.8125rem] leading-snug ${line.visible ? 'text-zinc-200' : 'text-zinc-600 line-through'}`}>
                        {line.title}
                      </p>
                      {line.excerpt && <p className="mt-0.5 font-mono text-[10px] text-zinc-500">{line.excerpt}</p>}
                    </div>
                    <button
                      type="button"
                      className="st-btn st-btn-sm st-btn-icon flex-none"
                      aria-label={`Edit ${line.title}`}
                      onClick={() => onEdit(line.slug)}
                    >
                      <PenLine size={12} />
                    </button>
                    <div className="flex-none">
                      <Switch item={line} busy={busy} label="" missing="" onChange={setVisible} />
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="st-btn st-btn-sm" title={`Add a line to ${section}`} onClick={() => newSecret('ink', { section })}>
                <Plus size={12} /> Line
              </button>
            </div>
          );
        })}
      </Block>

      {secrets.some((item) => item.frontMatterError) && (
        <p className="mt-6 flex items-center gap-2 text-[0.75rem] text-amber-400">
          <FileWarning size={13} /> One or more secrets have front matter that will not parse — find them in Content.
        </p>
      )}
    </div>
  );
}

function Block({
  icon,
  title,
  blurb,
  count,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  blurb: string;
  count: string;
  children: React.ReactNode;
}) {
  return (
    <section className="st-card mb-6 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800 px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="st-title flex items-center gap-2 text-base">
            <span className="text-zinc-500">{icon}</span>
            {title}
          </h2>
          <p className="mt-1 max-w-xl text-[0.6875rem] leading-snug text-zinc-500">{blurb}</p>
        </div>
        <span className="st-chip !text-[10px]">{count}</span>
      </div>
      {children}
    </section>
  );
}

/**
 * The switch for one secret, or an invitation to write it when there is no file.
 * An absent entry means "on with built-in copy", so the switch reads on and
 * creating the entry is the way to be able to turn it off.
 */
function Switch({
  item,
  busy,
  label,
  missing,
  onChange,
  onCreate,
}: {
  item: ListItem | undefined;
  busy: string | null;
  label: string;
  missing: string;
  onChange: (item: ListItem, visible: boolean) => void;
  onCreate?: () => void;
}) {
  if (!item) {
    return (
      <div className="w-36 text-right">
        <p className="text-[0.625rem] leading-snug text-zinc-500">{missing}</p>
        {onCreate && (
          <button type="button" className="st-btn st-btn-sm st-btn-ghost mt-1" onClick={onCreate}>
            <Plus size={11} /> Write it
          </button>
        )}
      </div>
    );
  }
  if (busy === item.slug) {
    return (
      <span className="flex w-36 items-center justify-end text-zinc-500">
        <Loader2 size={14} className="animate-spin" />
      </span>
    );
  }
  return (
    <div className="w-36">
      {label ? (
        <Toggle checked={item.visible} onChange={(next) => onChange(item, next)} label={label} />
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            role="switch"
            aria-checked={item.visible}
            aria-label={`${item.title} readable under the light`}
            className="st-toggle"
            onClick={() => onChange(item, !item.visible)}
          />
        </div>
      )}
      {item.state !== 'published' && (
        <p className="mt-1 flex items-center gap-1 text-[0.625rem] text-amber-400">
          <TriangleAlert size={10} /> not published yet
        </p>
      )}
    </div>
  );
}
