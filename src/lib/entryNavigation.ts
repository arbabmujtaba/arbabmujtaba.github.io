/**
 * How a listing page asks for an entry to be opened.
 *
 * `App` owns both the URL and the single quick-look overlay, so cards must not
 * hold their own "selected entry" state any more. They call `useOpenEntry()`
 * and `App` decides what that means: push `/<collection>/<slug>` and show the
 * overlay.
 *
 * The default implementation performs a full navigation to the detail page.
 * That keeps a card functional if it is ever rendered outside the provider
 * (a preview surface, a test), instead of silently doing nothing.
 */

import { createContext, useContext } from 'react';
import { detailPath, type DetailCollection } from './collections';
import { navigate } from './navigation';

export type OpenEntry = (collection: DetailCollection, slug: string) => void;

const fallbackOpenEntry: OpenEntry = (collection, slug) => {
  navigate(detailPath(collection, slug));
};

const EntryNavigationContext = createContext<OpenEntry>(fallbackOpenEntry);

export const EntryNavigationProvider = EntryNavigationContext.Provider;

/** Open an entry as a quick look, keeping the listing behind it. */
export function useOpenEntry(): OpenEntry {
  return useContext(EntryNavigationContext);
}
