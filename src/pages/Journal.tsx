import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ExploreArrow from '../components/ExploreArrow';
import ParallaxImage from '../components/ParallaxImage';
import Footer from '../components/Footer';
import ContentModal from '../components/ContentModal';
import SafeImage from '../components/SafeImage';
import { getJournalEntries } from '../lib/cms';
import { normalizeImagePath } from '../lib/image';
import { JournalEntry } from '../types';
import { Disc3 } from 'lucide-react';

const categoryDescriptions: Record<string, string> = {
  "Life": "Personal experiences, daily observations, and reflections on the passage of time.",
  "People": "Stories about meaningful people, conversations, and the impact of relationships.",
  "Travel": "Trips, places, memories, and observations from wandering.",
  "Thoughts": "Ideas, reflections, and lessons learned through building and breaking things.",
  "Milestones": "Important moments, achievements, and turning points in the journey."
};

const categoryTitles = ["Life", "People", "Travel", "Thoughts", "Milestones"];

export default function Journal() {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Load entries dynamically from markdown
  const entries = useMemo(() => getJournalEntries(), []);

  // Isolate featured essay (slug: growing-up) or default to the most recent entry
  const featuredEntry = useMemo(() => {
    const found = entries.find(e => e.slug === 'growing-up');
    return found || entries[0] || null;
  }, [entries]);

  // List of other posts grouped by category
  const groupedCategories = useMemo(() => {
    // Filter out featured post from the general list
    const remaining = entries.filter(e => !featuredEntry || e.slug !== featuredEntry.slug);
    
    return categoryTitles.map(cat => {
      const catEntries = remaining.filter(e => e.category === cat);
      return {
        title: cat,
        description: categoryDescriptions[cat] || "Reflections and stories within this space.",
        entries: catEntries
      };
    }).filter(group => group.entries.length > 0); // Only show categories with entries
  }, [entries, featuredEntry]);

  // Calculate read time based on body length
  const getReadTime = (body: string) => {
    const wordCount = body.trim().split(/\s+/).length;
    const time = Math.ceil(wordCount / 200);
    return `${time} min`;
  };

  return (
    <motion.div
      key="journal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex-grow flex flex-col relative overflow-hidden"
    >
      <div className="flex-grow overflow-y-auto custom-scrollbar px-4 sm:px-6 md:p-12 lg:p-16 pt-0 relative z-10 w-full max-w-5xl mx-auto">
        
        {/* Hero Section */}
        <div className="mb-16 md:mb-24 lg:mb-32 mt-8 sm:mt-12 md:mt-32 max-w-4xl relative overflow-hidden">
          <div className="absolute top-0 left-0 -translate-x-[5%] -translate-y-[25%] text-[3rem] sm:text-[5rem] md:text-[8rem] lg:text-[14rem] font-serif font-bold tracking-tighter opacity-100 select-none pointer-events-none text-outline z-0">
            JOURNAL
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-orange-500 mb-6 relative z-10 flex items-center gap-4"
          >
            <span>Home</span>
            <span className="w-1 h-1 rounded-full bg-orange-500/50"></span>
            <span>Journal</span>
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="font-serif font-medium text-4xl sm:text-5xl md:text-7xl lg:text-[7rem] leading-none text-zinc-100 tracking-tighter relative z-10"
          >
            Journal
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="mt-12 max-w-xl font-sans text-sm md:text-base text-zinc-400 font-light leading-relaxed relative z-10"
          >
            A personal archive of thoughts, late-night reflections, and milestones. Writing as a tool for figuring things out and finding stability in the noise of creating something real.
          </motion.div>
        </div>

        {/* Featured Story */}
        {featuredEntry && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setSelectedEntry(featuredEntry)}
            className="mb-32 cursor-pointer relative"
          >
            <div className="border border-zinc-800/80 bg-zinc-900/40 p-8 md:p-12 lg:p-16 relative overflow-hidden group">
               {/* Background Image / Texture overlay */}
               <div className="absolute inset-0 opacity-10 mix-blend-overlay group-hover:opacity-20 transition-opacity duration-1000">
                 {normalizeImagePath(featuredEntry.coverImage) ? (
                   <ParallaxImage 
                     src={featuredEntry.coverImage!}
                     alt={featuredEntry.title}
                     className="w-full h-full object-cover"
                   />
                 ) : (
                   <div className="w-full h-full bg-zinc-900" />
                 )}
               </div>
               
               <div className="relative z-10 flex flex-col md:flex-row gap-12 lg:gap-24">
                  <div className="md:w-3/5">
                    <div className="flex items-center gap-4 mb-8">
                      <span className="font-sans text-[9px] uppercase tracking-widest text-orange-500">Featured Entry</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                      <span className="font-sans text-[9px] uppercase tracking-widest text-zinc-500">Vol. 01</span>
                    </div>
                    
                    <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl text-zinc-100 leading-[1.15] mb-6">
                      {featuredEntry.title}
                    </h3>
                    
                    <article className="space-y-6 font-sans text-sm md:text-base text-zinc-400 font-light leading-relaxed mb-10">
                      <p>{featuredEntry.excerpt}</p>
                    </article>
                    
                    <div className="flex items-center gap-6 mt-8 p-4 border border-zinc-800/50 bg-zinc-950/50 w-full max-w-sm rounded-sm">
                       <Disc3 className="w-8 h-8 text-orange-500 animate-[spin_5s_linear_infinite]" strokeWidth={1} />
                       <div className="flex flex-col">
                          <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">On Rotation</span>
                          <div className="flex items-baseline gap-2">
                            <span className="font-serif italic text-zinc-200">I Told You Things</span>
                            <span className="font-sans text-xs text-zinc-500">— Gracie Abrams</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="md:w-2/5 flex flex-col justify-end">
                     <div className="mt-8 md:mt-0 flex flex-col items-start lg:items-end w-full">
                       <ExploreArrow label="Read Full Essay" direction="up-right" />
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {/* Journal Sections */}
        <div className="space-y-16 md:space-y-24 lg:space-y-32 mb-16 md:mb-24 lg:mb-32">
          {groupedCategories.map((section, idx) => (
            <motion.section 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 border-t border-zinc-800/80 pt-12"
            >
              <div className="lg:col-span-4">
                <div className="sticky top-24">
                  <h2 className="font-serif text-3xl md:text-4xl text-zinc-200 mb-2">{section.title}</h2>
                  <p className="font-sans text-sm text-zinc-400 font-light max-w-sm">{section.description}</p>
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600 mt-8 hidden lg:block">
                    {section.entries.length} Entries
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4 md:space-y-8">
                {section.entries.map((entry, entryIdx) => {
                  const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  });
                  return (
                    <article 
                      key={entryIdx} 
                      onClick={() => setSelectedEntry(entry)}
                      className="group cursor-pointer flex flex-col md:flex-row justify-between md:items-center py-6 border-b border-zinc-800/30 hover:border-orange-500/30 transition-colors gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-zinc-500">{formattedDate}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-800 hidden sm:block"></span>
                          <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-zinc-600 hidden sm:block">{getReadTime(entry.body)} read</span>
                        </div>
                        <h3 className="font-serif text-xl md:text-2xl text-zinc-300 group-hover:text-white transition-colors duration-300">
                          {entry.title}
                        </h3>
                      </div>
                      <div className="mt-2 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-500 hidden md:block">
                        <ExploreArrow direction="right" label="Explore" />
                      </div>
                      {/* Mobile arrow */}
                      <div className="md:hidden mt-2">
                         <ExploreArrow direction="right" label="Explore" />
                      </div>
                    </article>
                  );
                })}
              </div>
            </motion.section>
          ))}
        </div>

        <Footer />
      </div>

      {/* Dynamic Content Overlay Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <ContentModal 
            isOpen={!!selectedEntry}
            onClose={() => setSelectedEntry(null)}
            title={selectedEntry.title}
            category={selectedEntry.category}
            date={new Date(selectedEntry.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            coverImage={selectedEntry.coverImage}
            excerpt={selectedEntry.excerpt}
            body={selectedEntry.body}
            customization={selectedEntry.customization}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
