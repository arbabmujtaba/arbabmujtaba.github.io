# Design system contract — Rushes retheme

Binding for every agent working on this branch (`retheme/rushes`). If a rule here conflicts with
older code, this file wins. Verified against the reference screenshots in
`/home/arch/Pictures/website_rethem`.

## 1. Non-negotiables

- **No literal colours.** No hex, `rgb()`, or `rgba()` in `.tsx`. Use the utilities below. The only
  file allowed to contain colour literals is `src/index.css`.
- **No new fonts.** Two faces only: Host Grotesk (`font-display`, `font-sans`) and Fragment Mono
  (`font-mono`). `font-serif` is a legacy alias that resolves to the display face — do not add serifs.
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

| Utility | Meaning | Notes |
|---|---|---|
| `bg-canvas` | page background | near-black `#0a0a0a` |
| `bg-canvas-deep` | wells, letterboxing, image backdrops | `#050505` |
| `bg-canvas-raised` | panels and cards | `#151519` |
| `bg-canvas-lift` | inputs, icon buttons, chips | `#232323` |
| `text-zinc-50` | display headings, max contrast | |
| `text-zinc-100` | strong body | |
| `text-zinc-400` | muted body, eyebrow text | |
| `text-zinc-500` | resting state of dim rows | must recover on hover/focus |
| `border-zinc-800` | hairline rules | |
| `border-zinc-700` | stronger rules, framing marks | |
| `text-accent` / `bg-accent` | ember `#e2612f` — the one accent | |
| `text-alarm` / `bg-alarm` | deep red `#c22e1f` — REC dot, destructive | |
| `text-moss` | `#7fa654` — success / published | |
| `text-signal` / `bg-signal` | acid lime `#e4fe00` | **admin in-flight states only.** Never on public pages — it appears nowhere in the reference. |
| `bg-bone` | `#f4f2ed` | only via `data-surface="bone"` — **no page opts in today** |

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
- Headings are **lowercase**. The only uppercase display type is the hero and footer wordmarks.
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
```

Plus: no `console` noise, no horizontal scrollbar at 320px, and every new interactive element
reachable by keyboard.
