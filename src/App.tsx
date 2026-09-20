/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Navigation from './components/Navigation';
import FloatingMagicalArrow from './components/FloatingMagicalArrow';
import GlobalBackground from './components/GlobalBackground';
import { PillButton } from './components/rushes';
import { resetAllScrolls } from './lib/scroll';
import { useMediaQuery } from './lib/useMediaQuery';

const Home = lazy(() => import('./pages/Home'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Journal = lazy(() => import('./pages/Journal'));
const Tech = lazy(() => import('./pages/Tech'));
const Photography = lazy(() => import('./pages/Photography'));
const Collection = lazy(() => import('./pages/Collection'));
const Admin = lazy(() => import('./pages/Admin'));

const PATH_TO_VIEW: Record<string, string> = {
  '/': 'home',
  '/portfolio': 'portfolio',
  '/journal': 'journal',
  '/tech': 'tech',
  '/photography': 'photography',
  '/collection': 'collection',
  '/admin': 'admin',
};

const VIEW_TO_PATH: Record<string, string> = {
  home: '/',
  portfolio: '/portfolio',
  journal: '/journal',
  tech: '/tech',
  photography: '/photography',
  collection: '/collection',
  admin: '/admin',
};

function getViewFromPath(path: string): string {
  const normalized = path.replace(/\/+$/, '') || '/';
  return PATH_TO_VIEW[normalized] || 'home';
}

export default function App() {
  const [view, setViewState] = useState(() => getViewFromPath(window.location.pathname));
  const isTouchDevice = useMediaQuery('(pointer: coarse), (max-width: 767px)');

  const setView = useCallback((newView: string) => {
    const path = VIEW_TO_PATH[newView] || '/';
    if (window.location.pathname !== path) {
      window.history.pushState({ view: newView }, '', path);
    }
    setViewState(newView);
  }, []);

  // Disable browser scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  // Scroll to top on view change
  useEffect(() => {
    resetAllScrolls();
  }, [view]);

  // Keep routing synchronized on back/forward
  useEffect(() => {
    const handlePopState = () => {
      const targetView = getViewFromPath(window.location.pathname);
      setViewState(targetView);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-zinc-100 flex flex-col relative box-border selection:bg-accent/30 overflow-x-hidden">
      <GlobalBackground />

      {/* Outer Border Frame */}
      <div className="flex-grow m-1 sm:m-3 md:m-6 lg:m-8 border-0 sm:border border-zinc-800 relative z-10 flex flex-col overflow-hidden">
        
        {/* Header: mark left, sections centre, standing invitation right */}
        {view !== 'admin' && (
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
              <Navigation activeView={view} setView={setView} />
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
        {view !== 'admin' && (
          <div className="md:hidden">
            <Navigation activeView={view} setView={setView} />
          </div>
        )}

        {/* Main Content Area Routing */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            className="relative flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0, y: isTouchDevice ? 0 : 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isTouchDevice ? 0 : -24 }}
            transition={{ duration: isTouchDevice ? 0.2 : 0.72, ease: [0.16, 1, 0.3, 1] }}
          >
            <Suspense fallback={<div className="flex flex-1 bg-canvas" />}>
              {view === 'home' && <Home setView={setView} />}
              {view === 'portfolio' && <Portfolio />}
              {view === 'journal' && <Journal />}
              {view === 'tech' && <Tech />}
              {view === 'photography' && <Photography />}
              {view === 'collection' && <Collection />}
              {view === 'admin' && <Admin setView={setView} />}
            </Suspense>

            {view !== 'admin' && (
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

        {view !== 'admin' && <FloatingMagicalArrow />}
        
        {/* Camera framing marks */}
        <div className="pointer-events-none absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-700"></div>
        <div className="pointer-events-none absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-700"></div>
        <div className="pointer-events-none absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-zinc-700"></div>
        <div className="pointer-events-none absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-zinc-700"></div>
      </div>
    </div>
  );
}
