import { useMemo, useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import InkNote from '../magic/InkNote';
import { useMagic } from '../../lib/magic';
import { distanceKm, formatLat, formatLon, PLACES } from '../../lib/places';
import { shouldInterceptClick } from '../../lib/navigation';
import { useOpenEntry } from '../../lib/entryNavigation';
import type { DetailCollection } from '../../lib/collections';
import type { JournalEntry, PhotographyEntry, TimelineMilestone } from '../../types';

const EASE = [0.16, 1, 0.3, 1] as const;

interface Memory {
  key: string;
  title: string;
  kind: string;
  collection: DetailCollection;
  slug: string;
}

/**
 * ChapterRoute — the timeline and the map in one line.
 *
 * The road from the first city to the last is a single hairline with both
 * ends labelled by their real coordinates and the distance between them. Each
 * chapter is a year on that line, grouped by the city it was lived in, and
 * picking one shows its title, its few lines, and what else in the archive
 * names that place. Choosing a chapter in both cities (or tracing the road)
 * still finds the compass, as the old map did.
 */
export default function ChapterRoute({
  chapters,
  photography,
  journal,
  className = '',
}: {
  chapters: TimelineMilestone[];
  photography: PhotographyEntry[];
  journal: JournalEntry[];
  className?: string;
}) {
  const reduced = useReducedMotion();
  const openEntry = useOpenEntry();
  const { collect } = useMagic();
  const [active, setActive] = useState(Math.max(0, chapters.length - 1));
  const [visited, setVisited] = useState<string[]>([]);

  // The two ends of the road: the first chapter's city and the last one's.
  const from = PLACES.find((p) => p.name.toLowerCase() === chapters[0]?.place?.toLowerCase()) ?? PLACES.find((p) => p.id === 'sopore')!;
  const to =
    PLACES.find((p) => p.name.toLowerCase() === chapters[chapters.length - 1]?.place?.toLowerCase()) ??
    PLACES.find((p) => p.id === 'indore')!;
  const km = Math.round(distanceKm(from, to) / 10) * 10;

  const chapter = chapters[active];
  const place = PLACES.find((p) => p.name.toLowerCase() === chapter?.place?.toLowerCase());

  const memories = useMemo<Memory[]>(() => {
    if (!place) return [];
    const names = (text: string) => place.keywords.some((k) => text.toLowerCase().includes(k));
    const found: Memory[] = [];
    photography.forEach((p) => {
      if (names(`${p.title} ${p.description} ${p.story}`)) found.push({ key: `p:${p.slug}`, title: p.title, kind: 'frame', collection: 'photography', slug: p.slug });
    });
    journal.forEach((j) => {
      if (names(`${j.title} ${j.excerpt} ${j.body}`))
        found.push({ key: `j:${j.slug}`, title: j.title, kind: `vol. ${String(j.volume ?? '').padStart(2, '0')}`, collection: 'journal', slug: j.slug });
    });
    return found.slice(0, 3);
  }, [place, photography, journal]);

  const choose = (index: number) => {
    setActive(index);
    const city = chapters[index]?.place?.toLowerCase();
    if (!city) return;
    setVisited((current) => {
      if (current.includes(city)) return current;
      const next = [...current, city];
      if (next.includes(from.name.toLowerCase()) && next.includes(to.name.toLowerCase()) && from.id !== to.id) collect('compass');
      return next;
    });
  };

  if (!chapter) return null;

  return (
    <div className={`relative ${className}`}>
      <InkNote section="timeline" className="absolute -top-10 right-0 text-right" />

      {/* the two ends of the road */}
      <div className="flex items-end justify-between gap-6 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        <span>
          <span className="block text-zinc-200">{from.name}</span>
          {formatLat(from.lat)} {formatLon(from.lon)}
        </span>
        <span className="hidden text-zinc-600 sm:block">{km.toLocaleString('en-IN')} km</span>
        <span className="text-right">
          <span className="block text-zinc-200">{to.name}</span>
          {formatLat(to.lat)} {formatLon(to.lon)}
        </span>
      </div>

      {/* the road, with a year for every chapter */}
      <div className="relative mt-6">
        <m.div
          aria-hidden="true"
          className="absolute inset-x-0 top-[7px] h-px origin-left bg-zinc-700"
          initial={{ scaleX: reduced ? 1 : 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: reduced ? 0 : 1.8, ease: [0.65, 0, 0.35, 1] }}
        />
        <ol className="relative flex justify-between" aria-label="Chapters">
          {chapters.map((c, index) => {
            const on = index === active;
            return (
              <li key={c.slug} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => choose(index)}
                  aria-pressed={on}
                  aria-label={`${c.year} — ${c.title}`}
                  className="group flex min-h-[44px] min-w-[32px] flex-col items-center gap-3 focus-visible:outline-none"
                >
                  <span
                    className={`block h-[15px] w-[15px] rounded-full border transition-all duration-500 ${
                      on
                        ? 'border-accent bg-accent shadow-[0_0_18px_color-mix(in_srgb,var(--accent)_60%,transparent)]'
                        : 'border-zinc-600 bg-canvas group-hover:border-accent-ink group-focus-visible:border-accent-ink'
                    }`}
                  />
                  <span
                    className={`font-mono text-[10px] tracking-[0.12em] transition-colors md:text-[11px] ${
                      on ? 'text-accent-ink' : 'text-zinc-500 group-hover:text-zinc-200'
                    }`}
                  >
                    <span className="md:hidden">’{c.year.slice(-2)}</span>
                    <span className="hidden md:inline">{c.year}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* the chosen chapter */}
      <div className="mt-10 grid min-h-[11rem] gap-8 border-t border-zinc-800 pt-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:gap-14">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={chapter.slug}
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -8 }}
            transition={{ duration: 0.45, ease: EASE }}
            aria-live="polite"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              {chapter.year}
              {chapter.place && <span> · {chapter.place}</span>}
            </p>
            <h3 className="mt-3 font-book text-3xl leading-tight tracking-[-0.02em] text-zinc-50 md:text-4xl">{chapter.title}</h3>
            <p className="mt-3 max-w-xl text-sm font-light leading-relaxed text-zinc-400 md:text-base">{chapter.description}</p>
          </m.div>
        </AnimatePresence>

        {memories.length > 0 && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">also from {place?.name}</p>
            <ul className="mt-3 border-t border-zinc-800">
              {memories.map((memory) => (
                <li key={memory.key} className="border-b border-zinc-800">
                  <a
                    href={`/${memory.collection}/${memory.slug}`}
                    onClick={(event) => {
                      if (!shouldInterceptClick(event)) return;
                      event.preventDefault();
                      openEntry(memory.collection, memory.slug);
                    }}
                    className="group flex min-h-[44px] items-center justify-between gap-4 py-2 text-sm text-zinc-300 transition-colors hover:text-accent-ink"
                  >
                    <span className="truncate">{memory.title}</span>
                    <span className="flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      {memory.kind}
                      <ArrowUpRight size={13} strokeWidth={1.6} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
