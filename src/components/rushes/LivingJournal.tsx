import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import SafeImage from '../SafeImage';
import { shouldInterceptClick } from '../../lib/navigation';
import { useOpenEntry } from '../../lib/entryNavigation';
import { ownerArchiveImage } from '../../lib/image';
import type { DetailCollection } from '../../lib/collections';
import type { JournalEntry, PhotographyEntry, TechEntry } from '../../types';

const EASE = [0.16, 1, 0.3, 1] as const;
const LAST_VISIT = 'archive.lastVisit';

interface DeskItem {
  collection: DetailCollection;
  slug: string;
  title: string;
  date: string;
  kind: string;
  line?: string;
  image?: string;
}

interface LivingJournalProps {
  journal: JournalEntry[];
  photography: PhotographyEntry[];
  tech: TechEntry[];
  className?: string;
  limit?: number;
  /** Set under the pile, in the desk's second column — the home page puts the shelf here. */
  children?: React.ReactNode;
}

function when(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * The visitor's previous visit, read once; this visit is written back on the
 * way out. Lets the desk say what is new since they were last here.
 */
function usePreviousVisit(): number | null {
  const [previous] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem(LAST_VISIT);
      return raw ? Number(raw) : null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(LAST_VISIT, String(Date.now()));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('pagehide', save);
    return () => {
      save();
      window.removeEventListener('pagehide', save);
    };
  }, []);
  return previous;
}

/**
 * LivingJournal — the desk. Whatever was added to the archive most recently,
 * from every collection that keeps dates, newest first. Nothing to curate: an
 * entry published from /admin lands here by itself. Entries newer than the
 * reader's last visit come in with a little ink still wet on them.
 */
export default function LivingJournal({ journal, photography, tech, className = '', limit = 6, children }: LivingJournalProps) {
  const reduced = useReducedMotion();
  const openEntry = useOpenEntry();
  const previous = usePreviousVisit();

  const items = useMemo<DeskItem[]>(() => {
    const all: DeskItem[] = [
      ...journal.map((j) => ({
        collection: 'journal' as const,
        slug: j.slug,
        title: j.title,
        date: j.date,
        kind: j.volume ? `journal · vol. ${String(j.volume).padStart(2, '0')}` : 'journal',
        line: j.excerpt,
        image: ownerArchiveImage(j.featuredImage),
      })),
      ...photography.map((p) => ({
        collection: 'photography' as const,
        slug: p.slug,
        title: p.title,
        date: p.date,
        kind: `frame · ${p.category.toLowerCase()}`,
        line: p.description,
        image: ownerArchiveImage(p.coverImage),
      })),
      ...tech.map((t) => ({
        collection: 'tech' as const,
        slug: t.slug,
        title: t.title,
        date: t.date,
        kind: `log · ${t.category.toLowerCase()}`,
        line: t.excerpt,
      })),
    ];
    const sorted = all
      .filter((item) => !Number.isNaN(new Date(item.date).getTime()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sorted.length === 0) return [];
    // The lead is the newest thing from any collection; the pile beside it is journal only.
    const [first] = sorted;
    const pile = sorted.filter((item) => item !== first && item.collection === 'journal').slice(0, limit - 1);
    return [first, ...pile];
  }, [journal, photography, tech, limit]);

  if (items.length === 0) return null;
  const isNew = (item: DeskItem) => previous !== null && new Date(item.date).getTime() > previous;
  const newCount = items.filter(isNew).length;
  const [lead, ...rest] = items;

  const link = (item: DeskItem, className: string, children: React.ReactNode) => (
    <a
      href={`/${item.collection}/${item.slug}`}
      onClick={(event) => {
        if (!shouldInterceptClick(event)) return;
        event.preventDefault();
        openEntry(item.collection, item.slug);
      }}
      className={className}
    >
      {children}
    </a>
  );

  const ink = (item: DeskItem, index: number) =>
    isNew(item) && !reduced
      ? {
          initial: { opacity: 0, filter: 'blur(10px)', clipPath: 'inset(0 100% 0 0)' },
          whileInView: { opacity: 1, filter: 'blur(0px)', clipPath: 'inset(0 0% 0 0)' },
          transition: { duration: 1.4, delay: 0.15 + index * 0.12, ease: EASE },
        }
      : {
          initial: reduced ? { opacity: 0 } : { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          transition: { duration: reduced ? 0.3 : 0.8, delay: reduced ? 0 : index * 0.07, ease: EASE },
        };

  return (
    <div className={className}>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        {previous === null
          ? 'your first visit — this is everything most recent'
          : newCount > 0
            ? `${newCount} new since you were last here`
            : 'nothing new since you were last here — the desk as you left it'}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
        {/* the newest thing, open on the desk */}
        <motion.div {...ink(lead, 0)} viewport={{ once: true, amount: 0.3 }}>
          {link(
            lead,
            'group block',
            <>
              {lead.image && (
                <span className="image-frame block aspect-[16/10] w-full overflow-hidden">
                  <SafeImage
                    src={lead.image}
                    alt=""
                    className="h-full w-full object-cover transition-[scale,opacity] duration-1000 ease-out group-hover:scale-[1.03]"
                  />
                </span>
              )}
              <span className="mt-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                <span className="text-accent">{lead.kind}</span>
                <span aria-hidden="true">·</span>
                <span>{when(lead.date)}</span>
                {isNew(lead) && <span className="rounded-full border border-gilt/60 px-2 py-0.5 text-gilt">new</span>}
              </span>
              <span className="mt-3 block font-display text-3xl font-medium leading-[1.05] tracking-[-0.04em] text-zinc-50 transition-colors group-hover:text-accent md:text-4xl">
                {lead.title}
              </span>
              {lead.line && <span className="mt-3 block max-w-lg font-book text-lg italic leading-snug text-zinc-400">{lead.line}</span>}
            </>
          )}
        </motion.div>

        {/* the rest of the pile, and whatever stands behind it */}
        <div className="min-w-0">
          <ol className="border-t border-zinc-800">
          {rest.map((item, i) => (
            <motion.li key={`${item.collection}/${item.slug}`} {...ink(item, i + 1)} viewport={{ once: true, amount: 0.5 }} className="border-b border-zinc-800">
              {link(
                item,
                'group grid min-h-[64px] grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 py-5',
                <>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    <span className="text-accent/90">{item.kind}</span>
                    {isNew(item) && <span className="ml-2 text-gilt">· new</span>}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.12em] text-zinc-500">{when(item.date)}</span>
                  <span className="col-span-2 flex items-center justify-between gap-4 font-display text-xl font-medium tracking-[-0.03em] text-zinc-100 transition-colors group-hover:text-accent">
                    {item.title}
                    <ArrowUpRight size={15} className="shrink-0 text-zinc-500 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                  </span>
                </>
              )}
            </motion.li>
          ))}
          </ol>
          {children}
        </div>
      </div>
    </div>
  );
}
