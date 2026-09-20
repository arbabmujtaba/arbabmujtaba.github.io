import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import AppLink from '../components/AppLink';
import ContentModal from '../components/ContentModal';
import Footer from '../components/Footer';
import NotFound from './NotFound';
import { RecLabel } from '../components/rushes';
import { COLLECTION_LABEL, type DetailCollection } from '../lib/collections';
import { getDetailEntry, getDetailNeighbours } from '../lib/entries';
import { useMediaQuery } from '../lib/useMediaQuery';

const EASE = [0.16, 1, 0.3, 1] as const;

interface EntryProps {
  collection: DetailCollection;
  slug: string;
  setView?: (view: string) => void;
}

/**
 * Entry — the page behind `/<collection>/<slug>`.
 *
 * The same content the quick-look drawer shows, rendered as a document with a
 * real URL: shareable, crawlable, and survivable across a hard refresh. The
 * article body is `ContentModal variant="page"` rather than a second renderer,
 * so a change to one presentation can never leave the other behind.
 *
 * An unknown slug renders the 404 view instead of an empty page, which is what
 * a stale or mistyped link deserves.
 */
export default function Entry({ collection, slug, setView }: EntryProps) {
  const shouldReduceMotion = useReducedMotion();
  const isTouchDevice = useMediaQuery('(pointer: coarse), (max-width: 767px)');
  const flatten = shouldReduceMotion || isTouchDevice;

  const entry = useMemo(() => getDetailEntry(collection, slug), [collection, slug]);
  const neighbours = useMemo(
    () => (entry ? getDetailNeighbours(entry) : {}),
    [entry]
  );

  if (!entry) {
    return <NotFound setView={setView} requestedPath={`/${collection}/${slug}`} />;
  }

  const indexPath = `/${collection}`;
  const indexLabel = COLLECTION_LABEL[collection];

  return (
    <motion.div
      key={`${collection}/${slug}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: flatten ? 0.25 : 0.8, ease: EASE }}
      className="relative flex flex-grow flex-col overflow-hidden"
    >
      <div className="page-shell custom-scrollbar relative z-10 flex-grow overflow-y-auto pt-0">
        {/* ===================== BREADCRUMB ===================== */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-10 md:pt-16"
        >
          <AppLink
            to={indexPath}
            className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-accent"
          >
            <ArrowLeft
              size={13}
              strokeWidth={1.6}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
            {indexLabel} index
          </AppLink>

          <RecLabel quiet className="text-zinc-400">
            {indexLabel} / {entry.slug}
          </RecLabel>
        </nav>

        {/* ===================== ARTICLE ===================== */}
        <article className="mt-10 md:mt-14">
          <ContentModal
            variant="page"
            isOpen
            onClose={() => undefined}
            title={entry.title}
            category={entry.category}
            date={entry.date}
            coverImage={entry.coverImage}
            excerpt={entry.excerpt}
            body={entry.body}
            metadata={entry.metadata}
            video={entry.video}
            videoPoster={entry.videoPoster}
            customization={entry.customization}
          />
        </article>

        {/* ===================== NEIGHBOURS ===================== */}
        {(neighbours.previous || neighbours.next) && (
          <nav
            aria-label={`More from ${indexLabel}`}
            className="mt-16 grid grid-cols-1 gap-px border-t border-zinc-800 md:grid-cols-2"
          >
            {neighbours.previous ? (
              <AppLink
                to={neighbours.previous.path}
                className="group flex flex-col gap-2 border-b border-zinc-800 py-8 md:border-r md:pr-8"
              >
                <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  <ArrowLeft
                    size={12}
                    strokeWidth={1.6}
                    className="transition-transform duration-300 group-hover:-translate-x-1"
                  />
                  previous
                </span>
                <span className="font-display text-xl font-medium leading-tight tracking-[-0.035em] text-zinc-400 transition-colors group-hover:text-zinc-50 md:text-2xl">
                  {neighbours.previous.title}
                </span>
              </AppLink>
            ) : (
              <span aria-hidden="true" className="hidden md:block" />
            )}

            {neighbours.next && (
              <AppLink
                to={neighbours.next.path}
                className="group flex flex-col items-start gap-2 border-b border-zinc-800 py-8 md:items-end md:pl-8 md:text-right"
              >
                <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  next
                  <ArrowRight
                    size={12}
                    strokeWidth={1.6}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
                <span className="font-display text-xl font-medium leading-tight tracking-[-0.035em] text-zinc-400 transition-colors group-hover:text-zinc-50 md:text-2xl">
                  {neighbours.next.title}
                </span>
              </AppLink>
            )}
          </nav>
        )}

        <Footer setView={setView} />
      </div>
    </motion.div>
  );
}
