import { useMediaQuery } from '../lib/useMediaQuery';

/**
 * BackgroundLayer — the film-lab atmosphere.
 *
 * Replaces the previous animated glow stack (AmbientGlow / AnimatedGradientBg /
 * MagicParticles), which assumed a black canvas and could not survive the bone
 * surface. Everything here is static: a masked hairline grid, a grain plate, and
 * a vignette. No timers, no scroll listeners, nothing animating off-screen — the
 * previous version ran three infinite 34–46s loops on every page.
 *
 * The grid and grain both derive from the token layer, so they invert with
 * data-surface automatically.
 */
export default function BackgroundLayer() {
  const isTouchDevice = useMediaQuery('(pointer: coarse), (max-width: 767px)');

  return (
    <div
      aria-hidden="true"
      className="film-grain pointer-events-none fixed inset-0 z-0 overflow-hidden bg-canvas"
    >
      {/* Measurement grid, faded out towards the edges so it reads as a
          register mark rather than graph paper. */}
      <div
        className="hairline-grid absolute inset-0 opacity-[0.55]"
        style={{
          maskImage:
            'radial-gradient(ellipse at 50% 38%, black 0%, transparent 78%)',
        }}
      />

      {/* Single warm bloom in the top corner — the one piece of the old glow
          stack worth keeping, now static. Dropped entirely on touch devices. */}
      {!isTouchDevice && (
        <div
          className="absolute -right-40 -top-56 h-[46rem] w-[46rem] rounded-full opacity-[0.55]"
          style={{
            background:
              'radial-gradient(circle, color-mix(in oklab, var(--accent) 12%, transparent) 0%, transparent 62%)',
          }}
        />
      )}

      {/* Letterboxing vignette. */}
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
