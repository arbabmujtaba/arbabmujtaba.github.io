import { describe, it, expect } from 'vitest';
import { getSectionById, getSectionItems, searchContent } from '../src/lib/sectionResolver';
import { SECTIONS } from '../src/lib/sections';

describe('sectionResolver', () => {
  describe('getSectionById', () => {
    it('returns correct section for a valid id', () => {
      const section = getSectionById('home-gateways');
      expect(section).toBeDefined();
      expect(section!.id).toBe('home-gateways');
      expect(section!.collection).toBe('home');
      expect(section!.kind).toBe('collection');
      expect(section!.filter).toEqual({ configType: 'gateway' });
    });

    it('returns undefined for an invalid id', () => {
      const section = getSectionById('nonexistent-section');
      expect(section).toBeUndefined();
    });

    it('returns a singleton section correctly', () => {
      const section = getSectionById('home-profile');
      expect(section).toBeDefined();
      expect(section!.kind).toBe('singleton');
      expect(section!.slug).toBe('profile-bio');
      expect(section!.collection).toBe('home');
    });

    it('returns journal section', () => {
      const section = getSectionById('journal');
      expect(section).toBeDefined();
      expect(section!.collection).toBe('journal');
      expect(section!.kind).toBe('collection');
      expect(section!.filter).toBeUndefined();
    });
  });

  describe('getSectionItems', () => {
    it('returns empty array for nonexistent section', async () => {
      const items = await getSectionItems('does-not-exist');
      expect(items).toEqual([]);
    });

    it('returns only configType=gateway items for home-gateways', async () => {
      const items = await getSectionItems('home-gateways');
      expect(items.length).toBeGreaterThan(0);

      for (const item of items) {
        expect(item.collection).toBe('home');
        expect(item.data.configType).toBe('gateway');
      }
    });

    it('home-gateways returns known gateway files', async () => {
      const items = await getSectionItems('home-gateways');
      const slugs = items.map((i) => i.slug);
      expect(slugs).toContain('gateway-photography');
      expect(slugs).toContain('gateway-tech');
    });

    it('does not include non-gateway items in home-gateways', async () => {
      const items = await getSectionItems('home-gateways');
      const slugs = items.map((i) => i.slug);
      // profile-bio is configType=profile, should not appear
      expect(slugs).not.toContain('profile-bio');
      // quote items should not appear
      expect(slugs).not.toContain('quote-curiosity');
    });

    it('returns all journal entries (no filter)', async () => {
      const items = await getSectionItems('journal');
      expect(items.length).toBeGreaterThan(0);

      for (const item of items) {
        expect(item.collection).toBe('journal');
      }
    });

    it('returns singleton item for home-profile', async () => {
      const items = await getSectionItems('home-profile');
      expect(items.length).toBe(1);
      expect(items[0].slug).toBe('profile-bio');
      expect(items[0].data.configType).toBe('profile');
    });

    it('returns only configType=quote items for home-quotes', async () => {
      const items = await getSectionItems('home-quotes');
      expect(items.length).toBeGreaterThan(0);

      for (const item of items) {
        expect(item.data.configType).toBe('quote');
      }
    });

    it('returns items with correct structure', async () => {
      const items = await getSectionItems('home-gateways');
      expect(items.length).toBeGreaterThan(0);

      const item = items[0];
      expect(item).toHaveProperty('collection');
      expect(item).toHaveProperty('slug');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('data');
      expect(item).toHaveProperty('body');
      expect(item).toHaveProperty('filePath');
      expect(typeof item.collection).toBe('string');
      expect(typeof item.slug).toBe('string');
      expect(typeof item.title).toBe('string');
      expect(typeof item.data).toBe('object');
      expect(typeof item.body).toBe('string');
      expect(typeof item.filePath).toBe('string');
    });

    it('returns empty array for section with nonexistent collection directory', async () => {
      // site-page-heroes uses 'pages' collection which may not exist on disk
      const items = await getSectionItems('site-page-heroes');
      // Should not throw, just return empty
      expect(Array.isArray(items)).toBe(true);
    });

    it('returns tech-experiments with only Experiments category', async () => {
      const items = await getSectionItems('tech-experiments');
      expect(items.length).toBeGreaterThan(0);

      for (const item of items) {
        expect(item.data.category).toBe('Experiments');
      }
    });

    it('returns portfolio-projects items', async () => {
      const items = await getSectionItems('portfolio-projects');
      expect(items.length).toBeGreaterThan(0);

      for (const item of items) {
        expect(item.collection).toBe('portfolio');
      }
    });
  });

  describe('searchContent', () => {
    it('returns empty array for empty query', async () => {
      const results = await searchContent('');
      expect(results).toEqual([]);
    });

    it('returns empty array for whitespace-only query', async () => {
      const results = await searchContent('   ');
      expect(results).toEqual([]);
    });

    it('finds matches in titles (case-insensitive)', async () => {
      // "Kashmiri AI Assistant" is a tech article title
      const results = await searchContent('kashmiri');
      expect(results.length).toBeGreaterThan(0);

      const titleMatch = results.find((r) => r.matchField === 'title');
      expect(titleMatch).toBeDefined();
      expect(titleMatch!.title.toLowerCase()).toContain('kashmiri');
    });

    it('finds matches in body text', async () => {
      // "compiler" appears in the journal growing-up.md body
      const results = await searchContent('compiler');
      expect(results.length).toBeGreaterThan(0);

      const bodyMatch = results.find((r) => r.matchField === 'body');
      expect(bodyMatch).toBeDefined();
    });

    it('finds matches in frontmatter values', async () => {
      // "gateway" is a configType value in home/*.md frontmatter
      const results = await searchContent('gateway');
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns results with correct structure', async () => {
      const results = await searchContent('photography');
      expect(results.length).toBeGreaterThan(0);

      const result = results[0];
      expect(result).toHaveProperty('sectionId');
      expect(result).toHaveProperty('collection');
      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('snippet');
      expect(result).toHaveProperty('matchField');
      expect(typeof result.sectionId).toBe('string');
      expect(typeof result.collection).toBe('string');
      expect(typeof result.slug).toBe('string');
      expect(typeof result.title).toBe('string');
      expect(typeof result.snippet).toBe('string');
      expect(typeof result.matchField).toBe('string');
    });

    it('snippet contains text around the match', async () => {
      const results = await searchContent('kashmiri');
      expect(results.length).toBeGreaterThan(0);

      const result = results[0];
      expect(result.snippet.toLowerCase()).toContain('kashmiri');
    });

    it('assigns correct section IDs to results', async () => {
      const results = await searchContent('gateway');
      // gateway items from home collection should be assigned home-gateways section
      const homeGatewayResults = results.filter(
        (r) => r.collection === 'home' && r.slug.startsWith('gateway-')
      );

      for (const r of homeGatewayResults) {
        expect(r.sectionId).toBe('home-gateways');
      }
    });

    it('does not return duplicate entries per file', async () => {
      const results = await searchContent('photography');
      // Check no duplicate slugs within same collection
      const seen = new Set<string>();
      for (const r of results) {
        const key = `${r.collection}/${r.slug}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    });
  });
});
