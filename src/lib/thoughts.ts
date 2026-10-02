/**
 * Thoughts from the archive — real lines, never generated ones.
 *
 * Sources, in order: `thought` blocks written in /admin (home collection), the
 * home page notes (`quote` blocks), and sentences lifted from the journal. The
 * journal extraction is deliberately conservative: a line has to stand on its
 * own, so anything that leans on a person, a quote, or the sentence before it
 * is left where it was written.
 */

import { getHomeConfig, getJournalEntries } from './cms';
import { linesFrom } from './thoughtLines';

export interface Thought {
  id: string;
  text: string;
  /** Where it came from, in words. */
  source: string;
  /** In-site link to the source, when it has a page. */
  href?: string;
}

let cache: Thought[] | null = null;

export function getArchiveThoughts(): Thought[] {
  if (cache) return cache;
  const out: Thought[] = [];
  const seen = new Set<string>();
  const push = (thought: Thought) => {
    const key = thought.text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(thought);
  };

  const home = getHomeConfig().filter((entry) => entry.visible);
  home
    .filter((entry) => entry.configType === 'thought')
    .forEach((entry) => push({ id: `thought:${entry.slug}`, text: entry.title, source: entry.description || 'A loose page' }));
  home
    .filter((entry) => entry.configType === 'quote')
    .forEach((entry) => push({ id: `note:${entry.slug}`, text: entry.title, source: 'From the notes on the desk' }));

  getJournalEntries().forEach((entry) => {
    linesFrom(entry.body).forEach((text, i) =>
      push({
        id: `journal:${entry.slug}:${i}`,
        text,
        source: `${entry.title}${entry.volume ? ` · Vol. ${String(entry.volume).padStart(2, '0')}` : ''}`,
        href: `/journal/${entry.slug}`,
      })
    );
  });

  cache = out;
  return out;
}
