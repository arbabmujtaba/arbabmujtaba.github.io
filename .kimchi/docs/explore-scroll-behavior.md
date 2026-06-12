# Scroll Behavior Analysis - AI Portfolio Site

This document summarizes the scrolling, navigation, and scrollbar behavior across the AI Portfolio codebase.

## 1. Custom Scrollbar Definition and Usage

### Definition (src/index.css)
```css
/* Custom Cinematic Scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.4);
}
```

### Usage Across Components
- **App.tsx**: Container detection for scroll-to-top behavior
- **Navigation.tsx**: Scroll container reference for view navigation
- **FloatingMagicalArrow.tsx**: Scroll position detection and arrow behavior
- **ContentModal.tsx**: Main modal content scrolling
- **DeploymentCenter.tsx**: Deployment center content area
- **PreviewFrame.tsx**: Preview container in Admin editor
- **All Page Components** (Home, Portfolio, Journal, Tech, Photography, Collection, Admin): Main content areas
- **PublishingModal.tsx**: Modal content area

## 2. Scroll-Related Code Snippets

### App.tsx (View Change Scrolling)
```javascript
// Scroll to top on view change
useEffect(() => {
  const scrollContainer = document.querySelector('.custom-scrollbar');
  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: 'instant' });
  }
}, [view]);
```

### Navigation.tsx (Navigation Click Handling)
```javascript
const handleNavigate = (id: string) => {
  const container = document.querySelector('.custom-scrollbar');
  if (container) {
    container.scrollTo({ top: 0, behavior: 'instant' });
  }
  setView(id);
};
```

### FloatingMagicalArrow.tsx (Scroll Detection & Control)
```javascript
// Scroll position detection
const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  if (target && target.classList && target.classList.contains('custom-scrollbar')) {
    const maxScroll = target.scrollHeight - target.clientHeight;
    setIsScrollable(maxScroll > 50);
    setIsAtBottom(target.scrollTop >= maxScroll - 45);
  }
};

// Scroll to top when at bottom
if (scrollTop >= maxScroll - 45) {
  container.scrollTo({ top: 0, behavior: 'smooth' });
}

// Scroll to next section
const nextTarget = targets.find(t => t > scrollTop + 15);
if (nextTarget !== undefined) {
  container.scrollTo({ top: nextTarget, behavior: 'smooth' });
} else {
  container.scrollTo({ top: maxScroll, behavior: 'smooth' });
}
```

### Collection.tsx (Back to Top Button)
```javascript
<ExploreArrow label="Back to Top" direction="up" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
```

### Motion-Based Scroll Effects (Various Components)
```javascript
// Examples from CinematicImageReveal.tsx, QuoteReveal.tsx, ParallaxImage.tsx
const { scrollYProgress } = useScroll({
  target: targetRef,
  container: containerRef,
  offset: ['start end', 'end start'],
});

const smoothProgress = useSpring(scrollYProgress, {
  stiffness: 90,
  damping: 28,
  restDelta: 0.001,
});
```

## 3. Navigation Component Click Handling

The Navigation component (`src/components/Navigation.tsx`) handles clicks through:

1. **Desktop Navigation**: Button elements with `onClick={() => handleNavigate(item.id)}`
2. **Mobile Navigation**: Touch-optimized buttons with identical handlers
3. **handleNavigate Function**:
   - Finds the `.custom-scrollbar` container using `document.querySelector`
   - Scrolls container to top instantly: `container.scrollTo({ top: 0, behavior: 'instant' })`
   - Updates view state via `setView(id)` prop callback

This ensures that whenever users navigate between sections (Home → Portfolio → Journal, etc.), the view automatically scrolls to the top of the newly activated section.

## 4. Page Components with Scroll Containers

All main page components implement scrollable areas using the `.custom-scrollbar` class:

### Common Pattern
```jsx
<div className="flex-grow overflow-y-auto custom-scrollbar [additional classes]">
  <!-- Page content -->
</div>
```

### Specific Implementations
- **Home.tsx**: `className="custom-scrollbar relative z-10 w-full flex-grow overflow-y-auto scroll-smooth"`
- **Portfolio.tsx**: `className="flex-grow overflow-y-auto custom-scrollbar px-4 sm:px-6 md:p-12 lg:p-16 pt-0 relative z-10 w-full max-w-7xl mx-auto"`
- **Journal.tsx**: Similar pattern with `max-w-5xl`
- **Tech.tsx**: Similar pattern with `max-w-7xl`
- **Photography.tsx**: Similar pattern with `max-w-7xl`
- **Collection.tsx**: Similar pattern with `max-w-7xl`
- **Admin.tsx**: 
  - Main content: `flex-grow overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full`
  - Editor pane: `w-full lg:w-1/2 h-full overflow-y-auto border-r border-zinc-900 custom-scrollbar p-6 md:p-12 relative bg-[#0a0a09]`

All containers use `overflow-y-auto` to enable vertical scrolling when content exceeds container height.

## 5. Modal/Content Viewer Components

### ContentModal.tsx
- Main container: `className="relative w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl h-full bg-[#0d0d0c] border-l border-zinc-900 flex flex-col z-20 shadow-2xl overflow-y-auto custom-scrollbar"`
- Scroll locking mechanism:
  ```javascript
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  ```

### PublishingModal.tsx
- Content area: `<div className="px-6 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar">`

### DeploymentCenter.tsx
- Main content: `<div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full">`
- Secondary content: `<div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">`

## 6. CSS Related to Overflow, Scrolling, Position: Sticky

### Overflow Properties
- `overflow-y-auto`: Enables vertical scrolling with scrollbar when needed
- `overflow-x-hidden`: Prevents horizontal scrolling (used on body and containers)
- `overflow-hidden`: Used for clipping in animated containers
- `overflow-visible`: Occasionally used to override defaults

### Scroll Behavior
- `scroll-smooth`: Applied to Home container for smooth scrolling animation
- Custom scrollbar styling via `.custom-scrollbar` class (defined in index.css)

### Position: Sticky Usage
- **Journal.tsx**: Section headers with `sticky top-24` for category headers
- **Photography.tsx**: Section headers with `sticky top-24` for section titles
- **Admin.tsx**: Various sticky elements including form headers and action bars
- **Tech.tsx**: Section headers with `sticky top-0 bg-[#0a0a09]/72 backdrop-blur-sm`

## 7. Browser History/Scroll Restoration Mechanisms

### App.tsx Route Synchronization
```javascript
// Keep routing synchronized if path parameters differ
useEffect(() => {
  const handleLocationChange = () => {
    if (window.location.pathname === '/admin') {
      setView('admin');
    } else {
      setView('home');
    }
  };
  window.addEventListener('popstate', handleLocationChange);
  return () => window.removeEventListener('popstate', handleLocationChange);
}, []);
```

This ensures that browser back/forward navigation properly updates the view state, which then triggers the scroll-to-top effect.

### Limitations
The current implementation **does not preserve scroll position** when:
- Navigating between views (always scrolls to top)
- Opening/closing modals (body scroll is locked/restored but position not saved)
- Using browser back/forward buttons (triggers view change which forces scroll to top)

## 8. Potential Causes of Scroll-Position-Restoration Bug

### Primary Issues Identified

1. **Forced Scroll-to-Top on View Changes**
   - App.tsx effect always scrolls to top when `view` changes
   - No mechanism to preserve or restore previous scroll positions
   - Affects all navigation between main sections (Home, Portfolio, Journal, etc.)

2. **Inconsistent Scroll Container Selection Logic**
   - **Simple approach** (App.tsx, Navigation.tsx): `document.querySelector('.custom-scrollbar')` - returns first match
   - **Complex approach** (FloatingMagicalArrow.tsx): Uses `Array.from(document.querySelectorAll('.custom-scrollbar')).find(el => el.getBoundingClientRect().width > 0)` to find visible container
   - This inconsistency can lead to scrolling the wrong container in edge cases

3. **Modal Body Scroll Locking Without Position Restoration**
   - ContentModal locks body scroll when open (`document.body.style.overflow = 'hidden'`)
   - On close, it simply restores overflow but doesn't save/restore the previous scroll position
   - Users lose their place in the background content when modals open/close

4. **Multiple Concurrent Scroll Containers**
   - Admin interface has dual scroll panes (editor and preview)
   - FloatingMagicalArrow's logic for finding "active" container may not work correctly in split-view scenarios
   - Page components all have their own `.custom-scrollbar` containers, but navigation logic treats them interchangeably

5. **Missing Scroll Position Persistence Mechanism**
   - No system to save scroll position before view changes
   - No restoration of scroll position when returning to a view
   - Particularly problematic for long-scrolling content like Journal or Collection pages

6. **Potential Timing/Race Conditions**
   - Scroll-to-top effects may execute before content is fully rendered/measured
   - Dynamic content loading (especially in Admin CMS) can change scroll heights after initial measurement
   - FloatingMagicalArrow uses intervals (400ms) to update scroll state, which may miss rapid changes

### Specific Vulnerable Scenarios

1. **Journal Reading Experience**: User scrolls halfway through a long journal entry, navigates to Portfolio, then uses browser back button → Returns to Journal scrolled to top instead of previous position

2. **Modal Usage**: User scrolls through content, opens a ContentModal, closes it → Loses original scroll position in background content

3. **Admin Editor**: User works in lower part of a long form, opens a preview modal, closes it → Returns to form scrolled to top

4. **Rapid Navigation**: User quickly clicks through navigation items → FloatingMagicalArrow may not update correctly, causing incorrect arrow behavior

### Recommended Solutions

1. **Implement Scroll Position Persistence**
   - Save scroll position before view changes/modal opens
   - Restore scroll position when returning to views/modals close
   - Use sessionStorage or custom hooks to manage scroll state

2. **Unify Scroll Container Selection**
   - Create a shared utility function for finding the active scroll container
   - Ensure all components use the same logic

3. **Conditional Scroll-to-Top**
   - Only scroll to top when entering a view for the first time
   - Preserve position when returning to previously viewed content
   - Consider adding metadata to track scroll positions per route

4. **Enhanced Modal Handling**
   - Save body scroll position when locking scroll
   - Restore both overflow and scroll position when unlocking
   - Consider using CSS `overscroll-behavior` to prevent chaining

5. **Improve FloatingMagicalArrow Logic**
   - Enhance container detection logic for complex layouts
   - Consider using React refs instead of DOM queries where possible
   - Reduce reliance on setInterval for performance
