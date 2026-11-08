import { useCallback, useRef, type ReactNode } from 'react';
import { m, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'motion/react';
import { usePointerDepth } from '../../lib/depth';

interface TiltProps {
  children: ReactNode;
  className?: string;
  /** Largest rotation, in degrees, at the card's edge. */
  max?: number;
  /** Perspective distance in px: smaller is more dramatic. */
  perspective?: number;
  /** A soft highlight that follows the pointer across the surface. */
  glare?: boolean;
  /** How much the card lifts toward the viewer while hovered. */
  lift?: number;
}

/** Firm enough to feel attached to the hand, soft enough to settle without a wobble. */
const SPRING = { stiffness: 220, damping: 22, mass: 0.6 };

/**
 * Tilt — a surface that leans toward the pointer in 3D.
 *
 * The rotation is computed from where the pointer sits on the card (centre is
 * flat, edges reach `max`), smoothed by springs, and written straight to the
 * transform: no React state, so moving across a card never re-renders it. The
 * card's rectangle is measured once on enter, not on every move.
 *
 * `transformPerspective` gives each card its own vanishing point, so the
 * parent needs no `perspective` and no `preserve-3d`. That matters here: the
 * image frames are `overflow: hidden`, which would flatten a 3D context.
 *
 * Off (a plain wrapper) on touch, narrow screens and under reduced motion —
 * see usePointerDepth.
 */
export default function Tilt({ children, className = '', max = 7, perspective = 900, glare = true, lift = 0 }: TiltProps) {
  const enabled = usePointerDepth();
  const rect = useRef<DOMRect | null>(null);

  // Pointer position on the card, -0.5 … 0.5 on both axes; 0 at rest.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const hover = useMotionValue(0);

  const rotateY = useSpring(useTransform(px, (v) => v * max * 2), SPRING);
  const rotateX = useSpring(useTransform(py, (v) => -v * max * 2), SPRING);
  const z = useSpring(useTransform(hover, (v) => v * lift), SPRING);
  const glareOpacity = useSpring(hover, { stiffness: 160, damping: 26 });
  const gx = useTransform(px, (v) => `${(v + 0.5) * 100}%`);
  const gy = useTransform(py, (v) => `${(v + 0.5) * 100}%`);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, color-mix(in srgb, var(--accent) 22%, transparent) 0%, rgba(255,255,255,0.06) 28%, transparent 62%)`;

  const onEnter = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      rect.current = event.currentTarget.getBoundingClientRect();
      hover.set(1);
    },
    [hover]
  );
  const onMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const r = rect.current;
      if (!r) return;
      px.set(Math.min(0.5, Math.max(-0.5, (event.clientX - r.left) / r.width - 0.5)));
      py.set(Math.min(0.5, Math.max(-0.5, (event.clientY - r.top) / r.height - 0.5)));
    },
    [px, py]
  );
  const onLeave = useCallback(() => {
    rect.current = null;
    px.set(0);
    py.set(0);
    hover.set(0);
  }, [px, py, hover]);

  if (!enabled) return <div className={className}>{children}</div>;

  return (
    <m.div
      className={`relative ${className}`}
      style={{ rotateX, rotateY, z, transformPerspective: perspective }}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
      {glare && (
        <m.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 mix-blend-screen"
          style={{ opacity: glareOpacity, background: glareBg }}
        />
      )}
    </m.div>
  );
}
