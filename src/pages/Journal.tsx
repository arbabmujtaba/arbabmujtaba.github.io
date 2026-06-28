import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Footer from '../components/Footer';
import ContentModal from '../components/ContentModal';
import JournalCard, { DEFAULT_JOURNAL_COVER } from '../components/JournalCard';
import { getJournalEntries } from '../lib/cms';
import { JournalEntry } from '../types';

export default function Journal() {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Entries arrive already filtered (published only), sorted newest-first,
  // and with volume / reading time resolved by the CMS layer.
  const entries = useMemo(() => getJournalEntries(), []);

  // The newest published entry is always the featured hero; everything older
  // automatically falls back into the archive grid — no manual flagging.
  const featuredEntry = entries[0] || null;
  const archiveEntries = useMemo(() => entries.slice(1), [entries]);

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

        {/* Featured Story — the newest published entry, as a cinematic hero card */}
        {featuredEntry && (
          <div className="mb-24 md:mb-32">
            <JournalCard
              entry={featuredEntry}
              variant="featured"
              onOpen={setSelectedEntry}
            />
          </div>
        )}

        {/* The Archive — older entries, image-first cards sharing the same design system */}
        {archiveEntries.length > 0 && (
          <section className="mb-16 md:mb-24 lg:mb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-end justify-between border-t border-zinc-800/80 pt-10 mb-10 md:mb-12"
            >
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-zinc-200">The Archive</h2>
                <p className="mt-2 max-w-md font-sans text-sm text-zinc-400 font-light">
                  Earlier entries from the journal — every chapter kept in full editorial detail.
                </p>
              </div>
              <div className="hidden md:block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                {archiveEntries.length} {archiveEntries.length === 1 ? 'Entry' : 'Entries'}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {archiveEntries.map((entry, idx) => (
                <JournalCard
                  key={entry.slug}
                  entry={entry}
                  variant="archive"
                  index={idx}
                  onOpen={setSelectedEntry}
                />
              ))}
            </div>
          </section>
        )}

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
            coverImage={selectedEntry.featuredImage || selectedEntry.coverImage || DEFAULT_JOURNAL_COVER}
            excerpt={selectedEntry.excerpt}
            body={selectedEntry.body}
            customization={selectedEntry.customization}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
