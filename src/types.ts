// ============================================================
// POST CUSTOMIZATION TYPES
// ============================================================

export interface PostCustomization {
  music?: {
    songTitle?: string;
    songArtist?: string;
    songUrl?: string;
    albumArt?: string;
    provider?: 'spotify' | 'soundcloud' | 'youtube' | 'custom';
  };
  animation?: {
    preset?: 'fade-in' | 'slide-up' | 'parallax' | 'typewriter' | 'cinematic' | 'none';
    speed?: 'slow' | 'normal' | 'fast';
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
    };
    accentColor?: string;
    opacity?: number;
  };
  layout?: {
    contentWidth?: 'narrow' | 'default' | 'wide' | 'full';
    textAlign?: 'left' | 'center' | 'right';
    spacing?: 'compact' | 'default' | 'relaxed' | 'spacious';
  };
  effects?: {
    grain?: boolean;
    vignette?: boolean;
    blur?: number;
    colorFilter?: 'none' | 'warm' | 'cool' | 'vintage' | 'noir';
  };
  typography?: {
    fontSize?: 'small' | 'default' | 'large' | 'x-large';
    fontFamily?: 'serif' | 'sans' | 'mono';
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
  customization?: PostCustomization;
}

export interface CollectionEntry {
  title: string;
  slug: string;
  category: "Uses" | "Music" | "Books" | "Gear" | "Timeline" | "Inspirations" | "Favorites";
  coverImage?: string;
  description: string;
  body: string;
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
  order: number;
  visible: boolean;
  body: string;
  customization?: PostCustomization;
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

export interface PhotoGalleryItem {
  title: string;
  slug: string;
  category: "Life" | "Travel" | "Connected" | "Favorites" | "Behind The Shot";
  description?: string;
  image: string;
  featured: boolean;
  order: number;
  visible: boolean;
  body: string;
  customization?: PostCustomization;
}

export interface HomeConfigEntry {
  title: string;
  slug: string;
  configType: "gateway" | "quote" | "principle" | "profile" | "section";
  /** For interlude blocks (configType "quote"): which visual template to render. */
  variant?: "quote" | "statement" | "marquee" | "stat";
  label?: string;
  description?: string;
  image?: string;
  author?: string;
  text?: string;
  navTarget?: string;
  body?: string;
  order: number;
  visible: boolean;
  customization?: PostCustomization;
}
