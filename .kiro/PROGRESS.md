# Retheme progress — resume here

Branch `retheme/rushes`. Last verified 2026-09-20. Plan: `.kiro/RETHEME_PLAN.md`.

## Verified state at the last commit

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run lint` | passes, 0 errors |
| Build | `npm run build` | passes, 1.82s |
| Postbuild | (part of `build`) | 39 route shells (6 pages, 33 entries), 404.html, sitemap.xml |
| Tests | `npx tsx tests/contentState.test.ts` | 20 passed, 0 failed |
| Initial chunk | `dist/assets/index-*.js` | 343 kB (was 340 kB before phase 6) |

`content-state.json` is mutated by the test run and must be reverted afterwards
(`git checkout -- content-state.json`) — the suite writes `lastUpdated`.

## Phases done

- **0–4** — committed earlier: safety rails, token layer, motif primitives, shell, Home.
- **5 — inner pages.** All five restyled to the rushes grammar: Portfolio, Photography,
  Journal, Tech, Collection.
- **6 — detail routes.** Described below.
- **7c — `server.ts` hardening.** Collection whitelist + slug pattern on every route that
  maps input onto a path (closes the verified traversal), multer destination validated,
  bound to `127.0.0.1`, wildcard CORS dropped, `dotenv/config` actually imported.
- **8 — partial.** `scripts/optimize-images.ts` (sharp, incremental, `--force`), 117
  derivatives regenerated, all 13 Unsplash placeholders in content replaced with the
  owner's photographs per `.kiro/IMAGE_MAP.md`.

## Phase 6, as built

Routing moved from a static path→view map to a parsed route.

- `src/lib/collections.ts` — collection names, labels, `detailPath`. **Dependency-free on
  purpose**: importing `entries.ts` (and so `cms.ts`, which inlines every markdown file)
  from `App` pushed the initial chunk 340 → 410 kB. Keep it that way.
- `src/lib/entries.ts` — the one `DetailEntry` resolver over the cms getters, plus
  `getDetailNeighbours` for prev/next. Reached only from lazy surfaces.
- `src/lib/navigation.ts` — `parseRoute`, `navigate`, `NAVIGATION_EVENT`,
  `shouldInterceptClick`, `isQuickLookState`. `pushState` does not fire `popstate`, hence
  the custom event; `App` listens to both and always re-derives from the URL.
- `src/lib/entryNavigation.ts` — `useOpenEntry()` context so cards do not thread callbacks.
- `src/components/QuickLook.tsx` — lazy wrapper owning the lookup, prefetched on idle.
- `src/pages/Entry.tsx`, `src/pages/NotFound.tsx`.
- `ContentModal` gained `variant: 'overlay' | 'page'`. One renderer, two presentations, so
  `/journal/<slug>` and the drawer cannot drift apart.
- `FrameCard`, `NumberedItem`, `JournalCard` take an optional `href` and render real
  anchors — crawlable, cmd-clickable — while a plain left click still opens the quick look.
- The five pages no longer hold modal state; `App` owns one overlay instance.

Deep links on GitHub Pages: `scripts/postbuild.ts` writes `dist/<route>/index.html` for
every route (served 200, unlike the usual 404-and-redirect shim), `dist/404.html` as the
catch-all, and `dist/sitemap.xml`. Per-route `<title>`, description, canonical and OG tags
are injected into each shell. `public/robots.txt` is static. `scripts/routes.ts` reads
`content/` with `gray-matter` because `cms.ts` only exists inside a Vite build — the two
lists must be kept in agreement, see the header comment there.

## Next

1. **Phase 6 tail** — manual route check in the browser: hard-load `/journal/<slug>`,
   quick-look open/close against the back button, Escape, an unknown path, and
   `/photography/<slug>` for a frame with no story body.
2. **Phase 7a/7b** — the admin decision. Plan recommends (A): local-only admin at
   `/studio`, delete the Decap directory and the `decap-cms` dep.
3. **Phase 8 tail** — `CinematicImageReveal`'s default Unsplash URL and
   `content/journal/growing-up.md`'s `featuredImage` are the last two placeholders. Decide
   on the 35 MB `public/uploads`, and on the three cracked-app posts in `content/tech/`.
4. **Phase 9** — `"strict": true` in tsconfig and the fallout; drop the unused deps
   (`@google/genai`, `react-hook-form`, `zod`, duplicate `vite`); rename `package.json`
   from `react-example`; real README; 390/768/1440 px pass; contrast on bone.
