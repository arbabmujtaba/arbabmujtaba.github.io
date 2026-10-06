import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import Glyph from './Glyph';
import {
  castSpell,
  COLLECTIBLES,
  cue,
  INVITED,
  PALETTE_EVENT,
  prefetchRooms,
  readFlag,
  SPELL_EVENT,
  useMagic,
  WAND_EVENT,
  WAND_TOUCHED,
  writeFlag,
  type CollectibleId,
} from '../../lib/magic';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { getArchiveThoughts } from '../../lib/thoughts';
import { navigate } from '../../lib/navigation';
import { getEgg, isEggEnabled, isRoomEnabled } from '../../lib/secrets';
import { isCircle, isShake, type Point } from '../../lib/gestures';

const Rooms = lazy(prefetchRooms);
const Palette = lazy(() => import('./Palette'));

const EASE = [0.16, 1, 0.3, 1] as const;

/** Which collectibles exist, given what the author has switched on in /admin. */
export function availableCollectibles() {
  const enabled: Record<CollectibleId, boolean> = {
    lantern: isEggEnabled('lumos'),
    key: isRoomEnabled('library'),
    lens: isRoomEnabled('darkroom'),
    star: isEggEnabled('constellation'),
    seal: isEggEnabled('seal'),
    compass: true,
    quill: true,
  };
  return COLLECTIBLES.filter((item) => enabled[item.id]);
}

// ---------------------------------------------------------------------------
// Wand: trail, sparks and the two gestures
// ---------------------------------------------------------------------------

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  hue: number;
}

function WandEffects() {
  const { wand, setWand, lumos, setLumos, theme } = useMagic();
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);

  // Trail and sparks. One canvas, one pool, a frame loop that only runs while
  // something is alive.
  useEffect(() => {
    if (!wand) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext('2d');
    if (!g) return;

    const particles: Particle[] = [];
    const path: Point[] = [];
    let frame = 0;
    let last: Point | null = null;
    let cooldown = 0;
    let pointer = { x: -999, y: -999 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const spawn = (x: number, y: number, count: number, spread: number) => {
      if (reduced) return;
      for (let i = 0; i < count && particles.length < 120; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * spread;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.15,
          life: 0,
          max: 520 + Math.random() * 520,
          size: 0.6 + Math.random() * 1.6,
          hue: 38 + Math.random() * 14,
        });
      }
      if (!frame) frame = requestAnimationFrame(tick);
    };

    let previous = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - previous);
      previous = now;
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.globalCompositeOperation = theme === 'night' ? 'lighter' : 'source-over';
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.max) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        p.vy += 0.004 * dt;
        const fade = 1 - p.life / p.max;
        const light = theme === 'night' ? 78 : 42;
        g.fillStyle = `hsla(${p.hue}, 80%, ${light}%, ${fade})`;
        g.beginPath();
        // Four-point sparkle for the bigger ones, a dot for the rest.
        if (p.size > 1.6) {
          const s = p.size * 1.8 * fade + 0.4;
          g.moveTo(p.x, p.y - s);
          g.lineTo(p.x + s * 0.28, p.y);
          g.lineTo(p.x, p.y + s);
          g.lineTo(p.x - s * 0.28, p.y);
          g.closePath();
        } else {
          g.arc(p.x, p.y, p.size * fade + 0.2, 0, Math.PI * 2);
        }
        g.fill();
      }
      frame = particles.length > 0 ? requestAnimationFrame(tick) : 0;
      if (!frame) g.clearRect(0, 0, canvas.width, canvas.height);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      pointer = { x: event.clientX, y: event.clientY };
      const now = performance.now();
      const point = { x: event.clientX, y: event.clientY, t: now };
      if (last && Math.hypot(point.x - last.x, point.y - last.y) < 7) return;
      if (last) spawn(point.x, point.y, 1, 0.5);
      last = point;

      // Gestures are read from the hovering path, never from a drag, so they
      // can't collide with selecting text.
      if (event.buttons !== 0) {
        path.length = 0;
        return;
      }
      path.push(point);
      while (path.length && now - path[0].t > 1100) path.shift();
      if (now < cooldown) return;
      if (isCircle(path)) {
        cooldown = now + 1200;
        path.length = 0;
        spawn(point.x, point.y, 26, 2.4);
        castSpell(lumosRef.current ? 'nox' : 'lumos', pointer);
      } else if (isShake(path.slice(-14))) {
        cooldown = now + 1500;
        path.length = 0;
        spawn(point.x, point.y, 18, 1.8);
        castSpell('leviosa', pointer);
      }
    };

    const onDown = (event: PointerEvent) => {
      spawn(event.clientX, event.clientY, event.pointerType === 'touch' ? 14 : 10, 1.9);
      cue('spark');
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [wand, reduced, theme]);

  const lumosRef = useRef(lumos);
  lumosRef.current = lumos;

  // A phone has no hovering pointer to shake, so shaking the phone itself
  // levitates. Only where motion events need no permission prompt (Android):
  // iOS asks for one, and a dialog is not a spell.
  useEffect(() => {
    if (!wand || reduced || typeof DeviceMotionEvent === 'undefined') return;
    if (typeof (DeviceMotionEvent as unknown as { requestPermission?: unknown }).requestPermission === 'function') return;
    const peaks: number[] = [];
    let cooldown = 0;
    const onMotion = (event: DeviceMotionEvent) => {
      const a = event.acceleration;
      if (!a || a.x === null || a.y === null || a.z === null) return;
      const now = performance.now();
      if (now < cooldown || Math.hypot(a.x, a.y, a.z) < 16) return;
      if (peaks.length && now - peaks[peaks.length - 1] < 90) return; // one peak per swing
      peaks.push(now);
      while (peaks.length && now - peaks[0] > 900) peaks.shift();
      if (peaks.length >= 3) {
        peaks.length = 0;
        cooldown = now + 1500;
        castSpell('leviosa', { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      }
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [wand, reduced]);

  // Escape puts the wand away (unless something else is open and wants it).
  useEffect(() => {
    if (!wand) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('[aria-modal="true"]')) setWand(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wand, setWand]);

  // Lumos: a light that follows the pointer and the ink it uncovers.
  useEffect(() => {
    if (!lumos) return;
    let frame = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    const paint = () => {
      frame = 0;
      lightRef.current?.style.setProperty('--lx', `${x}px`);
      lightRef.current?.style.setProperty('--ly', `${y}px`);
      document.querySelectorAll<HTMLElement>('.invisible-ink').forEach((node) => {
        const rect = node.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
        node.style.setProperty('--mx', `${x - rect.left}px`);
        node.style.setProperty('--my', `${y - rect.top}px`);
      });
    };
    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    paint();
    // A finger has no hover: the light goes where the page is touched.
    window.addEventListener('pointerdown', onMove, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointerdown', onMove);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, [lumos]);

  return (
    <>
      {wand && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[210]"
        />
      )}
      <AnimatePresence>
        {lumos && (
          <motion.div
            ref={lightRef}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[150] night-or-day"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            style={{
              background:
                'radial-gradient(circle 260px at var(--lx, 50%) var(--ly, 50%), color-mix(in srgb, var(--gilt) 14%, transparent) 0%, transparent 55%, rgba(8, 6, 3, 0.42) 100%)',
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/** The chip that appears while the wand is out: what it can do, and buttons for it. */
function Spellbook() {
  const { wand, setWand, lumos } = useMagic();
  const spell =
    'min-h-[44px] shrink-0 rounded-full px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-gilt transition-colors hover:bg-well md:px-3.5 md:tracking-[0.18em]';
  return (
    <AnimatePresence>
      {wand && (
        <motion.div
          role="region"
          aria-label="Wand"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="fixed bottom-[5.5rem] right-3 z-[160] flex max-w-[calc(100vw-6.5rem)] items-center gap-1 rounded-full border border-gilt/40 bg-canvas-raised/95 py-0.5 pl-1.5 pr-1 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] backdrop-blur md:bottom-8 md:left-1/2 md:right-auto md:max-w-[calc(100vw-1.5rem)] md:-translate-x-1/2 md:px-2 md:py-1.5"
        >
          <span className="hidden shrink-0 pl-3 pr-2 font-book text-sm italic text-zinc-300 xl:inline">
            draw a circle in the air for light · shake for levitation · ⌘K for the index
          </span>
          {/* On a narrow phone the spells scroll sideways; the way out stays put. */}
          <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button type="button" aria-pressed={lumos} onClick={() => castSpell(lumos ? 'nox' : 'lumos')} className={spell}>
              {lumos ? 'nox' : 'lumos'}
            </button>
            <button type="button" onClick={() => castSpell('revelio')} className={spell}>
              revelio
            </button>
            <button type="button" onClick={() => castSpell('accio')} className={spell}>
              accio
            </button>
            <button
              type="button"
              onClick={() => castSpell('leviosa', { x: window.innerWidth / 2, y: window.innerHeight / 2 })}
              className={spell}
            >
              leviosa
            </button>
          </div>
          <button
            type="button"
            onClick={() => setWand(false)}
            aria-label="Put the wand away"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-well hover:text-zinc-50"
          >
            <X size={15} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Spells, typed or cast
// ---------------------------------------------------------------------------

/** How long Revelio keeps the hidden things lit. */
const REVEAL_MS = 2800;

function SpellHandler() {
  const { setLumos, setThemePref, openRoom, closeRoom, setLedgerOpen, whisperOf, collect, setWand } = useMagic();

  useEffect(() => {
    const onSpell = (event: Event) => {
      const { spell, x, y } = (event as CustomEvent<{ spell: string; x?: number; y?: number }>).detail;
      if (spell === 'lumos') {
        setLumos(true);
        const egg = getEgg('lumos');
        if (isEggEnabled('lumos')) {
          whisperOf(egg?.title || 'Lumos', egg?.body || 'Move the light across the page.', 'lantern');
          collect('lantern');
        }
      } else if (spell === 'nox') {
        setLumos(false);
      } else if (spell === 'alohomora') {
        if (!isEggEnabled('alohomora') || !isRoomEnabled('library')) return;
        const egg = getEgg('alohomora');
        whisperOf(egg?.title || 'Alohomora', egg?.description || 'Somewhere, a door unlocked.', 'key');
        window.setTimeout(() => openRoom('library'), 700);
      } else if (spell === 'revelio') {
        // Everything enchanted that is on screen right now shows itself for a
        // moment — counted by kind, so seven stars are one thing, not seven.
        const kinds = new Set<string>();
        document.querySelectorAll<HTMLElement>('[data-enchanted]').forEach((node) => {
          const rect = node.getBoundingClientRect();
          if (rect.width === 0 || rect.bottom < 0 || rect.top > window.innerHeight) return;
          kinds.add(node.dataset.enchanted || 'thing');
          node.classList.remove('is-revealed');
          void node.offsetWidth;
          node.classList.add('is-revealed');
          window.setTimeout(() => node.classList.remove('is-revealed'), REVEAL_MS);
        });
        cue('spark');
        const n = kinds.size;
        whisperOf(
          'Revelio',
          n === 0
            ? 'Nothing on this screen is hiding. Try somewhere else on the page.'
            : n === 1
              ? 'One thing in view is not what it seems.'
              : `${n} things in view are not what they seem.`,
          'star'
        );
      } else if (spell === 'accio') {
        // A line flies out of the journal.
        const lines = getArchiveThoughts();
        if (lines.length === 0) return;
        const line = lines[Math.floor(Math.random() * lines.length)];
        cue('spark');
        whisperOf(
          `“${line.text}”`,
          line.source,
          'quill',
          line.href ? { label: 'read where it came from', glyph: 'quill', run: () => navigate(line.href!) } : undefined
        );
      } else if (spell === 'mischief') {
        setLumos(false);
        setWand(false);
        closeRoom();
        setLedgerOpen(false);
        whisperOf('Mischief managed.', 'The wand is put away and the page is plain again — until next time.', 'seal');
      } else if (spell === 'leviosa') {
        const cx = x ?? window.innerWidth / 2;
        const cy = y ?? window.innerHeight / 2;
        const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-enchanted], [data-levitate]'))
          .map((node) => ({ node, rect: node.getBoundingClientRect() }))
          .filter(({ rect }) => rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0)
          .sort(
            (a, b) =>
              Math.hypot(a.rect.left + a.rect.width / 2 - cx, a.rect.top + a.rect.height / 2 - cy) -
              Math.hypot(b.rect.left + b.rect.width / 2 - cx, b.rect.top + b.rect.height / 2 - cy)
          )
          .slice(0, 6);
        nodes.forEach(({ node }, i) => {
          window.setTimeout(() => {
            node.classList.remove('is-levitating');
            void node.offsetWidth;
            node.classList.add('is-levitating');
            node.addEventListener('animationend', () => node.classList.remove('is-levitating'), { once: true });
          }, i * 90);
        });
      }
    };
    window.addEventListener(SPELL_EVENT, onSpell);
    return () => window.removeEventListener(SPELL_EVENT, onSpell);
  }, [setLumos, openRoom, closeRoom, setLedgerOpen, setWand, whisperOf, collect]);

  // Incantations typed anywhere outside a text field.
  useEffect(() => {
    let buffer = '';
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.key.length !== 1) return;
      buffer = (buffer + event.key.toLowerCase()).slice(-24);
      if (buffer.endsWith('mischief managed')) {
        buffer = '';
        castSpell('mischief');
      } else if (buffer.endsWith('revelio')) {
        buffer = '';
        setWand(true);
        castSpell('revelio');
      } else if (buffer.endsWith('accio')) {
        buffer = '';
        castSpell('accio');
      } else if (buffer.endsWith('lumos')) {
        buffer = '';
        setWand(true);
        castSpell('lumos');
      } else if (buffer.endsWith('nox')) {
        buffer = '';
        castSpell('nox');
        setThemePref('night');
      } else if (buffer.endsWith('alohomora')) {
        buffer = '';
        castSpell('alohomora');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setWand, setThemePref]);

  // For the engineers who open devtools first.
  useEffect(() => {
    if (!isEggEnabled('console')) return;
    const egg = getEgg('console');
    const title = egg?.title || 'For whoever opens the console';
    const body = egg?.body || 'This archive has a hidden layer. Type lumos anywhere on the page.';
    // eslint-disable-next-line no-console
    console.log(
      `%c✦ ${title}%c\n${body}`,
      'font: italic 16px Georgia, serif; color: #d9b46a; padding: 6px 0;',
      'font: 12px ui-monospace, monospace; color: #9a9a9e;'
    );
  }, []);

  return null;
}

// ---------------------------------------------------------------------------
// Whispers, the ledger, sound
// ---------------------------------------------------------------------------

function WhisperToast() {
  const { whisper, dismissWhisper } = useMagic();
  useEffect(() => {
    if (!whisper) return;
    const timer = window.setTimeout(dismissWhisper, whisper.action ? 12000 : 6500);
    return () => window.clearTimeout(timer);
  }, [whisper, dismissWhisper]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[230] flex justify-center px-3 md:top-6">
      <AnimatePresence>
        {whisper && (
          <motion.div
            key={whisper.id}
            initial={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.6, ease: EASE }}
            className="manuscript pointer-events-auto flex max-w-md items-start gap-3 rounded-[3px] px-5 py-4 shadow-[0_30px_70px_-25px_rgba(0,0,0,0.7)]"
          >
            {whisper.glyph && <Glyph name={whisper.glyph} size={22} className="mt-0.5 shrink-0 text-gilt" />}
            <div className="min-w-0">
              <p className="font-book text-lg italic leading-tight text-zinc-50">{whisper.title}</p>
              {whisper.body && <p className="mt-1 font-book text-[0.95rem] leading-snug text-zinc-300">{whisper.body}</p>}
              {whisper.action && (
                <button
                  type="button"
                  onClick={() => {
                    // Dismiss first: the action may raise a whisper of its own.
                    const action = whisper.action;
                    dismissWhisper();
                    action?.run();
                  }}
                  className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gilt/60 px-4 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt transition-colors hover:bg-gilt/10"
                >
                  <Glyph name={whisper.action.glyph ?? 'wand'} size={14} />
                  {whisper.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={dismissWhisper}
              aria-label="Dismiss"
              className="-mr-2 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-100"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Ledger({ invited }: { invited: boolean }) {
  const { found, ledgerOpen, setLedgerOpen, openRoom, forgetEverything } = useMagic();
  const available = useMemo(availableCollectibles, []);
  const foundHere = available.filter((item) => found.includes(item.id));
  const complete = available.length > 0 && foundHere.length === available.length;
  const panelRef = useRef<HTMLDivElement>(null);

  // Discoveries are acknowledged quietly: a chime (if sound is on) and the
  // ledger counter ticking up — no "found" popup.
  useEffect(() => {
    const onFound = (event: Event) => {
      const id = (event as CustomEvent<CollectibleId>).detail;
      if (!available.some((c) => c.id === id)) return;
      cue('chime');
    };
    window.addEventListener('archive:found', onFound);
    return () => window.removeEventListener('archive:found', onFound);
  }, [available]);

  useEffect(() => {
    if (!ledgerOpen) return;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setLedgerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ledgerOpen, setLedgerOpen]);

  // Hidden until there is a reason for it: something found, or the visitor
  // having been told there is something to find.
  if (foundHere.length === 0 && !ledgerOpen && !invited) return null;

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setLedgerOpen(!ledgerOpen)}
        aria-expanded={ledgerOpen}
        aria-label={`Your ledger: ${foundHere.length} of ${available.length} found`}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="fixed bottom-[5.5rem] left-3 z-[140] flex h-11 items-center gap-2 rounded-full border border-gilt/40 bg-canvas-raised/90 pl-3 pr-3.5 text-gilt shadow-[0_16px_40px_-18px_rgba(0,0,0,0.6)] backdrop-blur transition-colors hover:border-gilt md:bottom-8 md:left-8"
      >
        <Glyph name={complete ? 'door' : 'star'} size={16} />
        <span className="font-mono text-[10px] tracking-[0.16em]">
          {foundHere.length}/{available.length}
        </span>
      </motion.button>

      <AnimatePresence>
        {ledgerOpen && (
          <motion.div
            className="fixed inset-0 z-[180] flex items-end justify-start p-3 md:items-end md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close the ledger"
              className="absolute inset-0 cursor-default bg-black/30"
              onClick={() => setLedgerOpen(false)}
            />
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="The ledger"
              tabIndex={-1}
              initial={{ opacity: 0, y: 24, rotate: -1 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="manuscript relative mb-14 max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-[3px] p-6 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)] focus:outline-none md:mb-12"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">the ledger</p>
                  <h2 className="mt-2 font-book text-3xl italic leading-none text-zinc-50">
                    {foundHere.length} of {available.length} found
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setLedgerOpen(false)}
                  aria-label="Close"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-50"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="fleuron mt-5 text-xs" aria-hidden="true">✦</div>
              <ul className="mt-4 space-y-3.5">
                {available.map((item) => {
                  const has = found.includes(item.id);
                  return (
                    <li key={item.id} className="flex items-start gap-3">
                      <Glyph name={item.id} size={22} className={has ? 'text-gilt' : 'text-zinc-600 opacity-50'} strokeWidth={has ? 1.5 : 1} />
                      <div className="min-w-0">
                        <p className={`font-book text-lg leading-tight ${has ? 'text-zinc-50' : 'text-zinc-500'}`}>
                          {has ? item.name : 'Not yet found'}
                        </p>
                        <p className="font-book text-[0.95rem] italic leading-snug text-zinc-400">{has ? item.where : item.hint}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setLedgerOpen(false);
                    window.dispatchEvent(new Event(PALETTE_EVENT));
                  }}
                  className="ledger-door"
                >
                  <Glyph name="compass" size={15} /> Search the archive
                  <span className="ml-auto hidden font-mono text-[10px] tracking-[0.12em] opacity-60 md:inline">⌘K</span>
                </button>
                {found.includes('key') && isRoomEnabled('library') && (
                  <button type="button" onClick={() => openRoom('library')} className="ledger-door">
                    <Glyph name="key" size={15} /> Return to the Restricted Section
                  </button>
                )}
                {found.includes('lens') && isRoomEnabled('darkroom') && (
                  <button type="button" onClick={() => openRoom('darkroom')} className="ledger-door">
                    <Glyph name="lens" size={15} /> Return to the Darkroom
                  </button>
                )}
                {complete && isRoomEnabled('details') && (
                  <button type="button" onClick={() => openRoom('details')} className="ledger-door ledger-door-final">
                    <Glyph name="door" size={15} /> Enter the Room of Small Details
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  forgetEverything();
                  setLedgerOpen(false);
                }}
                className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 underline-offset-4 hover:text-zinc-200 hover:underline"
              >
                forget everything I found
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Ambience() {
  const { sound, theme } = useMagic();
  useEffect(() => {
    if (!sound) {
      void import('../../lib/sound').then((m) => m.stopAmbience());
      return;
    }
    let active = true;
    const onCue = (event: Event) => {
      void import('../../lib/sound').then((m) => m.playCue((event as CustomEvent).detail));
    };
    void import('../../lib/sound').then((m) => active && m.startAmbience(theme));
    window.addEventListener('archive:cue', onCue);
    return () => {
      active = false;
      window.removeEventListener('archive:cue', onCue);
    };
  }, [sound, theme]);
  return null;
}

function RoomHost() {
  const { room } = useMagic();
  const [loaded, setLoaded] = useState(false);
  // Warm the rooms on idle, so the first door opens onto a room rather than a
  // network wait. Mounting <Rooms/> with nothing open renders nothing.
  useEffect(() => {
    let cancelled = false;
    const warm = () => {
      prefetchRooms().then(
        () => !cancelled && setLoaded(true),
        () => undefined
      );
    };
    // Safari has no requestIdleCallback.
    const idle = 'requestIdleCallback' in window;
    const handle = idle ? window.requestIdleCallback(warm, { timeout: 4000 }) : window.setTimeout(warm, 2500);
    return () => {
      cancelled = true;
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);
  useEffect(() => {
    if (room) setLoaded(true);
  }, [room]);
  if (!loaded) return null;
  return (
    <Suspense fallback={null}>
      <Rooms />
    </Suspense>
  );
}

/** ⌘K / Ctrl+K, or "/" outside a text field, or the ledger: the index. */
function PaletteHost() {
  const { dismissWhisper } = useMagic();
  const [open, setOpen] = useState(false);
  // A whisper sits above everything; it should not sit above the index.
  useEffect(() => {
    if (open) dismissWhisper();
  }, [open, dismissWhisper]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = !!target?.closest('input, textarea, select, [contenteditable="true"]');
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((o) => !o);
      } else if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (document.querySelector('[aria-modal="true"]')) return;
        event.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(PALETTE_EVENT, onOpen);
    };
  }, []);
  const close = useCallback(() => setOpen(false), []);
  return (
    <Suspense fallback={null}>
      <AnimatePresence>{open && <Palette key="palette" onClose={close} />}</AnimatePresence>
    </Suspense>
  );
}

/**
 * The only hint on a phone. Nobody opens devtools or types a spell there, and
 * the wand is a small icon at the top of a page that has scrolled away — so a
 * first-time visitor who has found nothing gets told, once, that there is
 * something to find, with a button that picks the wand up for them. Copy and
 * the on/off switch are `trigger: invitation` in content/secrets.
 */
function Invitation({ invited, onInvited }: { invited: boolean; onInvited: () => void }) {
  const { found, wand, whisperOf, setWand } = useMagic();
  const coarse = useMediaQuery('(pointer: coarse)');

  useEffect(() => {
    if (invited || wand || found.length > 0 || readFlag(WAND_TOUCHED) || !isEggEnabled('invitation')) return;
    let done = false;
    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
    const show = () => {
      if (done) return;
      // Not over a drawer, a lightbox or a room — wait for the next scroll.
      if (document.querySelector('[aria-modal="true"]')) return;
      done = true;
      cleanup();
      writeFlag(INVITED);
      onInvited();
      const egg = getEgg('invitation');
      window.dispatchEvent(new CustomEvent(WAND_EVENT, { detail: 'beckon' }));
      whisperOf(
        egg?.title || 'This is not only a website.',
        egg?.body?.trim() || 'Part of this archive is hidden. The wand at the top of the page is the way in.',
        'wand',
        { label: egg?.description || 'Pick up the wand', run: () => setWand(true) }
      );
    };
    // Once they are reading (past the opening screen), or after a while.
    const onScroll = () => window.scrollY > window.innerHeight * 0.6 && show();
    const timer = window.setTimeout(show, 15000);
    window.addEventListener('scroll', onScroll, { passive: true });
    return cleanup;
  }, [invited, wand, found.length, whisperOf, setWand, onInvited]);

  // The first time the wand is picked up on a touch screen, say what a finger
  // can do with it — the desktop chip's "draw a circle in the air" means
  // nothing there.
  useEffect(() => {
    if (!coarse) return;
    const onWand = (event: Event) => {
      if ((event as CustomEvent).detail !== 'touched') return;
      whisperOf(
        'The wand is out',
        'Tap anywhere for sparks. Lumos lights the ink in the margins; the stars, the seal and the odd book on the shelf all answer a touch.',
        'wand'
      );
    };
    window.addEventListener(WAND_EVENT, onWand);
    return () => window.removeEventListener(WAND_EVENT, onWand);
  }, [coarse, whisperOf]);

  return null;
}

/**
 * MagicLayer — everything the hidden layer draws or listens for. Lazy, and
 * mounted on idle by App, so the first paint never waits on it.
 */
export default function MagicLayer() {
  const [invited, setInvited] = useState(() => readFlag(INVITED));
  const markInvited = useCallback(() => setInvited(true), []);
  return (
    <>
      <WandEffects />
      <Spellbook />
      <SpellHandler />
      <WhisperToast />
      <Invitation invited={invited} onInvited={markInvited} />
      <Ledger invited={invited} />
      <PaletteHost />
      <Ambience />
      <RoomHost />
    </>
  );
}
