import { useMemo, useState } from 'react';
import { ChevronDown, MapPin, Star } from 'lucide-react';
import { placementFor, type Placement, type PlacementEntry } from '../../lib/placement';
import { parsePriority, priorityLabel } from '../../lib/priority';
import { STYLED_COLLECTIONS, destinationFor, type FormState, type ListItem } from './model';

const OPEN_KEY = 'studio.placement.open';

/** The unsaved form as the placement rules see it. */
export function placementEntryFromForm(form: FormState): PlacementEntry {
  return {
    collection: form.collection,
    slug: form.slug || 'untitled',
    date: form.date,
    category: form.category,
    priority: parsePriority(form.priority),
    featured: form.featured,
    visible: form.collection === 'journal' ? form.published : true,
  };
}

function PriorityChip({ priority }: { priority?: number }) {
  const featured = priority === 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
        featured
          ? 'border-[var(--accent)] text-[var(--accent)]'
          : priority === undefined
            ? 'border-zinc-700 text-zinc-500'
            : 'border-zinc-600 text-zinc-300'
      }`}
    >
      {featured && <Star size={9} aria-hidden />}
      {priority === undefined ? 'no priority · by date' : priority === 0 ? 'priority 0 · featured' : priorityLabel(priority).toLowerCase()}
    </span>
  );
}

/** The spots, one per line, the prominent ones lit. */
function SpotList({ placement }: { placement: Placement }) {
  return (
    <ul className="space-y-1.5">
      {placement.spots.map((spot) => (
        <li key={`${spot.page}/${spot.where}`} className="flex items-baseline gap-2 text-[0.75rem] leading-snug">
          <span className={`mt-1 h-1.5 w-1.5 flex-none rounded-full ${spot.prominent ? 'bg-[var(--accent)]' : 'bg-zinc-600'}`} aria-hidden />
          <span className="min-w-0">
            <span className="font-medium text-zinc-100">{spot.page}</span>
            <span className="text-zinc-500"> · {spot.where} — </span>
            <span className={spot.prominent ? 'text-[var(--accent)]' : 'text-zinc-300'}>{spot.detail}</span>
          </span>
        </li>
      ))}
      {placement.misses.map((miss) => (
        <li key={miss} className="flex items-baseline gap-2 text-[0.6875rem] leading-snug text-zinc-500">
          <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full border border-zinc-700" aria-hidden />
          <span>{miss}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * "Where it lands": the priority this entry holds and every slot that gives it
 * on the site, recomputed on each keystroke from the unsaved form and the rest
 * of the archive. Shown above the live preview in the entry editor.
 */
export function PlacementPanel({ form, items }: { form: FormState; items: ListItem[] }) {
  const [open, setOpen] = useState(() => {
    try {
      return window.localStorage.getItem(OPEN_KEY) !== 'closed';
    } catch {
      return true;
    }
  });
  const entry = useMemo(() => placementEntryFromForm(form), [form]);
  const placement = useMemo(
    () => placementFor(entry, items, form.isNew ? undefined : form.originalSlug),
    [entry, items, form.isNew, form.originalSlug]
  );
  if (!STYLED_COLLECTIONS.includes(form.collection)) return null;

  const toggle = () => {
    setOpen((was) => {
      try {
        window.localStorage.setItem(OPEN_KEY, was ? 'closed' : 'open');
      } catch {
        /* ignore */
      }
      return !was;
    });
  };
  const section = destinationFor(form.collection)?.label ?? form.collection;

  return (
    <section className="flex-none border-b border-zinc-800 bg-[var(--bg-raised)]" aria-label="Where it lands">
      <button
        type="button"
        className="flex w-full flex-wrap items-center gap-2 px-4 py-2 text-left"
        aria-expanded={open}
        onClick={toggle}
        data-tip="Where this entry will show on the site with the priority and date it has now — updates as you edit. Change it with Priority on the Content tab."
      >
        <MapPin size={12} className="text-[var(--accent)]" aria-hidden />
        <span className="st-eyebrow">Where it lands</span>
        <PriorityChip priority={placement.priority} />
        <span className="font-mono text-[10px] text-zinc-500">
          {placement.hidden ? 'switched off' : `#${placement.rank} of ${placement.total} in ${section}`}
        </span>
        <ChevronDown size={13} className={`ml-auto text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div className="px-4 pb-3">
          <SpotList placement={placement} />
          {form.isNew && <p className="st-hint">Not posted yet — this is where it will go once you publish.</p>}
        </div>
      )}
    </section>
  );
}

/** The same answer for an entry already on the site — the Live editor's side panel. */
export function PlacementSummary({ item, items }: { item: ListItem; items: ListItem[] }) {
  const placement = useMemo(() => placementFor(item, items), [item, items]);
  if (!STYLED_COLLECTIONS.includes(item.collection)) return null;
  const section = destinationFor(item.collection)?.label ?? item.collection;
  return (
    <div className="space-y-2 rounded-sm border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <MapPin size={12} className="text-[var(--accent)]" aria-hidden />
        <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Where it is</span>
        <PriorityChip priority={placement.priority} />
      </div>
      <p className="font-mono text-[10px] text-zinc-500">
        {placement.hidden ? 'switched off' : `#${placement.rank} of ${placement.total} in ${section}`}
      </p>
      <SpotList placement={placement} />
      <p className="text-[0.6875rem] text-zinc-500">Change the priority in the full editor → Content tab.</p>
    </div>
  );
}
