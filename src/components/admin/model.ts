/**
 * The admin's model of the site.
 *
 * Two jobs live here, and both used to be copy-pasted across Admin.tsx:
 *
 *  1. WEBSITE_STRUCTURE — which part of the public site each collection feeds,
 *     and the categories that part understands.
 *  2. The form <-> front-matter mapping. `serializeForm` is the ONLY place a
 *     form becomes front-matter, so "Save" and "Publish" can no longer disagree
 *     about which fields they write (they used to — Publish dropped the clip).
 */

import { pruneCustomization } from '../../lib/customization';
import type { PostCustomization } from '../../types';

// ---------------------------------------------------------------------------
// Website structure
// ---------------------------------------------------------------------------

export type CollectionId =
  | 'journal'
  | 'tech'
  | 'photography'
  | 'portfolio'
  | 'gear'
  | 'favorites'
  | 'timeline'
  | 'home'
  | 'gallery';

export interface Destination {
  collection: CollectionId;
  label: string;
  /** Where it shows up, in plain words. */
  blurb: string;
  categories: string[];
  categoryLabel?: string;
  fixedCategory?: string;
  /** The public page that lists it. */
  listPath: string;
  /** Has its own page at /<collection>/<slug>. */
  hasPage: boolean;
}

export interface Section {
  id: string;
  label: string;
  isConfig?: boolean;
  destinations: Destination[];
}

export const WEBSITE_STRUCTURE: Section[] = [
  {
    id: 'journal',
    label: 'Journal',
    destinations: [
      {
        collection: 'journal',
        label: 'Journal entry',
        blurb: 'Written entries on the Journal page, grouped by theme.',
        categories: ['Life', 'People', 'Travel', 'Thoughts', 'Milestones'],
        listPath: '/journal',
        hasPage: true,
      },
    ],
  },
  {
    id: 'photography',
    label: 'Photography',
    destinations: [
      {
        collection: 'photography',
        label: 'Photo story',
        blurb: 'Frames and “Behind The Shot” write-ups on the Photography page.',
        categories: ['Favorites', 'Behind The Shot', 'Life', 'Travel', 'Connected'],
        listPath: '/photography',
        hasPage: true,
      },
      {
        collection: 'gear',
        label: 'Gear',
        blurb: 'The camera and lens list (“The Tools”) on the Photography page.',
        categories: ['Cameras', 'Lenses', 'Tools', 'Software', 'Audio', 'Other'],
        categoryLabel: 'Gear type',
        listPath: '/photography',
        hasPage: false,
      },
    ],
  },
  {
    id: 'tech',
    label: 'Tech',
    destinations: [
      {
        collection: 'tech',
        label: 'Build log / article',
        blurb: 'Build logs, experiments and notes on the Tech page.',
        categories: ['Build Logs', 'Experiments', 'Linux', 'Networking', 'Programming', 'Tech News'],
        listPath: '/tech',
        hasPage: true,
      },
      {
        collection: 'favorites',
        label: 'Things I like',
        blurb: 'The “Things I Like” grid on the Tech page.',
        categories: ['Things I Like'],
        fixedCategory: 'Things I Like',
        listPath: '/tech',
        hasPage: false,
      },
    ],
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    destinations: [
      {
        collection: 'portfolio',
        label: 'Case study',
        blurb: 'Project case studies on the Portfolio page.',
        categories: ['Web Development', 'Systems', 'Embedded & DSP', 'Audio Engineering', 'Design', 'Other'],
        listPath: '/portfolio',
        hasPage: true,
      },
    ],
  },
  {
    id: 'home',
    label: 'Home page',
    isConfig: true,
    destinations: [
      {
        collection: 'home',
        label: 'Home block',
        blurb: 'Gateways, quotes, principles, the profile and reels on the landing page.',
        categories: ['gateway', 'quote', 'principle', 'profile', 'section', 'reel'],
        categoryLabel: 'Block type',
        listPath: '/',
        hasPage: false,
      },
      {
        collection: 'timeline',
        label: 'Timeline milestone',
        blurb: 'A milestone on the Home page timeline.',
        categories: ['Milestone'],
        fixedCategory: 'Milestone',
        listPath: '/',
        hasPage: false,
      },
    ],
  },
];

export const ALL_DESTINATIONS: Destination[] = WEBSITE_STRUCTURE.flatMap((s) => s.destinations);

export function destinationFor(collection: string): Destination | undefined {
  return ALL_DESTINATIONS.find((d) => d.collection === collection);
}

export function sectionFor(collection: string): Section | undefined {
  return WEBSITE_STRUCTURE.find((s) => s.destinations.some((d) => d.collection === collection));
}

/** The public URL of one entry, or the page that lists it when it has no page of its own. */
export function publicPath(collection: string, slug: string): string {
  const dest = destinationFor(collection);
  if (!dest) return '/';
  return dest.hasPage ? `/${collection}/${slug}` : dest.listPath;
}

/** Collections whose renderer accepts a `video` / `videoPoster` pair. */
export const MOTION_COLLECTIONS: CollectionId[] = ['journal', 'tech', 'photography', 'portfolio', 'home'];

/** Collections shown with the full page renderer, and therefore with the style studio. */
export const STYLED_COLLECTIONS: CollectionId[] = ['journal', 'tech', 'photography', 'portfolio'];

export const prettyCategory = (value: string): string =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : '';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

export type WorkflowState = 'draft' | 'review' | 'published' | 'archived';

export interface ListItem {
  collection: CollectionId;
  slug: string;
  title: string;
  date: string;
  category: string;
  coverImage?: string;
  excerpt?: string;
  filePath?: string;
  frontMatterError?: string;
  state: WorkflowState;
  visible: boolean;
  video?: string;
  videoPoster?: string;
  hasVideo?: boolean;
  configType?: string;
  label?: string;
  order?: number;
  featured?: boolean;
  unsavedChanges?: boolean;
  publishedAt?: string;
}

/**
 * What a reader of the site would call this item.
 *
 * Registry state is a workflow label ("has this been pushed?"); `visible` is
 * what the site itself honours. The badge combines them, so an item that is
 * live on the site is never labelled a draft.
 */
export type Standing = 'live' | 'hidden' | 'draft' | 'review' | 'archived';

export function standingOf(item: Pick<ListItem, 'state' | 'visible'>): Standing {
  if (item.state === 'archived') return 'archived';
  if (item.state === 'draft') return 'draft';
  if (item.state === 'review') return 'review';
  return item.visible ? 'live' : 'hidden';
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

export interface FormState {
  collection: CollectionId;
  isNew: boolean;
  originalSlug: string;
  slug: string;
  slugTouched: boolean;
  title: string;
  category: string;
  date: string;
  cover: string;
  video: string;
  videoPoster: string;
  gallery: string[];
  excerpt: string;
  body: string;
  // portfolio
  techStack: string[];
  githubLink: string;
  liveLink: string;
  featured: boolean;
  // photography
  gear: string[];
  captureMode: string;
  // journal
  volume: string;
  readingTime: string;
  tags: string[];
  published: boolean;
  // config collections
  order: number;
  visible: boolean;
  year: string;
  icon: string;
  link: string;
  group: string;
  label: string;
  navTarget: string;
  author: string;
  text: string;
  variant: string;
  specs: string[];
  customization: PostCustomization;
}

const today = () => new Date().toISOString().split('T')[0];

export function emptyForm(collection: CollectionId, category?: string): FormState {
  const dest = destinationFor(collection);
  return {
    collection,
    isNew: true,
    originalSlug: '',
    slug: '',
    slugTouched: false,
    title: '',
    category: category ?? dest?.fixedCategory ?? dest?.categories[0] ?? '',
    date: today(),
    cover: '',
    video: '',
    videoPoster: '',
    gallery: [],
    excerpt: '',
    body: '',
    techStack: [],
    githubLink: '',
    liveLink: '',
    featured: false,
    gear: [],
    captureMode: '',
    volume: '',
    readingTime: '',
    tags: [],
    published: true,
    order: 0,
    visible: true,
    year: '',
    icon: '',
    link: '',
    group: '',
    label: '',
    navTarget: '',
    author: '',
    text: '',
    variant: 'quote',
    specs: [],
    customization: {},
  };
}

/** Tolerates the three shapes these lists have been stored in over time. */
function stringList(value: unknown, split?: RegExp): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          const picked = record.item ?? record.title ?? record.value ?? record.tag ?? record.tech ?? record.image ?? Object.values(record)[0];
          return typeof picked === 'string' ? picked : '';
        }
        return '';
      })
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(split ?? /[,/]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

const str = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value));

export function formFromDoc(
  collection: CollectionId,
  slug: string,
  data: Record<string, any>,
  body: string
): FormState {
  const form = emptyForm(collection);
  return {
    ...form,
    isNew: false,
    originalSlug: slug,
    slug,
    slugTouched: true,
    title: str(data.title || data.label),
    category: str(data.category || data.configType) || form.category,
    date: str(data.date instanceof Date ? data.date.toISOString().split('T')[0] : data.date),
    cover: str(data.featuredImage || data.coverImage || data.projectImage || data.image),
    video: str(data.video),
    videoPoster: str(data.videoPoster),
    gallery: stringList(data.galleryImages),
    excerpt: str(data.excerpt || data.description),
    body: body || '',
    techStack: stringList(data.techStack),
    githubLink: str(data.githubLink),
    liveLink: str(data.liveLink),
    featured: !!data.featured,
    gear: stringList(data.gear),
    captureMode: str(data.captureMode),
    volume: data.volume != null ? String(data.volume) : '',
    readingTime: str(data.readingTime),
    tags: stringList(data.tags, /,/),
    published: data.published !== false,
    order: typeof data.order === 'number' ? data.order : 0,
    visible: data.visible !== false,
    year: str(data.year),
    icon: str(data.icon),
    link: str(data.link),
    group: str(data.group),
    label: str(data.label),
    navTarget: str(data.navTarget),
    author: str(data.author),
    text: str(data.text),
    variant: str(data.variant) || 'quote',
    specs: stringList(data.specs),
    customization: (data.customization as PostCustomization) || {},
  };
}

/** The one place a form becomes front-matter. */
export function serializeForm(form: FormState): { data: Record<string, any>; body: string } {
  const c = form.collection;
  const data: Record<string, any> = {
    title: form.title.trim(),
    category: form.category,
    date: form.date || today(),
    excerpt: form.excerpt || '',
  };

  switch (c) {
    case 'portfolio':
      data.projectImage = form.cover;
      data.techStack = form.techStack;
      data.githubLink = form.githubLink;
      data.liveLink = form.liveLink;
      data.featured = form.featured;
      data.description = form.excerpt;
      break;
    case 'photography':
      data.coverImage = form.cover;
      data.galleryImages = form.gallery;
      data.description = form.excerpt;
      data.gear = form.gear;
      data.captureMode = form.captureMode;
      break;
    case 'gear':
      data.image = form.cover;
      data.description = form.excerpt;
      data.order = form.order;
      data.visible = form.visible;
      data.specs = form.specs;
      break;
    case 'timeline':
      data.year = form.year;
      data.description = form.excerpt;
      data.order = form.order;
      data.visible = form.visible;
      break;
    case 'favorites':
      data.description = form.excerpt;
      data.icon = form.icon;
      data.link = form.link;
      data.group = form.group;
      data.order = form.order;
      data.visible = form.visible;
      break;
    case 'home':
      data.configType = form.category;
      data.label = form.label;
      data.description = form.excerpt;
      data.image = form.cover;
      data.author = form.author;
      data.text = form.text;
      data.variant = form.variant;
      data.navTarget = form.navTarget;
      data.order = form.order;
      data.visible = form.visible;
      break;
    case 'gallery':
      data.image = form.cover;
      data.description = form.excerpt;
      data.featured = form.featured;
      data.order = form.order;
      data.visible = form.visible;
      break;
    case 'journal': {
      data.featuredImage = form.cover;
      if (form.readingTime.trim()) data.readingTime = form.readingTime.trim();
      const volume = parseInt(form.volume, 10);
      if (!Number.isNaN(volume)) data.volume = volume;
      data.tags = form.tags;
      data.published = form.published;
      break;
    }
    default:
      data.coverImage = form.cover;
  }

  if (MOTION_COLLECTIONS.includes(c)) {
    if (form.video.trim()) data.video = form.video.trim();
    if (form.videoPoster.trim()) data.videoPoster = form.videoPoster.trim();
  }

  const customization = pruneCustomization(form.customization);
  if (customization && Object.keys(customization).length > 0) data.customization = customization;

  return { data, body: form.body };
}

/** A stable fingerprint, for "are there unsaved changes". */
export function fingerprint(form: FormState): string {
  const { data, body } = serializeForm(form);
  return JSON.stringify({ slug: form.slug, data, body });
}

// ---------------------------------------------------------------------------
// Preview payload — what the iframe needs to draw the entry
// ---------------------------------------------------------------------------

export type PreviewView = 'page' | 'card';

export interface PreviewPayload {
  view: PreviewView;
  collection: CollectionId;
  slug: string;
  title: string;
  category: string;
  /** Display date, as the site formats it. */
  date?: string;
  isoDate?: string;
  coverImage?: string;
  excerpt?: string;
  body: string;
  video?: string;
  videoPoster?: string;
  featured?: boolean;
  volume?: number;
  readingTime?: string;
  tags?: string[];
  label?: string;
  techStack?: string[];
  metadata: {
    githubLink?: string;
    liveLink?: string;
    techStack?: string[];
    galleryImages?: string[];
    gear?: string[];
    captureMode?: string;
  };
  customization?: PostCustomization;
  /** Bump to replay the entrance animation. */
  replay: number;
}

export function previewPayloadFromForm(form: FormState, view: PreviewView, replay: number): PreviewPayload {
  const { data } = serializeForm(form);
  const date = form.date ? formatDisplayDate(form.date) : undefined;
  const volume = parseInt(form.volume, 10);
  return {
    view,
    collection: form.collection,
    slug: form.slug || slugify(form.title) || 'untitled',
    title: form.title || (form.collection === 'home' ? form.label : '') || 'Untitled',
    category: form.category,
    date,
    isoDate: form.date || undefined,
    coverImage: form.cover || undefined,
    excerpt: form.excerpt || undefined,
    body: form.body,
    video: form.video || undefined,
    videoPoster: form.videoPoster || undefined,
    featured: form.featured,
    volume: Number.isNaN(volume) ? undefined : volume,
    readingTime: form.readingTime || undefined,
    tags: form.tags,
    label: form.label || undefined,
    techStack: form.techStack,
    metadata: {
      githubLink: form.githubLink || undefined,
      liveLink: form.liveLink || undefined,
      techStack: form.techStack.length ? form.techStack : undefined,
      galleryImages: form.gallery.length ? form.gallery : undefined,
      gear: form.gear.length ? form.gear : undefined,
      captureMode: form.captureMode || undefined,
    },
    customization: data.customization as PostCustomization | undefined,
    replay,
  };
}

/** Same format the site uses for entry dates. */
export function formatDisplayDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}
