import { cropRect, focalFromCenter } from '../src/lib/crop';

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

const near = (a: number, b: number, eps = 0.5) => Math.abs(a - b) <= eps;

console.log('crop geometry');

// 4000×3000 photograph into a 16:9 window: full width, 2250 tall.
const wide = cropRect({ width: 4000, height: 3000, ratio: 16 / 9, focalX: 50, focalY: 50, zoom: 1 });
check('16:9 window spans the full width', near(wide.sw, 4000) && near(wide.sx, 0));
check('16:9 window is 2250px tall, centred', near(wide.sh, 2250) && near(wide.sy, 375));

const top = cropRect({ width: 4000, height: 3000, ratio: 16 / 9, focalX: 50, focalY: 0, zoom: 1 });
const bottom = cropRect({ width: 4000, height: 3000, ratio: 16 / 9, focalX: 50, focalY: 100, zoom: 1 });
check('focal 0% sits the window on the top edge', near(top.sy, 0));
check('focal 100% sits the window on the bottom edge', near(bottom.sy + bottom.sh, 3000));

const square = cropRect({ width: 4000, height: 3000, ratio: 1, focalX: 0, focalY: 50, zoom: 1 });
check('1:1 of a landscape is 3000 square', near(square.sw, 3000) && near(square.sh, 3000));
check('focal 0% pins it to the left', near(square.sx, 0));

const zoomed = cropRect({ width: 4000, height: 3000, ratio: 1, focalX: 50, focalY: 50, zoom: 2 });
check('zoom 2 halves the window', near(zoomed.sw, 1500) && near(zoomed.sh, 1500));
check('zoom about the centre stays centred', near(zoomed.sx + zoomed.sw / 2, 2000) && near(zoomed.sy + zoomed.sh / 2, 1500));

const cornered = cropRect({ width: 4000, height: 3000, ratio: 1, focalX: 0, focalY: 0, zoom: 2 });
check('zoom about the top-left corner stays in the corner', near(cornered.sx, 0) && near(cornered.sy, 0));

console.log('drag → focal point');
for (const [fx, fy, zoom, ratio] of [
  [20, 80, 1, 16 / 9],
  [75, 30, 1.5, 1],
  [0, 100, 2, 3 / 4],
  [50, 50, 3, 4 / 3],
] as const) {
  const input = { width: 4000, height: 3000, ratio, focalX: fx, focalY: fy, zoom };
  const rect = cropRect(input);
  const back = focalFromCenter(input, rect.sx + rect.sw / 2, rect.sy + rect.sh / 2);
  // An axis with no slack has no focal point to recover; only check axes that do.
  const slackX = 4000 - Math.min(4000, 3000 * ratio) / zoom > 0.5;
  const slackY = 3000 - Math.min(3000, 4000 / ratio) / zoom > 0.5;
  check(
    `round trip fx=${fx} fy=${fy} z=${zoom} r=${ratio.toFixed(2)}`,
    (!slackX || near(back.focalX, fx, 0.01)) && (!slackY || near(back.focalY, fy, 0.01)),
    JSON.stringify(back)
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
