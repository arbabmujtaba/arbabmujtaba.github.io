/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
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

export default function App() {
  const [view, setView] = useState(() => {
    if (window.location.pathname === '/admin') return 'admin';
    return 'home';
  });

  // Keep routing synchronized if path parameters differ
  useEffect(() => {
    const handleLocationChange = () => {
      if (window.location.pathname === '/admin') {
        setView('admin');
      } else {
        setView('home');
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a09] text-zinc-100 flex flex-col relative box-border selection:bg-orange-500/30">
      <GlobalBackground />

      <CursorAura />

      {/* Outer Border Frame */}
      <div className="flex-grow m-3 md:m-6 lg:m-8 border border-zinc-800/50 relative z-10 flex flex-col overflow-hidden">
        
        {/* Header containing Name and Navigation */}
        {view !== 'admin' && (
          <header className="flex w-full justify-between items-start pt-8 px-6 md:px-12 lg:px-16 md:pt-12 relative z-20 gap-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: view === 'home' ? 0 : 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className={`font-serif text-2xl tracking-tighter text-zinc-200 cursor-pointer hover:text-white transition-colors z-50 mix-blend-difference mt-4 md:mt-8 ${view === 'home' ? 'pointer-events-none' : ''}`}
              onClick={() => setView('home')}
            >
              Arbab <span className="italic text-orange-500/80">Mujtaba.</span>
            </motion.div>
            
            <div className="pt-4 md:pt-8 z-50">
              <Navigation activeView={view} setView={setView} />
            </div>
          </header>
        )}

        {/* Main Content Area Routing */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            className="relative flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -24, filter: 'blur(8px)' }}
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
