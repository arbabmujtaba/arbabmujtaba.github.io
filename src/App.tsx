/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Navigation from './components/Navigation';
import CursorWand from './components/CursorWand';
import FloatingMagicalArrow from './components/FloatingMagicalArrow';
import GlobalBackground from './components/GlobalBackground';
import { PillButton } from './components/rushes';
import { resetAllScrolls } from './lib/scroll';
import { useMediaQuery } from './lib/useMediaQuery';
import { detailPath, type DetailCollection } from './lib/collections';
import { EntryNavigationProvider, type OpenEntry } from './lib/entryNavigation';
import {
  isQuickLookState,
  navigate,
  parseRoute,
  VIEW_TO_PATH,
  NAVIGATION_EVENT,
  type ListView,
  type Route,
} from './lib/navigation';

const Home = lazy(() => import('./pages/Home'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Journal = lazy(() => import('./pages/Journal'));
const Tech = lazy(() => import('./pages/Tech'));
const Photography = lazy(() => import('./pages/Photography'));
const Collection = lazy(() => import('./pages/Collection'));
const Admin = lazy(() => import('./pages/Admin'));
const Entry = lazy(() => import('./pages/Entry'));
const NotFound = lazy(() => import('./pages/NotFound'));
// The reader (react-markdown, the customization layer, and the inlined content
// bundle) stays out of the initial chunk. Prefetched on idle below so the first
// card click still opens instantly.
const loadQuickLook = () => import('./components/QuickLook');
const QuickLook = lazy(loadQuickLook);

interface QuickLook {
  collection: DetailCollection;
  slug: string;
}

/**
 * Resolve the current URL into what should render.
 *
 * A detail URL means one of two things. Pushed from a card on a listing page it
 * carries `{ quickLook: true }`, and the listing stays mounted with the overlay
 * on top. Loaded cold — a shared link, a refresh, a crawler — there is no such
 * state, so the full page renders. Either way the address bar is the truth.
 */
function resolveLocation(): { route: Route; quickLook: QuickLook | null } {
  const route = parseRoute(window.location.pathname);

  if (route.kind === 'entry' && isQuickLookState()) {
    return {
      route: { kind: 'list', view: route.collection },
      quickLook: { collection: route.collection, slug: route.slug },
    };
  }

  return { route, quickLook: null };
}

export default function App() {
  const [{ route, quickLook }, setLocation] = useState(resolveLocation);
  const isTouchDevice = useMediaQuery('(pointer: coarse), (max-width: 767px)');

  const setView = useCallback((newView: string) => {
    navigate(VIEW_TO_PATH[newView as ListView] ?? '/');
  }, []);

  /** Open an entry as a quick look over the listing it was clicked from. */
  const openEntry = useCallback<OpenEntry>((collection, slug) => {
    navigate(detailPath(collection, slug), { state: { quickLook: true } });
  }, []);

  /**
   * Close the overlay by stepping back, so the history stack stays honest and
   * the browser's back button and the close button agree. Falls back to
   * replacing the URL when there is nothing to step back to.
   */
  const closeQuickLook = useCallback(() => {
    if (!quickLook) return;
    if (isQuickLookState() && window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate(VIEW_TO_PATH[quickLook.collection], { replace: true });
  }, [quickLook]);

  // Disable browser scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  // Single source of truth: re-derive from the URL on both kinds of change.
  // pushState does not emit popstate, hence the companion custom event.
  useEffect(() => {
    const sync = () => setLocation(resolveLocation());
    window.addEventListener('popstate', sync);
    window.addEventListener(NAVIGATION_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(NAVIGATION_EVENT, sync);
    };
  }, []);

  // A view change resets the scroll; opening an overlay must not, so this keys
  // off the rendered view rather than the raw path.
  const viewKey = useMemo(
    () => (route.kind === 'entry' ? `${route.collection}/${route.slug}` : route.view),
    [route]
  );

  useEffect(() => {
    resetAllScrolls();
  }, [viewKey]);

  // Escape closes the quick look, matching the backdrop and the close button.
  useEffect(() => {
    if (!quickLook) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeQuickLook();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickLook, closeQuickLook]);

  // Warm the reader chunk once the page is quiet, so the first card click does
  // not wait on a network round trip.
  useEffect(() => {
    const idle = window.requestIdleCallback;
    if (typeof idle === 'function') {
      const handle = idle(() => void loadQuickLook());
      return () => window.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(() => void loadQuickLook(), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  const isAdmin = route.kind === 'list' && route.view === 'admin';

  return (
    <EntryNavigationProvider value={openEntry}>
      <div className="min-h-screen bg-canvas text-zinc-100 flex flex-col relative box-border selection:bg-accent/30 overflow-x-hidden">
        <GlobalBackground />

        {/* Pointer follower. Outside the framed layout so it can cross the frame,
            and skipped on the admin surface, where precision matters more. */}
        {!isAdmin && <CursorWand />}

        {/* Outer Border Frame */}
        <div className="flex-grow m-1 sm:m-3 md:m-6 lg:m-8 border-0 sm:border border-zinc-800 relative z-10 flex flex-col overflow-hidden">

          {/* Header: mark left, sections centre, standing invitation right */}
          {!isAdmin && (
            <header className="relative z-20 flex w-full items-center justify-between gap-6 px-4 pt-5 md:px-12 md:pt-8 lg:px-16">
              <motion.button
                type="button"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setView('home')}
                aria-label="Home"
                className="font-display text-xl font-semibold uppercase tracking-[-0.04em] text-zinc-100 transition-colors hover:text-accent md:text-2xl"
              >
                AM<span className="text-accent">.</span>
              </motion.button>

              <div className="hidden md:block">
                <Navigation activeView={route.view} setView={setView} />
              </div>

              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <PillButton href="mailto:arbabandjones@gmail.com" className="hidden sm:inline-flex">
                  get in touch
                </PillButton>
              </motion.div>
            </header>
          )}

          {/* Mobile bottom bar lives outside the header */}
          {!isAdmin && (
            <div className="md:hidden">
              <Navigation activeView={route.view} setView={setView} />
            </div>
          )}

          {/* Main Content Area Routing */}
          <AnimatePresence mode="wait">
            <motion.div
              key={viewKey}
              className="relative flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0, y: isTouchDevice ? 0 : 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isTouchDevice ? 0 : -24 }}
              transition={{ duration: isTouchDevice ? 0.2 : 0.72, ease: [0.16, 1, 0.3, 1] }}
            >
              <Suspense fallback={<div className="flex flex-1 bg-canvas" />}>
                {route.kind === 'list' && route.view === 'home' && <Home setView={setView} />}
                {route.kind === 'list' && route.view === 'portfolio' && <Portfolio />}
                {route.kind === 'list' && route.view === 'journal' && <Journal />}
                {route.kind === 'list' && route.view === 'tech' && <Tech />}
                {route.kind === 'list' && route.view === 'photography' && <Photography />}
                {route.kind === 'list' && route.view === 'collection' && <Collection />}
                {route.kind === 'list' && route.view === 'admin' && <Admin setView={setView} />}
                {route.kind === 'entry' && (
                  <Entry
                    collection={route.collection}
                    slug={route.slug}
                    setView={setView}
                  />
                )}
                {route.kind === 'notFound' && <NotFound setView={setView} />}
              </Suspense>

              {!isAdmin && (
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none fixed inset-0 z-[90]"
                  initial={{ opacity: isTouchDevice ? 0.24 : 0.45 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: isTouchDevice ? 0.16 : 0.3 }}
                  transition={{ duration: isTouchDevice ? 0.2 : 0.55, ease: [0.16, 1, 0.3, 1] }}
                  style={{ backgroundColor: 'var(--bg-deep)' }}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Quick-look overlay — one instance for every listing page */}
          <Suspense fallback={null}>
            <AnimatePresence>
              {quickLook && (
                <QuickLook
                  key={`${quickLook.collection}/${quickLook.slug}`}
                  collection={quickLook.collection}
                  slug={quickLook.slug}
                  onClose={closeQuickLook}
                />
              )}
            </AnimatePresence>
          </Suspense>

          {!isAdmin && <FloatingMagicalArrow />}

          {/* Camera framing marks */}
          <div className="pointer-events-none absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-700"></div>
          <div className="pointer-events-none absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-700"></div>
          <div className="pointer-events-none absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-zinc-700"></div>
          <div className="pointer-events-none absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-zinc-700"></div>
        </div>
      </div>
    </EntryNavigationProvider>
  );
}
