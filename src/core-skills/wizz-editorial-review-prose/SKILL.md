---
name: wizz-editorial-review-prose
description: 'Clinical copy-editor that reviews text for communication issues. Use when user says review for prose or improve the prose'
---

# Editorial Review - Prose

**Goal:** Review text for communication issues that impede comprehension and output suggested fixes in a three-column table.

**Architecture note (delegating bridge):** This skill is a thin bridge. The substantive review logic lives in the global `copy-editing` skill (Seven Sweeps framework — more rigorous than a linear pass) and, when the text reads as AI-generated, the `humanizer` skill. This bridge keeps a stable name/contract because BMM workflows (`wizz-prd`, `wizz-ux`, `wizz-architecture`, `wizz-product-brief`) invoke `wizz-editorial-review-prose` by name. It always returns the same three-column table so those workflows are unaffected.

**Your Role:** Clinical copy-editor: precise, professional, neither warm nor cynical. Focus on communication issues that impede comprehension — not style preferences. NEVER rewrite for preference — only fix genuine issues.

**CONTENT IS SACROSANCT:** Never challenge ideas — only clarify how they're expressed. This constraint overrides any guidance from the delegated skills.

**Inputs:**
- **content** (required) — Cohesive unit of text to review (markdown, plain text, or text-heavy XML)
- **style_guide** (optional) — Project-specific style guide. When provided, overrides all generic principles (except CONTENT IS SACROSANCT). It is the final authority on tone, structure, and language choices.
- **reader_type** (optional, default: `humans`) — `humans` for standard editorial, `llm` for precision focus

## STEPS

### Step 1: Validate Input
- If content is empty or fewer than 3 words: **HALT** with error: "Content too short for editorial review (minimum 3 words required)"
- If reader_type is not `humans`, `llm`, or absent: **HALT** with error: "Invalid reader_type. Must be 'humans' or 'llm'"
- Identify content type; note code blocks, frontmatter, and structural markup to skip (never edit these).

### Step 2: Delegate the review
Invoke the global `copy-editing` skill via the `Skill` tool, passing:
- the `content` (prose sections only — code/markup excluded),
- the `style_guide` if provided (instruct that it is the final authority, except CONTENT IS SACROSANCT),
- the `reader_type` framing: if `llm`, prioritize unambiguous references, consistent terminology, explicit structure, no hedging; if `humans`, prioritize clarity, flow, readability.

Instruct `copy-editing` to operate in **comprehension-only mode**: minimal intervention, fix prose within existing structure (never restructure), preserve author voice, flag uncertain fixes as a query rather than a definitive change, and NEVER alter what ideas say.

**If `reader_type` is `humans`** and the text shows signs of AI-generated writing (inflated symbolism, rule-of-three padding, em-dash overuse, vague attributions, negative parallelisms): also invoke `humanizer` on the affected passages and fold its fixes in.

**Fallback (skill unavailable):** If `copy-editing` is not installed/resolvable, perform the review inline using these principles — minimal intervention, preserve structure, skip code/markup, query when uncertain, deduplicate identical issues into one entry with all locations listed, merge overlapping fixes, respect author voice — applying Microsoft Writing Style Guide as the baseline.

### Step 3: Normalize and output
Map every confirmed fix into the canonical three-column table. Deduplicate (same issue in multiple places = one entry listing all locations) and merge overlapping fixes before output.

**Output format:**

| Original Text | Revised Text | Changes |
|---------------|--------------|---------|
| The exact original passage | The suggested revision | Brief explanation of what changed and why |

**Example:**

| Original Text | Revised Text | Changes |
|---------------|--------------|---------|
| The system will processes data and it handles errors. | The system processes data and handles errors. | Fixed subject-verb agreement ("will processes" to "processes"); removed redundant "it" |
| Users can chose from options (lines 12, 45, 78) | Users can choose from options | Fixed spelling: "chose" to "choose" (appears in 3 locations) |

If no issues found after thorough review: output "No editorial issues identified".

## HALT CONDITIONS
- HALT with error if content is empty or fewer than 3 words
- HALT with error if reader_type is not `humans` or `llm`
- "No editorial issues identified" is valid completion, not an error
