---
name: ui-ux-pro-max
description: "UI/UX design intelligence. 67 styles, 96 palettes, 57 font pairings, 25 charts, 13 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient. Integrations: shadcn/ui MCP for component search and examples."
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

Analyze the user request (product type, style keywords, industry, stack), then **always start with `--design-system`** to get a comprehensive recommendation with reasoning:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

If user doesn't specify a stack, default to `html-tailwind`. Needs Python 3 — see `references/workflow-guide.md` if `python3 --version` fails.

## References (load on demand)

- `references/workflow-guide.md` — Python prerequisites + the complete 4-step workflow (analyze → generate design system with `--persist`/hierarchical page overrides → supplement with domain searches → stack guidelines) + a full worked example + tips. Load when actually executing a build/review, not just deciding whether to use the skill.
- `references/rules-quick-reference.md` — the 8 priority rule categories (accessibility, touch, performance, layout, typography, animation, style, charts) with every rule ID inside each. Load when auditing existing code for UX issues.
- `references/search-reference.md` — full table of the 10 search `--domain` values and 10 `--stack` values with example keywords, plus `--design-system` output format flags (ascii/markdown). Load when picking which domain/stack/format to search or output.
- `references/common-rules-checklist.md` — commonly-missed "looks unprofessional" rules (icons, hover, light/dark contrast, spacing) as do/don't tables, plus the pre-delivery QA checklist. Load right before delivering UI code.
