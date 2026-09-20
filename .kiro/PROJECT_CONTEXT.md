# arbabmujtaba.github.io — Project Context

Saved 2026-09-20. Snapshot taken at commit `35d0b0c` ("optimisation update 9/5/26"), branch `main`,
remote `github.com/arbabmujtaba/arbabmujtaba.github.io`. Working tree clean at time of analysis.

Purpose of this file: persist the full codebase analysis so it does not have to be re-derived.
A full theme/background redesign is planned immediately after this snapshot.

---

## 1. What the project is

Personal site: React 19 + Vite 6 + Tailwind 4 SPA in TypeScript, `motion` for animation,
`lucide-react` for icons, `react-markdown` for body rendering.

- **Content**: 90+ markdown files in `content/` across 10 collections
  (`journal`, `tech`, `photography`, `collection`, `portfolio`, `gear`, `timeline`, `favorites`, `home`, `gallery`).
- **Content is bundled at build time** by `src/lib/cms.ts` using
  `import.meta.glob('/content/<col>/**/*.md', { query: '?raw', eager: true })`
  plus a hand-written YAML frontmatter parser (`parseYamlBlock`). The deployed site is fully static —
  no runtime API.
- **Routing**: custom `history.pushState` router in `src/App.tsx`
  (`/`, `/portfolio`, `/journal`, `/tech`, `/photography`, `/collection`, `/admin`), pages lazy-loaded.
- **Authoring stack (local only)**: `server.ts` (~700 lines, Express + Vite middleware, port 3000,
  run via `npm run dev` → `tsx server.ts`) exposing `/api/content`, `/api/upload`, `/api/publish`,
  `/api/deploy/*`, `/preview/:collection/:slug` (SSR preview), plus a content-state registry
  (`content-state.json`, states draft→review→published→archived) and an 11-step publishing pipeline
  (`src/services/PublishingService.ts`) that commits and pushes via `simple-git`.
- **Two competing CMSes**: the custom React admin (`src/pages/Admin.tsx`, 121 KB) and Decap CMS
  (`public/admin/index.html` + `public/admin/config.yml`, loaded from jsDelivr CDN).
- **Deploy**: `.github/workflows/deploy.yml` → `npm ci` + `npm run build` → `actions/deploy-pages` (GitHub Pages).

## 2. Verified health (run 2026-09-20)

| Check | Command | Result |
|---|---|---|
| Install | `npm ci` | clean, 1033 packages |
| Typecheck | `npm run lint` (`tsc --noEmit`) | passes, 0 errors |
| Build | `npm run build` | passes, 1.84s, 2372 modules |
| Tests | `npx tsx tests/contentState.test.ts` | 20 passed, 0 failed |

Build output: `index` 346 KB (111 KB gzip), `Admin` 153 KB, `ContentModal` 129 KB, `cms` 66 KB
(all markdown inlined), CSS 137 KB (19 KB gzip). `dist` totals 36 MB, of which `dist/uploads` is 35 MB.

`node_modules` was installed during analysis; the `dist/` built during analysis was removed
(`npm run clean`). `content-state.json` was modified by the test run (only `lastUpdated`) and reverted.

## 3. Findings by severity

### CRITICAL — `server.ts` is unauthenticated and path-traversable

- No auth on any endpoint, including `POST/PUT/DELETE /api/content`, `POST /api/upload`,
  `POST /api/publish` (which git-commits and pushes).
- `Access-Control-Allow-Origin: *` on every response (verified via response headers), so any site
  visited in the browser can call the API while the dev server runs.
- Binds `0.0.0.0:3000`, exposing it to the whole LAN.
- Path traversal in `:collection` / `:slug` route params — **verified live**:
  `GET /api/content/journal/..%2F..%2FREADME` returned
  `{"collection":"journal","slug":"../../README","data":{},"body":"This is a updated readmeee file\n"}`.
  The `collection` param escapes the project root entirely
  (`/api/content/..%2F..%2Ftmp/x` → error path `/home/arch/tmp/x.md`).
  `DELETE /api/content/:collection/:slug` uses the same unvalidated `path.join` + `fs.remove`
  (= arbitrary `.md` delete; not tested destructively). Multer's `destination` uses
  `req.body.collection` raw (= write outside `public/uploads`).
- Fix: whitelist `collection` against the existing collections array; validate `slug` with the
  `SLUG_PATTERN` already present in `src/services/ValidationService.ts` (currently unused on these
  routes); bind `127.0.0.1`; drop wildcard CORS; add a shared secret on mutating routes.

### HIGH — production admin cannot work; deep links 404

- Decap `config.yml` uses `backend: name: github` but GitHub Pages cannot serve the `/api/auth`
  token exchange (the config's own comments admit this) → login impossible without an external
  OAuth proxy.
- `/admin` collides: static `dist/admin/index.html` (Decap) wins over the SPA route, so the 153 KB
  React `Admin` chunk ships to production but is unreachable. Its `/api/*` calls would fail anyway.
- No `dist/404.html` is produced (verified absent), so on GitHub Pages a shared link or hard refresh
  of `/portfolio`, `/journal`, etc. returns GitHub's 404. Fix: copy `index.html` → `404.html` post-build.

### MEDIUM

- **Image pipeline is half-wired.** `src/lib/image.ts#getLocalWebpSources` emits a
  `<picture><source>` srcset for `/uploads/optimized/<base>-{480,768,1536}.webp`. All 38 originals
  currently have all 3 derivatives (verified: 0 missing; 117 optimized files; no broken content refs).
  But there is **no optimizer in the repo** — no `sharp`/`imagemin`, no script; commit `af317e4`
  reverted the optimizer added in `23e4e9e`. New CMS uploads get no derivatives, and `<source>` has
  no automatic fallback → future images break instead of degrading. Originals reach 6.1 MB.
- `public/uploads` is 35 MB of the 47.7 MB packed repo and is redeployed on every build.
- `tsconfig.json` has **no `"strict"`**, so the passing `tsc --noEmit` is a weak signal.
- `dotenv` is a dependency but never imported anywhere → a `.env` file is silently ignored;
  everything documented in `.env.example` only works if exported in the shell.
- Unused dependencies: `@google/genai`, `react-hook-form`, `zod`, and the `decap-cms` npm package
  (admin loads Decap from CDN). `vite` is in both `dependencies` and `devDependencies`.
  `axios` IS used, but only via dynamic import in the OAuth handler.
- No `test` script; the suite runs only via a hand-rolled harness. It mutates the tracked
  `content-state.json`. CI runs `build` only — never `lint` or tests.
- `package.json` still named `react-example`, version `0.0.0`.

### LOW

- `index.html` has no `meta description`, Open Graph or Twitter tags; no `robots.txt`, no `sitemap.xml`.
- `README.md` is one line.
- `src/pages/Admin.tsx` (121 KB) is the main maintainability hotspot.
- `content/tech/` has three posts about cracked/pirated apps (iOS, macOS, Windows) published under a
  real name on GitHub — DMCA/TOS exposure.

## 4. Current design system (pre-redesign baseline)

Defined in `src/index.css` via Tailwind 4 `@theme`:

- `--font-sans: Inter`, `--font-mono: JetBrains Mono`, and **`--font-serif: "Sora"`** — Sora is a
  geometric *sans*, so every `font-serif` class renders a sans. The "editorial" look has no real serif.
- `--color-zinc-50..900` are redefined as **white alpha values** (`rgba(255,255,255,X)`); `zinc-950`
  is `rgba(0,0,0,0.1)`. This means the whole palette assumes a dark background.
- Base background `#0a0a09` (near-black), accent `orange-500/400` (`#f97316`), hairline borders
  `rgba(255,255,255,0.15)`, decorative corner ticks in `App.tsx`, `html { font-size: 15px }`.
- Shared layout utilities: `.page-shell`, `.page-intro` (giant outlined `data-mark` word behind the
  title via `::before` + `-webkit-text-stroke`), `.page-eyebrow` (mono, uppercase, tracked, orange),
  `.page-title` (clamp 3.4→7.2rem, tight tracking), `.page-description`, `.content-rule`,
  `.image-frame` (orange border on group hover), `.custom-scrollbar`, `.markdown-body`
  (with `--pts` font-scale and `--pff` font-family custom props driven by per-post customization).
- Motion vocabulary: `motion/react` scroll-linked `useScroll`/`useSpring`/`useTransform`,
  `ease: [0.16, 1, 0.3, 1]`, clip-path text reveals, parallax, `prefers-reduced-motion` respected,
  touch devices get reduced animation via `useMediaQuery('(pointer: coarse), (max-width: 767px)')`.
- Themed components: `GlobalBackground`/`BackgroundLayer`, `AnimatedGradientBg`, `AmbientGlow`,
  `MagicParticles`, `CursorAura`, `CinematicImageReveal`, `EditorialPortrait`, `EnhancedHeroName`,
  `MagicalGateway`, `Interlude`, `FloatingMagicalArrow`, `ScrollIndicator`, `QuoteReveal`, `JournalCard`.

## 5. Site structure / editorial concept

Self-described in `content/home/profile-bio.md`: *"part portfolio, part journal, part visual memory
bank. Every section opens like a chapter in an archive that is still being written."*
Owner: Computer Engineering student at IET DAVV Indore; code + cameras; Jammu & Kashmir.

Home is a threshold page composed of CMS-driven `configType` entries in `content/home/`:
`profile` (identity), `gateway` ×5, `quote` (interludes), `principle` ×3.
Gateways carry role labels: `01 // Builder` (portfolio), `02 // Thinker` (journal),
`03` (tech), `04 // Witness` (photography), `05 // Curator` (collection).

Page identity marks (`data-mark`): Portfolio = `WORK`, Journal = `JOURNAL`,
Photography = `FRAMES`, Collection = `INDEX`.

Per-collection content shape:
- **journal** — title, date, featuredImage, excerpt, readingTime (auto), **volume** (magazine issue,
  auto-assigned), tags, category (Life/People/Travel/Thoughts/Milestones), published flag, markdown body.
- **tech** — category (Tech News/Things I Like/Build Logs/Experiments/Linux/Networking/Programming),
  coverImage, excerpt, body.
- **photography** — category (Favorites/Life/Connected/Travel/Behind The Shot/Gear), coverImage,
  `galleryImages` list, description, `story` markdown.
- **portfolio** — techStack list, githubLink, liveLink, projectImage, featured flag.
- **collection** — category (Uses/Music/Books/Gear/Timeline/Inspirations/Favorites).
- **gear** — camera/lens/film/software entries. **timeline** — 2019→2024 milestones.
- **favorites** — short TIL notes and tool picks (~37 files).

## 6. Retheme effort notes

Because layout is centralised in `@theme` tokens plus the `.page-*` / `.image-frame` /
`.markdown-body` utilities, a retheme is mostly a token swap — but a lot of colour is hardcoded and
must become semantic tokens first. Exact counts measured in `src/**` on 2026-09-20:

| Hardcoded thing | Occurrences | Files |
|---|---|---|
| `#0a0a09` literal | 35 | 17 |
| `orange-*` utilities | 300 | 31 |
| `zinc-*` utilities | 953 | — |
| inline `rgb()/rgba()` in TSX | 58 | — |
| `font-serif` (resolves to Sora, a sans) | 74 | — |
| external Unsplash image URLs | 13 unique | components + `content/home` |

`zinc-*` is the biggest trap: those tokens are white alphas, so they invert meaning on a light
background. Recommended order: (1) add semantic tokens (`--color-bg`, `--color-ink`, `--color-accent`,
`--color-rule`), (2) fix `--font-serif` to a real serif, (3) replace the 35 `#0a0a09` literals and 58
inline rgba values, (4) re-map `zinc-*` / `orange-*` to the semantic tokens, (5) rework the
dark-only atmosphere components (`GlobalBackground`, `AmbientGlow`, `AnimatedGradientBg`,
`MagicParticles`, `CursorAura`) since glow effects assume a near-black canvas.
