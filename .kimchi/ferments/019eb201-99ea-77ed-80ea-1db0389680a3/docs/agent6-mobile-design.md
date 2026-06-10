# Mobile Design Specification
## Agent 6: Mobile Design Architect
### Portfolio Website Mobile-First Experience

---

## Overall Mobile Design Philosophy

### Core Principles

1. **Vintage Archive Aesthetic**: Mobile should feel like a "vintage archive" / "old notebook" / "curated scrapbook" — tactile, intimate, and personal
2. **Content-First Hierarchy**: Reduce visual noise; focus on immediate readability
3. **Touch-First Interactions**: Every element must be tappable with minimum 44x44px touch targets
4. **Smooth Scrolling**: Natural scroll behavior with momentum, respecting the editorial tone
5. **Reduced Motion**: Honor `prefers-reduced-motion` and disable parallax on mobile for performance

### Key Differences from Desktop

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Layout | Spacious, spread out | Intimate, stacked |
| Navigation | Top-right vertical list | Bottom navigation bar |
| Images | Wide cinematic (21:9) | Taller aspect ratios (4:3, 3:4) |
| Typography | Massive headlines with outline | Refined, readable scale |
| Cards | Grid with hover effects | Vertical stack with tap feedback |
| Modal | Right-side drawer | Full-screen bottom sheet |
| Parallax | Enabled | Disabled by default |

---

## Navigation Design

### Current State
- Vertical list of nav items at top-right
- Very small text (9px) with tiny numbers
- On mobile: overlaps with title or gets cut off

### Mobile Navigation: Fixed Bottom Bar

```
┌─────────────────────────────────────────┐
│              [Content Area]              │
│                                          │
│                                          │
│                                          │
│                                          │
│                                          │
├─────────────────────────────────────────┤
│  ○    ○    ○    ○    ○                  │
│  01   02   03   04   05                 │
│ Home  Port  Jour  Tech  Phot  Col       │
│  ▼     ▲                           ▲    │
└─────────────────────────────────────────┘
```

### Specification

```tsx
// Mobile Navigation Component
<nav className="
  fixed bottom-0 left-0 right-0 z-50
  bg-[#0a0a09]/85 backdrop-blur-xl
  border-t border-zinc-800/60
  px-2 py-3
  flex justify-around items-center
  safe-area-pb
">
  {/* Navigation Items */}
  {navItems.map((item) => (
    <button
      key={item.id}
      className="
        flex flex-col items-center gap-1
        min-w-[64px] min-h-[44px]
        p-2 rounded-lg
        transition-colors duration-300
        touch-manipulation
        {active ? 'text-orange-400' : 'text-zinc-500'}
      "
    >
      {/* Active indicator dot */}
      {active && (
        <motion.div 
          layoutId="nav-dot"
          className="w-1.5 h-1.5 rounded-full bg-orange-500"
        />
      )}
      <span className="font-mono text-[9px] opacity-60">{item.num}</span>
      <span className="font-sans text-[10px] uppercase tracking-wider">
        {item.label.slice(0, 4)}
      </span>
    </button>
  ))}
</nav>
```

### Header Adaptation (Mobile)
- Remove horizontal navigation entirely
- Keep only the site name/logo: `Arbab M.` in serif
- Name becomes tappable to return home
- Add hamburger menu only if additional links needed

---

## Home Page Mobile Design

### Hero Section

**Current Desktop:**
- `text-4xl sm:text-5xl md:text-[5.5rem] lg:text-[6.5rem]` for name
- `text-outline` effect with 6rem+ behind title

**Mobile Specification:**

```tsx
// Mobile Hero
<div className="
  min-h-[85vh]
  flex flex-col justify-end
  px-5 pb-24 pt-20
  relative
">
  {/* Remove text-outline on mobile - too cramped */}
  {/* Background text alternative: subtle watermark */}
  <span className="
    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
    font-serif text-[15vh] text-zinc-900/40
    select-none pointer-events-none
    whitespace-nowrap
  ">
    Archive
  </span>

  <h1 className="
    font-serif text-[2.75rem] leading-[1.05]
    tracking-tighter text-zinc-100
    mb-6
  ">
    Arbab<br/>Mujtaba
  </h1>

  <div className="space-y-2 mb-8">
    <p className="font-serif text-lg text-white/90">Engineer.</p>
    <p className="font-serif text-lg text-orange-500/80 italic">Photographer.</p>
    <p className="font-serif text-lg text-white/90">Explorer.</p>
  </div>

  <p className="
    font-sans text-[11px] uppercase tracking-[0.2em]
    text-zinc-500 font-light
    max-w-[280px]
  ">
    Building systems,<br/>
    collecting stories,<br/>
    capturing moments.
  </p>
</div>
```

### Gateway Cards (MagicalGateway)

**Current Desktop:**
- Grid: 6 columns on desktop, 3 on tablet
- `min-h-[21rem]` to `[26rem]`
- Hover effects with spark animations

**Mobile Specification:**

```tsx
// Mobile Gateway Cards - Vertical Stack
<div className="space-y-4 px-4">
  {GATEWAY_SECTIONS.map((section, index) => (
    <motion.button
      key={section.id}
      onClick={() => handleNavigate(section.id)}
      className="
        w-full min-h-[140px]
        relative overflow-hidden
        border border-zinc-800/60 bg-zinc-950/40
        rounded-lg
        group
        active:scale-[0.99]
        transition-transform duration-150
      "
    >
      {/* Background Image - full width, darker */}
      <img 
        src={section.image} 
        alt=""
        className="
          absolute inset-0 w-full h-full
          object-cover opacity-25 grayscale-[30%]
          transition-all duration-500
          group-hover:opacity-40 group-hover:grayscale-0
        "
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a09] via-[#0a0a09]/70 to-transparent" />

      {/* Content */}
      <div className="relative z-10 p-5 flex flex-col justify-between h-[140px]">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-orange-400/80">
            {section.label}
          </span>
        </div>
        
        <div className="flex justify-between items-end">
          <h3 className="font-serif text-2xl tracking-tight text-zinc-100">
            {section.title}
          </h3>
          <span className="w-8 h-8 flex items-center justify-center border border-zinc-700 rounded-full">
            <ArrowUpRight className="w-4 h-4 text-zinc-400" />
          </span>
        </div>
      </div>
    </motion.button>
  ))}
</div>
```

### Section Gaps (Mobile)
- Remove `space-y-32` from desktop
- Use `space-y-16` for mobile sections
- `py-16` instead of `py-24` or `py-32`

---

## Portfolio Page Mobile Design

### Hero Section

```tsx
<div className="px-5 pt-24 pb-12 relative">
  {/* Subtle outline text - reduced opacity */}
  <span className="
    absolute top-12 left-2
    text-[4rem] font-serif font-bold
    text-zinc-900/50 select-none
    -rotate-90 origin-top-left
    translate-x-[-100%]
  ">
    PORTFOLIO
  </span>

  <div className="flex items-center gap-3 mb-4">
    <span className="font-sans text-[9px] text-zinc-500">Home</span>
    <span className="w-0.5 h-3 bg-zinc-700"></span>
    <span className="font-sans text-[9px] text-orange-500">Portfolio</span>
  </div>

  <h1 className="
    font-serif text-[2.5rem] leading-none
    tracking-tighter text-zinc-100 mb-6
  ">
    Portfolio
  </h1>

  <p className="
    font-sans text-sm text-zinc-400 font-light
    leading-relaxed max-w-sm
  ">
    A collection of engineering case studies. Building with an emphasis on performance, precision, and robust architectures.
  </p>
</div>
```

### Project Cards (Mobile)

**Current Desktop:**
- Image left, text right (flex-row on lg)
- `aspect-[4/3]` for images
- Large titles

**Mobile Specification:**

```tsx
// Mobile Project Card Stack
<div className="px-4 space-y-12">
  {projects.map((project, idx) => (
    <article 
      key={idx}
      onClick={() => setSelectedProject(project)}
      className="cursor-pointer"
    >
      {/* Image First on Mobile */}
      <div className="
        aspect-[4/3] bg-zinc-900
        border border-zinc-800/50
        rounded-lg overflow-hidden
        mb-5
      ">
        <ParallaxImage 
          src={project.projectImage}
          alt={project.title}
          className="w-full h-full"
          // Disable parallax on mobile
          imageClassName="opacity-50"
        />
      </div>

      {/* Title and Description */}
      <span className="font-mono text-[9px] text-orange-500 mb-2 block">
        0{idx + 1}
      </span>
      
      <h3 className="
        font-serif text-xl md:text-2xl
        text-zinc-100 mb-3
      ">
        {project.title}
      </h3>
      
      <p className="
        font-sans text-sm text-zinc-400 font-light
        leading-relaxed mb-4 line-clamp-2
      ">
        {project.description}
      </p>

      {/* Tags - horizontal scroll on mobile */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, tagIdx) => (
          <span 
            key={tagIdx}
            className="
              font-mono text-[8px] uppercase tracking-wider
              text-zinc-500 border border-zinc-800
              px-2 py-1 bg-zinc-950/50 rounded
            "
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  ))}
</div>
```

### Technical Skills Grid (Mobile)
- Stack as 1 column instead of 4 columns
- Add `gap-10` between items

---

## Journal Page Mobile Design

### Featured Entry (Mobile)

```tsx
// Featured Entry - Full Width Card
<motion.article 
  onClick={() => setSelectedEntry(featuredEntry)}
  className="
    mx-4 mb-12 p-6
    border border-zinc-800/70 bg-zinc-900/30
    rounded-lg overflow-hidden
    cursor-pointer
    active:opacity-80
  "
>
  {/* Background Image - Subtle */}
  <div className="absolute inset-0 opacity-10">
    <img src={featuredEntry.coverImage} alt="" className="w-full h-full object-cover" />
  </div>

  <div className="relative z-10">
    <div className="flex items-center gap-3 mb-4">
      <span className="font-sans text-[8px] uppercase tracking-widest text-orange-500">
        Featured
      </span>
      <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
      <span className="font-sans text-[8px] uppercase tracking-widest text-zinc-500">
        Vol. 01
      </span>
    </div>

    <h2 className="
      font-serif text-2xl leading-tight
      text-zinc-100 mb-4
    ">
      {featuredEntry.title}
    </h2>

    <p className="
      font-sans text-sm text-zinc-400 font-light
      leading-relaxed line-clamp-3 mb-4
    ">
      {featuredEntry.excerpt}
    </p>

    <div className="flex items-center gap-3 text-zinc-500">
      <Play className="w-4 h-4" />
      <span className="font-sans text-[9px]">Tap to read</span>
    </div>
  </div>
</motion.article>
```

### Category Organization (Mobile)

```tsx
// Category Sections - Stacked
<div className="px-4 space-y-12">
  {groupedCategories.map((section, idx) => (
    <section key={idx} className="border-t border-zinc-800/50 pt-8">
      {/* Category Header */}
      <div className="mb-6">
        <h2 className="font-serif text-2xl text-zinc-200 mb-2">
          {section.title}
        </h2>
        <p className="font-sans text-sm text-zinc-500 font-light">
          {section.description}
        </p>
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {section.entries.map((entry, entryIdx) => (
          <article 
            key={entryIdx}
            onClick={() => setSelectedEntry(entry)}
            className="
              py-4 border-b border-zinc-800/30
              cursor-pointer active:opacity-70
            "
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="font-sans text-[9px] text-zinc-500">
                {formatDate(entry.date)}
              </span>
            </div>
            <h3 className="font-serif text-lg text-zinc-300">
              {entry.title}
            </h3>
          </article>
        ))}
      </div>
    </section>
  ))}
</div>
```

---

## Tech Page Mobile Design

### Build Logs (Mobile)

```tsx
// Tech Logs - Accordion Style
<div className="px-4 space-y-4">
  {logs.map((log) => (
    <div 
      key={log.slug}
      className="
        border border-zinc-800/60 bg-zinc-950/30
        rounded-lg overflow-hidden
      "
    >
      {/* Collapsed Header - Always Visible */}
      <button
        onClick={() => toggleLog(log.slug)}
        className="
          w-full p-4 flex justify-between items-center
          text-left
          min-h-[44px]
          touch-manipulation
        "
      >
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-sans text-[8px] uppercase tracking-widest text-orange-500">
              {log.category}
            </span>
            <span className="w-0.5 h-0.5 rounded-full bg-zinc-700"></span>
            <span className="font-mono text-[8px] text-zinc-600">
              {formatDate(log.date)}
            </span>
          </div>
          <h3 className="font-serif text-lg text-zinc-200">
            {log.title}
          </h3>
        </div>
        <ChevronDown 
          className={`
            w-5 h-5 text-zinc-500 shrink-0
            transition-transform duration-300
            ${expandedLog === log.slug ? 'rotate-180' : ''}
          `} 
        />
      </button>

      {/* Expanded Content */}
      {expandedLog === log.slug && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-zinc-800/40"
        >
          <div className="p-4 bg-zinc-900/20">
            <p className="font-sans text-sm text-zinc-400 font-light leading-relaxed">
              {log.excerpt}
            </p>
            <button 
              onClick={() => setSelectedEntry(log)}
              className="
                mt-4 font-sans text-xs text-orange-500
                hover:text-orange-400
                flex items-center gap-1
              "
            >
              Read full story <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  ))}
</div>
```

### Experiments Section (Mobile)

```tsx
// Experiments - Vertical Stack
<div className="grid grid-cols-1 gap-4 px-4">
  {experiments.map((note, idx) => (
    <div 
      key={idx}
      className="
        p-5 border border-zinc-800/50 bg-zinc-950/20
        rounded-lg
        active:bg-zinc-900/40 transition-colors
      "
    >
      <div className="flex justify-between items-start mb-3">
        <span className="
          font-sans text-[8px] uppercase tracking-widest
          text-orange-500/70 border border-zinc-800
          px-2 py-1 rounded
        ">
          {note.tag}
        </span>
      </div>
      <h3 className="font-serif text-lg text-zinc-200 mb-2">
        {note.title}
      </h3>
      <p className="font-sans text-xs text-zinc-500 font-light">
        {note.preview}
      </p>
    </div>
  ))}
</div>
```

---

## Photography Page Mobile Design

### Hero Section

```tsx
<div className="px-5 pt-24 pb-12">
  <span className="
    absolute top-20 left-0
    text-[3.5rem] font-serif
    text-zinc-900/40 -rotate-90 origin-top-left
    translate-x-[-120%]
  ">
    PHOTOGRAPHY
  </span>

  <h1 className="
    font-serif text-[2.25rem] leading-none
    tracking-tighter text-zinc-100 mb-5
  ">
    Photography
  </h1>

  <p className="
    font-sans text-sm text-zinc-400 font-light
    leading-relaxed max-w-xs
  ">
    A collection of moments gathered over the years. A personal visual diary.
  </p>
</div>
```

### Favorites Section (Mobile)

**Key Changes:**
- Stack vertically instead of grid
- Use `aspect-[3/4]` for portrait orientation
- Add rounded corners (8px) for softer feel

```tsx
<div className="px-4 space-y-6 mb-16">
  {favorites.map((photo, idx) => (
    <article 
      key={idx}
      onClick={() => setSelectedPhoto(photo)}
      className="cursor-pointer"
    >
      {/* Mobile Aspect Ratio - Taller */}
      <div className="
        aspect-[3/4] bg-zinc-900
        border border-zinc-800/50 rounded-lg
        overflow-hidden mb-4
      ">
        <ParallaxImage 
          src={photo.coverImage}
          alt={photo.title}
          className="w-full h-full"
          // Disable parallax on mobile
          imageClassName="grayscale-[30%]"
        />
      </div>

      <h3 className="font-serif text-xl text-zinc-200 mb-2">
        {photo.title}
      </h3>
      <p className="font-sans text-xs text-zinc-500 font-light line-clamp-2">
        {photo.description}
      </p>
    </article>
  ))}
</div>
```

### Photo Grids (Mobile)

```tsx
// 2-Column Grid with rounded corners
<div className="grid grid-cols-2 gap-3 px-4">
  {section.photos.map((photo, pIdx) => (
    <div 
      key={photo.id}
      className={`
        relative overflow-hidden rounded-lg
        aspect-[3/4]
        cursor-pointer
        active:scale-[0.98]
        transition-transform duration-150
      `}
    >
      <img 
        src={photo.src} 
        alt={photo.alt}
        className="
          w-full h-full object-cover
          grayscale-[40%] 
          active:grayscale-0
          transition-all duration-500
        "
      />
    </div>
  ))}
</div>
```

### Gear Section (Mobile)

- Stack as single column
- Horizontal scroll for items if needed
- Add bottom padding for navigation bar

---

## Collection Page Mobile Design

### Timeline (Mobile)

```tsx
// Timeline - Vertical Line with Cards
<div className="px-4 relative">
  {/* Vertical Line */}
  <div className="absolute left-[19px] top-4 bottom-4 w-px bg-zinc-800/50" />

  <div className="space-y-8 py-4">
    {timelineMilestones.map((milestone, idx) => (
      <div key={idx} className="relative pl-10">
        {/* Dot */}
        <div className="absolute left-[15px] top-1.5 w-2 h-2 rounded-full bg-[#0a0a09] border-2 border-zinc-700" />
        
        <div className="mb-1">
          <span className="font-mono text-sm text-orange-500">
            {milestone.year}
          </span>
        </div>
        <h3 className="font-serif text-lg text-zinc-200 mb-2">
          {milestone.title}
        </h3>
        <p className="font-sans text-sm text-zinc-400 font-light leading-relaxed">
          {milestone.desc}
        </p>
      </div>
    ))}
  </div>
</div>
```

### Uses & Gear (Mobile)

```tsx
// Uses Grid - 1 Column
<div className="px-4 space-y-10">
  {Object.entries(uses).map(([category, items]) => (
    <div key={category}>
      <h3 className="font-serif italic text-lg text-zinc-300 mb-4">
        {category}
      </h3>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li 
            key={idx}
            className="
              font-sans text-sm text-zinc-400 font-light
              flex items-center pb-3 border-b border-zinc-900/50
            "
          >
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 mr-3" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  ))}
</div>
```

### Music Section (Mobile)

```tsx
// Music Grid - 2 Columns
<div className="grid grid-cols-2 gap-4 px-4">
  {dynamicMusic.map((track, idx) => (
    <div 
      key={idx}
      onClick={() => setSelectedEntry(track)}
      className="cursor-pointer"
    >
      <div className="
        aspect-square bg-zinc-900
        border border-zinc-800/50 rounded-lg
        mb-3 overflow-hidden
      ">
        <div className="w-full h-full bg-gradient-to-br from-zinc-800/30 to-zinc-900" />
      </div>
      <h3 className="font-serif text-sm text-zinc-200 truncate">
        {track.title}
      </h3>
      <span className="font-sans text-xs text-zinc-500 truncate block">
        {track.description}
      </span>
    </div>
  ))}
</div>
```

---

## Typography Scale

### Mobile Typography System

| Element | Desktop | Mobile | Line Height | Letter Spacing |
|---------|---------|--------|-------------|----------------|
| Page Title | `text-[7rem]` | `text-[2.5rem]` | 1.0 | -0.03em |
| Section Title | `text-5xl` | `text-2xl` | 1.15 | -0.02em |
| Card Title | `text-4xl` | `text-xl` | 1.2 | -0.02em |
| Body Large | `text-xl` | `text-base` | 1.6 | 0 |
| Body | `text-base` | `text-sm` | 1.6 | 0 |
| Caption | `text-xs` | `text-[11px]` | 1.4 | 0.05em |
| Mono/Label | `text-[10px]` | `text-[9px]` | 1.3 | 0.15em |

### CSS Variables (Mobile)

```css
@theme {
  /* Override for mobile-friendly sizing */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  
  /* Mobile-specific spacing */
  --spacing-4: 1rem;       /* 16px */
  --spacing-5: 1.25rem;    /* 20px */
  --spacing-6: 1.5rem;     /* 24px */
  --spacing-8: 2rem;       /* 32px */
  --spacing-12: 3rem;      /* 48px */
  --spacing-16: 4rem;      /* 64px */
}
```

---

## Spacing System

### Mobile Spacing Scale

| Token | Desktop | Mobile | Usage |
|-------|---------|--------|-------|
| `p-6` | 24px | 20px | Page padding |
| `p-8` | 32px | 24px | Section padding |
| `mb-24` | 96px | 48px | Section margins |
| `space-y-32` | 128px | 64px | Large gaps |
| `space-y-16` | 64px | 32px | Medium gaps |
| `gap-6` | 24px | 16px | Grid gaps |
| `gap-4` | 16px | 12px | Tight gaps |

### Recommended Mobile Spacing Classes

```tsx
// Page Container
<div className="px-5 py-6">

// Sections
<section className="py-12">

// Cards
<div className="p-4">

// Between cards
<div className="space-y-4">

// Between sections  
<div className="mb-12">

// Footer from content
<div className="pb-24">
```

---

## Touch Target Guidelines

### Minimum Sizes
- **Touch target**: 44x44px minimum
- **Padding**: 12-16px horizontal, 8-12px vertical
- **Spacing between**: 8px minimum

### Implementation

```tsx
// Button Component
<button
  className="
    min-w-[44px] min-h-[44px]
    px-4 py-2
    flex items-center justify-center
    touch-manipulation
    -webkit-tap-highlight-color: transparent
  "
>
  {/* Content */}
</button>

// Card Touch Area
<article 
  className="
    p-4
    cursor-pointer
    active:opacity-80
    touch-manipulation
  "
>
  {/* Content */}
</article>
```

### Safe Areas (Notch/Dynamic Island)

```tsx
// For iPhone with notch
<div className="
  pt-safe-top
  pb-safe-bottom
  px-safe-left
  px-safe-right
">

// Or use CSS
<nav className="safe-area-pb">
  {/* Fixed bottom nav */}
</nav>
```

```css
/* CSS */
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}

.pt-safe-top {
  padding-top: env(safe-area-inset-top, 0px);
}
```

---

## Component Specifications

### ContentModal (Mobile)

**Current:** Right-side drawer (`max-w-4xl`)

**Mobile:** Full-screen bottom sheet with drag handle

```tsx
// Mobile ContentModal
<div className="
  fixed inset-0 z-[110]
  flex flex-col
  bg-[#0a0a09]
">
  {/* Drag Handle */}
  <div className="flex justify-center py-3">
    <div className="w-10 h-1 rounded-full bg-zinc-800" />
  </div>

  {/* Header */}
  <header className="
    flex justify-between items-center
    px-5 py-3 border-b border-zinc-900
  ">
    <div className="flex items-center gap-3">
      <span className="font-mono text-[8px] text-orange-500 bg-orange-500/10 px-2 py-1 rounded">
        {category}
      </span>
    </div>
    <button 
      onClick={onClose}
      className="w-10 h-10 flex items-center justify-center"
    >
      <X className="w-5 h-5 text-zinc-400" />
    </button>
  </header>

  {/* Scrollable Content */}
  <div className="flex-1 overflow-y-auto px-5 py-6 custom-scrollbar">
    {/* Cover Image - Smaller on mobile */}
    {coverImage && (
      <div className="aspect-[4/3] rounded-lg overflow-hidden mb-6">
        <img src={coverImage} alt={title} className="w-full h-full object-cover" />
      </div>
    )}

    {/* Title */}
    <h1 className="font-serif text-2xl text-zinc-100 mb-4">
      {title}
    </h1>

    {/* Markdown Content */}
    <div className="markdown-body">
      <Markdown>{body}</Markdown>
    </div>
  </div>
</div>
```

### ParallaxImage (Mobile Adaptation)

```tsx
// Disable parallax on mobile for performance
interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  enableParallax?: boolean; // Default: false on mobile
}

export default function ParallaxImage({ 
  src, 
  alt, 
  className = "", 
  imageClassName = "",
  enableParallax = false 
}: ParallaxImageProps) {
  // Check for mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const shouldParallax = enableParallax && !isMobile && !useReducedMotion();

  if (!shouldParallax) {
    return (
      <div className={className}>
        <img src={src} alt={alt} className={imageClassName} />
      </div>
    );
  }

  // Desktop parallax implementation...
}
```

### Footer (Mobile)

```tsx
// Mobile Footer - Stacked
<footer className="
  border-t border-zinc-800/70
  px-5 py-12
  space-y-10
">
  {/* Title */}
  <h2 className="font-serif text-2xl text-zinc-100">
    Let's build something.
  </h2>

  {/* Email Input - Full Width */}
  <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
    <input 
      type="email"
      placeholder="Email Address"
      className="
        flex-1 bg-transparent
        font-sans text-sm text-zinc-200
        placeholder-zinc-600
        outline-none
      "
    />
    <ArrowRight className="w-4 h-4 text-zinc-600" />
  </div>

  {/* Links - 2 Columns */}
  <div className="grid grid-cols-2 gap-8">
    <div>
      <h3 className="font-sans text-[9px] uppercase tracking-[0.25em] text-zinc-600 mb-4">
        Socials
      </h3>
      <ul className="space-y-3">
        <li><a className="font-sans text-sm text-zinc-400">Twitter / X</a></li>
        <li><a className="font-sans text-sm text-zinc-400">LinkedIn</a></li>
        <li><a className="font-sans text-sm text-zinc-400">GitHub</a></li>
      </ul>
    </div>
    <div>
      <h3 className="font-sans text-[9px] uppercase tracking-[0.25em] text-zinc-600 mb-4">
        Contact
      </h3>
      <ul className="space-y-3">
        <li><a className="font-sans text-sm text-zinc-400">Email</a></li>
        <li><a className="font-sans text-sm text-zinc-400">Read.cv</a></li>
      </ul>
    </div>
  </div>

  {/* Copyright */}
  <div className="pt-6 border-t border-zinc-900 flex justify-between">
    <span className="font-sans text-[9px] text-zinc-600">
      © 2026 Arbab Mujtaba
    </span>
  </div>
  
  {/* Extra padding for bottom nav */}
  <div className="h-16" />
</footer>
```

---

## Specific CSS/Tailwind Recommendations

### Tailwind Breakpoint Usage

```css
/* Always mobile-first, use sm/md for larger screens */

/* Good: */
className="text-xl md:text-2xl lg:text-3xl"

/* Avoid: */
className="md:text-5xl text-base"  /* Missing sm */
```

### Mobile-First Class Order

```tsx
<div className="
  /* Base (mobile) styles */
  px-5 py-6 space-y-4 text-sm
  
  /* Tablet */
  md:px-8 md:py-8 md:space-y-6 md:text-base
  
  /* Desktop */
  lg:px-12 lg:py-12 lg:space-y-8 lg:text-lg
">
```

### Responsive Aspect Ratios

```tsx
// Image aspect ratios by breakpoint
<div className="
  aspect-[3/4]       /* Mobile - portrait friendly */
  sm:aspect-[4/3]    /* Tablet */
  lg:aspect-[16/9]  /* Desktop - cinematic */
  xl:aspect-[21/9]  /* Wide desktop */
">
```

### Soft Corners (Mobile Preference)

```tsx
// Add rounded corners on mobile for softer feel
<div className="
  rounded-lg         /* Mobile - more rounded */
  md:rounded-none    /* Desktop - sharp edges */
">
```

---

## Implementation Checklist

### Phase 1: Navigation (Priority: Critical)
- [ ] Create BottomNav component with fixed positioning
- [ ] Add safe-area padding for iPhone
- [ ] Implement touch-friendly navigation items
- [ ] Add active state indicator animations

### Phase 2: Hero Sections (Priority: High)
- [ ] Reduce typography scale for mobile
- [ ] Remove text-outline effect
- [ ] Add subtle background watermark
- [ ] Adjust spacing and padding

### Phase 3: Cards & Components (Priority: High)
- [ ] Convert Gateway cards to vertical stack
- [ ] Update ContentModal to bottom sheet
- [ ] Add rounded corners where appropriate
- [ ] Adjust card heights and proportions

### Phase 4: Content Pages (Priority: Medium)
- [ ] Stack portfolio projects
- [ ] Simplify journal category sections
- [ ] Optimize photography grids (2-col)
- [ ] Compact tech logs accordion

### Phase 5: Interaction Polish (Priority: Medium)
- [ ] Disable parallax on mobile
- [ ] Add touch feedback states
- [ ] Optimize scroll performance
- [ ] Add safe area insets

### Phase 6: Testing & Refinement (Priority: High)
- [ ] Test on iPhone SE (smallest)
- [ ] Test on iPhone Pro Max (largest)
- [ ] Test landscape orientation
- [ ] Verify touch targets meet 44px minimum

---

## Summary

This mobile design specification transforms the current desktop-first portfolio into an intentional, crafted mobile experience that:

1. **Feels Premium**: Maintains the editorial, dark aesthetic while optimizing for smaller screens
2. **Respects Mobile Context**: Bottom navigation, touch-first interactions, reduced motion
3. **Preserves Character**: The "vintage archive" aesthetic is enhanced through softer corners, intimate spacing, and focused content
4. **Performs Well**: Disables heavy parallax effects, simplifies animations, uses native scrolling
5. **Reads Beautifully**: Typography scaled for comfortable mobile reading without overwhelming the small viewport

The mobile experience should feel like flipping through a well-worn notebook — personal, tactile, and deliberately designed.
