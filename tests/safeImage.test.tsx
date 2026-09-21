/**
 * SafeImage Tests
 *
 * SafeImage is the only place the site turns a content path into markup, and it
 * has to survive the one state the pipeline cannot avoid: an original on disk
 * whose derivatives have not been written yet. These pin the markup it starts
 * from — the `<img>` must always name the original, because that is what the
 * component retries with when the `<source>` fails.
 *
 * Run with: npx tsx tests/safeImage.test.tsx
 */

import { renderToStaticMarkup } from 'react-dom/server';
import SafeImage from '../src/components/SafeImage';
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

function runTests() {
  console.log('\n=== SafeImage Tests ===\n');

  const upload = '/uploads/photography/frame-01.webp';

  const tests = [
    test('an archive image offers the derivatives and keeps the original as the img', () => {
      const html = renderToStaticMarkup(<SafeImage src={upload} alt="Frame" />);
      const sources = getLocalWebpSources(upload);
      assertTrue(Boolean(sources), 'fixture should map to derivatives');
      assertTrue(html.includes('type="image/webp"'), 'missing the webp <source>');
      assertTrue(html.includes(sources!.srcSet), 'the derivative srcset must be offered');
      // The retry path depends on this: the img names the file that exists even
      // when no derivative does yet.
      assertTrue(html.includes(`src="${upload}"`), 'the img must name the original');
    }),

    test('an external URL gets no derivative sources', () => {
      const html = renderToStaticMarkup(
        <SafeImage src="https://example.com/photo.jpg" alt="Remote" />
      );
      assertTrue(!html.includes('<source'), 'nothing outside the archive has derivatives');
      assertTrue(html.includes('src="https://example.com/photo.jpg"'), 'src passed through');
    }),

    test('an empty src renders the fallback instead of a broken image', () => {
      const html = renderToStaticMarkup(
        <SafeImage src="" alt="Nothing" fallback={<div data-testid="fallback" />} />
      );
      assertTrue(!html.includes('<img'), 'no img element for an empty src');
      assertTrue(html.includes('data-testid="fallback"'), 'the fallback must render');
    }),

    test('without a fallback an empty src still holds its layout box', () => {
      const html = renderToStaticMarkup(<SafeImage src={undefined} alt="Nothing" className="h-10" />);
      assertTrue(html.includes('class="h-10"'), 'the styling hook must survive');
      assertTrue(html.includes('aria-hidden="true"'), 'the placeholder must be hidden from AT');
    }),
  ];

  for (const t of tests) t();

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests();
