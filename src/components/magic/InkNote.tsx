import { getInk } from '../../lib/secrets';
import type { InkSection } from '../../types';

/**
 * InkNote — marginalia in invisible ink. Present in the page, masked to
 * nothing, and uncovered only where the wand's Lumos light falls (see
 * `.invisible-ink` in index.css and WandEffects in MagicLayer). Written in
 * /admin as secrets of kind `ink`.
 */
export default function InkNote({ section, className = '' }: { section: InkSection; className?: string }) {
  const notes = getInk(section);
  if (notes.length === 0) return null;
  return (
    <div aria-hidden="true" className={`invisible-ink ${className}`}>
      {notes.map((note) => (
        <p key={note.slug} className="max-w-[18rem] leading-snug">
          <span className="block text-xl md:text-2xl">{note.title}</span>
          {note.description && <span className="mt-1 block text-sm opacity-80">{note.description}</span>}
        </p>
      ))}
    </div>
  );
}
