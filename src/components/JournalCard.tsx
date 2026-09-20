import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Disc3 } from 'lucide-react';
import SafeImage from './SafeImage';
import { TagChip } from './rushes';
import { detailPath } from '../lib/collections';
import { shouldInterceptClick } from '../lib/navigation';
import { JournalEntry } from '../types';

/**
 * Default cover used when an entry has no uploaded image.
 * Lives in /public/assets so it resolves at a stable URL in dev and on
 * GitHub Pages, and contains no embedded text/logos (typography is always
 * rendered by the site on top of it).
 */
export const DEFAULT_JOURNAL_COVER = '/assets/journal-placeholder.svg';

type JournalCardVariant = 'featured' | 'archive';

interface JournalCardProps {
  entry: JournalEntry;
  variant: JournalCardVariant;
  onOpen: (entry: JournalEntry) => void;
  /** Stagger index for the archive grid entrance animation. */
  index?: number;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/** Volume as the zero-padded plate number: 2 -> "02". */
function volumeNumber(volume?: number): string {
  const n = !volume || volume < 1 ? 1 : volume;
  return String(n).padStart(2, '0');
}

function formatDate(date: string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * JournalCard — the single, reusable card used for EVERY journal entry.
 *
 * Both variants share one anatomy: a framed photographic plate, the volume
 * number set large in the accent as the numbered prefix, a lowercase display
 * title, the excerpt, and the metadata line. The `featured` variant is the
 * two-column hero (newest entry) and carries the "on rotation" record when the
 * entry has one; `archive` is the plate-over-caption card used in the grid.
 *
 * Caption sits *beside* or *beneath* the plate rather than on top of it. That is
 * the difference that makes the card work on the bone surface: no text is ever
 * laid over a photograph, so nothing depends on a dark scrim for legibility and
 * the same component reads correctly on either surface.
 */
export default function JournalCard({ entry, variant, onOpen, index = 0 }: JournalCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const isFeatured = variant === 'featured';

  const cover = entry.featuredImage || entry.coverImage || DEFAULT_JOURNAL_COVER;
  const date = formatDate(entry.date);
  const music = entry.customization?.music;
  const hasMusic = !!(music && (music.songTitle || music.songArtist));
  const tags = (entry.tags || []).filter(Boolean).slice(0, isFeatured ? 3 : 2);

  const plate = (
    <div className="image-frame aspect-[4/3] w-full sm:aspect-[16/10]">
      <SafeImage
        src={cover}
        alt={entry.title}
        loading={isFeatured ? 'eager' : 'lazy'}
        className="h-full w-full object-cover grayscale-[12%] transition-[transform,filter] duration-700 ease-out group-hover:scale-[1.03] group-hover:grayscale-0"
        fallback={<div className="hairline-grid h-full w-full bg-well" aria-hidden="true" />}
      />
    </div>
  );

  /* Volume number as the numbered prefix. Display size keeps the accent well
     clear of the small-text contrast floor on the paper surface. */
  const prefix = (
    <span
      className={`shrink-0 font-display font-medium leading-none tracking-[-0.045em] text-accent ${
        isFeatured ? 'text-3xl md:text-5xl' : 'text-3xl'
      }`}
    >
      {volumeNumber(entry.volume)}
    </span>
  );

  const metaLine = (
    <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
      <span>vol. {volumeNumber(entry.volume)}</span>
      {date && (
        <>
          <span aria-hidden="true" className="h-px w-4 bg-zinc-700" />
          <span>{date}</span>
        </>
      )}
      {entry.readingTime && (
        <>
          <span aria-hidden="true" className="h-px w-4 bg-zinc-700" />
          <span>{entry.readingTime}</span>
        </>
      )}
    </div>
  );

  const cta = (
    <span className="mt-7 inline-flex min-h-[44px] items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-100 transition-colors group-hover:text-zinc-50">
      {isFeatured ? 'read full entry' : 'read entry'}
      <ArrowUpRight
        size={14}
        strokeWidth={1.6}
        aria-hidden="true"
        className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
    </span>
  );

  return (
    <motion.article
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: isFeatured ? 24 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: shouldReduceMotion ? 0.3 : isFeatured ? 0.95 : 0.8,
        delay: shouldReduceMotion || isFeatured ? 0 : index * 0.08,
        ease: EASE,
      }}
    >
      <a
        href={detailPath('journal', entry.slug)}
        onClick={(event) => {
          if (!shouldInterceptClick(event)) return;
          event.preventDefault();
          onOpen(entry);
        }}
        aria-label={`Read ${entry.title}`}
        className="group block w-full cursor-pointer text-left"
      >
        {isFeatured ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-7">{plate}</div>

            <div className="flex min-w-0 flex-col md:col-span-5 md:justify-center">
              <div className="flex items-center gap-4">
                {prefix}
                <span className="min-w-0 font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-zinc-400">
                  latest volume
                </span>
              </div>

              <h2 className="mt-5 font-display text-3xl font-medium lowercase leading-[0.96] tracking-[-0.05em] text-zinc-50 md:text-4xl lg:text-5xl">
                {entry.title}
              </h2>

              {entry.excerpt && (
                <p className="mt-5 max-w-xl text-sm font-light leading-relaxed text-zinc-300 line-clamp-5 md:text-base">
                  {entry.excerpt}
                </p>
              )}

              {metaLine}

              {(tags.length > 0 || entry.category) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {/* Default tone, not accent: the ember measures 3.14:1 against
                      the paper, which is fine for the display-size volume figure
                      above but fails at chip size. */}
                  {entry.category && <TagChip>{entry.category}</TagChip>}
                  {tags.map((tag) => (
                    <TagChip key={tag}>{tag}</TagChip>
                  ))}
                </div>
              )}

              {/* On rotation — the record the entry was written to. Capped at
                  max-w-sm and truncating, so a long title cannot widen the
                  column on a 320px screen. The disc no longer spins: the motion
                  contract allows no infinite loops outside the marquee. */}
              {hasMusic && (
                <div className="mt-8 flex w-full max-w-sm items-center gap-4 border border-zinc-800 bg-canvas-raised p-4">
                  <Disc3
                    aria-hidden="true"
                    size={26}
                    strokeWidth={1}
                    className="shrink-0 text-accent"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">
                      on rotation
                    </span>
                    {music?.songTitle && (
                      <span className="mt-1.5 block truncate font-display text-sm font-medium text-zinc-100">
                        {music.songTitle}
                      </span>
                    )}
                    {music?.songArtist && (
                      <span className="block truncate font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                        {music.songArtist}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {cta}
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-col">
            {plate}

            <div className="mt-5 flex min-w-0 items-start gap-4">
              {prefix}

              <div className="min-w-0 flex-1">
                <h3 className="font-display text-xl font-medium lowercase leading-[1.05] tracking-[-0.04em] text-zinc-50 md:text-2xl">
                  {entry.title}
                </h3>

                {entry.excerpt && (
                  <p className="mt-3 max-w-md text-xs font-light leading-relaxed text-zinc-300 line-clamp-3 md:text-sm">
                    {entry.excerpt}
                  </p>
                )}
              </div>

              {entry.category && (
                <TagChip className="mt-1 hidden shrink-0 sm:inline-flex">{entry.category}</TagChip>
              )}
            </div>

            {metaLine}

            {tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <TagChip key={tag}>{tag}</TagChip>
                ))}
              </div>
            )}

            {cta}
          </div>
        )}
      </a>
    </motion.article>
  );
}
