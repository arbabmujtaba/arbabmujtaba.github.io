/**
 * Routing Tests
 *
 * Covers the pure half of the router: how a pathname becomes a route, and when
 * an in-site anchor click is handled by the router rather than the browser.
 * These are the decisions that make a deep link work, so they are worth pinning
 * down — a regression here means shared URLs silently resolve to the wrong view.
 *
 * Also asserts the shape of the Node-side route manifest used by the post-build
 * shells and the sitemap.
 *
 * Run with: npx tsx tests/routing.test.ts
 */

import {
  parseRoute,
  shouldInterceptClick,
  VIEW_TO_PATH,
} from '../src/lib/navigation';
import {
  DETAIL_COLLECTIONS,
  detailPath,
  isDetailCollection,
} from '../src/lib/collections';
import { collectRoutes, LIST_ROUTES } from '../scripts/routes';

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

/** A plain primary click, as delivered by React's synthetic event. */
function click(overrides: Partial<Parameters<typeof shouldInterceptClick>[0]> = {}) {
  return {
    defaultPrevented: false,
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...overrides,
  };
}

async function runTests() {
  console.log('\n=== Routing Tests ===\n');

  const tests = [
    // ---------------------------------------------------------------- list routes
    test('root path resolves to home', () => {
      const route = parseRoute('/');
      assertEqual(route.kind, 'list');
      assertEqual(route.view, 'home');
    }),

    test('every top-level view round-trips through its path', () => {
      for (const [view, path] of Object.entries(VIEW_TO_PATH)) {
        const route = parseRoute(path);
        assertEqual(route.kind, 'list', `${path} should be a list route`);
        assertEqual(route.view, view, `${path} should resolve to ${view}`);
      }
    }),

    test('a trailing slash does not change the route', () => {
      const route = parseRoute('/portfolio/');
      assertEqual(route.kind, 'list');
      assertEqual(route.view, 'portfolio');
    }),

    // -------------------------------------------------------------- entry routes
    test('a detail path resolves to its collection and slug', () => {
      const route = parseRoute('/journal/growing-up');
      assertEqual(route.kind, 'entry');
      if (route.kind !== 'entry') return;
      assertEqual(route.collection, 'journal');
      assertEqual(route.slug, 'growing-up');
      // The nav highlight follows the collection, not a separate "entry" view.
      assertEqual(route.view, 'journal');
    }),

    test('every detail collection accepts a slug', () => {
      for (const collection of DETAIL_COLLECTIONS) {
        const route = parseRoute(detailPath(collection, 'some-slug'));
        assertEqual(route.kind, 'entry', `${collection} should accept a slug`);
      }
    }),

    test('a percent-encoded slug is decoded', () => {
      const route = parseRoute('/journal/growing%2Dup');
      assertEqual(route.kind, 'entry');
      if (route.kind !== 'entry') return;
      assertEqual(route.slug, 'growing-up');
    }),

    test('a detail path with a trailing slash still resolves', () => {
      const route = parseRoute('/tech/some-log/');
      assertEqual(route.kind, 'entry');
    }),

    // ------------------------------------------------------------------ not found
    test('an unknown top-level path is not silently treated as home', () => {
      assertEqual(parseRoute('/nope').kind, 'notFound');
    }),

    test('a non-detail collection is not a detail route', () => {
      // gear/timeline/favorites are presentational fragments, not documents.
      assertEqual(parseRoute('/gear/sony-a7iii').kind, 'notFound');
      assertEqual(parseRoute('/timeline/2019').kind, 'notFound');
    }),

    test('traversal and uppercase slugs are rejected', () => {
      assertEqual(parseRoute('/journal/..%2F..%2FREADME').kind, 'notFound');
      assertEqual(parseRoute('/journal/Growing-Up').kind, 'notFound');
      assertEqual(parseRoute('/journal/-leading-dash').kind, 'notFound');
      assertEqual(parseRoute('/journal/with spaces').kind, 'notFound');
    }),

    test('a path deeper than a collection and a slug is rejected', () => {
      assertEqual(parseRoute('/journal/a/b').kind, 'notFound');
    }),

    // ------------------------------------------------------------- click handling
    test('a plain primary click is handled by the router', () => {
      assertTrue(shouldInterceptClick(click()));
    }),

    test('modified and non-primary clicks are left to the browser', () => {
      assertTrue(!shouldInterceptClick(click({ metaKey: true })), 'cmd-click');
      assertTrue(!shouldInterceptClick(click({ ctrlKey: true })), 'ctrl-click');
      assertTrue(!shouldInterceptClick(click({ shiftKey: true })), 'shift-click');
      assertTrue(!shouldInterceptClick(click({ altKey: true })), 'alt-click');
      assertTrue(!shouldInterceptClick(click({ button: 1 })), 'middle-click');
      assertTrue(!shouldInterceptClick(click({ defaultPrevented: true })), 'already handled');
    }),

    test('isDetailCollection accepts only the five document collections', () => {
      for (const collection of DETAIL_COLLECTIONS) {
        assertTrue(isDetailCollection(collection), `${collection} should be a detail collection`);
      }
      assertTrue(!isDetailCollection('gear'), 'gear is not a detail collection');
      assertTrue(!isDetailCollection('home'), 'home is not a detail collection');
      assertTrue(!isDetailCollection(''), 'empty string is not a collection');
    }),

    // ----------------------------------------------------------- route manifest
    test('the manifest covers every top-level page', async () => {
      const records = await collectRoutes();
      for (const route of LIST_ROUTES) {
        assertTrue(
          records.some((record) => record.route === route),
          `manifest should include ${route}`
        );
      }
    }),

    test('every manifest route is parseable by the router', async () => {
      const records = await collectRoutes();
      for (const record of records) {
        const route = parseRoute(record.route);
        assertTrue(
          route.kind !== 'notFound',
          `${record.route} is in the manifest but the router rejects it`
        );
      }
    }),

    test('manifest routes are unique and carry copy', async () => {
      const records = await collectRoutes();
      const seen = new Set<string>();
      for (const record of records) {
        assertTrue(!seen.has(record.route), `duplicate route ${record.route}`);
        seen.add(record.route);
        assertTrue(record.title.length > 0, `${record.route} has no title`);
        assertTrue(record.description.length > 0, `${record.route} has no description`);
      }
    }),

    test('admin is excluded from the public manifest', async () => {
      const records = await collectRoutes();
      assertTrue(
        !records.some((record) => record.route.startsWith('/admin')),
        'admin must not be listed for crawlers'
      );
    }),
  ];

  for (const t of tests) await t();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

runTests();
