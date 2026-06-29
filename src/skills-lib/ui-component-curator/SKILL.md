---
name: ui-component-curator
description: analyze an existing frontend project, infer its visual style and product tone, then research and recommend compatible UI components and effects from 21st.dev and superdesign. use when the user wants help choosing components, effects, sections, or visual patterns that fit an existing project — especially hero effects, cards, buttons, testimonials, pricing sections, navigation, or any interactive pattern. trigger whenever the user wants to add a UI element and wants Claude to study the project first before suggesting options. always read the codebase before recommending, send links for confirmation, and plan before editing.
---

# Overview

Read the project. Infer its design language. Then find components that feel like they already belong there.

Act as a UI curator with taste and restraint — not a gallery explorer. Optimize for consistency over novelty.

**Golden rule:** Do not edit before confirming. Plan first → send links → wait for approval → then edit.

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

## 2. Search 21st.dev and superdesign

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

## 5. Send links and wait for confirmation

Do not proceed to edit until the user confirms.

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

## Links for confirmation
The candidate links. Await user approval before editing.
