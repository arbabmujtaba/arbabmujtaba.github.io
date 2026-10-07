import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { WAND_EVENT } from '../../lib/magic';

const EASE = [0.16, 1, 0.3, 1] as const;
/** Ghost dots behind the spark. */
const TRAIL = 6;
/** Frames between two ghost dots. */
const TRAIL_GAP = 4;
/** How long it drifts (time behind a drawer not counted) before it gives up for this visit. */
const LIFETIME_MS = 45000;
/** How long the flight off the page takes when nobody caught it. */
const LEAVE_MS = 1800;
/** Within this distance of the pointer it slows almost to a stop — it wants to be caught. */
const NEAR_PX = 180;
/** Half the hit target (48px). */
const HALF = 24;

/** Where the spark is at path-time `t`: two slow sines per axis, inside the reading band. */
function pathAt(t: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const margin = Math.min(64, w * 0.08);
  const nx = 0.5 + 0.38 * Math.sin(t * 0.00016) + 0.08 * Math.sin(t * 0.00045 + 1.7);
  const ny = 0.46 + 0.2 * Math.sin(t * 0.0002 + 0.6) + 0.06 * Math.sin(t * 0.00061 + 2.3);
  // nx stays in [0.04, 0.96]; ny in [0.2, 0.72] — clear of the header and the bottom chips.
  return { x: margin + nx * (w - margin * 2), y: ny * h };
}

const BURST = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2 + (i % 2) * 0.2;
  const reach = i % 2 ? 34 : 58;
  return { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach, size: i % 2 ? 2 : 3 };
});

interface WispProps {
  /** Accessible name — the spark has no visible words. */
  label: string;
  onCatch: () => void;
  /** Called once it has burst (caught) or flown off (not). */
  onGone: () => void;
}

/**
 * Wisp — a spark that drifts across the page for a visitor who hasn't found the
 * hidden layer yet. It never says anything: it wanders, slows when a pointer
 * comes near, and catching it is the introduction (MagicLayer decides what that
 * does). Left alone, it flies to the wand in the header — which rings — or off
 * the top of the page if the header has scrolled away.
 *
 * Position is written straight to the DOM from one frame loop (the individual
 * `translate` property, so it never fights motion's `transform`); React only
 * renders the spark, its trail and the burst.
 */
export default function Wisp({ label, onCatch, onGone }: WispProps) {
  const reduced = useReducedMotion();
  const layerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const trailRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pos = useRef({ x: -200, y: -200 });
  const held = useRef(false);
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);
  const goneRef = useRef(onGone);
  goneRef.current = onGone;

  // Drift, slow near the pointer, pause behind drawers, leave when time is up.
  useEffect(() => {
    if (burst) return;
    const layer = layerRef.current;
    const button = buttonRef.current;
    if (!layer || !button) return;

    let frame = 0;
    let fadeTimer = 0;
    let clock = Math.random() * 40000; // a different stretch of the path each visit
    let speed = 1;
    let alive = 0;
    let covered = false;
    let lastCoverCheck = 0;
    let previous = performance.now();
    let pointer = { x: -9999, y: -9999 };
    let leave: { x: number; y: number; tx: number; ty: number; start: number; toWand: boolean } | null = null;
    const history: { x: number; y: number }[] = [];

    const place = (x: number, y: number) => {
      pos.current = { x, y };
      button.style.translate = `${x - HALF}px ${y - HALF}px`;
    };

    const startLeaving = (now: number) => {
      const wand = document.querySelector<HTMLElement>('[data-wand-button]');
      const rect = wand?.getBoundingClientRect();
      const visible = !!rect && rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
      const { x, y } = pos.current;
      leave = visible
        ? { x, y, tx: rect!.left + rect!.width / 2, ty: rect!.top + rect!.height / 2, start: now, toWand: true }
        : { x, y, tx: x + 40, ty: -80, start: now, toWand: false };
      button.style.pointerEvents = 'none';
    };

    const tick = (now: number) => {
      const dt = Math.min(48, now - previous);
      previous = now;

      if (now - lastCoverCheck > 400) {
        lastCoverCheck = now;
        covered = !!document.querySelector('[aria-modal="true"]');
        layer.style.visibility = covered ? 'hidden' : 'visible';
      }

      if (leave) {
        const p = Math.min(1, (now - leave.start) / LEAVE_MS);
        const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
        const x = leave.x + (leave.tx - leave.x) * e + Math.sin(p * Math.PI) * 36;
        const y = leave.y + (leave.ty - leave.y) * e;
        place(x, y);
        button.style.opacity = String(leave.toWand ? (p < 0.8 ? 1 : (1 - p) / 0.2) : 1 - p);
        if (p >= 1) {
          if (leave.toWand) window.dispatchEvent(new CustomEvent(WAND_EVENT, { detail: 'beckon' }));
          goneRef.current();
          return;
        }
      } else if (reduced) {
        // No drifting: it rests in the right margin and waits.
        place(window.innerWidth - Math.min(64, window.innerWidth * 0.08) - HALF, window.innerHeight * 0.58);
        if (!covered && !held.current) alive += dt;
        if (alive > LIFETIME_MS) {
          button.style.transition = 'opacity 600ms';
          button.style.opacity = '0';
          fadeTimer = window.setTimeout(() => goneRef.current(), 650);
          return;
        }
      } else {
        const near = Math.hypot(pointer.x - pos.current.x, pointer.y - pos.current.y) < NEAR_PX;
        const target = held.current ? 0 : near ? 0.12 : 1;
        speed += (target - speed) * Math.min(1, dt / 260);
        clock += dt * speed;
        const p = pathAt(clock);
        place(p.x, p.y + Math.sin(now * 0.0021) * 5);

        history.push({ ...pos.current });
        if (history.length > TRAIL * TRAIL_GAP + 1) history.shift();
        trailRefs.current.forEach((dot, i) => {
          const at = history[history.length - 1 - (i + 1) * TRAIL_GAP];
          if (!dot || !at) return;
          dot.style.translate = `${at.x}px ${at.y}px`;
        });

        if (!covered && !held.current) alive += dt;
        if (alive > LIFETIME_MS) startLeaving(now);
      }
      frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(fadeTimer);
      window.removeEventListener('pointermove', onMove);
    };
  }, [burst, reduced]);

  // After the burst has played, it is gone.
  useEffect(() => {
    if (!burst) return;
    const timer = window.setTimeout(() => goneRef.current(), 900);
    return () => window.clearTimeout(timer);
  }, [burst]);

  const catchIt = () => {
    if (burst) return;
    setBurst({ ...pos.current });
    onCatch();
  };

  const hold = (on: boolean) => () => {
    held.current = on;
  };

  return (
    <motion.div
      ref={layerRef}
      className="pointer-events-none fixed inset-0 z-[105]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: EASE }}
    >
      {!burst && (
        <>
          {!reduced &&
            Array.from({ length: TRAIL }, (_, i) => (
              <span
                key={i}
                ref={(node) => {
                  trailRefs.current[i] = node;
                }}
                aria-hidden="true"
                className="wisp-trail"
                style={{ translate: '-200px -200px', '--d': `${3 - i * 0.35}px`, opacity: 0.55 - i * 0.08 } as CSSProperties}
              />
            ))}
          <button
            ref={buttonRef}
            type="button"
            aria-label={label}
            onClick={catchIt}
            onPointerEnter={hold(true)}
            onPointerLeave={hold(false)}
            onFocus={hold(true)}
            onBlur={hold(false)}
            className="wisp pointer-events-auto absolute left-0 top-0 h-12 w-12 cursor-pointer rounded-full focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-gilt"
            style={{ translate: '-200px -200px' }}
          >
            <motion.span
              aria-hidden="true"
              className="absolute inset-0"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.4, ease: EASE }}
            >
              <svg viewBox="0 0 24 24" className="wisp-glint" fill="currentColor">
                <path d="M12 2.5c.5 4.6 1.9 6.9 9.5 9.5-7.6 2.6-9 4.9-9.5 9.5-.5-4.6-1.9-6.9-9.5-9.5 7.6-2.6 9-4.9 9.5-9.5z" />
              </svg>
              <span className="wisp-mote" />
            </motion.span>
          </button>
        </>
      )}

      {burst && (
        <span aria-hidden="true" className="absolute" style={{ left: burst.x, top: burst.y }}>
          <motion.span
            className="absolute -ml-6 -mt-6 h-12 w-12 rounded-full border border-gilt"
            initial={{ scale: reduced ? 1 : 0.3, opacity: 0.9 }}
            animate={{ scale: reduced ? 1 : 2.6, opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
          />
          {!reduced &&
            BURST.map((spark, i) => (
              <motion.span
                key={i}
                className="absolute rounded-full bg-gilt shadow-[0_0_6px_var(--gilt)]"
                style={{ width: spark.size, height: spark.size, marginLeft: -spark.size / 2, marginTop: -spark.size / 2 }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{ x: spark.x, y: spark.y + 10, opacity: 0 }}
                transition={{ duration: 0.85, ease: EASE }}
              />
            ))}
        </span>
      )}
    </motion.div>
  );
}
