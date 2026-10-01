import type { CSSProperties } from 'react';
import type { Variants } from 'motion/react';
import type { PostCustomization, ColorFilterPreset, ImageAspect } from '../types';
import { resolveFontStack } from './fonts';

/**
 * Turns a post's `customization` front-matter into the CSS the page renders
 * with. Everything the admin's Style Studio can set is read here, and only here,
 * so the live preview, the quick-look drawer and the public page cannot drift
 * apart: they all call these functions.
 */

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const isNum = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  subtle: '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
  medium: '0 8px 24px rgba(0,0,0,0.38), 0 2px 8px rgba(0,0,0,0.28)',
  dramatic: '0 24px 70px rgba(0,0,0,0.65), 0 8px 24px rgba(0,0,0,0.45)',
  glow: '0 0 36px var(--accent-soft), 0 0 90px var(--accent-soft)',
};

/** Colour-grade presets. Each is a CSS `filter` chain applied to the media. */
export const COLOR_FILTER_MAP: Record<ColorFilterPreset, string> = {
  none: '',
  warm: 'sepia(0.25) saturate(1.2) brightness(1.05) hue-rotate(-8deg)',
  cool: 'saturate(0.85) hue-rotate(12deg) brightness(1.04) contrast(1.03)',
  vintage: 'sepia(0.45) contrast(0.88) saturate(0.78) brightness(0.98) hue-rotate(-6deg)',
  noir: 'grayscale(1) contrast(1.25) brightness(0.92)',
  faded: 'contrast(0.82) saturate(0.7) brightness(1.1)',
  cinematic: 'contrast(1.12) saturate(0.85) brightness(0.94) hue-rotate(-4deg)',
  vivid: 'saturate(1.45) contrast(1.08)',
};

const WIDTH_MAP: Record<string, string> = {
  narrow: 'max-w-2xl',
  default: 'max-w-3xl',
  wide: 'max-w-4xl',
  full: 'max-w-full',
};

/** Block gap presets, in px. 'default' is the long-standing 3rem. */
const SPACING_PX: Record<string, number> = {
  compact: 24,
  default: 48,
  relaxed: 72,
  spacious: 96,
};

const SPEED_MAP: Record<string, number> = {
  slow: 1.3,
  normal: 0.8,
  fast: 0.4,
};

const FONT_SCALE_MAP: Record<string, number> = {
  small: 0.9,
  default: 1,
  large: 1.15,
  'x-large': 1.3,
};

/** Body copy is 17px on desktop by default; px sizes scale headings from that. */
const BASE_BODY_PX = 17;

export const ASPECT_OPTIONS: { id: ImageAspect; label: string; ratio?: number }[] = [
  { id: 'auto', label: 'Original' },
  { id: '21/9', label: '21:9', ratio: 21 / 9 },
  { id: '16/9', label: '16:9', ratio: 16 / 9 },
  { id: '3/2', label: '3:2', ratio: 3 / 2 },
  { id: '4/3', label: '4:3', ratio: 4 / 3 },
  { id: '1/1', label: '1:1', ratio: 1 },
  { id: '3/4', label: '3:4', ratio: 3 / 4 },
  { id: '2/3', label: '2:3', ratio: 2 / 3 },
];

export const aspectRatioOf = (aspect: ImageAspect | undefined): number | undefined =>
  ASPECT_OPTIONS.find((option) => option.id === (aspect || '16/9'))?.ratio;

const PLATE_WIDTH: Record<string, string> = {
  full: '100%',
  large: '82%',
  medium: '62%',
  small: '42%',
};

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

type Bezier = [number, number, number, number];
const EASE_OUT: Bezier = [0.16, 1, 0.3, 1];

/** Drawer entrance: how the quick-look panel arrives. Unchanged behaviour. */
export function getAnimationVariants(customization?: PostCustomization) {
  const preset = customization?.animation?.preset || 'fade-in';
  const speed = customization?.animation?.speed || 'normal';
  const duration = SPEED_MAP[speed] || 0.8;

  switch (preset) {
    case 'slide-up':
      return {
        initial: { y: '100%', opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: '100%', opacity: 0 },
        transition: { type: 'spring' as const, damping: 28, stiffness: 200, duration },
      };
    case 'fade-in':
    case 'blur-in':
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration, ease: EASE_OUT },
      };
    case 'zoom':
      return {
        initial: { opacity: 0, scale: 0.94 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.94 },
        transition: { duration, ease: EASE_OUT },
      };
    case 'cinematic':
      return {
        initial: { x: '100%', opacity: 0, scale: 0.95 },
        animate: { x: 0, opacity: 1, scale: 1 },
        exit: { x: '100%', opacity: 0, scale: 0.95 },
        transition: { type: 'spring' as const, damping: 20, stiffness: 100, duration: duration * 1.5 },
      };
    case 'parallax':
      return {
        initial: { y: '60%', opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: '60%', opacity: 0 },
        transition: { type: 'spring' as const, damping: 15, stiffness: 60, mass: 1.5, duration: duration * 1.3 },
      };
    case 'typewriter':
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: duration * 0.4 },
      };
    default:
      return {
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
        transition: { duration: 0.3 },
      };
  }
}

export interface RevealPlan {
  /** False for `none`, and under reduced motion. Render plain blocks. */
  enabled: boolean;
  /** Reveal each block as it scrolls into view instead of all at once on load. */
  onScroll: boolean;
  /** Type the title out letter by letter. */
  typeTitle: boolean;
  /** Seconds per typed character. */
  typeStep: number;
  container: Variants;
  /** Per-block variants. `custom` is the block's index, for depth-based presets. */
  item: Variants;
}

/**
 * The reveal every block of the article plays. Each preset is a different
 * movement — not a different duration of the same one — so switching between
 * them is something you can actually see.
 */
export function getRevealPlan(
  customization?: PostCustomization,
  reducedMotion = false
): RevealPlan {
  const preset = customization?.animation?.preset || 'none';
  const duration = SPEED_MAP[customization?.animation?.speed || 'normal'] || 0.8;
  const onScroll = customization?.animation?.trigger === 'scroll';
  const stagger = duration * 0.16;

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
  };

  const base = { duration, ease: EASE_OUT };
  let item: Variants = { hidden: {}, show: {} };

  switch (preset) {
    case 'fade-in':
      item = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { ...base, duration: duration * 1.2 } },
      };
      break;
    case 'slide-up':
      item = {
        hidden: { opacity: 0, y: 44 },
        show: { opacity: 1, y: 0, transition: base },
      };
      break;
    case 'parallax':
      // Blocks further down travel further, so the page seems to have depth.
      item = {
        hidden: (index: number = 0) => ({ opacity: 0, y: 36 + index * 28 }),
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: duration * 1.4, ease: [0.33, 1, 0.68, 1] as Bezier },
        },
      };
      break;
    case 'cinematic':
      item = {
        hidden: { opacity: 0, scale: 1.08, filter: 'blur(10px)' },
        show: {
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          transition: { duration: duration * 1.6, ease: EASE_OUT },
        },
      };
      break;
    case 'zoom':
      item = {
        hidden: { opacity: 0, scale: 0.9 },
        show: { opacity: 1, scale: 1, transition: base },
      };
      break;
    case 'blur-in':
      item = {
        hidden: { opacity: 0, filter: 'blur(16px)' },
        show: { opacity: 1, filter: 'blur(0px)', transition: { ...base, duration: duration * 1.2 } },
      };
      break;
    case 'typewriter':
      item = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: duration * 0.5 } },
      };
      break;
    default:
      break;
  }

  return {
    enabled: preset !== 'none' && !reducedMotion,
    onScroll,
    typeTitle: preset === 'typewriter' && !reducedMotion,
    typeStep: clamp(duration * 0.045, 0.018, 0.06),
    container,
    item,
  };
}

// ---------------------------------------------------------------------------
// Theme: surface, background, ink and accent
// ---------------------------------------------------------------------------

function hexToRgb(color: string): [number, number, number] | null {
  const hex = color.trim().replace(/^#/, '');
  if (!/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex)) return null;
  const full =
    hex.length === 3
      ? hex.split('').map((c) => c + c).join('')
      : hex.slice(0, 6);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Perceived brightness, 0 (black) to 1 (white). */
function luminance([r, g, b]: [number, number, number]): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export interface PostTheme {
  /** Value for the `data-surface` attribute, or undefined to inherit the site's. */
  surface?: 'ink' | 'bone';
  /** CSS custom properties that re-point the site's colour tokens inside the post. */
  vars: CSSProperties;
}

/**
 * The post's own colours, expressed as overrides of the site's design tokens.
 *
 * The site colours everything through `--bg-*`, `--ink-*` and `--accent`, so
 * setting those on the article re-skins every class inside it — headings, links,
 * chips, rules, the lot — instead of patching individual elements. A background
 * colour also flips the surface to light or dark by luminance, so text stays
 * legible without a second setting.
 */
export function getPostTheme(customization?: PostCustomization): PostTheme {
  const style = customization?.style;
  const vars: Record<string, string> = {};
  let surface: PostTheme['surface'] = style?.surface;

  const accent = getAccentColor(customization);
  if (accent) {
    vars['--accent'] = accent;
    vars['--accent-soft'] = `color-mix(in srgb, ${accent} 18%, transparent)`;
  }

  const bg = style?.backgroundColor && isValidCSSColor(style.backgroundColor) ? style.backgroundColor : undefined;
  if (bg) {
    const rgb = hexToRgb(bg);
    if (!surface && rgb) surface = luminance(rgb) > 0.55 ? 'bone' : 'ink';
    vars['--bg'] = bg;
    vars['--bg-raised'] = bg;
    vars['--bg-lift'] = `color-mix(in srgb, ${bg} 92%, ${surface === 'bone' ? 'black' : 'white'})`;
    vars['--bg-deep'] = `color-mix(in srgb, ${bg} 88%, black)`;
    vars.backgroundColor = bg;
  }

  const ink = style?.textColor && isValidCSSColor(style.textColor) ? style.textColor : undefined;
  if (ink) {
    vars['--ink-0'] = ink;
    vars['--ink-1'] = ink;
    vars['--ink-2'] = `color-mix(in srgb, ${ink} 88%, transparent)`;
    vars['--ink-3'] = `color-mix(in srgb, ${ink} 78%, transparent)`;
    vars['--ink-4'] = `color-mix(in srgb, ${ink} 60%, transparent)`;
    vars['--ink-5'] = `color-mix(in srgb, ${ink} 46%, transparent)`;
    vars['--ink-6'] = `color-mix(in srgb, ${ink} 34%, transparent)`;
    vars['--rule'] = `color-mix(in srgb, ${ink} 16%, transparent)`;
    vars['--rule-strong'] = `color-mix(in srgb, ${ink} 28%, transparent)`;
    vars['--well'] = `color-mix(in srgb, ${ink} 5%, transparent)`;
  }

  return { surface, vars: vars as CSSProperties };
}

export function getAccentColor(customization?: PostCustomization): string | undefined {
  const color = customization?.style?.accentColor;
  if (!color) return undefined;
  return isValidCSSColor(color) ? color : undefined;
}

// ---------------------------------------------------------------------------
// Container, layout, typography
// ---------------------------------------------------------------------------

/** The article shell: shadow, corner radius, opacity and the theme variables. */
export function getContainerStyles(customization?: PostCustomization): CSSProperties {
  const style: CSSProperties = { ...getPostTheme(customization).vars };
  const s = customization?.style;

  if (isNum(s?.opacity) && s.opacity < 1) {
    style.opacity = clamp(s.opacity, 0.2, 1);
  }
  if (s?.shadow && s.shadow !== 'none') {
    style.boxShadow = SHADOW_MAP[s.shadow] || 'none';
  }
  if (isNum(s?.borderRadius) && s.borderRadius > 0) {
    style.borderRadius = `${clamp(s.borderRadius, 0, 48)}px`;
  }
  return style;
}

export function getContentWidthClass(customization?: PostCustomization): string {
  const width = customization?.layout?.contentWidth || 'default';
  return WIDTH_MAP[width] || 'max-w-3xl';
}

/** Where the content column sits when it is narrower than the article. */
export function getBlockAlignClass(customization?: PostCustomization): string {
  switch (customization?.layout?.blockAlign) {
    case 'left':
      return 'mr-auto';
    case 'right':
      return 'ml-auto';
    default:
      return 'mx-auto';
  }
}

export function getTextAlignClass(customization?: PostCustomization): string {
  switch (customization?.layout?.textAlign) {
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    case 'justify':
      return 'text-justify hyphens-auto';
    default:
      return 'text-left';
  }
}

export function getSpacingPx(customization?: PostCustomization): number {
  const exact = customization?.layout?.gapPx;
  if (isNum(exact)) return clamp(exact, 0, 200);
  return SPACING_PX[customization?.layout?.spacing || 'default'] ?? SPACING_PX.default;
}

export function getSpacingStyle(customization?: PostCustomization): CSSProperties {
  return { gap: `${getSpacingPx(customization)}px` };
}

/**
 * Typography as CSS custom properties, read by `.markdown-body` in index.css.
 * Only what was actually set is emitted, so an untouched post keeps the site's
 * own type.
 */
export function getTypographyStyle(customization?: PostCustomization): CSSProperties {
  const t = customization?.typography || {};
  const style: Record<string, string | number> = {};

  if (isNum(t.fontSizePx)) {
    const px = clamp(t.fontSizePx, 11, 40);
    style['--pfs'] = `${px}px`;
    style['--pts'] = +(px / BASE_BODY_PX).toFixed(3);
  } else if (t.fontSize && t.fontSize !== 'default' && FONT_SCALE_MAP[t.fontSize]) {
    style['--pts'] = FONT_SCALE_MAP[t.fontSize];
  }

  const body = resolveFontStack(t.fontFamily);
  if (body && t.fontFamily !== 'sans') {
    style['--pff'] = body;
    style.fontFamily = body;
  }

  const heading = resolveFontStack(t.headingFontFamily);
  if (heading && t.headingFontFamily !== 'sans') style['--phf'] = heading;

  if (isNum(t.lineHeight)) style['--plh'] = clamp(t.lineHeight, 1, 2.6);
  if (isNum(t.letterSpacing)) style['--pls'] = `${clamp(t.letterSpacing, -0.1, 0.4)}em`;
  if (isNum(t.fontWeight)) style['--pfw'] = clamp(Math.round(t.fontWeight / 100) * 100, 100, 900);

  return style as CSSProperties;
}

/** Title size, fluid between a mobile floor and the exact desktop px the author picked. */
export function getTitleStyle(customization?: PostCustomization): CSSProperties {
  const t = customization?.typography;
  const style: CSSProperties = {};

  const accent = getAccentColor(customization);
  if (accent) style.color = accent;

  const family = resolveFontStack(t?.headingFontFamily) || resolveFontStack(t?.fontFamily);
  if (family && (t?.headingFontFamily || t?.fontFamily) !== 'sans') style.fontFamily = family;

  if (isNum(t?.titleSizePx)) {
    const px = clamp(t.titleSizePx, 20, 140);
    style.fontSize = `clamp(${Math.round(px * 0.55)}px, 7.5vw, ${px}px)`;
  }
  if (isNum(t?.letterSpacing)) style.letterSpacing = `${clamp(t.letterSpacing, -0.1, 0.4)}em`;
  return style;
}

/** Font ids a post uses, so the renderer can request them. */
export function getUsedFontIds(customization?: PostCustomization): string[] {
  const t = customization?.typography;
  return [t?.fontFamily, t?.headingFontFamily].filter((id): id is string => !!id);
}

// ---------------------------------------------------------------------------
// Background wash
// ---------------------------------------------------------------------------

export function getGradientStyle(customization?: PostCustomization): CSSProperties | null {
  const gradient = customization?.style?.gradient;
  if (!gradient?.enabled || !gradient.from || !gradient.to) return null;
  if (!isValidCSSColor(gradient.from) || !isValidCSSColor(gradient.to)) return null;

  const angle = isNum(gradient.angle) ? gradient.angle : 135;
  const intensity = isNum(gradient.intensity) ? clamp(gradient.intensity, 0, 100) : 20;
  return {
    background: `linear-gradient(${angle}deg, ${gradient.from}, ${gradient.to})`,
    opacity: intensity / 100,
  };
}

// ---------------------------------------------------------------------------
// Media: colour grade, grain, vignette, crop
// ---------------------------------------------------------------------------

/**
 * The CSS `filter` for every photograph and clip in the post: the chosen grade,
 * then exposure, contrast, saturation and blur on top of it.
 */
export function getMediaFilter(customization?: PostCustomization): string | undefined {
  const e = customization?.effects;
  if (!e) return undefined;
  const parts: string[] = [];

  const preset = e.colorFilter && e.colorFilter !== 'none' ? COLOR_FILTER_MAP[e.colorFilter] : '';
  if (preset) parts.push(preset);
  if (isNum(e.brightness) && e.brightness !== 100) parts.push(`brightness(${clamp(e.brightness, 40, 180) / 100})`);
  if (isNum(e.contrast) && e.contrast !== 100) parts.push(`contrast(${clamp(e.contrast, 40, 180) / 100})`);
  if (isNum(e.saturation) && e.saturation !== 100) parts.push(`saturate(${clamp(e.saturation, 0, 200) / 100})`);
  if (isNum(e.blur) && e.blur > 0) parts.push(`blur(${clamp(e.blur, 0, 20)}px)`);

  return parts.length ? parts.join(' ') : undefined;
}

export interface MediaFx {
  filter?: string;
  /** 0–1 strength, 0 when grain is off. */
  grain: number;
  vignette: number;
}

export function getMediaFx(customization?: PostCustomization): MediaFx {
  const e = customization?.effects;
  return {
    filter: getMediaFilter(customization),
    grain: e?.grain ? clamp((isNum(e.grainAmount) ? e.grainAmount : 40) / 100, 0.05, 1) : 0,
    vignette: e?.vignette ? clamp((isNum(e.vignetteAmount) ? e.vignetteAmount : 50) / 100, 0.05, 1) : 0,
  };
}

export function hasGrainEffect(customization?: PostCustomization): boolean {
  return customization?.effects?.grain === true;
}

export function hasVignetteEffect(customization?: PostCustomization): boolean {
  return customization?.effects?.vignette === true;
}

/** Fractal-noise tile used for grain. Blended with `overlay`, so it reads on any photo. */
export const GRAIN_TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)'/%3E%3C/svg%3E\")";

/** Overlay styles for a media plate. Both are non-interactive and sit above the image. */
export function getGrainOverlayStyle(strength: number): CSSProperties {
  return {
    backgroundImage: GRAIN_TILE,
    backgroundSize: '180px 180px',
    mixBlendMode: 'overlay',
    opacity: clamp(0.25 + strength * 0.75, 0, 1),
  };
}

export function getVignetteOverlayStyle(strength: number): CSSProperties {
  return {
    background: `radial-gradient(ellipse at center, transparent ${Math.round(70 - strength * 30)}%, rgba(0,0,0,${(0.25 + strength * 0.65).toFixed(2)}) 100%)`,
  };
}

/** The cover plate: shape, size and where it sits in the column. */
export function getPlateStyle(customization?: PostCustomization): CSSProperties {
  const image = customization?.image;
  const style: CSSProperties = {};

  const ratio = aspectRatioOf(image?.aspect);
  if (image?.aspect === 'auto') {
    style.aspectRatio = undefined;
  } else if (ratio) {
    style.aspectRatio = String(ratio);
  }

  const width = PLATE_WIDTH[image?.width || 'full'];
  if (width && width !== '100%') style.width = width;

  style.alignSelf =
    image?.align === 'left' ? 'flex-start' : image?.align === 'right' ? 'flex-end' : 'center';

  if (isNum(customization?.style?.borderRadius) && customization.style.borderRadius > 0) {
    style.borderRadius = `${clamp(customization.style.borderRadius, 0, 48)}px`;
  }
  return style;
}

/** Zoom lives on a wrapper, so the hover-zoom class on the image keeps working. */
export function getImageZoomStyle(customization?: PostCustomization): CSSProperties {
  const image = customization?.image;
  const zoom = isNum(image?.zoom) ? clamp(image.zoom, 1, 3) : 1;
  const x = isNum(image?.focalX) ? clamp(image.focalX, 0, 100) : 50;
  const y = isNum(image?.focalY) ? clamp(image.focalY, 0, 100) : 50;
  return zoom > 1
    ? { transform: `scale(${zoom})`, transformOrigin: `${x}% ${y}%` }
    : {};
}

/** Fit and focal point for the `<img>` itself. */
export function getImageFitStyle(customization?: PostCustomization): CSSProperties {
  const image = customization?.image;
  const x = isNum(image?.focalX) ? clamp(image.focalX, 0, 100) : 50;
  const y = isNum(image?.focalY) ? clamp(image.focalY, 0, 100) : 50;
  return {
    objectFit: image?.fit === 'contain' ? 'contain' : 'cover',
    objectPosition: `${x}% ${y}%`,
  };
}

/** Focal point only — what listing cards can honour without changing their layout. */
export function getCardImageStyle(customization?: PostCustomization): CSSProperties | undefined {
  const image = customization?.image;
  if (!image || (!isNum(image.focalX) && !isNum(image.focalY))) return undefined;
  const x = isNum(image.focalX) ? clamp(image.focalX, 0, 100) : 50;
  const y = isNum(image.focalY) ? clamp(image.focalY, 0, 100) : 50;
  return { objectPosition: `${x}% ${y}%` };
}

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------

/**
 * Strip a customization down to what was really chosen, ready to be written as
 * front-matter. Empty groups and out-of-range or invalid values are dropped:
 * the site's front-matter reader has no inline-object syntax, so a stray
 * `style: {}` would come back as the string "{}".
 */
export function pruneCustomization(input: PostCustomization | undefined): PostCustomization | undefined {
  if (!input) return undefined;

  const prune = (value: unknown): unknown => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
        const cleaned = prune(inner);
        if (cleaned !== undefined) out[key] = cleaned;
      }
      return Object.keys(out).length ? out : undefined;
    }
    return value;
  };

  const cleaned = prune(input) as PostCustomization | undefined;
  if (!cleaned) return undefined;

  // A gradient that is switched off carries no information worth keeping.
  if (cleaned.style?.gradient && cleaned.style.gradient.enabled !== true) {
    delete cleaned.style.gradient;
    if (Object.keys(cleaned.style).length === 0) delete cleaned.style;
  }

  return Object.keys(cleaned).length ? cleaned : undefined;
}

// ---------------------------------------------------------------------------
// Colour validation
// ---------------------------------------------------------------------------

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
