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
