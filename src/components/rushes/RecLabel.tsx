import { motion, useReducedMotion } from 'motion/react';

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
          className="-m-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-alarm"
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
      <span>
        {lowercase ? 'rec:' : 'REC:'} {children}
      </span>
    </div>
  );
}
