import { 
  JournalEntry, 
  TechEntry, 
  PhotographyEntry, 
  PortfolioProject,
  GearItem,
  TimelineMilestone,
  FavoriteItem,
  HomeConfigEntry,
  PostCustomization
} from '../types';

import { parseMarkdown } from './frontmatter';

// Dynamically import all *.md content files at build time
const journalGlob = (import.meta as any).glob('/content/journal/**/*.md', { query: '?raw', eager: true });
const techGlob = (import.meta as any).glob('/content/tech/**/*.md', { query: '?raw', eager: true });
const photographyGlob = (import.meta as any).glob('/content/photography/**/*.md', { query: '?raw', eager: true });
const portfolioGlob = (import.meta as any).glob('/content/portfolio/**/*.md', { query: '?raw', eager: true });
const gearGlob = (import.meta as any).glob('/content/gear/**/*.md', { query: '?raw', eager: true });
const timelineGlob = (import.meta as any).glob('/content/timeline/**/*.md', { query: '?raw', eager: true });
const favoritesGlob = (import.meta as any).glob('/content/favorites/**/*.md', { query: '?raw', eager: true });
const homeGlob = (import.meta as any).glob('/content/home/**/*.md', { query: '?raw', eager: true });

// Normalize listing maps to typed arrays
/**
 * Normalize a tags value coming from frontmatter. Supports a YAML array of
 * strings, an array of `{ tag: "..." }` objects, or a single comma-delimited
 * string, always returning a clean string[].
 */
function normalizeTags(raw: any): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((t) => {
        if (typeof t === 'string') return t;
        if (t && typeof t === 'object') return (t.tag || t.value || Object.values(t)[0]) as string;
        return '';
      })
      .map((s) => String(s).trim())
      .filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Resolve a display reading time. Honors an explicit frontmatter value
 * ("5 min read" or a bare number) and otherwise estimates from the body
 * at ~200 words per minute.
 */
function resolveReadingTime(body: string, explicit?: any): string {
  if (explicit !== undefined && explicit !== null && String(explicit).trim() !== '') {
    const s = String(explicit).trim();
    return /^\d+$/.test(s) ? `${s} min read` : s;
  }
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

/** Parse a volume number from a number or a string like "Vol. 02" / "2". */
function parseVolume(raw: any): number | undefined {
  if (typeof raw === 'number' && !isNaN(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    const n = parseInt(raw.replace(/[^\d]/g, ''), 10);
    if (!isNaN(n)) return n;
  }
  return undefined;
}

export function getJournalEntries(): JournalEntry[] {
  const entries = Object.entries(journalGlob).map(([filePath, module]: [string, any]) => {
    const rawContent = module.default;
    const { data, content } = parseMarkdown(rawContent);
    const body = content || "";
    // featuredImage is the canonical field; coverImage is the legacy alias.
    const cover = data.featuredImage || data.coverImage || undefined;
    return {
      title: data.title || "Untitled",
      slug: data.slug || filePath.split('/').pop()?.replace('.md', '') || "",
      date: data.date || "2026-06-07",
      category: data.category || "Thoughts",
      featuredImage: cover,
      coverImage: cover,
      video: data.video || undefined,
      videoPoster: data.videoPoster || undefined,
      excerpt: data.excerpt || "",
      readingTime: resolveReadingTime(body, data.readingTime),
      volume: parseVolume(data.volume),
      tags: normalizeTags(data.tags),
      published: data.published !== false,
      body,
      customization: data.customization as PostCustomization | undefined
    } as JournalEntry;
  });

  // Hide unpublished drafts, then order newest-first so the latest entry is featured.
  const visible = entries
    .filter((e) => e.published !== false)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Auto-assign magazine volume numbers where the author left them blank.
  // Oldest published entry = Vol. 01, newest = the highest number.
  const total = visible.length;
  visible.forEach((e, i) => {
    if (e.volume === undefined) e.volume = total - i;
  });

  return visible;
}

export function getTechEntries(): TechEntry[] {
  return Object.entries(techGlob).map(([filePath, module]: [string, any]) => {
    const rawContent = module.default;
    const { data, content } = parseMarkdown(rawContent);
    return {
      title: data.title || "Untitled",
      slug: data.slug || filePath.split('/').pop()?.replace('.md', '') || "",
      date: data.date || "2026-06-07",
      category: data.category || "Programming",
      coverImage: data.coverImage,
      video: data.video || undefined,
      videoPoster: data.videoPoster || undefined,
      excerpt: data.excerpt || "",
      body: content || "",
      customization: data.customization as PostCustomization | undefined
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPhotographyEntries(): PhotographyEntry[] {
  return Object.entries(photographyGlob).map(([filePath, module]: [string, any]) => {
    const rawContent = module.default;
    const { data, content } = parseMarkdown(rawContent);
    
    // Normalize galleryImages to clean array of strings
    let gallery: string[] = [];
    if (Array.isArray(data.galleryImages)) {
      gallery = data.galleryImages.map((item: any) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return item.image || Object.values(item)[0] as string;
        }
        return "";
      }).filter(Boolean);
    }

    // Normalize gear to a clean array of strings.
    // Supports: array of strings, array of objects ({ item / title / value }),
    // or a single delimited string ("Sony A7III / 35mm").
    let gear: string[] = [];
    if (Array.isArray(data.gear)) {
      gear = data.gear.map((item: any) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return (item.item || item.title || item.value || Object.values(item)[0]) as string;
        }
        return "";
      }).filter(Boolean);
    } else if (typeof data.gear === 'string' && data.gear.trim()) {
      gear = data.gear.split(/[/,]/).map((s: string) => s.trim()).filter(Boolean);
    }

    return {
      title: data.title || "Untitled",
      slug: data.slug || filePath.split('/').pop()?.replace('.md', '') || "",
      date: data.date || "2026-06-07",
      category: data.category || "Favorites",
      coverImage: data.coverImage || "",
      galleryImages: gallery,
      description: data.description || "",
      story: content || "",
      gear,
      captureMode: data.captureMode || "",
      video: data.video || undefined,
      videoPoster: data.videoPoster || undefined,
      customization: data.customization as PostCustomization | undefined
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPortfolioProjects(): PortfolioProject[] {
  return Object.entries(portfolioGlob).map(([filePath, module]: [string, any]) => {
    const rawContent = module.default;
    const { data, content } = parseMarkdown(rawContent);
    
    let stack: string[] = [];
    if (Array.isArray(data.techStack)) {
      stack = data.techStack.map((item: any) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return item.tech || Object.values(item)[0] as string;
        }
        return "";
      }).filter(Boolean);
    }

    return {
      title: data.title || "Untitled Project",
      slug: data.slug || filePath.split('/').pop()?.replace('.md', '') || "",
      description: data.description || "",
      techStack: stack,
      githubLink: data.githubLink,
      liveLink: data.liveLink,
      projectImage: data.projectImage || "",
      video: data.video || undefined,
      videoPoster: data.videoPoster || undefined,
      featured: !!data.featured,
      body: content || "",
      customization: data.customization as PostCustomization | undefined
    };
  });
}

export function getGearItems(): GearItem[] {
  return Object.entries(gearGlob).map(([filePath, module]: [string, any]) => {
    const rawContent = module.default;
    const { data, content } = parseMarkdown(rawContent);
    
    let specs: string[] = [];
    if (Array.isArray(data.specs)) {
      specs = data.specs.map((item: any) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return item.spec || Object.values(item)[0] as string;
        }
        return "";
      }).filter(Boolean);
    }

    return {
      title: data.title || "Untitled Gear",
      slug: data.slug || filePath.split('/').pop()?.replace('.md', '') || "",
      category: data.category || "Other",
      description: data.description || "",
      image: data.image || "",
      specs,
      order: typeof data.order === 'number' ? data.order : 0,
      visible: data.visible !== false,
      body: content || "",
      customization: data.customization as PostCustomization | undefined
    };
  }).sort((a, b) => a.order - b.order);
}

export function getTimelineMilestones(): TimelineMilestone[] {
  return Object.entries(timelineGlob).map(([filePath, module]: [string, any]) => {
    const rawContent = module.default;
    const { data, content } = parseMarkdown(rawContent);
    return {
      title: data.title || "Untitled",
      slug: data.slug || filePath.split('/').pop()?.replace('.md', '') || "",
      year: data.year ? String(data.year) : "",
      description: data.description || "",
      place: data.place ? String(data.place) : undefined,
      order: typeof data.order === 'number' ? data.order : 0,
      visible: data.visible !== false,
      body: content || "",
      customization: data.customization as PostCustomization | undefined
    };
  }).sort((a, b) => a.order - b.order);
}

export function getFavoriteItems(): FavoriteItem[] {
  return Object.entries(favoritesGlob).map(([filePath, module]: [string, any]) => {
    const rawContent = module.default;
    const { data, content } = parseMarkdown(rawContent);
    return {
      title: data.title || "Untitled",
      slug: data.slug || filePath.split('/').pop()?.replace('.md', '') || "",
      category: data.category || "Things I Like",
      description: data.description || "",
      icon: data.icon || "",
      link: data.link || "",
      group: data.group || "",
      order: typeof data.order === 'number' ? data.order : 0,
      visible: data.visible !== false,
      body: content || "",
      customization: data.customization as PostCustomization | undefined
    };
  }).sort((a, b) => a.order - b.order);
}

export function getHomeConfig(): HomeConfigEntry[] {
  return Object.entries(homeGlob).map(([filePath, module]: [string, any]) => {
    const rawContent = module.default;
    const { data, content } = parseMarkdown(rawContent);
    return {
      title: data.title || "Untitled",
      slug: data.slug || filePath.split('/').pop()?.replace('.md', '') || "",
      configType: data.configType || "section",
      variant: data.variant || "quote",
      label: data.label || "",
      description: data.description || "",
      image: data.image || "",
      video: data.video || undefined,
      videoPoster: data.videoPoster || undefined,
      author: data.author || "",
      text: data.text || "",
      navTarget: data.navTarget || "",
      body: content || "",
      order: typeof data.order === 'number' ? data.order : 0,
      visible: data.visible !== false,
      customization: data.customization as PostCustomization | undefined
    };
  }).sort((a, b) => a.order - b.order);
}

