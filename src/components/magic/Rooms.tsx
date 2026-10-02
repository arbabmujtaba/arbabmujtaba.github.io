import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft } from 'lucide-react';
import Glyph from './Glyph';
import SafeImage from '../SafeImage';
import { useMagic, COLLECTIBLES } from '../../lib/magic';
import { getRoomConfig, getRoomNotes, isRoomEnabled } from '../../lib/secrets';
import { getArchiveThoughts } from '../../lib/thoughts';
import {
  getGearItems,
  getJournalEntries,
  getPhotographyEntries,
  getPortfolioProjects,
  getTechEntries,
  getTimelineMilestones,
} from '../../lib/cms';
import { navigate } from '../../lib/navigation';
import { ownerArchiveImage } from '../../lib/image';
import { distanceKm, PLACES } from '../../lib/places';
import type { SecretEntry, SecretRoomId } from '../../types';

const EASE = [0.16, 1, 0.3, 1] as const;

const DEFAULTS: Record<SecretRoomId, { title: string; description: string }> = {
  library: { title: 'The Restricted Section', description: 'The shelf behind the shelf.' },
  darkroom: { title: 'The Darkroom', description: 'Where frames are developed before they are kept.' },
  details: { title: 'The Room of Small Details', description: 'Everything you collected, and a few things the archive knows about itself.' },
};

/** Keep Tab inside the room while it is open. */
function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    node?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !node) return;
      const focusable = Array.from(
        node.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [ref, active]);
}

function NoteCard({ note, index }: { note: SecretEntry; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18, rotate: index % 2 ? 0.8 : -0.8 }}
      animate={{ opacity: 1, y: 0, rotate: index % 2 ? 0.4 : -0.4 }}
      transition={{ duration: 0.8, delay: 0.5 + index * 0.12, ease: EASE }}
      className="manuscript rounded-[2px] px-6 py-7 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.85)] md:px-8"
    >
      <h3 className="font-book text-2xl italic leading-tight text-zinc-50">{note.title}</h3>
      <div className="mt-4 space-y-3 font-book text-[1.08rem] leading-relaxed text-zinc-200">
        <ReactMarkdown>{note.body}</ReactMarkdown>
      </div>
      {note.description && <p className="mt-5 text-right font-book italic text-zinc-400">{note.description}</p>}
    </motion.article>
  );
}

function RoomShell({
  room,
  tone,
  children,
}: {
  room: SecretRoomId;
  tone: 'library' | 'darkroom' | 'details';
  children: ReactNode;
}) {
  const { closeRoom } = useMagic();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const config = getRoomConfig(room);
  const title = config?.title || DEFAULTS[room].title;
  const description = config?.description || DEFAULTS[room].description;
  useFocusTrap(ref, true);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && closeRoom();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [closeRoom]);

  const backdrop =
    tone === 'darkroom'
      ? 'radial-gradient(ellipse at 50% 0%, rgba(150, 20, 12, 0.55), rgba(20, 2, 2, 0.98) 60%)'
      : tone === 'library'
        ? 'radial-gradient(ellipse at 50% -10%, rgba(217, 180, 106, 0.22), rgba(10, 8, 5, 0.98) 62%)'
        : 'radial-gradient(ellipse at 50% 120%, rgba(217, 180, 106, 0.2), rgba(6, 6, 10, 0.98) 60%)';

  return (
    <motion.div
      data-surface="ink"
      className="fixed inset-0 z-[190] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45 } }}
    >
      {/* the doors — two leaves that swing away as the room opens */}
      {!reduced && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3] flex [perspective:1600px]">
          {[0, 1].map((side) => (
            <motion.div
              key={side}
              className="h-full w-1/2 border-zinc-700 bg-[#0d0b08]"
              style={{
                transformOrigin: side === 0 ? 'left center' : 'right center',
                borderRightWidth: side === 0 ? 1 : 0,
                borderLeftWidth: side === 1 ? 1 : 0,
                backgroundImage:
                  'repeating-linear-gradient(90deg, rgba(217,180,106,0.05) 0 2px, transparent 2px 46px)',
              }}
              initial={{ rotateY: 0 }}
              animate={{ rotateY: side === 0 ? -98 : 98, opacity: 0 }}
              transition={{ duration: 1.5, delay: 0.15, ease: [0.65, 0, 0.35, 1] }}
            />
          ))}
        </div>
      )}
      {/* the light that comes through */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ background: backdrop }}
        initial={{ opacity: reduced ? 1 : 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: EASE }}
      />

      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="custom-scrollbar relative z-[2] h-full overflow-y-auto focus:outline-none"
      >
        <div className="mx-auto max-w-5xl px-5 pb-24 pt-8 md:px-10 md:pt-12">
          <button
            type="button"
            onClick={closeRoom}
            className="group inline-flex min-h-[44px] items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:text-gilt"
          >
            <ArrowLeft size={14} className="transition-transform duration-300 group-hover:-translate-x-1" />
            return to the archive
          </button>

          <motion.header
            className="mt-12 text-center md:mt-16"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: reduced ? 0 : 0.7, ease: EASE }}
          >
            <Glyph name={tone === 'library' ? 'key' : tone === 'darkroom' ? 'lens' : 'door'} size={26} className="mx-auto text-gilt" />
            <h2 className="mt-5 font-book text-5xl italic leading-none tracking-[-0.01em] text-zinc-50 md:text-7xl">{title}</h2>
            <p className="mx-auto mt-5 max-w-md font-book text-lg italic text-zinc-300">{description}</p>
            {config?.body && (
              <p className="mx-auto mt-4 max-w-xl text-sm font-light leading-relaxed text-zinc-400">{config.body.trim()}</p>
            )}
            <div className="fleuron mx-auto mt-8 max-w-xs text-xs text-gilt" aria-hidden="true">✦</div>
          </motion.header>

          <div className="mt-14">{children}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function RestrictedSection() {
  const { collect } = useMagic();
  const notes = getRoomNotes('library');
  const torn = useMemo(() => {
    const journal = getArchiveThoughts().filter((t) => t.href);
    // A stable handful, not the whole drawer.
    return journal.filter((_, i) => i % 3 === 0).slice(0, 8);
  }, []);
  useEffect(() => collect('key'), [collect]);

  const goTo = (href: string) => {
    navigate(href);
  };

  return (
    <RoomShell room="library" tone="library">
      {notes.length > 0 && (
        <div className="mx-auto grid max-w-3xl gap-8">
          {notes.map((note, i) => (
            <NoteCard key={note.slug} note={note} index={i} />
          ))}
        </div>
      )}

      {torn.length > 0 && (
        <section className="mt-20">
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-400">lines torn from the volumes</p>
          <ul className="mt-8 grid gap-5 md:grid-cols-2">
            {torn.map((line, i) => (
              <motion.li
                key={line.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.9 + i * 0.07, ease: EASE }}
              >
                <button
                  type="button"
                  onClick={() => line.href && goTo(line.href)}
                  className="group block h-full w-full border-l border-gilt/40 py-1 pl-5 text-left transition-colors hover:border-gilt"
                >
                  <span className="block font-book text-xl italic leading-snug text-zinc-100">“{line.text}”</span>
                  <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 transition-colors group-hover:text-gilt">
                    {line.source} →
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>
        </section>
      )}
    </RoomShell>
  );
}

// ---------------------------------------------------------------------------

function Print({ entry, index, onDeveloped }: { entry: ReturnType<typeof getPhotographyEntries>[number]; index: number; onDeveloped: () => void }) {
  const [developed, setDeveloped] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const src = ownerArchiveImage(entry.coverImage);
  const develop = () => {
    if (developed) return;
    setDeveloped(true);
    onDeveloped();
  };
  if (!src) return null;
  const date = new Date(entry.date);
  const when = Number.isNaN(date.getTime()) ? entry.date : date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.8 + (index % 6) * 0.08, ease: EASE }}
      className="[perspective:1200px]"
    >
      <button
        type="button"
        onPointerEnter={develop}
        onFocus={develop}
        onClick={() => (developed ? setFlipped((f) => !f) : develop())}
        aria-label={`${entry.title}. ${developed ? 'Turn the print over' : 'Develop the print'}`}
        className="relative block aspect-[4/5] w-full text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gilt"
      >
        <motion.span
          className="absolute inset-0 block [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          {/* front: the print, developing out of white */}
          <span className="absolute inset-0 block overflow-hidden bg-[#f2ece0] p-2 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.9)] [backface-visibility:hidden]">
            <SafeImage
              src={src}
              alt={entry.title}
              className="h-full w-full object-cover"
              style={{
                filter: developed ? 'none' : 'grayscale(1) brightness(2.6) contrast(0.25)',
                opacity: developed ? 1 : 0.35,
                transition: 'filter 2.8s cubic-bezier(0.16,1,0.3,1), opacity 2.2s cubic-bezier(0.16,1,0.3,1)',
              }}
            />
          </span>
          {/* back: pencil on the reverse of the print */}
          <span className="manuscript absolute inset-0 flex flex-col justify-end p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="font-book text-2xl italic leading-tight text-zinc-50">{entry.title}</span>
            <span className="mt-2 font-book text-base text-zinc-300">{when}</span>
            {(entry.gear?.length || entry.captureMode) && (
              <span className="mt-1 font-book text-base italic text-zinc-400">
                {[entry.gear?.join(' / '), entry.captureMode].filter(Boolean).join(' · ')}
              </span>
            )}
            <span className="mt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">{entry.category}</span>
          </span>
        </motion.span>
      </button>
    </motion.li>
  );
}

function Darkroom() {
  const { collect } = useMagic();
  const notes = getRoomNotes('darkroom');
  const prints = useMemo(() => getPhotographyEntries().filter((p) => ownerArchiveImage(p.coverImage)), []);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (count > 0) collect('lens');
  }, [count, collect]);

  return (
    <RoomShell room="darkroom" tone="darkroom">
      {notes.length > 0 && (
        <div className="mx-auto mb-14 grid max-w-2xl gap-6">
          {notes.map((note, i) => (
            <NoteCard key={note.slug} note={note} index={i} />
          ))}
        </div>
      )}
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.24em] text-[#ff8a70]">
        {count === 0 ? 'hover or tap a print to develop it' : `${count} of ${prints.length} developed · tap a print to read its back`}
      </p>
      <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {prints.map((entry, i) => (
          <Print key={entry.slug} entry={entry} index={i} onDeveloped={() => setCount((c) => c + 1)} />
        ))}
      </ul>
    </RoomShell>
  );
}

// ---------------------------------------------------------------------------

function RoomOfDetails() {
  const { found } = useMagic();
  const notes = getRoomNotes('details');

  const facts = useMemo(() => {
    const journal = getJournalEntries();
    const photos = getPhotographyEntries();
    const projects = getPortfolioProjects();
    const logs = getTechEntries();
    const chapters = getTimelineMilestones().filter((m) => m.visible);
    const gear = getGearItems().filter((g) => g.visible);
    const songs = journal
      .map((entry) => entry.customization?.music)
      .filter((music): music is NonNullable<typeof music> => !!music?.songTitle)
      .map((music) => `${music.songTitle!.trim()}${music.songArtist ? ` — ${music.songArtist.trim()}` : ''}`);
    const cameras = Array.from(new Set(photos.flatMap((p) => p.gear || []).map((g) => g.trim()).filter(Boolean)));
    const oldest = [...journal].sort((a, b) => a.date.localeCompare(b.date))[0];
    const sopore = PLACES.find((p) => p.id === 'sopore')!;
    const indore = PLACES.find((p) => p.id === 'indore')!;
    const placeCount = (name: string) => chapters.filter((c) => c.place?.toLowerCase() === name).length;
    const languages = Array.from(
      new Set(projects.flatMap((p) => (p.techStack as (string | { tech: string })[]).map((t) => (typeof t === 'string' ? t : t.tech))))
    );

    const list: { label: string; value: string }[] = [
      {
        label: 'From Sopore to Indore',
        value: `About ${(Math.round(distanceKm(sopore, indore) / 100) * 100).toLocaleString("en-IN")} km as the crow flies — ${placeCount('sopore')} chapters in one city, ${placeCount('indore')} in the other.`,
      },
      {
        label: 'The archive, counted',
        value: `${photos.length} frames, ${journal.length} journal volumes, ${projects.length} projects, ${logs.length} logs.`,
      },
    ];
    if (oldest) {
      const d = new Date(oldest.date);
      list.push({
        label: 'The first volume',
        value: `“${oldest.title}”, dated ${Number.isNaN(d.getTime()) ? oldest.date : d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}.`,
      });
    }
    if (songs.length) list.push({ label: 'The journal was written to', value: songs.join(' · ') });
    if (cameras.length) list.push({ label: 'Photographs were taken on', value: cameras.join(' · ') });
    if (gear.length) list.push({ label: 'On the kit shelf', value: gear.map((g) => g.title).join(' · ') });
    if (languages.length) list.push({ label: 'Built with', value: languages.join(' · ') });
    return list;
  }, []);

  return (
    <RoomShell room="details" tone="details">
      <ul className="mx-auto flex max-w-xl flex-wrap justify-center gap-4">
        {COLLECTIBLES.map((item) => (
          <li key={item.id} title={item.name} className={found.includes(item.id) ? 'text-gilt' : 'text-zinc-700'}>
            <Glyph name={item.id} size={30} strokeWidth={1.2} title={item.name} />
          </li>
        ))}
      </ul>

      <dl className="mx-auto mt-14 max-w-3xl divide-y divide-zinc-800 border-y border-zinc-800">
        {facts.map((fact, i) => (
          <motion.div
            key={fact.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 + i * 0.08, ease: EASE }}
            className="grid gap-2 py-6 md:grid-cols-[14rem_1fr] md:gap-8"
          >
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-gilt">{fact.label}</dt>
            <dd className="font-book text-xl leading-snug text-zinc-100">{fact.value}</dd>
          </motion.div>
        ))}
      </dl>

      {notes.length > 0 && (
        <div className="mx-auto mt-16 grid max-w-3xl gap-8">
          {notes.map((note, i) => (
            <NoteCard key={note.slug} note={note} index={i} />
          ))}
        </div>
      )}
    </RoomShell>
  );
}

/** Mounted by MagicLayer once a room has been opened. */
export default function Rooms() {
  const { room, closeRoom } = useMagic();
  const open = room && isRoomEnabled(room) ? room : null;

  // A navigation from inside a room (a torn line's source) closes the room.
  useEffect(() => {
    if (!open) return;
    const onNav = () => closeRoom();
    window.addEventListener('app:navigate', onNav);
    window.addEventListener('popstate', onNav);
    return () => {
      window.removeEventListener('app:navigate', onNav);
      window.removeEventListener('popstate', onNav);
    };
  }, [open, closeRoom]);

  return (
    <AnimatePresence>
      {open === 'library' && <RestrictedSection key="library" />}
      {open === 'darkroom' && <Darkroom key="darkroom" />}
      {open === 'details' && <RoomOfDetails key="details" />}
    </AnimatePresence>
  );
}
