## What
<!-- 1-2 sentences: WHAT changed -->


## Why
<!-- 1-2 sentences: WHY this change is needed -->
Fixes #<!-- (issue number, if applicable) -->

## How
<!-- 2-3 bullets: HOW you implemented it -->
-

## Testing
<!-- 1-2 sentences: HOW you tested this -->


---

## Checklist

**Before submitting, please verify:**

- [ ] `npm test` passes (including `test:hooks`, `test:mcp`, `test:cli`, `validate:method-refs`)
- [ ] `npm run validate:method-refs` passes (for Wizz-specific refs: agents, modules, skills)
- [ ] `CHANGELOG.md` is updated with this change (or marked as docs-only if no user impact)
- [ ] No hardcoded secrets, env vars, or credentials (use placeholders `${VAR}` in MCPs)
- [ ] If adding a new skill: it has `metadata.version`, `area`, and `when` fields in the registry entry
- [ ] If adding a new skill: it brings 3-5 eval cases (`evals/evals.json`, or `evals/routing/dataset.json` for routing changes)
- [ ] If adding a new agent or module: it follows the patterns in existing components
- [ ] New evaluation cases added for skills/routing changes (if applicable)
- [ ] Prose is concise and avoids em-dashes (use periods, commas, colons, or parentheses)
- [ ] No changes to internal BMad naming (files, classes, module names remain as-is for sync/credit)

**For community modules:** Use the naming convention "My Module (Wizz Community Module)" and check [TRADEMARK.md](../TRADEMARK.md).

---

Keep the PR under 800 lines (excluding generated files). One feature/fix per PR. 

Questions? See [CONTRIBUTING.md](../CONTRIBUTING.md) or open a [discussion](https://github.com/wizzcomms/wizz-method/discussions).
