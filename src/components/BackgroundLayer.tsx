import { useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from 'motion/react';
import { useMediaQuery } from '../lib/useMediaQuery';

const EASE = [0.16, 1, 0.3, 1] as const;

/** How far each band of stars (or dust) travels per pixel scrolled. */
const DEPTHS = [0.05, 0.12, 0.24] as const;

/** Park–Miller, so the sky and the terrain are the same on every visit. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------------------------------------------------------------------------
// Terrain: contour lines around two summits, one for each end of the journey.
// Drawn in a 1600×1000 box that is cropped to cover the viewport.
// ---------------------------------------------------------------------------

interface Peak {
  x: number;
  y: number;
  levels: number;
  step: number;
  label: string;
}

const PEAKS: Peak[] = [
  { x: 1190, y: 250, levels: 15, step: 27, label: '34.30°N 74.47°E · sopore' },
  { x: 250, y: 850, levels: 13, step: 31, label: '22.72°N 75.86°E · indore' },
  { x: 1560, y: 1060, levels: 8, step: 34, label: '' },
];

interface Contour {
  d: string;
  index: boolean;
  level: number;
}

/** Closed Catmull–Rom through the points, as cubic Béziers. */
function smoothClosed(pts: [number, number][]) {
  const n = pts.length;
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return `${d}Z`;
}

function terrain(seed: number): Contour[] {
  const rand = seeded(seed);
  const out: Contour[] = [];
  for (const peak of PEAKS) {
    const harmonics = Array.from({ length: 4 }, (_, i) => ({
      f: 2 + i + Math.floor(rand() * 2),
      a: 0.025 + rand() * 0.07,
      p: rand() * Math.PI * 2,
    }));
    for (let k = 1; k <= peak.levels; k++) {
      // Rings spread out as the ground falls away from the summit.
      const r = peak.step * k * (1 + k * 0.025);
      const pts: [number, number][] = [];
      for (let i = 0; i < 64; i++) {
        const t = (i / 64) * Math.PI * 2;
        let wobble = 1;
        for (const h of harmonics) wobble += h.a * Math.sin(h.f * t + h.p + k * 0.21);
        pts.push([peak.x + Math.cos(t) * r * wobble * 1.08, peak.y + Math.sin(t) * r * wobble]);
      }
      out.push({ d: smoothClosed(pts), index: k % 5 === 0, level: k });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Points of light: stars at night, dust in the window light by day.
// ---------------------------------------------------------------------------

interface Mote {
  x: number;
  y: number;
  r: number;
  o: number;
  layer: number;
  twinkle: boolean;
  delay: number;
}

function field(count: number, seed: number, spanX = 100): Mote[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, (_, i) => ({
    x: rand() * spanX,
    y: rand() * 100,
    r: rand() < 0.12 ? 1.1 : 0.55 + rand() * 0.4,
    o: 0.25 + rand() * 0.5,
    layer: i % DEPTHS.length,
    twinkle: i % 9 === 0,
    delay: rand() * 8,
  }));
}

function useViewportHeight() {
  const [h, setH] = useState(() => (typeof window === 'undefined' ? 900 : window.innerHeight));
  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setH(window.innerHeight));
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return h;
}

/**
 * Three bands of points, each drifting at its own rate as the page scrolls and
 * wrapping on one screen height, so the field never runs out. Fast scrolling
 * draws them out into short streaks.
 */
function Drift({
  motes,
  className,
  scrollY,
  stretch,
  live,
  sizeScale = 1,
}: {
  motes: Mote[];
  className: string;
  scrollY: MotionValue<number>;
  stretch: MotionValue<number>[];
  live: boolean;
  sizeScale?: number;
}) {
  const h = useViewportHeight();
  const hRef = useRef(h);
  hRef.current = h;
  const y0 = useTransform(scrollY, (y) => -((y * DEPTHS[0]) % hRef.current));
  const y1 = useTransform(scrollY, (y) => -((y * DEPTHS[1]) % hRef.current));
  const y2 = useTransform(scrollY, (y) => -((y * DEPTHS[2]) % hRef.current));
  const ys = [y0, y1, y2];
  const layers = useMemo(() => DEPTHS.map((_, layer) => motes.filter((m) => m.layer === layer)), [motes]);

  return (
    <>
      {layers.map((layer, depth) => (
        <motion.div
          key={depth}
          className={`${className} absolute inset-0 origin-center will-change-transform`}
          style={{ scaleY: live ? stretch[depth] : 1 }}
        >
          <motion.svg className="absolute inset-x-0 top-0 w-full" style={{ height: '200%', y: live ? ys[depth] : 0 }}>
            {[0, 50].map((offset) =>
              layer.map((m, i) => (
                <circle
                  key={`${offset}-${i}`}
                  cx={`${m.x}%`}
                  cy={`${offset + m.y / 2}%`}
                  r={m.r * sizeScale * (0.8 + depth * 0.2)}
                  fill="var(--gilt)"
                  style={{
                    opacity: m.o,
                    ['--o' as string]: m.o,
                    animation: m.twinkle && live ? `star-twinkle ${6 + m.delay}s ease-in-out ${m.delay}s infinite` : undefined,
                  }}
                />
              )),
            )}
          </motion.svg>
        </motion.div>
      ))}
    </>
  );
}

/**
 * BackgroundLayer — the atmosphere behind every page.
 *
 * A survey map of the journey: contour lines around two summits, Sopore and
 * Indore, in gilt at night and sepia ink on paper by day. The terrain draws
 * itself in once, then turns and settles slowly as the page is read, and
 * leans a little toward the cursor.
 *
 * Night adds the sky in three depths and two pools of light — ember and old
 * gold — that drift down the page as you scroll. Day keeps the warm window and
 * a little dust floating in it.
 *
 * Everything is scroll- or pointer-driven: no timers, only transform and
 * opacity change per frame. Under reduced motion the map is simply there.
 */
export default function BackgroundLayer() {
  const isTouchDevice = useMediaQuery('(pointer: coarse), (max-width: 767px)');
  const live = !useReducedMotion();

  const contours = useMemo(() => terrain(20190601), []);
  const stars = useMemo(() => field(isTouchDevice ? 36 : 84, 20190601), [isTouchDevice]);
  const dust = useMemo(() => field(isTouchDevice ? 14 : 28, 1906, 60), [isTouchDevice]);

  // --- scroll ---------------------------------------------------------------
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 60, damping: 24, mass: 0.8 });

  const mapRotate = useTransform(progress, [0, 1], [0, 9]);
  const mapScale = useTransform(progress, [0, 1], [1.06, 1.18]);
  const mapY = useTransform(progress, [0, 1], [0, -70]);

  const emberY = useTransform(progress, [0, 1], ['-8%', '58%']);
  const emberX = useTransform(progress, [0, 1], ['0%', '-22%']);
  const giltY = useTransform(progress, [0, 1], ['10%', '-46%']);
  const giltX = useTransform(progress, [0, 1], ['0%', '18%']);
  const sunY = useTransform(progress, [0, 1], ['0%', '18%']);

  const velocity = useSpring(useVelocity(scrollY), { stiffness: 140, damping: 32, mass: 0.6 });
  const rush = useTransform(velocity, [-2600, 0, 2600], [1, 0, 1]);
  const stretch = [
    useTransform(rush, [0, 1], [1, 1.2]),
    useTransform(rush, [0, 1], [1, 1.45]),
    useTransform(rush, [0, 1], [1, 1.8]),
  ];
  // The index contours brighten a touch while the page is moving.
  const indexGlow = useTransform(rush, [0, 1], [1, 1.6]);

  // --- pointer: the map leans toward the cursor (desktop) -------------------
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const leanX = useSpring(px, { stiffness: 40, damping: 18 });
  const leanY = useSpring(py, { stiffness: 40, damping: 18 });

  useEffect(() => {
    if (!live || isTouchDevice) return;
    const onMove = (event: PointerEvent) => {
      px.set((event.clientX / window.innerWidth - 0.5) * -22);
      py.set((event.clientY / window.innerHeight - 0.5) * -16);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [live, isTouchDevice, px, py]);

  return (
    <div aria-hidden="true" className="film-grain pointer-events-none fixed inset-0 z-0 overflow-hidden bg-canvas">
      {/* pools of light, night */}
      <motion.div
        className="night-only absolute -right-48 -top-64 h-[52rem] w-[52rem] rounded-full will-change-transform"
        style={{
          x: live ? emberX : 0,
          y: live ? emberY : 0,
          background: 'radial-gradient(circle, color-mix(in oklab, var(--accent) 13%, transparent) 0%, transparent 62%)',
        }}
      />
      {!isTouchDevice && (
        <motion.div
          className="night-only absolute -bottom-72 -left-56 h-[48rem] w-[48rem] rounded-full will-change-transform"
          style={{
            x: live ? giltX : 0,
            y: live ? giltY : 0,
            background: 'radial-gradient(circle, color-mix(in oklab, var(--gilt) 8%, transparent) 0%, transparent 60%)',
          }}
        />
      )}

      {/* daylight through a window, top left */}
      <motion.div
        className="day-only absolute -left-40 -top-40 h-[52rem] w-[52rem] rounded-full will-change-transform"
        style={{
          y: live ? sunY : 0,
          background: 'radial-gradient(circle, rgba(255, 236, 196, 0.85) 0%, rgba(255, 236, 196, 0) 65%)',
        }}
      />

      {/* the map */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{
          x: live ? leanX : 0,
          y: live ? leanY : 0,
          maskImage: 'radial-gradient(ellipse 110% 95% at 50% 45%, black 35%, transparent 92%)',
        }}
      >
        <motion.svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice"
          style={{ rotate: live ? mapRotate : 0, scale: live ? mapScale : 1.06, y: live ? mapY : 0 }}
        >
          <g fill="none" strokeLinecap="round">
            {contours.map((c, i) => (
              <motion.path
                key={i}
                d={c.d}
                className={c.index ? 'contour contour--index' : 'contour'}
                strokeWidth={c.index ? 1.1 : 0.7}
                vectorEffect="non-scaling-stroke"
                style={c.index && live ? { opacity: indexGlow } : undefined}
                initial={live ? { pathLength: 0 } : false}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.6, delay: 0.2 + c.level * 0.07, ease: EASE }}
              />
            ))}
          </g>
          {PEAKS.filter((p) => p.label).map((p) => (
            <g key={p.label} className="contour-mark">
              <path d={`M${p.x - 5},${p.y + 4} L${p.x},${p.y - 5} L${p.x + 5},${p.y + 4} Z`} />
              <text x={p.x + 12} y={p.y + 4} fontSize="11" letterSpacing="1.6" fontFamily="var(--font-mono)">
                {p.label}
              </text>
            </g>
          ))}
        </motion.svg>
      </motion.div>

      {/* the night sky, in three depths */}
      <Drift motes={stars} className="night-only" scrollY={scrollY} stretch={stretch} live={live} />
      {/* dust in the window light, day */}
      <Drift motes={dust} className="day-only" scrollY={scrollY} stretch={stretch} live={live} sizeScale={1.3} />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, color-mix(in oklab, var(--bg-deep) 45%, transparent) 64%, color-mix(in oklab, var(--bg-deep) 88%, transparent) 100%)',
        }}
      />
    </div>
  );
}
