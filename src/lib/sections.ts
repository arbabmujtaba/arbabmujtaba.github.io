/**
 * Section Registry
 *
 * Defines the complete section map for the CMS admin interface.
 * Each section maps to a content collection (or subset via filter)
 * and declares the fields available for editing.
 */

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type SectionFieldType =
  | 'text'
  | 'textarea'
  | 'markdown'
  | 'image'
  | 'gallery'
  | 'link'
  | 'select'
  | 'number'
  | 'boolean'
  | 'date'
  | 'tags';

export interface SectionField {
  name: string;
  label: string;
  type: SectionFieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export type SectionKind = 'singleton' | 'collection';

export interface SectionDef {
  id: string;
  page: string;
  title: string;
  kind: SectionKind;
  collection: string;
  filter?: Record<string, string | string[]>;
  slug?: string;
  fields: SectionField[];
  previewRoute?: string;
  description?: string;
}

// ============================================================
// SHARED FIELD SETS
// ============================================================

const commonFields = {
  title: { name: 'title', label: 'Title', type: 'text' as const, required: true },
  slug: { name: 'slug', label: 'Slug', type: 'text' as const, required: true },
  date: { name: 'date', label: 'Date', type: 'date' as const, required: true },
  coverImage: { name: 'coverImage', label: 'Cover Image', type: 'image' as const, required: false },
  body: { name: 'body', label: 'Body', type: 'markdown' as const, required: false },
  description: { name: 'description', label: 'Description', type: 'textarea' as const, required: true },
  order: { name: 'order', label: 'Order', type: 'number' as const, required: true },
  visible: { name: 'visible', label: 'Visible', type: 'boolean' as const, required: true },
  image: { name: 'image', label: 'Image', type: 'image' as const, required: false },
};

// ============================================================
// SECTIONS ARRAY
// ============================================================

export const SECTIONS: SectionDef[] = [
  // --- Site-wide page heroes ---
  {
    id: 'site-page-heroes',
    page: 'site',
    title: 'Page Heroes',
    kind: 'collection',
    collection: 'pages',
    fields: [
      commonFields.title,
      commonFields.slug,
      { name: 'headline', label: 'Headline', type: 'text', required: true },
      { name: 'subtitle', label: 'Subtitle', type: 'textarea', required: false },
      commonFields.image,
      commonFields.body,
    ],
    description: 'Hero sections for each page of the site',
  },

  // --- Home page ---
  {
    id: 'home-hero',
    page: 'home',
    title: 'Home Hero',
    kind: 'singleton',
    collection: 'pages',
    slug: 'home-hero',
    fields: [
      commonFields.title,
      commonFields.slug,
      { name: 'headline', label: 'Headline', type: 'text', required: true },
      { name: 'subtitle', label: 'Subtitle', type: 'textarea', required: false },
      commonFields.image,
      commonFields.body,
    ],
    previewRoute: '/',
    description: 'Hero section for the home page',
  },
  {
    id: 'home-profile',
    page: 'home',
    title: 'Profile Bio',
    kind: 'singleton',
    collection: 'home',
    filter: { configType: 'profile' },
    slug: 'profile-bio',
    fields: [
      commonFields.title,
      commonFields.slug,
      { name: 'configType', label: 'Config Type', type: 'text', required: true },
      { name: 'label', label: 'Label', type: 'text', required: false },
      commonFields.description,
      commonFields.image,
      commonFields.order,
      commonFields.visible,
      commonFields.body,
    ],
    previewRoute: '/',
    description: 'Profile bio section on home page',
  },
  {
    id: 'home-gateways',
    page: 'home',
    title: 'Gateways',
    kind: 'collection',
    collection: 'home',
    filter: { configType: 'gateway' },
    fields: [
      commonFields.title,
      commonFields.slug,
      { name: 'configType', label: 'Config Type', type: 'text', required: true },
      { name: 'label', label: 'Label', type: 'text', required: false },
      { name: 'description', label: 'Description', type: 'textarea', required: false },
      commonFields.image,
      { name: 'navTarget', label: 'Navigation Target', type: 'link', required: false },
      commonFields.order,
      commonFields.visible,
    ],
    previewRoute: '/',
    description: 'Navigation gateway cards on home page',
  },
  {
    id: 'home-quotes',
    page: 'home',
    title: 'Quotes',
    kind: 'collection',
    collection: 'home',
    filter: { configType: 'quote' },
    fields: [
      commonFields.title,
      commonFields.slug,
      { name: 'configType', label: 'Config Type', type: 'text', required: true },
      { name: 'text', label: 'Quote Text', type: 'textarea', required: true },
      { name: 'author', label: 'Author', type: 'text', required: false },
      commonFields.order,
      commonFields.visible,
    ],
    previewRoute: '/',
    description: 'Inspirational quotes on home page',
  },
  {
    id: 'home-principles',
    page: 'home',
    title: 'Principles',
    kind: 'collection',
    collection: 'home',
    filter: { configType: 'principle' },
    fields: [
      commonFields.title,
      commonFields.slug,
      { name: 'configType', label: 'Config Type', type: 'text', required: true },
      { name: 'text', label: 'Principle Text', type: 'textarea', required: true },
      commonFields.description,
      commonFields.order,
      commonFields.visible,
    ],
    previewRoute: '/',
    description: 'Life principles displayed on home page',
  },

  // --- Photography page ---
  {
    id: 'photography-entries',
    page: 'photography',
    title: 'Photography Entries',
    kind: 'collection',
    collection: 'photography',
    fields: [
      commonFields.title,
      commonFields.slug,
      commonFields.date,
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['Favorites', 'Life', 'Connected', 'Travel', 'Behind The Shot', 'Gear'] },
      { name: 'coverImage', label: 'Cover Image', type: 'image', required: true },
      { name: 'galleryImages', label: 'Gallery Images', type: 'gallery', required: false },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'story', label: 'Story', type: 'markdown', required: false },
    ],
    previewRoute: '/photography',
    description: 'Photography posts with galleries',
  },
  {
    id: 'photo-gallery',
    page: 'photography',
    title: 'Photo Gallery',
    kind: 'collection',
    collection: 'gallery',
    fields: [
      commonFields.title,
      commonFields.slug,
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['Life', 'Travel', 'Connected', 'Favorites', 'Behind The Shot'] },
      { name: 'description', label: 'Description', type: 'textarea', required: false },
      { name: 'image', label: 'Image', type: 'image', required: true },
      { name: 'featured', label: 'Featured', type: 'boolean', required: true },
      commonFields.order,
      commonFields.visible,
      commonFields.body,
    ],
    previewRoute: '/photography',
    description: 'Individual gallery photos',
  },
  {
    id: 'photo-gear',
    page: 'photography',
    title: 'Photography Gear',
    kind: 'collection',
    collection: 'gear',
    fields: [
      commonFields.title,
      commonFields.slug,
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['Cameras', 'Lenses', 'Tools', 'Software', 'Audio', 'Other'] },
      commonFields.description,
      commonFields.image,
      { name: 'specs', label: 'Specs', type: 'tags', required: false },
      commonFields.order,
      commonFields.visible,
      commonFields.body,
    ],
    previewRoute: '/photography',
    description: 'Photography gear items',
  },

  // --- Collection page ---
  {
    id: 'collection-timeline',
    page: 'collection',
    title: 'Timeline',
    kind: 'collection',
    collection: 'timeline',
    fields: [
      commonFields.title,
      commonFields.slug,
      { name: 'year', label: 'Year', type: 'text', required: true },
      commonFields.description,
      commonFields.order,
      commonFields.visible,
      commonFields.body,
    ],
    previewRoute: '/collection',
    description: 'Timeline milestones',
  },
  {
    id: 'collection-favorites',
    page: 'collection',
    title: 'Favorites',
    kind: 'collection',
    collection: 'favorites',
    filter: { category: ['Favorite Technologies', 'Favorite Software', 'Favorite Linux Tools', 'Favorite Gear', 'Favorite Setups'] },
    fields: [
      commonFields.title,
      commonFields.slug,
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['Favorite Technologies', 'Favorite Software', 'Favorite Linux Tools', 'Favorite Gear', 'Favorite Setups'] },
      commonFields.description,
      { name: 'icon', label: 'Icon', type: 'text', required: false },
      { name: 'link', label: 'Link', type: 'link', required: false },
      { name: 'group', label: 'Group', type: 'text', required: false },
      commonFields.order,
      commonFields.visible,
      commonFields.body,
    ],
    previewRoute: '/collection',
    description: 'Favorite tools, software, and gear',
  },
  {
    id: 'collection-inspirations',
    page: 'collection',
    title: 'Inspirations',
    kind: 'collection',
    collection: 'collection',
    fields: [
      commonFields.title,
      commonFields.slug,
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['Uses', 'Music', 'Books', 'Gear', 'Timeline', 'Inspirations', 'Favorites'] },
      commonFields.coverImage,
      commonFields.description,
      commonFields.body,
    ],
    previewRoute: '/collection',
    description: 'Inspirational collection entries',
  },

  // --- Tech page ---
  {
    id: 'tech-notes',
    page: 'tech',
    title: 'Tech Notes',
    kind: 'collection',
    collection: 'tech',
    filter: { category: ['Tech News', 'Things I Like', 'Build Logs', 'Linux', 'Networking', 'Programming'] },
    fields: [
      commonFields.title,
      commonFields.slug,
      commonFields.date,
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['Tech News', 'Things I Like', 'Build Logs', 'Linux', 'Networking', 'Programming'] },
      commonFields.coverImage,
      { name: 'excerpt', label: 'Excerpt', type: 'textarea', required: true },
      commonFields.body,
    ],
    previewRoute: '/tech',
    description: 'Tech notes and articles (excluding experiments)',
  },
  {
    id: 'tech-experiments',
    page: 'tech',
    title: 'Experiments',
    kind: 'collection',
    collection: 'tech',
    filter: { category: 'Experiments' },
    fields: [
      commonFields.title,
      commonFields.slug,
      commonFields.date,
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['Experiments'] },
      commonFields.coverImage,
      { name: 'excerpt', label: 'Excerpt', type: 'textarea', required: true },
      commonFields.body,
    ],
    previewRoute: '/tech',
    description: 'Tech experiments and side projects',
  },
  {
    id: 'things-i-like',
    page: 'tech',
    title: 'Things I Like',
    kind: 'collection',
    collection: 'favorites',
    filter: { category: 'Things I Like' },
    fields: [
      commonFields.title,
      commonFields.slug,
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['Things I Like'] },
      commonFields.description,
      { name: 'icon', label: 'Icon', type: 'text', required: false },
      { name: 'link', label: 'Link', type: 'link', required: false },
      { name: 'group', label: 'Group', type: 'text', required: false },
      commonFields.order,
      commonFields.visible,
      commonFields.body,
    ],
    previewRoute: '/tech',
    description: 'Things I Like entries on the tech page',
  },

  // --- Journal page ---
  {
    id: 'journal',
    page: 'journal',
    title: 'Journal',
    kind: 'collection',
    collection: 'journal',
    fields: [
      commonFields.title,
      commonFields.slug,
      commonFields.date,
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['Life', 'People', 'Travel', 'Thoughts', 'Milestones'] },
      commonFields.coverImage,
      { name: 'excerpt', label: 'Excerpt', type: 'textarea', required: true },
      commonFields.body,
    ],
    previewRoute: '/journal',
    description: 'Personal journal entries',
  },

  // --- Portfolio page ---
  {
    id: 'portfolio-projects',
    page: 'portfolio',
    title: 'Portfolio Projects',
    kind: 'collection',
    collection: 'portfolio',
    fields: [
      commonFields.title,
      commonFields.slug,
      commonFields.description,
      { name: 'techStack', label: 'Tech Stack', type: 'tags', required: false },
      { name: 'githubLink', label: 'GitHub Link', type: 'link', required: false },
      { name: 'liveLink', label: 'Live Link', type: 'link', required: false },
      { name: 'projectImage', label: 'Project Image', type: 'image', required: true },
      { name: 'featured', label: 'Featured', type: 'boolean', required: true },
      commonFields.body,
    ],
    previewRoute: '/portfolio',
    description: 'Portfolio project showcase',
  },
  {
    id: 'portfolio-skills',
    page: 'portfolio',
    title: 'Portfolio Skills',
    kind: 'singleton',
    collection: 'pages',
    slug: 'portfolio-skills',
    fields: [
      commonFields.title,
      commonFields.slug,
      commonFields.body,
    ],
    previewRoute: '/portfolio',
    description: 'Technical skills section for portfolio page',
  },
];
