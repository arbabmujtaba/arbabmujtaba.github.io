/**
 * Preview Pane Logic Tests
 *
 * Tests for:
 * - Preview URL resolution (singleton vs collection items)
 * - Publish payload structure matches API expectations
 * - Revert fetches fresh data and resets form state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolvePreviewUrl,
  buildPublishPayload,
  fetchContentForRevert,
  startPublish,
  getPagePreviewRoute,
} from '../src/lib/preview';
import type { SectionDef } from '../src/lib/sections';

// ============================================================
// Test data
// ============================================================

const singletonSection: SectionDef = {
  id: 'home-profile',
  page: 'home',
  title: 'Profile Bio',
  kind: 'singleton',
  collection: 'home',
  slug: 'profile-bio',
  fields: [],
  previewRoute: '/',
  description: 'Profile bio section on home page',
};

const collectionSection: SectionDef = {
  id: 'journal',
  page: 'journal',
  title: 'Journal',
  kind: 'collection',
  collection: 'journal',
  fields: [],
  previewRoute: '/journal',
  description: 'Personal journal entries',
};

const sectionWithoutPreviewRoute: SectionDef = {
  id: 'site-page-heroes',
  page: 'site',
  title: 'Page Heroes',
  kind: 'collection',
  collection: 'pages',
  fields: [],
  description: 'Hero sections for each page of the site',
};

const singletonWithoutSlug: SectionDef = {
  id: 'orphan-section',
  page: 'misc',
  title: 'Orphan',
  kind: 'singleton',
  collection: 'misc',
  fields: [],
  previewRoute: '/misc',
  description: 'Section without a slug',
};

// ============================================================
// Tests
// ============================================================

describe('Preview URL Resolution', () => {
  describe('resolvePreviewUrl', () => {
    it('returns /preview/:collection/:slug for singleton sections', () => {
      const url = resolvePreviewUrl(singletonSection);
      expect(url).toBe('/preview/home/profile-bio');
    });

    it('returns /preview/:collection/:slug for collection items', () => {
      const url = resolvePreviewUrl(collectionSection, 'my-first-post');
      expect(url).toBe('/preview/journal/my-first-post');
    });

    it('uses section slug for singletons (ignores provided itemSlug)', () => {
      const url = resolvePreviewUrl(singletonSection, 'some-other-slug');
      expect(url).toBe('/preview/home/profile-bio');
    });

    it('uses provided itemSlug for collections', () => {
      const url = resolvePreviewUrl(collectionSection, 'travel-notes-2024');
      expect(url).toBe('/preview/journal/travel-notes-2024');
    });

    it('falls back to previewRoute if collection section has no item slug', () => {
      const url = resolvePreviewUrl(collectionSection);
      expect(url).toBe('/journal');
    });

    it('falls back to / if no previewRoute and no slug', () => {
      const url = resolvePreviewUrl(sectionWithoutPreviewRoute);
      expect(url).toBe('/');
    });

    it('falls back to previewRoute if singleton has no slug', () => {
      const url = resolvePreviewUrl(singletonWithoutSlug);
      expect(url).toBe('/misc');
    });
  });

  describe('getPagePreviewRoute', () => {
    it('returns the previewRoute for a section', () => {
      expect(getPagePreviewRoute(collectionSection)).toBe('/journal');
    });

    it('returns / when no previewRoute is defined', () => {
      expect(getPagePreviewRoute(sectionWithoutPreviewRoute)).toBe('/');
    });
  });
});

describe('Publish Payload Construction', () => {
  describe('buildPublishPayload', () => {
    it('constructs payload with all required fields', () => {
      const data = { title: 'My Post', category: 'Tech', date: '2024-01-15' };
      const body = '# Hello World\n\nThis is my post.';

      const payload = buildPublishPayload('journal', 'my-post', data, body);

      expect(payload).toEqual({
        collection: 'journal',
        slug: 'my-post',
        title: 'My Post',
        body: '# Hello World\n\nThis is my post.',
        data: { title: 'My Post', category: 'Tech', date: '2024-01-15' },
      });
    });

    it('uses slug as title fallback when title is missing', () => {
      const data = { category: 'Photos' };
      const body = '';

      const payload = buildPublishPayload('photography', 'sunset-photo', data, body);

      expect(payload.title).toBe('sunset-photo');
    });

    it('includes complete data object in payload', () => {
      const data = {
        title: 'Gateway Card',
        configType: 'gateway',
        navTarget: '/journal',
        order: 2,
        visible: true,
      };

      const payload = buildPublishPayload('home', 'gateway-journal', data, '');

      expect(payload.data).toEqual(data);
      expect(payload.collection).toBe('home');
      expect(payload.slug).toBe('gateway-journal');
    });

    it('handles empty body', () => {
      const payload = buildPublishPayload('gear', 'camera-a7iii', { title: 'Sony A7III' }, '');
      expect(payload.body).toBe('');
    });

    it('preserves body content with special characters', () => {
      const body = '```typescript\nconst x = 1;\n```\n\n---\n\n> Quote with "special" chars';
      const payload = buildPublishPayload('tech', 'code-post', { title: 'Code' }, body);
      expect(payload.body).toBe(body);
    });
  });
});

describe('Revert Behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchContentForRevert', () => {
    it('fetches content from GET /api/content/:collection/:slug', async () => {
      const mockResponse = {
        data: { title: 'Original Title', category: 'Life' },
        body: 'Original body content',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchContentForRevert('journal', 'my-post');

      expect(global.fetch).toHaveBeenCalledWith('/api/content/journal/my-post');
      expect(result.data).toEqual({ title: 'Original Title', category: 'Life' });
      expect(result.body).toBe('Original body content');
    });

    it('throws error on failed fetch', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(fetchContentForRevert('journal', 'nonexistent')).rejects.toThrow(
        'Failed to fetch content: 404'
      );
    });

    it('returns empty data and body when server returns minimal response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await fetchContentForRevert('home', 'profile-bio');

      expect(result.data).toEqual({});
      expect(result.body).toBe('');
    });
  });

  describe('startPublish', () => {
    it('sends POST to /api/publish and returns jobId', async () => {
      const payload = buildPublishPayload(
        'journal',
        'my-post',
        { title: 'My Post' },
        'Body content'
      );

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ jobId: 'job-123-abc', status: 'running' }),
      });

      const jobId = await startPublish(payload);

      expect(global.fetch).toHaveBeenCalledWith('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      expect(jobId).toBe('job-123-abc');
    });

    it('throws error on failed publish', async () => {
      const payload = buildPublishPayload('journal', 'post', { title: 'P' }, '');

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(startPublish(payload)).rejects.toThrow('Publish failed: 500');
    });
  });
});

describe('Preview Refresh on Save', () => {
  it('preview URL includes collection and slug for iframe src', () => {
    // The preview iframe src should be deterministic from collection + slug
    const url = resolvePreviewUrl(collectionSection, 'updated-post');
    expect(url).toBe('/preview/journal/updated-post');

    // After save, the same URL is used but a key/timestamp change forces reload.
    // This test validates the URL itself does not change (it's the key that triggers reload).
    const urlAfterSave = resolvePreviewUrl(collectionSection, 'updated-post');
    expect(urlAfterSave).toBe(url);
  });

  it('singleton preview URL is stable across saves', () => {
    const url1 = resolvePreviewUrl(singletonSection);
    const url2 = resolvePreviewUrl(singletonSection);
    expect(url1).toBe(url2);
    expect(url1).toBe('/preview/home/profile-bio');
  });
});
