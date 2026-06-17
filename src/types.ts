export interface JournalEntry {
  title: string;
  slug: string;
  date: string;
  category: "Life" | "People" | "Travel" | "Thoughts" | "Milestones";
  coverImage?: string;
  excerpt: string;
  body: string;
}

export interface TechEntry {
  title: string;
  slug: string;
  date: string;
  category: "Tech News" | "Things I Like" | "Build Logs" | "Experiments" | "Linux" | "Networking" | "Programming";
  coverImage?: string;
  excerpt: string;
  body: string;
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
}

export interface CollectionEntry {
  title: string;
  slug: string;
  category: "Uses" | "Music" | "Books" | "Gear" | "Timeline" | "Inspirations" | "Favorites";
  coverImage?: string;
  description: string;
  body: string;
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
}

export interface TimelineMilestone {
  title: string;
  slug: string;
  year: string;
  description: string;
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
}

export interface HomeConfigEntry {
  title: string;
  slug: string;
  configType: "gateway" | "quote" | "principle" | "profile" | "section";
  label?: string;
  description?: string;
  image?: string;
  author?: string;
  text?: string;
  navTarget?: string;
  body?: string;
  order: number;
  visible: boolean;
}
