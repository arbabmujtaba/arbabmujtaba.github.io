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
`127.0.0.1` only. The deployed site is fully static and has no API.

| Command | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm test` | content-state transitions and routing |
| `npm run build` | production build, then the route shells, 404.html and sitemap.xml |
| `npm run verify:dist` | asserts every public route resolves the way GitHub Pages serves it |
| `npm run optimize:images` | regenerates WebP derivatives (`--force` to rebuild all) |

## Content

Markdown in `content/`, bundled at build time by `src/lib/cms.ts` — there is no runtime fetch.
Ten collections; five of them are documents with their own URL:

| Collection | Route | Shape |
|---|---|---|
| `portfolio` | `/portfolio/<slug>` | project, tech stack, links |
| `journal` | `/journal/<slug>` | dated entry, volume number, tags |
| `tech` | `/tech/<slug>` | build logs and notes |
| `photography` | `/photography/<slug>` | frame, gallery, gear, capture mode |
| `collection` | `/collection/<slug>` | index entries with a body |

The rest — `gear`, `timeline`, `favorites`, `home`, `gallery` — are fragments composed into pages
rather than documents, so they have no route of their own. `content/home/` drives the entire home
page through `configType` entries (`profile`, `gateway`, `quote`, `principle`).

Images live in `public/uploads/`. Every image on the site is the owner's own photograph;
`.kiro/IMAGE_MAP.md` records which frame fills which slot and why, with measured luminance and
contrast. `src/lib/image.ts` points a `<picture><source>` at WebP derivatives — and because a
`<source>` has no fallback, **run `npm run optimize:images` after adding or replacing anything
under `public/uploads/`**, or that image renders broken.

## Authoring

Two surfaces, both local:

- The React admin at `/admin` (`src/pages/Admin.tsx`) — content states (draft → review → published →
  archived) tracked in `content-state.json`, live click-to-edit, SSR preview at
  `/preview/:collection/:slug`, and an 11-step publishing pipeline that commits and pushes via
  `simple-git`.
- Decap CMS (`public/admin/`), loaded from a CDN.

Neither works on the deployed site: GitHub Pages cannot run `server.ts` or serve Decap's OAuth
exchange. Editing happens on the machine that holds the repo; pushing to `main` deploys.

## Design

Tokens in `src/index.css` — two surfaces (dark "ink" canvas, light "bone" for reading), Host Grotesk
and Fragment Mono, ember accent with acid lime reserved for live/recording signals. Components use
the token-backed utilities, never colour literals. `src/components/rushes/` holds the shared motifs:
`RecLabel`, `StackedHeading`, `Marquee`, `NumberedItem`, `FrameCard`, `Accordion`, `ImageTypeMask`.
Motion respects `prefers-reduced-motion` and degrades on touch. See `.kiro/DESIGN_SYSTEM.md`.

## Routing

A hand-rolled router in `src/App.tsx` parses `window.location.pathname` (`src/lib/navigation.ts`).
Clicking a card opens a quick-look drawer *and* pushes the entry's URL; loading that URL cold renders
the full page instead. Both use one renderer (`ContentModal`, `variant="overlay" | "page"`), so the
two presentations cannot drift apart.

Because GitHub Pages is a static host, `scripts/postbuild.ts` writes `dist/<route>/index.html` for
every route so deep links are served with HTTP 200 and their own `<title>`, description, canonical
and Open Graph tags, plus `404.html` as the catch-all and `sitemap.xml`. `npm run verify:dist` fails
the build if any route would 404.

## Deploying

Push to `main`. `.github/workflows/deploy.yml` runs typecheck, tests, build and `verify:dist`, then
publishes `dist/` to Pages.
