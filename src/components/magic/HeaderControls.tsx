import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Glyph from './Glyph';
import { readFlag, useMagic, WAND_EVENT, WAND_TOUCHED, type ThemePref } from '../../lib/magic';

const EASE = [0.16, 1, 0.3, 1] as const;

const THEME_OPTIONS: { id: ThemePref; label: string; note: string; glyph: string }[] = [
  { id: 'night', label: 'Night', note: 'Ink, a few stars', glyph: 'moon' },
  { id: 'day', label: 'Day', note: 'Paper, plain light', glyph: 'sun' },
  { id: 'auto', label: 'Follow the clock', note: 'Day from 6 to 6', glyph: 'clock' },
];

/**
 * HeaderControls — the two instruments in the header.
 *
 * The wand is a toggle (aria-pressed) — the only way into the hidden layer's
 * pointer effects, and the same button puts it away. The sky button opens a
 * small menu: night, day or follow the clock, and the ambient sound switch,
 * which is off until someone turns it on.
 *
 * Until the wand has been picked up once it wears a small gilt dot — the one
 * sign, on a phone, that the header holds more than navigation. When the
 * first-visit invitation is shown (MagicLayer) the wand rings twice.
 */
export default function HeaderControls() {
  const { wand, setWand, theme, themePref, setThemePref, sound, setSound } = useMagic();
  const reduced = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [untouched, setUntouched] = useState(() => !readFlag(WAND_TOUCHED));
  const [beckon, setBeckon] = useState(0);

  useEffect(() => {
    const onWand = (event: Event) => {
      const what = (event as CustomEvent<'beckon' | 'touched'>).detail;
      if (what === 'touched') setUntouched(false);
      else setBeckon((n) => n + 1);
    };
    window.addEventListener(WAND_EVENT, onWand);
    return () => window.removeEventListener(WAND_EVENT, onWand);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !buttonRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const iconButton =
    'relative flex h-11 w-11 items-center justify-center rounded-full border text-zinc-300 transition-colors duration-300 hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent';

  return (
    <div className="relative flex items-center gap-1.5">
      <button
        type="button"
        aria-pressed={wand}
        aria-label={wand ? 'Put the wand away' : untouched ? 'Pick up the wand — this archive has a hidden layer' : 'Pick up the wand'}
        title={wand ? 'Put the wand away' : 'Pick up the wand'}
        onClick={() => setWand(!wand)}
        className={`${iconButton} ${wand ? 'border-gilt/60 text-gilt' : 'border-transparent hover:border-zinc-800'}`}
      >
        <Glyph name="wand" size={18} />
        {untouched && !wand && (
          <span aria-hidden="true" className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gilt shadow-[0_0_8px_var(--gilt)]" />
        )}
        {/* two rings, once, when the invitation points here — never a loop */}
        {beckon > 0 && !wand && !reduced && (
          <span key={beckon} aria-hidden="true" className="pointer-events-none absolute inset-0">
            {[0, 1].map((ring) => (
              <motion.span
                key={ring}
                className="absolute inset-0 rounded-full border border-gilt"
                initial={{ opacity: 0.8, scale: 0.8 }}
                animate={{ opacity: 0, scale: 1.9 }}
                transition={{ duration: 1.4, delay: ring * 0.7, ease: EASE }}
              />
            ))}
          </span>
        )}
        {wand && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ boxShadow: '0 0 18px color-mix(in srgb, var(--gilt) 45%, transparent)' }}
          />
        )}
      </button>

      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`Light: ${theme === 'day' ? 'day' : 'night'}. Change`}
        title="Day, night and sound"
        onClick={() => setMenuOpen((open) => !open)}
        className={`${iconButton} border-transparent hover:border-zinc-800`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ opacity: 0, rotate: -40, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 40, scale: 0.7 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="flex"
          >
            <Glyph name={theme === 'day' ? 'sun' : 'moon'} size={17} />
          </motion.span>
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={menuRef}
            role="menu"
            aria-label="Light and sound"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-[80] w-64 origin-top-right rounded-[4px] border border-zinc-800 bg-canvas-raised p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]"
          >
            {THEME_OPTIONS.map((option) => {
              const active = themePref === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => setThemePref(option.id)}
                  className={`flex min-h-[44px] w-full items-center gap-3 rounded-[3px] px-3 py-2 text-left transition-colors ${
                    active ? 'bg-well text-zinc-50' : 'text-zinc-300 hover:bg-well hover:text-zinc-50'
                  }`}
                >
                  <Glyph name={option.glyph} size={16} className={active ? 'text-accent' : 'text-zinc-500'} />
                  <span className="flex-1">
                    <span className="block text-sm">{option.label}</span>
                    <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">{option.note}</span>
                  </span>
                  {active && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />}
                </button>
              );
            })}
            <div className="my-2 h-px bg-zinc-800" />
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={sound}
              onClick={() => setSound(!sound)}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-[3px] px-3 py-2 text-left text-zinc-300 transition-colors hover:bg-well hover:text-zinc-50"
            >
              <span className="flex-1">
                <span className="block text-sm">Ambient sound</span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  {sound ? 'a quiet room, on' : 'off — nothing plays'}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`relative h-5 w-9 rounded-full border transition-colors ${sound ? 'border-accent bg-accent/25' : 'border-zinc-700'}`}
              >
                <span
                  className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full transition-[left,background-color] duration-300 ${
                    sound ? 'left-[1.15rem] bg-accent' : 'left-1 bg-zinc-500'
                  }`}
                />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
