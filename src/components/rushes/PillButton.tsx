import type { ReactNode } from 'react';

interface PillButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  /** `solid` is the accent pill; `ghost` is a bordered pill on dark. */
  tone?: 'solid' | 'ghost';
  className?: string;
  ariaLabel?: string;
}

/**
 * PillButton — the fully-rounded uppercase action used for the header CTA and
 * the contact block.
 *
 * Always at least 44px tall so it is a comfortable touch target, and renders as
 * an anchor when given an href so external links stay real links.
 */
export default function PillButton({
  children,
  onClick,
  href,
  tone = 'solid',
  className = '',
  ariaLabel,
}: PillButtonProps) {
  const base =
    'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-6 font-mono text-[11px] uppercase tracking-[0.16em] transition-all duration-300';

  const tones = {
    solid: 'bg-accent text-canvas hover:brightness-110',
    ghost: 'border border-zinc-700 text-zinc-200 hover:border-accent hover:text-accent',
  } as const;

  const classes = `${base} ${tones[tone]} ${className}`;

  if (href) {
    const external = /^https?:\/\//i.test(href) || href.startsWith('mailto:');
    return (
      <a
        href={href}
        aria-label={ariaLabel}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={classes}>
      {children}
    </button>
  );
}
