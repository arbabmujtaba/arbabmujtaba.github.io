/**
 * Routing primitives for the hand-rolled router in `App`.
 *
 * The site has no router library: `App` derives its view from
 * `window.location.pathname` and pushes history entries itself. This module
 * owns the two halves of that contract — parsing a pathname into a route, and
 * mutating history — so pages and cards can navigate without threading
 * callbacks through every component.
 *
 * Navigation dispatches a `NAVIGATION_EVENT` because `history.pushState` does
 * not fire `popstate`; `App` listens to both and re-derives the route from the
 * URL in either case, which keeps the address bar the single source of truth.
 */

import { isDetailCollection, type DetailCollection } from './collections';

export const NAVIGATION_EVENT = 'app:navigate';

/** Top-level views that map one-to-one onto a path. */
export const LIST_VIEWS = [
  'home',
  'portfolio',
  'journal',
  'tech',
  'photography',
  'collection',
  'admin',
] as const;

export type ListView = (typeof LIST_VIEWS)[number];

export type Route =
  | { kind: 'list'; view: ListView }
  | { kind: 'entry'; view: DetailCollection; collection: DetailCollection; slug: string }
  | { kind: 'notFound'; view: 'notFound' };

const PATH_TO_VIEW: Record<string, ListView> = {
  '/': 'home',
  '/portfolio': 'portfolio',
  '/journal': 'journal',
  '/tech': 'tech',
  '/photography': 'photography',
  '/collection': 'collection',
  '/admin': 'admin',
};

export const VIEW_TO_PATH: Record<ListView, string> = {
  home: '/',
  portfolio: '/portfolio',
  journal: '/journal',
  tech: '/tech',
  photography: '/photography',
  collection: '/collection',
  admin: '/admin',
};

/** Slugs are lowercase kebab-case; anything else is not one of ours. */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/**
 * Parse a pathname into a route. Unknown paths resolve to `notFound` rather
 * than silently falling back to home, so a mistyped or stale deep link is
 * visibly wrong instead of pretending to work.
 */
export function parseRoute(pathname: string): Route {
  const normalized = normalizePath(pathname);

  const listView = PATH_TO_VIEW[normalized];
  if (listView) return { kind: 'list', view: listView };

  const segments = normalized.split('/').filter(Boolean);
  if (segments.length === 2) {
    const [collection, rawSlug] = segments;
    const slug = decodeURIComponent(rawSlug);
    if (isDetailCollection(collection) && SLUG_PATTERN.test(slug)) {
      return { kind: 'entry', view: collection, collection, slug };
    }
  }

  return { kind: 'notFound', view: 'notFound' };
}

export interface NavigateOptions {
  /** Replace the current entry instead of pushing a new one. */
  replace?: boolean;
  /** Arbitrary history state, e.g. `{ quickLook: true }`. */
  state?: unknown;
}

/**
 * Push (or replace) a path and tell `App` to re-read the URL.
 * A no-op when the path and state are already current.
 */
export function navigate(path: string, options: NavigateOptions = {}): void {
  const { replace = false, state = {} } = options;
  const samePath = window.location.pathname === path;

  if (samePath && !replace) {
    // Still notify: the caller may be re-opening the same URL after a close.
    window.dispatchEvent(new Event(NAVIGATION_EVENT));
    return;
  }

  if (replace) {
    window.history.replaceState(state, '', path);
  } else {
    window.history.pushState(state, '', path);
  }

  window.dispatchEvent(new Event(NAVIGATION_EVENT));
}

/** Navigate to one of the top-level views. */
export function navigateToView(view: ListView): void {
  navigate(VIEW_TO_PATH[view] ?? '/');
}

/** True when the current history entry was created by a quick-look overlay. */
export function isQuickLookState(): boolean {
  const state = window.history.state as { quickLook?: boolean } | null;
  return !!state?.quickLook;
}

/**
 * Whether a click on an in-site anchor should be handled by the router.
 *
 * Modified clicks (new tab, new window, download) and non-primary buttons are
 * left to the browser, so every in-site link keeps its native affordances even
 * though the router handles the plain case.
 */
export function shouldInterceptClick(event: {
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}): boolean {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  return !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
}
