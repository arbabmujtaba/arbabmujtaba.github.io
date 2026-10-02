import { useEffect, useMemo, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useMediaQuery } from '../lib/useMediaQuery';

/** How far each band of stars (or dust) travels per pixel scrolled. */
const DEPTHS = [0.05, 0.12, 0.24] as const;

/**
 * Backing-store density for the map canvas. The lines are faint and the layer
 * is scaled up a little anyway, so 1.5× is indistinguishable from 2× and costs
 * half the texture memory.
 */
const MAX_DPR = 1.5;

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
// Laid out in a 1600×1000 box that is cropped to cover the viewport.
// ---------------------------------------------------------------------------

const VIEW_W = 1600;
const VIEW_H = 1000;

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
  path: Path2D;
  length: number;
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
      // Perimeter of the polygon — close enough to the curve for the draw-in dash.
      let length = 0;
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i];
        const [bx, by] = pts[(i + 1) % pts.length];
        length += Math.hypot(bx - ax, by - ay);
      }
      out.push({ path: new Path2D(smoothClosed(pts)), length, index: k % 5 === 0, level: k });
    }
  }
  return out;
}

const DRAW_MS = 2600;
const DRAW_DELAY = 200;
const DRAW_STAGGER = 70;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

/**
 * Paints the map into the canvas. `t` is milliseconds since the draw-in began;
 * pass Infinity for the finished map. Returns true once every line is complete.
 */
function paintMap(canvas: HTMLCanvasElement, contours: Contour[], t: number): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return true;
  const w = canvas.width;
  const h = canvas.height;
  const root = document.documentElement;
  const day = root.dataset.theme === 'day';
  const styles = getComputedStyle(root);
  const ink = styles.getPropertyValue('--gilt').trim() || '#d9b46a';
  const mono = styles.getPropertyValue('--font-mono').trim() || 'monospace';

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, w, h);

  // preserveAspectRatio="xMidYMid slice"
  const s = Math.max(w / VIEW_W, h / VIEW_H);
  ctx.setTransform(s, 0, 0, s, (w - VIEW_W * s) / 2, (h - VIEW_H * s) / 2);
  const dpr = w / Math.max(1, canvas.clientWidth);

  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineCap = 'round';
  let done = true;
  for (const c of contours) {
    const local = Math.min(1, Math.max(0, (t - DRAW_DELAY - c.level * DRAW_STAGGER) / DRAW_MS));
    if (local < 1) done = false;
    if (local <= 0) continue;
    ctx.globalAlpha = c.index ? (day ? 0.4 : 0.3) : day ? 0.24 : 0.17;
    // Non-scaling stroke: the width is in CSS pixels, whatever the crop.
    ctx.lineWidth = ((c.index ? 1.1 : 0.7) * dpr) / s;
    if (local < 1) ctx.setLineDash([c.length * easeOut(local), c.length]);
    else ctx.setLineDash([]);
    ctx.stroke(c.path);
  }
  ctx.setLineDash([]);

  ctx.globalAlpha = day ? 0.55 : 0.42;
  ctx.font = `11px ${mono}`;
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '1.6px';
  for (const p of PEAKS) {
    if (!p.label) continue;
    ctx.beginPath();
    ctx.moveTo(p.x - 5, p.y + 4);
    ctx.lineTo(p.x, p.y - 5);
    ctx.lineTo(p.x + 5, p.y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillText(p.label, p.x + 12, p.y + 4);
  }

  // The map fades out toward the edges — baked in, so no CSS mask has to be
  // recomposited while the layer moves.
  ctx.setTransform(1.1 * w, 0, 0, 0.95 * h, 0.5 * w, 0.45 * h);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'destination-in';
  const fade = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  fade.addColorStop(0.35, 'rgba(0,0,0,1)');
  fade.addColorStop(0.92, 'rgba(0,0,0,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return done;
}

/**
 * The survey map as a bitmap. It is painted once (animated only while the
 * lines draw themselves in, then repainted on resize or a change of theme), so
 * every per-frame movement after that is a compositor transform of a texture —
 * no SVG re-rasterising, no mask, nothing on the main thread.
 */
function TerrainCanvas({ live, style }: { live: boolean; style: Record<string, MotionValue<number> | number> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const contours = useMemo(() => terrain(20190601), []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let frame = 0;
    let start = 0;
    let drawn = !live;
    let resizeTimer = 0;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    const still = () => {
      size();
      paintMap(canvas, contours, Infinity);
    };
    const tick = (now: number) => {
      if (!start) start = now;
      drawn = paintMap(canvas, contours, now - start);
      frame = drawn ? 0 : requestAnimationFrame(tick);
    };

    size();
    // The draw-in waits until the page has finished its own first work, so it
    // never competes with the content for the main thread during load.
    let idle = 0;
    const ric = window.requestIdleCallback as ((cb: () => void, o?: { timeout: number }) => number) | undefined;
    if (drawn) paintMap(canvas, contours, Infinity);
    else if (ric) idle = ric(() => (frame = requestAnimationFrame(tick)), { timeout: 1200 });
    else idle = window.setTimeout(() => (frame = requestAnimationFrame(tick)), 300);

    // Labels are set in the mono face; repaint once it has arrived.
    void document.fonts?.ready.then(() => {
      if (drawn) still();
    });

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (drawn) still();
        else size();
      }, 150);
    };
    window.addEventListener('resize', onResize, { passive: true });
    const themeWatch = new MutationObserver(() => {
      if (drawn) still();
    });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      cancelAnimationFrame(frame);
      if (ric) window.cancelIdleCallback?.(idle);
      else window.clearTimeout(idle);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      themeWatch.disconnect();
    };
  }, [contours, live]);

  return <motion.canvas ref={ref} className="absolute inset-0 h-full w-full will-change-transform" style={style} />;
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

/**
 * Three bands of points, each drifting at its own rate as the page scrolls and
 * wrapping on one screen height, so the field never runs out.
 *
 * The still points are one static SVG per band, rasterised once. The few that
 * twinkle are separate HTML dots with a CSS opacity animation, which the
 * compositor runs on its own — animating an SVG child would repaint the whole
 * band every frame.
 */
function Drift({
  motes,
  className,
  scrollY,
  live,
  sizeScale = 1,
}: {
  motes: Mote[];
  className: string;
  scrollY: MotionValue<number>;
  live: boolean;
  sizeScale?: number;
}) {
  const height = useRef(typeof window === 'undefined' ? 900 : window.innerHeight);
  useEffect(() => {
    const onResize = () => {
      height.current = window.innerHeight;
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const y0 = useTransform(scrollY, (y) => -((y * DEPTHS[0]) % height.current));
  const y1 = useTransform(scrollY, (y) => -((y * DEPTHS[1]) % height.current));
  const y2 = useTransform(scrollY, (y) => -((y * DEPTHS[2]) % height.current));
  const ys = [y0, y1, y2];
  const layers = useMemo(() => DEPTHS.map((_, layer) => motes.filter((m) => m.layer === layer)), [motes]);

  return (
    <>
      {layers.map((layer, depth) => (
        <motion.div
          key={depth}
          className={`${className} absolute inset-x-0 top-0 h-[200%] will-change-transform`}
          style={{ y: live ? ys[depth] : 0 }}
        >
          <svg className="absolute inset-0 h-full w-full">
            {[0, 50].map((offset) =>
              layer
                .filter((m) => !(m.twinkle && live))
                .map((m, i) => (
                  <circle
                    key={`${offset}-${i}`}
                    cx={`${m.x}%`}
                    cy={`${offset + m.y / 2}%`}
                    r={m.r * sizeScale * (0.8 + depth * 0.2)}
                    fill="var(--gilt)"
                    opacity={m.o}
                  />
                )),
            )}
          </svg>
          {live &&
            [0, 50].map((offset) =>
              layer
                .filter((m) => m.twinkle)
                .map((m, i) => {
                  const d = 2 * m.r * sizeScale * (0.8 + depth * 0.2);
                  return (
                    <span
                      key={`t${offset}-${i}`}
                      className="star-twinkle absolute rounded-full bg-gilt"
                      style={{
                        left: `${m.x}%`,
                        top: `${offset + m.y / 2}%`,
                        width: d,
                        height: d,
                        marginLeft: -d / 2,
                        marginTop: -d / 2,
                        opacity: m.o,
                        ['--o' as string]: m.o,
                        animationDuration: `${6 + m.delay}s`,
                        animationDelay: `${m.delay}s`,
                      }}
                    />
                  );
                }),
            )}
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
 * Performance contract: after the draw-in, nothing here repaints. Every
 * per-frame change is a transform of an already-rasterised layer (the map is a
 * canvas bitmap, the sky and the pools are static), and nothing runs while the
 * page is still apart from a handful of compositor-only twinkles. Under reduced
 * motion the map is simply there.
 */
export default function BackgroundLayer() {
  const isTouchDevice = useMediaQuery('(pointer: coarse), (max-width: 767px)');
  const live = !useReducedMotion();

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

  // --- pointer: the map leans toward the cursor (desktop) -------------------
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const leanX = useSpring(px, { stiffness: 40, damping: 18 });
  const leanY = useSpring(py, { stiffness: 40, damping: 18 });
  const mapTy = useTransform([mapY, leanY] as MotionValue<number>[], ([a, b]: number[]) => a + b);

  useEffect(() => {
    if (!live || isTouchDevice) return;
    const onMove = (event: PointerEvent) => {
      px.set((event.clientX / window.innerWidth - 0.5) * -22);
      py.set((event.clientY / window.innerHeight - 0.5) * -16);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [live, isTouchDevice, px, py]);

  const mapStyle: Record<string, MotionValue<number> | number> = live
    ? { x: leanX, y: mapTy, rotate: mapRotate, scale: mapScale }
    : { scale: 1.06 };

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
      <TerrainCanvas live={live} style={mapStyle} />

      {/* the night sky, in three depths */}
      <Drift motes={stars} className="night-only" scrollY={scrollY} live={live} />
      {/* dust in the window light, day */}
      <Drift motes={dust} className="day-only" scrollY={scrollY} live={live} sizeScale={1.3} />

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
