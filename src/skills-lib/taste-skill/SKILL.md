---
name: taste-skill
description: Anti-slop frontend skill for landing pages, portfolios, and redesigns. The agent reads the brief, infers the right design direction, and ships interfaces that do not look templated. Real design systems when applicable, audit-first on redesigns, strict pre-flight check. Use when building or redesigning a landing page, portfolio, or marketing site that must not look AI-generated. Detailed rules live in references/, loaded on demand.
---

# tasteskill: Anti-Slop Frontend Skill

> Landing pages, portfolios, and redesigns. Not dashboards, not data tables, not multi-step product UI.
> Every rule below is **contextual**. None of it fires automatically. First read the brief, then pull only what fits.

This file is the index. The full rulebook is split into `references/*.md`, one file per topic. Read only the files the current task needs; do not preload everything.

## Workflow (high level)

1. **Read the brief, not your defaults.** Infer page kind, vibe, audience, constraints. Output a one-line "Design Read" before any code. If genuinely ambiguous, ask exactly one question.
2. **Set the three dials** (`DESIGN_VARIANCE / MOTION_INTENSITY / VISUAL_DENSITY`, baseline `8 / 6 / 4`) from the design read. Steps 1-2 protocol and tables: [brief-and-dials](references/brief-and-dials.md).
3. **Redesign?** Detect the mode first (preserve vs overhaul) and audit before touching anything: [redesign-protocol](references/redesign-protocol.md).
4. **Pick the foundation.** Real design system (official package) vs honest aesthetic build: [design-systems](references/design-systems.md).
5. **Build with the default stack and conventions** ([architecture-conventions](references/architecture-conventions.md)) and apply the bias-correction directives for typography, color, layout, images, copy ([design-directives](references/design-directives.md)).
6. **Add motion only when motivated:** [motion-patterns](references/motion-patterns.md).
7. **Guard the output:** [performance-a11y](references/performance-a11y.md), [dark-mode](references/dark-mode.md), [anti-slop-tells](references/anti-slop-tells.md).
8. **MANDATORY GATE before delivering:** run every box of the [preflight-checklist](references/preflight-checklist.md). If a single box cannot be honestly ticked, the page is not done.

## Always-on hard rules (hot path)

These apply to every task, no exceptions, before reading anything else:

* **ZERO em-dashes.** No `—` anywhere visible (headlines, body, quotes, captions, buttons, alt text). No `–` as separator. Use period, comma, colon, parentheses, or hyphen. Full ban text: [anti-slop-tells](references/anti-slop-tells.md), Section 9.G.
* **Declare the Design Read** (one line) before generating code.
* **Check `package.json` before importing any 3rd-party library.** If missing, output the install command first.
* **The pre-flight check is not optional.** Run the full matrix in [preflight-checklist](references/preflight-checklist.md) before outputting code.

## Reference map (read on demand)

| Read | Covers | Original sections |
|---|---|---|
| [brief-and-dials.md](references/brief-and-dials.md) | Brief inference, Design Read, dial tables and level definitions | 0, 1, 7 |
| [design-systems.md](references/design-systems.md) | System selection, install commands, canonical docs, Liquid Glass | 2, App. A-C |
| [architecture-conventions.md](references/architecture-conventions.md) | Stack, RSC safety, state, icons, emoji, responsiveness, deps | 3 |
| [design-directives.md](references/design-directives.md) | Typography, color, layout discipline, states, images, copy density | 4 |
| [motion-patterns.md](references/motion-patterns.md) | Motion proactivity, GSAP skeletons, forbidden animation patterns | 5 |
| [performance-a11y.md](references/performance-a11y.md) | GPU rules, reduced motion, Core Web Vitals, DOM cost, z-index | 6 |
| [dark-mode.md](references/dark-mode.md) | Dark mode protocol, token strategy, dual-mode testing | 8 |
| [anti-slop-tells.md](references/anti-slop-tells.md) | Forbidden AI-tell patterns, production-test tells, em-dash ban | 9 |
| [pattern-vocabulary.md](references/pattern-vocabulary.md) | Named patterns: heroes, nav, grids, cards, scroll, text, libraries | 10 |
| [redesign-protocol.md](references/redesign-protocol.md) | Mode detection, audit-first, preservation, modernisation levers | 11 |
| [block-library.md](references/block-library.md) | Block Library contract and file schema | 12 |
| [preflight-checklist.md](references/preflight-checklist.md) | Final pre-flight check matrix (mandatory gate) | 14 |

Note: reference files keep the original "Section N" numbering in their cross-references. Resolve them with the table above (e.g. "see Section 9.G" means [references/anti-slop-tells.md](references/anti-slop-tells.md)).

## 13. OUT OF SCOPE

This skill is NOT for:
* Dashboards / dense product UI / admin panels (use Fluent, Carbon, Atlassian, or Polaris from Section 2.A).
* Data tables (use TanStack Table or AG Grid).
* Multi-step forms / wizards (use Form-specific patterns; this skill won't make them better).
* Code editors (use Monaco / CodeMirror with their official skinning).
* Native mobile (use Apple HIG / Material directly).
* Realtime collab UIs (presence, cursors, OT-aware - different problem class).

If the brief is one of the above, **say so explicitly**, point to the right tool, and only apply this skill's marketing-page / about-page / landing-page parts to the surfaces where they apply.
