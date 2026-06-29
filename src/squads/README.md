# Wizz Squads — consultative persona panels

Squads are advisory panels of expert personas. A squad **advises**; the area's
wizz agent **executes**. They run through `wizz-party-mode`.

## How they run (runtime)

The live squad definitions are **distilled** into the party-mode config at
`src/core-skills/wizz-party-mode/customize.toml` as:

- `[[workflow.party_members]]` — one compact persona per member (code is
  squad-prefixed, e.g. `br-al-ries`, to stay globally unique in the pool).
- `[[workflow.party_groups]]` — one per squad. The group `id` matches the
  directory names here and the squad ids in `skills-registry.yaml`.

Run a squad: party-mode with `--party <id>` (e.g. `--party brand-squad`). The
maestro picks the squad from `skills-registry.yaml` (`squads:` → `domain` /
`advises` / `when`) and runs it before the area agent executes.

`cybersecurity` ships as an **open-cast** group (defensive security only): no
inline members, a scene that casts the right defensive voices on the fly.

## What lives here (source)

Each `<squad-id>/` holds the **archived source** the distillation came from:

- `agents/*.md` — the full persona definitions (rich BMAD-style agent files).
- `squad.yaml`, `README.md` — squad metadata.

This is the source of truth for re-distilling or deepening a persona. It is not
loaded at runtime; the party-mode `customize.toml` blocks are. BMAD scaffolding
(tasks, workflows, checklists, config, data) was intentionally not migrated —
party-mode does not consume it.

## Squads

`brand-squad` · `copy-squad` · `c-level-squad` · `advisory-board` ·
`data-squad` · `design-squad` · `traffic-masters` · `hormozi-squad` ·
`storytelling` · `movement` · `cybersecurity` · `claude-code-mastery`
