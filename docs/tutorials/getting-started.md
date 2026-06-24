---
title: 'Getting Started'
description: Install Wizz Method and build your first project
---

Build software faster using AI-powered workflows with specialized agents that guide you through planning, architecture, and implementation.

## What You'll Learn

- Install and initialize the Wizz Method for a new project
- Use **Wizz-Help** — your intelligent guide that knows what to do next
- Choose the right planning track for your project size
- Progress through phases from requirements to working code
- Use agents and workflows effectively

:::note[Prerequisites]

- **Node.js 20.12+** — Required for the installer
- **Git** — Recommended for version control
- **AI-powered IDE** — Claude Code, Cursor, or similar
- **A project idea** — Even a simple one works for learning
  :::

:::tip[The Easiest Path]
**Install** → `npx wizz-method install`
**Ask** → `wizz-help what should I do first?`
**Build** → Let Wizz-Help guide you workflow by workflow
:::

## Meet Wizz-Help: Your Intelligent Guide

**Wizz-Help is the fastest way to get started with the Wizz Method.** You don't need to memorize workflows or phases. Just ask, and Wizz-Help will:

- **Inspect your project** to see what's already been done
- **Show your options** based on which modules you have installed
- **Recommend what's next** — including the first required task
- **Answer questions** like "I have a SaaS idea, where do I start?"

### How to Use Wizz-Help

Run it in your AI IDE by invoking the skill:

```
wizz-help
```

Or combine it with a question for context-aware guidance:

```
wizz-help I have an idea for a SaaS product, I already know all the features I want. where do I get started?
```

Wizz-Help will respond with:

- What's recommended for your situation
- What the first required task is
- What the rest of the process looks like

### It Powers Workflows Too

Wizz-Help doesn't just answer questions. **It automatically runs at the end of every workflow** to tell you exactly what to do next. No guessing, no searching docs. Just clear guidance on the next required workflow.

:::tip[Start Here]
After installing the Wizz Method, invoke the `wizz-help` skill immediately. It will detect what modules you have installed and guide you to the right starting point for your project.
:::

## Understanding the Wizz Method

The Wizz Method helps you build software through guided workflows with specialized AI agents. The process follows four phases:

| Phase | Name           | What Happens                                                 |
| ----- | -------------- | ------------------------------------------------------------ |
| 1     | Analysis       | Brainstorming, research, product brief or PRFAQ _(optional)_ |
| 2     | Planning       | Create requirements (PRD or spec)                            |
| 3     | Solutioning    | Design architecture _(Wizz Method/Enterprise only)_          |
| 4     | Implementation | Build epic by epic, story by story                           |

**[Open the Workflow Map](../reference/workflow-map.md)** to explore phases, workflows, and context management.

Based on your project's complexity, the Wizz Method offers three planning tracks:

| Track           | Best For                                               | Documents Created                      |
| --------------- | ------------------------------------------------------ | -------------------------------------- |
| **Quick Flow**  | Bug fixes, simple features, clear scope (1-15 stories) | Tech-spec only                         |
| **Wizz Method** | Products, platforms, complex features (10-50+ stories) | PRD + Architecture + UX                |
| **Enterprise**  | Compliance, multi-tenant systems (30+ stories)         | PRD + Architecture + Security + DevOps |

:::note
Story counts are guidance, not definitions. Choose your track based on planning needs, not story math.
:::

## Installation

Open a terminal in your project directory and run:

```bash
npx wizz-method install
```

If you want the newest prerelease build instead of the default release channel, use `npx bmad-method@next install`.

When prompted to select modules, choose **Wizz Method**.

The installer creates two folders:

- `_wizz/` — agents, workflows, tasks, and configuration
- `_wizz-output/` — empty for now, but this is where your artifacts will be saved

:::tip[Your Next Step]
Open your AI IDE in the project folder and run:

```
wizz-help
```

Wizz-Help will detect what you've completed and recommend exactly what to do next. You can also ask it questions like "What are my options?" or "I have a SaaS idea, where should I start?"
:::

:::note[How to Load Agents and Run Workflows]
Each workflow has a **skill** you invoke by name in your IDE (e.g., `wizz-prd`). Your AI tool will recognize the `wizz-*` name and run it — you don't need to load agents separately. You can also invoke an agent skill directly for general conversation (e.g., `wizz-agent-pm` for the PM agent).
:::

:::caution[Fresh Chats]
Always start a fresh chat for each workflow. This prevents context limitations from causing issues.
:::

## Step 1: Create Your Plan

Work through phases 1-3. **Use fresh chats for each workflow.**

:::tip[Project Context (Optional)]
Before starting, consider creating `project-context.md` to document your technical preferences and implementation rules. This ensures all AI agents follow your conventions throughout the project.

Create it manually at `_wizz-output/project-context.md` or generate it after architecture using `wizz-generate-project-context`. [Learn more](../explanation/project-context.md).
:::

### Phase 1: Analysis (Optional)

All workflows in this phase are optional. [**Not sure which to use?**](../explanation/analysis-phase.md)

- **brainstorming** (`wizz-brainstorming`) — Guided ideation
- **research** (`wizz-market-research` / `wizz-domain-research` / `wizz-technical-research`) — Market, domain, and technical research
- **product-brief** (`wizz-product-brief`) — Recommended foundation document when your concept is clear
- **prfaq** (`wizz-prfaq`) — Working Backwards challenge to stress-test and forge your product concept

### Phase 2: Planning (Required)

**For Wizz Method and Enterprise tracks:**

1. Run `wizz-prd` in a new chat — state your intent (Create / Update / Validate) or let the skill ask
2. Output: `prd.md`, `addendum.md`, `decision-log.md`

:::note[`wizz-prd` intents]

- **Create** — coached discovery from scratch; the skill names the workspace folder and guides you to a PRD you're proud of
- **Update** — point it at an existing PRD and a change signal; it surfaces conflicts before applying changes
- **Validate** — critique a finished PRD against a checklist and produce an HTML findings report
  :::

**For Quick Flow track:**

- Run `wizz-quick-dev` — it handles planning and implementation in a single workflow, skip to implementation

:::note[UX Design (Optional)]
If your project has a user interface, invoke the **UX-Designer agent** (`wizz-agent-ux-designer`) and run the UX design workflow (`wizz-ux`) after creating your PRD.
:::

### Phase 3: Solutioning (Wizz Method/Enterprise)

**Create Architecture**

1. Invoke the **Architect agent** (`wizz-agent-architect`) in a new chat
2. Run `wizz-create-architecture` (`wizz-create-architecture`)
3. Output: Architecture document with technical decisions

**Create Epics and Stories**

:::tip[V6 Improvement]
Epics and stories are now created _after_ architecture. This produces better quality stories because architecture decisions (database, API patterns, tech stack) directly affect how work should be broken down.
:::

1. Invoke the **PM agent** (`wizz-agent-pm`) in a new chat
2. Run `wizz-create-epics-and-stories` (`wizz-create-epics-and-stories`)
3. The workflow uses both PRD and Architecture to create technically-informed stories

**Implementation Readiness Check** _(Highly Recommended)_

1. Invoke the **Architect agent** (`wizz-agent-architect`) in a new chat
2. Run `wizz-check-implementation-readiness` (`wizz-check-implementation-readiness`)
3. Validates cohesion across all planning documents

## Step 2: Build Your Project

Once planning is complete, move to implementation. **Each workflow should run in a fresh chat.**

### Initialize Sprint Planning

Invoke the **Developer agent** (`wizz-agent-dev`) and run `wizz-sprint-planning` (`wizz-sprint-planning`). This creates `sprint-status.yaml` to track all epics and stories.

### The Build Cycle

For each story, repeat this cycle with fresh chats:

| Step | Agent | Workflow            | Command             | Purpose                            |
| ---- | ----- | ------------------- | ------------------- | ---------------------------------- |
| 1    | DEV   | `wizz-create-story` | `wizz-create-story` | Create story file from epic        |
| 2    | DEV   | `wizz-dev-story`    | `wizz-dev-story`    | Implement the story                |
| 3    | DEV   | `wizz-code-review`  | `wizz-code-review`  | Quality validation _(recommended)_ |

After completing all stories in an epic, invoke the **Developer agent** (`wizz-agent-dev`) and run `wizz-retrospective` (`wizz-retrospective`).

## What You've Accomplished

You've learned the foundation of building with the Wizz Method:

- Installed the Wizz Method and configured it for your IDE
- Initialized a project with your chosen planning track
- Created planning documents (PRD, Architecture, Epics & Stories)
- Understood the build cycle for implementation

Your project now has:

```text
your-project/
├── _wizz/                                   # Wizz Method configuration
├── _wizz-output/
│   ├── planning-artifacts/
│   │   ├── PRD.md                           # Your requirements document
│   │   ├── architecture.md                  # Technical decisions
│   │   └── epics/                           # Epic and story files
│   ├── implementation-artifacts/
│   │   └── sprint-status.yaml               # Sprint tracking
│   └── project-context.md                   # Implementation rules (optional)
└── ...
```

## Quick Reference

| Workflow                              | Command                               | Agent     | Purpose                                    |
| ------------------------------------- | ------------------------------------- | --------- | ------------------------------------------ |
| **`wizz-help`** ⭐                    | `wizz-help`                           | Any       | **Your intelligent guide — ask anything!** |
| `wizz-prd`                            | `wizz-prd`                            | Any       | Create, update, or validate a PRD          |
| `wizz-create-architecture`            | `wizz-create-architecture`            | Architect | Create architecture document               |
| `wizz-generate-project-context`       | `wizz-generate-project-context`       | Analyst   | Create project context file                |
| `wizz-create-epics-and-stories`       | `wizz-create-epics-and-stories`       | PM        | Break down PRD into epics                  |
| `wizz-check-implementation-readiness` | `wizz-check-implementation-readiness` | Architect | Validate planning cohesion                 |
| `wizz-sprint-planning`                | `wizz-sprint-planning`                | DEV       | Initialize sprint tracking                 |
| `wizz-create-story`                   | `wizz-create-story`                   | DEV       | Create a story file                        |
| `wizz-dev-story`                      | `wizz-dev-story`                      | DEV       | Implement a story                          |
| `wizz-code-review`                    | `wizz-code-review`                    | DEV       | Review implemented code                    |

## Common Questions

**Do I always need architecture?**
Only for Wizz Method and Enterprise tracks. Quick Flow skips from spec to implementation.

**Can I change my plan later?**
Yes. The `wizz-correct-course` workflow handles scope changes mid-implementation.

**What if I want to brainstorm first?**
Invoke the Analyst agent (`wizz-agent-analyst`) and run `wizz-brainstorming` (`wizz-brainstorming`) before starting your PRD.

**Do I need to follow a strict order?**
Not strictly. Once you learn the flow, you can run workflows directly using the Quick Reference above.

## Getting Help

:::tip[First Stop: Wizz-Help]
**Invoke `wizz-help` anytime** — it's the fastest way to get unstuck. Ask it anything:

- "What should I do after installing?"
- "I'm stuck on workflow X"
- "What are my options for Y?"
- "Show me what's been done so far"

Wizz-Help inspects your project, detects what you've completed, and tells you exactly what to do next.
:::

- **During workflows** — Agents guide you with questions and explanations
- **Community** — [Discord](https://discord.gg/gk8jAdXWmj) (#wizz-method-help, #report-bugs-and-issues)

## Key Takeaways

:::tip[Remember These]

- **Start with `wizz-help`** — Your intelligent guide that knows your project and options
- **Always use fresh chats** — Start a new chat for each workflow
- **Track matters** — Quick Flow uses `wizz-quick-dev`; Method/Enterprise need PRD and architecture
- **Wizz-Help runs automatically** — Every workflow ends with guidance on what's next
  :::

Ready to start? Install the Wizz Method, invoke `wizz-help`, and let your intelligent guide lead the way.
