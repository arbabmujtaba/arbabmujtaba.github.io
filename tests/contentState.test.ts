/**
 * Content State Transition Tests
 *
 * Run with: npx tsx tests/contentState.test.ts
 */

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

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (e: any) {
      failed++;
      console.log(`  ✗ ${name}: ${e.message}`);
    }
  };
}

function assertEqual(actual: any, expected: any, msg?: string) {
  if (actual !== expected) {
    throw new Error(`${msg || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value: boolean, msg?: string) {
  if (!value) throw new Error(msg || 'Expected true');
}

function assertThrows(fn: () => void, expectedName: string, msg?: string) {
  try {
    fn();
    throw new Error(`${msg || 'Expected throw'} but function did not throw`);
  } catch (e: any) {
    if (e.name !== expectedName) {
      throw new Error(`${msg || 'Wrong error type'}: expected ${expectedName}, got ${e.name}: ${e.message}`);
    }
  }
}

async function runTests() {
  console.log('\n=== ContentState Transition Tests ===\n');

  // --- isValidTransition ---

  await test('draft → review is valid', () => {
    assertTrue(isValidTransition('draft', 'review'));
  })();

  await test('review → published is valid', () => {
    assertTrue(isValidTransition('review', 'published'));
  })();

  await test('review → draft is valid', () => {
    assertTrue(isValidTransition('review', 'draft'));
  })();

  await test('published → archived is valid', () => {
    assertTrue(isValidTransition('published', 'archived'));
  })();

  await test('archived → draft is valid', () => {
    assertTrue(isValidTransition('archived', 'draft'));
  })();

  await test('draft → published is invalid', () => {
    assertTrue(!isValidTransition('draft', 'published'));
  })();

  await test('published → review is invalid', () => {
    assertTrue(!isValidTransition('published', 'review'));
  })();

  await test('archived → published is invalid', () => {
    assertTrue(!isValidTransition('archived', 'published'));
  })();

  await test('draft → archived is invalid', () => {
    assertTrue(!isValidTransition('draft', 'archived'));
  })();

  await test('published → draft is invalid', () => {
    assertTrue(!isValidTransition('published', 'draft'));
  })();

  await test('same-state transitions: draft→draft allowed for initialization', () => {
    assertTrue(isValidTransition('draft', 'draft'));
  })();

  await test('same-state transitions for non-draft states are invalid', () => {
    assertTrue(!isValidTransition('published', 'published'));
    assertTrue(!isValidTransition('review', 'review'));
    assertTrue(!isValidTransition('archived', 'archived'));
  })();

  // --- assertValidTransition ---

  await test('assertValidTransition throws InvalidTransitionError for draft→published', () => {
    assertThrows(() => assertValidTransition('draft', 'published', 'test', 'slug'), 'InvalidTransitionError');
  })();

  await test('assertValidTransition does not throw for valid transitions', () => {
    assertValidTransition('draft', 'review', 'test', 'slug');
    assertValidTransition('review', 'published', 'test', 'slug');
  })();

  // --- Registry CRUD ---

  await test('createItem initializes with draft state', async () => {
    const item = await createItem('test-collection', 'test-slug-a', 'Test Title', 'content/test-collection/test-slug-a.md');
    assertEqual(item.state, 'draft');
    assertEqual(item.title, 'Test Title');
    assertTrue(item.versions.length === 1);
    assertEqual(item.versions[0].state, 'draft');
    await deleteItem('test-collection', 'test-slug-a');
  })();

  await test('transitionState advances item through lifecycle', async () => {
    // Create fresh item
    const item = await createItem('test-collection', 'test-slug-b', 'Lifecycle Test', 'content/test-collection/test-slug-b.md');
    assertEqual(item.state, 'draft');

    // draft → review
    const reviewItem = await transitionState('test-collection', 'test-slug-b', 'review', { notes: 'Ready for review' });
    assertEqual(reviewItem.state, 'review');
    assertEqual(reviewItem.versions.length, 2);
    assertEqual(reviewItem.versions[1].state, 'review');
    assertEqual(reviewItem.lastReviewedAt?.slice(0, 10), new Date().toISOString().slice(0, 10));

    // review → published
    const publishedItem = await transitionState('test-collection', 'test-slug-b', 'published');
    assertEqual(publishedItem.state, 'published');
    assertEqual(publishedItem.versions.length, 3);
    assertEqual(publishedItem.versions[2].state, 'published');
    assertTrue(publishedItem.publishedAt !== undefined);

    // published → archived
    const archivedItem = await transitionState('test-collection', 'test-slug-b', 'archived');
    assertEqual(archivedItem.state, 'archived');
    assertEqual(archivedItem.versions.length, 4);
    assertEqual(archivedItem.versions[3].state, 'archived');

    // archived → draft
    const restoredItem = await transitionState('test-collection', 'test-slug-b', 'draft');
    assertEqual(restoredItem.state, 'draft');
    assertEqual(restoredItem.versions.length, 5);

    await deleteItem('test-collection', 'test-slug-b');
  })();

  await test('transitionState rejects invalid transitions', async () => {
    const item = await createItem('test-collection', 'test-slug-c', 'Invalid Test', 'content/test-collection/test-slug-c.md');

    // Cannot skip to published
    try {
      await transitionState('test-collection', 'test-slug-c', 'published');
      throw new Error('Expected InvalidTransitionError');
    } catch (e: any) {
      assertEqual(e.name, 'InvalidTransitionError');
    }

    // Cannot go published directly from draft
    assertEqual(item.state, 'draft');

    await deleteItem('test-collection', 'test-slug-c');
  })();

  await test('transitionState throws ContentNotFoundError for missing item', async () => {
    try {
      await transitionState('nonexistent', 'nonexistent', 'published');
      throw new Error('Expected ContentNotFoundError');
    } catch (e: any) {
      assertEqual(e.name, 'ContentNotFoundError');
    }
  })();

  await test('saveItem updates existing item', async () => {
    const item = await createItem('test-collection', 'test-slug-d', 'Save Test', 'content/test-collection/test-slug-d.md');
    item.title = 'Updated Title';
    await saveItem(item);

    const fetched = await getItem('test-collection', 'test-slug-d');
    assertEqual(fetched?.title, 'Updated Title');

    await deleteItem('test-collection', 'test-slug-d');
  })();

  await test('getStateStats returns accurate counts', async () => {
    const before = await getStateStats();

    const newItem = await createItem('test-collection', 'test-stats', 'Stats Test', 'content/test-collection/test-stats.md');

    const after = await getStateStats();
    assertEqual(after.draft, (before.draft || 0) + 1);

    await transitionState('test-collection', 'test-stats', 'review');
    const afterReview = await getStateStats();
    assertEqual(afterReview.draft, before.draft || 0);
    assertEqual(afterReview.review, (before.review || 0) + 1);

    await deleteItem('test-collection', 'test-stats');
  })();

  // --- Summary ---
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
