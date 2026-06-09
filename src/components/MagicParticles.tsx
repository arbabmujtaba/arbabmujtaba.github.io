import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  drift: number;
}

function seededNoise(seed: number) {
  const value = Math.sin(seed * 9281.73) * 43758.5453;
  return value - Math.floor(value);
}

export default function MagicParticles() {
  const shouldReduceMotion = useReducedMotion();

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 34 }, (_, index) => ({
        id: index,
        x: seededNoise(index + 1) * 100,
        y: seededNoise(index + 12) * 100,
        size: seededNoise(index + 23) * 2.4 + 0.6,
        duration: seededNoise(index + 34) * 18 + 18,
        delay: seededNoise(index + 45) * 6,
        opacity: seededNoise(index + 56) * 0.35 + 0.08,
        drift: seededNoise(index + 67) * 50 - 25,
      })),
    []
  );

  if (shouldReduceMotion) {
    return <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_20%,rgba(249,115,22,0.045),transparent_45%)]" />;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-orange-300"
          initial={{
            x: `${particle.x}%`,
            y: `${particle.y}%`,
            opacity: 0,
            scale: 0.4,
          }}
          animate={{
            x: [`${particle.x}%`, `calc(${particle.x}% + ${particle.drift}px)`, `${particle.x}%`],
            y: [`${particle.y}%`, `${particle.y - 24}%`, `${particle.y - 52}%`],
            opacity: [0, particle.opacity, particle.opacity * 0.65, 0],
            scale: [0.35, 1, 0.8, 0.25],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: particle.size,
            height: particle.size,
            filter: 'blur(0.7px)',
            boxShadow: '0 0 18px rgba(251, 146, 60, 0.42)',
          }}
        />
      ))}

      <motion.div
        className="absolute left-[12%] top-[18%] h-px w-40 origin-left bg-gradient-to-r from-transparent via-orange-300/25 to-transparent"
        animate={{ opacity: [0, 0.55, 0], x: [-30, 120], y: [0, -34] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      />
      <motion.div
        className="absolute bottom-[22%] right-[10%] h-px w-52 origin-left bg-gradient-to-r from-transparent via-orange-300/20 to-transparent"
        animate={{ opacity: [0, 0.45, 0], x: [70, -110], y: [0, -42] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut', delay: 4.4 }}
      />
    </div>
  );
}
