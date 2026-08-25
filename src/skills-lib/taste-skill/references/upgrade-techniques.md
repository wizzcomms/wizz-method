> taste-skill reference file. Loaded on demand from the SKILL.md index.
> Cross-references like "Section N" map to sibling files via the index table in ../SKILL.md.

## 11.H MODERNISATION TECHNIQUES (detail)

High-impact techniques for the Modernisation Levers in Section 11.D, once the audit checklist (Section 11.G) has identified which categories need work. Grouped by Typography, Layout, and Motion/Surface. Where a technique already has a canonical skeleton or named pattern elsewhere in this skill, this file points there instead of restating it, so there is one implementation to maintain.

### Typography Upgrades

- **Variable font animation.** Interpolate weight or width on scroll or hover for text that feels alive.
- **Outlined-to-fill transitions.** Text starts as a stroke outline and fills with color on scroll entry or interaction. Named pattern: "Gradient Stroke Animation" in Section 10.
- **Text mask reveals.** Large typography acting as a window to video or animated imagery behind it. Named pattern: "Text Mask Reveal" in Section 10; use that vocabulary entry when scoping the work.

### Layout Upgrades

- **Broken grid / asymmetry.** Elements that deliberately ignore column structure: overlapping, bleeding off-screen, or offset with calculated randomness. Reach for this beyond the baseline anti-center-bias rule in Section 4.3 when the brief wants a stronger break from the grid.
- **Whitespace maximization.** Aggressive use of negative space to force focus on a single element.
- **Parallax card stacks.** Sections that stick and physically stack over each other during scroll. Implement with the canonical Sticky-Stack skeleton in Section 5.A; named pattern "Sticky Scroll Stack" in Section 10.
- **Split-screen scroll.** Two halves of the screen sliding in opposite directions. Named pattern "Split-Screen Scroll" in Section 10.

### Motion Upgrades

- **Smooth scroll with inertia.** Decouple scrolling from browser defaults for a heavier, cinematic feel.
- **Staggered entry.** Elements cascade in with slight delays, combining Y-axis translation with opacity fade. Never mount everything at once. Implement with the Scroll-Reveal Stagger skeleton in Section 5.C, or `staggerChildren` per Section 5.D.
- **Spring physics.** Replace linear easing with spring-based motion for a natural, weighty feel on all interactive elements. Parameters and when to use them: Section 5 (Perpetual Micro-Interactions).
- **Scroll-driven reveals.** Content entering through expanding masks, wipes, or draw-on SVG paths tied to scroll progress. Distinct from the simple enter-on-scroll stagger in Section 5.C: this is for a deliberate reveal choreography, not a generic list-item fade-in.

### Surface Upgrades

- **True glassmorphism.** Go beyond `backdrop-filter: blur`. Full technique (1px inner border, inset shadow, reduced-transparency fallback) and the honest Apple Liquid Glass distinction live in Section 5 (Liquid Glass / Glassmorphism) and design-systems.md Appendix C.
- **Spotlight borders.** Card borders that illuminate dynamically under the cursor. Named pattern "Spotlight Border Card" in Section 10.
- **Grain and noise overlays.** A fixed, `pointer-events-none` overlay with subtle noise to break digital flatness. Apply per the DOM-cost rule in Section 6.E: fixed layer only, never on a scrolling container.
- **Colored, tinted shadows.** Shadows that carry the hue of the background rather than using generic black. Full rule in Section 4.4.
