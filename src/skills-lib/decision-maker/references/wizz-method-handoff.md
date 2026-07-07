# Wizz Method handoff

Load this file when a `_wizz/` folder exists in the project or when an agent like `wizz-designer` invoked this skill. Explains how to dispatch the four brief sections to executor agents (wizz-copy, wizz-designer, wizz-agent-dev / wizz-quick-dev) instead of just emitting copy-paste prompts.

## Wizz Method handoff (when running inside the method)

If this skill is running inside a Wizz Method project (a `_wizz/` folder exists, or an agent like `wizz-designer` invoked you), don't stop at copy-paste prompts. The four prompts map directly onto the executor agents — offer to dispatch them instead of (or in addition to) emitting the blocks:

| Brief section | Hand off to | Via |
|---|---|---|
| Section 1 — Copywriter | `wizz-copy` | the `Skill` tool, passing the copy prompt as the brief |
| Section 2 — 3D / Illustration | `wizz-designer` | routes onward to `motion-3d-director` |
| Section 3 — Design (layout spec) | `wizz-designer` | routes onward to `ui-ux-pro-max` / `premium-landing-ui-researcher` |
| Section 4 — Developer | `wizz-agent-dev` (`wizz-quick-dev` for small builds) | builds from the dev prompt + assets |

Recommended close inside the method:
> Brief locked. Want me to dispatch it? I can send the copy to **wizz-copy**, the visual direction to **wizz-designer**, and the build to **wizz-agent-dev** — or **wizz-quick-dev** for a small build — in that order. Or run the launch guide yourself.
>
> For the engineering setup (folder structure, stack, patterns, dev checklist), run **`/inicio-de-projeto`** — this brief is the visual direction; that one is the technical foundation.

Outside the method (standalone), keep the original behavior: emit the five copy-paste sections and the launch guide.

