import { useCallback, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import Footer from '../components/Footer';
import JournalCard from '../components/JournalCard';
import { RecLabel, StackedHeading } from '../components/rushes';
import { getJournalEntries } from '../lib/cms';
import { useOpenEntry } from '../lib/entryNavigation';
import { useMediaQuery } from '../lib/useMediaQuery';
import { JournalEntry } from '../types';

const EASE = [0.16, 1, 0.3, 1] as const;

/* --------------------------------------------------------------------------
   BONE SURFACE INK CORRECTION
   --------------------------------------------------------------------------
   `data-surface="bone"` inverts the whole subtree, but the two faintest ink
   slots collapse toward the paper when it does. Measured against the bone
   background (`--rushes-bone`):

     --ink-5 (text-zinc-500)  2.75:1   fails even the 3:1 large-text floor
     --ink-4 (text-zinc-400)  3.89:1   fails the 4.5:1 body-text floor
     --ink-6 (text-zinc-600)  2.11:1   fails everything
     --ink-3 (text-zinc-300)  6.52:1   passes AA for body text

   The dim resting states live inside primitives (NumberedItem, Accordion,
   RecLabel) and inside the shared `.page-description` rule in index.css —
   neither of which this page may edit — so the correction is applied once, at
   the token level, for this subtree only: zinc-400 and zinc-500 resolve to the
   zinc-300 ink, and zinc-600 steps up to the old zinc-400 value. Both objects
   reference the surface's own tokens, so there are no colour literals here and
   the dark surface is untouched.

   Two elements are needed because custom properties resolve against the values
   cascaded on the *same* element: --ink-6 must read --ink-4 before --ink-4 is
   itself reassigned, so the faint step is set on the outer element and the
   muted steps on the inner one.
   -------------------------------------------------------------------------- */
const BONE_FAINT_INK = { '--ink-6': 'var(--ink-4)' } as React.CSSProperties;
const BONE_MUTED_INK = {
  '--ink-4': 'var(--ink-3)',
  '--ink-5': 'var(--ink-3)',
} as React.CSSProperties;

export default function Journal() {
  const openEntry = useOpenEntry();
  const shouldReduceMotion = useReducedMotion();
  const isTouchDevice = useMediaQuery('(pointer: coarse), (max-width: 767px)');

  /** Opening an entry pushes `/journal/<slug>`; App renders the quick look. */
  const handleOpen = useCallback(
    (entry: JournalEntry) => openEntry('journal', entry.slug),
    [openEntry]
  );

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
      transition={{ duration: shouldReduceMotion || isTouchDevice ? 0.2 : 0.8, ease: EASE }}
      className="relative flex h-full flex-grow flex-col overflow-hidden"
    >
      {/* The reading page is printed on paper. bg-canvas resolves to bone inside
          the surface, so the sheet is opaque and fills the frame; the modal is
          deliberately mounted outside it and stays on the dark surface. */}
      <div
        data-surface="bone"
        style={BONE_FAINT_INK}
        className="custom-scrollbar relative z-10 w-full flex-grow overflow-y-auto bg-canvas"
      >
        <div style={BONE_MUTED_INK} className="flex min-h-full flex-col">
          <div className="page-shell">
            <header className="page-intro" data-mark="JOURNAL">
              <RecLabel>journal</RecLabel>

              <motion.h1
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.3 : 0.95, delay: 0.1, ease: EASE }}
                className="page-title mt-7"
              >
                journal
              </motion.h1>

              <motion.p
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.3 : 0.9, delay: 0.2, ease: EASE }}
                className="page-description"
              >
                A personal archive of thoughts, late-night reflections, and milestones. Writing as a
                tool for figuring things out and finding stability in the noise of creating something
                real.
              </motion.p>

              {entries.length > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
                  className="mt-9 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400"
                >
                  <span>
                    {String(entries.length).padStart(2, '0')}{' '}
                    {entries.length === 1 ? 'volume' : 'volumes'}
                  </span>
                  <span aria-hidden="true" className="h-px w-5 bg-zinc-700" />
                  <span>newest first</span>
                </motion.p>
              )}
            </header>

            {/* Latest volume — the newest published entry, as the reading hero */}
            {featuredEntry && (
              <section className="border-t border-zinc-800 pt-12 md:pt-16">
                <RecLabel>latest</RecLabel>
                <div className="mt-10 md:mt-14">
                  <JournalCard entry={featuredEntry} variant="featured" onOpen={handleOpen} />
                </div>
              </section>
            )}

            {/* The archive — older entries, same card, smaller plate */}
            {archiveEntries.length > 0 && (
              <section className="mt-24 border-t border-zinc-800 pt-12 md:mt-36 md:pt-16">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                  <div>
                    <RecLabel>past volumes</RecLabel>
                    <StackedHeading
                      lines={['the', 'archive']}
                      body="Earlier entries from the journal — every chapter kept in full editorial detail."
                      className="mt-7"
                    />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                    {String(archiveEntries.length).padStart(2, '0')}{' '}
                    {archiveEntries.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                <div className="mt-14 grid grid-cols-1 gap-14 md:grid-cols-2 md:gap-10">
                  {archiveEntries.map((entry, idx) => (
                    <JournalCard
                      key={entry.slug}
                      entry={entry}
                      variant="archive"
                      index={idx}
                      onOpen={handleOpen}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          <Footer />
        </div>
      </div>
    </motion.div>
  );
}
