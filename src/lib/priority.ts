/**
 * Editorial priority — the author's say in what comes first.
 *
 * `priority` is an optional whole number in the front-matter of a journal
 * volume, a tech log, a photograph or a project:
 *
 *   0      featured — the lead on the home page and at the top of its own page
 *   1, 2…  pinned, in that order, straight after the featured entries
 *   unset  everything else, in the collection's natural order (newest first)
 *
 * Ties (two entries at priority 1, or none set at all) keep the order the list
 * already had, so the natural order is the tie-break.
 */

export const FEATURED_PRIORITY = 0;

/** The highest priority the editor offers as a quick pick. Any whole number works. */
export const PRIORITY_QUICK_PICKS = [0, 1, 2, 3, 4, 5] as const;

export interface Prioritised {
  priority?: number;
}

/** A whole number ≥ 0 from front-matter, or undefined when it is not one. */
export function parsePriority(raw: unknown): number | undefined {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

const rank = (item: Prioritised) => (item.priority === undefined ? Number.POSITIVE_INFINITY : item.priority);

/** Comparator: lower priority first, unset last. Returns 0 on a tie. */
export function comparePriority(a: Prioritised, b: Prioritised): number {
  const ra = rank(a);
  const rb = rank(b);
  return ra === rb ? 0 : ra < rb ? -1 : 1;
}

/** A new array, priority first; entries that tie keep their existing order. */
export function sortByPriority<T extends Prioritised>(list: readonly T[]): T[] {
  return [...list].sort(comparePriority);
}

export function isFeatured(item: Prioritised): boolean {
  return item.priority === FEATURED_PRIORITY;
}

/** How the admin names a priority. */
export function priorityLabel(priority: number | undefined): string {
  if (priority === undefined) return 'No priority';
  if (priority === FEATURED_PRIORITY) return 'Featured';
  return `Priority ${priority}`;
}
