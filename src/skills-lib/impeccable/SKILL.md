---
name: impeccable
description: "Use when the user wants to review, audit, polish, redesign or improve a frontend interface. Covers hierarchy, accessibility, responsive layout, typography, color, motion, UX copy and component consistency. Wizz's self-contained adaptation runs on project evidence and bundled references."
argument-hint: "[audit|critique|polish|shape|document|adapt|harden] [target]"
user-invocable: true
license: Apache 2.0
---

# Impeccable — Wizz adaptation

Design and review working interfaces using project evidence. This bundle contains instructions and design rules; it does not ship the upstream CLI, detector, context scripts or native engine. Do not invent commands or claim those checks ran.

## Setup

1. Read the user's brief, existing PRODUCT.md/DESIGN.md when present, and at least one relevant UI source file (tokens, theme, component or page). Missing documents alone do not make an existing project greenfield.
2. Preserve the established identity during refinement. For a requested redesign, choose a new direction while preserving product facts, functionality and user constraints. Explicit user choices take precedence over generic anti-pattern warnings.
3. Choose the surface mode: **Persuade** (landing/marketing), **Operate** (app/dashboard), **Read** (docs/articles) or **Experience** (portfolio/gallery). A product can have surfaces in different modes.
4. Map the requested action using [routing-rules](references/routing-rules.md). Read [command-workflows](references/command-workflows.md) for the relevant workflow and [design-rules](references/design-rules.md) before reviewing or changing UI.
5. For new nontrivial components, invoke `skill:premium-landing-ui-researcher` or `skill:ui-component-curator` to obtain inspected sources. Do not replace source research with generic taste recommendations.

## Verification

Build the authorized change, inspect the affected desktop/mobile states in one batch, fix the observed issues together and confirm once more. Additional passes need a specific unresolved defect. Verify keyboard/focus, responsive overflow, reduced-motion and relevant project checks. If the app cannot run, use current screenshot fixtures and code, and state the limitation.

Report findings with file/route, observed evidence, impact and proposed correction. Distinguish observed defects from taste preferences. Never claim an automatic detector, browser test or performance measurement without running it.

## Commands

| Command | Category | Description |
|---|---|---|
| `craft [feature]` | Build | Shape, then build a feature end-to-end |
| `shape [feature]` | Build | Plan UX/UI before writing code |
| `init` | Build | Set up project context: PRODUCT.md, DESIGN.md, live config, next steps |
| `document` | Build | Generate DESIGN.md from existing project code |
| `extract [target]` | Build | Pull reusable tokens and components into design system |
| `critique [target]` | Evaluate | UX design review with heuristic scoring |
| `audit [target]` | Evaluate | Technical quality checks (a11y, perf, responsive) |
| `polish [target]` | Refine | Final quality pass before shipping |
| `bolder [target]` | Refine | Amplify safe or bland designs |
| `quieter [target]` | Refine | Tone down aggressive or overstimulating designs |
| `distill [target]` | Refine | Strip to essence, remove complexity |
| `harden [target]` | Refine | Production-ready: errors, i18n, edge cases |
| `onboard [target]` | Refine | Design first-run flows, empty states, activation |
| `animate [target]` | Enhance | Add purposeful animations and motion |
| `colorize [target]` | Enhance | Add strategic color to monochromatic UIs |
| `typeset [target]` | Enhance | Improve typography hierarchy and fonts |
| `layout [target]` | Enhance | Fix spacing, rhythm, and visual hierarchy |
| `delight [target]` | Enhance | Add personality and memorable touches |
| `overdrive [target]` | Enhance | Push past conventional limits |
| `clarify [target]` | Fix | Improve UX copy, labels, and error messages |
| `adapt [target]` | Fix | Adapt for different devices and screen sizes |
| `optimize [target]` | Fix | Diagnose and fix UI performance |
| `live` | Iterate | Visual variant mode: pick elements in the browser, generate alternatives |


Command names above select the bundled [command-workflows](references/command-workflows.md); they are not shell commands. Management requests (`pin`, `unpin`, `hooks`) use [pin-unpin-and-hooks](references/pin-unpin-and-hooks.md). `teach` aliases `init`.

## References

- [Design rules](references/design-rules.md): visual, interaction and anti-pattern checks.
- [Routing rules](references/routing-rules.md): map intent to the appropriate workflow.
- [Command workflows](references/command-workflows.md): executable steps using available project tools.
- [Management capabilities](references/pin-unpin-and-hooks.md): limits of this instruction-only bundle.

Upstream: [pbakaus/impeccable](https://github.com/pbakaus/impeccable). The current upstream skill 4.2.1 uses a native engine; this Wizz adaptation does not imply that engine is installed.
