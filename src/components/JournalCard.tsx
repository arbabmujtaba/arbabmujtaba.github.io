import { motion } from 'motion/react';
import { Disc3 } from 'lucide-react';
import ParallaxImage from './ParallaxImage';
import SafeImage from './SafeImage';
import ExploreArrow from './ExploreArrow';
import { JournalEntry } from '../types';

/**
 * Default cinematic cover used when an entry has no uploaded image.
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

/** Pretty magazine volume label: 2 -> "Vol. 02". */
function volumeLabel(volume?: number): string {
  if (!volume || volume < 1) return 'Vol. 01';
  return `Vol. ${String(volume).padStart(2, '0')}`;
}

function formatDate(date: string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * JournalCard — the single, reusable editorial card used for EVERY journal
 * entry. The `featured` variant is the large cinematic hero (newest entry);
 * the `archive` variant is the smaller image-first card used in the grid.
 *
 * Both variants share one design system: a full-bleed cover image, a dark
 * gradient overlay for legibility, the volume + metadata eyebrow, serif title,
 * excerpt, tags and the "Read … Essay" CTA. There is intentionally no separate
 * layout for new posts — publishing an entry requires zero manual adjustment.
 */
export default function JournalCard({ entry, variant, onOpen, index = 0 }: JournalCardProps) {
  const isFeatured = variant === 'featured';
  const cover = entry.featuredImage || entry.coverImage || DEFAULT_JOURNAL_COVER;
  const date = formatDate(entry.date);
  const music = entry.customization?.music;
  const hasMusic = !!(music && (music.songTitle || music.songArtist));

  return (
    <motion.article
      initial={{ opacity: 0, y: isFeatured ? 30 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: isFeatured ? 1 : 0.8, delay: isFeatured ? 0 : index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onOpen(entry)}
      className={[
        'group relative isolate flex w-full cursor-pointer flex-col justify-end overflow-hidden',
        'rounded-sm border border-zinc-800/80 bg-zinc-900/40',
        'shadow-2xl shadow-black/40 transition-colors duration-500 hover:border-orange-500/40',
        isFeatured
          ? 'min-h-[34rem] sm:min-h-[38rem] md:min-h-[44rem] lg:min-h-[46rem]'
          : 'min-h-[24rem] sm:min-h-[26rem]',
      ].join(' ')}
    >
      {/* Cover image — full-bleed background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {isFeatured ? (
          <ParallaxImage
            src={cover}
            alt={entry.title}
            className="h-full w-full"
            imageClassName="grayscale-[12%] transition-all duration-[1200ms] group-hover:grayscale-0 group-hover:scale-[1.04]"
          />
        ) : (
          <SafeImage
            src={cover}
            alt={entry.title}
            className="h-full w-full object-cover grayscale-[15%] transition-all duration-[1200ms] group-hover:grayscale-0 group-hover:scale-[1.05]"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* Dark gradient overlays for text readability */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black/95 via-black/55 to-black/15" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-black/70 via-black/10 to-transparent" />
      {/* Subtle top sheen + vignette so the frame reads as cinematic */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70 [box-shadow:inset_0_0_140px_30px_rgba(0,0,0,0.55)]" />

      {/* Content layer */}
      <div className={isFeatured ? 'relative p-8 md:p-12 lg:p-16' : 'relative p-6 md:p-8'}>
        {/* Eyebrow: featured badge + volume */}
        <div className="mb-5 flex flex-wrap items-center gap-4">
          {isFeatured && (
            <>
              <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-orange-400">
                Featured Entry
              </span>
              <span className="h-1 w-1 rounded-full bg-zinc-500/70" />
            </>
          )}
          <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-zinc-300">
            {volumeLabel(entry.volume)}
          </span>
        </div>

        {/* Title */}
        <h3
          className={[
            'font-serif text-zinc-50 [text-shadow:0_2px_30px_rgba(0,0,0,0.6)]',
            isFeatured
              ? 'text-3xl leading-[1.1] md:text-5xl lg:text-6xl'
              : 'text-2xl leading-[1.12] md:text-3xl',
          ].join(' ')}
        >
          {entry.title}
        </h3>

        {/* Excerpt */}
        {entry.excerpt && (
          <p
            className={[
              'mt-5 font-sans font-light text-zinc-300',
              isFeatured
                ? 'max-w-2xl text-sm leading-relaxed line-clamp-4 md:text-base'
                : 'max-w-xl text-xs leading-relaxed line-clamp-2 md:text-sm',
            ].join(' ')}
          >
            {entry.excerpt}
          </p>
        )}

        {/* Metadata row: date • reading time • tags */}
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          {date && (
            <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-zinc-400">{date}</span>
          )}
          {entry.readingTime && (
            <>
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-zinc-400">
                {entry.readingTime}
              </span>
            </>
          )}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.slice(0, isFeatured ? 4 : 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-zinc-700/50 bg-black/30 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-300 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* On Rotation music widget — featured only, rendered when the entry carries music */}
        {isFeatured && hasMusic && (
          <div className="mt-8 flex w-full max-w-sm items-center gap-6 rounded-sm border border-zinc-700/50 bg-zinc-950/60 p-4 backdrop-blur-md">
            <Disc3 className="h-8 w-8 animate-[spin_5s_linear_infinite] text-orange-400" strokeWidth={1} />
            <div className="flex flex-col">
              <span className="mb-1 font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-400">On Rotation</span>
              <div className="flex items-baseline gap-2">
                {music?.songTitle && <span className="font-serif italic text-zinc-100">{music.songTitle}</span>}
                {music?.songArtist && <span className="font-sans text-xs text-zinc-400">— {music.songArtist}</span>}
              </div>
            </div>
          </div>
        )}

        {/* CTA — same location & style across every entry */}
        <div className="mt-8">
          <ExploreArrow label={isFeatured ? 'Read Full Essay' : 'Read Essay'} direction="up-right" />
        </div>
      </div>
    </motion.article>
  );
}
