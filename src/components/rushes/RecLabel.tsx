import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/** Characters the label cycles through while it resolves — all in the mono face, so nothing changes width. */
const NOISE = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#/+:';
const DECODE_MS = 650;

/**
 * The label resolves out of noise the first time it comes into view, the way
 * a slate is read off a monitor. One pass, then plain text; the real words are
 * on the page from the first paint (and for screen readers throughout), and
 * reduced motion skips it.
 */
function useDecode(text: string | null, enabled: boolean) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(text);
  useEffect(() => {
    setShown(text);
    const node = ref.current;
    if (!enabled || !text || !node || typeof IntersectionObserver === 'undefined') return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        let start = 0;
        const run = (now: number) => {
          if (!start) start = now;
          const progress = (now - start) / DECODE_MS;
          if (progress >= 1) {
            setShown(text);
            return;
          }
          const settled = Math.floor(progress * text.length);
          const tick = Math.floor(now / 45);
          setShown(
            Array.from(text, (c, i) => (i < settled || c === ' ' ? c : NOISE[(i * 7 + tick) % NOISE.length])).join('')
          );
          frame = requestAnimationFrame(run);
        };
        frame = requestAnimationFrame(run);
      },
      { threshold: 0.9 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text, enabled]);
  return [ref, shown] as const;
}

interface RecLabelProps {
  /** Section name, rendered after the REC prefix. */
  children: React.ReactNode;
  /** Lowercase the prefix, e.g. the hero uses `rec:` rather than `REC:`. */
  lowercase?: boolean;
  /** Bone-white text instead of muted — for use over imagery. */
  bright?: boolean;
  /** Hide the recording dot. */
  quiet?: boolean;
  className?: string;
  /** Makes the tally light a (discreet) button — used by the darkroom door. */
  onDot?: () => void;
  dotLabel?: string;
}

/**
 * RecLabel — the section eyebrow used throughout the site.
 *
 * Mono, tracked, uppercase, prefixed by a recording indicator. The dot is the
 * deep red of a tally light rather than the accent colour, so the label reads as
 * instrumentation instead of decoration. It stops pulsing under
 * prefers-reduced-motion.
 */
export default function RecLabel({
  children,
  lowercase = false,
  bright = false,
  quiet = false,
  className = '',
  onDot,
  dotLabel = 'A red light',
}: RecLabelProps) {
  const shouldReduceMotion = useReducedMotion();
  const text = `${lowercase ? 'rec:' : 'REC:'} ${typeof children === 'string' ? children : ''}`;
  const [labelRef, shown] = useDecode(typeof children === 'string' ? text : null, !shouldReduceMotion);

  return (
    <div
      className={`flex items-center gap-2.5 font-mono text-[10px] leading-none tracking-[0.2em] ${
        bright ? 'text-zinc-100' : 'text-zinc-400'
      } ${lowercase ? '' : 'uppercase'} ${className}`}
    >
      {!quiet && onDot && (
        <button
          type="button"
          onClick={onDot}
          aria-label={dotLabel}
          data-enchanted="safelight"
          className="-m-[18px] flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-alarm"
        >
          <motion.span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-full bg-alarm"
            initial={{ opacity: 1 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </button>
      )}
      {!quiet && !onDot && (
        <motion.span
          aria-hidden="true"
          className="inline-block h-2 w-2 shrink-0 rounded-full bg-alarm"
          initial={{ opacity: 1 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {typeof children === 'string' ? (
        <span ref={labelRef}>
          <span className="sr-only">{text}</span>
          <span aria-hidden="true">{shown}</span>
        </span>
      ) : (
        <span>
          {lowercase ? 'rec:' : 'REC:'} {children}
        </span>
      )}
    </div>
  );
}
