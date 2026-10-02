# Progress — resume here

Last verified 2026-10-02 on `main` (uncommitted working tree — nothing has been committed or pushed).

## This pass: the magical layer + personal timeline

| Check | Result |
|---|---|
| `npm run typecheck` | clean (strict) |
| `npm test` | 9 suites green, incl. new `hiddenLayer` (35) and `adminModel` (11) |
| `npm run build` + `verify:dist` | 303 checks, 42 routes |
| Headless Chromium on `dist/` (`/tmp/harness`, not committed) | 30/30 interaction checks; 72 page loads (390/768/1440, night/day, reduced motion) with 0 overflow, 0 stranded text, 0 errors |
| Admin on `PORT=3100 npm run dev` | Secrets switch writes `visible` and restores; timeline/portfolio editors and preview frame load |

## Root cause of "animations break after deploy"

Pages scrolled the window, but every page wrapped itself in an `overflow-y-auto` box whose height was
never bounded, so it never scrolled. `useScroll({ container })`, the timeline rail and the floating
arrow read its scrollTop (always 0) — dead everywhere, most visible on the live site. Fixed by using
window scroll; arrow rewritten without its 400 ms `setInterval`. Also: arbitrary `transition-[…]`
lists missed Tailwind v4's `scale`/`translate` properties (hover zooms snapped), `vite:preloadError`
reload for stale tabs, `/admin` chunk excluded from production.

## New pieces

- `content/timeline/` — 8 chapters, 2019–2026, with `place` (Sopore ≤2022, Indore ≥2023). The five
  old project milestones were removed on purpose (replaced as requested).
- `content/secrets/` — 18 seed files (3 rooms, 2 notes, 6 eggs, 7 ink lines).
- `src/lib/magic.tsx` (state), `secrets.ts`, `thoughts.ts`/`thoughtLines.ts`, `gestures.ts`,
  `places.ts`, `sound.ts`; `src/components/magic/*`; rushes: `ChapterTimeline`, `MemoryMap`,
  `LivingJournal`, `ThoughtDrawer`, `Bookshelf`, `ArchiveDoor`. `SoftTimeline` deleted.
- Gateway plates re-assigned (see IMAGE_MAP addendum).

## Open decisions (unchanged, still need the owner)

1. `content/tech/` cracked-software posts (DMCA/TOS exposure).
2. `public/uploads` size.
3. Decap at `/admin` on Pages cannot log in without an OAuth proxy.
