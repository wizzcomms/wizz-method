---
title: Welcome to the Wizz Method
description: AI-driven agency development method with specialized agents, guided workflows, and adaptive planning
---

The **Wizz Method** is an AI-driven agency development and production method. It follows the work from start to finish: from idea and planning all the way through agent-assisted implementation. It provides specialized agents, guided workflows, and planning that adapts to your project's complexity, whether you're shipping a small fix or an entire platform.

If you're comfortable working with AI assistants like Claude, Cursor, or GitHub Copilot, you're ready to get started.

:::note[Independent fork of the Wizz Method]
The Wizz Method is an independent fork of the [Wizz Method](https://github.com/bmad-code-org/WIZZ-METHOD), maintained by Wizz! comms. The engine is still BMAD (credited in the repository's `TRADEMARK.md`); the Wizz layer adds agency routing through `wizz-maestro`, a standardized closeout (✅ what I did, ➡️ next step, 🎯 command), and Portuguese-friendly defaults for the agency's skills.
:::

## Getting Started

The fastest way to understand the method is to try it.

- **[Get started](./tutorials/getting-started.md)**: install and understand how the Wizz Method works.
- **[Workflow map](./reference/workflow-map.md)**: an overview of the phases, workflows, and context management.

:::tip[Just want to dive in?]
Install the Wizz Method and invoke `wizz-maestro`. It reads your request and dispatches the right agent based on your project and installed modules.
:::

## How to Use These Docs

These docs are organized into four sections based on what you're trying to do:

| Section           | Purpose                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| **Tutorials**     | Learning-oriented. Step-by-step guides that walk you through building something. Start here if you're new. |
| **How-To Guides** | Task-oriented. Practical guides for solving specific problems. "How do I customize an agent?" lives here.  |
| **Explanation**   | Understanding-oriented. Deep dives into concepts and architecture. Read when you want to know *why*.       |
| **Reference**     | Information-oriented. Technical specifications for agents, workflows, and configuration.                   |

## Expand and Customize

Want to extend the Wizz Method with your own agents, workflows, or modules? The agency customization lives in the `wizz` module (agents, overrides, and `wizz-init`). Personal tweaks go in `_wizz/custom/`, which takes precedence over the team defaults.

## What You'll Need

The Wizz Method works with any AI assistant that supports system prompts or project context. Popular options include:

- **[Claude Code](https://code.claude.com)**: Anthropic's CLI (recommended).
- **[Cursor](https://cursor.sh)**: AI-first code editor.
- **[Codex CLI](https://github.com/openai/codex)**: OpenAI's terminal coding agent.

You should be comfortable with basic development concepts (version control, project structure, agile workflows). No prior experience with agent systems is required. That's what these docs are for.

## Community

Ask questions, show what you're building, or contribute:

- **[GitHub](https://github.com/wizzcomms/wizz-method)**: source code, issues, and contributions.
- **[Wizz! comms.](https://wizzcomms.com)**: the agency behind the method.

## Next Step

Ready to dive in? **[Get started](./tutorials/getting-started.md)** and build your first project.
