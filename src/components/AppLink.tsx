import type { MouseEvent, ReactNode } from 'react';
import { navigate, shouldInterceptClick } from '../lib/navigation';

interface AppLinkProps {
  /** In-site path, e.g. `/journal` or `/journal/growing-up`. */
  to: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  /** Run before navigating — used to close an overlay, for example. */
  onNavigate?: () => void;
}

/**
 * AppLink — an in-site link that is a real anchor.
 *
 * The site routes with `history.pushState`, but every internal link still
 * renders `<a href>` so it is crawlable, shows a target in the status bar, and
 * supports cmd/ctrl-click, middle-click and "open in new tab". Only a plain
 * left click is intercepted.
 */
export default function AppLink({
  to,
  children,
  className = '',
  ariaLabel,
  onNavigate,
}: AppLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!shouldInterceptClick(event)) return;
    event.preventDefault();
    onNavigate?.();
    navigate(to);
  };

  return (
    <a href={to} aria-label={ariaLabel} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
