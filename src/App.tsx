/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import Journal from './pages/Journal';
import Tech from './pages/Tech';
import Photography from './pages/Photography';
import Collection from './pages/Collection';
import Admin from './pages/Admin';
import FloatingMagicalArrow from './components/FloatingMagicalArrow';
import CursorAura from './components/CursorAura';
import GlobalBackground from './components/GlobalBackground';
import { resetAllScrolls } from './lib/scroll';

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
    const timer = setTimeout(() => resetAllScrolls(), 800);
    return () => clearTimeout(timer);
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
    <div className="min-h-screen bg-[#0a0a09] text-zinc-100 flex flex-col relative box-border selection:bg-orange-500/30 overflow-x-hidden">
      <GlobalBackground />

      <CursorAura />

      {/* Outer Border Frame */}
      <div className="flex-grow m-1 sm:m-3 md:m-6 lg:m-8 border-0 sm:border border-zinc-800/50 relative z-10 flex flex-col overflow-hidden">
        
        {/* Header containing Name and Navigation */}
        {view !== 'admin' && (
          <header className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center pt-5 px-4 md:px-12 lg:px-16 md:pt-8 relative z-20 gap-0 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: view === 'home' ? 0 : 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className={`font-serif text-2xl tracking-tighter text-zinc-200 cursor-pointer hover:text-white transition-colors z-50 mix-blend-difference mt-1 md:mt-5 ${view === 'home' ? 'pointer-events-none' : ''}`}
              onClick={() => setView('home')}
            >
              Arbab <span className="italic text-orange-500/80">Mujtaba</span>
            </motion.div>
            
            <div className="pt-0 md:pt-5 z-50">
              <Navigation activeView={view} setView={setView} />
            </div>
          </header>
        )}

        {/* Main Content Area Routing */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            className="relative flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
          >
            {view === 'home' && <Home setView={setView} />}
            {view === 'portfolio' && <Portfolio />}
            {view === 'journal' && <Journal />}
            {view === 'tech' && <Tech />}
            {view === 'photography' && <Photography />}
            {view === 'collection' && <Collection />}
            {view === 'admin' && <Admin setView={setView} />}

            {view !== 'admin' && (
              <motion.div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-[90]"
                initial={{ opacity: 0.55 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0.34 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background:
                    'radial-gradient(circle at center, rgba(249,115,22,0.045), transparent 46%), rgba(10,10,9,0.58)',
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {view !== 'admin' && <FloatingMagicalArrow />}
        
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-500/30"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-500/30"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-500/30"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-500/30"></div>
      </div>
    </div>
  );
}
