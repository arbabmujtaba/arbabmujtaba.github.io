import matter from 'gray-matter';
import { parseMarkdown } from '../src/lib/frontmatter';
import { emptyForm, serializeForm, formFromDoc } from '../src/components/admin/model';
import type { PostCustomization } from '../src/types';

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

console.log('customization survives the admin → front-matter → site round trip');

const customization: PostCustomization = {
  animation: { preset: 'cinematic', speed: 'slow', trigger: 'scroll', hoverEffects: true },
  style: {
    borderRadius: 12,
    shadow: 'dramatic',
    accentColor: '#e2612f',
    backgroundColor: '#f4f2ed',
    surface: 'bone',
    gradient: { enabled: true, from: '#112233', to: '#aa5500', angle: 135, intensity: 30 },
  },
  layout: { contentWidth: 'wide', textAlign: 'justify', gapPx: 64, blockAlign: 'center' },
  effects: {
    grain: true,
    grainAmount: 65,
    vignette: true,
    colorFilter: 'vintage',
    brightness: 104,
    contrast: 96,
    saturation: 110,
    blur: 0.5,
  },
  typography: {
    fontSizePx: 19,
    titleSizePx: 72,
    fontFamily: 'lora',
    headingFontFamily: 'playfair-display',
    lineHeight: 1.7,
    letterSpacing: -0.02,
    fontWeight: 400,
  },
  image: { aspect: '21/9', fit: 'cover', focalX: 32.5, focalY: 71, zoom: 1.4, align: 'right', width: 'large' },
  music: { songTitle: 'Nocturne', songArtist: 'Chopin', songUrl: 'https://open.spotify.com/track/abc' },
};

const form = emptyForm('journal');
form.title = 'A test entry';
form.excerpt = 'Short.';
form.cover = '/uploads/journal/x.webp';
form.video = '/uploads/journal/x.mp4';
form.customization = customization;

const { data, body } = serializeForm(form);
const text = matter.stringify('Body text', data);
const parsed = parseMarkdown(text);

check('title round trips', parsed.data.title === 'A test entry');
check('video is written (it used to be dropped by Publish)', parsed.data.video === '/uploads/journal/x.mp4');
check('animation preset', parsed.data.customization?.animation?.preset === 'cinematic');
check('animation trigger + hover flag', parsed.data.customization?.animation?.trigger === 'scroll' && parsed.data.customization?.animation?.hoverEffects === true);
check('accent colour keeps its #', parsed.data.customization?.style?.accentColor === '#e2612f');
check('gradient object', parsed.data.customization?.style?.gradient?.angle === 135 && parsed.data.customization?.style?.gradient?.enabled === true);
check('fractional numbers', parsed.data.customization?.typography?.letterSpacing === -0.02 && parsed.data.customization?.typography?.lineHeight === 1.7);
check('exact px sizes', parsed.data.customization?.typography?.fontSizePx === 19 && parsed.data.customization?.typography?.titleSizePx === 72);
check('font ids', parsed.data.customization?.typography?.fontFamily === 'lora' && parsed.data.customization?.typography?.headingFontFamily === 'playfair-display');
check('colour filter + grain', parsed.data.customization?.effects?.colorFilter === 'vintage' && parsed.data.customization?.effects?.grain === true);
check('focal point decimals', parsed.data.customization?.image?.focalX === 32.5 && parsed.data.customization?.image?.zoom === 1.4);
check('aspect with a slash stays a string', parsed.data.customization?.image?.aspect === '21/9');
check('music url', parsed.data.customization?.music?.songUrl === 'https://open.spotify.com/track/abc');
check('body is untouched', parsed.content.trim() === 'Body text' && body === '');

console.log('pruning');
const bare = emptyForm('journal');
bare.title = 'Bare';
bare.customization = { style: { gradient: { enabled: false, from: '#000' } }, effects: {}, typography: { fontFamily: '' } };
const bareOut = serializeForm(bare);
check('empty groups are not written', bareOut.data.customization === undefined);
check('disabled gradient is dropped', !JSON.stringify(bareOut.data).includes('gradient'));

console.log('loading an existing document');
const reloaded = formFromDoc('journal', 'a-test-entry', parsed.data, parsed.content);
check('form restores the customization', reloaded.customization.typography?.fontFamily === 'lora');
check('form restores the clip', reloaded.video === '/uploads/journal/x.mp4');
const again = serializeForm(reloaded).data;
check('save → load → save is stable', JSON.stringify(again.customization) === JSON.stringify(data.customization));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
