import { motion, useReducedMotion } from 'motion/react';

interface AmbientGlowProps {
  className?: string;
  size?: string;
  color?: string;
  opacity?: number;
  x?: string[];
  y?: string[];
  duration?: number;
  delay?: number;
}

export default function AmbientGlow({
  className = '',
  size = '42rem',
  color = 'rgba(249,115,22,0.08)',
  opacity = 1,
  x = ['0%', '3%', '0%'],
  y = ['0%', '-2%', '0%'],
  duration = 24,
  delay = 0,
}: AmbientGlowProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className={`absolute rounded-full will-change-transform ${className}`}
      animate={shouldReduceMotion ? undefined : { x, y }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: size,
        height: size,
        opacity,
        background: `radial-gradient(circle, ${color} 0%, rgba(249,115,22,0.026) 34%, transparent 68%)`,
        filter: 'blur(42px)',
        transform: 'translate3d(0,0,0)',
      }}
    />
  );
}
