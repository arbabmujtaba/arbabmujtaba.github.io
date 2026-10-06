import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cue, useMagic } from '../../lib/magic';
import { getEgg, isEggEnabled } from '../../lib/secrets';
import { DECOYS, FIGURE_PATH, SEVEN, judgeTrace, type StarId } from '../../lib/constellation';

/**
 * The Saptarishi — seven stars, the same seven over Sopore and over Indore.
 *
 * Night only. The hero's sky holds eleven bright stars among the faint ones:
 * seven belong to the figure, four do not. The figure has to be drawn along its
 * own lines — tap star after star, or drag through them like a pattern lock —
 * handle and bowl, nothing skipped. A wrong star (a decoy, a jump across the
 * sky, doubling back) breaks the pattern and the sky forgets it. The rules are
 * in lib/constellation.ts.
 *
 * Keyboard: the sky is one tab stop; arrow keys move between stars, Enter or
 * Space touches one.
 */

type SkyStar = { id: string; x: number; y: number; figure: boolean };

const SKY: SkyStar[] = [
  ...SEVEN.map((s) => ({ ...s, figure: true })),
  ...DECOYS.map((d) => ({ ...d, figure: false })),
].sort((a, b) => a.x - b.x);

const AT = new Map(SKY.map((s) => [s.id, s]));

/** How close (px) a dragging finger must pass to a star to touch it. */
const HIT_RADIUS = 24;
/** A half-drawn figure fades if left alone this long. */
const IDLE_MS = 9000;

function faint(count: number) {
  let s = 34308;
  const rand = () => ((s = (s * 48271) % 2147483647) / 2147483647);
  return Array.from({ length: count }, () => ({ x: rand() * 100, y: rand() * 100, r: 0.12 + rand() * 0.22, o: 0.2 + rand() * 0.45 }));
}

export default function Constellation({ className = '' }: { className?: string }) {
  const { collect, whisperOf, found } = useMagic();
  const reduced = useReducedMotion();
  const enabled = useMemo(() => isEggEnabled('constellation'), []);
  const dust = useMemo(() => faint(46), []);

  const alreadyFound = found.includes('star');
  const [trace, setTrace] = useState<string[]>([]);
  const [complete, setComplete] = useState(alreadyFound);
  const [broken, setBroken] = useState<{ ids: string[]; edges: [string, string][] } | null>(null);
  const [failures, setFailures] = useState(0);
  const [ghost, setGhost] = useState(false);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const starRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dragging = useRef(false);
  const dragTrace = useRef<string[]>([]);

  useEffect(() => {
    if (alreadyFound) setComplete(true);
  }, [alreadyFound]);

  const verdict = useMemo(() => judgeTrace(trace), [trace]);
  const lit = new Set(verdict.state === 'partial' || verdict.state === 'complete' ? verdict.lit : []);
  const litEdges = verdict.state === 'partial' || verdict.state === 'complete' ? verdict.edges : [];

  const succeed = useCallback(() => {
    setComplete(true);
    setTrace([]);
    cue('chime');
    const egg = getEgg('constellation');
    window.setTimeout(() => {
      whisperOf(egg?.title || 'Saptarishi', egg?.description || 'Seven stars, the same over Sopore and over Indore.', 'star');
      collect('star');
    }, reduced ? 0 : 1300);
  }, [collect, reduced, whisperOf]);

  const fail = useCallback(
    (attempt: string[]) => {
      const edges: [string, string][] = [];
      for (let i = 1; i < attempt.length; i += 1) if (attempt[i] !== attempt[i - 1]) edges.push([attempt[i - 1], attempt[i]]);
      setBroken({ ids: attempt, edges });
      setTrace([]);
      setFailures((n) => {
        const next = n + 1;
        // Second miss: show the figure's ghost for a moment. Third: say it in words.
        if (next >= 2) setGhost(true);
        if (next === 3) {
          whisperOf(
            'Not that shape',
            'Seven of these stars are the Saptarishi — a handle of four and a bowl of four that share one star. Draw it along its own lines.',
            'star'
          );
        }
        return next;
      });
    },
    [whisperOf]
  );

  // Let a broken attempt and the ghost fade on their own.
  useEffect(() => {
    if (!broken) return;
    const timer = window.setTimeout(() => setBroken(null), reduced ? 400 : 900);
    return () => window.clearTimeout(timer);
  }, [broken, reduced]);
  useEffect(() => {
    if (!ghost) return;
    const timer = window.setTimeout(() => setGhost(false), 2200);
    return () => window.clearTimeout(timer);
  }, [ghost]);
  useEffect(() => {
    if (trace.length === 0 || complete) return;
    const timer = window.setTimeout(() => setTrace([]), IDLE_MS);
    return () => window.clearTimeout(timer);
  }, [trace, complete]);

  /** Add one touched star to a trace and judge the result. */
  const step = useCallback(
    (current: string[], id: string): string[] | null => {
      if (current[current.length - 1] === id) return current;
      const next = [...current, id];
      const result = judgeTrace(next);
      if (result.state === 'broken') {
        fail(next);
        return null;
      }
      if (AT.get(id)?.figure) cue('spark');
      if (result.state === 'complete') {
        succeed();
        return null;
      }
      return next;
    },
    [fail, succeed]
  );

  const touch = (id: string) => {
    if (complete) return;
    const next = step(trace, id);
    setTrace(next ?? []);
  };

  // ---- drag through the stars ----

  const starAtPoint = (clientX: number, clientY: number): string | null => {
    const box = rootRef.current?.getBoundingClientRect();
    if (!box) return null;
    let best: string | null = null;
    let bestDistance = HIT_RADIUS;
    for (const star of SKY) {
      const sx = box.left + (star.x / 100) * box.width;
      const sy = box.top + (star.y / 100) * box.height;
      const d = Math.hypot(clientX - sx, clientY - sy);
      if (d < bestDistance) {
        best = star.id;
        bestDistance = d;
      }
    }
    return best;
  };

  const onStarPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    if (complete || event.button > 0) return;
    dragging.current = true;
    dragTrace.current = trace;
    const next = step(trace, id);
    dragTrace.current = next ?? [];
    setTrace(next ?? []);
    if (!next) dragging.current = false;
  };

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragging.current) return;
      const box = rootRef.current?.getBoundingClientRect();
      if (box) setPointer({ x: ((event.clientX - box.left) / box.width) * 100, y: ((event.clientY - box.top) / box.height) * 100 });
      const hit = starAtPoint(event.clientX, event.clientY);
      if (!hit || hit === dragTrace.current[dragTrace.current.length - 1]) return;
      const next = step(dragTrace.current, hit);
      if (!next) {
        dragging.current = false;
        dragTrace.current = [];
        setPointer(null);
        setTrace([]);
        return;
      }
      dragTrace.current = next;
      setTrace(next);
    };
    const up = () => {
      if (!dragging.current) return;
      dragging.current = false;
      setPointer(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    // step is stable enough for the lifetime of a drag; starAtPoint reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ---- keyboard: one tab stop, arrows between stars ----

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = (index + delta + SKY.length) % SKY.length;
    setFocusIndex(next);
    starRefs.current[next]?.focus();
  };

  if (!enabled) return null;

  const lastLit = trace[trace.length - 1];
  const tail = pointer && lastLit ? AT.get(lastLit) : undefined;

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label="The night sky — seven of these stars make a figure"
      className={`night-only pointer-events-none ${className}`}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {dust.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="var(--starlight)" opacity={d.o} vectorEffect="non-scaling-stroke" />
        ))}

        {/* the figure's ghost, after a couple of misses */}
        <AnimatePresence>
          {ghost && !complete && (
            <motion.path
              key="ghost"
              d={FIGURE_PATH}
              fill="none"
              stroke="var(--gilt)"
              strokeWidth="1"
              strokeDasharray="2 5"
              vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            />
          )}
        </AnimatePresence>

        {/* lines drawn so far */}
        {!complete &&
          litEdges.map(([a, b]) => {
            const from = AT.get(a)!;
            const to = AT.get(b)!;
            return (
              <motion.line
                key={`${a}-${b}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="var(--gilt)"
                strokeWidth="1"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: reduced ? 1 : 0, opacity: 0.4 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                transition={{ duration: 0.35 }}
              />
            );
          })}

        {/* the live tail while dragging */}
        {tail && pointer && !complete && (
          <line
            x1={tail.x}
            y1={tail.y}
            x2={pointer.x}
            y2={pointer.y}
            stroke="var(--gilt)"
            strokeWidth="1"
            strokeDasharray="1 3"
            opacity={0.55}
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* a broken attempt, in the alarm colour, fading */}
        <AnimatePresence>
          {broken &&
            broken.edges.map(([a, b], i) => {
              const from = AT.get(a);
              const to = AT.get(b);
              if (!from || !to) return null;
              return (
                <motion.line
                  key={`broken-${i}-${a}-${b}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="var(--rushes-alarm)"
                  strokeWidth="1"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ opacity: 0.9 }}
                  animate={{ opacity: 0.9 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              );
            })}
        </AnimatePresence>

        {complete && (
          <motion.path
            d={FIGURE_PATH}
            fill="none"
            stroke="var(--gilt)"
            strokeWidth="1"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: reduced ? 1 : 0, opacity: 0.2 }}
            animate={{ pathLength: 1, opacity: 0.75 }}
            transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
          />
        )}
      </svg>

      {SKY.map((star, index) => {
        const on = complete ? star.figure : lit.has(star.id as StarId);
        const wrong = !!broken && broken.ids[broken.ids.length - 1] === star.id;
        return (
          <button
            key={star.id}
            ref={(node) => {
              starRefs.current[index] = node;
            }}
            type="button"
            tabIndex={index === focusIndex ? 0 : -1}
            aria-label={on ? 'A lit star' : 'A bright star'}
            aria-pressed={on}
            data-enchanted="star"
            disabled={complete}
            onPointerDown={(event) => onStarPointerDown(event, star.id)}
            onClick={(event) => {
              // A pointer press already touched the star on pointerdown; only a
              // keyboard click (detail 0) still needs handling here.
              if (event.detail === 0) touch(star.id);
            }}
            onKeyDown={(event) => onKeyDown(event, index)}
            onFocus={() => setFocusIndex(index)}
            className="pointer-events-auto absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 touch-none select-none items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gilt disabled:cursor-default"
            style={{ left: `${star.x}%`, top: `${star.y}%` }}
          >
            <motion.span
              className={`block rounded-full transition-colors duration-300 ${wrong ? 'bg-alarm' : 'bg-starlight'}`}
              animate={{
                width: on ? 6 : 3,
                height: on ? 6 : 3,
                x: wrong && !reduced ? [0, -3, 3, -2, 0] : 0,
                boxShadow: on
                  ? '0 0 14px 3px color-mix(in srgb, var(--gilt) 85%, transparent)'
                  : '0 0 6px 1px rgba(255, 246, 220, 0.45)',
              }}
              transition={{ duration: wrong ? 0.4 : 0.6 }}
            />
          </button>
        );
      })}

      <div className="sr-only" role="status" aria-live="polite">
        {complete
          ? 'The Saptarishi is drawn.'
          : broken
            ? 'That star is not in the figure. The sky forgets.'
            : trace.length > 0
              ? `${lit.size} of 7 stars lit.`
              : ''}
      </div>

      <AnimatePresence>
        {broken && !complete && (
          <motion.p
            key="forget"
            className="absolute -bottom-8 right-0 font-book text-sm italic text-zinc-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {failures >= 2 ? 'not that shape — the sky forgets' : 'the sky forgets'}
          </motion.p>
        )}
        {complete && (
          <motion.p
            key="name"
            className="absolute -bottom-8 right-0 font-book text-base italic text-gilt"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: reduced ? 0 : 1.2 }}
          >
            Saptarishi
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
