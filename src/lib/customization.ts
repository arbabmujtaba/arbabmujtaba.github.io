import type { PostCustomization } from '../types';

/**
 * Converts PostCustomization settings into CSS class strings and inline style objects
 * for reuse across ContentModal and PreviewFrame.
 */

// Shadow presets mapped to CSS box-shadow values
const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  subtle: '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
  medium: '0 4px 12px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3)',
  dramatic: '0 10px 40px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)',
  glow: '0 0 20px rgba(249,115,22,0.15), 0 0 40px rgba(249,115,22,0.05)',
};

// Color filter presets mapped to CSS filter values
const COLOR_FILTER_MAP: Record<string, string> = {
  none: 'none',
  warm: 'sepia(20%) saturate(120%) brightness(105%)',
  cool: 'saturate(80%) hue-rotate(10deg) brightness(105%)',
  vintage: 'sepia(30%) contrast(90%) saturate(80%) brightness(95%)',
  noir: 'grayscale(100%) contrast(120%) brightness(90%)',
};

// Content width mapped to max-width classes
const WIDTH_MAP: Record<string, string> = {
  narrow: 'max-w-2xl',
  default: 'max-w-3xl',
  wide: 'max-w-4xl',
  full: 'max-w-full',
};

// Spacing presets mapped to padding values
const SPACING_MAP: Record<string, string> = {
  compact: '0.75rem',
  default: '1.5rem',
  relaxed: '2.5rem',
  spacious: '4rem',
};

// Animation speed mapped to duration in seconds
const SPEED_MAP: Record<string, number> = {
  slow: 1.4,
  normal: 0.8,
  fast: 0.4,
};

export function getAnimationVariants(customization?: PostCustomization) {
  const preset = customization?.animation?.preset || 'fade-in';
  const speed = customization?.animation?.speed || 'normal';
  const duration = SPEED_MAP[speed] || 0.8;

  switch (preset) {
    case 'slide-up':
      // Slides in from below with y-axis movement
      return {
        initial: { y: '100%', opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: '100%', opacity: 0 },
        transition: { type: 'spring' as const, damping: 28, stiffness: 200, duration },
      };
    case 'fade-in':
      // Pure opacity transition with no spatial movement
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
      };
    case 'cinematic':
      // Scale + opacity with dramatic slow reveal
      return {
        initial: { x: '100%', opacity: 0, scale: 0.95 },
        animate: { x: 0, opacity: 1, scale: 1 },
        exit: { x: '100%', opacity: 0, scale: 0.95 },
        transition: { type: 'spring' as const, damping: 20, stiffness: 100, duration: duration * 1.5 },
      };
    case 'parallax':
      // Y-axis with slower, heavier spring for depth/weight effect
      return {
        initial: { y: '60%', opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: '60%', opacity: 0 },
        transition: { type: 'spring' as const, damping: 15, stiffness: 60, mass: 1.5, duration: duration * 1.3 },
      };
    case 'typewriter':
      // Quick container reveal with staggered children cascade
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: duration * 0.4, staggerChildren: 0.06, delayChildren: 0.1 },
      };
    case 'none':
      return {
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
        transition: { duration: 0.3 },
      };
    default:
      return {
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
        transition: { type: 'spring' as const, damping: 25, stiffness: 180 },
      };
  }
}

export function getContentAnimationVariants(customization?: PostCustomization) {
  const preset = customization?.animation?.preset || 'none';
  const speed = customization?.animation?.speed || 'normal';
  const duration = SPEED_MAP[speed] || 0.8;

  switch (preset) {
    case 'slide-up':
      return {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
      };
    case 'fade-in':
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration, delay: 0.2 },
      };
    case 'cinematic':
      return {
        initial: { opacity: 0, scale: 0.96, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { duration: duration * 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
      };
    case 'parallax':
      // Heavier content reveal with depth-like slower motion
      return {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: duration * 1.5, delay: 0.25, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] },
      };
    case 'typewriter':
      // Stagger children with opacity cascade for text reveal feel
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2, delay: 0.05, staggerChildren: 0.04, delayChildren: 0.15 },
      };
    default:
      return {
        initial: {},
        animate: {},
        transition: {},
      };
  }
}

export function getContainerStyles(customization?: PostCustomization): React.CSSProperties {
  const style: React.CSSProperties = {};

  if (customization?.style?.opacity !== undefined && customization.style.opacity < 1) {
    style.opacity = customization.style.opacity;
  }

  if (customization?.style?.shadow && customization.style.shadow !== 'none') {
    style.boxShadow = SHADOW_MAP[customization.style.shadow] || 'none';
  }

  return style;
}

export function getCoverImageStyles(customization?: PostCustomization): React.CSSProperties {
  const style: React.CSSProperties = {};

  if (customization?.style?.borderRadius) {
    style.borderRadius = `${customization.style.borderRadius}px`;
  }

  if (customization?.effects?.colorFilter && customization.effects.colorFilter !== 'none') {
    style.filter = COLOR_FILTER_MAP[customization.effects.colorFilter] || 'none';
  }

  return style;
}

export function getContentWidthClass(customization?: PostCustomization): string {
  const width = customization?.layout?.contentWidth || 'default';
  return WIDTH_MAP[width] || 'max-w-3xl';
}

export function getTextAlignClass(customization?: PostCustomization): string {
  const align = customization?.layout?.textAlign;
  if (!align || align === 'left') return 'text-left';
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
}

export function getSpacingStyle(customization?: PostCustomization): React.CSSProperties {
  const spacing = customization?.layout?.spacing || 'default';
  const value = SPACING_MAP[spacing] || '1.5rem';
  return { gap: value };
}

export function getAccentColor(customization?: PostCustomization): string | undefined {
  const color = customization?.style?.accentColor;
  if (!color) return undefined;
  return isValidCSSColor(color) ? color : undefined;
}

/**
 * Validates that a string is a safe CSS color value (hex, named, rgb/hsl function).
 * Rejects values containing characters that could break inline style attributes.
 */
export function isValidCSSColor(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  // Reject empty, overly long, or values with dangerous characters
  if (trimmed.length === 0 || trimmed.length > 50) return false;
  if (/[;{}'"\\<>]/.test(trimmed)) return false;
  // Allow hex colors: #rgb, #rrggbb, #rrggbbaa
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) return true;
  // Allow CSS named colors (common subset)
  const namedColors = new Set([
    'aliceblue','antiquewhite','aqua','aquamarine','azure','beige','bisque','black','blanchedalmond',
    'blue','blueviolet','brown','burlywood','cadetblue','chartreuse','chocolate','coral','cornflowerblue',
    'cornsilk','crimson','cyan','darkblue','darkcyan','darkgoldenrod','darkgray','darkgreen','darkgrey',
    'darkkhaki','darkmagenta','darkolivegreen','darkorange','darkorchid','darkred','darksalmon',
    'darkseagreen','darkslateblue','darkslategray','darkslategrey','darkturquoise','darkviolet',
    'deeppink','deepskyblue','dimgray','dimgrey','dodgerblue','firebrick','floralwhite','forestgreen',
    'fuchsia','gainsboro','ghostwhite','gold','goldenrod','gray','green','greenyellow','grey',
    'honeydew','hotpink','indianred','indigo','ivory','khaki','lavender','lavenderblush','lawngreen',
    'lemonchiffon','lightblue','lightcoral','lightcyan','lightgoldenrodyellow','lightgray','lightgreen',
    'lightgrey','lightpink','lightsalmon','lightseagreen','lightskyblue','lightslategray',
    'lightslategrey','lightsteelblue','lightyellow','lime','limegreen','linen','magenta','maroon',
    'mediumaquamarine','mediumblue','mediumorchid','mediumpurple','mediumseagreen','mediumslateblue',
    'mediumspringgreen','mediumturquoise','mediumvioletred','midnightblue','mintcream','mistyrose',
    'moccasin','navajowhite','navy','oldlace','olive','olivedrab','orange','orangered','orchid',
    'palegoldenrod','palegreen','paleturquoise','palevioletred','papayawhip','peachpuff','peru','pink',
    'plum','powderblue','purple','rebeccapurple','red','rosybrown','royalblue','saddlebrown','salmon',
    'sandybrown','seagreen','seashell','sienna','silver','skyblue','slateblue','slategray','slategrey',
    'snow','springgreen','steelblue','tan','teal','thistle','tomato','turquoise','violet','wheat',
    'white','whitesmoke','yellow','yellowgreen','transparent','currentcolor','inherit'
  ]);
  if (namedColors.has(trimmed.toLowerCase())) return true;
  // Allow rgb(), rgba(), hsl(), hsla() functional notation
  if (/^(rgb|rgba|hsl|hsla)\(\s*[\d.,\s%]+\)$/.test(trimmed)) return true;
  return false;
}

export function getGradientStyle(customization?: PostCustomization): React.CSSProperties | null {
  const gradient = customization?.style?.gradient;
  if (!gradient?.enabled || !gradient.from || !gradient.to) return null;

  const angle = gradient.angle ?? 135;
  return {
    background: `linear-gradient(${angle}deg, ${gradient.from}, ${gradient.to})`,
  };
}

export function hasGrainEffect(customization?: PostCustomization): boolean {
  return customization?.effects?.grain === true;
}

export function hasVignetteEffect(customization?: PostCustomization): boolean {
  return customization?.effects?.vignette === true;
}

export function getBlurIntensity(customization?: PostCustomization): number {
  return customization?.effects?.blur || 0;
}

export function getColorFilterValue(customization?: PostCustomization): string {
  const filter = customization?.effects?.colorFilter || 'none';
  return COLOR_FILTER_MAP[filter] || 'none';
}

/**
 * Allowed embed domains for music player iframes and audio sources.
 */
const ALLOWED_EMBED_DOMAINS = [
  'open.spotify.com',
  'spotify.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'soundcloud.com',
  'w.soundcloud.com',
];

/**
 * Validates that a URL is safe to embed in an iframe or audio element.
 * Must be https:// and from an allowed domain, or a relative path / data URL for audio.
 */
export function isValidEmbedUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  // Must start with https://
  if (!trimmed.startsWith('https://')) return false;
  try {
    const parsed = new URL(trimmed);
    // Check protocol
    if (parsed.protocol !== 'https:') return false;
    // Check domain against allowlist
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_EMBED_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

/**
 * Validates that a URL is safe for use in an HTML5 audio element.
 * Allows https:// URLs (any domain since they are not iframed) and relative paths.
 */
export function isValidAudioUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  // Allow relative URLs (uploaded files)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  // Must be https
  if (!trimmed.startsWith('https://')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Detect music provider from URL if not explicitly set
 */
export function detectMusicProvider(url: string): 'spotify' | 'soundcloud' | 'youtube' | 'custom' {
  if (url.includes('spotify.com') || url.includes('open.spotify')) return 'spotify';
  if (url.includes('soundcloud.com')) return 'soundcloud';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'custom';
}

/**
 * Extract Spotify track ID from a Spotify URL
 */
export function extractSpotifyTrackId(url: string): string | null {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Generate CSS string for PreviewFrame srcdoc injection
 */
export function generatePreviewCSS(customization?: PostCustomization): string {
  if (!customization) return '';

  const rules: string[] = [];

  // Accent color
  if (customization.style?.accentColor && isValidCSSColor(customization.style.accentColor)) {
    rules.push(`h1, h2, h3, a { color: ${customization.style.accentColor} !important; }`);
  }

  // Border radius on cover image
  if (customization.style?.borderRadius) {
    rules.push(`.cover-image { border-radius: ${customization.style.borderRadius}px; overflow: hidden; }`);
  }

  // Shadow
  if (customization.style?.shadow && customization.style.shadow !== 'none') {
    const shadow = SHADOW_MAP[customization.style.shadow] || 'none';
    rules.push(`.preview-card { box-shadow: ${shadow}; }`);
  }

  // Gradient background
  if (customization.style?.gradient?.enabled && customization.style.gradient.from && customization.style.gradient.to) {
    const angle = customization.style.gradient.angle ?? 135;
    rules.push(`.gradient-overlay { background: linear-gradient(${angle}deg, ${customization.style.gradient.from}20, ${customization.style.gradient.to}20); position: absolute; inset: 0; pointer-events: none; z-index: 1; }`);
  }

  // Opacity
  if (customization.style?.opacity !== undefined && customization.style.opacity < 1) {
    rules.push(`.preview-content { opacity: ${customization.style.opacity}; }`);
  }

  // Content width
  if (customization.layout?.contentWidth) {
    const widthValues: Record<string, string> = { narrow: '42rem', default: '48rem', wide: '56rem', full: '100%' };
    rules.push(`.preview-content { max-width: ${widthValues[customization.layout.contentWidth] || '48rem'}; margin: 0 auto; }`);
  }

  // Text alignment
  if (customization.layout?.textAlign) {
    rules.push(`.markdown-body { text-align: ${customization.layout.textAlign}; }`);
  }

  // Spacing
  if (customization.layout?.spacing) {
    const spacingValues: Record<string, string> = { compact: '0.75rem', default: '1.5rem', relaxed: '2.5rem', spacious: '4rem' };
    rules.push(`.preview-content > * + * { margin-top: ${spacingValues[customization.layout.spacing] || '1.5rem'}; }`);
  }

  // Color filter on cover image
  if (customization.effects?.colorFilter && customization.effects.colorFilter !== 'none') {
    rules.push(`.cover-image img { filter: ${COLOR_FILTER_MAP[customization.effects.colorFilter]}; }`);
  }

  // Grain overlay
  if (customization.effects?.grain) {
    rules.push(`.grain-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 999; opacity: 0.04; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); }`);
  }

  // Vignette
  if (customization.effects?.vignette) {
    rules.push(`.vignette-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 998; box-shadow: inset 0 0 120px 40px rgba(0,0,0,0.6); }`);
  }

  if (rules.length === 0) return '';
  return `<style>${rules.join('\n')}</style>`;
}
