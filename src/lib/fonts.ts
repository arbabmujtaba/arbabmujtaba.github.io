/**
 * Typeface catalogue for per-post typography.
 *
 * The site itself ships two families (Host Grotesk and Fragment Mono, loaded
 * from index.html). Everything else here is fetched from Google Fonts on demand,
 * the first time a post that asks for it is rendered, so a post that uses the
 * defaults never pays for the rest.
 *
 * `serif`, `sans` and `mono` are the keys the first version of the customization
 * panel wrote into front-matter; they stay valid so old posts do not change.
 */

export type FontGroup = 'Site' | 'Serif' | 'Sans' | 'Display' | 'Mono' | 'Handwriting';

export interface FontOption {
  /** Stable id written to front-matter. */
  id: string;
  label: string;
  group: FontGroup;
  /** CSS font-family stack. */
  stack: string;
  /** Google Fonts `family=` query value, absent for fonts the site already ships. */
  google?: string;
}

const SERIF_FALLBACK = 'ui-serif, Georgia, Cambria, "Times New Roman", serif';
const SANS_FALLBACK = 'ui-sans-serif, system-ui, sans-serif';
const MONO_FALLBACK = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export const FONT_OPTIONS: FontOption[] = [
  // The site's own faces — selecting "Host Grotesk" is the explicit default.
  { id: 'sans', label: 'Host Grotesk (site)', group: 'Site', stack: `"Host Grotesk", ${SANS_FALLBACK}` },
  { id: 'mono', label: 'Fragment Mono (site)', group: 'Site', stack: `"Fragment Mono", ${MONO_FALLBACK}` },
  { id: 'serif', label: 'System serif', group: 'Site', stack: SERIF_FALLBACK },

  { id: 'playfair-display', label: 'Playfair Display', group: 'Serif', stack: `"Playfair Display", ${SERIF_FALLBACK}`, google: 'Playfair+Display:ital,wght@0,400..800;1,400..800' },
  { id: 'lora', label: 'Lora', group: 'Serif', stack: `"Lora", ${SERIF_FALLBACK}`, google: 'Lora:ital,wght@0,400..700;1,400..700' },
  { id: 'merriweather', label: 'Merriweather', group: 'Serif', stack: `"Merriweather", ${SERIF_FALLBACK}`, google: 'Merriweather:ital,wght@0,300..900;1,300..900' },
  { id: 'cormorant-garamond', label: 'Cormorant Garamond', group: 'Serif', stack: `"Cormorant Garamond", ${SERIF_FALLBACK}`, google: 'Cormorant+Garamond:ital,wght@0,300..700;1,300..700' },
  { id: 'eb-garamond', label: 'EB Garamond', group: 'Serif', stack: `"EB Garamond", ${SERIF_FALLBACK}`, google: 'EB+Garamond:ital,wght@0,400..800;1,400..800' },
  { id: 'libre-baskerville', label: 'Libre Baskerville', group: 'Serif', stack: `"Libre Baskerville", ${SERIF_FALLBACK}`, google: 'Libre+Baskerville:ital,wght@0,400..700;1,400..700' },
  { id: 'source-serif-4', label: 'Source Serif 4', group: 'Serif', stack: `"Source Serif 4", ${SERIF_FALLBACK}`, google: 'Source+Serif+4:ital,wght@0,300..900;1,300..900' },
  { id: 'fraunces', label: 'Fraunces', group: 'Serif', stack: `"Fraunces", ${SERIF_FALLBACK}`, google: 'Fraunces:ital,wght@0,300..900;1,300..900' },

  { id: 'inter', label: 'Inter', group: 'Sans', stack: `"Inter", ${SANS_FALLBACK}`, google: 'Inter:wght@300..800' },
  { id: 'dm-sans', label: 'DM Sans', group: 'Sans', stack: `"DM Sans", ${SANS_FALLBACK}`, google: 'DM+Sans:ital,wght@0,300..800;1,300..800' },
  { id: 'manrope', label: 'Manrope', group: 'Sans', stack: `"Manrope", ${SANS_FALLBACK}`, google: 'Manrope:wght@300..800' },
  { id: 'space-grotesk', label: 'Space Grotesk', group: 'Sans', stack: `"Space Grotesk", ${SANS_FALLBACK}`, google: 'Space+Grotesk:wght@300..700' },
  { id: 'outfit', label: 'Outfit', group: 'Sans', stack: `"Outfit", ${SANS_FALLBACK}`, google: 'Outfit:wght@300..800' },
  { id: 'work-sans', label: 'Work Sans', group: 'Sans', stack: `"Work Sans", ${SANS_FALLBACK}`, google: 'Work+Sans:ital,wght@0,300..800;1,300..800' },
  { id: 'sora', label: 'Sora', group: 'Sans', stack: `"Sora", ${SANS_FALLBACK}`, google: 'Sora:wght@300..800' },

  { id: 'bebas-neue', label: 'Bebas Neue', group: 'Display', stack: `"Bebas Neue", ${SANS_FALLBACK}`, google: 'Bebas+Neue' },
  { id: 'abril-fatface', label: 'Abril Fatface', group: 'Display', stack: `"Abril Fatface", ${SERIF_FALLBACK}`, google: 'Abril+Fatface' },
  { id: 'dm-serif-display', label: 'DM Serif Display', group: 'Display', stack: `"DM Serif Display", ${SERIF_FALLBACK}`, google: 'DM+Serif+Display:ital@0;1' },
  { id: 'oswald', label: 'Oswald', group: 'Display', stack: `"Oswald", ${SANS_FALLBACK}`, google: 'Oswald:wght@300..700' },
  { id: 'syne', label: 'Syne', group: 'Display', stack: `"Syne", ${SANS_FALLBACK}`, google: 'Syne:wght@400..800' },

  { id: 'jetbrains-mono', label: 'JetBrains Mono', group: 'Mono', stack: `"JetBrains Mono", ${MONO_FALLBACK}`, google: 'JetBrains+Mono:ital,wght@0,300..800;1,300..800' },
  { id: 'ibm-plex-mono', label: 'IBM Plex Mono', group: 'Mono', stack: `"IBM Plex Mono", ${MONO_FALLBACK}`, google: 'IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;1,400' },
  { id: 'space-mono', label: 'Space Mono', group: 'Mono', stack: `"Space Mono", ${MONO_FALLBACK}`, google: 'Space+Mono:ital,wght@0,400;0,700;1,400' },

  { id: 'caveat', label: 'Caveat', group: 'Handwriting', stack: `"Caveat", cursive`, google: 'Caveat:wght@400..700' },
  { id: 'dancing-script', label: 'Dancing Script', group: 'Handwriting', stack: `"Dancing Script", cursive`, google: 'Dancing+Script:wght@400..700' },
  { id: 'kalam', label: 'Kalam', group: 'Handwriting', stack: `"Kalam", cursive`, google: 'Kalam:wght@300;400;700' },
];

const BY_ID = new Map(FONT_OPTIONS.map((font) => [font.id, font]));

export const FONT_GROUPS: FontGroup[] = ['Site', 'Serif', 'Sans', 'Display', 'Mono', 'Handwriting'];

export function getFontOption(id: string | undefined): FontOption | undefined {
  return id ? BY_ID.get(id) : undefined;
}

/**
 * CSS stack for a stored font id. Unknown ids resolve to undefined, so a typo in
 * front-matter falls back to the site font rather than to a browser default.
 */
export function resolveFontStack(id: string | undefined): string | undefined {
  return getFontOption(id)?.stack;
}

const requested = new Set<string>();

/**
 * Ask Google Fonts for a face, once. Safe to call on every render: repeat calls
 * for the same id are a Set lookup. A no-op outside the browser and for faces
 * the site already ships.
 */
export function ensureFontLoaded(id: string | undefined): void {
  if (typeof document === 'undefined') return;
  const font = getFontOption(id);
  if (!font?.google || requested.has(font.id)) return;
  requested.add(font.id);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.dataset.postFont = font.id;
  link.href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`;
  document.head.appendChild(link);
}
