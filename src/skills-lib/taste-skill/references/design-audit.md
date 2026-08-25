> taste-skill reference file. Loaded on demand from the SKILL.md index.
> Cross-references like "Section N" map to sibling files via the index table in ../SKILL.md.

## 11.G REDESIGN AUDIT CHECKLIST (detail)

Full checklist for the Audit Before Touching step (Section 11.B). Scan the project against every category below and list every match found, feeding the "Patterns to retire" list in 11.B. Where a finding is already governed by an always-on directive elsewhere in this skill, the item below points to that section instead of repeating the fix, so there is one source of truth for the actual rule.

### Typography

- **Browser default fonts or Inter everywhere.** Replace per the approved font list and pairings in Section 4.1.
- **Headlines lack presence.** Increase size for display text, tighten letter-spacing, reduce line-height. Headlines should feel heavy and intentional.
- **Body text too wide.** Cap paragraph width per Section 4.1 (`max-w-[65ch]`) and increase line-height for readability.
- **Only Regular (400) and Bold (700) weights used.** Introduce Medium (500) and SemiBold (600) for more subtle hierarchy.
- **Numbers in proportional font.** Use a monospace font or enable tabular figures (`font-variant-numeric: tabular-nums`) for data-heavy interfaces.
- **Missing letter-spacing adjustments.** Use negative tracking for large headers, positive tracking for small caps or labels.
- **All-caps subheaders everywhere.** Try lowercase italics, sentence case, or small-caps instead. (Distinct from the eyebrow-frequency rule in Section 4.7: this is about styling, that is about how often an eyebrow appears at all.)
- **Orphaned words.** Single words sitting alone on the last line. Fix with `text-wrap: balance` or `text-wrap: pretty`.

### Color and Surfaces

- **Pure `#000000` background or oversaturated / multi-accent colors.** Governed by the Lila Rule and saturation cap in Section 4.2, and the Section 9.A bans. Flag any instance found on the existing site.
- **Mixing warm and cool grays.** Governed by Section 4.2 ("one palette per project"). Flag any inconsistency found.
- **Generic `box-shadow`.** Governed by Section 4.4 (tint shadows to the background hue). Flag any pure-black, untinted shadow found.
- **Flat design with zero texture.** Add subtle noise, grain, or micro-patterns to backgrounds to break digital flatness. Apply per the DOM-cost rule in Section 6.E (fixed, `pointer-events-none` layer only, never on scrolling containers).
- **Perfectly even gradients.** Break the uniformity with radial gradients, noise overlays, or mesh gradients instead of standard linear 45-degree fades.
- **Inconsistent lighting direction.** Audit all shadows to ensure they suggest a single, consistent light source.
- **Random dark section in an otherwise light page (or vice versa).** Governed by the Page Theme Lock in Section 4.11. Flag it as a redesign finding; fix by committing to one theme for the whole page.
- **Empty, flat sections with no visual depth.** Sections that are just text on a plain background feel unfinished. Add background imagery, a pattern, or an ambient gradient, sourced per the priority order in Section 4.8.

### Layout

- **Everything centered and symmetrical.** Governed by the anti-center-bias rule in Section 4.3. Flag it as a finding on redesigns; the override there still applies for editorial/manifesto briefs.
- **Three equal card columns as a feature row.** Banned outright per Section 9.C. Replace with a 2-column zig-zag, asymmetric grid, or horizontal scroll.
- **Using `height: 100vh` for full-screen sections.** Replace with `min-height: 100dvh` to prevent layout jumping on mobile browsers (iOS Safari viewport bug). See the viewport-stability check in the pre-flight matrix (Section 14).
- **Complex flexbox percentage math.** Replace with CSS Grid for reliable multi-column structures.
- **No max-width container.** Add a container constraint (around 1200-1440px) with auto margins so content does not stretch edge-to-edge on wide screens.
- **Cards of equal height forced by flexbox.** Allow variable heights or use masonry when content varies in length.
- **Uniform border-radius on everything, with no documented rule.** Section 4.4's Shape Consistency Lock allows variation only when there is a documented rule (e.g. "buttons full-pill, cards 16px, inputs 8px") followed everywhere. An existing site with radius applied at random, with no rule at all, is the audit finding here.
- **No overlap or depth.** Elements sit flat next to each other. Use negative margins to create layering and visual depth.
- **Symmetrical vertical padding.** Top and bottom padding are always identical. Adjust optically; bottom padding often needs to be slightly larger.
- **Dashboard always has a left sidebar.** Try top navigation, a floating command menu, or a collapsible panel instead.
- **Missing whitespace.** Double the spacing. Let the design breathe. Dense layouts work for data dashboards, not for marketing pages.
- **Buttons not bottom-aligned in card groups.** When cards have different content lengths, CTAs end up at random heights. Pin buttons to the bottom of each card so they form a clean horizontal line regardless of content above.
- **Feature lists starting at different vertical positions.** In pricing tables or comparison cards, the list of features should start at the same Y position across all columns. Use consistent spacing above the list or fixed-height title/price blocks.
- **Inconsistent vertical rhythm in side-by-side elements.** When placing cards, columns, or panels next to each other, align shared elements (titles, descriptions, prices, buttons) across all items. Misaligned baselines make the layout look broken.
- **Mathematical alignment that looks optically wrong.** Centering by the math does not always look centered to the eye. Icons next to text, play buttons in circles, or text in buttons often need 1-2px optical adjustments to feel right.

### Interactivity and States

- **No hover states, no active/pressed feedback, no loading or empty states.** Governed by Section 4.5 (Interactive UI States: skeletal loaders, composed empty states, `-translate-y-[1px]` / `scale-[0.98]` on press). Flag every missing state found on the existing site as a redesign fix.
- **No error states, or errors handled with `window.alert()`.** Add clear, inline error messages for forms per Section 4.5. `window.alert()` specifically is banned; it is a jarring, unstyled browser dialog.
- **Instant transitions with zero duration.** Add smooth transitions (200-300ms) to all interactive elements.
- **Missing focus ring.** Ensure visible focus indicators for keyboard navigation. This is an accessibility requirement, not optional.
- **Dead links.** Buttons that link to `#`. Either link to real destinations or visually disable them.
- **No indication of current page in navigation.** Style the active nav link differently so users know where they are.
- **Scroll jumping.** Anchor clicks jump instantly. Add `scroll-behavior: smooth`.
- **Animations using `top`, `left`, `width`, `height`.** Governed by Section 6.A: animate only `transform` and `opacity`.

### Content

- **Generic names, fake-perfect numbers, placeholder brand names, AI copywriting cliches.** Governed by Section 9.D. Flag every instance found on the existing site; do not repeat the banned-word list here, see that section.
- **Exclamation marks in success messages.** Remove them. Be confident, not loud.
- **"Oops!" error messages.** Be direct: "Connection failed. Please try again."
- **Passive voice.** Use active voice: "We couldn't save your changes" instead of "Mistakes were made."
- **All blog post dates identical.** Randomize dates to appear real.
- **Same avatar image for multiple users.** Use unique assets for every distinct person.
- **Lorem Ipsum.** Never use placeholder latin text. Write real draft copy.
- **Title Case On Every Header.** Use sentence case instead.

### Component Patterns

- **Generic card look (border + shadow + white background) with no elevation purpose.** Governed by Section 4.4: use cards only when elevation communicates hierarchy.
- **Always one filled button + one ghost button.** Add text links or tertiary styles to reduce visual noise.
- **Pill-shaped "New" and "Beta" badges.** Try square badges, flags, or plain text labels.
- **Accordion FAQ sections.** Use a side-by-side list, searchable help, or inline progressive disclosure.
- **3-card carousel testimonials with dots.** Replace with a masonry wall, embedded social posts, or a single rotating quote. See Section 4.10 for quote length and attribution rules once the format is fixed.
- **Pricing table with 3 towers.** Highlight the recommended tier with color and emphasis, not just extra height.
- **Modals for everything.** Use inline editing, slide-over panels, or expandable sections instead of popups for simple actions.
- **Avatar circles exclusively.** Try squircles or rounded squares for a less generic look.
- **Light/dark toggle always a sun/moon switch.** Use a dropdown, system preference detection, or integrate it into settings. See Section 8.C for when a manual toggle is warranted at all.
- **Footer link farm with 4 columns.** Simplify. Focus on main navigational paths and legally required links.

### Iconography

- **Lucide or Feather icons exclusively.** Governed by Section 9.E: use Phosphor, HugeIcons, Radix, or Tabler instead.
- **Rocketship for "Launch", shield for "Security".** Replace cliche metaphors with less obvious icons (bolt, fingerprint, spark, vault).
- **Inconsistent stroke widths across icons.** Audit all icons and standardize to one stroke weight.
- **Missing favicon.** Always include a branded favicon.
- **Stock "diverse team" photos.** Use real team photos, candid shots, or a consistent illustration style instead of uncanny stock imagery.

### Code Quality

- **Div soup.** Use semantic HTML: `<nav>`, `<main>`, `<article>`, `<aside>`, `<section>`.
- **Inline styles mixed with CSS classes.** Move all styling to the project's styling system.
- **Hardcoded pixel widths.** Use relative units (`%`, `rem`, `em`, `max-width`) for flexible layouts.
- **Missing alt text on images.** Describe image content for screen readers. Never leave `alt=""` or `alt="image"` on meaningful images.
- **Arbitrary z-index values like `9999`.** Governed by Section 6.F: establish a documented z-index scale instead.
- **Commented-out dead code.** Remove all debug artifacts before shipping.
- **Import hallucinations.** Check that every import actually exists in `package.json` or the project dependencies.
- **Missing meta tags.** Add proper `<title>`, `description`, `og:image`, and social sharing meta tags.

### Strategic Omissions (what AI typically forgets)

- **No legal links.** Add privacy policy and terms of service links in the footer.
- **No "back" navigation.** Dead ends in user flows. Every page needs a way back.
- **No custom 404 page.** Design a helpful, branded "page not found" experience.
- **No form validation.** Add client-side validation for emails, required fields, and format checks.
- **No "skip to content" link.** Essential for keyboard users. Add a hidden skip-link.
- **No cookie consent.** If required by jurisdiction, add a compliant consent banner.
