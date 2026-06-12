# Build Chunk 1 Report — Scroll Utility + App Core Routing & Scroll

## Files Created
- `src/lib/scroll.ts` — new utility exporting `resetAllScrolls()`

## Files Modified
- `src/App.tsx` — routing, scroll restoration, and scroll-to-top logic updated

## Changes Summary

### `src/lib/scroll.ts`
- Created `resetAllScrolls()` that:
  - Calls `window.scrollTo({ top: 0, left: 0, behavior: 'instant' })` when `typeof window !== 'undefined'`
  - Finds all `.custom-scrollbar` elements via `querySelectorAll` and scrolls each to `0,0` with `behavior: 'instant'` when `typeof document !== 'undefined'`

### `src/App.tsx`
- Added `useCallback` to the React import
- Imported `resetAllScrolls` from `./lib/scroll`
- Added `PATH_TO_VIEW` and `VIEW_TO_PATH` maps at module scope
- Added `getViewFromPath(path)` helper that normalizes trailing slashes and defaults to `'home'`
- Changed initial `useState` to read from `window.location.pathname` via `getViewFromPath`
- Renamed state setter to `setViewState`; wrapped `setView` in `useCallback` with `pushState` logic
- Added mount `useEffect` to set `history.scrollRestoration = 'manual'`
- Replaced old scroll-to-top `useEffect` with `resetAllScrolls()` call + 800ms deferred repeat
- Replaced broken `popstate` handler with correct `getViewFromPath`-based view restoration
- Header name click (`onClick={() => setView('home')}`) continues to use the wrapped `setView`

## Lint Results
- `npm run lint` (runs `tsc --noEmit`) passed with **zero errors**

## Preservation Check
- All JSX structure, layout, className values, motion configs, `AnimatePresence mode="wait"`, backdrop overlay, cursor aura, global background, decorative corners, floating arrow, and all page components remain **completely unchanged**
- No visual presentation, animation timing, or styling was modified
