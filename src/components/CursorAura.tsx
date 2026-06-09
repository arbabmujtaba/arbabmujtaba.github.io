import { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

export default function CursorAura() {
  const shouldReduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const smoothX = useSpring(cursorX, { stiffness: 180, damping: 28, mass: 0.35 });
  const smoothY = useSpring(cursorY, { stiffness: 180, damping: 28, mass: 0.35 });

  useEffect(() => {
    if (shouldReduceMotion || window.matchMedia('(pointer: coarse)').matches) return;

    const handleMove = (event: PointerEvent) => {
      setVisible(true);
      cursorX.set(event.clientX);
      cursorY.set(event.clientY);
      const target = event.target as HTMLElement | null;
      setHovering(Boolean(target?.closest('button, a, [role="button"], .cursor-magnetic')));
    };

    const handleLeave = () => setVisible(false);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerleave', handleLeave);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerleave', handleLeave);
    };
  }, [cursorX, cursorY, shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[120] hidden h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen md:block"
      style={{
        x: smoothX,
        y: smoothY,
        background:
          'radial-gradient(circle, rgba(251,146,60,0.20) 0%, rgba(251,146,60,0.075) 32%, transparent 70%)',
        filter: 'blur(10px)',
      }}
      animate={{
        opacity: visible ? 1 : 0,
        scale: hovering ? 1.45 : 1,
      }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    />
  );
}
