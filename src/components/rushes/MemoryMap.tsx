import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { useMagic } from '../../lib/magic';
import { distanceKm, formatLat, formatLon, PLACES, type Place } from '../../lib/places';
import { shouldInterceptClick } from '../../lib/navigation';
import { useOpenEntry } from '../../lib/entryNavigation';
import type { DetailCollection } from '../../lib/collections';
import type { HomeConfigEntry, JournalEntry, PhotographyEntry, TimelineMilestone } from '../../types';

const EASE = [0.16, 1, 0.3, 1] as const;

interface Memory {
  key: string;
  title: string;
  kind: string;
  collection?: DetailCollection;
  slug?: string;
}

interface MemoryMapProps {
  chapters: TimelineMilestone[];
  photography: PhotographyEntry[];
  journal: JournalEntry[];
  reels: HomeConfigEntry[];
  className?: string;
}

/*
 * Layout. The map is drawn, not projected: two insets — the valley, where five
 * places sit a few dozen kilometres apart, and Malwa — joined by the long
 * road south. Inside each inset the positions are the real coordinates scaled
 * to fit, so the valley is laid out the way it actually is.
 */
const VALLEY = { x: 70, y: 60, w: 380, h: 250, lat: [33.92, 34.46], lon: [74.25, 75.45] };
const MALWA = { x: 590, y: 380, w: 330, h: 200, lat: [22.55, 22.9], lon: [75.6, 76.1] };

function position(place: Place) {
  const box = place.region === 'valley' ? VALLEY : MALWA;
  const fx = (place.lon - box.lon[0]) / (box.lon[1] - box.lon[0]);
  const fy = (box.lat[1] - place.lat) / (box.lat[1] - box.lat[0]);
  return { x: box.x + fx * box.w, y: box.y + fy * box.h };
}

/** Label placement where the default (up and to the right) would collide. */
const LABEL: Record<string, { dx: number; dy: number; anchor: 'start' | 'end' }> = {
  sopore: { dx: -18, dy: 36, anchor: 'end' },
};

const mentions = (text: string, place: Place) => place.keywords.some((k) => text.toLowerCase().includes(k));

/**
 * MemoryMap — the journey as a hand-drawn chart. Each place opens what the
 * archive holds about it: the chapters lived there and the frames, volumes
 * and reels that name it. Places the archive says nothing about are not drawn.
 */
export default function MemoryMap({ chapters, photography, journal, reels, className = '' }: MemoryMapProps) {
  const reduced = useReducedMotion();
  const openEntry = useOpenEntry();
  const { collect } = useMagic();
  const [selected, setSelected] = useState<string>('sopore');
  const [visited, setVisited] = useState<string[]>(['sopore']);
  const [tracing, setTracing] = useState(0);

  const places = useMemo(() => {
    return PLACES.map((place) => {
      const memories: Memory[] = [];
      photography.forEach((p) => {
        if (mentions(`${p.title} ${p.description} ${p.story}`, place))
          memories.push({ key: `p:${p.slug}`, title: p.title, kind: 'frame', collection: 'photography', slug: p.slug });
      });
      journal.forEach((j) => {
        if (mentions(`${j.title} ${j.excerpt} ${j.body}`, place))
          memories.push({ key: `j:${j.slug}`, title: j.title, kind: `vol. ${String(j.volume ?? '').padStart(2, '0')}`, collection: 'journal', slug: j.slug });
      });
      reels.forEach((r) => {
        if (mentions(`${r.title} ${r.label} ${r.description}`, place)) memories.push({ key: `r:${r.slug}`, title: r.title, kind: 'reel' });
      });
      const lived = chapters.filter((c) => c.visible && c.place && c.place.toLowerCase() === place.name.toLowerCase());
      return { place, memories, lived, ...position(place) };
    }).filter((p) => p.place.kind === 'home' || p.memories.length > 0);
  }, [chapters, photography, journal, reels]);

  const sopore = places.find((p) => p.place.id === 'sopore');
  const indore = places.find((p) => p.place.id === 'indore');
  const km = sopore && indore ? Math.round(distanceKm(sopore.place, indore.place) / 100) * 100 : 0;
  const road =
    sopore && indore
      ? `M ${sopore.x} ${sopore.y} C ${sopore.x + 40} ${sopore.y + 220}, ${indore.x - 300} ${indore.y - 120}, ${indore.x} ${indore.y}`
      : '';
  const active = places.find((p) => p.place.id === selected) ?? places[0];

  const choose = (id: string) => {
    setSelected(id);
    setVisited((current) => {
      const next = current.includes(id) ? current : [...current, id];
      if (next.includes('sopore') && next.includes('indore')) collect('compass');
      return next;
    });
  };

  const years = (lived: TimelineMilestone[]) => {
    if (!lived.length) return '';
    const ys = lived.map((c) => Number(c.year)).filter(Boolean).sort();
    return ys.length > 1 ? `${ys[0]}–${ys[ys.length - 1]}` : String(ys[0]);
  };

  return (
    <div id="memory-map" className={`grid scroll-mt-24 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12 ${className}`}>
      <div className="manuscript relative overflow-hidden rounded-[3px] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7)]">
        <svg viewBox="0 0 1000 640" className="block h-auto w-full" role="group" aria-label="A map of the journey from Sopore to Indore">
          {/* graticule */}
          {[120, 240, 360, 480].map((y) => (
            <line key={y} x1="0" x2="1000" y1={y} y2={y} stroke="var(--rule)" strokeWidth="1" />
          ))}
          {[200, 400, 600, 800].map((x) => (
            <line key={x} x1={x} x2={x} y1="0" y2="640" stroke="var(--rule)" strokeWidth="1" />
          ))}
          <text x="16" y="34" fontSize="13" fontFamily="Fragment Mono, monospace" fill="var(--ink-5)">34° N</text>
          <text x="16" y="620" fontSize="13" fontFamily="Fragment Mono, monospace" fill="var(--ink-5)">22° N</text>

          {/* insets */}
          <rect x={VALLEY.x - 30} y={VALLEY.y - 30} width={VALLEY.w + 60} height={VALLEY.h + 60} rx="4" fill="none" stroke="var(--rule-strong)" strokeDasharray="1 5" />
          <text x={VALLEY.x - 22} y={VALLEY.y + VALLEY.h + 22} fontSize="20" fontStyle="italic" fontFamily="EB Garamond, serif" fill="var(--ink-4)">the valley</text>
          <rect x={MALWA.x - 30} y={MALWA.y - 30} width={MALWA.w + 60} height={MALWA.h + 60} rx="4" fill="none" stroke="var(--rule-strong)" strokeDasharray="1 5" />
          <text x={MALWA.x - 22} y={MALWA.y - 40} fontSize="20" fontStyle="italic" fontFamily="EB Garamond, serif" fill="var(--ink-4)">malwa</text>

          {/* the road south */}
          {road && (
            <>
              <path d={road} fill="none" stroke="var(--rule-strong)" strokeWidth="1.4" strokeDasharray="3 9" strokeLinecap="round" />
              <motion.path
                key={tracing}
                d={road}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: tracing ? 0 : reduced ? 1 : 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: reduced ? 0 : tracing ? 3.2 : 2.4, ease: [0.65, 0, 0.35, 1] }}
                onAnimationComplete={() => tracing && collect('compass')}
              />
              <text fontSize="18" fontStyle="italic" fontFamily="EB Garamond, serif" fill="var(--ink-3)">
                <textPath href="#road-label" startOffset="38%">
                  about {km.toLocaleString('en-IN')} km
                </textPath>
              </text>
              <path id="road-label" d={road} fill="none" transform="translate(14 -10)" />
            </>
          )}

          {/* compass rose */}
          <g transform="translate(905 92)" stroke="var(--ink-4)" fill="none" strokeWidth="1">
            <circle r="34" />
            <path d="M0 -44 L7 0 L0 44 L-7 0 Z" fill="var(--ink-5)" fillOpacity="0.25" />
            <text y="-52" textAnchor="middle" fontSize="13" fontFamily="EB Garamond, serif" fill="var(--ink-3)" stroke="none">N</text>
          </g>

          {/* places */}
          {places.map(({ place, x, y }) => {
            const isActive = place.id === active?.place.id;
            const home = place.kind === 'home';
            return (
              <g
                key={place.id}
                role="button"
                tabIndex={0}
                aria-label={`${place.name}${isActive ? ', selected' : ''}`}
                aria-pressed={isActive}
                onClick={() => choose(place.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    choose(place.id);
                  }
                }}
                className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-[var(--accent)]"
              >
                <circle cx={x} cy={y} r={home ? 22 : 16} fill="transparent" stroke={isActive ? 'var(--accent)' : 'transparent'} strokeWidth="1" />
                <circle cx={x} cy={y} r={home ? 7 : 4.5} fill={isActive || home ? 'var(--accent)' : 'var(--ink-3)'} />
                {home && <circle cx={x} cy={y} r="12" fill="none" stroke="var(--accent)" strokeOpacity="0.45" />}
                <text
                  x={x + (LABEL[place.id]?.dx ?? (home ? 18 : 12))}
                  y={y + (LABEL[place.id]?.dy ?? -(home ? 12 : 9))}
                  textAnchor={LABEL[place.id]?.anchor ?? 'start'}
                  fontSize={home ? 30 : 19}
                  fontStyle="italic"
                  fontFamily="EB Garamond, serif"
                  fill={isActive ? 'var(--ink-0)' : 'var(--ink-2)'}
                >
                  {place.name}
                </text>
              </g>
            );
          })}
        </svg>

        <button
          type="button"
          onClick={() => setTracing((t) => t + 1)}
          className="absolute bottom-4 left-4 min-h-[40px] rounded-full border border-[var(--rule-strong)] px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:border-accent hover:text-accent"
        >
          trace the journey
        </button>
      </div>

      {/* the card for the selected place */}
      <div aria-live="polite">
        <AnimatePresence mode="wait">
          {active && (
            <motion.div
              key={active.place.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                {formatLat(active.place.lat)} · {formatLon(active.place.lon)}
              </p>
              <h3 className="mt-3 font-book text-5xl italic leading-none text-zinc-50">{active.place.name}</h3>
              {active.lived.length > 0 && (
                <p className="mt-4 text-sm font-light leading-relaxed text-zinc-300">
                  {active.lived.length} chapter{active.lived.length > 1 ? 's' : ''} lived here, {years(active.lived)}:{' '}
                  <span className="font-book text-base italic text-zinc-100">{active.lived.map((c) => c.title).join(', ')}.</span>
                </p>
              )}
              {active.memories.length > 0 ? (
                <ul className="mt-6 border-t border-zinc-800">
                  {active.memories.map((memory) => (
                    <li key={memory.key} className="border-b border-zinc-800">
                      {memory.collection && memory.slug ? (
                        <a
                          href={`/${memory.collection}/${memory.slug}`}
                          onClick={(event) => {
                            if (!shouldInterceptClick(event)) return;
                            event.preventDefault();
                            openEntry(memory.collection!, memory.slug!);
                          }}
                          className="group flex min-h-[48px] items-center justify-between gap-4 py-3"
                        >
                          <span className="font-display text-lg tracking-[-0.02em] text-zinc-100 transition-colors group-hover:text-accent">{memory.title}</span>
                          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                            {memory.kind}
                            <ArrowUpRight size={12} />
                          </span>
                        </a>
                      ) : (
                        <div className="flex min-h-[48px] items-center justify-between gap-4 py-3">
                          <span className="font-display text-lg tracking-[-0.02em] text-zinc-100">{memory.title}</span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{memory.kind}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-6 font-book text-lg italic text-zinc-400">Nothing filed under this name yet.</p>
              )}
              <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                {places.length} places on file · choose one on the map
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
