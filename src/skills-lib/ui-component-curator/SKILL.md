---
name: ui-component-curator
description: analyze an existing frontend project, infer its visual style and product tone, then research and recommend compatible UI components and effects from public component catalogs, registries and source repositories. use when the user wants help choosing components, effects, sections, or visual patterns that fit an existing project — especially hero effects, cards, buttons, testimonials, pricing sections, navigation, or any interactive pattern. trigger whenever the user wants to add a UI element and wants Claude to study the project first before suggesting options. always inspect the codebase and exact component sources, provide evidence and plan before editing.
---

# Overview

Read the project. Infer its design language. Then find components that feel like they already belong there.

Act as a UI curator with taste and restraint — not a gallery explorer. Optimize for consistency over novelty.

**Golden rule:** Inspect the project → search real sources → document evidence → plan → implement within the user's authorization. Ask only when a material choice or paid access is unresolved.

---

# Step-by-step flow

## 1. Read and infer the style DNA

Inspect the relevant UI files before searching anything. Look at: main shell, hero/homepage, shared primitives, buttons, cards, nav, animation utilities, theme/token files.

Extract the project's design DNA:
- color system + accent usage
- typography tone
- border radius + spacing rhythm
- shadow / glow / blur / glass usage
- motion style (calm, expressive, cinematic, none)
- density and visual complexity
- overall feel: minimal, editorial, premium, playful, brutalist, futuristic, enterprise, etc.

Do not ask the user to describe the style unless the project has no inspectable UI at all.

## 2. Search and inspect public sources

Start with existing project components. Then search appropriate public sources: [React Bits](https://reactbits.dev/), [Cult UI](https://www.cult-ui.com/docs), [Componentry](https://componentry.dev/), or [shadcn/ui](https://ui.shadcn.com/docs). Compare at least two suitable sources when available.

Open the exact demo and source file/registry item. Check the actual imports, license, dependencies, stack variant and revision; use current official documentation (Context7 when available) for API compatibility. Inspect animation/interaction in the available browser; label static-only inspection honestly. If a source fails, record the failure and continue elsewhere.

Record search terms, exact URLs/paths, revision/date, license, dependencies, visual inspection status and acceptance/rejection reason in the project's design artifact (or `design-research.md`). A catalog homepage or search snippet is not component evidence. Never invent filenames, components or test results.

Use the inferred style DNA as the search filter. Prefer:
- options that feel native to the current project
- components that can be integrated with minimal stylistic friction
- effects that enhance the current direction rather than replace it

## 3. Curate: show 1–3 candidates max

Do not present unranked lists. Shortlist internally, then surface only the strongest matches.

For each candidate, say briefly:
- why it fits
- what role it plays
- any tradeoff

## 4. Plan before editing

Provide a compact plan: what changes, which files, any dependency or styling adaptation needed.

## 5. Present evidence and proceed within scope

Send the exact candidate links and recommendation. If the user authorized implementation and the design direction is known, proceed with the best fit. Ask only for unresolved direction, paid access or a scope change.

---

# Consistency rules

If there is tension between the most impressive option and the best-fitting option: **choose the one that fits.**

Avoid style jumps such as:
- cartoonish inside premium
- ultra-neon inside a restrained business product
- overanimated inside a calm productivity app
- brutalist blocks inside a soft polished design

Effects must support content, not dominate it. Prefer: subtle motion, soft glow, restrained glass, tasteful hover states.

---

# Style matching table

| Project feel | Prefer |
|---|---|
| Premium / polished | Refined surfaces, controlled glow, elegant motion, layered depth |
| Minimal / editorial | Restraint, whitespace, typography-led, understated transitions |
| Playful / consumer | Soft shapes, expressive states, friendly components, bright accents |
| Futuristic / cinematic | Atmospheric glow, dark layers, glass sparingly, motion-rich but readable |
| Enterprise / utility | Clarity, strong hierarchy, low ornamentation, dependable patterns |

If the project is stylistically mixed: anchor to the direction already established by the most reusable primitives. Recommend options that unify, not fragment.

---

# Output format

## Style read
Short summary of inferred design language (3–5 lines max).

## Best fit
Top recommendation + why it fits + role it plays.

## Alternatives
Up to 2 backup options only if genuinely different and useful.

## Implementation plan
What changes, which files, any dependency or adaptation work.

## Research evidence
Exact candidate demo/source links, revision/date, license and dependencies, visual inspection status, decisions and unavailable sources. State what still needs a user decision.
