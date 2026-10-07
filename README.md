# arbabmujtaba.github.io

Personal archive — part portfolio, part journal, part visual memory bank. React 19 + Vite 6 +
Tailwind 4, TypeScript, deployed as a static site to GitHub Pages.

Live: <https://arbabmujtaba.github.io>

## Running it

```bash
npm ci
npm run dev        # http://localhost:3000 — Vite through an Express server, with the admin API
npm run build      # vite build + post-build route shells, 404.html and sitemap.xml
```

`npm run dev` starts `server.ts`, which serves the site *and* the authoring API. It binds
`127.0.0.1` only, on port 3000 unless `PORT` says otherwise. The deployed site is fully static and
has no API.

| Command | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm test` | content-state transitions, routing, the WebP derivative contract, the hidden layer's gestures / content contract, and the admin's front-matter mapping |
| `npm run build` | production build, then the route shells, 404.html and sitemap.xml |
| `npm run verify:dist` | asserts every public route resolves the way GitHub Pages serves it |
| `npm run optimize:images` | regenerates WebP derivatives (`--force` to rebuild all) |
| `npm run convert:uploads` | rewrites pre-existing originals as WebP and repoints every reference |

## Content

Markdown in `content/`, bundled at build time by `src/lib/cms.ts` — there is no runtime fetch.
Eight collections; four of them are documents with their own URL:

| Collection | Route | Shape |
|---|---|---|
| `portfolio` | `/portfolio/<slug>` | project, tech stack, links |
| `journal` | `/journal/<slug>` | dated entry, volume number, tags |
| `tech` | `/tech/<slug>` | build logs and notes |
| `photography` | `/photography/<slug>` | frame, gallery, gear, capture mode |

The rest — `gear`, `favorites`, `home`, `timeline`, `secrets` — are fragments composed into pages
rather than documents, so they have no route of their own. `content/home/` drives the home page
through `configType` entries (`profile`, `gateway`, `quote`, `principle`, `reel`, `thought`);
`timeline/` holds the eight personal chapters (2019–2026, each with a `place`) that feed the
chapter timeline, the Sopore → Indore passage and the memory map.

## The hidden layer

About a third of the site is a layer visitors find rather than see. Everything a visitor chooses
or finds is kept in `localStorage`; nothing leaves the browser.

| Piece | Where | How it is found |
|---|---|---|
| Day / night | header, sun/moon menu | night, day, or follow the clock (06–18 local). Set before first paint by the script in `index.html` |
| The wand | header, wand icon | trail of sparks; draw a circle in the air for Lumos, shake for levitation; Esc or the chip puts it away |
| Invisible ink | margins of home sections | only readable under Lumos (`kind: ink` secrets) |
| The Restricted Section | the untitled book at the end of the shelf under "On the desk, lately", or type `alohomora` | notes (`kind: note, room: library`) and lines lifted from the journal |
| The Darkroom | the red tally light in the *frames* section; on `/photography`, "darkroom open" or the lead print while the wand is out | prints develop as you hover; the back carries date and gear |
| Saptarishi | seven bright stars over the hero, night only | trace the figure star to star (tap or drag) — decoys and wrong turns reset it |
| The wax seal | footer, every page | seven knocks |
| The compass | memory map | open Sopore and Indore, or trace the journey |
| The quill | end of any journal volume | read to the last line |
| The Room of Small Details | the ledger, once all collectibles are found | facts computed from the archive |
| Incantations | anywhere outside a text field, or the wand's chip | `lumos`, `nox`, `alohomora`, `revelio` (shows what is enchanted on screen), `accio` (summons a journal line), `mischief managed`; a note for whoever opens devtools |
| The index | ⌘K / Ctrl+K or `/`; "Search the archive" in the ledger | every page, every entry, the spells and the light, in one input (`components/magic/Palette.tsx`) |
| The invitation | a first-time visitor who has found nothing | a spark drifts across the page and slows when the pointer nears; catching it picks up the wand and lights what is enchanted in view. Left alone it flies to the wand, and returns on a later visit (three at most) (`trigger: invitation`, `components/magic/Wisp.tsx`); the wand wears a gilt dot until first used |
| Ambient sound | sky menu, off by default | synthesised in the browser (`src/lib/sound.ts`), no audio files |

State lives in `src/lib/magic.tsx` (initial chunk, no content); everything that draws or listens is
in `src/components/magic/`, mounted on idle and lazy. Copy and on/off switches for every room, egg
and ink line are markdown in `content/secrets/`, read by `src/lib/secrets.ts` and managed from the
**Secrets** workspace in `/admin`. Hidden is not private: those files ship in the public bundle like
the rest of `content/`. Reduced motion turns off the trail, twinkle and door animations but keeps
every discovery reachable. On a phone, Lumos follows a touch, shaking (Android) levitates, and every
spell has a button on the wand's chip.

Images live in `public/uploads/`. Every image on the site is the owner's own photograph;
`.kiro/IMAGE_MAP.md` records which frame fills which slot and why, with measured luminance and
contrast. `src/lib/image.ts` points a `<picture><source>` at WebP derivatives, and because a
`<source>` has no fallback a missing derivative renders broken — so conversion is automatic rather
than remembered. `src/services/ImageDerivativeService.ts` owns the whole contract:

- uploading through `/admin` rewrites the upload as a full-size WebP original — a JPEG as much as a
  HEIC — and queues the 480/768/1536 derivatives in the background, so the URL written into the
  front-matter is always WebP and always a file the page can load
- publishing waits for that queue, regenerates anything missing or stale, and stages the derivatives
  in the same commit as the original — a push cannot carry an image without them, and an unreadable
  file fails the pipeline instead of reaching the live site
- `npm run optimize:images` is the sweep for anything copied into `public/uploads/` by hand, and
  `POST /api/uploads/optimization` is the same sweep from the running dev server
- `npm run convert:uploads` converts originals that predate the layer: it rewrites them as WebP,
  repoints every reference in `content/`, regenerates the derivatives, and reports what it saved

## Authoring

Two surfaces, both local:

- The React admin at `/admin` — the Editorial Hub (`src/pages/Admin.tsx` is the shell; the pieces are
  in `src/components/admin/`). It has a dashboard, a filterable content list, an entry editor, a reel
  publisher, the click-to-edit live editor and the deployment centre. SSR preview at
  `/preview/:collection/:slug`, and an 11-step publishing pipeline that commits and pushes via
  `simple-git`.
- Decap CMS (`public/admin/`), loaded from a CDN.

The **Secrets** workspace switches rooms, easter eggs and ink lines on and off (it writes `visible`
to the file) and opens the editor for new hidden notes. Timeline chapters carry a `place`; home
blocks of type *Thought* feed the random-thought drawer.

Neither works on the deployed site: GitHub Pages cannot run `server.ts` or serve Decap's OAuth
exchange. Editing happens on the machine that holds the repo; pushing to `main` deploys. `/admin` is
dev-only and is not part of the built site. Set `STUDIO_TOKEN` to require an `x-studio-token` header
on mutating API calls (the admin sends `localStorage.studio_token`).

### The entry editor

- **Live preview is the real site.** `LivePreview` loads the actual page renderer (`ContentModal`,
  the same component visitors get) in a same-origin iframe at `/admin/preview-frame` and streams the
  unsaved form into it with `postMessage`. Desktop / tablet / phone widths, a "page" and an "in the
  list" view, and a replay button for entrance animations.
- **Where & publish** shows the section and URL an entry will land on, which list page picks it up,
  and what happens when you save or publish.
- **Style** — every option is stored in front-matter and read by the renderer, so what the preview
  shows is what ships: 29 font families in six groups, with exact-size sliders for
  body text and title, line height, letter spacing and weight; entrance animations with speed and
  trigger; column width, position, text alignment and block spacing; colours, including the page
  background; and **Effects** — colour grades (vintage, noir, warm, cool, faded, cinematic, vivid),
  exposure / contrast / saturation / blur, film grain and vignette — applied to photographs and video
  alike. Six "starting looks" fill the whole panel at once.
- **Media** — an aspect picker (21:9 … 2:3, original) with a draggable crop window and focal point.
  The aspect and focal point are stored and honoured everywhere the image is shown (page, cards,
  home); "Apply crop" can also bake the window into a new WebP.
- `Ctrl/⌘ + S` saves; unsaved work is autosaved to `localStorage` and offered back after a reload.

### Publishing a reel

*Publish a reel* in the sidebar is a three-step wizard: add a clip (MP4/WebM, up to 40 MB; a poster
frame is picked automatically or from any point in the clip), choose where it goes, then describe it.

| Destination | What it writes |
|---|---|
| Home page reel | a `home` entry with `configType: reel` — shown in "Frames that keep moving" on `/` |
| Add to an existing entry | `video` and `videoPoster` merged into that entry's front-matter |
| Start a new post | opens the editor with the clip and poster pre-attached |

A live preview shows the place the clip will appear. *Save only* writes it locally as a draft;
*Save & publish* runs the publishing pipeline.

On the Home page the live reel with the lowest `order` plays as the main plate; every other live reel
joins the strip of posters beneath it, and picking one swaps it into the plate (only one `<video>` is
decoded at a time). The *Deployments* view lists every reel with its poster, order, standing and
whether it is the main plate or in the strip.

### Draft, live and hidden

The registry (`content-state.json`) holds a workflow label — draft → review → published → archived —
and is **not** what the website reads. Everything in `content/` is bundled into the site, so the
admin reports an entry's *standing*: published and visible is **Live**; published with
`visible: false` (or `published: false` for the journal) is **Hidden**; anything not published is a
**Draft** that is saved locally. Files that exist in `content/` but are missing from the registry are
reconciled to published on load (`contentState.reconcile`), and the publishing pipeline moves entries
through the lifecycle to published (`markPublished`) instead of failing on a draft.

## Design

Tokens in `src/index.css` — night (dark canvas) and day (`[data-theme="day"]`, paper) themes, with
`data-surface="ink"` keeping photographs on dark plates in daylight; Host Grotesk, Fragment Mono and
EB Garamond (`font-book`, the manuscript voice used for the second line of every heading, notes and
the hidden layer); ember accent, old-gold `gilt` for the hidden layer only. Components use
the token-backed utilities, never colour literals. `src/components/rushes/` holds the shared motifs:
`RecLabel`, `StackedHeading`, `Marquee`, `NumberedItem`, `FrameCard`, `Accordion`, `ImageTypeMask`.
Motion respects `prefers-reduced-motion` and degrades on touch. See `.kiro/DESIGN_SYSTEM.md`.

## Routing

A hand-rolled router in `src/App.tsx` parses `window.location.pathname` (`src/lib/navigation.ts`).
Clicking a card opens a quick-look drawer *and* pushes the entry's URL; loading that URL cold renders
the full page instead. Both use one renderer (`ContentModal`, `variant="overlay" | "page"`), so the
two presentations cannot drift apart.

Photography is the exception: a plate is a photograph before it is a document, so clicking one opens
the original at full size in `src/components/Lightbox.tsx` — arrow keys walk the contact sheet, and
the caption links through to the entry. The card stays a real anchor to `/photography/<slug>`, so
cmd-click, middle-click and crawlers still get the document. Inside an entry, the cover, the gallery
and any image in the body open the same overlay.

Because GitHub Pages is a static host, `scripts/postbuild.ts` writes `dist/<route>/index.html` for
every route so deep links are served with HTTP 200 and their own `<title>`, description, canonical
and Open Graph tags, plus `404.html` as the catch-all and `sitemap.xml`. `npm run verify:dist` fails
the build if any route would 404.

## Deploying

Scrolling is the window's. Pages used to wrap themselves in an `overflow-y-auto` box that never
actually scrolled (the shell has no bounded height), so every scroll-linked effect read a scrollTop
of 0 — the hero parallax, the timeline rail and the floating arrow were dead in dev and production
alike. Use `useScroll()` / `useScroll({ target })`, never `{ container }`. Arbitrary transition lists
must name `scale` / `translate` (Tailwind v4 uses the individual transform properties), and a stale
tab after a deploy reloads itself once on `vite:preloadError` (`src/main.tsx`).

Push to `main`. `.github/workflows/deploy.yml` runs typecheck, tests, build and `verify:dist`, then
publishes `dist/` to Pages.
