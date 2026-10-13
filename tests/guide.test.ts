/**
 * The Editorial Hub's help copy: every workspace and editor tab has tips, the
 * guide covers every workspace, and search finds features by their words.
 */
import { GUIDE, NAV_TIPS, TAB_TIPS, TIPS, searchGuide } from '../src/components/admin/guideContent';

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

const views = Object.keys(NAV_TIPS) as (keyof typeof NAV_TIPS)[];
const tabs = Object.keys(TAB_TIPS) as (keyof typeof TAB_TIPS)[];

console.log('coverage');
check('six workspaces have a hover card', views.length === 6, views.join(','));
for (const view of views) {
  check(`${view} has tips`, (TIPS[view] ?? []).length > 0);
  check(`${view} has a guide section`, GUIDE.some((s) => s.view === view));
}
for (const tab of tabs) check(`editor.${tab} has tips`, (TIPS[`editor.${tab}`] ?? []).length > 0);
check('no empty feature text', GUIDE.every((s) => s.features.every((f) => f.title.trim() && f.body.trim())));
check('section ids are unique', new Set(GUIDE.map((s) => s.id)).size === GUIDE.length);

console.log('search');
check('empty query returns everything', searchGuide('').length === GUIDE.length);
const priority = searchGuide('priority');
check('"priority" finds the editor feature', priority.some((s) => s.features.some((f) => f.title === 'Priority')));
const hero = searchGuide('HERO photo');
check('case-insensitive, all words', hero.some((s) => s.features.some((f) => f.title === 'Hero photo')));
check('a section title match keeps all its features', searchGuide('Deployments')[0]?.features.length === GUIDE.find((s) => s.id === 'deploy')!.features.length);
check('nonsense finds nothing', searchGuide('zzqx').length === 0);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
