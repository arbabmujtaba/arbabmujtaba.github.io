/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import Journal from './pages/Journal';
import Tech from './pages/Tech';
import Photography from './pages/Photography';
import Collection from './pages/Collection';
import FloatingMagicalArrow from './components/FloatingMagicalArrow';

export default function App() {
  const [view, setView] = useState('home');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative box-border selection:bg-orange-500/30">
      {/* Noise Texture Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Outer Border Frame */}
      <div className="flex-grow m-3 md:m-6 lg:m-8 border border-zinc-800/50 relative z-10 flex flex-col overflow-hidden">
        
        {/* Header containing Name and Navigation */}
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

        {/* Main Content Area Routing */}
        <AnimatePresence mode="wait">
          {view === 'home' && <Home key="home" setView={setView} />}
          {view === 'portfolio' && <Portfolio key="portfolio" />}
          {view === 'journal' && <Journal key="journal" />}
          {view === 'tech' && <Tech key="tech" />}
          {view === 'photography' && <Photography key="photography" />}
          {view === 'collection' && <Collection key="collection" />}
        </AnimatePresence>

        <FloatingMagicalArrow />
        
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-500/30"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-500/30"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-500/30"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-500/30"></div>
      </div>
    </div>
  );
}

