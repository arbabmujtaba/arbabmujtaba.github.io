import { useEffect, useState } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';

/* ────────────────────────────────────────────────────────────────
 *  HERO PORTRAIT — single configurable image source.
 *  Replace the file at `public/portrait.jpg`, or point this variable
 *  at any other local path (e.g. '/uploads/general/your-photo.jpg')
 *  or remote URL to swap the portrait later.
 * ──────────────────────────────────────────────────────────────── */
export const PORTRAIT_IMAGE_SRC = '/portrait.jpg';

// Shared editorial easing curve used across the project.
const ease = [0.16, 1, 0.3, 1] as const;

// Shared placement so the middle (image) layer and the top (orbital)
// layer line up over the exact same region of the hero. ~42vw keeps it
// in the requested 35–45% viewport-width band, capped on ultrawide.
const PORTRAIT_BOX =
  'absolute right-0 top-[14%] hidden h-[66%] w-[42vw] max-w-[640px] lg:block xl:right-6';

// Film-grain texture (matches the global BackgroundLayer noise).
const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='ep-noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23ep-noise)' opacity='0.7'/%3E%3C/svg%3E\")";

/**
 * Cursor-driven parallax. Returns springed motion values that nudge a
 * layer based on pointer position. Higher `strength` => more travel, so
 * the orbital layer can drift independently from the portrait for depth.
 */
function usePointerParallax(strength: number) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 55, damping: 18, restDelta: 0.001 });
  const sy = useSpring(y, { stiffness: 55, damping: 18, restDelta: 0.001 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      x.set((e.clientX / window.innerWidth - 0.5) * strength);
      y.set((e.clientY / window.innerHeight - 0.5) * strength);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduce, strength, x, y]);

  return reduce ? { x: 0, y: 0 } : { x: sx, y: sy };
}

/* ════════════════════════════════════════════════════════════════
 *  MIDDLE LAYER — the portrait itself, blended into the dark
 *  background with gradients + masking, film grain, orange lighting
 *  and a load/hover reveal. Sits BEHIND the ARCHIVE typography.
 * ════════════════════════════════════════════════════════════════ */
export default function EditorialPortrait() {
  const reduce = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { x, y } = usePointerParallax(14);

  return (
    <motion.div
      aria-hidden="true"
      className={`${PORTRAIT_BOX} z-[1] pointer-events-none`}
      style={{ x, y }}
      initial={{ opacity: 0, y: 36, scale: 0.95, filter: 'blur(22px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 1.7, delay: 0.35, ease }}
    >
      {/* Soft atmospheric orange glow emanating from behind the portrait */}
      <motion.div
        className="absolute -inset-x-12 -inset-y-14 rounded-[42%] will-change-transform"
        style={{
          background:
            'radial-gradient(58% 58% at 62% 40%, rgba(249,115,22,0.24), rgba(249,115,22,0.05) 46%, transparent 72%)',
          filter: 'blur(48px)',
        }}
        animate={
          reduce
            ? undefined
            : { opacity: hovered ? 0.95 : [0.5, 0.7, 0.5] }
        }
        transition={
          reduce
            ? undefined
            : {
                duration: hovered ? 0.6 : 9,
                repeat: hovered ? 0 : Infinity,
                ease: 'easeInOut',
              }
        }
      />

      {/* Portrait frame — captures hover for the zoom/glow response */}
      <motion.div
        className="group pointer-events-auto relative h-full w-full overflow-hidden"
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        // Soft-edge masking: an oval window intersected with a vertical
        // fade so the image dissolves into the background on every side.
        style={{
          WebkitMaskImage:
            'radial-gradient(120% 110% at 64% 38%, #000 44%, transparent 80%), linear-gradient(to bottom, transparent 0%, #000 15%, #000 74%, transparent 100%)',
          maskImage:
            'radial-gradient(120% 110% at 64% 38%, #000 44%, transparent 80%), linear-gradient(to bottom, transparent 0%, #000 15%, #000 74%, transparent 100%)',
          WebkitMaskComposite: 'source-in',
          maskComposite: 'intersect',
        }}
      >
        {failed ? (
          <div className="h-full w-full bg-gradient-to-br from-zinc-800/70 via-zinc-900 to-[#0a0a09]" />
        ) : (
          <motion.img
            src={PORTRAIT_IMAGE_SRC}
            alt="Editorial portrait"
            onError={() => setFailed(true)}
            draggable={false}
            className="h-full w-full object-cover object-center grayscale-[22%] contrast-[1.04]"
            animate={{ scale: hovered && !reduce ? 1.06 : 1 }}
            transition={{ duration: 1.1, ease }}
          />
        )}

        {/* Dark-to-orange gradient blending */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a09] via-[#0a0a09]/15 to-[#0a0a09]/55" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#0a0a09]/85" />
        <motion.div
          className="absolute inset-0 mix-blend-soft-light"
          style={{
            background:
              'radial-gradient(70% 60% at 60% 34%, rgba(249,115,22,0.30), transparent 68%)',
          }}
          animate={{ opacity: hovered ? 0.95 : 0.55 }}
          transition={{ duration: 0.7, ease }}
        />

        {/* Film grain */}
        <div
          className="absolute inset-0 opacity-[0.16] mix-blend-soft-light"
          style={{ backgroundImage: GRAIN_URL }}
        />

        {/* Soft inner vignette — feathers the image edges into the dark */}
        <div className="absolute inset-0 shadow-[inset_0_0_70px_28px_rgba(10,10,9,0.92)]" />

        {/* Thin orange accent line (echoes CinematicImageReveal) */}
        <motion.div
          className="absolute inset-x-6 top-5 h-px origin-center bg-gradient-to-r from-transparent via-orange-300/45 to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.3, delay: 1, ease }}
        />
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
 *  TOP LAYER — orbital lines, circular strokes, drifting particles
 *  and atmospheric lighting. Renders ABOVE the ARCHIVE typography and
 *  drifts independently from the portrait for layered depth.
 * ════════════════════════════════════════════════════════════════ */
export function PortraitOrbitals() {
  const reduce = useReducedMotion();
  const { x, y } = usePointerParallax(28);

  const particles = [
    { left: '18%', top: '26%', size: 3, delay: 0, dur: 7 },
    { left: '78%', top: '34%', size: 2, delay: 1.6, dur: 9 },
    { left: '64%', top: '72%', size: 2.5, delay: 0.8, dur: 8 },
    { left: '30%', top: '66%', size: 1.8, delay: 2.4, dur: 10 },
  ];

  return (
    <motion.div
      aria-hidden="true"
      className={`${PORTRAIT_BOX} z-[5] pointer-events-none`}
      style={{ x, y }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.6, delay: 0.9, ease }}
    >
      {/* Concentric orbital rings, centered on the portrait */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-400/15"
        style={{ borderStyle: 'dashed' }}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200/10"
        animate={reduce ? undefined : { rotate: -360 }}
        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
      />

      {/* SVG circular stroke with an orbiting accent dot */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <circle
            cx="100"
            cy="100"
            r="94"
            fill="none"
            stroke="rgba(249,115,22,0.20)"
            strokeWidth="0.4"
            strokeDasharray="2 7"
          />
          <circle cx="100" cy="6" r="1.7" fill="rgba(251,146,60,0.9)" />
        </svg>
      </motion.div>

      {/* Counter-rotating shorter arc for extra depth */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2"
        animate={reduce ? undefined : { rotate: -360 }}
        transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <circle
            cx="100"
            cy="100"
            r="96"
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="0.3"
            strokeDasharray="40 220"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      {/* Floating particles with soft orange glow */}
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-orange-300"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            boxShadow: '0 0 16px rgba(251,146,60,0.5)',
          }}
          animate={
            reduce
              ? undefined
              : { y: [0, -22, 0], opacity: [0.15, 0.7, 0.15], scale: [0.7, 1, 0.7] }
          }
          transition={
            reduce
              ? undefined
              : { duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      ))}

      {/* Drifting horizontal light streak */}
      <motion.div
        className="absolute left-[8%] top-[20%] h-px w-32 bg-gradient-to-r from-transparent via-orange-300/30 to-transparent"
        animate={reduce ? undefined : { opacity: [0, 0.5, 0], x: [-20, 90] }}
        transition={
          reduce
            ? undefined
            : { duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }
        }
      />
    </motion.div>
  );
}
