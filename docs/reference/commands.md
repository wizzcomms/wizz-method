---
title: Skills
description: Reference for Wizz Method skills — what they are, how they work, and where to find them.
sidebar:
  order: 4
---

Skills are pre-built prompts that load agents, run workflows, or execute tasks inside your IDE. The Wizz Method installer generates them from your installed modules at install time. If you later add, remove, or change modules, re-run the installer to keep skills in sync (see [Troubleshooting](#troubleshooting)).

## Skills vs. Agent Menu Triggers

The Wizz Method offers two ways to start work, and they serve different purposes.

| Mechanism | How you invoke it | What happens |
| --- | --- | --- |
| **Skill** | Type the skill name (e.g. `wizz-help`) in your IDE | Directly loads an agent, runs a workflow, or executes a task |
| **Agent menu trigger** | Load an agent first, then type a short code (e.g. `DS`) | The agent interprets the code and starts the matching workflow while staying in character |

Agent menu triggers require an active agent session. Use skills when you know which workflow you want. Use triggers when you are already working with an agent and want to switch tasks without leaving the conversation.

## How Skills Are Generated

When you run `npx wizz-method install`, the installer reads the manifests for every selected module and writes one skill per agent, workflow, task, and tool. Each skill is a directory containing a `SKILL.md` file that instructs the AI to load the corresponding source file and follow its instructions.

The installer uses templates for each skill type:

| Skill type | What the generated file does |
| --- | --- |
| **Agent launcher** | Loads the agent persona file, activates its menu, and stays in character |
| **Workflow skill** | Loads the workflow config and follows its steps |
| **Task skill** | Loads a standalone task file and follows its instructions |
| **Tool skill** | Loads a standalone tool file and follows its instructions |

:::note[Re-running the installer]
If you add or remove modules, run the installer again. It regenerates all skill files to match your current module selection.
:::

## Where Skill Files Live

The installer writes skill files into an IDE-specific directory inside your project. The exact path depends on which IDE you selected during installation.

| IDE / CLI | Skills directory |
| --- | --- |
| Claude Code | `.claude/skills/` |
| Cursor | `.agents/skills/` |
| Windsurf | `.agents/skills/` |
| Other IDEs | See the installer output for the target path |

Each skill is a directory containing a `SKILL.md` file. For example, a Claude Code installation looks like:

```text
.claude/skills/
├── wizz-help/
│   └── SKILL.md
├── wizz-prd/
│   └── SKILL.md
├── wizz-agent-dev/
│   └── SKILL.md
└── ...
```

The directory name determines the skill name in your IDE. For example, the directory `wizz-agent-dev/` registers the skill `wizz-agent-dev`.

## How to Discover Your Skills

Type the skill name in your IDE to invoke it. Some platforms require you to enable skills in settings before they appear.

Run `wizz-help` for context-aware guidance on your next step.

:::tip[Quick discovery]
The generated skill directories in your project are the canonical list. Open them in your file explorer to see every skill with its description.
:::

## Skill Categories

### Agent Skills

Agent skills load a specialized AI persona with a defined role, communication style, and menu of workflows. Once loaded, the agent stays in character and responds to menu triggers.

| Example skill | Agent | Role |
| --- | --- | --- |
| `wizz-agent-dev` | Amelia (Developer) | Implements stories with strict adherence to specs |
| `wizz-agent-pm` | John (Product Manager) | Creates and validates PRDs |
| `wizz-agent-architect` | Winston (Architect) | Designs system architecture |

See [Agents](./agents.md) for the full list of default agents and their triggers.

### Workflow Skills

Workflow skills run a structured, multi-step process without loading an agent persona first. They load a workflow configuration and follow its steps.

| Example skill | Purpose |
| --- | --- |
| `wizz-product-brief` | Create or update a product brief — guided discovery when your concept is clear |
| `wizz-prfaq` | [Working Backwards PRFAQ](../explanation/analysis-phase.md#prfaq-working-backwards) challenge to stress-test your product concept |
| `wizz-prd` | Create, update, or validate a Product Requirements Document |
| `wizz-ux` | Design user experience |
| `wizz-create-architecture` | Design system architecture |
| `wizz-create-epics-and-stories` | Create epics and stories |
| `wizz-dev-story` | Implement a story |
| `wizz-code-review` | Run a code review |
| `wizz-quick-dev` | Unified quick flow — clarify intent, plan, implement, review, present |

See [Workflow Map](./workflow-map.md) for the complete workflow reference organized by phase.

### Task and Tool Skills

Tasks and tools are standalone operations that do not require an agent or workflow context.

**Wizz-Help: Your Intelligent Guide**

`wizz-help` is your primary interface for discovering what to do next. It inspects your project, understands natural language queries, and recommends the next required or optional step based on your installed modules.

:::note[Example]
```
wizz-help
wizz-help I have a SaaS idea and know all the features. Where do I start?
wizz-help What are my options for UX design?
```
:::

**Other Core Tasks and Tools**

The core module includes 12 built-in tools — specs, reviews, brainstorming, customization, document management, and more. See [Core Tools](./core-tools.md) for the complete reference.

## Naming Convention

All skills use the `wizz-` prefix followed by a descriptive name (e.g., `wizz-agent-dev`, `wizz-prd`, `wizz-help`). See [Modules](./modules.md) for available modules.

## Troubleshooting

**Skills not appearing after install.** Some platforms require skills to be explicitly enabled in settings. Check your IDE's documentation or ask your AI assistant how to enable skills. You may also need to restart your IDE or reload the window.

**Expected skills are missing.** The installer only generates skills for modules you selected. Run `npx wizz-method install` again and verify your module selection. Check that the skill files exist in the expected directory.

**Skills from a removed module still appear.** The installer does not delete old skill files automatically. Remove the stale directories from your IDE's skills directory, or delete the entire skills directory and re-run the installer for a clean set.
