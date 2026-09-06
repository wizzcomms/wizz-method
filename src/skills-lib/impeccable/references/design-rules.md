# Design rules — general, new-project, absolute bans, AI slop test

Load this file before producing or reviewing any UI code — it's the ruleset every design/craft/polish/audit command is checked against. Covers: general rules (color, typography, layout, motion, interaction), new-project-only rules (color & theme strategy when no prior work exists), absolute bans (match-and-refuse patterns like side-stripe borders, gradient text, ghost-card shadows), and the two-altitude AI slop test.

### General rules

#### Color

- **Verify contrast.** Body text must hit ≥4.5:1 against its background; large text (≥18px or bold ≥14px) needs ≥3:1. Placeholder text needs the same 4.5:1, not the muted-gray default. The most common failure: muted gray body text on a tinted near-white. If the contrast is even close, bump the body color toward the ink end of the ramp; light gray "for elegance" is the single biggest reason AI designs feel hard to read. <!-- rule:skill-color-verify-contrast -->
- Gray text on a colored background looks washed out. Use a darker shade of the background's own hue, or a transparency of the text color. <!-- rule:skill-color-gray-on-color -->

#### Typography

- Cap body line length at 65–75ch. <!-- rule:skill-typo-line-length -->
- Don't pair fonts that are similar but not identical (two geometric sans-serifs, two humanist sans-serifs). Pair on a contrast axis (serif + sans, geometric + humanist) or use one family in multiple weights. <!-- rule:skill-typo-font-pairing-contrast -->
- Hero / display heading ceiling: clamp() max ≤ 6rem (~96px). Above that the page is shouting, not designing. <!-- rule:skill-typo-hero-ceiling -->
- Display heading letter-spacing floor: ≥ -0.04em. Anything tighter and letters touch; cramped, not "designed". <!-- rule:skill-typo-tracking-floor -->
- Use `text-wrap: balance` on h1–h3 for even line lengths; `text-wrap: pretty` on long prose to reduce orphans. <!-- rule:skill-typo-text-wrap-balance -->

<codex>
One hard typographic ceiling you currently miss:
- Display letter-spacing ≥ -0.04em. Your default of -0.05 to -0.085em on display H1s makes the letters touch and reads as cramped. -0.02 to -0.03em is plenty for tight grotesque display; -0.04em is the floor. <!-- rule:skill-typo-codex-tracking-repeat -->
</codex>

#### Layout

- Vary spacing for rhythm. <!-- rule:skill-layout-vary-spacing -->
- Cards are the lazy answer. Use them only when they're truly the best affordance. Nested cards are always wrong. <!-- rule:skill-layout-cards-lazy -->
- Flexbox for 1D, Grid for 2D. Don't default to Grid when `flex-wrap` would be simpler. <!-- rule:skill-layout-flex-vs-grid -->
- For responsive grids without breakpoints: `repeat(auto-fit, minmax(280px, 1fr))`. <!-- rule:skill-layout-auto-fit-grid -->
- Build a semantic z-index scale (dropdown → sticky → modal-backdrop → modal → toast → tooltip). Never arbitrary values like 999 or 9999. <!-- rule:skill-layout-z-index-scale -->

#### Motion
- Motion should be intentional, and not be an afterthought. consider it as part of the build. <!-- rule:skill-motion-intentional -->
- Don't animate CSS layout properties unless truly needed. <!-- rule:skill-motion-no-layout-animate -->
- Ease out with exponential curves (ease-out-quart / quint / expo). No bounce, no elastic. <!-- rule:skill-motion-ease-out-exp -->
- Use libraries for more advanced motion needs (e.g. motion, gsap, anime.js, lenis etc) <!-- rule:skill-motion-use-libraries -->
- Reduced motion is not optional. Every animation needs a `@media (prefers-reduced-motion: reduce)` alternative: typically a crossfade or instant transition. <!-- rule:skill-motion-reduced-motion -->
- Staggering the items within one list is legitimate. The tell is the uniform reflex (one identical entrance applied to every section), not motion itself; each reveal should fit what it reveals. Suppressing the reflex is never a reason to ship a page with no motion at all. <!-- rule:skill-motion-no-section-fade -->
- Reveal animations must enhance an already-visible default. Don't gate content visibility on a class-triggered transition; transitions pause on hidden tabs and headless renderers, so the reveal never fires and the section ships blank. <!-- rule:skill-motion-reveal-safety -->
- Premium motion materials are not just transform/opacity. Blur, backdrop-filter, clip-path, mask, and shadow/glow are part of the palette when they materially improve the effect and stay smooth. <!-- rule:skill-motion-materials-palette -->

#### Interaction

- Dropdowns rendered with `position: absolute` inside an `overflow: hidden` or `overflow: auto` container will be clipped. Use the native `<dialog>` / popover API, `position: fixed`, or a portal to escape the stacking context. <!-- rule:skill-interaction-dropdown-clipping -->

<gemini>
**Gemini-specific defect: hard ban.** Never animate `<img>` elements on hover. This includes any `transform` on `:hover` of an image, AND `.group:hover .group-hover\:scale` / `.group:hover .group-hover\:rotate` / `.group:hover .group-hover\:translate` patterns from Tailwind that animate a child image via a parent hover. This is your single most common motion tell; it adds no information (the image isn't an action target) and reads as "AI animated this because it could". If a card needs hover feedback, animate the card's background, border, or shadow. Never the image, never via the image's parent. <!-- rule:skill-interaction-gemini-no-image-hover -->
</gemini>

### New projects only (when no prior work exists)

#### Color & Theme

- Use OKLCH. <!-- rule:skill-color-use-oklch -->
- **The cream / sand / beige body bg is the saturated AI default of 2026.** The whole warm-neutral band (OKLCH L 0.84-0.97, C < 0.06, hue 40-100) reads as cream/sand/paper/parchment regardless of what you call it. Token names like `--paper`, `--cream`, `--sand`, `--bone`, `--flour`, `--linen`, `--parchment`, `--wheat`, `--biscuit`, `--ivory` are tells in themselves. If the brief is "warm, traditional, family-coastal-Italian" or "magazine-warm" or "editorial-restraint", DO NOT translate that into a near-white warm-tinted bg; that's the AI move. Pick: (a) a saturated brand color as the body (terracotta, oxblood, deep ochre, near-black), (b) a true off-white at chroma 0 (or chroma toward the brand's own hue, not toward warmth-by-default), or (c) a darker mid-tone tinted neutral that's clearly the brand's own. "Warmth" in the brand is carried by accent + typography + imagery, not by body bg. <!-- rule:skill-color-anti-cream -->
- Tinted neutrals: add 0.005–0.015 chroma toward the brand's hue. Don't default-tint toward warm or cool "because the brand feels that way"; that's the cross-project monoculture move. <!-- rule:skill-color-tinted-neutrals-chroma -->
- When picking a theme: Dark vs. light is never a default. Not dark "because tools look cool dark." Not light "to be safe.".Before choosing, write one sentence of physical scene: who uses this, where, under what ambient light, in what mood. If the sentence doesn't force the answer, it's not concrete enough. Add detail until it does. <!-- rule:skill-color-theme-physical-scene -->
- Pick a **color strategy** before picking colors. Four steps on the commitment axis: <!-- rule:skill-color-strategy-commitment -->
  - **Restrained**: tinted neutrals + one accent ≤10%. Product default; brand minimalism.
  - **Committed**: one saturated color carries 30–60% of the surface. Brand default for identity-driven pages.
  - **Full palette**: 3–4 named roles, each used deliberately. Brand campaigns; product data viz.
  - **Drenched**: the surface IS the color. Brand heroes, campaign pages.

### Absolute bans

Match-and-refuse. If you're about to write any of these, rewrite the element with different structure.

- **Side-stripe borders.** `border-left` or `border-right` greater than 1px as a colored accent on cards, list items, callouts, or alerts. Never intentional. Rewrite with full borders, background tints, leading numbers/icons, or nothing. <!-- rule:skill-ban-side-stripe-borders -->
- **Gradient text.** `background-clip: text` combined with a gradient background. Decorative, never meaningful. Use a single solid color. Emphasis via weight or size. <!-- rule:skill-ban-gradient-text -->
- **Glassmorphism as default.** Blurs and glass cards used decoratively. Rare and purposeful, or nothing. <!-- rule:skill-ban-glassmorphism-default -->
- **The hero-metric template.** Big number, small label, supporting stats, gradient accent. SaaS cliché. <!-- rule:skill-ban-hero-metric -->
- **Identical card grids.** Same-sized cards with icon + heading + text, repeated endlessly. <!-- rule:skill-ban-identical-card-grids -->
- **Tiny uppercase tracked eyebrow above every section.** The 2023-era kicker (small all-caps text with wide tracking, "ABOUT" "PROCESS" "PRICING" above each heading) is now the saturated AI scaffold; it appears on 55-95% of generations regardless of brief, which is the definition of a tell. One named kicker as a deliberate brand system is voice; an eyebrow on every section is AI grammar. Choose a different cadence. <!-- rule:skill-ban-eyebrow-on-every-section -->
- **Numbered section markers as default scaffolding (01 / 02 / 03).** Putting `01 · About / 02 · Process / 03 · Pricing` above every section is the eyebrow trope one tier deeper: reach for it because "landing pages do this" and you're scaffolding by reflex. Numbers earn their place when the section actually IS a sequence (a real 3-step process, an ordered flow, a typed timeline) and the order carries information the reader needs. One deliberate numbered sequence on one page is voice; numbered eyebrows on every section across the site is AI grammar. <!-- rule:skill-ban-numbered-section-markers -->
- **Text that overflows its container.** Long heading words plus large clamp scales plus narrow grids cause headline overflow on tablet/mobile. Test the heading copy at every breakpoint; if it overflows, reduce the clamp max or rewrite the copy. The viewport is part of the design. <!-- rule:skill-ban-text-overflow -->

<codex>
**Codex-specific defects** (your most-frequent giveaways; refuse-and-rewrite):

- **`border: 1px solid X` + `box-shadow: 0 Npx Mpx ...` with M ≥ 16px** on the same element. The "ghost-card" pattern: 1px border plus soft wide drop shadow on buttons and cards. Don't pair them. Pick one (a single solid border at the brand color, OR a defined shadow at no more than 8px blur), never both as decoration. <!-- rule:skill-ban-codex-ghost-card -->
- **`border-radius: 32px+` on cards / sections / inputs.** You over-round. Cards top out at 12–16px; full-pill is fine for tags/buttons. Picking 24/28/32/40px on a card is the codex tell; no brand wants "insanely rounded". <!-- rule:skill-ban-codex-over-round -->
- **Hand-drawn / sketchy SVG illustrations.** Class names like `loose-sketch`, `*-sketch`, `doodle`, `wavy`; `feTurbulence` / `feDisplacementMap` "paper grain" filters; 5-to-30 path crude scenes meant to depict a tangible subject (an otter, a table-and-fork, an album cover). All of these read as amateurish, not whimsical. If you can't render the scene with real assets, ship no illustration. Don't attempt sketchy SVG as a fallback. <!-- rule:skill-ban-codex-sketchy-svg -->
- **`repeating-linear-gradient(...)` stripe backgrounds.** Diagonal stripes in `body:before` or section backgrounds are pure codex decoration. Don't. <!-- rule:skill-ban-codex-stripes -->
- **Meta-criticism copy.** Naming a concept then layering an ironic modifier, or staging a strawman to "correct" it. Make the specific claim instead. <!-- rule:skill-ban-codex-x-theater -->
</codex>

### The AI slop test

If someone could look at this interface and say "AI made that" without doubt, it's failed. Cross-register failures are the absolute bans above. Register-specific failures live in each reference.

**Category-reflex check.** Run at two altitudes; the second one catches what the first one misses.

- **First-order:** if someone could guess the theme + palette from the category alone, it's the first training-data reflex. Rework the scene sentence and color strategy until the answer isn't obvious from the domain. <!-- rule:skill-slop-first-order-check -->
- **Second-order:** if someone could guess the aesthetic family from category-plus-anti-references ("AI workflow tool that's not SaaS-cream → editorial-typographic", "fintech that's not navy-and-gold → terminal-native dark mode"), it's the trap one tier deeper. The first reflex was avoided; the second wasn't. Rework until both answers are not obvious. Ground the direction in the user's brief and inspected references instead of swapping one generic aesthetic for another. <!-- rule:skill-slop-second-order-check -->
