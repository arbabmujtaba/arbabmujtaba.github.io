/**
 * Editorial priority: 0 is featured, 1, 2… follow, unset keeps the natural
 * order behind them — and the admin writes exactly what the site reads.
 */
import { comparePriority, isFeatured, parsePriority, sortByPriority } from '../src/lib/priority';
import { formFromDoc, serializeForm } from '../src/components/admin/model';

let passed = 0;
let failed = 0;
function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${name} ${detail}`);
  }
}

console.log('parsePriority');
check('0 is a priority', parsePriority(0) === 0);
check('whole numbers pass', parsePriority(3) === 3);
check('numeric strings pass', parsePriority('2') === 2);
check('blank is none', parsePriority('') === undefined && parsePriority(undefined) === undefined && parsePriority(null) === undefined);
check('negatives and fractions are none', parsePriority(-1) === undefined && parsePriority(1.5) === undefined);
check('junk is none', parsePriority('soon') === undefined && parsePriority(true) === undefined);

console.log('sortByPriority');
// Already newest-first, as the CMS hands them over.
const list = [
  { id: 'newest' },
  { id: 'p2', priority: 2 },
  { id: 'newer-featured', priority: 0 },
  { id: 'p1', priority: 1 },
  { id: 'middle' },
  { id: 'older-featured', priority: 0 },
  { id: 'oldest' },
];
const sorted = sortByPriority(list).map((e) => e.id).join(',');
check(
  'featured, then 1, 2, then the rest in their original order',
  sorted === 'newer-featured,older-featured,p1,p2,newest,middle,oldest',
  sorted
);
check('does not mutate the input', list[0].id === 'newest');
check('ties compare equal', comparePriority({}, {}) === 0 && comparePriority({ priority: 1 }, { priority: 1 }) === 0);
check('isFeatured is priority 0 only', isFeatured({ priority: 0 }) && !isFeatured({ priority: 1 }) && !isFeatured({}));

console.log('admin round trip');
for (const collection of ['journal', 'tech', 'photography', 'portfolio'] as const) {
  const kept = serializeForm(formFromDoc(collection, 'x', { title: 'T', priority: 0 }, ''));
  check(`${collection} keeps priority 0`, kept.data.priority === 0, JSON.stringify(kept.data));
  const none = serializeForm(formFromDoc(collection, 'x', { title: 'T' }, ''));
  check(`${collection} writes no priority when unset`, !('priority' in none.data));
}
const form = formFromDoc('journal', 'x', { title: 'T' }, '');
check('form starts with no priority', form.priority === '');
check('a picked priority is written as a number', serializeForm({ ...form, priority: '3' }).data.priority === 3);
check('config collections never get one', !('priority' in serializeForm(formFromDoc('gear', 'x', { title: 'G', priority: 1 }, '')).data));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
