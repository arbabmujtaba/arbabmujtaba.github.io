# Retheme kickoff prompt

Copy/paste this to start (or resume) the autonomous retheme run.

---

Execute the full Rushes retheme autonomously. Read `.kiro/RETHEME_PLAN.md` and
`.kiro/PROJECT_CONTEXT.md` first — they hold the audit, the design tokens extracted from
https://rushes.framer.website/, the section mapping, and the phase plan. Follow that plan.
Also read the existing mobile audits in `.kimchi/ferments/019eb201-*/docs/` before touching
responsive work.

## DECISIONS ALREADY MADE — do not ask again

1. **Dual surface.** Primary canvas warm near-black `#1a1a18`; bone `#f4f2ed` as an inverted
   surface for Journal reading views and the Collection index. Everything else dark.
2. **Accent:** ember `#e2612f` primary. Acid lime `#e4fe00` used sparingly as a signal colour only
   (REC dots, live/in-flight states). Retire `#f97316`.
3. **Fonts:** Host Grotesk (display/UI) + Fragment Mono (mono). Delete the Sora "serif" token and
   the Inter/JetBrains Mono links. No serif in this design.
4. **Admin:** local-only. Move the React admin to `/studio`, delete `public/admin` + the
   `decap-cms` dependency, keep the existing publish pipeline (edit locally → pipeline commits →
   Actions deploys). Harden `server.ts` as specified in Phase 7c before anything else touches it.
5. **Contact:** mailto + social links block. No form — the host is static.
6. Keep the `REC:` motif literally.

## HARD CONSTRAINTS

- Target is GitHub Pages: fully static, no runtime API, `base: '/'`. Anything requiring a server
  must work locally only and must not break the deployed build.
- Work on branch `retheme/rushes`. Never commit to `main`, never force-push, never merge to `main` —
  merging triggers a live deploy and it must be reviewed first.
- Everything must be my own content. Use my markdown in `content/` and my images in
  `public/uploads/`. Replace all 13 Unsplash placeholder URLs with my photographs.
- Do not copy the reference's copy text, images, or section subjects (pricing/testimonials/team).
  Style grammar only.

## WHAT TO FIGURE OUT (decide and document, don't ask)

- **Which of my images goes where.** Inventory `public/uploads/` (38 originals across photography,
  journal, home, collection, general), then assign: hero backdrop, the 5 gateway images, section
  backdrops, card covers, and the portrait placement. Judge by orientation, subject, tonal weight
  against the dark canvas, and file size. Write the assignments and reasoning into
  `.kiro/IMAGE_MAP.md`. If a slot has no good candidate, say so explicitly and use a tasteful
  type-only or grain-only treatment instead of stock imagery.
- **Exact section order and copy placement** for every page, using the mapping table in the plan
  (timeline → team-card grammar, gear → tier-card grammar, quotes → testimonial slot,
  favorites/TIL → accordion).
- **Motion tuning.** Port the reference's motifs — REC labels, stacked lowercase two-line headings,
  `01/` numbered rows, seamless ×3 marquees, count-up stats, uppercase tags — using `motion/react`
  and the existing ease `[0.16, 1, 0.3, 1]`. Retire the glow stack (`AmbientGlow`,
  `AnimatedGradientBg`, `MagicParticles`, `CursorAura`) in favour of film grain + hairline grid.

## MOBILE AND DESKTOP, BOTH FIRST-CLASS

- Verify layout at 390, 768, 1024, and 1440 px.
- Marquees, parallax, and scroll-linked transforms must degrade on touch devices (the codebase
  already has `useMediaQuery('(pointer: coarse), (max-width: 767px)')` — use it) and must fully
  respect `prefers-reduced-motion`.
- No horizontal overflow at any width. Tap targets ≥ 44px. Text contrast ≥ 4.5:1 on both the ink
  and bone surfaces — check both.
- Images must ship responsive srcset via the existing `getLocalWebpSources`, and the optimizer from
  Phase 8 must exist and run as a prebuild step so new uploads never break.

## USE SUBAGENTS — suggested split

- **A**: Phase 1 token layer + Phase 2 motif primitives (blocks everything else)
- **B**: Phase 4 Home, after A
- **C**: Phase 5 inner pages (Portfolio, Photography, Journal, Tech, Collection), after A
- **D**: Phase 6 detail routes + `404.html` fallback + SEO/OG/sitemap
- **E**: Phase 7 admin split, restyle, and `server.ts` hardening
- **F**: Phase 8 image optimizer + `IMAGE_MAP.md` assignments
- **G**: reviewer — audits each finished phase against this prompt and the plan, loops work back
  with `NEEDS_CHANGES` until it passes

## DEFINITION OF DONE — all must pass, with output shown

- `npm run lint` (`tsc --noEmit`) clean
- `npm run build` clean
- `npx tsx tests/contentState.test.ts` all passing
- `tsconfig` `strict: true` enabled and all resulting errors fixed
- dev server smoke test: every route (`/`, `/portfolio`, `/journal`, `/tech`, `/photography`,
  `/collection`, `/studio`, and one detail route per collection) returns 200 and renders its
  expected markers
- `dist/404.html` exists and the SPA deep-link fallback works
- zero remaining `#0a0a09` literals, zero `orange-*` usages, zero Unsplash URLs in `src/` and `content/`
- the path traversal in `server.ts` is closed — prove it by re-running
  `GET /api/content/journal/..%2F..%2FREADME` and showing it now rejects
- unused deps removed (`@google/genai`, `react-hook-form`, `zod`, duplicate `vite`, `decap-cms`),
  `package.json` renamed off `react-example`, real README written
- a before/after summary of what changed per page

If a browser is needed to verify runtime errors or responsive behaviour, Playwright may be added as
a dev-only dependency with smoke tests. Commit in logical chunks with clear messages. If something
genuinely ambiguous isn't covered above, pick the option most consistent with the plan, note it in
the summary, and keep going — don't stall.
