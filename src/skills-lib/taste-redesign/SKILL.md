---
name: taste-redesign
description: Upgrades existing websites and apps to premium quality. Audits current design, identifies generic AI patterns, and applies high-end design standards without breaking functionality. Works with any CSS framework or vanilla CSS.
---

# Redesign Skill

## How This Works (first step)

When applied to an existing project, follow this sequence:

1. **Scan** — Read the codebase. Identify the framework, styling method (Tailwind, vanilla CSS, styled-components, etc.), and current design patterns.
2. **Diagnose** — Load `references/design-audit.md` and run through the full checklist. List every generic pattern, weak point, and missing state you find.
3. **Fix** — Load `references/upgrade-techniques.md` for high-impact replacements, then apply targeted upgrades working with the existing stack. Do not rewrite from scratch. Improve what's there. Follow the Fix Priority order below.

## Fix Priority

Apply changes in this order for maximum visual impact with minimum risk:

1. **Font swap** — biggest instant improvement, lowest risk
2. **Color palette cleanup** — remove clashing or oversaturated colors
3. **Hover and active states** — makes the interface feel alive
4. **Layout and spacing** — proper grid, max-width, consistent padding
5. **Replace generic components** — swap cliche patterns for modern alternatives
6. **Add loading, empty, and error states** — makes it feel finished
7. **Polish typography scale and spacing** — the premium final touch

## Rules

- Work with the existing tech stack. Do not migrate frameworks or styling libraries.
- Do not break existing functionality. Test after every change.
- Before importing any new library, check the project's dependency file first.
- If the project uses Tailwind, check the version (v3 vs v4) before modifying config.
- If the project has no framework, use vanilla CSS.
- Keep changes reviewable and focused. Small, targeted improvements over big rewrites.

## Reference map — load each file when you reach that step

- `references/design-audit.md` — the full audit checklist across 9 categories (Typography, Color and Surfaces, Layout, Interactivity and States, Content, Component Patterns, Iconography, Code Quality, Strategic Omissions). **Load during the Diagnose step.**
- `references/upgrade-techniques.md` — high-impact techniques (Typography, Layout, Motion, Surface upgrades) to replace generic patterns found in the audit. **Load during the Fix step.**

Zero content was cut when this skill was split — every audit item and technique above lives verbatim in its `references/` file.
