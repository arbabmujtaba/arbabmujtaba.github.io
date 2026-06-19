import { describe, it, expect } from 'vitest';
import { SECTIONS, type SectionDef, type SectionFieldType } from '../src/lib/sections';

/**
 * All valid field types in the Section Registry
 */
const VALID_FIELD_TYPES: SectionFieldType[] = [
  'text',
  'textarea',
  'markdown',
  'image',
  'gallery',
  'link',
  'select',
  'number',
  'boolean',
  'date',
  'tags',
];

/**
 * The 10 existing content collections in the project
 */
const EXISTING_COLLECTIONS = [
  'journal',
  'tech',
  'photography',
  'collection',
  'portfolio',
  'gear',
  'timeline',
  'favorites',
  'home',
  'gallery',
];

describe('Section Registry', () => {
  it('exports a non-empty SECTIONS array', () => {
    expect(Array.isArray(SECTIONS)).toBe(true);
    expect(SECTIONS.length).toBeGreaterThan(0);
  });

  it('has exactly 18 section definitions', () => {
    expect(SECTIONS.length).toBe(18);
  });

  it('all section ids are unique', () => {
    const ids = SECTIONS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('every section has a valid kind (singleton or collection)', () => {
    for (const section of SECTIONS) {
      expect(['singleton', 'collection']).toContain(section.kind);
    }
  });

  it('all singleton sections have a slug field defined', () => {
    const singletons = SECTIONS.filter((s) => s.kind === 'singleton');
    expect(singletons.length).toBeGreaterThan(0);
    for (const section of singletons) {
      expect(section.slug).toBeDefined();
      expect(typeof section.slug).toBe('string');
      expect(section.slug!.length).toBeGreaterThan(0);
    }
  });

  it('every existing content collection is covered by at least one section', () => {
    const coveredCollections = new Set(SECTIONS.map((s) => s.collection));
    for (const collection of EXISTING_COLLECTIONS) {
      expect(coveredCollections.has(collection)).toBe(true);
    }
  });

  it('all field types are valid SectionFieldType values', () => {
    for (const section of SECTIONS) {
      for (const field of section.fields) {
        expect(VALID_FIELD_TYPES).toContain(field.type);
      }
    }
  });

  it('all fields have required name, label, type, and required properties', () => {
    for (const section of SECTIONS) {
      for (const field of section.fields) {
        expect(typeof field.name).toBe('string');
        expect(field.name.length).toBeGreaterThan(0);
        expect(typeof field.label).toBe('string');
        expect(field.label.length).toBeGreaterThan(0);
        expect(typeof field.type).toBe('string');
        expect(typeof field.required).toBe('boolean');
      }
    }
  });

  it('select fields have options array defined', () => {
    for (const section of SECTIONS) {
      const selectFields = section.fields.filter((f) => f.type === 'select');
      for (const field of selectFields) {
        expect(Array.isArray(field.options)).toBe(true);
        expect(field.options!.length).toBeGreaterThan(0);
      }
    }
  });

  it('sections are grouped by valid pages', () => {
    const validPages = ['site', 'home', 'photography', 'collection', 'tech', 'journal', 'portfolio'];
    for (const section of SECTIONS) {
      expect(validPages).toContain(section.page);
    }
  });

  it('every section has at least one field', () => {
    for (const section of SECTIONS) {
      expect(section.fields.length).toBeGreaterThan(0);
    }
  });

  it('every section has required properties: id, page, title, kind, collection, fields', () => {
    for (const section of SECTIONS) {
      expect(typeof section.id).toBe('string');
      expect(typeof section.page).toBe('string');
      expect(typeof section.title).toBe('string');
      expect(typeof section.kind).toBe('string');
      expect(typeof section.collection).toBe('string');
      expect(Array.isArray(section.fields)).toBe(true);
    }
  });

  it('the pages collection is referenced for new pages-based sections', () => {
    const pagesSections = SECTIONS.filter((s) => s.collection === 'pages');
    expect(pagesSections.length).toBeGreaterThanOrEqual(2);
    // Should include site-page-heroes, home-hero, portfolio-skills
    const pagesSectionIds = pagesSections.map((s) => s.id);
    expect(pagesSectionIds).toContain('site-page-heroes');
    expect(pagesSectionIds).toContain('home-hero');
    expect(pagesSectionIds).toContain('portfolio-skills');
  });
});
