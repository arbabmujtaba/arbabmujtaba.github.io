import { useRef, useState, useEffect } from 'react';
import { useReducedMotion } from 'motion/react';
import { normalizeImagePath } from '../lib/image';

interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}

/**
 * The site scrolls inside nested `overflow-y-auto` containers rather than the
 * window, so a window-bound scroll listener never fires for these images. We
 * resolve the real scroll ancestor and listen to ITS scroll events — which is
 * also what makes the parallax respond to touch scrolling on mobile.
 */
function findScrollParent(node: HTMLElement | null): HTMLElement | null {
  let el = node?.parentElement ?? null;
  while (el && el !== document.body && el !== document.documentElement) {
    const oy = getComputedStyle(el).overflowY;
    if (oy === 'auto' || oy === 'scroll' || oy === 'overlay') return el;
    el = el.parentElement;
  }
  return null;
}

export default function ParallaxImage({ src, alt, className = '', imageClassName = '' }: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [failed, setFailed] = useState(false);

  const normalized = normalizeImagePath(src);
  // Parallax runs on every device; it's only skipped when the visitor asked for
  // reduced motion or there's no image to show.
  const enabled = !shouldReduceMotion && !!normalized && !failed;

  useEffect(() => {
    if (!enabled) return;
    const container = ref.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const scrollParent = findScrollParent(container);
    const scrollTarget: HTMLElement | Window = scrollParent ?? window;

    let frame = 0;
    let active = true;

    const apply = () => {
      frame = 0;
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Smaller travel on phones keeps motion smooth on weaker GPUs without
      // disabling the effect (was previously turned off below 768px). Computed
      // each frame so it re-tunes on resize / orientation change.
      const travel = window.innerWidth < 768 ? 0.08 : 0.15; // fraction of element height, each direction
      // -1 (just leaving above) → 0 (centered) → 1 (entering from below)
      const center = rect.top + rect.height / 2;
      const rel = (center - vh / 2) / (vh / 2 + rect.height / 2);
      const clamped = Math.max(-1, Math.min(1, rel));
      // Pixel translate (relative to element height) avoids edge-reveal; the
      // inner layer is oversized (136%) so the shift never exposes a gap.
      inner.style.transform = `translate3d(0, ${(clamped * travel * rect.height).toFixed(1)}px, 0)`;
    };

    const schedule = () => {
      if (active && !frame) frame = requestAnimationFrame(apply);
    };

    // Only spend work while the image is near the viewport.
    const io = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
        if (active) schedule();
      },
      { rootMargin: '120px 0px' }
    );
    io.observe(container);

    apply();
    scrollTarget.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      io.disconnect();
      scrollTarget.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  // If no valid image source, render a subtle placeholder so layout doesn't collapse
  if (!normalized || failed) {
    return (
      <div ref={ref} className={`relative overflow-hidden bg-zinc-900 ${className}`} aria-hidden="true">
        <div className="w-full h-full bg-zinc-900/50" />
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <div
        ref={innerRef}
        style={
          enabled
            ? { position: 'absolute', top: '-18%', left: 0, width: '100%', height: '136%', willChange: 'transform' }
            : { position: 'absolute', inset: 0, width: '100%', height: '100%' }
        }
      >
        <img
          src={normalized}
          alt={alt}
          loading="lazy"
          className={`w-full h-full object-cover ${imageClassName}`}
          onError={() => setFailed(true)}
        />
      </div>
    </div>
  );
}
