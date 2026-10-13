/**
 * The home hero is chosen in /admin (a `hero` home block). resolveHero is what
 * both the page and the index.html preload use, so it is the contract.
 */
import { DEFAULT_HERO_IMAGE, resolveHero } from '../src/lib/hero';
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

const CUSTOM = '/uploads/photography/1789991526702-360529747.webp';

console.log('resolveHero');
const none = resolveHero([{ configType: 'quote', image: CUSTOM }]);
check('no hero block → the default frame', none.src === DEFAULT_HERO_IMAGE && none.isDefault);
check('default keeps its baked wide band', !!none.wideSrcSet?.includes('hero-dusk-wide-2560.webp'));

const custom = resolveHero([{ configType: 'hero', image: CUSTOM, visible: true, customization: { image: { focalX: 30, focalY: 70 } } }]);
check('a hero block replaces the photo', custom.src === CUSTOM && !custom.isDefault);
check('its focal point is honoured', custom.objectPosition === '30% 70%', custom.objectPosition);
check('phones get the derivatives', custom.tallSrcSet?.includes('-1536.webp 1536w') === true, custom.tallSrcSet);
check('desktops also get the full-size original', custom.wideSrcSet?.endsWith(`${CUSTOM} 2560w`) === true, custom.wideSrcSet);
check('no stale default band for a new photo', !custom.wideSrcSet?.includes('hero-dusk'));

check('a switched-off block is ignored', resolveHero([{ configType: 'hero', image: CUSTOM, visible: false }]).isDefault);
check('a block without an image is ignored', resolveHero([{ configType: 'hero', image: '' }]).isDefault);
check('a remote URL is never used', resolveHero([{ configType: 'hero', image: 'https://example.com/a.webp' }]).isDefault);
const two = resolveHero([
  { configType: 'hero', image: '/uploads/b.webp', order: 2 },
  { configType: 'hero', image: CUSTOM, order: 1 },
]);
check('lowest order wins', two.src === CUSTOM);

console.log('admin round trip');
const saved = serializeForm(
  formFromDoc('home', 'hero', { title: 'Hero photo', configType: 'hero', image: CUSTOM, order: 0, visible: true, customization: { image: { focalX: 30 } } }, '')
);
check('keeps configType hero', saved.data.configType === 'hero', JSON.stringify(saved.data));
check('keeps the image', saved.data.image === CUSTOM);
check('keeps the focal point', saved.data.customization?.image?.focalX === 30);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
