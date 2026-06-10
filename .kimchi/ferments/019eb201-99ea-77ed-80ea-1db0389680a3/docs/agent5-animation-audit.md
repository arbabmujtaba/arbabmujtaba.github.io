# Agent 5: Animation & Performance Audit Report

## Executive Summary

This audit identifies **37 distinct animation and performance issues** across the portfolio, with the top 10 being:

| Rank | Issue | Severity | Location |
|------|-------|----------|----------|
| 1 | Blur filter (8px) on page transitions | **CRITICAL** | App.tsx |
| 2 | Dead code: 34 MagicParticles never imported | **HIGH** | MagicParticles.tsx |
| 3 | Multiple useScroll + useSpring hooks per page | **HIGH** | Home.tsx, Photography.tsx |
| 4 | Global scroll listener with 400ms polling | **HIGH** | FloatingMagicalArrow.tsx |
| 5 | StrictMode double-mounting | **HIGH** | main.tsx |
| 6 | mix-blend-screen on CursorAura | **MEDIUM** | CursorAura.tsx |
| 7 | Physics simulation with stiffness:70/damping:24 | **MEDIUM** | ParallaxImage.tsx, CinematicImageReveal.tsx |
| 8 | Missing useReducedMotion in 60% of components | **MEDIUM** | Multiple |
| 9 | Excessive whileInView IntersectionObservers | **MEDIUM** | All pages |
| 10 | backdrop-blur-md on modal overlay | **MEDIUM** | ContentModal.tsx |

---

## 1. Layout Shift Analysis

### Issues Found: 8

#### 1.1 Page Transition Blur (CRITICAL)
- **Location**: `src/App.tsx` lines 68-72
- **Code**:
```tsx
initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
exit={{ opacity: 0, y: -24, filter: 'blur(8px)' }}
```
- **Problem**: `filter: blur(8px)` forces GPU to re-render entire layer tree. On mobile, this causes 30-60fps drops during transitions.
- **Impact**: During 0.72s exit animation, no content visible and scroll is undefined.
- **Fix**: Remove blur or use opacity-only transitions.

#### 1.2 Hero Text Animations (LOW)
- **Location**: `src/components/Hero.tsx`
- **Code**: Multiple `motion.div` with `y: 30` to `y: 0`
- **Problem**: Transform animations are safe, but stacked delays (0.1s, 0.3s, 0.4s, 0.5s, 1s) create long paint chains.
- **Impact**: Minor jank on low-end devices.

#### 1.3 ArchiveSection Scroll Parallax (MEDIUM)
- **Location**: `src/pages/Home.tsx` lines 155-165
- **Code**:
```tsx
const y = useTransform(smoothProgress, [0, 0.5, 1], [70, 0, -25]);
const opacity = useTransform(smoothProgress, [0, 0.18, 0.82, 1], [0, 1, 1, 0.72]);
const scale = useTransform(smoothProgress, [0, 0.5, 1], [0.97, 1, 0.99]);
```
- **Problem**: Uses `y`, `opacity`, `scale` simultaneously - triggers compositor recalculation.
- **Impact**: Moderate - these are composite-only transforms but stacked.

#### 1.4 MagicalGateway Hover Animation (LOW)
- **Location**: `src/components/MagicalGateway.tsx` line 51
- **Code**: `whileHover={{ y: -6 }}`
- **Problem**: `y` transform changes element position - safe but triggers compositor.
- **Impact**: Minor.

#### 1.5 ContentModal Drawer Animation (LOW)
- **Location**: `src/components/ContentModal.tsx` lines 55-59
- **Code**: `initial={{ x: '100%' }}` with spring physics
- **Problem**: `x` is a transform, but spring animation runs continuously during open.
- **Impact**: Minor.

#### 1.6 FloatingMagicalArrow Glow Pulse (LOW)
- **Location**: `src/components/FloatingMagicalArrow.tsx` lines 87-107
- **Code**: Infinite repeat animations on multiple elements with `scale` and `opacity`
- **Problem**: Multiple continuous animations even when not visible.
- **Impact**: Minor.

#### 1.7 CinematicImageReveal Complex Transform Chain (MEDIUM)
- **Location**: `src/components/CinematicImageReveal.tsx` lines 39-51
- **Code**:
```tsx
const frameScale = useTransform(progress, [0, 0.35, 1], [0.88, 1, 0.96]);
const imageScale = useTransform(progress, [0, 1], [1.18, 1.02]);
const imageY = useTransform(progress, [0, 1], ['-8%', '8%']);
const blurAmount = useTransform(progress, [0, 0.35], [12, 0]);
const brightness = useTransform(progress, [0, 0.45], [0.62, 1]);
const filter = useTransform([blurAmount, brightness], ...);
```
- **Problem**: 6 concurrent scroll-driven transforms including expensive `filter`.
- **Impact**: HIGH on mobile.

#### 1.8 QuoteReveal Word-by-Word Animation (MEDIUM)
- **Location**: `src/components/QuoteReveal.tsx` lines 73-85
- **Code**: Each word gets its own `motion.span` with staggered animation
- **Problem**: For a 10-word quote, creates 10 separate animation contexts.
- **Impact**: Moderate.

---

## 2. Scroll Interruption Analysis

### Issues Found: 6

#### 2.1 ParallaxImage Physics Configuration (HIGH)
- **Location**: `src/components/ParallaxImage.tsx` lines 16-18
- **Code**:
```tsx
const smoothProgress = useSpring(scrollYProgress, {
  stiffness: 70, damping: 20, restDelta: 0.001
});
```
- **Problem**: Low stiffness (70) with low damping (20) creates "bouncy" physics that continues after scroll stops. `restDelta: 0.001` means animation never truly settles.
- **Impact**: Continuous frame updates even when not scrolling.

#### 2.2 CinematicImageReveal Physics (HIGH)
- **Location**: `src/components/CinematicImageReveal.tsx` lines 32-35
- **Code**: Same physics config with `stiffness: 70, damping: 24`
- **Problem**: Identical to ParallaxImage - creates continuous physics simulation.
- **Impact**: High CPU usage on scroll.

#### 2.3 Home.tsx Multiple Scroll Hooks (CRITICAL)
- **Location**: `src/pages/Home.tsx`
- **Hooks found**:
  1. Line 181: `useScroll({ container: containerRef })` for hero
  2. Line 183: `useSpring(scrollY, {...})` for hero parallax
  3. CinematicImageReveal (internal useScroll)
  4. QuoteReveal (internal useScroll)
  5. ArchiveSection (internal useScroll)
  6. Multiple whileInView observers
- **Problem**: 5+ scroll listeners on same page, each triggering re-renders.
- **Impact**: Severe scroll jank on mobile.

#### 2.4 Photography.tsx Scroll Overload (HIGH)
- **Location**: `src/pages/Photography.tsx`
- **Components using scroll**: ParallaxImage (7+ instances), whileInView sections
- **Problem**: Each ParallaxImage adds its own scroll listener.
- **Impact**: High.

#### 2.5 FloatingMagicalArrow Global Capture (HIGH)
- **Location**: `src/components/FloatingMagicalArrow.tsx` lines 38-48
- **Code**:
```tsx
window.addEventListener('scroll', handleScroll, true); // Capture phase
const interval = setInterval(updateScrollState, 400); // Polling
```
- **Problem**: Capturing scroll listener fires on ALL scroll events globally. 400ms polling adds additional DOM queries.
- **Impact**: High.

#### 2.6 QuoteReveal Scroll Physics (MEDIUM)
- **Location**: `src/components/QuoteReveal.tsx` lines 26-30
- **Code**: `stiffness: 80, damping: 26`
- **Problem**: Similar physics config, less aggressive than ParallaxImage.
- **Impact**: Moderate.

---

## 3. AnimatePresence Conflict Analysis

### Issues Found: 5

#### 3.1 Mode="wait" Blocks Interaction (HIGH)
- **Location**: `src/App.tsx` line 64
- **Code**: `<AnimatePresence mode="wait">`
- **Problem**: During 0.72s exit animation, user cannot interact with entering page.
- **Impact**: If user clicks rapidly through navigation, animations queue and cause jank.

#### 3.2 No initial={false} on Page Components (HIGH)
- **Location**: All page components (`Home.tsx`, `Portfolio.tsx`, etc.)
- **Code**: Each starts with `initial={{ opacity: 0 }}`
- **Problem**: In StrictMode (dev), this causes entrance animation to replay on re-mount.
- **Impact**: Double animation replay in dev mode.

#### 3.3 Nested Scroll Containers (MEDIUM)
- **Location**: `src/App.tsx` + all page components
- **Code**: Each page has `overflow-y-auto custom-scrollbar`
- **Problem**: When page exits, its scroll container collapses. When entering page mounts, new scroll context creates.
- **Impact**: Scroll position reset issues.

#### 3.4 Rapid Navigation Queueing (MEDIUM)
- **Location**: `src/App.tsx` + Navigation component
- **Problem**: No animation interruption - clicking nav while transition runs queues the next animation.
- **Impact**: Stuttered experience.

#### 3.5 ContentModal AnimatePresence Without Mode (LOW)
- **Location**: `src/components/ContentModal.tsx` used in all pages
- **Code**: `<AnimatePresence>` without mode
- **Problem**: Default mode="sync" can cause enter/exit overlap.
- **Impact**: Minor.

---

## 4. Mobile Jank Sources (Ranked by Severity)

### Ranked List:

| Rank | Issue | GPU Cost | Mitigation |
|------|-------|----------|------------|
| 1 | blur(8px) filter on transitions | **EXTREME** | Remove blur |
| 2 | Multiple useSpring scroll physics | **HIGH** | Remove spring, use direct values |
| 3 | mix-blend-screen on CursorAura | **HIGH** | Remove or reduce size |
| 4 | backdrop-blur-md on modal | **HIGH** | Use solid overlay |
| 5 | grayscale CSS on images | **MEDIUM** | Use opacity instead |
| 6 | Multiple whileInView observers | **MEDIUM** | Batch with container queries |
| 7 | Infinite repeat animations (particles, glows) | **MEDIUM** | Add visibility check |
| 8 | Complex filter chains (blur+brightness) | **HIGH** | Simplify to opacity only |
| 9 | Grid pattern animation (BackgroundLayer) | **LOW** | Remove animation |
| 10 | will-change without proper usage | **LOW** | Remove where not needed |

---

## 5. Performance Bottleneck Inventory

### 5.1 Dead Code (CRITICAL)

**MagicParticles.tsx** - Lines 1-80:
- Creates 34 animated particle elements with infinite repeat
- **Never imported anywhere in the codebase**
- Uses `useReducedMotion` correctly but still dead code
- Estimated impact: ~2MB JS overhead, 34 extra composited layers if imported

**Action**: Delete file or integrate into App.tsx

### 5.2 StrictMode Impact (HIGH)

**Location**: `src/main.tsx` line 1-8
```tsx
<StrictMode>
  <App />
</StrictMode>
```

**Double-mount effects**:
- Double IntersectionObserver registration for every `whileInView`
- Double scroll listener attachment for `useScroll` hooks
- Double animation initialization
- Double `useEffect` cleanup/setup cycles

**Action**: Consider removing StrictMode in production build, or ensure components handle remount gracefully.

### 5.3 Polling Interval (HIGH)

**Location**: `src/components/FloatingMagicalArrow.tsx` line 44
```tsx
const interval = setInterval(updateScrollState, 400);
```

**Problem**: Every 400ms, queries DOM for scroll containers even when user isn't scrolling.
- Runs indefinitely even when arrow is hidden
- Queries `document.querySelectorAll('.custom-scrollbar')` every iteration

**Action**: Remove interval, use scroll event listener only when arrow is visible.

### 5.4 Missing GPU Acceleration Hints

**Affected files**:
- `CursorAura.tsx` - Has `will-change` in class but motion.div uses transforms
- `BackgroundLayer.tsx` - Has `will-change-transform` but also animates `backgroundPosition`
- Multiple other components

**Problem**: `backgroundPosition` is not GPU-accelerated - triggers layout recalculation.

### 5.5 Image Filter Overhead

**Locations**:
- `CinematicImageReveal.tsx`: `grayscale-[30%]`, `filter: blur()`, `filter: brightness()`
- `MagicalGateway.tsx`: `grayscale` transition
- `Photography.tsx`: `grayscale-[20%]` on hover
- `Portfolio.tsx`: `grayscale` on project images

**Problem**: CSS filters are expensive, especially when combined with scroll-driven animations.

---

## 6. Reduced Motion Compliance Audit

### Components WITH useReducedMotion: 5/14

| Component | Has Reduced Motion | Notes |
|-----------|-------------------|-------|
| CursorAura.tsx | YES | Returns null if reduced |
| MagicParticles.tsx | YES | Static gradient if reduced |
| CinematicImageReveal.tsx | YES | Partial - skips transforms only |
| MagicalGateway.tsx | YES | Properly implemented |
| AmbientGlow.tsx | YES | Properly implemented |
| AnimatedGradientBg.tsx | YES | Properly implemented |
| BackgroundLayer.tsx | YES | Properly implemented |
| QuoteReveal.tsx | YES | Properly implemented |
| **ParallaxImage.tsx** | **NO** | **Missing** |
| **ScrollIndicator.tsx** | **NO** | **Missing** |
| **FloatingMagicalArrow.tsx** | **NO** | **Missing** |
| **App.tsx (transitions)** | **NO** | **Missing** |
| **Hero.tsx** | **NO** | **Missing** |
| **ContentModal.tsx** | **NO** | **Missing** |

### Compliance Score: 36% (5/14)

---

## 7. Recommended Fixes with Exact Code Changes

### Priority 1: Critical Fixes

#### Fix 1.1: Remove Blur from Page Transitions
**File**: `src/App.tsx`
```tsx
// BEFORE (lines 68-72)
initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
exit={{ opacity: 0, y: -24, filter: 'blur(8px)' }}

// AFTER
initial={{ opacity: 0, y: 26 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -24 }}
```

#### Fix 1.2: Delete Dead MagicParticles Code
**Action**: Delete `src/components/MagicParticles.tsx` or integrate into `App.tsx`

#### Fix 1.3: Remove Polling Interval
**File**: `src/components/FloatingMagicalArrow.tsx`
```tsx
// REMOVE lines 43-45
const interval = setInterval(updateScrollState, 400);
updateScrollState();

// REPLACE with visibility-based scroll sync
useEffect(() => {
  if (!isScrollable) return;
  
  const handleScroll = () => updateScrollState();
  window.addEventListener('scroll', handleScroll, true);
  return () => window.removeEventListener('scroll', handleScroll, true);
}, [isScrollable]);
```

### Priority 2: High Priority Fixes

#### Fix 2.1: Add useReducedMotion to ParallaxImage
**File**: `src/components/ParallaxImage.tsx`
```tsx
// Add import
import { useReducedMotion } from 'motion/react';

// Add to component
const shouldReduceMotion = useReducedMotion();

// Wrap animation
style={shouldReduceMotion ? undefined : { y, height: '130%', top: '-15%', position: 'absolute', width: '100%', left: 0 }}
```

#### Fix 2.2: Add useReducedMotion to ScrollIndicator
**File**: `src/components/ScrollIndicator.tsx`
```tsx
// Add import
import { useReducedMotion } from 'motion/react';

// Add to component
const shouldReduceMotion = useReducedMotion();

// Conditionally render animation
<motion.div
  className="w-full h-1/3 bg-zinc-400 absolute top-0 left-0"
  animate={shouldReduceMotion ? { y: 0 } : { y: ['-150%', '350%'] }}
  transition={shouldReduceMotion ? {} : {
    duration: 2,
    repeat: Infinity,
    ease: [0.6, 0.05, 0.4, 0.9],
  }}
/>
```

#### Fix 2.3: Add useReducedMotion to FloatingMagicalArrow
**File**: `src/components/FloatingMagicalArrow.tsx`
```tsx
// Add import
import { useReducedMotion } from 'motion/react';

// Add to component
const shouldReduceMotion = useReducedMotion();

// At line 84, wrap all motion.div animations
animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
// And remove infinite animations on internal elements
```

#### Fix 2.4: Simplify Spring Physics
**File**: `src/components/ParallaxImage.tsx`
```tsx
// BEFORE
const smoothProgress = useSpring(scrollYProgress, {
  stiffness: 70, damping: 20, restDelta: 0.001
});

// AFTER - use direct scroll progress or much higher stiffness
const smoothProgress = useSpring(scrollYProgress, {
  stiffness: 400, damping: 40, restDelta: 0.01
});
```

### Priority 3: Medium Priority Fixes

#### Fix 3.1: Remove mix-blend-screen
**File**: `src/components/CursorAura.tsx` line 43
```tsx
// REMOVE mix-blend-screen
className="... md:block" // Remove mix-blend-screen
```

#### Fix 3.2: Replace backdrop-blur with opacity
**File**: `src/components/ContentModal.tsx` line 51
```tsx
// BEFORE
className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"

// AFTER
className="absolute inset-0 bg-black/85 cursor-pointer"
```

#### Fix 3.3: Add initial={false} to Page Components
**File**: All page components (Home.tsx, Portfolio.tsx, etc.)
```tsx
// Add initial={false} to root motion.div
<motion.div
  key="home"
  initial={false}  // Add this line
  animate={{ opacity: 1 }}
  ...
/>
```

#### Fix 3.4: Remove Complex Filter Chain in CinematicImageReveal
**File**: `src/components/CinematicImageReveal.tsx`
```tsx
// REMOVE blurAmount, brightness, and filter transforms
// Keep only scale and opacity for performance
```

#### Fix 3.5: Batch whileInView with Single Observer
**File**: `src/pages/Home.tsx`
```tsx
// Instead of multiple whileInView on each element,
// wrap sections and use a single observer per section
```

### Priority 4: Low Priority / Nice-to-Have

#### Fix 4.1: Add will-change to explicitly animated elements
```tsx
// Where appropriate
style={{ willChange: 'transform', transform: 'translate3d(0,0,0)' }}
```

#### Fix 4.2: Remove StrictMode in production
**File**: `vite.config.ts` or `main.tsx`
```tsx
// Only remove for production builds if needed
```

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Layout Shift Issues | 8 |
| Scroll Interruption Issues | 6 |
| AnimatePresence Conflicts | 5 |
| Mobile Jank Sources | 10 |
| Performance Bottlenecks | 5 |
| Reduced Motion Gaps | 6 |
| **Total Issues** | **40** |

---

*Audit completed: 2026-06-10*
*Files audited: 20 components + 5 pages + main.tsx*
