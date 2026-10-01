import { ArrowRight, FileText, Globe, Lock } from 'lucide-react';
import {
  WEBSITE_STRUCTURE,
  destinationFor,
  prettyCategory,
  publicPath,
  sectionFor,
  type CollectionId,
  type FormState,
} from './model';
import { Field } from './ui';

/** Plain-words description of where a block appears on the home page. */
function homeBlockWhere(category: string): string {
  switch (category) {
    case 'reel':
      return 'the “Frames that keep moving” strip';
    case 'gateway':
      return 'the gateway cards that lead to other pages';
    case 'quote':
      return 'the quote band';
    case 'principle':
      return 'the principles list';
    case 'profile':
      return 'the profile section';
    default:
      return 'a section of the landing page';
  }
}

/**
 * "Where does this go?" — the answer, before and after saving.
 *
 * Section → kind of entry → category, then the exact address and the page that lists it.
 * The collection is only changeable while the entry is new (the file lives in that folder).
 */
export function DestinationPanel({
  form,
  onCollection,
  onCategory,
}: {
  form: FormState;
  onCollection: (collection: CollectionId) => void;
  onCategory: (category: string) => void;
}) {
  const dest = destinationFor(form.collection);
  const section = sectionFor(form.collection);
  if (!dest || !section) return null;

  const locked = !form.isNew;
  const address = publicPath(form.collection, form.slug || '…');
  const listPage = dest.listPath === '/' ? 'Home page' : `${prettyCategory(dest.listPath.slice(1))} page`;
  const category = dest.fixedCategory ?? form.category;

  return (
    <div className="space-y-5">
      <Field label="Website section" hint={locked ? 'An entry stays in the section it was created in.' : undefined}>
        <div className="grid grid-cols-5 gap-1.5">
          {WEBSITE_STRUCTURE.map((item) => {
            const active = item.id === section.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={locked && !active}
                aria-pressed={active}
                onClick={() => onCollection(item.destinations[0].collection)}
                className="rounded-md border border-zinc-800 px-1 py-2.5 text-center text-[0.75rem] text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 aria-pressed:border-[var(--accent)] aria-pressed:bg-[var(--accent-soft)] aria-pressed:text-zinc-50"
              >
                {item.label.replace(' page', '')}
              </button>
            );
          })}
        </div>
      </Field>

      {section.destinations.length > 1 && (
        <Field label="What kind of entry">
          <div className="space-y-1.5">
            {section.destinations.map((item) => {
              const active = item.collection === form.collection;
              return (
                <button
                  key={item.collection}
                  type="button"
                  disabled={locked && !active}
                  aria-pressed={active}
                  onClick={() => onCollection(item.collection)}
                  className="flex w-full items-start gap-3 rounded-md border border-zinc-800 px-3 py-2.5 text-left transition-colors hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-40 aria-pressed:border-[var(--accent)] aria-pressed:bg-[var(--accent-soft)]"
                >
                  <span
                    className={`mt-1 h-2 w-2 flex-none rounded-full border ${active ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-zinc-600'}`}
                  />
                  <span className="min-w-0">
                    <span className="block text-[0.8125rem] font-medium text-zinc-100">{item.label}</span>
                    <span className="block text-[0.6875rem] leading-snug text-zinc-500">{item.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Field>
      )}

      {!dest.fixedCategory && dest.categories.length > 0 && (
        <Field label={dest.categoryLabel ?? 'Category'}>
          <select className="st-select" value={category} onChange={(event) => onCategory(event.target.value)}>
            {!dest.categories.includes(category) && category && <option value={category}>{prettyCategory(category)}</option>}
            {dest.categories.map((item) => (
              <option key={item} value={item}>
                {prettyCategory(item)}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="st-well overflow-hidden">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
          <Globe size={12} className="flex-none text-zinc-500" />
          <span className="min-w-0 flex-1 truncate font-mono text-[0.6875rem] text-zinc-300">{address}</span>
          {!dest.hasPage && (
            <span className="st-chip !text-[9px]" title="This entry is shown inside another page, not on its own address">
              no own page
            </span>
          )}
        </div>
        <div className="space-y-2 px-3 py-3 text-[0.75rem] leading-relaxed text-zinc-400">
          <p className="flex items-start gap-2">
            <ArrowRight size={12} className="mt-1 flex-none text-[var(--accent)]" />
            <span>
              {dest.hasPage ? (
                <>
                  Listed on the <strong className="font-medium text-zinc-200">{listPage}</strong>
                  {category ? (
                    <>
                      , under <strong className="font-medium text-zinc-200">{prettyCategory(category)}</strong>
                    </>
                  ) : null}
                  , and opens on its own page.
                </>
              ) : form.collection === 'home' ? (
                <>
                  Shows on the <strong className="font-medium text-zinc-200">Home page</strong> in {homeBlockWhere(category)}.
                </>
              ) : (
                <>
                  Shows inside the <strong className="font-medium text-zinc-200">{listPage}</strong>
                  {category ? <> as “{prettyCategory(category)}”</> : null}.
                </>
              )}
            </span>
          </p>
          {form.collection === 'journal' && (
            <p className="flex items-start gap-2">
              {form.published ? <FileText size={12} className="mt-1 flex-none text-zinc-500" /> : <Lock size={12} className="mt-1 flex-none text-amber-400" />}
              <span>{form.published ? 'Visible to readers once published.' : 'Hidden from readers until you switch “Show on site” on.'}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
