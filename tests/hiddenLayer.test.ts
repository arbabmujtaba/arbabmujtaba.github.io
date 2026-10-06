/**
 * The hidden layer's pure parts and its content contract: gestures, the
 * thought filter, distances, the day/night clock, and the shape of every file
 * in content/secrets and content/timeline.
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { isCircle, isShake, type Point } from '../src/lib/gestures';
import { DECOYS, EDGES, SEVEN, judgeTrace } from '../src/lib/constellation';
import { linesFrom } from '../src/lib/thoughtLines';
import { distanceKm, PLACES } from '../src/lib/places';
import { resolveTheme } from '../src/lib/magic';
import { INK_SECTIONS, SECRET_KINDS, SECRET_ROOMS, SECRET_TRIGGERS } from '../src/types';

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

console.log('gestures');
const circle: Point[] = Array.from({ length: 40 }, (_, i) => {
  const a = (i / 39) * Math.PI * 2.05;
  return { x: 300 + 100 * Math.cos(a), y: 300 + 100 * Math.sin(a), t: i * 20 };
});
check('a drawn circle is a circle', isCircle(circle));
const line: Point[] = Array.from({ length: 30 }, (_, i) => ({ x: i * 15, y: 200, t: i * 20 }));
check('a straight stroke is not a circle', !isCircle(line));
const arc = circle.slice(0, 18);
check('half a circle is not a circle', !isCircle(arc));
const shake: Point[] = Array.from({ length: 14 }, (_, i) => ({ x: 300 + (i % 2 ? 60 : -60), y: 300 + (i % 3), t: i * 30 }));
check('a side-to-side shake is a shake', isShake(shake));
check('a straight stroke is not a shake', !isShake(line));

console.log('saptarishi pattern');
const judge = (ids: string[]) => judgeTrace(ids).state;
check('the handle into the bowl is the figure', judge(['alkaid', 'mizar', 'alioth', 'megrez', 'dubhe', 'merak', 'phecda']) === 'complete');
check('the bowl the other way round is the figure', judge(['alkaid', 'mizar', 'alioth', 'megrez', 'phecda', 'merak', 'dubhe']) === 'complete');
check('bowl first, handle last is the figure', judge(['dubhe', 'merak', 'phecda', 'megrez', 'alioth', 'mizar', 'alkaid']) === 'complete');
check('all seven in the wrong order is NOT the figure', judge(['alkaid', 'alioth', 'mizar', 'megrez', 'dubhe', 'merak', 'phecda']) === 'broken');
check('seven taps in left-to-right order is NOT the figure', judge(['alkaid', 'mizar', 'alioth', 'megrez', 'phecda', 'dubhe', 'merak']) === 'broken');
check('a decoy breaks the pattern', judge(['alkaid', 'mizar', 'decoy-1']) === 'broken');
check('starting on a decoy breaks it', judge(['decoy-2']) === 'broken');
check('jumping across the sky breaks it', judge(['alkaid', 'dubhe']) === 'broken');
check('walking a line back breaks it', judge(['alkaid', 'mizar', 'alkaid']) === 'broken');
check('a drag reporting the same star twice is fine', judge(['alkaid', 'alkaid', 'mizar']) === 'partial');
check('a half-drawn handle is partial', judge(['alkaid', 'mizar', 'alioth']) === 'partial');
check('starting mid-handle dead-ends', ['alioth', 'mizar', 'alkaid'].every((_, i, a) => judge(a.slice(0, i + 1)) === 'partial') && judge(['alioth', 'mizar', 'alkaid', 'megrez']) === 'broken');
check('nothing touched is empty', judge([]) === 'empty');
check('the figure has seven lines', EDGES.length === 7 && DECOYS.length >= 3);
check('decoys never sit on a figure star', DECOYS.every((d) => SEVEN.every((s) => Math.hypot(s.x - d.x, s.y - d.y) > 8)));

console.log('thought filter');
const body =
  'Memory is selective. It forgets conversations, but preserves contrasts. She didn\'t follow. Late nights turn into early mornings, accompanied by glowing screens and the quiet hum of a compiler. "Are you the one I saw on the train that afternoon?" he asked.';
const lines = linesFrom(body);
check('pairs a short line with the next', lines.includes('Memory is selective. It forgets conversations, but preserves contrasts.'));
check('keeps a standalone sentence', lines.some((l) => l.startsWith('Late nights turn into early mornings')));
check('drops lines about a particular person', !lines.some((l) => /she/i.test(l)));
check('drops dialogue', !lines.some((l) => /"/.test(l)));

console.log('places and the clock');
const sopore = PLACES.find((p) => p.id === 'sopore')!;
const indore = PLACES.find((p) => p.id === 'indore')!;
const km = distanceKm(sopore, indore);
check('Sopore → Indore is about 1,300 km', km > 1250 && km < 1340, String(km));
check('06:00 is day', resolveTheme('auto', new Date(2026, 0, 1, 6, 0)) === 'day');
check('17:59 is day', resolveTheme('auto', new Date(2026, 0, 1, 17, 59)) === 'day');
check('18:00 is night', resolveTheme('auto', new Date(2026, 0, 1, 18, 0)) === 'night');
check('a manual choice wins over the clock', resolveTheme('night', new Date(2026, 0, 1, 12, 0)) === 'night');

console.log('content contract');
const root = path.resolve(import.meta.dirname, '..');
const secretsDir = path.join(root, 'content/secrets');
for (const file of fs.readdirSync(secretsDir).filter((f) => f.endsWith('.md'))) {
  const { data } = matter(fs.readFileSync(path.join(secretsDir, file), 'utf8'));
  const kind = data.kind;
  let ok = (SECRET_KINDS as string[]).includes(kind) && typeof data.title === 'string' && data.title.length > 0;
  if (kind === 'room' || kind === 'note') ok &&= (SECRET_ROOMS as string[]).includes(data.room);
  if (kind === 'egg') ok &&= (SECRET_TRIGGERS as string[]).includes(data.trigger);
  if (kind === 'ink') ok &&= (INK_SECTIONS as string[]).includes(data.section);
  check(`secrets/${file} is well-formed`, ok, JSON.stringify(data));
}
const timelineDir = path.join(root, 'content/timeline');
const chapters = fs
  .readdirSync(timelineDir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => matter(fs.readFileSync(path.join(timelineDir, f), 'utf8')).data);
const years = chapters.map((c) => Number(c.year)).sort();
check('timeline covers 2019–2026, one chapter a year', years.join(',') === '2019,2020,2021,2022,2023,2024,2025,2026', years.join(','));
check('every chapter has a place', chapters.every((c) => typeof c.place === 'string' && c.place.length > 0));
check('Sopore until 2022, Indore from 2023', chapters.every((c) => (Number(c.year) <= 2022 ? c.place === 'Sopore' : c.place === 'Indore')));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
