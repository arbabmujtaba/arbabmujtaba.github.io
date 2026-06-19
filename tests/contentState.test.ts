/**
 * Content State Transition Tests
 *
 * Converted to Vitest format from manual test runner.
 */

import { describe, it, expect } from 'vitest';
import {
  isValidTransition,
  assertValidTransition,
  transitionState,
  createItem,
  saveItem,
  getItem,
  deleteItem,
  getStateStats,
  InvalidTransitionError,
  ContentNotFoundError,
  ensureRegistry,
  type ContentState,
} from '../src/lib/contentState';

describe('ContentState Transition Tests', () => {
  describe('isValidTransition', () => {
    it('draft -> review is valid', () => {
      expect(isValidTransition('draft', 'review')).toBe(true);
    });

    it('review -> published is valid', () => {
      expect(isValidTransition('review', 'published')).toBe(true);
    });

    it('review -> draft is valid', () => {
      expect(isValidTransition('review', 'draft')).toBe(true);
    });

    it('published -> archived is valid', () => {
      expect(isValidTransition('published', 'archived')).toBe(true);
    });

    it('archived -> draft is valid', () => {
      expect(isValidTransition('archived', 'draft')).toBe(true);
    });

    it('draft -> published is invalid', () => {
      expect(isValidTransition('draft', 'published')).toBe(false);
    });

    it('published -> review is invalid', () => {
      expect(isValidTransition('published', 'review')).toBe(false);
    });

    it('archived -> published is invalid', () => {
      expect(isValidTransition('archived', 'published')).toBe(false);
    });

    it('draft -> archived is invalid', () => {
      expect(isValidTransition('draft', 'archived')).toBe(false);
    });

    it('published -> draft is invalid', () => {
      expect(isValidTransition('published', 'draft')).toBe(false);
    });

    it('same-state transitions: draft->draft allowed for initialization', () => {
      expect(isValidTransition('draft', 'draft')).toBe(true);
    });

    it('same-state transitions for non-draft states are invalid', () => {
      expect(isValidTransition('published', 'published')).toBe(false);
      expect(isValidTransition('review', 'review')).toBe(false);
      expect(isValidTransition('archived', 'archived')).toBe(false);
    });
  });

  describe('assertValidTransition', () => {
    it('throws InvalidTransitionError for draft->published', () => {
      expect(() => assertValidTransition('draft', 'published', 'test', 'slug')).toThrow();
      try {
        assertValidTransition('draft', 'published', 'test', 'slug');
      } catch (e: any) {
        expect(e.name).toBe('InvalidTransitionError');
      }
    });

    it('does not throw for valid transitions', () => {
      expect(() => assertValidTransition('draft', 'review', 'test', 'slug')).not.toThrow();
      expect(() => assertValidTransition('review', 'published', 'test', 'slug')).not.toThrow();
    });
  });

  describe('Registry CRUD', () => {
    it('createItem initializes with draft state', async () => {
      const item = await createItem('test-collection', 'test-slug-a', 'Test Title', 'content/test-collection/test-slug-a.md');
      expect(item.state).toBe('draft');
      expect(item.title).toBe('Test Title');
      expect(item.versions.length).toBe(1);
      expect(item.versions[0].state).toBe('draft');
      await deleteItem('test-collection', 'test-slug-a');
    });

    it('transitionState advances item through lifecycle', async () => {
      // Create fresh item
      const item = await createItem('test-collection', 'test-slug-b', 'Lifecycle Test', 'content/test-collection/test-slug-b.md');
      expect(item.state).toBe('draft');

      // draft -> review
      const reviewItem = await transitionState('test-collection', 'test-slug-b', 'review', { notes: 'Ready for review' });
      expect(reviewItem.state).toBe('review');
      expect(reviewItem.versions.length).toBe(2);
      expect(reviewItem.versions[1].state).toBe('review');
      expect(reviewItem.lastReviewedAt?.slice(0, 10)).toBe(new Date().toISOString().slice(0, 10));

      // review -> published
      const publishedItem = await transitionState('test-collection', 'test-slug-b', 'published');
      expect(publishedItem.state).toBe('published');
      expect(publishedItem.versions.length).toBe(3);
      expect(publishedItem.versions[2].state).toBe('published');
      expect(publishedItem.publishedAt).toBeDefined();

      // published -> archived
      const archivedItem = await transitionState('test-collection', 'test-slug-b', 'archived');
      expect(archivedItem.state).toBe('archived');
      expect(archivedItem.versions.length).toBe(4);
      expect(archivedItem.versions[3].state).toBe('archived');

      // archived -> draft
      const restoredItem = await transitionState('test-collection', 'test-slug-b', 'draft');
      expect(restoredItem.state).toBe('draft');
      expect(restoredItem.versions.length).toBe(5);

      await deleteItem('test-collection', 'test-slug-b');
    });

    it('transitionState rejects invalid transitions', async () => {
      const item = await createItem('test-collection', 'test-slug-c', 'Invalid Test', 'content/test-collection/test-slug-c.md');

      // Cannot skip to published
      try {
        await transitionState('test-collection', 'test-slug-c', 'published');
        expect.fail('Expected InvalidTransitionError');
      } catch (e: any) {
        expect(e.name).toBe('InvalidTransitionError');
      }

      // Cannot go published directly from draft
      expect(item.state).toBe('draft');

      await deleteItem('test-collection', 'test-slug-c');
    });

    it('transitionState throws ContentNotFoundError for missing item', async () => {
      try {
        await transitionState('nonexistent', 'nonexistent', 'published');
        expect.fail('Expected ContentNotFoundError');
      } catch (e: any) {
        expect(e.name).toBe('ContentNotFoundError');
      }
    });

    it('saveItem updates existing item', async () => {
      const item = await createItem('test-collection', 'test-slug-d', 'Save Test', 'content/test-collection/test-slug-d.md');
      item.title = 'Updated Title';
      await saveItem(item);

      const fetched = await getItem('test-collection', 'test-slug-d');
      expect(fetched?.title).toBe('Updated Title');

      await deleteItem('test-collection', 'test-slug-d');
    });

    it('getStateStats returns accurate counts', async () => {
      const before = await getStateStats();

      const newItem = await createItem('test-collection', 'test-stats', 'Stats Test', 'content/test-collection/test-stats.md');

      const after = await getStateStats();
      expect(after.draft).toBe((before.draft || 0) + 1);

      await transitionState('test-collection', 'test-stats', 'review');
      const afterReview = await getStateStats();
      expect(afterReview.draft).toBe(before.draft || 0);
      expect(afterReview.review).toBe((before.review || 0) + 1);

      await deleteItem('test-collection', 'test-stats');
    });
  });
});
