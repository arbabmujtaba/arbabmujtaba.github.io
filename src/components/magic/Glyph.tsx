/**
 * Glyph — the hidden layer's small line drawings: the seven collectibles plus
 * the wand. Hand-drawn in SVG so they inherit currentColor and cost nothing.
 */

const PATHS: Record<string, React.ReactNode> = {
  wand: (
    <>
      <path d="M4 20 L16.5 7.5" />
      <path d="M15 6 l1.5 -3 l1.5 3 l3 1.5 l-3 1.5 l-1.5 3 l-1.5 -3 l-3 -1.5 z" strokeWidth="1.1" />
    </>
  ),
  lantern: (
    <>
      <path d="M9 4h6M12 2v2M8 7h8l1 10H7z" />
      <path d="M7 17h10l-1 3H8z" />
      <path d="M12 10c1.2 1.2 1.2 3 0 4-1.2-1-1.2-2.8 0-4z" />
    </>
  ),
  key: (
    <>
      <circle cx="7.5" cy="12" r="3.5" />
      <path d="M11 12h10M17 12v3M20 12v2" />
    </>
  ),
  lens: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 4v3.8M18.9 8l-3.3 1.9M18.9 16l-3.3-1.9M12 20v-3.8M5.1 16l3.3-1.9M5.1 8l3.3 1.9" strokeWidth="1" />
    </>
  ),
  star: <path d="M12 3l2.4 5.6 6.1.5-4.6 4 1.4 6-5.3-3.2-5.3 3.2 1.4-6-4.6-4 6.1-.5z" />,
  seal: (
    <>
      <path d="M12 3c2 0 2.6 1.4 4.3 1.9 1.8.6 3.2 1 3.4 3 .2 1.8-.9 2.6-.9 4.1s1.1 2.3.9 4.1c-.2 2-1.6 2.4-3.4 3-1.7.5-2.3 1.9-4.3 1.9s-2.6-1.4-4.3-1.9c-1.8-.6-3.2-1-3.4-3-.2-1.8.9-2.6.9-4.1S4.1 9.7 4.3 7.9c.2-2 1.6-2.4 3.4-3C9.4 4.4 10 3 12 3z" />
      <path d="M9 14.5l1.6-5 1.4 3.6 1.4-3.6 1.6 5" strokeWidth="1.1" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.8 9.2l-1.6 4-4 1.6 1.6-4z" />
      <path d="M12 3.5v1.6M12 18.9v1.6M3.5 12h1.6M18.9 12h1.6" strokeWidth="1" />
    </>
  ),
  quill: (
    <>
      <path d="M20 4C12 5 7.5 10 6 18" />
      <path d="M20 4c-.5 5-4 9.5-10.5 10.8" />
      <path d="M6 18l-2 2M9.5 11.5l3 1" strokeWidth="1" />
    </>
  ),
  moon: <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  door: (
    <>
      <path d="M6 21V9a6 6 0 0 1 12 0v12" />
      <path d="M4 21h16M14.5 14.5v.5" />
    </>
  ),
};

interface GlyphProps {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  title?: string;
}

export default function Glyph({ name, size = 18, className = '', strokeWidth = 1.4, title }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {PATHS[name] ?? PATHS.star}
    </svg>
  );
}
