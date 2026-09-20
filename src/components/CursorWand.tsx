import { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { useMediaQuery } from '../lib/useMediaQuery';

/** Spring for the dot that stays close to the pointer. */
const TIP = { stiffness: 620, damping: 34, mass: 0.35 };
/** Softer spring for the halo, so it trails behind and catches up. */
const HALO = { stiffness: 130, damping: 18, mass: 0.7 };

/**
 * CursorWand — a small ember dot that follows the pointer, with a slower halo
 * trailing behind it.
 *
 * Two layers rather than one: the tip tracks tightly so it reads as attached to
 * the cursor, while the halo lags on a looser spring, which is what gives the
 * trailing "wand" feel instead of a dot that merely teleports around. Both are
 * driven by springs on motion values, so no React state updates on pointer move
 * — the component renders once and the compositor does the rest.
 *
 * It never intercepts input (`pointer-events: none`) and it sits above the
 * quick-look overlay so it stays visible while reading. Hidden entirely on touch
 * devices, where there is no persistent pointer to follow, and under
 * `prefers-reduced-motion`, where a lagging follower is exactly the kind of
 * incidental movement that setting asks to remove.
 *
 * Nothing is drawn until the first real pointer movement, otherwise the dot
 * would sit parked in the top-left corner on load.
 */
export default function CursorWand() {
  const shouldReduceMotion = useReducedMotion();
  const isTouchDevice = useMediaQuery('(pointer: coarse)');
  const [visible, setVisible] = useState(false);
  const [overInteractive, setOverInteractive] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const tipX = useSpring(x, TIP);
  const tipY = useSpring(y, TIP);
  const haloX = useSpring(x, HALO);
  const haloY = useSpring(y, HALO);

  const disabled = shouldReduceMotion || isTouchDevice;

  useEffect(() => {
    if (disabled) return;

    const handleMove = (event: PointerEvent) => {
      // Only follow a real mouse/pen; a touch point is transient.
      if (event.pointerType === 'touch') return;
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);

      const target = event.target as Element | null;
      setOverInteractive(
        !!target?.closest?.('a[href], button, [role="button"], input, select, textarea')
      );
    };

    const handleLeave = () => setVisible(false);
    const handleEnter = () => setVisible(true);

    window.addEventListener('pointermove', handleMove, { passive: true });
    document.addEventListener('pointerleave', handleLeave);
    document.addEventListener('pointerenter', handleEnter);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerleave', handleLeave);
      document.removeEventListener('pointerenter', handleEnter);
    };
  }, [disabled, x, y]);

  if (disabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
      {/* Trailing halo */}
      <motion.div
        className="absolute rounded-full"
        style={{
          x: haloX,
          y: haloY,
          width: 26,
          height: 26,
          marginLeft: -13,
          marginTop: -13,
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--accent) 38%, transparent) 0%, transparent 70%)',
          filter: 'blur(2px)',
        }}
        animate={{
          opacity: visible ? (overInteractive ? 0.95 : 0.6) : 0,
          scale: overInteractive ? 1.9 : 1,
        }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Wand tip */}
      <motion.div
        className="absolute rounded-full bg-accent"
        style={{
          x: tipX,
          y: tipY,
          width: 6,
          height: 6,
          marginLeft: -3,
          marginTop: -3,
          boxShadow: '0 0 12px color-mix(in srgb, var(--accent) 65%, transparent)',
        }}
        animate={{
          opacity: visible ? 1 : 0,
          scale: overInteractive ? 0.45 : 1,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
