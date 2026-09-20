import { useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import Footer from '../components/Footer';
import {
  Accordion,
  NumberedItem,
  PillButton,
  RecLabel,
  StackedHeading,
  TagChip,
} from '../components/rushes';
import type { AccordionEntry } from '../components/rushes';
import {
  getCollectionEntries,
  getFavoriteItems,
  getGearItems,
  getTimelineMilestones,
} from '../lib/cms';
import { detailPath } from '../lib/collections';
import { useOpenEntry } from '../lib/entryNavigation';
import { useMediaQuery } from '../lib/useMediaQuery';
import { CollectionEntry, GearItem } from '../types';

const EASE = [0.16, 1, 0.3, 1] as const;

/* --------------------------------------------------------------------------
   BONE SURFACE INK CORRECTION
   --------------------------------------------------------------------------
   Identical to Journal.tsx — see the long note there. Measured against the bone
   background (`--rushes-bone`), --ink-5 (text-zinc-500) lands at 2.75:1, --ink-4
   (text-zinc-400, and the shared `.page-description` rule) at 3.89:1 and
   --ink-6 (text-zinc-600) at 2.11:1, all below the 4.5:1 body-text floor, while
   --ink-3 (text-zinc-300) measures 6.52:1. The dim resting states belong to the
   primitives and to index.css, so the two faintest steps are lifted once at the
   token level for this subtree. No colour literals: every value is one of the
   surface's own tokens. Two elements are required because --ink-6 must read
   --ink-4 before --ink-4 is itself reassigned.
   -------------------------------------------------------------------------- */
const BONE_FAINT_INK = { '--ink-6': 'var(--ink-4)' } as React.CSSProperties;
const BONE_MUTED_INK = {
  '--ink-4': 'var(--ink-3)',
  '--ink-5': 'var(--ink-3)',
} as React.CSSProperties;

/** Gear tiers, in catalogue order. Categories with no entries are skipped. */
const GEAR_TIERS: GearItem['category'][] = [
  'Cameras',
  'Lenses',
  'Audio',
  'Tools',
  'Software',
  'Other',
];

/**
 * Guard against frontmatter the parser could not read.
 *
 * `parseYamlBlock` in lib/cms.ts has no support for YAML folded block scalars,
 * so a field written as `description: >-` arrives as the literal ">-" with the
 * real sentence dropped (content/gear/sony-a7iii.md is the one entry affected
 * today). Rendering that marker as copy is worse than rendering nothing, so a
 * value with no letters in it is treated as absent. The parser itself is the
 * proper fix and belongs in lib/cms.ts.
 */
function plainText(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return /[A-Za-z]/.test(trimmed) ? trimmed : undefined;
}

/** specs arrives either as plain strings or as `{ spec }` objects from the CMS. */
function specStrings(specs: GearItem['specs']): string[] {
  const list = (specs ?? []) as Array<string | { spec?: string }>;
  return list
    .map((entry) => (typeof entry === 'string' ? entry : entry?.spec))
    .filter((value): value is string => !!value);
}

/**
 * The headline figure for a gear row.
 *
 * The owner's spec lists lead with the number that matters — "26.1MP X-Trans
 * CMOS 4", "F1.2 Maximum Aperture", "24-70mm Focal Range" — so the leading
 * figure of the first spec is what belongs large on the right of the row.
 * Entries whose first spec has no figure fall back to the tier name. Keeping
 * this column to a single short token is deliberate: NumberedItem renders `meta`
 * at display size and never shrinks it, so a long string there would widen the
 * row.
 */
function specFigure(item: GearItem): string {
  const first = specStrings(item.specs)[0] || '';
  const figure = first.match(/^[\w./-]*\d[\w./-]*/);
  return figure ? figure[0] : item.category;
}

export default function Collection() {
  const openEntry = useOpenEntry();
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isTouchDevice = useMediaQuery('(pointer: coarse), (max-width: 767px)');
  /**
   * NumberedItem lays number / label / description / meta out as a single row
   * from md up, and both the description and the meta column are fixed width.
   * Between 768px and 1023px that leaves the label too little room: measured in
   * Chromium at 768px, gear label boxes collapsed to 24–96px while their longest
   * word needed 99–130px, so the title spilled across the description. In that
   * band the gear row carries the label and the spec figure only. Phones stack
   * the row, so the description is always shown there, and it returns at lg
   * where the three columns fit.
   */
  const isTightRow = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  /**
   * NumberedItem sets `meta` at 18.75px on phones and 28.1px from md up. The
   * ember measures 3.14:1 against the paper, which clears the 3:1 large-text
   * floor at 28.1px but not the 4.5:1 floor at 18.75px. So on phones the spec
   * figure leads the description, where it inherits legible ink (6.52:1), and
   * from md up it sits large on the right as the grammar intends.
   */
  const isPhone = useMediaQuery('(max-width: 767px)');

  // ---- content, all from the markdown archive ----
  const entries = useMemo(() => getCollectionEntries(), []);
  const timelineMilestones = useMemo(
    () => getTimelineMilestones().filter((t) => t.visible),
    []
  );
  const favoriteItems = useMemo(() => getFavoriteItems().filter((f) => f.visible), []);
  const gearItems = useMemo(() => getGearItems().filter((g) => g.visible), []);

  /** Gear grouped into its tiers, empty tiers dropped. */
  const gearTiers = useMemo(
    () =>
      GEAR_TIERS.map((tier) => ({
        tier,
        items: gearItems.filter((item) => item.category === tier),
      })).filter((group) => group.items.length > 0),
    [gearItems]
  );

  /** Every note the owner has kept, as a single disclosure list. */
  const noteEntries = useMemo<AccordionEntry[]>(
    () =>
      favoriteItems.map((item) => ({
        id: item.slug,
        title: item.title,
        meta: item.category,
        body: plainText(item.description),
      })),
    [favoriteItems]
  );

  /** Collection entries — inspirations and records — grouped by category. */
  const entryGroups = useMemo(() => {
    const order: CollectionEntry['category'][] = [
      'Inspirations',
      'Books',
      'Music',
      'Uses',
      'Gear',
      'Timeline',
      'Favorites',
    ];
    return order
      .map((category) => ({
        category,
        items: entries.filter((entry) => entry.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [entries]);

  /**
   * Depending on viewport height the scroller is either this container or the
   * document itself — measured in Chromium at 1280x900, the container reported
   * scrollHeight === clientHeight while window.scrollY moved, so scrolling only
   * the container would have done nothing. Both are reset, matching
   * resetAllScrolls() in lib/scroll.ts.
   */
  const backToTop = () => {
    const behavior: ScrollBehavior = shouldReduceMotion ? 'auto' : 'smooth';
    window.scrollTo({ top: 0, left: 0, behavior });
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior });
  };

  return (
    <motion.div
      key="collection"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion || isTouchDevice ? 0.2 : 0.8, ease: EASE }}
      className="relative flex h-full flex-grow flex-col overflow-hidden"
    >
      {/* The catalogue is printed on paper, same as the journal. The modal is
          mounted outside this subtree so it keeps the dark surface. */}
      <div
        ref={scrollRef}
        data-surface="bone"
        style={BONE_FAINT_INK}
        className="custom-scrollbar relative z-10 w-full flex-grow overflow-y-auto bg-canvas"
      >
        <div style={BONE_MUTED_INK} className="flex min-h-full flex-col">
          <div className="page-shell">
            <header className="page-intro" data-mark="INDEX">
              <RecLabel>index</RecLabel>

              <motion.h1
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.3 : 0.95, delay: 0.1, ease: EASE }}
                className="page-title mt-7"
              >
                collection
              </motion.h1>

              <motion.p
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.3 : 0.9, delay: 0.2, ease: EASE }}
                className="page-description"
              >
                A personal museum archive. Documenting the timelines, tools, literature, and
                soundscapes that shape my engineering journey and creative output.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
                className="mt-9 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400"
              >
                <span>{String(timelineMilestones.length).padStart(2, '0')} milestones</span>
                <span aria-hidden="true" className="h-px w-5 bg-zinc-700" />
                <span>{String(gearItems.length).padStart(2, '0')} kit</span>
                <span aria-hidden="true" className="h-px w-5 bg-zinc-700" />
                <span>{String(noteEntries.length).padStart(2, '0')} notes</span>
              </motion.p>
            </header>

            {/* ===================== TIMELINE ===================== */}
            {timelineMilestones.length > 0 && (
              <section className="border-t border-zinc-800 pt-12 md:pt-16">
                <RecLabel>timeline</RecLabel>
                <StackedHeading
                  lines={['the journey', 'in order']}
                  body="Milestones kept in the sequence they actually happened."
                  className="mt-7"
                />

                <div className="mt-14 max-w-4xl border-l border-zinc-800">
                  {timelineMilestones.map((milestone, index) => (
                    <motion.div
                      key={milestone.slug}
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{
                        duration: shouldReduceMotion ? 0.3 : 0.75,
                        delay: shouldReduceMotion ? 0 : index * 0.06,
                        ease: EASE,
                      }}
                      className="group relative py-8 pl-8 md:py-10 md:pl-12"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-10 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-zinc-700 bg-canvas transition-colors duration-500 group-hover:border-accent"
                      />

                      {/* Default tone: ember text measures 3.14:1 against the
                          paper, which fails at chip size. */}
                      <TagChip>{milestone.year}</TagChip>

                      <h3 className="mt-5 font-display text-2xl font-medium lowercase leading-[1.02] tracking-[-0.04em] text-zinc-50 md:text-4xl">
                        {milestone.title}
                      </h3>

                      <p className="mt-3 max-w-xl text-sm font-light leading-relaxed text-zinc-300 md:text-base">
                        {plainText(milestone.description)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* ===================== KIT ===================== */}
            {gearTiers.length > 0 && (
              <section className="mt-24 border-t border-zinc-800 pt-12 md:mt-32 md:pt-16">
                <RecLabel>kit</RecLabel>
                <StackedHeading
                  lines={['the tools', 'in rotation']}
                  body="Cameras, glass, and software that earn their place by being used."
                  className="mt-7"
                />

                {/* overflow-hidden guards the display-size figures in the meta
                    column, per the layout contract on oversized type. */}
                <div className="mt-14 overflow-hidden">
                  {gearTiers.map((group) => (
                    <div key={group.tier} className="mt-12 first:mt-0">
                      <div className="flex items-baseline justify-between gap-4 border-b border-zinc-700 pb-3">
                        <TagChip>{group.tier}</TagChip>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                          {String(group.items.length).padStart(2, '0')}
                        </span>
                      </div>

                      {group.items.map((item, index) => {
                        const blurb = plainText(item.description);
                        const figure = specFigure(item);
                        return (
                          <NumberedItem
                            key={item.slug}
                            index={index + 1}
                            label={item.title}
                            description={
                              isPhone
                                ? [figure, blurb].filter(Boolean).join(' — ')
                                : isTightRow
                                  ? undefined
                                  : blurb
                            }
                            meta={isPhone ? undefined : figure}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ===================== NOTES / TIL ===================== */}
            {noteEntries.length > 0 && (
              <section className="mt-24 border-t border-zinc-800 pt-12 md:mt-32 md:pt-16">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                  <div>
                    <RecLabel>notes</RecLabel>
                    <StackedHeading
                      lines={['things', 'worth keeping']}
                      body="Technologies, software, Linux tools, setups, and the small things I like — one line each."
                      className="mt-7"
                    />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                    {String(noteEntries.length).padStart(2, '0')} entries
                  </span>
                </div>

                <Accordion items={noteEntries} className="mt-14" />
              </section>
            )}

            {/* ===================== ANNEX ===================== */}
            {entryGroups.length > 0 && (
              <section className="mt-24 border-t border-zinc-800 pt-12 md:mt-32 md:pt-16">
                <RecLabel>annex</RecLabel>
                <StackedHeading
                  lines={['ideas and', 'influences']}
                  body="Longer notes on the books, records, and philosophies behind the work."
                  className="mt-7"
                />

                <div className="mt-14">
                  {entryGroups.map((group) => (
                    <div key={group.category} className="mt-12 first:mt-0">
                      <div className="flex items-baseline justify-between gap-4 border-b border-zinc-700 pb-3">
                        <TagChip>{group.category}</TagChip>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                          {String(group.items.length).padStart(2, '0')}
                        </span>
                      </div>

                      {group.items.map((entry, index) => (
                        <NumberedItem
                          key={entry.slug}
                          index={index + 1}
                          label={entry.title}
                          description={plainText(entry.description)}
                          href={entry.body ? detailPath('collection', entry.slug) : undefined}
                          onClick={
                            entry.body ? () => openEntry('collection', entry.slug) : undefined
                          }
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Curator's note — the owner's standing line on curation. */}
                <div className="mt-16 border border-zinc-800 bg-canvas-raised p-6 md:p-10">
                  <RecLabel quiet>curator&rsquo;s note</RecLabel>
                  <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-zinc-200 md:text-base">
                    &ldquo;We are generally the product of what we consume. Building a curated
                    environment of high-quality inputs is essential for producing meaningful
                    outputs.&rdquo;
                  </p>
                </div>
              </section>
            )}

            <div className="mt-20 flex justify-center">
              <PillButton tone="ghost" onClick={backToTop}>
                back to top
              </PillButton>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </motion.div>
  );
}
