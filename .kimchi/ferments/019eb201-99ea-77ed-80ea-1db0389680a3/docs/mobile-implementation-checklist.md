# Master Implementation Checklist
## Mobile Experience Redesign — Implementation Plan
### Ferment: 019eb201-99ea-77ed-80ea-1db0389680a3

---

## HOW TO USE THIS CHECKLIST

Each item has:
- **Phase**: Implementation phase (1-8)
- **File**: Exact file path to edit
- **Line**: Approximate line number
- **Change**: Exact code change needed
- **Verification**: How to confirm the fix

---

## PHASE 1: Fix Horizontal Scrolling

### P1.1 — Add `overflow-x-hidden` to App root
- **File**: `src/App.tsx` (line ~20)
- **Current**: `<div className="min-h-screen bg-[#0a0a09] text-zinc-100 flex flex-col relative box-border selection:bg-orange-500/30">`
- **Change**: Add `overflow-x-hidden` to className
- **Verify**: Check 320px breakpoint, no horizontal scrollbar

### P1.2 — Reduce border frame margins on mobile
- **File**: `src/App.tsx` (line ~43)
- **Current**: `m-3 md:m-6 lg:m-8 border border-zinc-800/50`
- **Change**: `m-1 sm:m-3 md:m-6 lg:m-8 border-0 sm:border border-zinc-800/50`
- **Verify**: 320px screen has usable width > 300px

### P1.3 — Fix text-outline overflow in page heroes
- **Files**: 
  - `src/pages/Portfolio.tsx` (~line 29): `text-[6rem] sm:text-[8rem] md:text-[14rem]`
  - `src/pages/Journal.tsx` (~line 31): same
  - `src/pages/Tech.tsx` (~line 30): same
  - `src/pages/Photography.tsx` (~line 27): `text-[5rem] sm:text-[7rem] md:text-[12rem]`
  - `src/pages/Collection.tsx` (~line 28): `text-[6rem] sm:text-[8rem] md:text-[14rem]`
- **Change**: Add `hidden sm:block` to the outline text divs OR scale down mobile sizes:
  - `text-[3rem] sm:text-[5rem] md:text-[8rem] lg:text-[14rem]`
- **Verify**: No horizontal overflow at 320px on any page

### P1.4 — Fix Journal audio player w-max
- **File**: `src/pages/Journal.tsx` (~line 118)
- **Current**: `className="... w-max ..."`
- **Change**: `className="... w-full max-w-sm ..."`
- **Verify**: Audio player fits within 320px viewport

### P1.5 — Fix CinematicImageReveal h-[118%]
- **File**: `src/components/CinematicImageReveal.tsx` (~line 72)
- **Current**: `className="h-[118%] w-full object-cover ..."`
- **Change**: `className="h-full w-full object-cover ..."`
- **Verify**: Image doesn't overflow container

### P1.6 — Fix ParallaxImage overflow
- **File**: `src/components/ParallaxImage.tsx` (~line 26)
- **Current**: Inner motion.div has `height: '130%', top: '-15%', position: 'absolute'`
- **Change**: Wrap in overflow-hidden OR reduce to `height: '115%', top: '-7.5%'` on mobile
- **Verify**: No overflow from parallax containers

---

## PHASE 2: Fix Layout Overflows

### P2.1 — MagicalGateway mobile height
- **File**: `src/components/MagicalGateway.tsx` (~line 52)
- **Current**: `min-h-[21rem] overflow-hidden ... md:min-h-[26rem]`
- **Change**: `min-h-[12rem] sm:min-h-[16rem] overflow-hidden ... md:min-h-[26rem]`
- **Verify**: Cards don't exceed 375px viewport height

### P2.2 — Home page hero padding
- **File**: `src/pages/Home.tsx` — check hero section classes
- **Current**: Likely has large negative margins or translate
- **Change**: Add `overflow-hidden` to hero parent container

### P2.3 — Portfolio case study image container
- **File**: `src/pages/Portfolio.tsx` (~line 54)
- **Current**: `aspect-[4/3]` images with parallax
- **Change**: Add `overflow-hidden` to image wrapper
- **Verify**: Project images don't overflow their grid cells

### P2.4 — Tech page grid fix
- **File**: `src/pages/Tech.tsx`
- **Current**: `grid grid-cols-1 md:grid-cols-2` for tech stack
- **Change**: Ensure single column on mobile works with adequate spacing
- **Verify**: No overflow at 320px

### P2.5 — ContentModal mobile width
- **File**: `src/components/ContentModal.tsx` (~line 63)
- **Current**: `w-full max-w-4xl`
- **Change**: `w-full max-w-4xl sm:max-w-full md:max-w-2xl lg:max-w-4xl`
- **Verify**: Modal fits within 320px viewport

---

## PHASE 3: Fix Image Sizing

### P3.1 — Add `loading="lazy"` to all images
- **Files**: 
  - `src/components/CinematicImageReveal.tsx`
  - `src/components/ParallaxImage.tsx`
  - `src/components/ContentModal.tsx`
  - `src/pages/Portfolio.tsx`
  - `src/pages/Journal.tsx`
  - `src/pages/Photography.tsx`
  - `src/components/MagicalGateway.tsx` (already has it)
- **Change**: Add `loading="lazy"` to all `<img>` tags
- **Verify**: Browser DevTools Network tab shows lazy loading

### P3.2 — Fix aspect-[21/9] in Photography
- **File**: `src/pages/Photography.tsx`
- **Current**: `aspect-[21/9]` on spanning image
- **Change**: `aspect-[16/9] sm:aspect-[21/9]`
- **Verify**: At 320px, image is at least 180px tall

### P3.3 — Fix aspect-[16/10] in CinematicImageReveal
- **File**: `src/components/CinematicImageReveal.tsx`
- **Current**: `aspect-[16/10]` on container
- **Change**: `aspect-[4/3] sm:aspect-[16/10]`
- **Verify**: Image not too short on mobile

### P3.4 — Fix CinematicImageReveal min-height
- **File**: `src/components/CinematicImageReveal.tsx` (~line 64)
- **Current**: `min-h-[72vh] md:min-h-screen`
- **Change**: `min-h-[40vh] sm:min-h-[72vh] md:min-h-screen`
- **Verify**: Section doesn't consume entire mobile viewport

### P3.5 — Reduce Unsplash image sizes for mobile
- **Files**: All pages with Unsplash URLs
- **Change**: Change `w=1800`/`w=2400` to `w=800` for mobile (or add srcset)
- **Verify**: Images load faster on mobile

---

## PHASE 4: Fix Spacing Issues

### P4.1 — Page padding reduction on mobile
- **Files**: `src/pages/*.tsx` (all pages)
- **Current**: `p-6 md:p-12 lg:p-16`
- **Change**: `px-4 sm:px-6 md:p-12 lg:p-16`
- **Verify**: Content has adequate side padding at 320px

### P4.2 — Section margin reduction
- **Files**: All page files
- **Current**: `mb-24 md:mb-32`
- **Change**: `mb-16 md:mb-24 lg:mb-32`
- **Verify**: Sections aren't excessively spaced on mobile

### P4.3 — Space-y reduction for content lists
- **Files**: Various pages
- **Current**: `space-y-32`
- **Change**: `space-y-16 md:space-y-24 lg:space-y-32`
- **Verify**: Lists don't have huge gaps on mobile

### P4.4 — Card padding reduction
- **Files**: `src/components/MagicalGateway.tsx`, page cards
- **Current**: `p-6 md:p-8`
- **Change**: `p-4 sm:p-6 md:p-8`
- **Verify**: Cards have comfortable padding on 320px

---

## PHASE 5: Fix Navigation and Scroll Restoration

### P5.1 — Add scroll-to-top on route change
- **File**: `src/App.tsx`
- **Add**: After `setView()` is called, scroll the active container to top
- **Code**:
```tsx
useEffect(() => {
  const container = document.querySelector('.custom-scrollbar');
  if (container) container.scrollTo({ top: 0, behavior: 'instant' });
}, [view]);
```
- **Verify**: Every page change starts at top

### P5.2 — Create mobile navigation
- **File**: `src/components/Navigation.tsx` (rewrite)
- **New behavior**: 
  - Desktop (>768px): Keep current vertical right-aligned nav
  - Mobile (<=768px): Fixed bottom bar with 5 items, 44px touch targets
- **Verify**: Navigation is tappable at all breakpoints

### P5.3 — Hide FloatingMagicalArrow on mobile
- **File**: `src/components/FloatingMagicalArrow.tsx` (~line 104)
- **Current**: Always visible
- **Change**: Add `hidden md:flex` to the main wrapper
- **Verify**: Arrow not visible at 768px and below

### P5.4 — ContentModal body overflow fix
- **File**: `src/components/ContentModal.tsx`
- **Current**: Sets `document.body.style.overflow = 'hidden'`
- **Check**: Verify cleanup works on all close paths
- **Verify**: Body scroll restored after modal closes

### P5.5 — Add Firefox scrollbar support
- **File**: `src/index.css`
- **Add**:
```css
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.2) transparent;
}
```
- **Verify**: Scrollbar visible in Firefox

---

## PHASE 6: Fix Animation Conflicts

### P6.1 — Remove blur from page transitions on mobile
- **File**: `src/App.tsx` (~line 68-72)
- **Current**:
```tsx
initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
exit={{ opacity: 0, y: -24, filter: 'blur(8px)' }}
```
- **Change**:
```tsx
initial={{ opacity: 0, y: 26 }}
exit={{ opacity: 0, y: -24 }}
// Or conditionally apply blur only on desktop
```
- **Verify**: Page transitions are smooth on mobile

### P6.2 — Remove MagicParticles dead code
- **File**: `src/components/MagicParticles.tsx`
- **Action**: Either delete file or at minimum ensure it's not adding to bundle
- **Verify**: File not imported anywhere (already confirmed)

### P6.3 — Disable parallax on mobile
- **File**: `src/components/ParallaxImage.tsx`
- **Change**: Detect mobile and disable parallax transforms
- **Code**:
```tsx
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
const y = useTransform(smoothProgress, [0, 1], isMobile ? ["0%", "0%"] : ["-15%", "15%"]);
```
- **Verify**: No parallax movement at 768px and below

### P6.4 — Reduce useSpring stiffness on mobile
- **Files**: `ParallaxImage.tsx`, `CinematicImageReveal.tsx`
- **Current**: `stiffness: 70, damping: 20/24`
- **Change**: Use `stiffness: 100, damping: 30` for snappier mobile response
- **Verify**: Scroll feels responsive

### P6.5 — Remove StrictMode for production
- **File**: `src/main.tsx`
- **Current**: `<StrictMode><App /></StrictMode>`
- **Change**: Keep StrictMode but note it causes double-mounting in dev only
- **Verify**: Production builds unaffected

### P6.6 — Add useReducedMotion to more components
- **Files**: `ParallaxImage.tsx`, `ScrollIndicator.tsx`, `FloatingMagicalArrow.tsx`, `Hero.tsx`
- **Change**: Wrap animations in `useReducedMotion()` check
- **Verify**: Animations respect accessibility preferences

---

## PHASE 7: Improve Mobile UX

### P7.1 — Mobile typography scale
- **Files**: All page titles
- **Current**: `text-4xl sm:text-5xl md:text-7xl lg:text-[7rem]`
- **Change**: `text-3xl sm:text-4xl md:text-5xl lg:text-7xl`
- **Verify**: Titles readable at 320px

### P7.2 — Mobile gateway list redesign
- **File**: `src/pages/Home.tsx` — gateway section
- **Change**: On mobile, show gateways as compact horizontal scroll or vertical stack instead of grid
- **Verify**: All 5 gateways accessible on mobile

### P7.3 — Mobile ContentModal as bottom sheet
- **File**: `src/components/ContentModal.tsx`
- **Change**: On mobile, animate from bottom instead of right:
```tsx
// Mobile
initial={{ y: '100%' }}
animate={{ y: 0 }}
exit={{ y: '100%' }}
className="fixed bottom-0 left-0 right-0 h-[85vh] rounded-t-2xl"
```
- **Verify**: Modal feels native on mobile

### P7.4 — Touch target sizing
- **File**: `src/components/Navigation.tsx`
- **Change**: All nav items must have min 44px touch target
- **Verify**: DevTools tap target overlay shows green

### P7.5 — Admin page mobile layout
- **File**: `src/pages/Admin.tsx`
- **Change**: Stack editor and preview vertically on mobile
- **Verify**: CMS is usable at 320px

---

## PHASE 8: Optimize Performance

### P8.1 — Remove FloatingMagicalArrow polling
- **File**: `src/components/FloatingMagicalArrow.tsx`
- **Current**: `setInterval(updateScrollState, 400)`
- **Change**: Remove polling, rely on scroll event listeners only
- **Verify**: No unnecessary timers running

### P8.2 — Lazy load images
- **Files**: All page files
- **Change**: Already covered in P3.1
- **Verify**: Images below fold don't load immediately

### P8.3 — Optimize AnimatePresence
- **File**: `src/App.tsx`
- **Change**: Add `initial={false}` to prevent re-render animations
- **Verify**: No animation replay on re-renders

### P8.4 — Reduce whileInView observers
- **Files**: All pages
- **Change**: Group multiple whileInView elements or use shared IntersectionObserver
- **Verify**: Fewer observers in DevTools Performance

### P8.5 — Remove mix-blend-luminosity on mobile
- **File**: `src/pages/Portfolio.tsx`
- **Current**: `mix-blend-luminosity` on project images
- **Change**: `mix-blend-luminosity md:mix-blend-luminosity` (only on desktop)
- **Verify**: No blend mode on mobile

---

## VERIFICATION MATRIX

After all phases, verify at these breakpoints:

| Page | 320px | 375px | 390px | 414px | 480px | 768px | Desktop |
|------|-------|-------|-------|-------|-------|-------|---------|
| Home | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ |
| Portfolio | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ |
| Journal | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ |
| Tech | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ |
| Photography | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ |
| Collection | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ |
| Admin | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ |

**Checks at each breakpoint:**
- [ ] No horizontal scrolling
- [ ] No content clipping
- [ ] No text overlap
- [ ] Images fit within viewport
- [ ] Navigation is usable
- [ ] Touch targets ≥44px
- [ ] Scroll works correctly
- [ ] Page starts at top after navigation

---

*Generated: 2026-06-10*
*Phases: 8 | Items: 42*
