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
 * window. Rather than reacting to scroll *events* (which fire in sparse bursts
 * during mobile momentum scrolling and make the motion stutter), we run a
 * frame-synced loop that reads the element's real position every frame and
 * eases toward it — smooth regardless of how scroll events are delivered. The
 * loop only runs while the image is in view and parks itself once motion settles.
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

    const scrollTarget: HTMLElement | Window = findScrollParent(container) ?? window;

    let raf = 0;
    let inView = false;
    let current = 0;        // currently applied offset (px)
    let lastTop = NaN;      // last measured rect.top, to detect a settled scroll
    let idleFrames = 0;

    const measureTarget = () => {
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Lighter travel on phones keeps motion smooth without disabling it;
      // recomputed each frame so it adapts to resize / orientation changes.
      const travel = window.innerWidth < 768 ? 0.08 : 0.15; // fraction of element height
      const center = rect.top + rect.height / 2;
      const rel = (center - vh / 2) / (vh / 2 + rect.height / 2); // -1 → 0 → 1
      const clamped = Math.max(-1, Math.min(1, rel));
      // Oversized inner (136%) means this shift never reveals an edge.
      return { target: clamped * travel * rect.height, top: rect.top };
    };

    const tick = () => {
      const { target, top } = measureTarget();
      // Ease toward the live target for a smooth, spring-like trail.
      current += (target - current) * 0.18;
      if (Math.abs(target - current) < 0.08) current = target;
      inner.style.transform = `translate3d(0, ${current.toFixed(2)}px, 0)`;

      // Park the loop once both the scroll position and the motion have settled,
      // so we don't spin rAF while idle. A scroll/resize event re-arms it.
      if (top === lastTop && current === target) idleFrames++;
      else idleFrames = 0;
      lastTop = top;

      if (inView && idleFrames < 4) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const kick = () => {
      idleFrames = 0;
      if (inView && !raf) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        // Only promote to a GPU layer while actually on screen — keeps the
        // number of composited layers (and mobile memory pressure) low.
        inner.style.willChange = inView ? 'transform' : 'auto';
        kick();
      },
      { rootMargin: '140px 0px' }
    );
    io.observe(container);

    scrollTarget.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick, { passive: true });

    // Position correctly on mount with no entrance jump.
    const { target } = measureTarget();
    current = target;
    inner.style.transform = `translate3d(0, ${current.toFixed(2)}px, 0)`;

    return () => {
      io.disconnect();
      scrollTarget.removeEventListener('scroll', kick);
      window.removeEventListener('resize', kick);
      if (raf) cancelAnimationFrame(raf);
      inner.style.willChange = 'auto';
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
            ? { position: 'absolute', top: '-18%', left: 0, width: '100%', height: '136%' }
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
