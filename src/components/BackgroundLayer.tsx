import { useMemo } from 'react';
import { useReducedMotion } from 'motion/react';
import { useMediaQuery } from '../lib/useMediaQuery';

/** Deterministic star field, so the sky is the same on every visit. */
function starField(count: number, seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return Array.from({ length: count }, (_, i) => ({
    x: rand() * 100,
    y: rand() * 100,
    r: rand() < 0.12 ? 1.1 : 0.55 + rand() * 0.4,
    o: 0.25 + rand() * 0.5,
    twinkle: i % 9 === 0,
    delay: rand() * 8,
  }));
}

/**
 * BackgroundLayer — the atmosphere behind every page.
 *
 * Night: the film-lab canvas, and a few stars — sparse, mostly still; one in
 * nine breathes slowly, and none do under reduced motion. Day: paper, a warm
 * wash in the top corner where the light comes in. Everything is static
 * otherwise: no timers, no scroll listeners.
 */
export default function BackgroundLayer() {
  const isTouchDevice = useMediaQuery('(pointer: coarse), (max-width: 767px)');
  const reduced = useReducedMotion();
  const stars = useMemo(() => starField(isTouchDevice ? 34 : 70, 20190601), [isTouchDevice]);

  return (
    <div
      aria-hidden="true"
      className="film-grain pointer-events-none fixed inset-0 z-0 overflow-hidden bg-canvas"
    >
      <div
        className="hairline-grid absolute inset-0 opacity-[0.55]"
        style={{ maskImage: 'radial-gradient(ellipse at 50% 38%, black 0%, transparent 78%)' }}
      />

      {/* night sky */}
      <svg className="night-only absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {stars.map((star, i) => (
          <circle
            key={i}
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.r}
            fill="var(--gilt)"
            style={{
              opacity: star.o,
              ['--o' as string]: star.o,
              animation: star.twinkle && !reduced ? `star-twinkle ${6 + star.delay}s ease-in-out ${star.delay}s infinite` : undefined,
            }}
          />
        ))}
      </svg>

      {!isTouchDevice && (
        <div
          className="night-only absolute -right-40 -top-56 h-[46rem] w-[46rem] rounded-full opacity-[0.55]"
          style={{ background: 'radial-gradient(circle, color-mix(in oklab, var(--accent) 12%, transparent) 0%, transparent 62%)' }}
        />
      )}

      {/* daylight through a window, top left */}
      <div
        className="day-only absolute -left-40 -top-40 h-[52rem] w-[52rem] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255, 236, 196, 0.85) 0%, rgba(255, 236, 196, 0) 65%)' }}
      />

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
