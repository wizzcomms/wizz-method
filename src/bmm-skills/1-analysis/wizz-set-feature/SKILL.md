---
name: wizz-set-feature
description: 'Set or switch the active feature context so planning and implementation artifacts are organized into a named subfolder. Use when the user says "set feature", "switch feature", "new feature", or asks "what feature is active".'
---

# Set Feature

**Goal:** Set or switch the `active_feature` context so all subsequent planning and implementation artifacts are saved into a named subfolder.

## Conventions

- `{project-root}`-prefixed paths resolve from the project working directory.

## On Activation

### Step 1: Load Config

Load config from `{project-root}/_wizz/bmm/config.yaml` and resolve:

- `project_name`, `user_name`, `communication_language`
- `planning_artifacts`, `implementation_artifacts`
- `active_feature` (current value, may be empty or absent)

Always speak in `{communication_language}`.

### Step 2: Show Current State

- If `active_feature` is set: "Active feature: **{active_feature}**".
- If empty or absent: "No active feature set. Artifacts are saving to the roots."

If the user only asked which feature is active, stop here.

### Step 3: Ask for the Feature Slug

Ask: "What is the feature name? Use a short kebab-case slug (e.g. `admin-panel`, `auth-refactor`, `dashboard-financeiro`). It becomes the subfolder name inside `planning-artifacts/` and `implementation-artifacts/`."

Wait for the user's answer.

### Step 4: Validate and Confirm

- Reject empty input.
- Normalize: lowercase and replace spaces with hyphens.
- Show the normalized slug and confirm it with the user before proceeding.

### Step 5: Update Config

Edit `{project-root}/_wizz/bmm/config.yaml`:

- If an `active_feature:` key exists, set its value to the confirmed slug.
- If it does not exist, add the line `active_feature: "{slug}"`.
- Save the file.

### Step 6: Create Subfolders

Create these directories if they do not already exist:

- `{planning_artifacts}/{active_feature}/`
- `{implementation_artifacts}/{active_feature}/`

### Step 7: Confirm

Tell the user:

"Feature set to **{active_feature}**. New planning and implementation artifacts will be saved under:
- `{planning_artifacts}/{active_feature}/`
- `{implementation_artifacts}/{active_feature}/`

Run this skill again anytime to switch features, or clear the slug to go back to the roots."

## Success Criteria

- ✅ `active_feature` updated in `_wizz/bmm/config.yaml`.
- ✅ Subfolders created in planning-artifacts and implementation-artifacts.
- ✅ User clearly informed of the new artifact paths.
