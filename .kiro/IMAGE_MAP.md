# Image map — Rushes retheme

Which of the site owner's photographs goes in which slot, and why. Every number below is measured
(`sharp().metadata()` for dimensions, `sharp().stats()` for standard deviation, greyscale histogram
for mean luminance and mid-tone mass) — nothing here is estimated.

Inventory: **38 originals** under `public/uploads/` plus `public/portrait.jpg`. 23.6 MB total; the
largest single file is `photography/1783414461952-773184125.jpeg` at 6.07 MB.

Columns used throughout:

- **lum** — mean luminance 0–255. Against the `bg-canvas` near-black (`#0a0a0a`, lum ≈ 10) anything
  under ~60 disappears, anything over ~150 punches a hole in the page.
- **sdev** — luminance standard deviation, i.e. contrast. High is good for a type mask, irrelevant
  for a backdrop.
- **mid%** — share of pixels in the 70–190 mid-tone band. This is what actually shows through
  letterforms in `ImageTypeMask`.

## Assignments

| Slot | File | Dimensions | Orient | Size | lum / sdev / mid% | Why this one |
|---|---|---|---|---|---|---|
| Hero backdrop (Home) | `/uploads/photography/1785134270800-642096424.jpeg` | 4032×3024 stored → **3024×4032 displayed** | portrait (EXIF 6) | 1.23 MB | 50 / 57 / 32% | lum 50 makes it the darkest large photograph in the archive, so the bone hero type stays legible through `opacity-70`. A dusk poplar field with the sun low in haze — atmosphere, no subject competing with the wordmark. It displays portrait, but 3024 px on its horizontal axis is ample for `object-cover` to crop a full-bleed 16:9 band. |
| Footer wordmark mask | `/uploads/photography/1781674009809-689730206.jpeg` | 640×480 | landscape | 0.03 MB | 68 / 82 / 37% | Two clean bands — ember sky over a black ridge — so sdev 82 with almost no fine detail, exactly what `background-clip: text` needs. Verified by rendering the wordmark as a stencil over a wide crop of each candidate: this is the only one where every letter stays legible; the desk and poplar-field frames lose their opening letters into black. `ImageTypeMask` loads the **original** as a CSS background with no derivative, so its 30 KB is the deciding factor. |
| `gateway-portfolio` (01 // Builder) | `/uploads/photography/1783414461952-773184125.jpeg` | 6048×6172 | square | 6.07 MB | 66 / 66 / 30% | The owner's own desk — laptop, handwritten notes, keys under lamp light — is the builder's workbench. Highest-resolution asset in the archive, and it is served through a WebP derivative so the 6 MB original never reaches a browser. |
| `gateway-journal` (02 // Thinker) | `/uploads/photography/1785133951737-704347293.jpeg` | 2618×4656 | portrait | 0.83 MB | 114 / 59 / 47% | Friends around a bonfire at dusk carries "the human side of learning, building, and becoming" better than any object shot, and the fire's warmth sits in the same register as the ember accent. |
| `gateway-tech` (03 // Engineer) | `/uploads/photography/1782620995136-322083290.jpg` | 1242×2208 | portrait | 0.37 MB | 82 / 62 / 44% | A gear flat-lay (headphones, tablet, earbuds, cable) is the literal "living lab" bench — one clear subject, dark surround, and a small file at usable resolution. |
| `gateway-photography` (04 // Witness) | `/uploads/photography/1785134340658-971270307.jpeg` | 3024×4032 | portrait | 1.46 MB | 76 / 64 / 38% | Banded ember sunset over a dark horizon is "light, place, and passing weather" without a single distracting element, and lum 76 keeps it seated on the near-black canvas. |
| `gateway-collection` (05 // Curator) | `/uploads/photography/1782621000816-524714599.jpg` | 640×1297 | portrait | 0.12 MB | 114 / 85 / 52% | Night desk with a retro radio, a mug and a lit screen — objects and music, the curator's shelf rather than the engineer's bench. Caveat below. |
| Section backdrops | **none — do not assign one** | — | — | — | — | See "No candidate" below. |

### Caveats on the above

- **EXIF orientation.** `photography/1785134270800-642096424.jpeg` is the only file in the archive
  with a non-identity orientation tag (EXIF 6 = rotate 90° CW); every other original is 1 or absent.
  Its stored pixels are 4032×3024 but a browser draws it 3024×4032. `scripts/optimize-images.ts`
  therefore calls `.rotate()` before resizing, which bakes the orientation into the WebP. Without
  that call this one image's derivatives would render 90° out relative to its original — and because
  `getLocalWebpSources` emits a `<source>`, the rotated derivative would win. Do not remove
  `.rotate()`.
- Judge orientation from the *displayed* dimensions, not from `identify`'s raw output. Raw metadata
  and un-oriented thumbnails both report this file as landscape and they are both wrong.
- `gateway-collection` at 640 px wide means its 768w and 1536w derivatives both cap at 640 px
  (`withoutEnlargement`). Fine inside a `aspect-[4/3]` card, wrong for anything full-bleed. If the
  curator slot ever grows to a full-width plate, switch to
  `/uploads/journal/1782982647621-174289348.jpg` (736×1308, an engraved pendant — an object that
  literally carries an inscription) and accept a different subject, or leave it type-only.
- The footer wordmark mask is deliberately a small, soft image. Scaled up across a `18vw` wordmark it
  will be blurry, which is the desired effect through letterforms; do not "fix" this by swapping in a
  larger file, because that file is fetched at full size by CSS.
- `gateway.image` is not currently rendered anywhere in `src/` — Home lists the gateways as
  `NumberedItem` rows. The frontmatter is still corrected so that the field is safe the moment a page
  or the Admin preview starts using it.

### Freed by this map

`/uploads/home/1781841191101-361910064.jpeg` (720×1280, 0.25 MB, lum 104 / sdev 62 / mid 60%) was
doing double duty as both the hero backdrop and the footer wordmark. It is a MacBook with an open
notebook — good, but portrait and only 720 px wide, so as a full-bleed desktop hero it was being
upscaled past its pixels. It is now unassigned and is the best reserve for any editorial or
about-page plate at card size.

## No candidate: section backdrops

There is no usable wide, dark, detail-free frame left in the archive, so **no section should take a
photographic backdrop.** Only three text-free frames are genuinely landscape at usable size once EXIF
orientation is accounted for, and each fails on content or tone:

- `general/1781673985531-850722085.png` (1920×1080, lum 23, sdev 15) — correct tonality and the right
  shape, but the words "life rewards action not intelligence" are baked into the pixels. Typography
  inside an image is not the owner's design language and cannot be restyled.
- `collection/1781797866868-433918712.png` (3024×1964, lum 33, sdev 38) — a dark GitHub profile
  screenshot. Legible UI chrome behind body copy reads as a mistake.
- `photography/1782991340284-395493699.jpeg` (4000×3000, lum 112, 4.39 MB) — a real photograph at
  real resolution, but bright midday sky and a single hard subject (a motorcycle against a blue
  gate). Behind text it fights rather than recedes, and it is the second-largest file in the archive.

Use the grain and rule treatments the design system already ships instead: `.film-grain` for tooth,
`.hairline-grid` for structure, `bg-canvas-deep` for wells. `Home.tsx` already falls back to
`hairline-grid` when the hero image fails to load, which is the pattern to copy.

## Rejected, with reasons

Excluded from every decorative slot:

| File | Why not |
|---|---|
| `photography/1782815357385-880416972.jpg` | "ISOLATED" set into the image. |
| `journal/1782633878697-150215554.jpg` | "kindness." set into the image. |
| `journal/1782983918513-380150275.jpg` | Two lines of quote text set into the image. |
| `journal/1782621236588-323118002.jpg` | Four lines of quote text set into the image. |
| `photography/1782815464492-610162115.jpg` | Caption text set into the image. |
| `collection/1781797866868-433918712.png` | GitHub profile screenshot. |
| `tech/1782814174474-561550138.jpeg` | Browser screenshot; also only 480×640. |
| `tech/1782814410384-870634565.jpeg` | Software-list screenshot; 320×208, the smallest file in the archive. |
| `general/1781020986977-288804544.png` | A scanned internship document. lum 211 — a white rectangle on a near-black page. |
| `general/1781673985531-850722085.png` | Baked-in text (see above). |
| `photography/1782815272929-728856687.jpg` | lum 2, sdev 15. Effectively a black frame; nothing survives on `bg-canvas`. |
| `photography/1782579548370-109462486.jpeg` | A close-up of an identifiable third party at a mic. Not the owner's, and a face as decoration is the wrong note. |

Near-duplicates — keep one of each pair, the rest are redundant rather than unusable:

| Kept | Duplicate of it |
|---|---|
| `photography/1782620995136-322083290.jpg` | `photography/1782621003839-87347598.jpg` |
| `photography/1782620402626-664910063.jpg` | `photography/1782620527269-148542884.jpg` |
| `journal/1782982647621-174289348.jpg` | `journal/1782984265762-288170011.jpg` |
| `photography/1781678396113-768213974.jpeg` | `photography/1781678427211-537920670.jpeg` |
| `photography/1781681817440-553513022.jpeg` | `public/portrait.jpg` (same frame, same stats) |
| `photography/1781674009809-689730206.jpeg` | `photography/1781673990936-229008787.jpeg`, `general/1781673971324-74949928.jpeg`, `general/1787997044894-947072143.jpeg` (same ridge at 640×480 / 640×480 / 480×360) |

## Regenerating derivatives

Every path above resolves through `getLocalWebpSources` in `src/lib/image.ts`, which emits a
`<picture><source srcset>` at `/uploads/optimized/<path-without-extension>-{480,768,1536}.webp`. A
`<source>` has no fallback, so a missing derivative is a broken image. After adding, replacing or
re-cropping anything under `public/uploads/`:

```
npx tsx scripts/optimize-images.ts           # incremental — only stale/missing derivatives
npx tsx scripts/optimize-images.ts --force   # rebuild all of them
```

39 sources × 3 widths = 117 derivatives. The script exits non-zero if any of them fails, so it is
safe to gate a build on.
