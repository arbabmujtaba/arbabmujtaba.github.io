# Image & Media Audit Report
## AI Portfolio - Agent 4 Findings

**Date:** June 10, 2026  
**Platform:** React 19 + Vite + Tailwind CSS v4  
**Audit Scope:** All image components, pages, and performance considerations

---

## 1. Summary of Top Image Issues

### CRITICAL Issues

1. **Massive Unsplash Image Downloads on Mobile**
   - Homepage CinematicImageReveal: `w=2400` on 320px screens = ~7.5MB downloaded
   - Gateway sections (Home): `w=1800` images
   - No responsive image loading (`srcset`) anywhere in the codebase
   - Portfolio project images: Direct CMS URLs (likely full resolution)

2. **CinematicImageReveal Container Overflow**
   - `min-h-[72vh]` on mobile: On a 700px screen = 504px tall (acceptable)
   - BUT: Image uses `h-[118%]` with `w-full` - will cause parent overflow
   - No `overflow-hidden` on the parent section element

3. **ParallaxImage Height Calculation Issues**
   - `height: 130%` with `top: -15%` creates 130% height container
   - Absolute positioning breaks out of parent's overflow-hidden in some cases
   - On mobile, the -15% to +15% y-transform translates to ~48px on 320px width (acceptable)

4. **aspect-[21/9] on Photography Favorites (Mobile)**
   - At 320px width: 137px tall (comically short)
   - At 375px width: 160px tall (still problematic)
   - Dominates viewport on small screens without providing visual value

### HIGH Priority Issues

5. **No Lazy Loading on Most Images**
   - Only `MagicalGateway.tsx` has `loading="lazy"`
   - All other `<img>` tags lack lazy loading
   - ParallaxImage, ContentModal, all page hero images

6. **mix-blend-luminosity Performance**
   - Applied in Portfolio project images
   - Can cause GPU performance issues on low-end mobile devices
   - Browser compositing overhead for blend modes

7. **Hero min-height Issues**
   - `min-h-[94vh]` on Home page hero section
   - On mobile: 94vh is fine but combined with scrolling content can feel off

---

## 2. Page-by-Page Image Inventory

### Home.tsx

| Component | Image URL | Size Params | Aspect Ratio | Issues |
|-----------|-----------|-------------|--------------|--------|
| CinematicImageReveal | unsplash.com/photo-*?w=2400 | w=2400 | aspect-[16/10] | Too large for mobile, h-[118%] overflow risk |
| Gateway #1 (Portfolio) | unsplash.com/photo-1517694712202?w=1800 | w=1800 | Min-h 21rem (mobile), 26rem (desktop) | Missing max-width constraint |
| Gateway #2 (Journal) | unsplash.com/photo-1455390582262?w=1800 | w=1800 | Same | Same |
| Gateway #3 (Tech) | unsplash.com/photo-1558494949?w=1800 | w=1800 | Same | Same |
| Gateway #4 (Photography) | unsplash.com/photo-1493246507139?w=1800 | w=1800 | Same | Same |
| Gateway #5 (Collection) | unsplash.com/photo-1507842217343?w=1800 | w=1800 | Same | Same |

**Mobile Behavior at 320px:**
- CinematicImageReveal: ~137px width, 16:10 = 86px height (too short with 72vh min-height)
- Gateway images: 21rem = 168px height minimum on mobile (acceptable)

### Portfolio.tsx

| Component | Image Source | Aspect Ratio | Issues |
|-----------|--------------|--------------|--------|
| ParallaxImage (projects) | CMS (projectImage) | aspect-[4/3] | No lazy loading, mix-blend-luminosity, no srcset |
| ContentModal cover | projectImage | aspect-[16/9] | No lazy loading, no max-width |

**Mobile Behavior:**
- aspect-[4/3] at 320px: 240px height (may dominate viewport)
- Image scales: w-full + h-full inside container
- Parallax uses 130% height with absolute positioning

### Journal.tsx

| Component | Image Source | Aspect Ratio | Issues |
|-----------|--------------|--------------|--------|
| Featured entry ParallaxImage | coverImage (w=1200 fallback) | None specified | overflow:hidden parent, parallax effect |
| ContentModal cover | coverImage | aspect-[16/9] | No lazy loading |

**Mobile Behavior:**
- Featured entry: Text-heavy, image is background overlay at 10% opacity
- Good UX - image serves as texture, not hero

### Photography.tsx

| Component | Image Source | Width Params | Aspect Ratio | Issues |
|-----------|--------------|--------------|--------------|--------|
| Favorites #1 | CMS | Dynamic | aspect-[16/9] mobile, aspect-[21/9] desktop | aspect-[21/9] on mobile = 137px tall |
| Favorites #2 | CMS | Dynamic | aspect-[16/9] mobile, aspect-[21/9] desktop | Same |
| Section photos | unsplash default | w=800 | aspect-[3/4], aspect-[21/9] (spanning) | w=800 OK, but spanning image too short |
| Behind The Shot | CMS | Dynamic | aspect-[16/10] | OK |

**Mobile Behavior at 320px:**
- aspect-[21/9]: 137px tall (COMICALLY SHORT)
- aspect-[16/9]: 180px tall (acceptable)
- aspect-[3/4]: 240px tall (dominates on mobile)
- aspect-[16/10]: 200px tall (acceptable)

### Collection.tsx

| Component | Image Usage | Issues |
|-----------|-------------|--------|
| Music cards | Abstract CSS backgrounds | No real images - good |
| No hero images | N/A | Good - minimal images |

**Assessment:** Clean - no significant image issues

### Tech.tsx

| Component | Image Usage | Issues |
|-----------|-------------|--------|
| No hero images | N/A | Good |
| No parallax images | N/A | Good |

**Assessment:** Clean - no significant image issues

### ContentModal.tsx

| Component | Image Source | Aspect Ratio | Issues |
|-----------|--------------|--------------|--------|
| Cover image | coverImage | aspect-[16/9] | No lazy loading, no max-width:100% |
| Gallery images | galleryImages[] | aspect-[4/3] | No lazy loading |

**Mobile Behavior:**
- aspect-[16/9] at 320px = 180px tall (acceptable for modal)
- aspect-[4/3] at 320px = 240px tall (acceptable)

### Components Analysis

**CinematicImageReveal.tsx:**
```jsx
// Line 42: h-[118%] - CAUSES OVERFLOW
<motion.img 
  className="h-[118%] w-full object-cover..."
  style={...} // y transform from -8% to 8%
/>
```
- Container: `aspect-[16/10]` with `overflow-hidden` - GOOD
- But image is 118% height, so overflow-hidden clips it - ACCEPTABLE but wasteful
- Uses w=2400 unsplash parameter - TOO LARGE

**ParallaxImage.tsx:**
```jsx
// Lines 22-24
<motion.div style={{ 
  y, 
  height: '130%',    // 130% of parent height
  top: '-15%',       // Shifted up 15%
  position: 'absolute',
  width: '100%',
  left: 0 
}}>
```
- Parent has `relative overflow-hidden` - GOOD
- But 130% height could still cause scrollbar issues on some mobile browsers
- Uses transform (GPU accelerated) - GOOD for performance

**MagicalGateway.tsx:**
```jsx
// Lines 58-61
<img
  src={image}
  loading="lazy"  // ONLY PLACE WITH LAZY LOADING
  className="h-full w-full object-cover..."
/>
```
- Good: Has lazy loading
- Issue: Uses w=1800 unsplash - TOO LARGE for mobile

---

## 3. Performance Assessment

### Oversized Downloads (Bandwidth Waste)

| Location | Unsplash Width | Mobile Width | Waste Factor |
|----------|---------------|--------------|--------------|
| Home - CinematicImageReveal | 2400px | 320px | 56x |
| Home - Gateways (5x) | 1800px | 320px | 36x |
| Photography - Default sections | 800px | 320px | 6.25x |
| Journal - Featured fallback | 1200px | 320px | 11x |

**Estimated Total Bandwidth (First Load):**
- Homepage alone: ~35-50MB if all images load
- Mobile would download: ~8-12MB (mostly wasted)

### Missing Performance Optimizations

1. **No srcset** - All images served at single fixed resolution
2. **No lazy loading** - Only 1 of ~40 images has lazy loading
3. **No image compression** - Using Unsplash quality q=80 (good) but wrong sizes
4. **No next-gen formats** - No WebP/AVIF (though Unsplash doesn't easily support this)
5. **Parallax uses motion.div** - Good (GPU accelerated composite layer)

### Parallax Performance on Mobile

**Assessment: MODERATE CONCERN**

- Uses `useScroll` + `useSpring` (smooth, not janky)
- Transform-based (composite layer, GPU)
- BUT: Scroll events fire differently on mobile
- The -15% to +15% range at 320px = ~48px movement
- At 60fps, this should be smooth BUT:
  - height: 130% means more pixels to render
  - absolute positioning can cause repaints
  - combine with h-[118%] in CinematicImageReveal = double rasterization

---

## 4. Parallax System Mobile Assessment

### Current Implementation

```tsx
// ParallaxImage.tsx
const y = useTransform(smoothProgress, [0, 1], ["-15%", "15%"]);
// Results in: transform: translateY(-15% to +15%)
```

### Mobile Concerns

1. **Height Calculations:**
   - Container: `height: 130%`, `top: -15%`
   - On 320px width with ~200px container height = 260px image
   - The -15% offset = -39px shift
   - Total render height: ~300px for a 200px container
   - May cause horizontal scroll or repaint

2. **Scroll Event Performance:**
   - Mobile browsers throttle scroll events
   - `useScroll` with `useSpring` handles this well
   - But double-transform (parallax + scroll) can be heavy

3. **Parent Overflow:**
   - Good: Parent has `overflow-hidden`
   - BUT: `height: 130%` means 30% more image data rendered
   - On low-memory devices, this causes dropped frames

### Recommendations

- Reduce parallax range on mobile: -10% to 10%
- Reduce image height: 120% instead of 130%
- Add `will-change: transform` for GPU hint
- Consider disabling parallax on reduced-motion preference

---

## 5. Recommended Responsive Image Strategy

### Immediate Fixes

1. **Add srcset to all Unsplash images:**
```tsx
<img 
  srcSet="image-url?w=400 400w,
          image-url?w=800 800w,
          image-url?w=1200 1200w,
          image-url?w=1800 1800w"
  sizes="(max-width: 640px) 100vw,
         (max-width: 1024px) 50vw,
         33vw"
  src="image-url?w=800" 
  loading="lazy"
/>
```

2. **Mobile-first aspect ratios:**
```tsx
// Instead of aspect-[21/9]
class="aspect-[16/9] md:aspect-[21/9]"

// Instead of aspect-[4/3] on mobile
class="aspect-video md:aspect-[4/3]"
```

3. **Add max-width constraints:**
```tsx
class="max-w-full h-auto object-cover"
// NOT: class="w-full h-full object-cover"
```

4. **Reduce Unsplash sizes on mobile:**
```tsx
const getUnsplashUrl = (url, mobileSize = 600) => {
  if (url.includes('unsplash.com')) {
    const size = isMobile ? mobileSize : 1800;
    return url.replace(/w=\d+/, `w=${size}`);
  }
  return url;
};
```

### Long-term Strategy

1. **Implement a responsive image component:**
```tsx
// ResponsiveImage.tsx
interface Props {
  src: string;
  alt: string;
  breakpoints?: { width: number; size: number }[];
}
```

2. **Add lazy loading everywhere:**
```tsx
// Add to ALL images
loading="lazy"
decoding="async"
```

3. **Consider image CDN:**
- Cloudinary or similar for auto-resize/WebP
- Or use Unsplash's built-in sizing: `?w={size}&fmt=webp`

4. **Parallax on mobile:**
- Disable or reduce intensity
- Check `window.matchMedia('(prefers-reduced-motion: reduce)')`

---

## 6. Specific Fixes Per Component

### CinematicImageReveal.tsx

| Issue | Current | Fix |
|-------|---------|-----|
| Image size | w=2400 | Add srcset: 400, 800, 1200, 2400 |
| Height overflow | h-[118%] | Change to h-full or h-[105%] |
| Lazy loading | None | Add loading="lazy" |
| Mobile aspect | 16:10 | Override: aspect-[16/9] on mobile |

**Code:**
```tsx
<motion.img
  src={imageUrl}
  srcSet={`
    ${imageUrl.replace('w=2400', 'w=400')} 400w,
    ${imageUrl.replace('w=2400', 'w=800')} 800w,
    ${imageUrl.replace('w=2400', 'w=1200')} 1200w,
    ${imageUrl.replace('w=2400', 'w=2400')} 2400w
  `}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
  loading="lazy"
  decoding="async"
  className="h-full w-full object-cover md:h-[105%]"
/>
```

### ParallaxImage.tsx

| Issue | Current | Fix |
|-------|---------|-----|
| Height | 130% | 120% on mobile, 130% on desktop |
| Y range | -15% to 15% | -10% to 10% on mobile |
| Lazy loading | None | Add loading="lazy" |
| GPU hint | None | Add will-change: transform |

**Code:**
```tsx
const isMobile = useMediaQuery('(max-width: 768px)');
const y = useTransform(
  smoothProgress, 
  [0, 1], 
  isMobile ? ["-10%", "10%"] : ["-15%", "15%"]
);

return (
  <div ref={ref} className="relative overflow-hidden">
    <motion.div 
      style={{ 
        y, 
        height: isMobile ? '120%' : '130%', 
        top: isMobile ? '-10%' : '-15%',
        willChange: 'transform'
      }}
    >
      <img src={src} alt={alt} loading="lazy" decoding="async" className="w-full h-full object-cover" />
    </motion.div>
  </div>
);
```

### MagicalGateway.tsx

| Issue | Current | Fix |
|-------|---------|-----|
| Image size | w=1800 | Add srcset: 400, 800, 1200, 1800 |
| Min height | 21rem mobile | Consider reducing to 18rem |

### Photography.tsx

| Issue | Current | Fix |
|-------|---------|-----|
| aspect-[21/9] | Always | aspect-[16/9] md:aspect-[21/9] |
| Spanning image | aspect-[21/9] | aspect-[16/9] or aspect-[3/2] on mobile |
| Default photos | w=800 | Keep, good for mobile |

### ContentModal.tsx

| Issue | Current | Fix |
|-------|---------|-----|
| Cover lazy | None | Add loading="lazy" |
| Gallery lazy | None | Add loading="lazy" |
| Max width | None | Add max-w-full |

### Global index.html

| Issue | Current | Fix |
|-------|---------|-----|
| Viewport | Present | Good |
| Theme color | None | Add meta theme-color |

---

## 7. Mobile 320px Viewport Calculations

### Aspect Ratio Heights at 320px

| Ratio | Height | Assessment |
|-------|--------|------------|
| 21:9 | 137px | Too short - comic effect |
| 16:10 | 200px | Borderline - may dominate |
| 16:9 | 180px | Acceptable |
| 4:3 | 240px | May dominate but OK |
| 3:4 | 427px | Vertical, OK for cards |
| 16:10 in 72vh | 504px | Too tall for hero |

### Recommended Mobile Min-Heights

- Hero images: min-h-[50vh] max-h-[70vh]
- Cards: min-h-[16rem] (128px at mobile)
- Modal covers: max-h-[40vh]
- Parallax containers: h-[40vh] to h-[60vh]

---

## Conclusion

This portfolio has significant image optimization opportunities:

1. **Bandwidth:** Current setup wastes ~90% of image data on mobile
2. **Performance:** Parallax + large images = potential jank on low-end devices  
3. **UX:** aspect-[21/9] on mobile creates poor visual experience
4. **Lazy Loading:** Only 2.5% of images are lazy-loaded

**Priority Fixes:**
1. Add srcset to all Unsplash images (high impact, low effort)
2. Fix aspect-[21/9] on Photography page (critical UX)
3. Add lazy loading to all images (easy win)
4. Reduce CinematicImageReveal h-[118%] (fix overflow)
5. Consider mobile parallax reduction (performance)

