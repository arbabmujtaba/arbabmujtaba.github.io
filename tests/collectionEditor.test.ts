/**
 * Collection Editor Logic Tests
 *
 * Tests the core logic for CollectionSectionEditor:
 * - Filter value application on create
 * - Reorder logic (swap order values between adjacent items)
 * - Delete behavior (removes item from list)
 */

import { describe, it, expect } from 'vitest';

// ============================================================
// Helper types matching the component's internal data model
// ============================================================

interface CollectionItem {
  slug: string;
  data: Record<string, any>;
  body: string;
  filePath?: string;
}

// ============================================================
// Pure logic functions (extracted from component for testability)
// ============================================================

/**
 * Builds default frontmatter for a new item in a section,
 * applying filter values and standard defaults.
 */
function buildNewItemDefaults(
  filter: Record<string, string | string[]> | undefined,
  fields: { name: string; type: string; required: boolean }[]
): Record<string, any> {
  const defaults: Record<string, any> = {};

  // Apply filter values as defaults
  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      // For array filters, use the first value as default
      defaults[key] = Array.isArray(value) ? value[0] : value;
    }
  }

  // Set date to today if field exists
  const hasDateField = fields.some((f) => f.name === 'date');
  if (hasDateField) {
    defaults.date = new Date().toISOString().split('T')[0];
  }

  // Set order to 0 if field exists (will be adjusted by caller)
  const hasOrderField = fields.some((f) => f.name === 'order');
  if (hasOrderField) {
    defaults.order = 0;
  }

  // Set visible to true if field exists
  const hasVisibleField = fields.some((f) => f.name === 'visible');
  if (hasVisibleField) {
    defaults.visible = true;
  }

  return defaults;
}

/**
 * Generates a slug from a title string.
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Computes new order values after swapping two adjacent items.
 * Returns the updated items (only the two that changed).
 */
function swapOrder(
  items: CollectionItem[],
  index: number,
  direction: 'up' | 'down'
): { itemA: CollectionItem; itemB: CollectionItem } | null {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= items.length) {
    return null;
  }

  const itemA = items[index];
  const itemB = items[targetIndex];

  const orderA = itemA.data.order ?? index;
  const orderB = itemB.data.order ?? targetIndex;

  // Swap order values
  return {
    itemA: { ...itemA, data: { ...itemA.data, order: orderB } },
    itemB: { ...itemB, data: { ...itemB.data, order: orderA } },
  };
}

/**
 * Removes an item from the list by slug.
 */
function removeItem(items: CollectionItem[], slug: string): CollectionItem[] {
  return items.filter((item) => item.slug !== slug);
}

// ============================================================
// TESTS
// ============================================================

describe('CollectionEditor Logic', () => {
  describe('buildNewItemDefaults', () => {
    it('applies simple string filter values as defaults', () => {
      const filter = { configType: 'gateway' };
      const fields = [
        { name: 'title', type: 'text', required: true },
        { name: 'configType', type: 'text', required: true },
        { name: 'order', type: 'number', required: true },
        { name: 'visible', type: 'boolean', required: true },
      ];

      const result = buildNewItemDefaults(filter, fields);

      expect(result.configType).toBe('gateway');
      expect(result.order).toBe(0);
      expect(result.visible).toBe(true);
    });

    it('applies category filter for tech-experiments', () => {
      const filter = { category: 'Experiments' };
      const fields = [
        { name: 'title', type: 'text', required: true },
        { name: 'category', type: 'select', required: true },
        { name: 'date', type: 'date', required: true },
      ];

      const result = buildNewItemDefaults(filter, fields);

      expect(result.category).toBe('Experiments');
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('handles array filter values by using first element', () => {
      const filter = { category: ['Favorite Technologies', 'Favorite Software', 'Favorite Linux Tools'] };
      const fields = [
        { name: 'title', type: 'text', required: true },
        { name: 'category', type: 'select', required: true },
        { name: 'order', type: 'number', required: true },
        { name: 'visible', type: 'boolean', required: true },
      ];

      const result = buildNewItemDefaults(filter, fields);

      expect(result.category).toBe('Favorite Technologies');
      expect(result.order).toBe(0);
      expect(result.visible).toBe(true);
    });

    it('returns empty object when no filter and no special fields', () => {
      const fields = [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'markdown', required: false },
      ];

      const result = buildNewItemDefaults(undefined, fields);

      expect(result).toEqual({});
    });

    it('sets date to today when date field exists', () => {
      const fields = [
        { name: 'title', type: 'text', required: true },
        { name: 'date', type: 'date', required: true },
      ];

      const result = buildNewItemDefaults(undefined, fields);
      const today = new Date().toISOString().split('T')[0];

      expect(result.date).toBe(today);
    });
  });

  describe('generateSlug', () => {
    it('converts title to lowercase kebab-case', () => {
      expect(generateSlug('My New Post')).toBe('my-new-post');
    });

    it('removes special characters', () => {
      expect(generateSlug("Hello, World! It's 2024")).toBe('hello-world-it-s-2024');
    });

    it('trims leading/trailing hyphens', () => {
      expect(generateSlug('  --Hello World--  ')).toBe('hello-world');
    });

    it('handles empty string', () => {
      expect(generateSlug('')).toBe('');
    });
  });

  describe('swapOrder', () => {
    const items: CollectionItem[] = [
      { slug: 'item-a', data: { title: 'A', order: 1 }, body: '' },
      { slug: 'item-b', data: { title: 'B', order: 2 }, body: '' },
      { slug: 'item-c', data: { title: 'C', order: 3 }, body: '' },
    ];

    it('swaps order values when moving item down', () => {
      const result = swapOrder(items, 0, 'down');

      expect(result).not.toBeNull();
      expect(result!.itemA.data.order).toBe(2); // was 1, now has B's order
      expect(result!.itemB.data.order).toBe(1); // was 2, now has A's order
    });

    it('swaps order values when moving item up', () => {
      const result = swapOrder(items, 2, 'up');

      expect(result).not.toBeNull();
      expect(result!.itemA.data.order).toBe(2); // was 3, now has B's order
      expect(result!.itemB.data.order).toBe(3); // was 2, now has C's order
    });

    it('returns null when moving first item up', () => {
      const result = swapOrder(items, 0, 'up');
      expect(result).toBeNull();
    });

    it('returns null when moving last item down', () => {
      const result = swapOrder(items, 2, 'down');
      expect(result).toBeNull();
    });

    it('handles items without explicit order field (uses index)', () => {
      const noOrderItems: CollectionItem[] = [
        { slug: 'x', data: { title: 'X' }, body: '' },
        { slug: 'y', data: { title: 'Y' }, body: '' },
      ];

      const result = swapOrder(noOrderItems, 0, 'down');

      expect(result).not.toBeNull();
      expect(result!.itemA.data.order).toBe(1); // takes index of B
      expect(result!.itemB.data.order).toBe(0); // takes index of A
    });
  });

  describe('removeItem', () => {
    const items: CollectionItem[] = [
      { slug: 'first', data: { title: 'First' }, body: '' },
      { slug: 'second', data: { title: 'Second' }, body: '' },
      { slug: 'third', data: { title: 'Third' }, body: '' },
    ];

    it('removes item by slug', () => {
      const result = removeItem(items, 'second');

      expect(result).toHaveLength(2);
      expect(result.find((i) => i.slug === 'second')).toBeUndefined();
      expect(result[0].slug).toBe('first');
      expect(result[1].slug).toBe('third');
    });

    it('returns unchanged list if slug not found', () => {
      const result = removeItem(items, 'nonexistent');
      expect(result).toHaveLength(3);
    });

    it('handles empty list', () => {
      const result = removeItem([], 'any');
      expect(result).toHaveLength(0);
    });

    it('removes the only item in a single-item list', () => {
      const single: CollectionItem[] = [
        { slug: 'only', data: { title: 'Only' }, body: '' },
      ];
      const result = removeItem(single, 'only');
      expect(result).toHaveLength(0);
    });
  });
});
