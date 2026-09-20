import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import Footer from '../components/Footer';
import { NumberedItem, RecLabel, StackedHeading, TagChip } from '../components/rushes';
import { getTechEntries, getFavoriteItems } from '../lib/cms';
import { detailPath } from '../lib/collections';
import { useOpenEntry } from '../lib/entryNavigation';
import { useMediaQuery } from '../lib/useMediaQuery';
import type { TechEntry, FavoriteItem } from '../types';

const EASE = [0.16, 1, 0.3, 1] as const;

/** `06/07/2026` → `06.07.2026`. Empty string for unparseable front-matter dates. */
function formatStamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed
    .toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\//g, '.');
}

export default function Tech() {
  const openEntry = useOpenEntry();
  const shouldReduceMotion = useReducedMotion();
  const isTouchDevice = useMediaQuery('(pointer: coarse), (max-width: 767px)');
  const flatten = shouldReduceMotion || isTouchDevice;

  // Load from CMS — already sorted newest first.
  const logs = useMemo(() => getTechEntries(), []);

  /** Entries grouped by their category, categories in newest-entry order. */
  const logGroups = useMemo(() => {
    const buckets = new Map<string, TechEntry[]>();
    logs.forEach((log) => {
      const key = log.category || 'Notes';
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.push(log);
      } else {
        buckets.set(key, [log]);
      }
    });
    return Array.from(buckets, ([category, entries]) => ({ category, entries }));
  }, [logs]);

  // "Things I Like" from the favorites collection.
  const techILikeItems = useMemo(() => {
    return getFavoriteItems()
      .filter((f) => f.visible && f.category === 'Things I Like')
      .sort((a, b) => a.order - b.order);
  }, []);

  const thingsILikeByGroup = useMemo(() => {
    return techILikeItems.reduce((acc, item) => {
      const group = item.group || 'Other';
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {} as Record<string, FavoriteItem[]>);
  }, [techILikeItems]);

  const latestStamp = logs.length > 0 ? formatStamp(logs[0].date) : '';

  return (
    <motion.div
      key="tech"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: flatten ? 0.25 : 0.8, ease: EASE }}
      className="relative flex flex-grow flex-col overflow-hidden"
    >
      <div className="page-shell custom-scrollbar relative z-10 flex-grow overflow-y-auto pt-0">
        {/* ===================== INTRO ===================== */}
        <div className="page-intro" data-mark="LOGS">
          <motion.div
            className="page-eyebrow"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          >
            <RecLabel>logs</RecLabel>
          </motion.div>

          <motion.h1
            className="page-title"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease: EASE }}
          >
            Tech
          </motion.h1>

          <motion.div
            className="page-description"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: EASE }}
          >
            <p>
              A digital laboratory, engineering notebook, and technical archive. Documenting
              experiments, systems, and implementation stories.
            </p>
          </motion.div>
        </div>

        {/* ===================== SPEC RULE ===================== */}
        <motion.dl
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: shouldReduceMotion ? 0.35 : 0.8, ease: EASE }}
          className="grid grid-cols-2 gap-y-6 border-y border-zinc-800 py-6 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 sm:grid-cols-3"
        >
          <div className="min-w-0">
            <dt>entries</dt>
            <dd className="mt-2 text-accent">{String(logs.length).padStart(2, '0')}</dd>
          </div>
          <div className="min-w-0">
            <dt>categories</dt>
            <dd className="mt-2 text-accent">{String(logGroups.length).padStart(2, '0')}</dd>
          </div>
          {latestStamp && (
            <div className="min-w-0">
              <dt>last entry</dt>
              <dd className="mt-2 text-accent">{latestStamp}</dd>
            </div>
          )}
        </motion.dl>

        {/* ===================== LOG INDEX ===================== */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: shouldReduceMotion ? 0.35 : 0.85, ease: EASE }}
          className="mt-20 md:mt-28"
        >
          <RecLabel>index</RecLabel>
          <StackedHeading
            lines={['build logs', 'and notes']}
            body="Grouped by category, newest entry first. Open a row for the full log."
            className="mt-7"
          />
        </motion.div>

        {logGroups.map((group, groupIndex) => (
          <section key={group.category} className="relative mt-14 md:mt-20">
            {/* Sticky category rule — stays legible over scrolling rows. */}
            <div className="sticky top-0 z-20 -mx-4 border-b border-zinc-800 bg-canvas/72 px-4 pb-4 pt-6 backdrop-blur-sm md:mx-0 md:px-0">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="flex min-w-0 items-baseline gap-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-300">
                  <span className="shrink-0 text-accent">
                    {String(groupIndex + 1).padStart(2, '0')}/
                  </span>
                  <span className="min-w-0 break-words">{group.category}</span>
                </h2>
                <span className="shrink-0 font-mono text-[10px] tracking-[0.2em] text-zinc-500">
                  {String(group.entries.length).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="border-t border-zinc-800">
              {group.entries.map((log, index) => (
                <NumberedItem
                  key={log.slug || `${group.category}-${index}`}
                  index={index + 1}
                  label={log.title}
                  description={log.excerpt}
                  meta={formatStamp(log.date)}
                  href={detailPath('tech', log.slug)}
                  onClick={() => openEntry('tech', log.slug)}
                  className="min-h-[44px]"
                />
              ))}
            </div>
          </section>
        ))}

        {/* ===================== THINGS I LIKE ===================== */}
        {Object.keys(thingsILikeByGroup).length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: shouldReduceMotion ? 0.35 : 0.85, ease: EASE }}
            className="mt-24 border-t border-zinc-800 pb-24 pt-7 md:mt-32 md:pb-32"
          >
            <RecLabel>likes</RecLabel>
            <StackedHeading
              lines={['things', 'i like']}
              size="text-3xl md:text-5xl lg:text-6xl"
              className="mt-7"
            />

            <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
              {Object.entries(thingsILikeByGroup).map(([group, items]) => (
                <div key={group} className="min-w-0">
                  <h3 className="border-b border-zinc-800 pb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                    <span className="min-w-0 break-words">{group}</span>
                  </h3>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {items.map((item) => (
                      <TagChip key={item.slug}>{item.title}</TagChip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        <Footer />
      </div>
    </motion.div>
  );
}
