import { useMemo } from 'react';
import ContentModal from './ContentModal';
import type { DetailCollection } from '../lib/collections';
import { getDetailEntry } from '../lib/entries';

interface QuickLookProps {
  collection: DetailCollection;
  slug: string;
  onClose: () => void;
}

/**
 * QuickLook — the drawer shown when an entry is opened from a listing page.
 *
 * Exists as its own module so that `App` never imports `entries.ts` (and
 * therefore `cms.ts`) directly: the reader, the customization layer and the
 * inlined markdown all stay in a lazy chunk instead of the initial bundle.
 *
 * Resolution failure renders nothing. `App` has already pushed the URL by this
 * point, so a slug that does not exist simply leaves the listing visible — and
 * a reload of that URL lands on the 404 view, which is the honest answer.
 */
export default function QuickLook({ collection, slug, onClose }: QuickLookProps) {
  const entry = useMemo(() => getDetailEntry(collection, slug), [collection, slug]);

  if (!entry) return null;

  return (
    <ContentModal
      isOpen
      onClose={onClose}
      title={entry.title}
      category={entry.category}
      date={entry.date}
      coverImage={entry.coverImage}
      excerpt={entry.excerpt}
      body={entry.body}
      metadata={entry.metadata}
      customization={entry.customization}
    />
  );
}
