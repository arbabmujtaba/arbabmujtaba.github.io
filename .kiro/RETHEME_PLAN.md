# Retheme Plan — "Rushes" film-lab direction

Target reference: https://rushes.framer.website/ (Framer template, "Rushes", credited to Marta Koziarz).
Goal: adopt that design language in the existing React/Vite codebase, keep **our own sections and
content**, and keep the authoring/admin workflow working.

Baseline snapshot: see `.kiro/PROJECT_CONTEXT.md` (commit `35d0b0c`).

---

## 0. Hard constraints (read first)

1. **Framer has no code export on any plan.** The reference cannot be imported. We reimplement its
   design language in our own components. (Third-party scrapers/plugins exist — Unframer, Reframe,
   NocodeXport — but they produce detached component dumps, not something that merges into this app.)
2. **Reimplement the style, not the content.** The reference's copy, photography, and section
   subjects (pricing tiers, client testimonials, staff bios) belong to its author. We take layout
   grammar, typography, motion, and palette; we write our own words and use our own images.
3. **GitHub Pages is a static host.** It cannot run `server.ts`, cannot process a contact form POST,
   and cannot serve Decap's OAuth token exchange. Anything requiring a server needs a decision
   (see §8).

## 1. What we are actually copying — the reference's design grammar

Extracted from the live page (text structure + served CSS):

**Typography**
| Role | Reference font | Availability |
|---|---|---|
| Display / UI | **Host Grotesk** | Google Fonts, variable `wght@300..800` — verified HTTP 200 |
| Mono accents | **Fragment Mono** | Google Fonts, roman + italic — verified HTTP 200 |

Both replace our current stack. Critically, this removes the existing `--font-serif: "Sora"` lie
(Sora is a sans; 74 `font-serif` usages currently render a sans). The Rushes direction is
**grotesk + mono, no serif** — so that bug disappears instead of needing a serif hunt.

**Palette (from the reference's own design tokens)**
| Token | Value | Role |
|---|---|---|
| bone | `#f4f2ed` | warm off-white — the inverted/light surface |
| ink | `#0a0a0a` | true near-black |
| ink-warm | `#1a1a18` | warm near-black, primary canvas |
| ink-cool | `#151519` | cool dark, secondary panels |
| surface | `#232323` | raised dark surface |
| signal | `#e4fe00` | acid lime — REC indicator / live accent |
| ember | `#e2612f` | burnt orange — primary accent |
| alarm | `#c22e1f` | deep red — destructive/alerts (useful in admin) |
| moss | `#7fa654` | muted green — success states |
| grey-1..3 | `#9a9a9e` `#7d7d83` `#696969` | text scale |
| hairline | `#ffffff1a` | 10% white rules |

Our current base is `#0a0a09` and accent `#f97316` — already ~70% of the way there. The retheme is a
*deepening*, not a reversal: warm the black, deepen the orange to `#e2612f`, add acid lime as a
sparing signal colour, and introduce bone `#f4f2ed` as a second surface for inverted sections.

**Layout / motion motifs**
- `REC:` eyebrow before every section (`rec: Berlin & Worldwide`, `REC: showcase`, `REC: SERVICES`…)
  — a camera/recording motif. This is the template's signature and it suits a photographer-engineer.
- Two-line lowercase display headings, stacked: `from rushes` / `to release`; `the money` / `it costs`.
- Numbered items with slash prefix: `01/ FILMS & DOCUMENTARIES`.
- Infinite marquee tickers (the reference duplicates content ×3 for seamless loops) — used for the
  category strip, the client logo row, the services list, and the footer.
- Count-up statistic sentence: "We've cut N+ projects, hit NM+ views… in N years."
- Uppercase category tags on cards (`BRAND MOVIE`, `DOCUMENTARY`).
- Real detail routes: `/work`, `/single-project/<slug>`, `/legal`, `/404`.
- Giant wordmark in the footer + two-line tagline.

## 2. Section mapping — their slots → our content

The reference is an agency site. Its slots map onto our archive cleanly, and **nothing needs to be
invented**:

| Rushes slot | Our replacement | Source |
|---|---|---|
| Hero animated wordmark ("GET IN TOUCH") | `ARBAB MUJTABA` letter-slot animation | `EnhancedHeroName` |
| Hero eyebrow `rec: Berlin & Worldwide` | `rec: Srinagar → Indore` | `content/home/profile-bio.md` |
| Numbered category ticker `01/ … 04/` | The 5 gateway roles: `01/ BUILDER`, `02/ THINKER`, `03/ TINKERER`, `04/ WITNESS`, `05/ CURATOR` | `content/home/gateway-*.md` `label` |
| Client logo marquee (pixels, forms, cobalt…) | Gear + tools marquee: Sony, Fuji, Nikon, Sigma, Kodak / neovim, tmux, ghostty | `content/gear/*`, `content/favorites/*` |
| Count-up stat sentence | "N projects · N frames · N volumes · N years" computed from CMS counts at build time | `src/lib/cms.ts` |
| `REC: showcase` (3 project cards) | Featured portfolio projects | `content/portfolio/*` (`featured: true`) |
| `REC: SERVICES` (4 numbered + description) | The 3 principles (Craft / Memory / Wonder) | `content/home/principle-*.md` |
| `REC: TEAM` (role-tagged person cards) | **Timeline** — `[2019] The Beginning`, `[2021] First Significant Build`… identical card grammar | `content/timeline/*` |
| `REC: PRICING` (numbered tier cards, mono body, price slot) | **Gear** — numbered, mono spec text, spec in the price slot | `content/gear/*` |
| `REC: TESTIMONIALS` (quote + attribution) | **Interludes / quotes** — already the same shape | `content/home/quote-*.md` |
| `REC: FAQ` (accordion) | **Favorites / TIL** — 37 short notes, accordion is the ideal container | `content/favorites/*` |
| `REC: CONTACT` (form) | Contact block — see §8 for the static-host problem | `Footer.tsx` |
| Footer giant wordmark + tagline | `ARBAB MUJTABA.` + "an archive still being written" | `content/home/profile-bio.md` |
| `/single-project/<slug>` detail pages | Detail routes per collection — replaces the current modal | §6 |

**Do not port**: pricing tiers, client testimonials, staff bios, booking CTAs. Those slots get our
content per the table above.

## 3. Phase plan

Each phase ends green: `npm run lint` + `npm run build` pass, and the site renders.

### Phase 0 — Safety rails
- Branch: `git checkout -b retheme/rushes`. Never work on `main`.
- Capture "before" screenshots of all 6 pages at 390px and 1440px for comparison.
- Add `npm run typecheck`/`test` scripts and wire `lint` + tests into `.github/workflows/deploy.yml`
  so the retheme can't silently break the build.
- Cost: small.

### Phase 1 — Token layer (no visual redesign yet)
- In `src/index.css` `@theme`, add semantic tokens: `--color-bg`, `--color-bg-warm`,
  `--color-surface`, `--color-ink`, `--color-ink-muted`, `--color-accent`, `--color-signal`,
  `--color-rule`, plus `--color-bone`.
- Add `[data-surface="bone"]` override block so any section can invert to the light surface.
- Swap fonts: `--font-display: "Host Grotesk"`, `--font-mono: "Fragment Mono"`. Delete
  `--font-serif: Sora`; map the existing `font-serif` class to the display font so all 74 usages
  keep working during transition.
- Re-point the existing `zinc-*` and `orange-*` scales at the new tokens so all **953 zinc** and
  **300 orange** usages retheme for free. Migrate names later, opportunistically.
- Replace the **35 hardcoded `#0a0a09` literals** (17 files) and the **58 inline `rgba()` values** in
  TSX — these are the ones that visibly break otherwise.
- Update the Google Fonts `<link>` in `index.html`; drop Inter/Sora/JetBrains Mono.
- Checkpoint: site still works, now in the new palette and type. This phase alone will look like 60%
  of the job done.
- Cost: medium. Highest leverage in the whole plan.

### Phase 2 — Motif primitives
New components in `src/components/rushes/` (one job each, all token-driven):
- `RecLabel` — the `REC: <name>` eyebrow (mono, uppercase, tracked, lime dot).
- `StackedHeading` — two-line lowercase display heading with clip-path reveal (reuse our existing
  `ease: [0.16, 1, 0.3, 1]`).
- `Marquee` — seamless infinite ticker, duplicates children ×3, pauses on hover, disabled under
  `prefers-reduced-motion`.
- `NumberedItem` — `01/ LABEL` + description row.
- `CountUpStat` — animated number sentence, `IntersectionObserver`-triggered, respects reduced motion.
- `TagChip` — uppercase category tag.
- `Accordion` — accessible disclosure (keyboard + `aria-expanded`) for the TIL section.
- `FrameCard` — the image/title/tag card with hairline border and hover rule.
- Cost: medium. These are small and independently testable.

### Phase 3 — Shell
- `Navigation`: adopt the reference's flat lowercase nav. Keep our 6 routes.
- `Footer`: giant wordmark + two-line tagline + link columns.
- Background: retire the glow stack (`AmbientGlow`, `AnimatedGradientBg`, `MagicParticles`,
  `CursorAura`) — they assume a black canvas and fight the bone surface. Replace with film grain +
  hairline grid + optional vignette in `GlobalBackground`/`BackgroundLayer`.
- Keep `App.tsx`'s outer border frame and corner ticks — they already read as camera framing marks.
- Cost: medium.

### Phase 4 — Home
Rebuild `src/pages/Home.tsx` section order to the reference's rhythm using the §2 mapping:
hero wordmark → role ticker → count-up stats → featured work → principles → timeline → interlude
quote → gear marquee → gateways → contact/footer. Keep `ArchiveSection`'s scroll-linked transforms;
retune amplitude (the reference is tighter and snappier than our current 70px drifts).
- Cost: large. This is the page that defines the look.

### Phase 5 — Inner pages
Per page, keep data flow, restyle to the new grammar:
- `Portfolio.tsx` → `REC: work` + numbered index rows + `FrameCard` grid.
- `Photography.tsx` → `REC: frames`, full-bleed plates, category tags, gallery strips.
- `Journal.tsx` → `REC: journal`, volume number as the numbered prefix, `JournalCard` restyled.
- `Tech.tsx` → `REC: logs`, mono-led list.
- `Collection.tsx` → `REC: index`, gear-as-tier-cards, TIL accordion.
- `.page-intro` / `.page-title` / `.page-eyebrow` / `.image-frame` utilities get restyled once in
  `index.css` and all 5 pages inherit it.
- Cost: large, but mostly mechanical after Phase 4.

### Phase 6 — Detail routes (replaces the modal)
All 5 pages currently open `ContentModal` — there are **no detail routes**, and `App.tsx`'s router is
a static path→view map. The reference uses real `/single-project/<slug>` pages, which is also better
for sharing and SEO.
- Extend the router with dynamic segments: `/journal/:slug`, `/photography/:slug`, `/portfolio/:slug`,
  `/tech/:slug`, `/collection/:slug`.
- Keep `ContentModal` for quick-look; add a full page view for direct links.
- **Blocker to fix here**: no `dist/404.html` is generated, so deep links already 404 on GitHub Pages
  today. Add a post-build copy of `index.html` → `404.html` (plus the SPA redirect shim). Without
  this, every new detail route is unreachable when shared.
- Add `meta description` + Open Graph tags, `robots.txt`, and a generated `sitemap.xml` while routes
  are being touched.
- Cost: medium-large.

### Phase 7 — Admin remix
Two separate questions, don't conflate them.

**7a. Restyle (always doable).** `src/pages/Admin.tsx` is 121 KB in one file. Split it first —
`admin/CollectionList`, `admin/EntryForm`, `admin/StateControls`, `admin/MediaPicker`,
`admin/DeployPanel` — then restyle against the same tokens. The reference's grammar maps well: mono
labels, `REC: draft/review/published` state tags, `alarm #c22e1f` for destructive actions,
`moss #7fa654` for published, `signal #e4fe00` for in-flight jobs. `LiveEditor`, `PublishingModal`,
`DeploymentCenter`, `PostCustomization` inherit the tokens.

**7b. "Make it work" — needs a decision, because today it cannot work in production:**
- `/admin` collides: static `dist/admin/index.html` (Decap) wins over the SPA route, so the 153 KB
  React admin ships but is unreachable.
- Its `/api/*` calls need `server.ts`, which GitHub Pages cannot run.
- Decap's `github` backend needs an OAuth token exchange GitHub Pages cannot serve.

Options:
- **(A) Local-only admin, properly.** Delete the Decap directory and the npm `decap-cms` dep, move
  the React admin to `/studio`, run it via `npm run dev` on the machine that holds the repo. Publish
  flow stays: edit locally → pipeline commits + pushes → Actions deploys. *Cheapest, zero new
  infrastructure, and it's what the publishing pipeline was already built for.*
- **(B) Admin in the browser from anywhere.** Keep the React admin, deploy `server.ts` to a small
  host (Fly/Render/Railway/VPS), point the site's `/api` at it, add real auth. Costs money and
  requires the security work in §7c regardless.
- **(C) Decap only.** Delete the React admin (−153 KB from the bundle), stand up a Decap OAuth proxy,
  lose the custom publishing pipeline, state registry, live editor, and deployment centre.

Recommendation: **(A)**, then revisit (B) later if editing from a phone becomes a real need.

**7c. Harden `server.ts` — do this in Phase 7 regardless of A/B/C**, because the retheme means
running it constantly:
- Whitelist `:collection` against the known collections array; validate `:slug` with the existing
  `SLUG_PATTERN` in `ValidationService.ts` (currently unused on those routes). This closes the
  verified path traversal (`GET /api/content/journal/..%2F..%2FREADME` leaks files today) and the
  matching arbitrary `.md` delete.
- Sanitise `req.body.collection` in the multer destination handler.
- Bind `127.0.0.1` instead of `0.0.0.0`; drop `Access-Control-Allow-Origin: *`; require a shared
  secret header on mutating routes.
- Actually load `dotenv` (it's a dependency that is never imported, so `.env` is silently ignored).
- Cost: medium. The hardening itself is small and high value.

### Phase 8 — Assets and content
- **Image optimizer** (must-do, the new design is image-heavy): add a `sharp`-based
  `scripts/optimize-images.ts` generating `-480/-768/-1536.webp` into `public/uploads/optimized/`,
  wired as a `prebuild` step and called after CMS upload. Today all 38 originals happen to have
  derivatives, but nothing regenerates them — and `getLocalWebpSources` emits a `<picture><source>`,
  which has no automatic fallback, so the next upload renders a broken image.
- Replace the **13 Unsplash placeholder URLs** with own photographs (including
  `CinematicImageReveal`'s default and the home gateway images) — a personal archive shouldn't run on
  stock photos.
- Consider trimming the 35 MB `public/uploads` (23 MB of it photography, one file 6.1 MB) — it is
  redeployed on every build.
- Decide on `content/tech/`'s three cracked-app posts before a redesign draws more traffic
  (DMCA/TOS exposure on a public repo under a real name).

### Phase 9 — Verify and polish
- `npm run lint`, `npm run build`, `npx tsx tests/contentState.test.ts` all green.
- Enable `"strict": true` in `tsconfig.json` and fix the fallout (currently absent, so the passing
  typecheck is a weak signal). Do this last — it will surface real errors.
- Manual pass: 390 / 768 / 1440 px; `prefers-reduced-motion`; keyboard nav through the accordion and
  detail routes; colour contrast on bone and on ink surfaces.
- Remove the unused deps found in the audit: `@google/genai`, `react-hook-form`, `zod`, duplicate
  `vite` in `dependencies`, and `decap-cms` if option (A) or (B) is chosen.
- Rename `package.json` from `react-example`; write a real README.

## 4. Order of execution, with checkpoints

```
0 rails ─→ 1 tokens ─→ 2 primitives ─→ 3 shell ─→ 4 home ─→ 5 inner pages ─→ 6 routes+404
                                                      │
                          7 admin (7c hardening can run in parallel any time)
                                                      │
                                              8 assets ─→ 9 verify+strict
```
Phases 1–3 are the reusable foundation; if the direction feels wrong, it's cheap to bail after
Phase 3. Phase 4 is the point of no return aesthetically.

## 5. Decisions needed before Phase 1

1. **Dark-only, or dark + bone inverted sections?** (Recommendation: dark canvas `#1a1a18`, bone
   `#f4f2ed` for Journal reading and the Collection index — the reference itself uses both.)
2. **Accent**: keep our `#f97316`, or move to the reference's ember `#e2612f`? And do we adopt acid
   lime `#e4fe00` as a sparing signal colour? (Recommendation: ember primary + lime signal only.)
3. **Admin strategy: A, B, or C** from §7b. (Recommendation: A.)
4. **Contact section**: the reference has a working form; a static host can't process one. Use a
   third-party endpoint (Formspree/Basin), or replace with a mailto + social links block?
   (Recommendation: mailto block now, form later only if B is chosen.)
5. **`REC:` motif** — keep it literally (`REC: frames`) or translate it to an archival register
   (`FILE: frames`, `PLATE 04`)? The camera version fits the photography half better.
