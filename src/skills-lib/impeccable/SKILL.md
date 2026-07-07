---
name: impeccable
description: "Use when the user wants to design, redesign, shape, critique, audit, polish, clarify, distill, harden, optimize, adapt, animate, colorize, extract, or otherwise improve a frontend interface. Covers websites, landing pages, dashboards, product UI, app shells, components, forms, settings, onboarding, and empty states. Handles UX review, visual hierarchy, information architecture, cognitive load, accessibility, performance, responsive behavior, theming, anti-patterns, typography, fonts, spacing, layout, alignment, color, motion, micro-interactions, UX copy, error states, edge cases, i18n, and reusable design systems or tokens. Also use for bland designs that need to become bolder or more delightful, loud designs that should become quieter, live browser iteration on UI elements, or ambitious visual effects that should feel technically extraordinary. Not for backend-only or non-UI tasks."
argument-hint: "[{{command_hint}}] [target]"
user-invocable: true
allowed-tools:
  - Bash(npx impeccable *)
license: Apache 2.0
---

Designs and iterates production-grade frontend interfaces. Real working code, committed design choices, exceptional craft.

## Setup (first step, always run before anything else)

You MUST do these steps before proceeding:

1. Run `node {{scripts_path}}/context.mjs` once per session. If you've already seen its output in this conversation, do not re-run it. The script either prints the project's PRODUCT.md (and DESIGN.md when present) as a markdown block, or tells you it's missing. Follow whatever it prints. **If it reports `NO_PRODUCT_MD`, stop and follow `reference/init.md` before doing anything else.** If the output ends with an `UPDATE_AVAILABLE` directive, follow it (ask the user once about updating, then continue). It never blocks the current task.
2. If the user invoked a sub-command (`craft`, `shape`, `audit`, `polish`, ...), you MUST read `reference/<command>.md` next. Non-optional. The reference defines the command's flow; without it you will skip steps the user expects.
3. Familiarize yourself with any existing design system, conventions, and components in the code. Read at least one project file (CSS / tokens / theme / a representative component or page). **Required even when you've loaded a sub-command reference in step 2.** Don't reinvent the wheel; use what's there when it works, branch out when the UX wins.
4. Read the matching register reference. **This is non-optional; skipping it produces generic output.** If the project is marketing, a landing page, a campaign, long-form content, or a portfolio (design IS the product), read `reference/brand.md`. If it is app UI, admin, a dashboard, or a tool (design SERVES the product), read `reference/product.md`. Pick by first match: (1) task cue ("landing page" vs "dashboard"); (2) surface in focus (the page, file, or route being worked on); (3) `register` field in PRODUCT.md.
5. **If the project is brand-new (no existing CSS tokens / theme / committed brand colors found in step 3)**, run `node {{scripts_path}}/palette.mjs` to receive a brand seed color and composition guidance. This is the anchor for your primary brand color. Compose the rest of the palette (bg, surface, ink, accent, muted) around it per the script's instructions. Use OKLCH throughout. **Skip this step only if step 3 found committed brand colors in existing tokens; in that case identity-preservation wins.**

## Design guidance

Produce ready-to-ship, production-grade code, not prototypes or starting points. Take no shortcuts unless the user asks for them (when in doubt, ask). Don't stop until arriving at a complete implementation (beautiful, responsive, fast, precise, bug-free, on brand). You take attention to detail seriously: every page, section or component crafted is battle tested using the tools available to you (browser screenshotting, computer use, etc). {{model}} is capable of extraordinary work. Don't hold back.

**Before writing or reviewing any UI code, load `references/design-rules.md`** — the ruleset every craft/polish/audit/critique pass is checked against. Skipping it is the most common way this skill produces generic or AI-tell-heavy output.

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

Each command's flow lives at `reference/<command>.md` (e.g. `reference/craft.md`, `reference/live.md` — vendored, per Setup step 2). Plus three management commands: `pin <command>`, `unpin <command>`, and `hooks <on|off|status|...>` — see `references/pin-unpin-and-hooks.md`.

**If the first word matches a command** (table above OR `pin` / `unpin` / `hooks`): load its reference file and follow its instructions. Everything after the command name is the target. **If no argument was given, or the intent doesn't obviously name a command**, load `references/routing-rules.md` for the full routing logic (context-aware menu, signal-based recommendations, intent mapping, fallback general invocation).

`teach` is a deprecated alias for `init`: if the user types it, load [reference/init.md](reference/init.md) and proceed as if they ran `init`.

## Reference map — load each file when needed

- `references/design-rules.md` — general + new-project rules, absolute bans, AI slop test. **Load before producing/reviewing UI code.**
- `references/routing-rules.md` — full routing algorithm for no-argument or ambiguous invocations. **Load when you can't map the request to a table row.**
- `references/pin-unpin-and-hooks.md` — the `pin`/`unpin`/`hooks` management flows. **Load when the user invokes one of those.**
- `reference/<command>.md` (singular — e.g. `reference/craft.md`, `reference/brand.md`) — vendored per-command/per-register flows from the `impeccable` npm package, resolved by Setup steps 2 and 4. Not part of this repo.

Zero content was cut — every rule, example, and routing detail lives verbatim in its `references/` file.
