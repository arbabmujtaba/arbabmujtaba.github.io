# Retheme progress — resume here

Branch `retheme/rushes`. Last verified 2026-09-20. Plan: `.kiro/RETHEME_PLAN.md`.

## Verified state

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | passes, **strict** |
| Tests | `npm test` | 20 content-state + 18 routing, 0 failed |
| Build | `npm run build` | passes, ~2s, then 39 route shells + 404.html + sitemap.xml |
| Dist integrity | `npm run verify:dist` | 282 checks across 39 routes |
| Install | `npm ci` | 310 packages (was 1033) |
| Initial chunk | `dist/assets/index-*.js` | 343 kB |

CI (`.github/workflows/deploy.yml`) now runs typecheck and tests before the build and
`verify:dist` after it. It previously ran the build alone.

Verified in headless Chromium as well (throwaway harnesses, not committed — they need a
browser, which CI does not guarantee):

- **Routing, 19/19** — a hard-loaded detail URL renders the page not the overlay; cards are
  real anchors; a click pushes the URL and opens the drawer; back, Escape and the close
  button agree; a frame with no story body still renders; unknown paths and stale slugs
  render the 404 view.
- **Responsive** — no horizontal overflow at 390 / 768 / 1440 px across 12 routes.
- **Reduced motion** — no text stranded at opacity 0 under `prefers-reduced-motion`.
- **Contrast** — 0 of 850 text nodes below WCAG AA across 9 routes, on both surfaces.
- **Keyboard** — the accordion takes focus, toggles `aria-expanded`, and its `aria-controls`
  resolves to a visible panel.

## Phases done

- **0–4** — safety rails, token layer, motif primitives, shell, Home.
- **5** — all five inner pages in the rushes grammar.
- **6** — real detail routes, complete and verified. See below.
- **7c** — `server.ts` hardened: collection whitelist + slug pattern on every path-mapping
  route (closes the verified traversal), multer destination validated, bound to `127.0.0.1`,
  wildcard CORS dropped, `dotenv/config` imported.
- **8** — image pipeline (`scripts/optimize-images.ts`, sharp, incremental) and the image map
  applied to `src/` as well as content. **Every image on the site is now the owner's**: zero
  external image URLs remain in `src/` or `content/`.
- **9** — strict mode on, unused dependencies gone, package renamed, real README, contrast
  fixed. Remaining: the two content decisions below.

## Phase 6, as built

- `src/lib/collections.ts` — collection names, labels, `detailPath`. **Dependency-free on
  purpose**: importing `entries.ts` (and so `cms.ts`, which inlines every markdown file) from
  `App` pushed the initial chunk 340 → 410 kB. Keep it that way.
- `src/lib/entries.ts` — the one `DetailEntry` resolver, plus `getDetailNeighbours`. Reached
  only from lazy surfaces.
- `src/lib/navigation.ts` — `parseRoute`, `navigate`, `NAVIGATION_EVENT`,
  `shouldInterceptClick`, `isQuickLookState`. `pushState` does not fire `popstate`, hence the
  custom event; `App` listens to both and always re-derives from the URL.
- `src/lib/entryNavigation.ts` — `useOpenEntry()` context so cards do not thread callbacks.
- `src/components/QuickLook.tsx` — lazy wrapper owning the lookup, prefetched on idle.
- `src/pages/Entry.tsx`, `src/pages/NotFound.tsx`, `src/components/AppLink.tsx`.
- `ContentModal` has `variant: 'overlay' | 'page'` — one renderer, two presentations.
- `FrameCard`, `NumberedItem`, `JournalCard` take an optional `href` and render real anchors.
- `scripts/postbuild.ts` writes `dist/<route>/index.html` for every route (served 200, so no
  404-and-redirect shim), `404.html`, and `sitemap.xml`, with per-route title, description,
  canonical and OG tags. `public/robots.txt` is static. `scripts/routes.ts` reads `content/`
  with `gray-matter` because `cms.ts` only exists inside a Vite build — the two lists must
  agree; see the header comment there.

## Open decisions — these need you, not more code

1. **Admin strategy (§7b of the plan).** Today `/admin` cannot work in production: the static
   Decap page shadows the SPA route, the React admin's `/api/*` needs `server.ts`, and Decap's
   OAuth exchange cannot be served by Pages. Options: **(A)** local-only admin moved to
   `/studio`, delete `public/admin/`; **(B)** deploy `server.ts` somewhere and add real auth,
   so you can edit from a phone; **(C)** Decap only, via an OAuth proxy, losing the custom
   pipeline. The plan recommends A. Nothing here is blocking — the publish flow works locally
   today. The `decap-cms` npm package is already gone; `public/admin/` (CDN-loaded) is untouched.
2. **`public/uploads` is 35 MB** and is redeployed on every build, 6.1 MB in one file. Trimming
   means deleting or re-encoding your originals, so it is your call.
3. **`content/tech/` has three posts about cracked/pirated apps**, published under a real name
   on a public repo. DMCA/TOS exposure. Unpublish, rewrite, or keep.

## Smaller leftovers

- `src/pages/Admin.tsx` is still one 121 kB file; the plan's §7a split
  (`admin/CollectionList`, `EntryForm`, `StateControls`, `MediaPicker`, `DeployPanel`) is
  untouched, as is its own contrast pass — a few 10 px `text-zinc-600` labels remain in
  Admin, DeploymentCenter and PostCustomization. Local-only surfaces, so they were left out
  of the public pass.
- `content/journal/growing-up.md` repeats its opening paragraph as the excerpt, so the detail
  page shows the same sentences twice. Editorial, so left alone.
