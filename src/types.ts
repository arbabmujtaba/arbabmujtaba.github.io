// ============================================================
// POST CUSTOMIZATION TYPES
// ============================================================

export type AnimationPreset =
  | 'none'
  | 'fade-in'
  | 'slide-up'
  | 'parallax'
  | 'typewriter'
  | 'cinematic'
  | 'zoom'
  | 'blur-in';

export type ColorFilterPreset =
  | 'none'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'noir'
  | 'faded'
  | 'cinematic'
  | 'vivid';

export type ImageAspect = 'auto' | '21/9' | '16/9' | '3/2' | '4/3' | '1/1' | '3/4' | '2/3';

export interface PostCustomization {
  music?: {
    songTitle?: string;
    songArtist?: string;
    songUrl?: string;
    albumArt?: string;
    provider?: 'spotify' | 'soundcloud' | 'youtube' | 'custom';
  };
  animation?: {
    preset?: AnimationPreset;
    speed?: 'slow' | 'normal' | 'fast';
    /** `load` plays when the page opens; `scroll` reveals each block as it is reached. */
    trigger?: 'load' | 'scroll';
    hoverEffects?: boolean;
  };
  style?: {
    borderRadius?: number;
    shadow?: 'none' | 'subtle' | 'medium' | 'dramatic' | 'glow';
    gradient?: {
      enabled?: boolean;
      from?: string;
      to?: string;
      angle?: number;
      /** 0–100. How strongly the wash sits over the page. Default 20. */
      intensity?: number;
    };
    accentColor?: string;
    /** Page background behind the article. */
    backgroundColor?: string;
    /** Body text colour. */
    textColor?: string;
    /** `bone` flips the article to the site's light paper surface. */
    surface?: 'ink' | 'bone';
    opacity?: number;
  };
  layout?: {
    contentWidth?: 'narrow' | 'default' | 'wide' | 'full';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    spacing?: 'compact' | 'default' | 'relaxed' | 'spacious';
    /** Exact gap between blocks, in px. Overrides the `spacing` preset. */
    gapPx?: number;
    /** Where the content column sits inside the article. */
    blockAlign?: 'left' | 'center' | 'right';
  };
  effects?: {
    /** Film grain over photographs and clips. */
    grain?: boolean;
    /** 0–100. Default 40. */
    grainAmount?: number;
    vignette?: boolean;
    /** 0–100. Default 50. */
    vignetteAmount?: number;
    blur?: number;
    colorFilter?: ColorFilterPreset;
    /** 50–150, 100 is untouched. */
    brightness?: number;
    contrast?: number;
    saturation?: number;
  };
  typography?: {
    /** Legacy 4-step scale. `fontSizePx` wins when both are set. */
    fontSize?: 'small' | 'default' | 'large' | 'x-large';
    /** Exact body text size in px. */
    fontSizePx?: number;
    /** Exact title size in px at desktop width. */
    titleSizePx?: number;
    /** Key from `lib/fonts.ts` (or the legacy `serif` / `sans` / `mono`). */
    fontFamily?: string;
    headingFontFamily?: string;
    /** Unitless line-height multiplier, e.g. 1.7. */
    lineHeight?: number;
    /** Tracking in em, e.g. 0.02. */
    letterSpacing?: number;
    fontWeight?: number;
  };
  image?: {
    aspect?: ImageAspect;
    fit?: 'cover' | 'contain';
    /** Focal point, 0–100 from the left / top. Default 50 / 50. */
    focalX?: number;
    focalY?: number;
    /** 1–3. Default 1. */
    zoom?: number;
    /** Where the plate sits when it is narrower than the column. */
    align?: 'left' | 'center' | 'right';
    width?: 'full' | 'large' | 'medium' | 'small';
  };
}

// ============================================================
// CONTENT ENTRY TYPES
// ============================================================

export interface JournalEntry {
  title: string;
  slug: string;
  date: string;
  category: "Life" | "People" | "Travel" | "Thoughts" | "Milestones";
  /** Primary cinematic cover shown full-bleed inside the hero/archive cards. */
  featuredImage?: string;
  /** Legacy alias kept in sync with featuredImage for back-compat (modal, live-edit). */
  coverImage?: string;
  /** Short clip (.mp4/.webm) or .gif shown as a motion plate in the entry. */
  video?: string;
  /** Still frame shown before the clip plays, and while a GIF is paused. */
  videoPoster?: string;
  excerpt: string;
  /** Display reading time, e.g. "5 min read". Auto-derived from the body when omitted. */
  readingTime?: string;
  /** Magazine-style issue number. Auto-assigned by publish order when omitted. */
  volume?: number;
  /** Editorial tags shown in the card metadata row. */
  tags?: string[];
  /** When false the entry is hidden from the site. Defaults to true. */
  published?: boolean;
  body: string;
  customization?: PostCustomization;
}

export interface TechEntry {
  title: string;
  slug: string;
  date: string;
  category: "Tech News" | "Things I Like" | "Build Logs" | "Experiments" | "Linux" | "Networking" | "Programming";
  coverImage?: string;
  /** Short clip (.mp4/.webm) or .gif shown as a motion plate in the entry. */
  video?: string;
  videoPoster?: string;
  excerpt: string;
  body: string;
  customization?: PostCustomization;
}

export interface PhotographyEntry {
  title: string;
  slug: string;
  date: string;
  category: "Favorites" | "Life" | "Connected" | "Travel" | "Behind The Shot" | "Gear";
  coverImage: string;
  galleryImages: string[] | { image: string }[];
  description: string;
  story: string;
  /** Camera / lens / tools used to capture this photo. Replaces the old hardcoded gear label. */
  gear?: string[];
  /** Optional capture mode / technique line (e.g. "Natural Light", "35mm f/1.8"). */
  captureMode?: string;
  /** Short clip (.mp4/.webm) or .gif — a frame that moves. */
  video?: string;
  videoPoster?: string;
  customization?: PostCustomization;
}

export interface PortfolioProject {
  title: string; // "Project Name" mapped to title for consistency
  slug: string;
  description: string;
  techStack: string[] | { tech: string }[];
  githubLink?: string;
  liveLink?: string;
  projectImage: string;
  /** Screen recording or demo clip — the thing a static plate cannot show. */
  video?: string;
  videoPoster?: string;
  featured: boolean;
  body: string;
  customization?: PostCustomization;
}

// ============================================================
// CMS-MANAGED CONFIGURATION TYPES (replaces hardcoded data)
// ============================================================

export interface GearItem {
  title: string;
  slug: string;
  category: "Cameras" | "Lenses" | "Tools" | "Software" | "Audio" | "Other";
  description: string;
  image?: string;
  specs?: string[] | { spec: string }[];
  order: number;
  visible: boolean;
  body: string;
  customization?: PostCustomization;
}

export interface TimelineMilestone {
  title: string;
  slug: string;
  year: string;
  description: string;
  /** Where the chapter happened — `Sopore`, `Indore`, … Drives the memory map. */
  place?: string;
  order: number;
  visible: boolean;
  body: string;
  customization?: PostCustomization;
}

// ============================================================
// THE HIDDEN LAYER — content/secrets/*.md
// ============================================================

/**
 * What a secret is.
 *  - `room`  configures one secret room (its title, intro line, and whether its door works at all)
 *  - `note`  a hidden manuscript shown inside a room
 *  - `egg`   the message an easter egg reveals; `visible: false` switches the egg off
 *  - `ink`   invisible-ink marginalia, readable only under the wand's Lumos light
 */
export type SecretKind = 'room' | 'note' | 'egg' | 'ink';

/** The three secret rooms. */
export type SecretRoomId = 'library' | 'darkroom' | 'details';

/** The easter eggs implemented in code. A secret of kind `egg` supplies the copy for one. */
export type SecretTrigger = 'seal' | 'constellation' | 'fullstop' | 'lumos' | 'alohomora' | 'console' | 'invitation';

/** Sections of the home page that can carry invisible-ink marginalia. */
export type InkSection = 'hero' | 'frames' | 'work' | 'writing' | 'timeline' | 'notes' | 'archive';

export const SECRET_KINDS: SecretKind[] = ['note', 'egg', 'ink', 'room'];
export const SECRET_ROOMS: SecretRoomId[] = ['library', 'darkroom', 'details'];
export const SECRET_TRIGGERS: SecretTrigger[] = ['seal', 'constellation', 'fullstop', 'lumos', 'alohomora', 'console', 'invitation'];
export const INK_SECTIONS: InkSection[] = ['hero', 'frames', 'work', 'writing', 'timeline', 'notes', 'archive'];

export interface SecretEntry {
  title: string;
  slug: string;
  kind: SecretKind;
  /** kind `room` / `note`: which room. */
  room?: SecretRoomId;
  /** kind `egg`: which easter egg this copy belongs to. */
  trigger?: SecretTrigger;
  /** kind `ink`: which home section the marginalia sits in. */
  section?: InkSection;
  /** One line: a room's intro, a note's signature, an egg's subtitle. */
  description: string;
  date?: string;
  image?: string;
  order: number;
  visible: boolean;
  body: string;
}

export interface FavoriteItem {
  title: string;
  slug: string;
  category:
    | "Favorite Technologies"
    | "Favorite Software"
    | "Favorite Linux Tools"
    | "Favorite Gear"
    | "Favorite Setups"
    | "Things I Like";
  description: string;
  icon?: string;
  link?: string;
  group?: string;
  order: number;
  visible: boolean;
  body: string;
  customization?: PostCustomization;
}

export interface HomeConfigEntry {
  title: string;
  slug: string;
  /**
   * `reel` is a short clip on the home page — the one block that moves on its
   * own. Everything else is a still composition.
   */
  configType: "gateway" | "quote" | "principle" | "profile" | "section" | "reel" | "thought";
  /** For interlude blocks (configType "quote"): which visual template to render. */
  variant?: "quote" | "statement" | "marquee" | "stat";
  label?: string;
  description?: string;
  image?: string;
  /** For `reel` blocks: the clip, and the still shown before it plays. */
  video?: string;
  videoPoster?: string;
  author?: string;
  text?: string;
  navTarget?: string;
  body?: string;
  order: number;
  visible: boolean;
  customization?: PostCustomization;
}
