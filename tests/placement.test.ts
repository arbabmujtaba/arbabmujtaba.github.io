/**
 * "Where it lands": the admin's prediction of an entry's slots must follow the
 * same rules as the site (lib/cms.ts + the Home sections).
 */
import { placementFor, type PlacementEntry } from '../src/lib/placement';

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

const photo = (slug: string, date: string, category = 'Travel', priority?: number): PlacementEntry => ({
  collection: 'photography', slug, date, category, priority, visible: true,
});
const journal = (slug: string, date: string, priority?: number): PlacementEntry => ({
  collection: 'journal', slug, date, priority, visible: true,
});

const archive: PlacementEntry[] = [
  journal('vol-new', '2026-09-01'),
  journal('vol-old', '2025-01-01'),
  photo('fav-a', '2026-08-01', 'Favorites'),
  photo('travel-a', '2026-07-01'),
  photo('travel-b', '2026-06-01'),
  { collection: 'tech', slug: 'log', date: '2026-05-01', category: 'Linux', visible: true },
];
const where = (p: ReturnType<typeof placementFor>, page: string, part: string) =>
  p.spots.find((s) => s.page === page && s.where.includes(part));

console.log('a new photo with no priority');
const plain = placementFor(photo('new', '2026-01-01'), archive);
check('ranked by date among photos', plain.rank === 4 && plain.total === 4, `${plain.rank}/${plain.total}`);
check('filed under its category on Photography', where(plain, 'Photography', 'Travel')?.detail === '#3 of 3', JSON.stringify(plain.spots));
check('not the Home desk lead', !where(plain, 'Home', 'desk'));
check('says why it is not on the desk', plain.misses.some((m) => m.includes('Home desk')));
check('in the Home shuffle (few Favorites)', where(plain, 'Home', 'frames')?.detail.includes('shuffle') === true);

console.log('the same photo at priority 0');
const featured = placementFor(photo('new', '2026-01-01', 'Travel', 0), archive);
check('first in its collection', featured.rank === 1);
check('lead plate on Photography', where(featured, 'Photography', 'Lead plate')?.prominent === true);
check('lead of the Home desk', where(featured, 'Home', 'desk')?.prominent === true);
check('the large first Home tile, pinned', /large first tile.*stays put/.test(where(featured, 'Home', 'frames')?.detail ?? ''));

console.log('priority 2 behind a priority 1');
const withOne = [...archive.filter((e) => e.slug !== 'travel-a'), photo('travel-a', '2026-07-01', 'Travel', 1)];
const second = placementFor(photo('new', '2026-01-01', 'Travel', 2), withOne);
check('second in the collection', second.rank === 2, String(second.rank));
check('tile 2 on Home, rotates', /tile 2 of 7.*rotates/.test(where(second, 'Home', 'frames')?.detail ?? ''));
check('priority 1 photo is the desk lead, not this one', !where(second, 'Home', 'desk'));

console.log('journal');
const vol = placementFor(journal('draft', '2024-01-01'), archive);
check('oldest volume sits in the archive grid', where(vol, 'Journal', 'Archive grid')?.detail === '#2 of 2', JSON.stringify(vol.spots));
check('still listed on the desk beside the lead', where(vol, 'Home', 'desk')?.detail.startsWith('#2') === true, JSON.stringify(vol.spots));
const hero = placementFor(journal('draft', '2024-01-01', 0), archive);
check('priority 0 is the Journal hero', where(hero, 'Journal', 'Top')?.prominent === true);

console.log('editing an existing entry');
const edit = placementFor(photo('fav-a', '2026-08-01', 'Favorites'), archive, 'fav-a');
check('it is not counted twice', edit.total === 3, String(edit.total));
const hidden = placementFor({ ...journal('vol-new', '2026-09-01'), visible: false }, archive);
check('switched off shows nowhere', hidden.hidden && hidden.spots.length === 0);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
