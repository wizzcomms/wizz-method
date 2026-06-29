---
name: find-skills
description: Helps users discover and install agent skills OR MCP servers when they ask questions like "how do I do X", "find a skill for X", "adicione essa skill", "adicione esse MCP", "is there a skill/mcp that can...", or express interest in extending capabilities. Use when the user is looking for functionality that might exist as an installable skill or MCP server.
---

# Find Skills (e MCPs)

This skill helps you discover and install **skills** from the open agent skills ecosystem AND configure **MCP servers** that extend the agent with real tool access. When a request needs a capability you don't have, the missing piece is almost always one of these two — a skill (knowledge/workflow) or an MCP (live tool/API access).

> Skill = conhecimento/fluxo (texto que o agente segue). MCP = acesso real a ferramenta/API (rodar SQL, dirigir browser, gerir ads). Se o pedido precisa AGIR num sistema externo, é MCP; se precisa SABER COMO, é skill.

## When to Use This Skill

Use this skill when the user:

- Asks "how do I do X" where X might be a common task with an existing skill
- Says "find a skill for X" or "is there a skill for X"
- Asks "can you do X" where X is a specialized capability
- Expresses interest in extending agent capabilities
- Wants to search for tools, templates, or workflows
- Mentions they wish they had help with a specific domain (design, testing, deployment, etc.)

## What is the Skills CLI?

The Skills CLI (`npx skills`) is the package manager for the open agent skills ecosystem. Skills are modular packages that extend agent capabilities with specialized knowledge, workflows, and tools.

**Key commands:**

- `npx skills find [query]` - Search for skills interactively or by keyword
- `npx skills add <package>` - Install a skill from GitHub or other sources
- `npx skills check` - Check for skill updates
- `npx skills update` - Update all installed skills

**Browse skills at:** https://skills.sh/

## How to Help Users Find Skills

### Step 1: Understand What They Need

When a user asks for help with something, identify:

1. The domain (e.g., React, testing, design, deployment)
2. The specific task (e.g., writing tests, creating animations, reviewing PRs)
3. Whether this is a common enough task that a skill likely exists

### Step 2: Search for Skills

Run the find command with a relevant query:

```bash
npx skills find [query]
```

For example:

- User asks "how do I make my React app faster?" → `npx skills find react performance`
- User asks "can you help me with PR reviews?" → `npx skills find pr review`
- User asks "I need to create a changelog" → `npx skills find changelog`

The command will return results like:

```
Install with npx skills add <owner/repo@skill>

vercel-labs/agent-skills@vercel-react-best-practices
└ https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices
```

### Step 3: Present Options to the User

When you find relevant skills, present them to the user with:

1. The skill name and what it does
2. The install command they can run
3. A link to learn more at skills.sh

Example response:

```
I found a skill that might help! The "vercel-react-best-practices" skill provides
React and Next.js performance optimization guidelines from Vercel Engineering.

To install it:
npx skills add vercel-labs/agent-skills@vercel-react-best-practices

Learn more: https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices
```

### Step 4: Offer to Install

If the user wants to proceed, you can install the skill for them:

```bash
npx skills add <owner/repo@skill> -g -y
```

The `-g` flag installs globally (user-level) and `-y` skips confirmation prompts.

## Common Skill Categories

When searching, consider these common categories:

| Category        | Example Queries                          |
| --------------- | ---------------------------------------- |
| Web Development | react, nextjs, typescript, css, tailwind |
| Testing         | testing, jest, playwright, e2e           |
| DevOps          | deploy, docker, kubernetes, ci-cd        |
| Documentation   | docs, readme, changelog, api-docs        |
| Code Quality    | review, lint, refactor, best-practices   |
| Design          | ui, ux, design-system, accessibility     |
| Productivity    | workflow, automation, git                |

## Tips for Effective Searches

1. **Use specific keywords**: "react testing" is better than just "testing"
2. **Try alternative terms**: If "deploy" doesn't work, try "deployment" or "ci-cd"
3. **Check popular sources**: Many skills come from `vercel-labs/agent-skills` or `ComposioHQ/awesome-claude-skills`

## When No Skills Are Found

If no relevant skills exist:

1. Acknowledge that no existing skill was found
2. Offer to help with the task directly using your general capabilities
3. Suggest the user could create their own skill with `npx skills init`

Example:

```
I searched for skills related to "xyz" but didn't find any matches.
I can still help you with this task directly! Would you like me to proceed?

If this is something you do often, you could create your own skill:
npx skills init my-xyz-skill
```

## Adicionar um MCP Server

Quando o pedido precisa de **acesso real a uma ferramenta/API** (rodar SQL, dirigir um browser, gerir anúncios, buscar docs de lib atualizadas), o que falta é um **MCP**, não uma skill.

### Passo 1: Checar o que já existe

```bash
claude mcp list
```

### Passo 2: Ver o registry do Wizz Method (fonte única)

Se o projeto tem Wizz Method instalado, o `skills-registry.yaml` já mapeia os MCPs recomendados por área (campos `mcps:` e `mcp_utility:`). Resolva o caminho na ordem:

1. `{project-root}/_wizz/_config/skills-registry.yaml`
2. `{project-root}/skills-registry.yaml`

Cada entrada traz `id`, `when` e o bloco `server` (command/args/env) pronto. Prefira esse mapa antes de inventar config.

### Passo 3: Adicionar o MCP

```bash
# Sintaxe geral (Claude Code):
claude mcp add <id> [-e VAR=valor ...] -- <command> [args...]

# Exemplos comuns:
claude mcp add context7 -- npx -y @upstash/context7-mcp
claude mcp add playwright -- npx -y @playwright/mcp@latest
claude mcp add magic -e API_KEY=$MAGIC_API_KEY -- npx -y @21st-dev/magic
claude mcp add supabase -e SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN -- npx -y @supabase/mcp-server-supabase@latest
```

Ou edite o `.mcp.json` do projeto (merge aditivo, nunca apague servers existentes):

```json
{ "mcpServers": { "context7": { "command": "npx", "args": ["-y", "@upstash/context7-mcp"] } } }
```

### Passo 4: Secrets

NUNCA escreva token real em arquivo commitado. Use variável de ambiente (`-e VAR=$VAR`) ou placeholder `${VAR}` no `.mcp.json` e peça pro usuário exportar a variável. Avise quais variáveis o MCP exige.

### Quando não há MCP pronto

Diga que não existe MCP conhecido pra isso e ofereça resolver com as ferramentas atuais (ex: `agent-browser` no lugar do MCP playwright, ou chamadas diretas de API).
