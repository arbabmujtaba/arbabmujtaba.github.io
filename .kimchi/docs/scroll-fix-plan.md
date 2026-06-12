# Scroll Fix Plan — Navigation Behavior

## Problem Summary

When navigating between pages (Portfolio, Journal, Tech, Photography, Collection, deeper pages), users land at previously-remembered scroll positions instead of the top of the destination page. This is especially noticeable on mobile.

## Root Causes Identified

1. **`document.querySelector('.custom-scrollbar')` race condition**: App.tsx scrolls on `view` change, but `AnimatePresence mode="wait"` leaves the old page in the DOM during exit animation. `querySelector` matches the first element, which may be the **old** page's container — or nothing if the new page hasn't mounted yet.

2. **Redundant/inconsistent scroll handling**: Navigation.tsx independently queries and scrolls `.custom-scrollbar` before calling `setView`. Both App.tsx and Navigation.tsx try to scroll, with neither guaranteed to hit the correct container.

3. **Browser scroll restoration**: No `history.scrollRestoration = 'manual'` is set. Mobile browsers aggressively restore scroll positions, especially on back/forward navigation and tab restores.

4. **ContentModal doesn't reset scroll on open**: When opening a project or journal entry, the modal retains the previous scroll position. Opening a new article lands the user at the previous article's scroll depth.

5. **`popstate` handler is broken**: The `popstate` listener always maps every non-admin path to `'home'`, breaking back/forward navigation entirely.

6. **No URL tracking for views**: `pushState` is never called, so the URL stays `/` regardless of which section is active. This prevents direct linking to sections and breaks browser back/forward expectations.

## Files to Change

| File | Change |
|------|--------|
| `src/lib/scroll.ts` | **New** — centralized scroll-reset utility |
| `src/App.tsx` | Fix routing (`pushState`/`popstate`), disable browser scroll restoration, replace naive `querySelector` scroll effect with robust deferred reset |
| `src/components/Navigation.tsx` | Remove redundant `querySelector` scroll in `handleNavigate`; rely on App.tsx centralized handling |
| `src/components/ContentModal.tsx` | Scroll modal content to top when `isOpen` becomes true |
| `src/pages/Home.tsx` | No functional change required (already delegates to `setView` prop) |

## Chunk Breakdown

### Chunk 1 — Scroll Utility + App Core Routing & Scroll (COMPLEX)
**Builder tier:** Heavy (`kimchi-dev/kimi-k2.6`)

**Files:**
- `src/lib/scroll.ts`
- `src/App.tsx`

**Details:**

1. **Create `src/lib/scroll.ts`**:
   - Export `resetAllScrolls()` function
   - Calls `window.scrollTo({ top: 0, left: 0, behavior: 'instant' })`
   - Finds ALL `.custom-scrollbar` elements via `querySelectorAll` and scrolls each to `0,0` with `behavior: 'instant'`
   - Safe for SSR/browser environments

2. **Update `src/App.tsx`**:
   - Add `PATH_TO_VIEW` map (normalized paths → view names):
     ```
     '/'          → 'home'
     '/portfolio' → 'portfolio'
     '/journal'   → 'journal'
     '/tech'      → 'tech'
     '/photography' → 'photography'
     '/collection'  → 'collection'
     '/admin'     → 'admin'
     ```
   - Add `VIEW_TO_PATH` reverse map
   - Helper `getViewFromPath(path): string` — normalizes trailing slashes, defaults to `'home'`
   - Read initial `view` from `window.location.pathname` using `getViewFromPath`
   - Wrap `setView` in `useCallback`:
     - Computes target path from `VIEW_TO_PATH`
     - Calls `window.history.pushState({ view: newView }, '', path)` **only if** current pathname differs
     - Then calls `setViewState(newView)`
   - On mount, set `history.scrollRestoration = 'manual'` (guard with `'scrollRestoration' in history`)
   - Replace the existing `useEffect` for scroll-to-top:
     ```tsx
     useEffect(() => {
       resetAllScrolls();
       const timer = setTimeout(() => resetAllScrolls(), 800);
       return () => clearTimeout(timer);
     }, [view]);
     ```
     The 800ms timeout is slightly longer than the 0.72s `AnimatePresence` exit animation, ensuring the new page's `.custom-scrollbar` container exists in the DOM.
   - Fix `popstate` handler:
     ```tsx
     useEffect(() => {
       const handlePopState = () => {
         const targetView = getViewFromPath(window.location.pathname);
         setViewState(targetView);
       };
       window.addEventListener('popstate', handlePopState);
       return () => window.removeEventListener('popstate', handlePopState);
     }, []);
     ```
     (Note: uses `setViewState` directly to avoid pushing a duplicate history entry.)
   - Update the header name click to use the wrapped `setView('home')`.
   - **Preserve** all existing layout, animations, styling, motion configs, `AnimatePresence`, backdrop overlay, and decorative elements.

**Acceptance criteria:**
- `window.history.pushState` updates the URL when navigating views
- `popstate` correctly restores the previous view from the URL
- `history.scrollRestoration` is `'manual'` after mount
- The scroll effect calls `resetAllScrolls()` immediately and again after 800ms
- No `querySelector('.custom-scrollbar')` remains in App.tsx
- All existing animation transitions, timing, and styling remain unchanged

---

### Chunk 2 — Navigation & Modal Scroll Fixes (SIMPLE)
**Builder tier:** Standard (`kimchi-dev/minimax-m2.7`)

**Files:**
- `src/components/Navigation.tsx`
- `src/components/ContentModal.tsx`

**Details:**

1. **Update `src/components/Navigation.tsx`**:
   - In `handleNavigate(id)`, remove the `document.querySelector('.custom-scrollbar')` block entirely
   - Keep only `setView(id);`
   - All other nav code (desktop, mobile, styling, motion) stays identical

2. **Update `src/components/ContentModal.tsx`**:
   - Add `const modalRef = useRef<HTMLDivElement>(null);`
   - In the existing `useEffect` that manages `document.body.style.overflow`, add scroll reset inside the `isOpen` branch:
     ```tsx
     if (isOpen) {
       document.body.style.overflow = 'hidden';
       requestAnimationFrame(() => {
         modalRef.current?.scrollTo({ top: 0, behavior: 'instant' });
       });
     }
     ```
   - Attach `ref={modalRef}` to the scrollable `motion.div` (the one with `overflow-y-auto custom-scrollbar`)
   - **Preserve** all existing modal content, layout, animations, styling, and behavior.

**Acceptance criteria:**
- Navigation.tsx no longer contains any `querySelector` or `scrollTo` calls
- ContentModal scrolls to top every time it opens
- All existing styling, animation, and responsive behavior preserved

---

## Testing Notes for Review

1. Click each nav item (desktop and mobile) and verify the destination page is at the top.
2. Scroll down on Portfolio, open a project in ContentModal, close it, click Journal — Journal should open at the top.
3. On mobile Safari (or dev tools mobile emulation), scroll down on a page, navigate away, then use the browser Back button — should land at the top of the previous page, not at the remembered scroll position.
4. Open ContentModal, scroll down within it, close it, open a different entry — should open at the top of the new entry.
5. FloatingMagicalArrow scroll-down/scroll-up interactions should continue working correctly.
6. Home page gateway buttons should still navigate and land at the top of destination pages.
7. Admin page access via `/admin` should still work correctly.
