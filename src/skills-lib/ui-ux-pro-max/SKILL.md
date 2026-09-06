---
name: ui-ux-pro-max
description: "UI/UX design intelligence. 67 styles, 96 palettes, 57 font pairings, 25 charts, 13 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient. Integrations: shadcn/ui MCP for component search and examples. Use when the user asks to design, build, or review UI/UX, pick a color palette or font pairing, or style a component like a button, modal, navbar, or card."
---
# UI/UX Pro Max - Design Intelligence

Comprehensive design guide for web and mobile applications. Contains 67 styles, 96 color palettes, 57 font pairings, 99 UX guidelines, and 25 chart types across 13 technology stacks. Searchable database with priority-based recommendations, driven by `scripts/search.py` (Python CLI).

## When to Apply

Reference these guidelines when:
- Designing new UI components or pages
- Choosing color palettes and typography
- Reviewing code for UX issues
- Building landing pages or dashboards
- Implementing accessibility requirements

## First Step

### Wizz: construction entry point

Before producing UI code, inspect the existing project and choose the research skill:

- New landing page or a full page composition: invoke `skill:premium-landing-ui-researcher` for source research and section planning.
- A component or effect in an existing project: invoke `skill:ui-component-curator` to inspect compatible candidates.
- Existing UI polish only: invoke `skill:impeccable`; invoke `skill:taste-skill` when a redesign direction is needed.
- HTML prototype/visual variants: invoke `skill:huashu-design`. Stitch-to-React conversion: invoke `skill:react-components`.

The local Python database below recommends design tokens and patterns; it does **not** search the web, inspect component source code, or prove that a component exists. For component research, require exact demo/source URLs, inspected files or registry items, revision/date, license, dependencies and a fit decision. Continue with an available public source if one fails; state any unverified result. Do not claim research based only on the database output.

### Local design-system search

Analyze the user request (product type, style keywords, industry, stack). Use `--design-system` for a new page/project or a change to the overall visual direction:

```bash
python3 scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

Run from this skill's directory. For a targeted concern, use `--domain`; for implementation guidance, use a separate `--stack` query inferred from the project. This bundled engine ignores `--stack` in `--design-system` mode. If no stack can be inferred and it matters, ask instead of assuming Tailwind.

Use one dominant intent and 2–5 meaningful terms per query. Verify the returned category and fit before applying results. Retry once with a narrower query if results are off-topic; after that, label general guidance as a fallback. Do not persist unverified output. When using `--persist`, pass `--output-dir` for the project and inspect existing design artifacts first: this bundled version can overwrite them. Needs Python 3 — see `references/workflow-guide.md` if `python3 --version` fails.

## References (load on demand)

- `references/workflow-guide.md` — Python prerequisites + the complete 4-step workflow (analyze → generate design system with `--persist`/hierarchical page overrides → supplement with domain searches → stack guidelines) + a full worked example + tips. Load when actually executing a build/review, not just deciding whether to use the skill.
- `references/rules-quick-reference.md` — the 8 priority rule categories (accessibility, touch, performance, layout, typography, animation, style, charts) with every rule ID inside each. Load when auditing existing code for UX issues.
- `references/search-reference.md` — full table of the 10 search `--domain` values and 10 `--stack` values with example keywords, plus `--design-system` output format flags (ascii/markdown). Load when picking which domain/stack/format to search or output.
- `references/common-rules-checklist.md` — commonly-missed "looks unprofessional" rules (icons, hover, light/dark contrast, spacing) as do/don't tables, plus the pre-delivery QA checklist. Load right before delivering UI code.
