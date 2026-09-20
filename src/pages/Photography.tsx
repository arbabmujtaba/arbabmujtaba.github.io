import { useCallback, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import { Aperture, Camera, Focus } from 'lucide-react';
import Footer from '../components/Footer';
import SafeImage from '../components/SafeImage';
import { FrameCard, RecLabel, StackedHeading, TagChip } from '../components/rushes';
import { getPhotographyEntries, getGearItems } from '../lib/cms';
import { detailPath } from '../lib/collections';
import { useOpenEntry } from '../lib/entryNavigation';
import { shouldInterceptClick } from '../lib/navigation';
import { useMediaQuery } from '../lib/useMediaQuery';
import type { GearItem, PhotographyEntry } from '../types';

const EASE = [0.16, 1, 0.3, 1] as const;

// Preferred ordering and copy for the photo-story categories. Anything not
// listed here is still rendered (appended after these) so no category is dropped.
const STORY_CATEGORY_ORDER = ['Behind The Shot', 'Travel', 'Life', 'Connected'];
const STORY_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Behind The Shot': 'Stories and context behind selected frames.',
  'Travel': 'Frames gathered from journeys and the places in between.',
  'Life': 'Everyday moments and the memories worth keeping.',
  'Connected': 'People, relationships, and the moments shared with them.',
};

const ALL_CATEGORIES = 'all';

/** Plate numbers are darkroom contact-sheet labels: `plate 04`. */
const plateLabel = (position: number) => `plate ${String(position).padStart(2, '0')}`;

/**
 * Plate rhythm. Rows repeat 1-up → 2-up → 3-up so the grid never settles into a
 * single cadence. `startAt` lets a section open on a different row width when a
 * dedicated lead plate already sits above it.
 */
const RHYTHM = [1, 2, 3];

function rhythmRows<T>(items: T[], startAt = 0): T[][] {
  const rows: T[][] = [];
  let cursor = 0;
  let step = startAt;

  while (cursor < items.length) {
    const size = RHYTHM[step % RHYTHM.length];
    rows.push(items.slice(cursor, cursor + size));
    cursor += size;
    step += 1;
  }

  return rows;
}

/**
 * Mobile-first aspect pairs. At 320px the shell measures ~288px, so every
 * mobile aspect stays at or below 4:3 — a bare 21/9 plate would collapse to a
 * 120px sliver, which the layout audit rejected.
 */
const ROW_ASPECT: Record<number, string> = {
  1: 'aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]',
  2: 'aspect-[4/3] sm:aspect-[16/10]',
  3: 'aspect-[4/3] sm:aspect-[3/4]',
};

const ROW_COLUMNS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

function gearIcon(category: string) {
  if (category === 'Cameras') return Camera;
  if (category === 'Lenses') return Aperture;
  return Focus;
}

function Section({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative border-t border-zinc-800 py-16 md:py-24 ${className}`}>
      {children}
    </section>
  );
}

/** Capture metadata — camera / lens / mode, straight from the entry. */
function CaptureMeta({
  entry,
  className = '',
}: {
  entry: PhotographyEntry;
  className?: string;
}) {
  const bits = [
    entry.gear?.length ? entry.gear.join(' / ') : null,
    entry.captureMode || null,
  ].filter((bit): bit is string => Boolean(bit));

  if (bits.length === 0) return null;

  return (
    <p
      className={`font-mono text-[9px] uppercase leading-relaxed tracking-[0.2em] text-zinc-500 ${className}`}
    >
      {bits.join('  ·  ')}
    </p>
  );
}

/** A run of plates laid out in the 1/2/3 rhythm. */
function PlateRows({
  entries,
  plateOf,
  onSelect,
  startAt = 0,
  showMeta = false,
  className = '',
}: {
  entries: PhotographyEntry[];
  plateOf: (entry: PhotographyEntry) => number;
  onSelect: (entry: PhotographyEntry) => void;
  startAt?: number;
  showMeta?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-12 md:space-y-16 ${className}`}>
      {rhythmRows(entries, startAt).map((row, rowIndex) => (
        <div
          key={`row-${rowIndex}-${row.length}`}
          className={`grid gap-10 md:gap-6 ${ROW_COLUMNS[row.length]}`}
        >
          {row.map((entry) => (
            <div key={entry.slug || entry.title} className="min-w-0">
              <FrameCard
                title={entry.title}
                image={entry.coverImage}
                tag={entry.category}
                index={plateLabel(plateOf(entry))}
                excerpt={entry.description}
                aspect={ROW_ASPECT[row.length]}
                href={detailPath('photography', entry.slug)}
                onClick={() => onSelect(entry)}
              />
              {showMeta && <CaptureMeta entry={entry} className="mt-3" />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Photography() {
  const containerRef = useRef<HTMLDivElement>(null);
  const openEntry = useOpenEntry();
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);

  const shouldReduceMotion = useReducedMotion();
  const isTouchDevice = useMediaQuery('(pointer: coarse), (max-width: 767px)');
  const shouldParallax = !shouldReduceMotion && !isTouchDevice;

  /** Opening a frame pushes `/photography/<slug>`; App renders the quick look. */
  const handleOpen = useCallback(
    (entry: PhotographyEntry) => openEntry('photography', entry.slug),
    [openEntry]
  );

  const { scrollY } = useScroll({ container: containerRef });
  const leadImageY = useTransform(scrollY, [0, 800], ['0%', '8%']);

  // Load from CMS
  const allPhotos = useMemo(() => getPhotographyEntries(), []);
  const gearItems = useMemo(
    () => getGearItems().filter((g) => g.visible).sort((a, b) => a.order - b.order),
    []
  );

  // Group gear by category
  const gearByCategory = useMemo(() => {
    return gearItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, GearItem[]>);
  }, [gearItems]);

  // Filter dynamic favorites
  const favorites = useMemo(() => {
    return allPhotos.filter((p) => p.category === 'Favorites');
  }, [allPhotos]);

  // Everything that is not part of the Favorites showcase, in the preferred
  // category order — so a "Travel" frame files under Travel, never lumped into
  // "Behind The Shot".
  const stories = useMemo(() => {
    const rest = allPhotos.filter((p) => p.category !== 'Favorites');
    const rank = (category: string) => {
      const index = STORY_CATEGORY_ORDER.indexOf(category);
      return index === -1 ? STORY_CATEGORY_ORDER.length : index;
    };
    return [...rest].sort(
      (a, b) => rank(a.category || 'Behind The Shot') - rank(b.category || 'Behind The Shot')
    );
  }, [allPhotos]);

  // The lead plate is the first favorite, or the first frame on file when no
  // favorites are flagged — either way it is never repeated further down.
  const leadFromFavorites = favorites.length > 0;
  const leadPhoto = leadFromFavorites ? favorites[0] : stories[0];
  const restFavorites = leadFromFavorites ? favorites.slice(1) : [];
  const archiveStories = useMemo(
    () => (leadFromFavorites ? stories : stories.slice(1)),
    [stories, leadFromFavorites]
  );

  const storyCategories = useMemo(() => {
    const counts = archiveStories.reduce((acc, photo) => {
      const category = photo.category || 'Behind The Shot';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const known = STORY_CATEGORY_ORDER.filter((category) => counts[category]);
    const extras = Object.keys(counts).filter(
      (category) => !STORY_CATEGORY_ORDER.includes(category)
    );

    return [...known, ...extras].map((category) => ({
      category,
      count: counts[category],
      description:
        STORY_CATEGORY_DESCRIPTIONS[category] || `Photo stories filed under ${category}.`,
    }));
  }, [archiveStories]);

  const visibleStories = useMemo(
    () =>
      activeCategory === ALL_CATEGORIES
        ? archiveStories
        : archiveStories.filter(
            (photo) => (photo.category || 'Behind The Shot') === activeCategory
          ),
    [archiveStories, activeCategory]
  );

  const activeDescription =
    activeCategory === ALL_CATEGORIES
      ? 'Every frame on file, newest cameras and oldest memories alike.'
      : storyCategories.find((entry) => entry.category === activeCategory)?.description || '';

  // One contact sheet, numbered once: favorites first, then the archive. The
  // number travels with the entry so filtering never renumbers a plate.
  const plateNumbers = useMemo(() => {
    const map = new Map<PhotographyEntry, number>();
    [...favorites, ...stories].forEach((entry, index) => map.set(entry, index + 1));
    return map;
  }, [favorites, stories]);

  const plateOf = (entry: PhotographyEntry) => plateNumbers.get(entry) ?? 1;


  return (
    <motion.div
      key="photography"
      initial={{ opacity: 0, y: isTouchDevice ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: isTouchDevice ? 0 : -18 }}
      transition={{ duration: isTouchDevice ? 0.2 : 0.8, ease: EASE }}
      className="relative flex flex-grow flex-col overflow-hidden"
    >
      <div
        ref={containerRef}
        className="page-shell custom-scrollbar relative z-10 flex-grow overflow-y-auto pt-0"
      >
        {/* ===================== INTRO ===================== */}
        <div className="page-intro" data-mark="FRAMES">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
          >
            <RecLabel>frames</RecLabel>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease: EASE }}
            className="page-title mt-7"
          >
            photography
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: EASE }}
            className="page-description"
          >
            A collection of moments gathered over the years. This is less of a portfolio and
            more of a personal visual diary, focusing on memories, people, and the stories
            carried within light.
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500"
          >
            <span>
              <span className="text-accent">{allPhotos.length}</span> plates
            </span>
            <span aria-hidden="true" className="text-zinc-700">
              /
            </span>
            <span>
              <span className="text-accent">{storyCategories.length + (favorites.length ? 1 : 0)}</span>{' '}
              categories
            </span>
            <span aria-hidden="true" className="text-zinc-700">
              /
            </span>
            <span>darkroom open</span>
          </motion.p>
        </div>

        {/* ===================== LEAD PLATE ===================== */}
        {leadPhoto && (
          <section className="relative pb-16 md:pb-24">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.9, ease: EASE }}
            >
              <a
                href={detailPath('photography', leadPhoto.slug)}
                onClick={(event) => {
                  if (!shouldInterceptClick(event)) return;
                  event.preventDefault();
                  handleOpen(leadPhoto);
                }}
                className="group block w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <div className="image-frame w-full overflow-hidden aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]">
                  <motion.div
                    className="absolute inset-0 overflow-hidden"
                    style={shouldParallax ? { y: leadImageY } : undefined}
                  >
                    <SafeImage
                      src={leadPhoto.coverImage}
                      alt={leadPhoto.title}
                      loading="eager"
                      sizes="100vw"
                      className={`w-full object-cover transition-transform duration-[1200ms] ease-out ${
                        shouldParallax ? 'h-[112%]' : 'h-full'
                      } ${shouldReduceMotion ? '' : 'group-hover:scale-[1.02]'}`}
                      fallback={
                        <div
                          className="hairline-grid h-full w-full bg-canvas-deep"
                          aria-hidden="true"
                        />
                      }
                    />
                  </motion.div>

                  {/* Legibility band only — the frame itself stays unmuted. */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-canvas/90 via-canvas/25 to-transparent"
                  />

                  <div className="absolute inset-x-0 bottom-0 z-10 p-5 md:p-8 lg:p-10">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-300">
                        {plateLabel(plateOf(leadPhoto))}
                      </span>
                      <TagChip tone="accent">{leadPhoto.category}</TagChip>
                    </div>

                    <h2 className="mt-4 font-display text-3xl font-medium lowercase leading-[0.95] tracking-[-0.045em] text-zinc-50 md:text-5xl lg:text-6xl">
                      {leadPhoto.title}
                    </h2>

                    {leadPhoto.description && (
                      <p className="mt-3 line-clamp-2 max-w-xl text-sm font-light leading-relaxed text-zinc-300 sm:line-clamp-none">
                        {leadPhoto.description}
                      </p>
                    )}

                    <CaptureMeta entry={leadPhoto} className="mt-4" />
                  </div>
                </div>
              </a>
            </motion.div>
          </section>
        )}

        {/* ===================== FAVORITES ===================== */}
        {restFavorites.length > 0 && (
          <Section>
            <RecLabel>selected</RecLabel>
            <StackedHeading
              lines={['selected', 'frames']}
              body="The most meaningful frames."
              className="mt-7"
            />
            <PlateRows
              entries={restFavorites}
              plateOf={plateOf}
              onSelect={handleOpen}
              startAt={1}
              showMeta
              className="mt-12 md:mt-16"
            />
          </Section>
        )}

        {/* ===================== ARCHIVE + CATEGORY FILTER ===================== */}
        {archiveStories.length > 0 && (
          <Section>
            <RecLabel>archive</RecLabel>
            <StackedHeading
              lines={['photo stories', 'filed by light']}
              body="Each frame carries the note that came with it."
              className="mt-7"
            />

            {storyCategories.length > 1 && (
              <div
                role="group"
                aria-label="Filter frames by category"
                className="mt-10 flex flex-wrap items-center gap-2"
              >
                {[
                  { category: ALL_CATEGORIES, label: 'all', count: archiveStories.length },
                  ...storyCategories.map((entry) => ({
                    category: entry.category,
                    label: entry.category,
                    count: entry.count,
                  })),
                ].map((chip) => {
                  const isActive = activeCategory === chip.category;
                  return (
                    <button
                      key={chip.category}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveCategory(chip.category)}
                      className="inline-flex min-h-[44px] items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                    >
                      <TagChip
                        tone={isActive ? 'accent' : 'default'}
                        className={`transition-colors ${
                          isActive ? '' : 'hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        {chip.label}
                        <span className="ml-2 opacity-60">{chip.count}</span>
                      </TagChip>
                    </button>
                  );
                })}
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={`caption-${activeCategory}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="mt-6 max-w-lg text-sm font-light leading-relaxed text-zinc-400"
              >
                {activeDescription}
              </motion.p>
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`plates-${activeCategory}`}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.25 : 0.55, ease: EASE }}
              >
                <PlateRows
                  entries={visibleStories}
                  plateOf={plateOf}
                  onSelect={handleOpen}
                  className="mt-12 md:mt-16"
                />
              </motion.div>
            </AnimatePresence>
          </Section>
        )}

        {/* ===================== KIT ===================== */}
        {Object.keys(gearByCategory).length > 0 && (
          <Section>
            <RecLabel>kit</RecLabel>
            <StackedHeading
              lines={['the tools', 'in the bag']}
              body="What's in the bag."
              className="mt-7"
            />

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3 md:mt-16">
              {Object.entries(gearByCategory).map(([category, items], index) => {
                const Icon = gearIcon(category);
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.8, delay: index * 0.08, ease: EASE }}
                    className="border border-zinc-800 bg-canvas-raised p-6"
                  >
                    <div className="flex items-center gap-3 text-accent">
                      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
                        {category}
                      </span>
                    </div>

                    <ul className="mt-6 border-t border-zinc-800">
                      {items.map((item) => (
                        <li
                          key={item.slug}
                          className="border-b border-zinc-800 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400"
                        >
                          {item.title}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
          </Section>
        )}

        <Footer />
      </div>
    </motion.div>
  );
}
