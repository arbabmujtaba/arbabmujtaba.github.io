# Design system contract — Rushes retheme

Binding for every agent working on this branch (`retheme/rushes`). If a rule here conflicts with
older code, this file wins. Verified against the reference screenshots in
`/home/arch/Pictures/website_rethem`.

## 1. Non-negotiables

- **No literal colours.** No hex, `rgb()`, or `rgba()` in `.tsx`. Use the utilities below. The only
  file allowed to contain colour literals is `src/index.css`.
- **Three faces.** Host Grotesk (`font-display`, `font-sans`), Fragment Mono (`font-mono`), and EB
  Garamond (`font-book`) — the manuscript voice: the second line of a `StackedHeading`, notes,
  chapter titles, the hidden layer. `font-serif` is still a legacy alias for the display face.
- **Two themes.** `[data-theme="day"]` on `<html>` flips every token to paper; `data-surface="ink"`
  keeps a subtree dark (hero, reels, photo plates, secret rooms). `.manuscript` is paper at any hour.
  `gilt` is the hidden layer's colour only.
- **All content is the owner's.** Read from `content/` via `src/lib/cms.ts`. Never invent portfolio
  entries, testimonials, prices, or team members, and never copy the reference site's wording.
- **Reduced motion and touch.** Every animation checks `useReducedMotion()`. Scroll-linked and
  parallax effects additionally check
  `useMediaQuery('(pointer: coarse), (max-width: 767px)')`.
- **No horizontal overflow at 320px.** Oversized type must sit inside `overflow-hidden`, and any
  transform that scales or translates must be clipped by a parent.
- **Touch targets ≥ 44px.** Interactive rows use `min-h-[44px]`.
- Preserve existing mobile fixes: root `overflow-x-hidden`, `border-0 sm:border` on the frame, no
  blur filters in page transitions, `aspect-[4/3] sm:aspect-[16/10]` style responsive aspects.

## 2. Colour utilities

Palette: **Midnight Black `#030407`** canvas, **electric cobalt `#1558c9`** accent (Nov 2026; it
replaced the warm ink + ember Rushes palette).

| Utility | Meaning | Notes |
|---|---|---|
| `bg-canvas` | page background | Midnight `#030407` |
| `bg-canvas-deep` | wells, letterboxing, image backdrops | `#010203` |
| `bg-canvas-raised` | panels and cards | `#0a0e17` |
| `bg-canvas-lift` | inputs, icon buttons, chips | `#131a27` |
| `text-zinc-50` | display headings, max contrast | |
| `text-zinc-100` | strong body | |
| `text-zinc-400` | muted body, eyebrow text | |
| `text-zinc-500` | resting state of dim rows | must recover on hover/focus |
| `border-zinc-800` | hairline rules | |
| `border-zinc-700` | stronger rules, framing marks | |
| `bg-accent` / `border-accent` / `ring-accent` | cobalt `#1558c9` — the one accent | fills, rules, rings, glows |
| `text-accent-ink` | cobalt for small type | `#4f87ec` at night (5.9:1); `#1558c9` on paper (5.8:1) |
| `text-on-accent` | type on a cobalt fill | white, 6.4:1. Never `text-canvas` on `bg-accent` (3.2:1). |
| `text-accent` | brand cobalt as type | **display size only** (≥24px, or ≥18.5px bold) — 3.2:1 on Midnight |
| `text-alarm` / `bg-alarm` | deep red `#c22e1f` — REC dot, destructive | |
| `text-moss` | `#7fa654` — success / published | |
| `text-signal` / `bg-signal` | acid lime `#e4fe00` | **admin in-flight states only.** Never on public pages — it appears nowhere in the reference. |
| `bg-bone` | `#eef1f6` | only via `data-surface="bone"` — **no page opts in today** |
| `text-gilt` | moonlight `#9db7e6` (paper: `#3d5a8a`) | hidden layer only; the token kept its old name |

Every `zinc-*` and `orange-*` utility is re-pointed at surface-aware slots, so adding
`data-surface="bone"` to any wrapper inverts that whole subtree with no other changes. `orange-*` is
legacy — write `accent` in new code.

The Journal and Collection indexes were briefly set on the bone surface. They are back on the dark
canvas at the owner's request: on an otherwise near-black site, a full-page paper surface read as a
rendering fault rather than an editorial choice. The surface itself is kept because it is where a
long-form reading view would go if one is ever wanted — but if you opt a subtree in, re-measure the
two faintest ink steps first: against bone, `--ink-5` lands at 2.75:1 and `--ink-6` at 2.11:1, both
below the floor, which is why the removed pages each carried a token correction.

## 3. Primitives — `src/components/rushes` (import from the barrel)

| Component | Use for | Key props |
|---|---|---|
| `RecLabel` | every section eyebrow | `lowercase`, `bright`, `quiet` |
| `StackedHeading` | two-line lowercase display heading | `lines: [string, string?]`, `body`, `size`, `as` |
| `Marquee` | tickers (roles, tools, gear) | `duration`, `reverse`, `fade` |
| `NumberedItem` | `01 label` index rows | `index`, `label`, `description`, `meta`, `onClick` |
| `CountUp` | animated figures in the stat sentence | `value`, `suffix`, `duration` |
| `TagChip` | uppercase category tags | `tone: default \| accent \| signal` |
| `Accordion` | disclosure lists (TIL, questions) | `items: AccordionEntry[]` |
| `FrameCard` | image plates | `title`, `image`, `tag`, `index`, `excerpt`, `aspect`, `onClick` |
| `PillButton` | rounded CTAs | `tone: solid \| ghost`, `href` or `onClick` |
| `QuotePanel` | interlude quotes in a raised panel | `entries`, `activeIndex`, `onSelect` |
| `ImageTypeMask` | wordmark with a photo through the letters | `text`, `image`, `size` |

Do not duplicate these. If a page needs a variant, extend the primitive with a prop.

## 4. Layout grammar

Section skeleton:

```tsx
<section className="px-4 py-20 md:px-12 md:py-32 lg:px-16">
  <RecLabel>frames</RecLabel>
  <StackedHeading
    lines={['line one', 'line two']}
    body="One supporting sentence."
    className="mt-7"
  />
  {/* content */}
</section>
```

Rules observed in the reference:

- Eyebrow, then a gap, then the two-line heading; line 1 is `zinc-50`, line 2 is `zinc-400`.
- Headings are sentence case: line 1 grotesk, line 2 book italic (`StackedHeading` does this).
- Display tracking is tight: `tracking-[-0.05em]` at large sizes.
- Numbered lists are separated by `border-b border-zinc-800` with generous vertical padding
  (`py-8 md:py-12`), the label on the left and the description right-aligned on desktop.
- Figures (prices, specs, counts) sit far right in `text-accent` at display size.
- Mono is for labels, metadata, and quotes — never for body paragraphs.
- Page furniture classes already exist: `.page-shell`, `.page-intro` + `data-mark`, `.page-title`,
  `.page-eyebrow`, `.page-description`, `.image-frame`, `.markdown-body`, `.film-grain`,
  `.hairline-grid`.

## 5. Motion

- Single easing curve: `[0.16, 1, 0.3, 1]`, available in CSS as `var(--ease-rushes)`.
- Entrances: `initial={{ opacity: 0, y: 18–26 }}` → `whileInView`, `viewport={{ once: true }}`,
  duration 0.7–0.95s.
- Headings wipe up from `overflow-hidden` wrappers (see `StackedHeading`) — never animate
  `clip-path` on the text node itself, it crops descenders.
- No infinite loops except `Marquee` and the `RecLabel` dot.
- No timers. No `setInterval`. The retired background stack used three; that regression must not
  return.

## 6. Verification before handing work back

```
npm run lint          # tsc --noEmit, must be clean
npm run build         # must succeed
grep -rn "#0a0a09\|orange-[0-9]\|images.unsplash" src/   # must return nothing
grep -rnE "(^|[^-])text-accent([^-]|$)" src/ --include=*.tsx  # only display-size type
```

Plus: no `console` noise, no horizontal scrollbar at 320px, and every new interactive element
reachable by keyboard.
