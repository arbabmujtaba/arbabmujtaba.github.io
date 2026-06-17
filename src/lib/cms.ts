import { 
  JournalEntry, 
  TechEntry, 
  PhotographyEntry, 
  CollectionEntry, 
  PortfolioProject,
  GearItem,
  TimelineMilestone,
  FavoriteItem,
  HomeConfigEntry,
  PhotoGalleryItem
} from '../types';

function parseMarkdown(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: raw };
  }

  const data: Record<string, any> = {};
  const yamlString = match[1];
  const content = match[2];

  const lines = yamlString.split('\n');
  let currentKey: string | null = null;
  let currentList: any[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('-') && currentKey) {
      let val = trimmed.slice(1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }

      const subColon = val.indexOf(':');
      if (subColon > -1) {
        const subKey = val.slice(0, subColon).trim();
        let subVal = val.slice(subColon + 1).trim();
        if ((subVal.startsWith('"') && subVal.endsWith('"')) || (subVal.startsWith("'") && subVal.endsWith("'"))) {
          subVal = subVal.slice(1, -1);
        }
        currentList.push({ [subKey]: subVal });
      } else {
        currentList.push(val);
      }
      data[currentKey] = currentList;
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx > -1) {
      currentKey = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      currentList = [];

      if (val.startsWith('-')) {
        continue;
      }

      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }

      if (val.startsWith('[') && val.endsWith(']')) {
        data[currentKey] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
      } else if (val === 'true') {
        data[currentKey] = true;
      } else if (val === 'false') {
        data[currentKey] = false;
      } else if (val !== '') {
        data[currentKey] = val;
      }
    }
  }

  return { data, content };
}

// Dynamically import all *.md content files at build time
const journalGlob = (import.meta as any).glob('/content/journal/**/*.md', { query: '?raw', eager: true });
const techGlob = (import.meta as any).glob('/content/tech/**/*.md', { query: '?raw', eager: true });
const photographyGlob = (import.meta as any).glob('/content/photography/**/*.md', { query: '?raw', eager: true });
const collectionGlob = (import.meta as any).glob('/content/collection/**/*.md', { query: '?raw', eager: true });
const portfolioGlob = (import.meta as any).glob('/content/portfolio/**/*.md', { query: '?raw', eager: true });
const gearGlob = (import.meta as any).glob('/content/gear/**/*.md', { query: '?raw', eager: true });
const timelineGlob = (import.meta as any).glob('/content/timeline/**/*.md', { query: '?raw', eager: true });
const favoritesGlob = (import.meta as any).glob('/content/favorites/**/*.md', { query: '?raw', eager: true });
const homeGlob = (import.meta as any).glob('/content/home/**/*.md', { query: '?raw', eager: true });
const galleryGlob = (import.meta as any).glob('/content/gallery/**/*.md', { query: '?raw', eager: true });

// Normalize listing maps to typed arrays
export function getJournalEntries(): JournalEntry[] {
  return Object.entries(journalGlob).map(([filePath, module]: [string, any]) => {
    const rawContent = module.default;
    const { data, content } = parseMarkdown(rawContent);
    return {
      title: data.title || "Untitled",
      slug: data.slug || filePath.split('/').pop()?.replace('.md', '') || "",
      date: data.date || "2026-06-07",
      category: data.category || "Life",
      coverImage: data.coverImage,
      excerpt: data.excerpt || "",
      body: content || ""
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
      excerpt: data.excerpt || "",
      body: content || ""
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

    return {
      title: data.title || "Untitled",
      slug: data.slug || filePath.split('/').pop()?.replace('.md', '') || "",
      date: data.date || "2026-06-07",
      category: data.category || "Favorites",
      coverImage: data.coverImage || "",
      galleryImages: gallery,
      description: data.description || "",
      story: content || ""
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getCollectionEntries(): CollectionEntry[] {
  return Object.entries(collectionGlob).map(([filePath, module]: [string, any]) => {
    const rawContent = module.default;
    const { data, content } = parseMarkdown(rawContent);
    return {
      title: data.title || "Untitled",
      slug: data.slug || filePath.split('/').pop()?.replace('.md', '') || "",
      category: data.category || "Uses",
      coverImage: data.coverImage,
      description: data.description || "",
      body: content || ""
    };
  });
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
      featured: !!data.featured,
      body: content || ""
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
      body: content || ""
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
      year: data.year || "",
      description: data.description || "",
      order: typeof data.order === 'number' ? data.order : 0,
      visible: data.visible !== false,
      body: content || ""
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
      body: content || ""
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
      label: data.label || "",
      description: data.description || "",
      image: data.image || "",
      author: data.author || "",
      text: data.text || "",
      navTarget: data.navTarget || "",
      body: content || "",
      order: typeof data.order === 'number' ? data.order : 0,
      visible: data.visible !== false
    };
  }).sort((a, b) => a.order - b.order);
}

export function getGalleryItems(): PhotoGalleryItem[] {
  return Object.entries(galleryGlob).map(([filePath, module]: [string, any]) => {
    const rawContent = module.default;
    const { data, content } = parseMarkdown(rawContent);
    return {
      title: data.title || "Untitled",
      slug: data.slug || filePath.split('/').pop()?.replace('.md', '') || "",
      category: data.category || "Life",
      description: data.description || "",
      image: data.image || "",
      featured: !!data.featured,
      order: typeof data.order === 'number' ? data.order : 0,
      visible: data.visible !== false,
      body: content || ""
    };
  }).sort((a, b) => a.order - b.order);
}
