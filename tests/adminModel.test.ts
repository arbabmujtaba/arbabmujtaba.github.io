/**
 * The admin's form ⇄ front-matter mapping for the new content: every secret
 * kind, a timeline chapter's place, and a home `thought`. What the editor
 * writes must be exactly what src/lib/secrets.ts and src/lib/cms.ts read.
 */
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

const roundTrip = (collection: Parameters<typeof formFromDoc>[0], data: Record<string, unknown>, body = '') =>
  serializeForm(formFromDoc(collection, String(data.slug || 'x'), data, body));

console.log('secrets');
const egg = roundTrip('secrets', { title: 'Sealed', kind: 'egg', trigger: 'constellation', description: 'd', order: 2, visible: false }, 'Body.');
check('egg keeps kind + trigger', egg.data.kind === 'egg' && egg.data.trigger === 'constellation', JSON.stringify(egg.data));
check('egg keeps visible:false', egg.data.visible === false);
check('egg does not carry a room or section', egg.data.room === undefined && egg.data.section === undefined);
check('egg keeps its body', egg.body === 'Body.');
check('egg is not written as a blog category', egg.data.category === undefined, String(egg.data.category));

const ink = roundTrip('secrets', { title: 'a line', kind: 'ink', section: 'timeline', description: 'small', order: 5, visible: true });
check('ink keeps section', ink.data.kind === 'ink' && ink.data.section === 'timeline', JSON.stringify(ink.data));
const note = roundTrip('secrets', { title: 'n', kind: 'note', room: 'darkroom', description: 'sig', visible: true }, 'Text');
check('note keeps room', note.data.kind === 'note' && note.data.room === 'darkroom');
const room = roundTrip('secrets', { title: 'R', kind: 'room', room: 'details', description: 'intro', visible: false });
check('room keeps room + visibility', room.data.room === 'details' && room.data.visible === false);
check('description survives', room.data.description === 'intro');

console.log('timeline + home');
const chapter = roundTrip('timeline', { title: 'A New Chapter', year: '2023', place: 'Indore', description: 'd', order: 5, visible: true }, 'b');
check('chapter keeps place and year', chapter.data.place === 'Indore' && String(chapter.data.year) === '2023', JSON.stringify(chapter.data));
const thought = roundTrip('home', { title: 'A line', configType: 'thought', description: 'source', order: 1, visible: true });
check('home thought keeps configType', thought.data.configType === 'thought', JSON.stringify(thought.data));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
