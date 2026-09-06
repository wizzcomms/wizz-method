# Command workflows

Apply only the workflow matching the user's request. Use the existing project tools and evidence; these procedures do not require a separate CLI.

## Shape and build

For `shape` or `craft`: inspect the brief and current UI; determine visitor task and surface mode; draft section/component structure and states; resolve missing material decisions; research nontrivial components through the appropriate Wizz research skill. Build when authorized, then run the verification pass described in SKILL.md.

## Audit and critique

For `audit`: inspect keyboard/focus, labels, contrast, errors/loading/empty states, responsive overflow, motion preferences and relevant performance evidence. For `critique`: inspect hierarchy, comprehension, navigation, density, typography, brand fit and task completion. Report prioritized findings with exact file/route and evidence. Do not equate a preference with a defect, invent scores or apply fixes during a review-only request.

## Refine and adjust

For `polish`, address the observed issues with the highest user impact. Other commands narrow the scope:

| Commands | Inspect and change |
|---|---|
| typeset, layout | Type hierarchy, readable line lengths, wrapping, spacing, alignment, responsive behavior |
| colorize, bolder, quieter | Color roles, contrast and intended emphasis within the approved direction |
| distill, clarify | Unnecessary UI/copy complexity, labels and next-action clarity; preserve factual claims |
| adapt, harden, onboard | Device states, errors/loading/empty states, localization, first-use guidance |
| animate, delight, overdrive | Purposeful interaction feedback, timing, reduced-motion, rendering cost |
| optimize | Measured or directly evidenced performance problems; verify the affected path |
| extract | Repeated tokens/patterns that merit shared primitives without changing behavior |

Inspect the target first, make the authorized edits, then verify those states. Large motion effects still require inspected sources and a fit decision.

## Init and document

For `init`, gather known product, audience, purpose and constraints from project/user evidence; ask only for missing material facts. For `document`, extract the actual design system from code and current screenshots. Merge into existing PRODUCT.md/DESIGN.md without discarding unrelated decisions; mark assumptions.

## Live

Inspect the affected interface using the available browser and current dev server. Implement scoped visual variants if requested, compare the relevant viewport/states, and keep the chosen variant. If a running app or browser is unavailable, provide a code/static assessment and state what remains unverified. Do not simulate an interactive overlay or claim a visual check occurred.
