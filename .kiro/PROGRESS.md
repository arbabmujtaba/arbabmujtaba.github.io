# Progress — resume here

Last verified 2026-10-07 on `main`.

## This pass (2026-10-07): publish, hero, the door, the desk, more magic

| Check | Result |
|---|---|
| `npm run lint` / `typecheck` | clean (strict) |
| `npm test` | 10 suites green, incl. new `publishing` (38) and the Saptarishi checks in `hiddenLayer` (51) |
| `npm run build` + `verify:dist` | 317 checks, 44 routes |
| Headless Chromium on `dist/` | 28 page loads (320/390/768/1440, night/day, reduced motion): 0 overflow, 0 broken images, 0 console errors |
| Admin on `PORT=3100` | dashboard renders in night/day/390 with the refreshed studio styles |

- **Publishing stuck** — `POST /api/publish` now answers 202 at once and the pipeline runs in the
  background (`PublishingService.start`); `git push` can no longer hang on a hidden credential prompt
  (`GIT_TERMINAL_PROMPT=0`, timeouts, classified errors with hints, "Retry push"); the modal can always
  be closed, falls back to polling, and resumes after a reload; a failure no longer discards the saved
  file; every collection validates (date only where dated).
- **Hero** — full-bleed under a floating header, a 3:2 crop of the dusk frame at 1280/1920/2560
  (`npm run hero:image`), no opacity wash, a one-shot "develop" on arrival.
- **Constellation** — only the Saptarishi figure, walked edge by edge, unlocks (`src/lib/constellation.ts`);
  decoy stars, a broken attempt resets, a ghost of the figure after two misses.
- **The secret door** — the rooms chunk is warmed on idle/hover; the shelf no longer waits 900 ms before
  fetching it (click → room 1.4 s → 0.6 s at 4× CPU); `lib/scrollLock.ts` stops the scrollbar reflow;
  rooms share one entrance pace, have their own threshold (doors / curtain), an opaque floor, a sticky
  way out, and pause the page behind.
- **"Ink, still drying" merged into "On the desk, lately"** — the duplicate list is gone; the shelf
  stands under the desk's pile, with volumes settling in, neighbours leaning from the odd book, a keyhole
  under the wand, dust when it is pulled.
- **Found on a phone** — a one-time invitation (`trigger: invitation`, switchable in Secrets) with a
  "Pick up the wand" button; a gilt dot on the wand until it is first used; the ledger shows from 0/7 once
  invited; Lumos follows a touch; shaking an Android phone levitates; a touch guide on first pickup.
- **New magic** — Revelio (shows what is enchanted on screen), Accio (summons a journal line), "mischief
  managed", the ⌘K / `/` index (`Palette.tsx`: pages, every entry, spells, light), section labels that
  decode on arrival, one shooting star at night.


## Earlier pass (2026-10-02)

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
