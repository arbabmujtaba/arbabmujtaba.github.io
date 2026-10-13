/**
 * Where an entry will land — worked out with the same rules the site uses.
 *
 * The admin shows this beside the live preview (and in the Live editor) so an
 * author can see, before publishing, which priority a post holds and exactly
 * which slot that gives it: the lead of the Home desk, tile 3 of the frames,
 * #4 in the Travel section, and so on.
 *
 * It mirrors, and must stay in step with:
 *   lib/cms.ts                    the order of each collection
 *   components/rushes/LivingJournal.tsx   the Home desk
 *   components/rushes/PhotoShuffle.tsx    the Home frames
 *   pages/Home.tsx                the Home work index (first six projects)
 *   pages/Journal.tsx, Photography.tsx, Tech.tsx, Portfolio.tsx
 */
import { comparePriority, isFeatured, sortByPriority } from './priority';

export type PlacementCollection = 'journal' | 'tech' | 'photography' | 'portfolio';

export interface PlacementEntry {
  collection: string;
  slug: string;
  date?: string;
  category?: string;
  priority?: number;
  featured?: boolean;
  /** Shown on the site (journal: published; others: visible). */
  visible?: boolean;
}

export interface Spot {
  /** The page, e.g. "Home" or "Photography". */
  page: string;
  /** The part of the page, e.g. "On the desk, lately". */
  where: string;
  /** The slot, in plain words: "the lead", "#3 of 12". */
  detail: string;
  /** The entry is the first thing there. */
  prominent: boolean;
}

export interface Placement {
  priority?: number;
  /** Position in the collection's own order, 1-based. */
  rank: number;
  total: number;
  spots: Spot[];
  /** Places it does not reach, and why — so "why isn't it on Home?" has an answer. */
  misses: string[];
  /** The entry is switched off and will not show anywhere. */
  hidden: boolean;
}

/** Mirrors pages/Photography.tsx. */
const STORY_CATEGORY_ORDER = ['Behind The Shot', 'Travel', 'Life', 'Connected'];
/** PhotoShuffle: seven tiles; Favorites alone fill the pool once there are 7 + 4 of them. */
const FRAME_TILES = 7;
const FAVORITES_ENOUGH = FRAME_TILES + 4;
/** LivingJournal: the lead plus five more journal volumes. */
const DESK_SIZE = 6;
/** Home.tsx: six lines of work. */
const WORK_LINES = 6;

const DATED = ['journal', 'tech', 'photography'];
const PAGE_NAME: Record<PlacementCollection, string> = {
  journal: 'Journal',
  tech: 'Tech',
  photography: 'Photography',
  portfolio: 'Portfolio',
};

const time = (date?: string) => {
  const t = date ? new Date(date).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
};

const byNewest = (a: PlacementEntry, b: PlacementEntry) => time(b.date) - time(a.date);
const same = (a: PlacementEntry, b: PlacementEntry) => a.collection === b.collection && a.slug === b.slug;
const nth = (i: number, total?: number) => `#${i + 1}${total ? ` of ${total}` : ''}`;

/** The collection in the order lib/cms.ts returns it. */
export function orderCollection(collection: string, list: PlacementEntry[]): PlacementEntry[] {
  if (collection === 'portfolio') {
    // Glob order is the file path; featured first, then priority on top of that.
    const byPath = [...list].sort((a, b) => a.slug.localeCompare(b.slug));
    return sortByPriority(byPath.sort((a, b) => Number(!!b.featured) - Number(!!a.featured)));
  }
  return sortByPriority([...list].sort(byNewest));
}

/**
 * @param entry  the entry being edited, with its unsaved values
 * @param others everything else in the archive (the admin's content list)
 * @param originalSlug the slug it is saved under, if it is being renamed
 */
export function placementFor(entry: PlacementEntry, others: PlacementEntry[], originalSlug?: string): Placement {
  const collection = entry.collection as PlacementCollection;
  const self: PlacementEntry = { ...entry, featured: entry.featured || isFeatured(entry) };
  const isSelf = (item: PlacementEntry) =>
    same(item, entry) || (!!originalSlug && item.collection === entry.collection && item.slug === originalSlug);
  const live = others.filter((item) => item.visible !== false && !isSelf(item));
  const withSelf = (c: string) => [...live.filter((i) => i.collection === c), ...(c === collection ? [self] : [])];

  const ordered = orderCollection(collection, withSelf(collection));
  const rank = ordered.indexOf(self);
  const base = { priority: entry.priority, rank: rank + 1, total: ordered.length };

  if (entry.visible === false) {
    return { ...base, spots: [], misses: ['Switched off — it will not show anywhere on the site.'], hidden: true };
  }

  const spots: Spot[] = [];
  const misses: string[] = [];
  const page = PAGE_NAME[collection];

  // ---- its own page ----
  if (collection === 'journal') {
    spots.push(
      rank === 0
        ? { page, where: 'Top of the page', detail: 'the featured hero card', prominent: true }
        : { page, where: 'Archive grid', detail: nth(rank - 1, ordered.length - 1), prominent: false }
    );
  } else if (collection === 'photography') {
    const favorites = ordered.filter((p) => p.category === 'Favorites');
    const stories = [...ordered.filter((p) => p.category !== 'Favorites')].sort((a, b) => {
      const r = (c?: string) => {
        const i = STORY_CATEGORY_ORDER.indexOf(c || 'Behind The Shot');
        return i === -1 ? STORY_CATEGORY_ORDER.length : i;
      };
      return r(a.category) - r(b.category);
    });
    const lead = ordered.find(isFeatured) ?? favorites[0] ?? stories[0];
    if (lead === self) {
      spots.push({ page, where: 'Lead plate', detail: 'the large photograph at the top', prominent: true });
    } else if (self.category === 'Favorites') {
      const shelf = favorites.filter((p) => p !== lead);
      spots.push({ page, where: 'Favorites shelf', detail: nth(shelf.indexOf(self), shelf.length), prominent: false });
    } else {
      const group = stories.filter((p) => p !== lead && (p.category || 'Behind The Shot') === (self.category || 'Behind The Shot'));
      spots.push({ page, where: `“${self.category || 'Behind The Shot'}” stories`, detail: nth(group.indexOf(self), group.length), prominent: false });
    }
  } else if (collection === 'tech') {
    const group = ordered.filter((t) => (t.category || 'Notes') === (self.category || 'Notes'));
    spots.push(
      rank === 0
        ? { page, where: 'Top of the page', detail: `the first log, leading “${self.category || 'Notes'}”`, prominent: true }
        : { page, where: `“${self.category || 'Notes'}” logs`, detail: nth(group.indexOf(self), group.length), prominent: group.indexOf(self) === 0 }
    );
  } else if (collection === 'portfolio') {
    spots.push({ page, where: 'Projects', detail: nth(rank, ordered.length) + (self.featured ? ' · featured' : ''), prominent: rank === 0 });
  }

  // ---- Home: the desk (journal, photography, tech) ----
  if (DATED.includes(collection)) {
    const desk = [...live.filter((i) => DATED.includes(i.collection)), self]
      .filter((i) => time(i.date) > 0 || i === self)
      .sort((a, b) => comparePriority(a, b) || byNewest(a, b));
    const lead = desk[0];
    if (lead === self) {
      spots.push({ page: 'Home', where: 'On the desk, lately', detail: 'the lead — the big plate at the top of the section', prominent: true });
    } else if (collection === 'journal') {
      const pile = desk.filter((i) => i !== lead && i.collection === 'journal').slice(0, DESK_SIZE - 1);
      const at = pile.indexOf(self);
      if (at >= 0) spots.push({ page: 'Home', where: 'On the desk, lately', detail: `${nth(at)} in the list beside the lead`, prominent: false });
      else misses.push(`Home desk: only the lead and the next ${DESK_SIZE - 1} journal volumes are listed — give it a lower priority number to move up.`);
    } else {
      misses.push('Home desk: only the lead slot takes a photograph or a log — priority 0 (or being the newest) puts it there.');
    }
  }

  // ---- Home: the frames ----
  if (collection === 'photography') {
    const photos = withSelf('photography');
    const prioritised = sortByPriority(photos.filter((p) => p.priority !== undefined));
    const at = prioritised.indexOf(self);
    if (at >= 0 && at < FRAME_TILES) {
      spots.push({
        page: 'Home',
        where: 'Light I couldn’t quite let go of (frames)',
        detail:
          (at === 0 ? 'the large first tile' : `tile ${at + 1} of ${FRAME_TILES}`) +
          (isFeatured(self) ? ' — stays put while the others rotate' : ' on load, then it rotates'),
        prominent: at === 0,
      });
    } else {
      const favoriteCount = photos.filter((p) => p.category === 'Favorites').length;
      if (self.category === 'Favorites' || favoriteCount < FAVORITES_ENOUGH) {
        spots.push({ page: 'Home', where: 'Light I couldn’t quite let go of (frames)', detail: 'in the shuffle — appears at random', prominent: false });
      } else {
        misses.push('Home frames: there are enough Favorites to fill the shuffle — file it under Favorites or give it a priority.');
      }
    }
  }

  // ---- Home: the work index ----
  if (collection === 'portfolio') {
    if (rank < WORK_LINES) spots.push({ page: 'Home', where: 'Things I built (work)', detail: `line ${rank + 1} of ${WORK_LINES}`, prominent: rank === 0 });
    else misses.push(`Home work index: only the first ${WORK_LINES} projects are listed — it is #${rank + 1}.`);
  }

  return { ...base, spots, misses, hidden: false };
}
