---
name: wizz-set-feature
description: 'Resolve, switch or clear the active feature context so planning artifacts, implementation artifacts and memory are organized under one named slug. Runs automatically from the git branch; only invoke it when the user says "set feature", "switch feature", "new feature", "clear feature", or asks "what feature is active".'
---

# Set Feature

**Goal:** Keep `active_feature` correct so planning artifacts, implementation artifacts and memory entries all land under the same named slug.

**Default mode is automatic.** The `session-rules.js` SessionStart hook already resolves the feature from the git branch and injects it as `FEATURE ATIVA: <slug>`. In the normal case nobody invokes this skill and nobody is asked anything. Invoke it only for the three explicit cases in "When this skill runs" below.

## Conventions

- `{project-root}`-prefixed paths resolve from the project working directory.

## Resolution order (never ask before exhausting it)

1. **Git branch.** `feat/dashboard-financeiro` → `dashboard-financeiro`. Strip the type prefix (`feat/`, `feature/`, `fix/`, `bugfix/`, `hotfix/`, `chore/`, `refactor/`, `docs/`, `test/`, `perf/`, `ci/`, `build/`, `style/`), lowercase, kebab-case. Trunk branches (`main`, `master`, `develop`, `dev`, `staging`, `prod`, `production`, `release`) and release branches yield **no** feature, not a bad one.
2. **`active_feature` in `{project-root}/_wizz/bmm/config.yaml`.** Used when the branch gives nothing.
3. **The request itself.** Only when 1 and 2 are both empty AND the user is clearly starting named work ("vamos fazer o painel de assinaturas"). Derive the slug, write it, and say so in **one line**. Do not ask.
4. **Nothing.** Artifacts go to the roots and memory carries no feature tag. This is a valid state, not a problem to fix.

The branch wins over the config: it describes the work happening now, while the config may be stale from a feature nobody switched off.

## When this skill runs

- **The user asks what is active** → answer from the resolution order and stop. Do not write anything.
- **The user asks to set, switch or clear** → they already named it (or asked to clear); normalize, write, confirm in one line. Do not ask for a slug they just gave you.
- **Genuine ambiguity** → two or more features are open and the request does not decide between them. This is the only case where you ask, and you ask once, offering the open features as options.

## Steps

### Step 1: Load config

Load `{project-root}/_wizz/bmm/config.yaml` and resolve `project_name`, `communication_language`, `planning_artifacts`, `implementation_artifacts`, and the current `active_feature`. Always speak in `{communication_language}`.

### Step 2: Resolve the slug

Apply the resolution order above. Normalize to kebab-case: lowercase, strip accents, non-alphanumerics become hyphens, no leading or trailing hyphen, 60 characters max.

Confirm with the user **only** in the ambiguity case. A slug that came from the branch, from an explicit user instruction, or from a clear request is written without a confirmation round.

### Step 3: Write the config

Set `active_feature:` to the slug (add the key if absent). To clear it, set it to `""`.

### Step 4: Create the subfolders

Create if missing:

- `{planning_artifacts}/{active_feature}/`
- `{implementation_artifacts}/{active_feature}/`

Skip this step when clearing.

### Step 5: Report in one line

"Feature: **{active_feature}**. Artefatos em `{planning_artifacts}/{active_feature}/` e `{implementation_artifacts}/{active_feature}/`, memória desta sessão marcada com o mesmo tema."

When clearing: "Feature limpa. Artefatos voltam para as raízes e a memória sai sem tema de feature."

## The feature is also the memory tag

The slug is the single organizing axis, not a folder rule that stops at artifacts. While a feature is active:

- A decision saved to the Cérebro carries `tema: {active_feature}` in its frontmatter.
- The project state block records which feature the work sits under.
- An auto-memory entry about this work mentions the feature in its description, so a later `grep` by slug finds artifact, decision and trap together.

This reuses the `tema` axis that already exists for decisions. Do not create a second, parallel `feature:` field alongside it.

## Success Criteria

- ✅ The slug was resolved without asking the user, except in genuine ambiguity.
- ✅ `active_feature` updated in `_wizz/bmm/config.yaml`.
- ✅ Subfolders exist under planning-artifacts and implementation-artifacts.
- ✅ Memory written during the session carries the same slug as `tema`.
- ✅ The user got one line, not a dialogue.
