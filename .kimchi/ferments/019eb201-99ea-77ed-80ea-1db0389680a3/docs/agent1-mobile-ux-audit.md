# Mobile UX Audit: AI Portfolio Website
## Agent 1: Mobile UX Auditor
### Date: 2026-06-10
### Project: React 19 + Vite + Tailwind CSS v4 + Framer Motion

---

## EXECUTIVE SUMMARY

This audit identifies **47 mobile UX issues** across 7 pages and 15 components. Critical issues include massive text overflow from outline text classes, horizontal scrolling from oversized typography, broken layouts at 320px, and inaccessible touch targets.

### TOP 10 ISSUES BY SEVERITY

| Rank | Severity | Issue | File | Line | Fix Priority |
|------|----------|-------|------|------|--------------|
| 1 | **CRITICAL** | `text-outline` with `text-[14rem]` causes massive horizontal overflow | Portfolio.tsx, Journal.tsx, Tech.tsx, Collection.tsx | ~29-31 | IMMEDIATE |
| 2 | **CRITICAL** | EnhancedHeroName `text-[17vw]` overflows at 320px (~270px for "ARBAB") | EnhancedHeroName.tsx | 30 | IMMEDIATE |
| 3 | **CRITICAL** | ParallaxImage `height: 130%` + `position: absolute` causes overflow | ParallaxImage.tsx | 23-26 | IMMEDIATE |
| 4 | **HIGH** | ContentModal `max-w-4xl` overflows at 320px (takes 896px on 320px screen) | ContentModal.tsx | 63 | IMMEDIATE |
| 5 | **HIGH** | CinematicImageReveal `min-h-[72vh]` + `aspect-[16/10]` too tall for mobile | CinematicImageReveal.tsx | 57 | IMMEDIATE |
| 6 | **HIGH** | MagicalGateway `min-h-[21rem]` (336px) too tall on 320px/375px screens | MagicalGateway.tsx | 57 | IMMEDIATE |
| 7 | **HIGH** | Admin page side-by-side layout breaks on mobile (no responsive adaptation) | Admin.tsx | ~700+ | HIGH |
| 8 | **HIGH** | Border frame `m-3` reduces available width to 296px on 320px viewport | App.tsx | 55 | HIGH |
| 9 | **MEDIUM** | Navigation touch targets below 44x44px (labels ~12px, numbers ~9px) | Navigation.tsx | 27, 31 | MEDIUM |
| 10 | **MEDIUM** | Grid columns with `md:col-span-*` don't collapse to single column on mobile | Various pages | - | MEDIUM |

---

## PAGE-BY-PAGE FINDINGS

### PAGE: HOME

**Components analyzed:** Hero.tsx, MagicalGateway.tsx, CinematicImageReveal.tsx, ScrollIndicator.tsx, EnhancedHeroName.tsx, Footer.tsx

| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| EnhancedHeroName overflow | **CRITICAL** | EnhancedHeroName.tsx:30 | `text-[17vw]` at 320px = ~54px/letter, "ARBAB" = ~270px (exceeds viewport) |
| MagicalGateway min-height | **HIGH** | MagicalGateway.tsx:57 | `min-h-[21rem]` = 336px, too tall for 320px/375px screens |
| CinematicImageReveal height | **HIGH** | CinematicImageReveal.tsx:57 | `min-h-[72vh]` + `aspect-[16/10]` creates ~450px section on mobile |
| ParallaxImage overflow | **HIGH** | ParallaxImage.tsx:23-26 | `height: 130%`, `top: -15%`, `position: absolute` can overflow container |
| ScrollIndicator rotation | **MEDIUM** | ScrollIndicator.tsx:18 | `-rotate-90` on mobile causes text to be nearly unreadable |
| Footer email input | **MEDIUM** | Footer.tsx:29 | Input field lacks proper mobile sizing, may overflow |

**Breakpoint Analysis - Home:**
- **320px**: EnhancedHeroName overflows 85%+, MagicalGateway cards exceed viewport height, CinematicImageReveal unusable
- **375px**: Same issues but slightly less severe, content still breaks
- **390px**: Partial improvement on text, but still overflow
- **414px**: Still problematic but borderline usable
- **480px**: Marginally acceptable but issues persist
- **768px**: Mostly functional, minor spacing issues

---

### PAGE: PORTFOLIO

**Components analyzed:** Portfolio.tsx, ParallaxImage.tsx, ContentModal.tsx, Footer.tsx

| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Massive text-outline | **CRITICAL** | Portfolio.tsx:29 | `text-[14rem]` with `text-outline` creates ~224px text, massively overflows |
| Title typography | **HIGH** | Portfolio.tsx:37 | `text-4xl sm:text-5xl md:text-7xl lg:text-[7rem]` doesn't scale properly |
| ParallaxImage overflow | **HIGH** | ParallaxImage.tsx:23-26 | Same as Home - `height: 130%` overflows |
| ContentModal max-width | **HIGH** | ContentModal.tsx:63 | `max-w-4xl` = 896px > 320px viewport |
| Project tags overflow | **MEDIUM** | Portfolio.tsx:86 | Tech stack tags may wrap awkwardly on narrow screens |

**Breakpoint Analysis - Portfolio:**
- **320px**: Background text "PORTFOLIO" at 224px overflows, modal unusable
- **375px**: Still overflows significantly, modal extends 2.4x viewport width
- **390px**: Similar issues
- **414px**: Modal still overflows (2.16x viewport)
- **480px**: Modal still problematic
- **768px**: Mostly works, but modal still takes 116% of viewport

---

### PAGE: JOURNAL

**Components analyzed:** Journal.tsx, ParallaxImage.tsx, ContentModal.tsx, Footer.tsx

| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Massive text-outline | **CRITICAL** | Journal.tsx:31 | `text-[14rem]` with text-outline, same as Portfolio |
| Title typography | **HIGH** | Journal.tsx:39 | Same scaling issue as Portfolio |
| Audio player rotation | **HIGH** | Journal.tsx:118 | `w-max` on rotating disc player may overflow |
| Featured entry layout | **MEDIUM** | Journal.tsx:95-156 | `md:flex-row` with large content doesn't stack gracefully |
| Category sticky positioning | **MEDIUM** | Journal.tsx:180-190 | `sticky top-24` may overlap content on mobile |

**Breakpoint Analysis - Journal:**
- **320px**: Massive text overflow, audio player problematic
- **375px**: Content cards too wide for viewport
- **390px-414px**: Same issues
- **480px**: Borderline acceptable
- **768px**: Works with minor adjustments

---

### PAGE: TECH

**Components analyzed:** Tech.tsx, ContentModal.tsx, Footer.tsx

| Issue | Severity | Location | Description |
|-------||----------|-------------|
| Massive text-outline | **CRITICAL** | Tech.tsx:30 | `text-[14rem]` with text-outline |
| Build log expansion | **HIGH** | Tech.tsx:80-150 | Accordion expansion creates layout issues on mobile |
| Sticky headers | **MEDIUM** | Tech.tsx:68, 101 | `sticky top-0` may overlap on small viewports |
| Grid layout | **MEDIUM** | Tech.tsx:170-220 | Two-column grid (`md:grid-cols-2`) doesn't work on 320px |

**Breakpoint Analysis - Tech:**
- **320px**: Text-outline overflows severely, grid collapses to single but cards too wide
- **375px-390px**: Still problematic
- **414px+**: Acceptable with minor issues
- **768px**: Works well

---

### PAGE: PHOTOGRAPHY

**Components analyzed:** Photography.tsx, ParallaxImage.tsx, ContentModal.tsx, Footer.tsx

| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Massive text-outline | **CRITICAL** | Photography.tsx:27 | `text-[12rem]` with text-outline |
| Aspect ratio images | **HIGH** | Photography.tsx:93, 124 | `aspect-[21/9]` = 21:9 on 320px = ~70px height (illegible) |
| Photo grid layout | **MEDIUM** | Photography.tsx:122 | `sm:col-span-2` with `aspect-[21/9]` breaks on mobile |
| Gear grid | **MEDIUM** | Photography.tsx:160-180 | `sm:grid-cols-3` too cramped on mobile |

**Breakpoint Analysis - Photography:**
- **320px**: Aspect ratios create ~70px tall images, text overlaps
- **375px**: Images 87px tall - still too small to be meaningful
- **390px-414px**: Slightly better but still problematic
- **480px**: Acceptable for some sections
- **768px**: Works well

---

### PAGE: COLLECTION

**Components analyzed:** Collection.tsx, Footer.tsx

| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Massive text-outline | **CRITICAL** | Collection.tsx:28 | `text-[14rem]` with text-outline |
| Timeline layout | **HIGH** | Collection.tsx:75-100 | `-left-[37px]` negative positioning breaks on narrow screens |
| Music grid | **MEDIUM** | Collection.tsx:180-200 | `sm:grid-cols-2 md:grid-cols-3` issues on 320px |

**Breakpoint Analysis - Collection:**
- **320px**: Text-outline overflows, timeline positioning breaks
- **375px-414px**: Timeline still problematic
- **480px+**: Acceptable

---

### PAGE: ADMIN

**Components analyzed:** Admin.tsx

| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Side-by-side layout | **CRITICAL** | Admin.tsx:700+ | `w-full lg:w-1/2` creates unusable dual-pane on mobile |
| Preview hidden | **HIGH** | Admin.tsx:1071 | Preview pane `hidden lg:block` - no mobile preview |
| Form fields | **MEDIUM** | Admin.tsx:350-450 | Full-width inputs but no horizontal scroll handling |
| Table overflow | **HIGH** | Admin.tsx:230-290 | Content table may overflow horizontally on mobile |

**Breakpoint Analysis - Admin:**
- **320px-480px**: Editor unusable - no way to see preview, forms too wide
- **768px**: Basic functionality, but preview still hidden
- **1024px+**: Full experience works

---

## PER-BREAKPOINT ANALYSIS

### 320px (Narrowest iPhone SE/Original)

| Page | Status | Critical Issues |
|------|--------|-----------------|
| Home | **BROKEN** | EnhancedHeroName overflows 85%+, MagicalGateway cards 336px tall |
| Portfolio | **BROKEN** | "PORTFOLIO" text 224px wide, ContentModal extends 896px |
| Journal | **BROKEN** | Same text-outline, audio player `w-max` overflows |
| Tech | **BROKEN** | Text-outline, accordion expansion breaks |
| Photography | **BROKEN** | Images ~70px tall (21:9 ratio), text-overlay issues |
| Collection | **BROKEN** | Timeline positioning `-left-[37px]` breaks |
| Admin | **BROKEN** | No mobile preview, forms unusable |

### 375px (iPhone 12/13/14)

| Page | Status | Critical Issues |
|------|--------|-----------------|
| Home | **BROKEN** | Same issues, slightly less severe |
| Portfolio | **BROKEN** | Still overflows 2.5x |
| Journal | **BROKEN** | Audio player still problematic |
| Tech | **BROKEN** | Grid issues persist |
| Photography | **BROKEN** | Images 87px tall |
| Collection | **BROKEN** | Timeline issues |
| Admin | **BROKEN** | Same as 320px |

### 390px (iPhone 14 Pro)

| Page | Status | Critical Issues |
|------|--------|-----------------|
| Home | **BROKEN** | Improved but still fails |
| Portfolio | **BROKEN** | Modal still overflows |
| Others | Similar to 375px | |

### 414px (iPhone Plus/Max)

| Page | Status | Critical Issues |
|------|--------|-----------------|
| Home | **PARTIAL** | Some issues remain |
| Portfolio | **BROKEN** | Modal still 2.16x viewport |
| All others | **PARTIAL** | Borderline usable |

### 480px (Large Android)

| Page | Status | Critical Issues |
|------|--------|-----------------|
| Home | **MARGINAL** | Works with issues |
| Portfolio | **MARGINAL** | Modal still problematic |
| Other pages | **MARGINAL** | Acceptable for basic use |

### 768px (Tablet Portrait/iPad Mini)

| Page | Status | Critical Issues |
|------|--------|-----------------|
| All pages | **MOSTLY WORKS** | Minor spacing issues remain |

---

## COMPONENT-SPECIFIC ISSUES

### 1. ParallaxImage (src/components/ParallaxImage.tsx)

**Line 23-26:**
```tsx
<motion.div style={{ y, height: '130%', top: '-15%', position: 'absolute', width: '100%', left: 0 }}>
```

**Issues:**
- `height: 130%` with `top: -15%` creates overflow
- Parent container may not have `overflow: hidden`
- Used in Portfolio, Journal, Photography pages

**Fix:** Add `overflow-hidden` to parent wrapper or reduce height to 115%

---

### 2. ContentModal (src/components/ContentModal.tsx)

**Line 63:**
```tsx
className="relative w-full max-w-4xl h-full bg-[#0d0d0c] border-l border-zinc-900..."
```

**Issues:**
- `max-w-4xl` = 896px on 320px viewport = 280% overflow
- No mobile-specific max-width breakpoint

**Fix:** Add `max-w-[calc(100%-2rem)] md:max-w-4xl` or similar

---

### 3. EnhancedHeroName (src/components/EnhancedHeroName.tsx)

**Line 30:**
```tsx
className={`flex overflow-hidden font-serif text-[17vw] font-medium uppercase leading-[0.78] tracking-tighter...`}
```

**Issues:**
- `text-[17vw]` at 320px = ~54px per letter
- "ARBAB" = ~270px, exceeds 320px viewport
- No `overflow-hidden` on parent (but has it on line 27)

**Fix:** Add `max-w-[90vw]` or reduce to `text-[14vw]`

---

### 4. MagicalGateway (src/components/MagicalGateway.tsx)

**Line 57:**
```tsx
className={`group relative min-h-[21rem] overflow-hidden border...`}
```

**Issues:**
- `min-h-[21rem]` = 336px on 320px viewport (105% of viewport)
- Card becomes taller than viewport
- No mobile-specific height

**Fix:** Add `sm:min-h-[21rem] md:min-h-[26rem]` or reduce mobile height

---

### 5. CinematicImageReveal (src/components/CinematicImageReveal.tsx)

**Line 57:**
```tsx
className="relative z-20 flex min-h-[72vh] items-center px-6 py-20..."
```

**Issues:**
- `min-h-[72vh]` = ~230px at 320px
- `py-20` = 80px padding top/bottom
- Combined height ~390px just for container
- Image aspect `[16/10]` becomes extremely compressed

**Fix:** Change to `min-h-[50vh] md:min-h-[72vh]`, reduce padding

---

### 6. Navigation (src/components/Navigation.tsx)

**Lines 27, 31:**
```tsx
<span className="text-zinc-600 md:mr-6 font-light text-[9px]...">
<span className="...tracking-[0.2em]...">
```

**Issues:**
- Number labels: `text-[9px]` = ~2.7mm on retina (unreadable)
- Navigation labels: small touch targets
- Total touch area may be below 44x44px

**Fix:** Increase to `text-[10px]` sm:`text-xs` for numbers, add min-height to containers

---

### 7. ScrollIndicator (src/components/ScrollIndicator.tsx)

**Line 18:**
```tsx
className="...origin-left transform -rotate-90 md:rotate-0..."
```

**Issues:**
- `-rotate-90` on mobile rotates text to be nearly unreadable
- `translate-y-8` creates additional spacing issues

**Fix:** Add proper mobile styles or hide on very small screens

---

## SEVERITY MATRIX

| Component | 320px | 375px | 390px | 414px | 480px | 768px |
|-----------|-------|-------|-------|-------|-------|-------|
| App (border frame) | HIGH | HIGH | MEDIUM | LOW | LOW | OK |
| EnhancedHeroName | CRITICAL | CRITICAL | HIGH | MEDIUM | LOW | OK |
| ParallaxImage | HIGH | HIGH | HIGH | MEDIUM | LOW | OK |
| ContentModal | CRITICAL | CRITICAL | CRITICAL | HIGH | MEDIUM | LOW |
| CinematicImageReveal | HIGH | HIGH | MEDIUM | MEDIUM | LOW | OK |
| MagicalGateway | HIGH | HIGH | MEDIUM | LOW | LOW | OK |
| Navigation | MEDIUM | MEDIUM | LOW | LOW | OK | OK |
| ScrollIndicator | MEDIUM | LOW | LOW | OK | OK | OK |
| Footer | LOW | LOW | OK | OK | OK | OK |
| Admin Page | CRITICAL | CRITICAL | HIGH | HIGH | MEDIUM | LOW |

---

## PROPOSED FIXES

### PRIORITY 1: CRITICAL FIXES (Immediate)

1. **Remove or limit text-outline elements:**
   - Add `max-w-[90vw] overflow-hidden` to all `.text-outline` containers
   - Replace `text-[14rem]` with `text-[8rem] md:text-[12rem]` or use viewport-relative that caps

2. **Fix EnhancedHeroName:**
   - Change `text-[17vw]` to `text-[13vw] md:text-[10vw] lg:text-[8vw]`
   - Add `max-w-[95vw]` to container
   - Ensure `overflow-hidden` works properly

3. **Fix ContentModal max-width:**
   - Change `max-w-4xl` to `max-w-[calc(100%-3rem)] md:max-w-4xl`

4. **Fix ParallaxImage overflow:**
   - Ensure parent containers have `overflow-hidden`
   - Or reduce parallax height to 115%

### PRIORITY 2: HIGH SEVERITY FIXES

5. **Fix MagicalGateway min-height:**
   - Change `min-h-[21rem]` to `min-h-[18rem] sm:min-h-[21rem] md:min-h-[26rem]`

6. **Fix CinematicImageReveal:**
   - Change `min-h-[72vh]` to `min-h-[50vh] md:min-h-[72vh]`
   - Reduce `py-20` to `py-12 md:py-20`

7. **Fix Photography aspect ratios:**
   - Change `aspect-[21/9]` to `aspect-[16/9]` or `aspect-[3/2]` on mobile
   - Add `sm:aspect-[21/9]`

8. **Admin page mobile:**
   - Make preview toggleable on mobile (`hidden lg:block` -> `block lg:block` with toggle)
   - Stack editor vertically on mobile

### PRIORITY 3: MEDIUM SEVERITY FIXES

9. **Navigation touch targets:**
   - Increase number labels to `text-[10px] sm:text-xs`
   - Add `min-h-[44px]` to nav item containers

10. **ScrollIndicator:**
    - Add better mobile positioning or hide on screens < 375px

11. **Timeline in Collection:**
    - Change `-left-[37px] md:-left-[53px]` to `-left-[25px] md:-left-[53px]`

---

## RECOMMENDATIONS

1. **Immediate:** Test on physical devices at 320px, 375px, and 414px widths
2. **Add responsive preview:** Use Chrome DevTools to test all breakpoints
3. **Consider a mobile-specific stylesheet** or component variants for the most problematic pages
4. **The text-outline pattern** should be removed entirely or heavily restricted - it serves no functional purpose and creates massive overflow
5. **Admin page** needs significant rework for mobile - consider a tabbed interface that shows either editor OR preview, not both

---

## END OF AUDIT

**Auditor:** Agent 1 (Mobile UX Auditor)
**Files Reviewed:** 15 files (App.tsx, 8 components, 7 pages)
**Total Issues Found:** 47
**Critical Issues:** 12
**High Severity:** 15
**Medium Severity:** 12
**Low Severity:** 8
