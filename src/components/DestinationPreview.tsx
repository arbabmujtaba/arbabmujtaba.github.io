/**
 * DestinationPreview
 *
 * A live, visual representation of where a piece of content will land on the
 * actual website. Instead of a single line of text, it renders:
 *   1. a miniature mock of the site's top navigation, with the chosen section
 *      highlighted (a sliding pill shows which nav item is selected);
 *   2. a small "page" card listing the section's categories, with the selected
 *      one highlighted and marked;
 *   3. a breadcrumb (Website → Section → [Area] → Category) connected by arrows.
 *
 * Everything is driven by props, so the preview updates in real time as the
 * user changes the section, area, or category in the Publishing Center.
 */
import { motion, AnimatePresence } from 'motion/react';
import { Home, ChevronRight, ArrowDown, MousePointerClick } from 'lucide-react';

interface DestinationPreviewProps {
  /** The primary nav sections to mock at the top (matches the real site nav). */
  sections: { id: string; label: string }[];
  activeSectionId: string;
  sectionLabel: string;
  /** The area / sub-destination label (e.g. "Gallery"); shown when relevant. */
  areaLabel?: string;
  /** Whether the section exposes more than one area (so the area is meaningful). */
  showArea?: boolean;
  /** True for the Home page / site-configuration destination. */
  isConfig?: boolean;
  /** Categories rendered as cards inside the page mock. */
  categories: string[];
  activeCategory?: string;
  /** When set, the area implies a single category (no picker shown). */
  fixedCategory?: string;
  /** Short note describing where the content appears on the site. */
  blurb?: string;
  /** Formats a raw category id into a human-friendly label. */
  formatCategory: (c: string) => string;
}

export default function DestinationPreview({
  sections,
  activeSectionId,
  sectionLabel,
  areaLabel,
  showArea,
  isConfig,
  categories,
  activeCategory,
  fixedCategory,
  blurb,
  formatCategory,
}: DestinationPreviewProps) {
  const finalCategory = fixedCategory || activeCategory || '';
  const finalCategoryLabel = finalCategory ? formatCategory(finalCategory) : '';

  // Cards shown inside the page mock + which one is the live target.
  const pageCards = fixedCategory ? [fixedCategory] : categories;
  const activeCard = fixedCategory || activeCategory;

  // Breadcrumb trail (the area is omitted when the section only has one area).
  const crumbs = [
    'Website',
    sectionLabel,
    showArea ? areaLabel : undefined,
    finalCategoryLabel || undefined,
  ].filter(Boolean) as string[];

  const navPill = (active: boolean, content: React.ReactNode, key?: string) => (
    <div key={key} className="relative">
      {active && (
        <motion.span
          layoutId="dp-nav-highlight"
          className="absolute inset-0 rounded-[4px] bg-orange-500/15 border border-orange-500/50"
          transition={{ type: 'spring', stiffness: 520, damping: 36 }}
        />
      )}
      <span
        className={`relative flex items-center gap-1 px-2 py-1 rounded-[4px] font-sans text-[10px] tracking-wide whitespace-nowrap transition-colors duration-300 ${
          active ? 'text-orange-300' : 'text-zinc-500'
        }`}
      >
        {content}
      </span>
    </div>
  );

  return (
    <div className="rounded-md border border-orange-500/20 bg-gradient-to-b from-orange-500/[0.05] to-transparent overflow-hidden">
      {/* Window chrome / title */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/70 bg-zinc-950/50">
        <span className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 ml-2">
          Live destination preview
        </span>
      </div>

      <div className="p-4 md:p-5 space-y-3">
        {/* (1) Mini site navigation */}
        <div>
          <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-zinc-600">Site navigation</span>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {navPill(
              !!isConfig,
              <>
                <Home className="w-3 h-3" /> Website
              </>,
              'root'
            )}
            <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />
            {sections.map((s) => navPill(!isConfig && s.id === activeSectionId, s.label, s.id))}
          </div>
        </div>

        {/* connector */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-orange-500/60"
          >
            <ArrowDown className="w-4 h-4" />
          </motion.div>
        </div>

        {/* (2) Page mock */}
        <div className="rounded-sm border border-zinc-800/80 bg-zinc-950/50 p-3">
          <div className="flex items-baseline justify-between mb-3">
            <span className="font-serif text-sm text-zinc-100">
              {sectionLabel}
              {showArea && areaLabel ? <span className="text-zinc-500"> · {areaLabel}</span> : null}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-zinc-600">page</span>
          </div>

          {pageCards.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {pageCards.map((cat) => {
                const active = cat === activeCard;
                return (
                  <motion.div
                    key={cat}
                    layout
                    className={`relative px-2.5 py-1.5 rounded-sm border font-sans text-[10px] transition-colors duration-300 ${
                      active
                        ? 'border-orange-500/60 bg-orange-500/15 text-orange-200'
                        : 'border-zinc-800 bg-zinc-900/40 text-zinc-500'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="dp-cat-marker"
                        className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_2px_rgba(249,115,22,0.55)]"
                        transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                      />
                    )}
                    {formatCategory(cat)}
                    {active && (
                      <MousePointerClick className="inline-block w-2.5 h-2.5 ml-1 -mt-0.5 text-orange-300" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <span className="font-sans text-[10px] text-zinc-500 italic">A single curated list (no sub-categories).</span>
          )}
        </div>

        {/* (3) Breadcrumb */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <div key={`${c}-${i}`} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3 h-3 text-orange-500/50 shrink-0" />}
                {isLast ? (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={c}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 5 }}
                      transition={{ duration: 0.22 }}
                      className="px-2 py-0.5 rounded-sm bg-orange-500/15 border border-orange-500/40 text-orange-200 font-sans text-[11px] font-medium"
                    >
                      {c}
                    </motion.span>
                  </AnimatePresence>
                ) : (
                  <span className="text-zinc-400 font-sans text-[11px]">{c}</span>
                )}
              </div>
            );
          })}
        </div>

        {blurb && (
          <p className="font-sans text-[11px] text-zinc-500 font-light pt-0.5">
            Appears in: {blurb}.
          </p>
        )}
      </div>
    </div>
  );
}
