interface TagChipProps {
  children: React.ReactNode;
  /** `signal` is reserved for live/active state, `accent` for categories. */
  tone?: 'default' | 'accent' | 'signal';
  className?: string;
}

const TONES: Record<NonNullable<TagChipProps['tone']>, string> = {
  default: 'border-zinc-800 text-zinc-400',
  accent: 'border-accent/40 text-accent',
  signal: 'border-signal/40 text-signal',
};

/**
 * TagChip — the uppercase category tag on cards and plates.
 */
export default function TagChip({
  children,
  tone = 'default',
  className = '',
}: TagChipProps) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-1 font-mono text-[9px] uppercase leading-none tracking-[0.2em] ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
