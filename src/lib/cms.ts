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
  PhotoGalleryItem,
  PostCustomization
} from '../types';

function parseYamlValue(val: string): any {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null' || val === '~') return null;
  // Numeric values
  if (/^-?\d+(\.\d+)?$/.test(val)) return parseFloat(val);
  // Inline arrays [a, b, c]
  if (val.startsWith('[') && val.endsWith(']')) {
    return val.slice(1, -1).split(',').map(s => {
      const t = s.trim().replace(/^['"]|['"]$/g, '');
      return parseYamlValue(t);
    });
  }
  // Strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  return val;
}

function parseMarkdown(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: raw };
  }

  const yamlString = match[1];
  const content = match[2];
  const data = parseYamlBlock(yamlString);

  return { data, content };
}

/**
 * Parse a YAML block supporting nested objects (indentation-based),
 * arrays with dash syntax, and scalar values.
 */
function parseYamlBlock(yamlString: string): Record<string, any> {
  const data: Record<string, any> = {};
  const lines = yamlString.split('\n');

  // Stack tracks the current object at each indentation level
  // Each entry: { indent: number, obj: Record<string, any>, key: string | null, list: any[] | null }
  interface StackFrame {
    indent: number;
    obj: Record<string, any>;
    key: string | null;
    list: any[] | null;
    // Present on a deferred child frame created for an empty-value key. Lets a
    // deeper-indented block sequence replace the provisional nested object with
    // a real array on the owning object.
    ownerObj: Record<string, any> | null;
    ownerKey: string | null;
  }

  const stack: StackFrame[] = [{ indent: -1, obj: data, key: null, list: null, ownerObj: null, ownerKey: null }];

  function currentFrame(): StackFrame {
    return stack[stack.length - 1];
  }

  for (const line of lines) {
    // Skip empty lines
    if (line.trim() === '') continue;

    // Determine indentation level (number of leading spaces)
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const trimmed = line.trim();

    // Pop stack frames that are at the same or deeper indentation (when we go back to a shallower level)
    while (stack.length > 1 && indent <= currentFrame().indent) {
      stack.pop();
    }

    // Handle list items (lines starting with -)
    if (trimmed.startsWith('- ') || trimmed === '-') {
      const listVal = trimmed.length > 2 ? trimmed.slice(2).trim() : '';
      const frame = currentFrame();

      // If the current frame key has a list, append to it
      if (frame.list !== null) {
        if (listVal.includes(':')) {
          // Inline object in list: "- key: value"
          const colonIdx = listVal.indexOf(':');
          const subKey = listVal.slice(0, colonIdx).trim();
          let subVal = listVal.slice(colonIdx + 1).trim();
          subVal = subVal.replace(/^['"]|['"]$/g, '');
          frame.list.push({ [subKey]: parseYamlValue(subVal) });
        } else {
          frame.list.push(parseYamlValue(listVal));
        }
      } else if (frame.key) {
        // Start a new list on the frame's key (sequence at same indent as key)
        const list: any[] = [];
        if (listVal.includes(':')) {
          const colonIdx = listVal.indexOf(':');
          const subKey = listVal.slice(0, colonIdx).trim();
          let subVal = listVal.slice(colonIdx + 1).trim();
          subVal = subVal.replace(/^['"]|['"]$/g, '');
          list.push({ [subKey]: parseYamlValue(subVal) });
        } else if (listVal) {
          list.push(parseYamlValue(listVal));
        }
        frame.obj[frame.key] = list;
        frame.list = list;
      } else if (frame.ownerObj && frame.ownerKey) {
        // Block sequence indented under an empty-value key: replace the
        // provisional nested object on the owner with a real array.
        const list: any[] = [];
        if (listVal.includes(':')) {
          const colonIdx = listVal.indexOf(':');
          const subKey = listVal.slice(0, colonIdx).trim();
          let subVal = listVal.slice(colonIdx + 1).trim();
          subVal = subVal.replace(/^['"]|['"]$/g, '');
          list.push({ [subKey]: parseYamlValue(subVal) });
        } else if (listVal) {
          list.push(parseYamlValue(listVal));
        }
        frame.ownerObj[frame.ownerKey] = list;
        frame.list = list;
      }
      continue;
    }

    // Handle key:value lines
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > -1) {
      const key = trimmed.slice(0, colonIdx).trim();
      const rawVal = trimmed.slice(colonIdx + 1).trim();
      const frame = currentFrame();

      if (rawVal === '' || rawVal === undefined) {
        // Empty value: provisionally treat as a nested object, but it may turn
        // out to be a block sequence. Deeper-indented '- ' items will replace
        // this provisional object with an array via ownerObj/ownerKey.
        const nestedObj: Record<string, any> = {};
        frame.obj[key] = nestedObj;
        frame.key = key;
        frame.list = null;
        stack.push({ indent, obj: nestedObj, key: null, list: null, ownerObj: frame.obj, ownerKey: key });
      } else {
        // Scalar or inline array value
        frame.obj[key] = parseYamlValue(rawVal);
        // Update frame key in case next lines are list items for this key
        frame.key = key;
        frame.list = null;
      }
    }
  }

  return data;
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
      body: content || "",
      customization: data.customization as PostCustomization | undefined
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
      customization: data.customization as PostCustomization | undefined
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
      body: content || "",
      customization: data.customization as PostCustomization | undefined
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
      year: data.year || "",
      description: data.description || "",
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
      label: data.label || "",
      description: data.description || "",
      image: data.image || "",
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
      body: content || "",
      customization: data.customization as PostCustomization | undefined
    };
  }).sort((a, b) => a.order - b.order);
}
