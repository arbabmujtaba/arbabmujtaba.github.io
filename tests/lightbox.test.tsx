/**
 * Lightbox Tests
 *
 * The full-frame overlay exists for one reason: the derivatives stop at 1536px,
 * so the one surface that must bypass them is the one showing the frame at full
 * size. These render the component and assert it points at the original file —
 * the mistake that would be invisible on a laptop and obvious on a large display.
 *
 * Run with: npx tsx tests/lightbox.test.tsx
 */

import { renderToStaticMarkup } from 'react-dom/server';
import Lightbox, { type LightboxFrame } from '../src/components/Lightbox';
import { getLocalWebpSources } from '../src/lib/image';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  return () => {
    try {
      fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (e: any) {
      failed++;
      console.log(`  ✗ ${name}: ${e.message}`);
    }
  };
}

function assertTrue(value: boolean, msg?: string) {
  if (!value) throw new Error(msg || 'Expected true');
}

const frames: LightboxFrame[] = [
  {
    src: '/uploads/photography/1789991526702-360529747.webp',
    alt: 'Narrative',
    title: 'Narrative',
    index: 'plate 01',
    caption: 'pic-abby',
    meta: 'Samsung S23',
    href: '/photography/narrative',
  },
  {
    src: '/uploads/photography/second-frame.webp',
    alt: 'Second',
    title: 'Second',
  },
];

function render(openIndex: number | null) {
  return renderToStaticMarkup(
    <Lightbox frames={frames} openIndex={openIndex} onClose={() => {}} onNavigate={() => {}} />
  );
}

function runTests() {
  console.log('\n=== Lightbox Tests ===\n');

  const tests = [
    test('closed renders nothing', () => {
      assertTrue(render(null) === '', 'a closed lightbox must not be in the document');
    }),

    test('open renders the original file, not a derivative', () => {
      const html = render(0);
      assertTrue(
        html.includes(`src="${frames[0].src}"`),
        'the original path must be the img src'
      );

      // Whatever getLocalWebpSources would have asked for must be absent.
      const derivatives = getLocalWebpSources(frames[0].src);
      assertTrue(Boolean(derivatives), 'fixture should have derivative URLs to compare against');
      for (const entry of derivatives!.srcSet.split(',')) {
        const url = entry.trim().split(' ')[0];
        assertTrue(!html.includes(url), `the lightbox must not fall back to ${url}`);
      }
      assertTrue(!html.includes('<source'), 'no <source> — the full frame is the original');
    }),

    test('the frame is contained, never cropped', () => {
      assertTrue(render(0).includes('object-contain'), 'the image must be object-contain');
    }),

    test('the caption carries the plate, the story link and the metadata', () => {
      const html = render(0);
      assertTrue(html.includes('plate 01'), 'plate number missing');
      assertTrue(html.includes('href="/photography/narrative"'), 'entry link missing');
      assertTrue(html.includes('Samsung S23'), 'capture metadata missing');
      assertTrue(html.includes('pic-abby'), 'caption missing');
    }),

    test('a set of more than one frame offers stepping and a position', () => {
      const html = render(0);
      assertTrue(html.includes('Next frame'), 'next control missing');
      assertTrue(html.includes('Previous frame'), 'previous control missing');
      assertTrue(html.includes('1 / 2'), 'position indicator missing');
    }),

    test('a single frame offers no stepping', () => {
      const html = renderToStaticMarkup(
        <Lightbox
          frames={[frames[0]]}
          openIndex={0}
          onClose={() => {}}
          onNavigate={() => {}}
        />
      );
      assertTrue(!html.includes('Next frame'), 'a lone frame must not offer next');
    }),

    test('it is a labelled modal dialog', () => {
      const html = render(0);
      assertTrue(html.includes('role="dialog"'), 'missing dialog role');
      assertTrue(html.includes('aria-modal="true"'), 'missing aria-modal');
      assertTrue(html.includes('Close full frame'), 'missing labelled close control');
    }),

    test('an out-of-range index renders nothing rather than throwing', () => {
      assertTrue(render(99) === '', 'an index past the set must render nothing');
    }),
  ];

  for (const t of tests) t();

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests();
