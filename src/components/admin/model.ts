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
import {
  INK_SECTIONS,
  SECRET_KINDS,
  SECRET_ROOMS,
  SECRET_TRIGGERS,
  type InkSection,
  type PostCustomization,
  type SecretKind,
  type SecretRoomId,
  type SecretTrigger,
} from '../../types';

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
  | 'secrets';

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
        // The Portfolio page groups by tech stack, not by category: nothing on
        // the site reads a `category` for a project, so the admin no longer
        // offers one (it used to write a field that was never read).
        categories: [],
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
        blurb: 'Archive doors, notes, principles, the profile and reels on the landing page.',
        categories: ['gateway', 'quote', 'principle', 'profile', 'section', 'reel', 'thought'],
        categoryLabel: 'Block type',
        listPath: '/',
        hasPage: false,
      },
      {
        collection: 'timeline',
        label: 'Timeline chapter',
        blurb: 'A chapter on the Home page timeline — a year, a place and a few lines.',
        categories: [],
        listPath: '/',
        hasPage: false,
      },
    ],
  },
  {
    id: 'secrets',
    label: 'Hidden layer',
    isConfig: true,
    destinations: [
      {
        collection: 'secrets',
        label: 'Secret',
        blurb:
          'Secret rooms, hidden notes, easter-egg copy and invisible-ink marginalia. Hidden is not private: everything published here ships inside the public site bundle and can be read in the browser’s network panel.',
        categories: SECRET_KINDS,
        categoryLabel: 'Kind',
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

/**
 * Collections that are fragments of a page rather than documents — they have an
 * `order` and a `visible` switch instead of a date and a URL of their own.
 * Derived from the structure so a new one is never missed.
 */
export const isSnippetCollection = (collection: string): boolean =>
  destinationFor(collection)?.hasPage === false;

/**
 * Home blocks are stored by their raw `configType`. These are what an author
 * should read instead (the raw value is still what gets written).
 */
export const HOME_BLOCK_LABELS: Record<string, string> = {
  gateway: 'Archive door',
  quote: 'Note (last notes)',
  principle: 'Principle',
  profile: 'Profile',
  reel: 'Reel',
  thought: 'Thought',
  section: 'Section',
};

/** Plain-words description of where a home block appears. */
export const HOME_BLOCK_WHERE: Record<string, string> = {
  gateway: 'the archive doors that lead to the other pages',
  quote: 'the “last notes” band',
  principle: 'the principles list',
  profile: 'the profile section',
  reel: 'the “frames that keep moving” strip',
  thought: 'the random-thought drawer',
  section: 'a section of the landing page',
};

/** What each secret kind is, in one line. */
export const SECRET_KIND_LABELS: Record<SecretKind, string> = {
  room: 'Secret room',
  note: 'Hidden note',
  egg: 'Easter egg',
  ink: 'Invisible ink',
};

export const SECRET_KIND_HELP: Record<SecretKind, string> = {
  room: 'Configures one secret room — its name, its one-line intro, and whether its door works at all.',
  note: 'A hidden manuscript shown inside one of the rooms. The body is the note; the description signs it.',
  egg: 'The copy one easter egg reveals. Switching it off disables that easter egg entirely.',
  ink: 'Marginalia on the home page, readable only under the wand’s light. The title is the handwritten line.',
};

export const SECRET_ROOM_LABELS: Record<SecretRoomId, string> = {
  library: 'The Restricted Section (library)',
  darkroom: 'The Darkroom',
  details: 'The Room of Small Details',
};

/** How a visitor sets each easter egg off. Shown next to the trigger picker. */
export const SECRET_TRIGGER_LABELS: Record<SecretTrigger, string> = {
  seal: 'Wax seal — seven clicks',
  constellation: 'Constellation — seven stars',
  fullstop: 'The full stop after the name',
  lumos: 'Lumos — casting light',
  alohomora: 'Alohomora — the hidden shelf',
  console: 'Developer console',
  invitation: 'The invitation — first visit',
};

export const SECRET_TRIGGER_HELP: Record<SecretTrigger, string> = {
  seal: 'Clicking the wax seal in the footer seven times.',
  constellation: 'Connecting the seven bright stars in the hero sky, in night mode.',
  fullstop: 'Clicking the full stop after the name with the wand.',
  lumos: 'Casting light with the wand, or typing “lumos”.',
  alohomora: 'Typing “alohomora”, which opens the hidden shelf.',
  console: 'A message printed to the browser’s devtools console.',
  invitation:
    'Shown once, to a first-time visitor who has scrolled past the opening screen and found nothing yet — the only hint that works on a phone, where nobody opens the console or types a spell.',
};

export const INK_SECTION_LABELS: Record<InkSection, string> = {
  hero: 'Hero — the opening screen',
  frames: 'Frames — the photography strip',
  work: 'Work — the project index',
  writing: 'Writing — the desk and the shelf',
  timeline: 'Timeline — the chapters',
  notes: 'Notes — the last-notes band',
  archive: 'Archive — the doors at the foot of the page',
};

/** What the `visible` switch does, in the author's words, per collection and kind. */
export function visibilityLabel(collection: CollectionId, kind?: string): { label: string; hint: string } {
  if (collection === 'secrets') {
    switch (kind) {
      case 'room':
        return { label: 'Room open', hint: 'Off disables this room’s door — visitors cannot reach it at all.' };
      case 'egg':
        return { label: 'Easter egg switched on', hint: 'Off switches this easter egg off entirely, trigger and all.' };
      case 'ink':
        return { label: 'Ink shows under the light', hint: 'Off removes this marginalia from the page.' };
      default:
        return { label: 'Note on the shelf', hint: 'Off keeps the note out of its room.' };
    }
  }
  return { label: 'Show on site', hint: 'Off hides it without deleting it.' };
}

/** Suggestions for a timeline chapter's place. Any text is accepted. */
export const PLACE_SUGGESTIONS = ['Sopore', 'Indore'];

export const prettyCategory = (value: string): string =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : '';

/**
 * How a category should read in the UI. Home blocks and secrets store machine
 * values (`gateway`, `ink`); everywhere they are shown to a person they get a
 * human label, while the raw value is still what is written to disk.
 */
export function categoryLabelFor(collection: string, value: string): string {
  if (!value) return '';
  if (collection === 'home') return HOME_BLOCK_LABELS[value] ?? prettyCategory(value);
  if (collection === 'secrets') return SECRET_KIND_LABELS[value as SecretKind] ?? prettyCategory(value);
  return prettyCategory(value);
}

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
  /** Secrets only: the kind is also mirrored into `category`. */
  kind?: string;
  room?: string;
  trigger?: string;
  section?: string;
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
  /** Timeline: where the chapter happened. Free text; Sopore / Indore are offered. */
  place: string;
  icon: string;
  link: string;
  group: string;
  label: string;
  navTarget: string;
  author: string;
  text: string;
  variant: string;
  specs: string[];
  // secrets — `category` carries the kind, these carry the rest
  room: SecretRoomId | '';
  trigger: SecretTrigger | '';
  section: InkSection | '';
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
    place: '',
    icon: '',
    link: '',
    group: '',
    label: '',
    navTarget: '',
    author: '',
    text: '',
    variant: 'quote',
    specs: [],
    room: collection === 'secrets' ? 'library' : '',
    trigger: collection === 'secrets' ? 'seal' : '',
    section: collection === 'secrets' ? 'hero' : '',
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

/** Narrow a front-matter value to one of a closed list, or '' when it is not one. */
function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | '' {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : '';
}

export function formFromDoc(
  collection: CollectionId,
  slug: string,
  data: Record<string, any>,
  body: string
): FormState {
  const form = emptyForm(collection);
  // A secret's kind lives in `kind`; everything else uses `category` / `configType`.
  const category =
    collection === 'secrets'
      ? oneOf<SecretKind>(data.kind, SECRET_KINDS) || 'note'
      : str(data.category || data.configType) || form.category;
  return {
    ...form,
    isNew: false,
    originalSlug: slug,
    slug,
    slugTouched: true,
    title: str(data.title || data.label),
    category,
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
    place: str(data.place),
    icon: str(data.icon),
    link: str(data.link),
    group: str(data.group),
    label: str(data.label),
    navTarget: str(data.navTarget),
    author: str(data.author),
    text: str(data.text),
    variant: str(data.variant) || 'quote',
    specs: stringList(data.specs),
    room: oneOf<SecretRoomId>(data.room, SECRET_ROOMS) || (category === 'room' || category === 'note' ? 'library' : ''),
    trigger: oneOf<SecretTrigger>(data.trigger, SECRET_TRIGGERS) || (category === 'egg' ? 'seal' : ''),
    section: oneOf<InkSection>(data.section, INK_SECTIONS) || (category === 'ink' ? 'hero' : ''),
    customization: (data.customization as PostCustomization) || {},
  };
}

/**
 * The one place a form becomes front-matter.
 *
 * Only the keys the public reader (`lib/cms.ts`, `lib/secrets.ts`) actually
 * looks at are written. This used to add `category`, `date` and `excerpt` to
 * every collection, which put three dead keys into every gear, favourite,
 * timeline and home file each time one was saved — and made it look as though
 * the admin's category picker meant something for a portfolio project.
 */
export function serializeForm(form: FormState): { data: Record<string, any>; body: string } {
  const c = form.collection;
  const data: Record<string, any> = { title: form.title.trim() };

  // `category` is only read for these; see cms.ts.
  if (['journal', 'tech', 'photography', 'gear', 'favorites'].includes(c)) data.category = form.category;
  // A date is only shown for the four document collections.
  if (STYLED_COLLECTIONS.includes(c)) data.date = form.date || today();
  // `excerpt` is the card line for written entries; everything else uses `description`.
  if (['journal', 'tech'].includes(c)) data.excerpt = form.excerpt || '';

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
      if (form.place.trim()) data.place = form.place.trim();
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
      if (form.cover.trim()) data.image = form.cover.trim();
      if (form.author.trim()) data.author = form.author.trim();
      if (form.text.trim()) data.text = form.text.trim();
      if (form.category === 'quote' && form.variant.trim()) data.variant = form.variant.trim();
      // The site builds the link as `/${navTarget}`, so a leading slash would
      // produce a protocol-relative URL (`//journal`) and leave the site.
      if (form.navTarget.trim()) data.navTarget = form.navTarget.trim().replace(/^\/+/, '');
      data.order = form.order;
      data.visible = form.visible;
      break;
    case 'secrets': {
      // The kind is its own key — never `category`.
      const kind = (form.category || 'note') as SecretKind;
      data.kind = kind;
      // Only the field that kind uses, so a note never carries a stale trigger.
      if (kind === 'room' || kind === 'note') data.room = form.room || 'library';
      if (kind === 'egg') data.trigger = form.trigger || 'seal';
      if (kind === 'ink') data.section = form.section || 'hero';
      data.description = form.excerpt || '';
      if (form.date.trim()) data.date = form.date.trim();
      if (form.cover.trim()) data.image = form.cover.trim();
      data.order = form.order;
      data.visible = form.visible;
      break;
    }
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
  /** Secrets: which kind of secret, and the one field that kind uses. */
  kind?: SecretKind;
  room?: SecretRoomId | '';
  trigger?: SecretTrigger | '';
  section?: InkSection | '';
  /** Timeline: the year and the place. */
  year?: string;
  place?: string;
  order?: number;
  visible?: boolean;
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
    kind: form.collection === 'secrets' ? ((form.category || 'note') as SecretKind) : undefined,
    room: form.room,
    trigger: form.trigger,
    section: form.section,
    year: form.year || undefined,
    place: form.place || undefined,
    order: form.order,
    visible: form.visible,
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
