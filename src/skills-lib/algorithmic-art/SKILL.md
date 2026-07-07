---
name: algorithmic-art
description: Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration. Use this when users request creating art using code, generative art, algorithmic art, flow fields, or particle systems. Create original algorithmic art rather than copying existing artists' work to avoid copyright violations.
license: Complete terms in LICENSE.txt
---

Algorithmic philosophies are computational aesthetic movements that are then expressed through code. Output .md files (philosophy), .html files (interactive viewer), and .js files (generative algorithms).

This happens in two steps:
1. Algorithmic Philosophy Creation (.md file) — see `references/philosophy-creation.md`
2. Express by creating p5.js generative art (.html + .js files) — see `references/p5js-implementation.md` and `references/interactive-artifact.md`

## First step (do this now)

Before writing any HTML, **read `templates/viewer.html`** — it is the literal starting point for the interactive artifact, not just inspiration. Then load `references/philosophy-creation.md` and write the algorithmic philosophy (4-6 paragraphs) before touching code. The philosophy dictates the algorithm; the algorithm should never be picked from a "menu of patterns."

## THE CREATIVE PROCESS

**User request** → **Algorithmic philosophy** → **Implementation**

Each request is unique. The process involves:

1. **Interpret the user's intent** — What aesthetic is being sought?
2. **Create an algorithmic philosophy** (4-6 paragraphs) describing the computational approach — `references/philosophy-creation.md`
3. **Implement it in code** — Build the algorithm that expresses this philosophy — `references/p5js-implementation.md`
4. **Design appropriate parameters** — What should be tunable?
5. **Build matching UI controls** — Sliders/inputs for those parameters — `references/interactive-artifact.md`

**The constants**:
- Anthropic branding (colors, fonts, layout)
- Seed navigation (always present)
- Self-contained HTML artifact

**Everything else is variable**: the algorithm itself, the parameters, the UI controls, the visual outcome.

To achieve the best results, trust creativity and let the philosophy guide the implementation.

## RESOURCES

This skill includes helpful templates and documentation:

- **templates/viewer.html**: REQUIRED STARTING POINT for all HTML artifacts.
  - This is the foundation — contains the exact structure and Anthropic branding.
  - **Keep unchanged**: Layout structure, sidebar organization, Anthropic colors/fonts, seed controls, action buttons.
  - **Replace**: The p5.js algorithm, parameter definitions, and UI controls in the Parameters section.
  - The extensive comments in the file mark exactly what to keep vs replace.

- **templates/generator_template.js**: Reference for p5.js best practices and code structure principles.
  - Shows how to organize parameters, use seeded randomness, structure classes.
  - NOT a pattern menu — use these principles to build unique algorithms.
  - Embed algorithms inline in the HTML artifact (don't create separate .js files).

**Critical reminder**:
- The **template is the STARTING POINT**, not inspiration.
- The **algorithm is where to create** something unique.
- Don't copy the flow field example — build what the philosophy demands.
- But DO keep the exact UI structure and Anthropic branding from the template.

## Reference map — load each file when you reach that phase

- `references/philosophy-creation.md` — how to name and write the algorithmic philosophy (4-6 paragraphs), the craftsmanship-emphasis guidelines, five worked examples, essential principles, and how to deduce the subtle conceptual seed. **Load before writing any philosophy .md.**
- `references/p5js-implementation.md` — mandatory STEP 0 (read the template first), seeded randomness, parameter structure, how to derive the algorithm from the philosophy, canvas setup, craftsmanship requirements, output format. **Load when moving from philosophy to code.**
- `references/interactive-artifact.md` — fixed vs. variable parts of the HTML artifact, required features, the single-artifact HTML skeleton, sidebar implementation details, and seed variations/gallery mode. **Load when building the self-contained HTML artifact.**

Zero content was cut when this skill was split — every requirement, example, and detail above lives verbatim in its `references/` file.
