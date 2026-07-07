# `src/` — structural convention

Source for everything the installer copies into a project's `_wizz/` (core/bmm engine) or `.claude/skills/` (global skills-lib). See `docs/governance.md` ("Relationship to BMad Upstream") for the engine-vs-Wizz-layer split this convention follows.

## Directories

- **`bmm-skills/`** — the BMM (Agile suite) engine, forked from BMAD-METHOD. Subdirectories are **numbered by phase**, not named: `1-analysis/`, `2-plan-workflows/`, `3-solutioning/`, `4-implementation/`. Each phase dir holds one skill per workflow (`wizz-create-prd/`, `wizz-dev-story/`, etc.). English content — engine internals are not renamed/translated (governance rule).
- **`core-skills/`** — cross-phase engine skills used across the BMM lifecycle (`wizz-brainstorming`, `wizz-spec`, `wizz-customize`, `wizz-review-*`, `wizz-party-mode`, `wizz-help`, etc.) plus `_shared/` for content multiple skills `include`. Named (not numbered) — these aren't phase-bound. English content, same rule as `bmm-skills/`.
- **`skills-lib/`** — the global marketplace: standalone, portable skills not specific to the BMM engine (e.g. `graphify`, `humanizer`, `adversarial-reviewer`, `ui-ux-pro-max`). One skill per directory, directory name == skill `name` in frontmatter (Claude Code resolves skills by dir name). English content — written to be useful outside a Wizz Method project too.
- **`modules/wizz/`** — the actual Wizz Method product layer: `module.yaml` (module manifest + area/agent descriptions) and `agents/<agent>/` (one dir per wizz-\* persona agent — `wizz-qa`, `wizz-designer`, `wizz-copy`, etc. — each with `SKILL.md` + `customize.toml`). **This is where the language convention flips to PT-BR**: `SKILL.md` frontmatter (`description`) stays English for cross-tool portability, but `customize.toml` — the actual agent behavior, persona, and menu text the end user sees — is written in PT-BR, the agency's working language. `overrides/` and `_shared/` hold cross-agent shared instruction fragments (also PT-BR).
- **`squads/`** — advisory persona panels (see `squads/README.md`). Archived source (`agents/*.md`, `squad.yaml`, `README.md`) that gets **distilled** into `core-skills/wizz-party-mode/customize.toml` at build/maintenance time; the archive itself is not read at runtime.
- **`scripts/`** — Python helpers shared by the engine at runtime (not installer tooling, which lives in `tools/`): `resolve_customization.py` / `resolve_config.py` (base→team→user TOML merge, invoked by skills via `{project-root}/_wizz/scripts/resolve_customization.py`), `memlog.py` (session/decision logging; no lifecycle/compaction yet, see the "Known limitation" note in its own module docstring).

## Quick rule of thumb

- Numbered subdirectory → you're in `bmm-skills/`, phase-bound.
- Named subdirectory at the top level → a library (`skills-lib`, `core-skills`, `squads`) or the Wizz product layer (`modules/wizz`).
- English content → engine or global-skill layer (BMAD-derived or portable-by-design).
- PT-BR content → the Wizz-authored layer (`modules/wizz/**/customize.toml`, squad archives, this repo's own docs under `_audit/` and memory files).

For how the installer copies these into a project and how the registry (`skills-registry.yaml`) maps each skill/CLI/MCP to an area, see `docs/governance.md` and `docs/reference/`.
