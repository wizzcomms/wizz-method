---
title: Governance
description: How Wizz Method is maintained, versioned, and how decisions are made
---

## Maintainers

Wizz Method is maintained by **Wizz! comms** (<support@wizzcomms.com>). The project is a fork of [BMad Method](https://github.com/bmad-code-org/BMAD-METHOD), with the core engine and architecture credited to BMad Code, LLC.

## Decision Making

All decisions about Wizz Method follow this process:

1. **Issues**: Open a [GitHub Issue](https://github.com/wizzcomms/wizz-method/issues) to propose changes, report bugs, or request features.
2. **Discussion**: Maintainers respond within 48 hours. Community input is welcome in discussions.
3. **Review**: PRs are reviewed for code quality, alignment with Wizz philosophy (human-AI collaboration), and impact on existing workflows.
4. **Merge**: Approved PRs are merged to `main` and auto-published to npm under the `next` tag. Stable releases are cut weekly to `latest`.

## Relationship to BMad Upstream

**Wizz Method is a standalone fork.** The architecture, workflows, and skill engine remain BMad's work, preserved and credited in [TRADEMARK.md](https://github.com/wizzcomms/wizz-method/blob/main/TRADEMARK.md). The Wizz layer adds:
- Brand identity and Portuguese-language interface
- 7 specialized agents (designer, copy, SEO, growth, ads, memory)
- Standardized response format (✅ what I did / ➡️ next step / 🎯 command)
- Routing optimization and token economy

**Internal naming**: We do not rename BMAD-internal components (files, classes, module names). This keeps sync simple and preserves credit.

**External modules**: The optional modules in `wizz-modules.yaml` (Test Architect, Builder, Creative Intelligence Suite, Game Dev Studio, WDS, Automator) live in third-party repositories under `bmad-code-org`. They are labeled `type: upstream-org` to make the delegated trust explicit: Wizz does not control those repos, and the installer downloads them as-is (opt-in, never selected by default). Decision recorded 2026-07-07: honest labeling instead of maintaining forks. We will fork under `wizzcomms` only if an upstream repo changes owner or behaves unexpectedly.

## Versioning

Wizz Method uses [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes (agent interface, skill registry format, incompatible defaults).
- **MINOR**: New features, new skills/agents, backward compatible.
- **PATCH**: Bug fixes, performance improvements, documentation.

All versions are documented in [CHANGELOG.md](https://github.com/wizzcomms/wizz-method/blob/main/CHANGELOG.md) using [Keep a Changelog](https://keepachangelog.com/) format.

## Adding Components

New skills, agents, MCPs, or CLIs must follow the checklist in [.github/PULL_REQUEST_TEMPLATE.md](https://github.com/wizzcomms/wizz-method/blob/main/.github/PULL_REQUEST_TEMPLATE.md). Every component is declared in `skills-registry.yaml` (source of truth) and removed via `removals.txt`.

`metadata.version` is an optional field on any registry entry (skill, MCP, or CLI), validated as a plain `x.y.z` semver by `tools/validate-registry-schema.js` when present: it is not being backfilled onto existing entries (coarse, ships-together granularity is fine until there are 2+ consumers of the registry, per the "Gatilhos de reavaliação" section below), but every new component added from now on should include it as prep for eventual decoupled distribution.

### Adding a new CLI

A new CLI entry goes under an area's `clis:` list (or `cli_utility:` for cross-cutting tools) in `skills-registry.yaml`, following the shape already used by entries like `rtk` (`cli_utility:`) and `arcads`/`agent-browser`/`hyperframes` (area-scoped):

- `id`, `when`, `check` (command that proves the CLI is present/prints a version), and `install` (the install command, pinned to a fixed version/SHA, never `@latest` or a moving branch/tag) are required.
- `platform:` is optional and gates the entry to `darwin`/`linux`/`win32`/`arm64`/`x64` tokens (or `<os>-<arch>` combos) when `check`/`install` are POSIX-only; omit it when the commands are cross-platform (e.g. pure `npx`).
- `min_version:` is optional, a plain `x.y.z` string compared by the installer's `detectClis` against whatever `check` prints.
- `verify:` is optional, a shell command that confirms a runtime dependency beyond mere presence (failure is a warning, never an install abort).
- For CLIs that need install-time setup beyond a single `check`/`install` pair (fetching browsers, resolving an absolute bin path, etc.), use the MCP-style `setup:` block (`bin`, `install`, `post_install`, `verify`) as documented next to the `scrapling` entry instead of the plain CLI shape.

Run `npm run test:registry-schema` after adding an entry; it validates the new entry's shape and regression-tests the whole real `skills-registry.yaml`.

## Gatilhos de reavaliação

Decisões de "não fazer agora" tomadas na auditoria 360° de 2026-07-07, registradas aqui para não perder o contexto e evitar redebater o mesmo ponto sem um gatilho novo. Racional completo em `_audit/2026-07-07-parte2-auditoria-mcps-clis-memoria-rtk.md` (seção K) e `_audit/2026-07-07-parte4-*.md` (seções 7.16/7.17).

**n8n como MCP do framework.** Decisão atual: não integrar, nem como MCP obrigatório nem opcional por padrão. Racional: as automações reais do framework são determinísticas e git-driven, e um MCP de n8n traria dezenas de tools por conexão (custo de contexto alto), superfície de secrets nova e a primeira dependência operacional com uptime próprio do framework. Quem usa n8n num projeto hoje já consegue via `find-skills` e um `.mcp.json` local, pinado e com escopo mínimo. Gatilho: 2 ou mais projetos Wizz reais rodando n8n em produção, aí sim vale criar uma entrada opt-in (`defaultSelected: false`) na área growth com um `when` restritivo.

**Windows nativo.** Decisão atual: 4 CLIs seguem quebrados fora de macOS/Linux/WSL; a correção da Fase 2 foi só o gate `platform:` (esconder a CLI, não reescrever os checks em Node). Racional: reescrever `check`/`install` em Node puro para suportar Windows nativo é esforço real sem demanda confirmada até agora. Gatilho: demanda Windows real, via issues de usuário pedindo suporte.

**Secret providers (Vault, Doppler, 1Password).** Decisão atual: o seam já existe no design de env vars (`ProcessEnvProvider` → `DotenvFileProvider` → futuro provider), mas nenhum provider externo é implementado. Racional: seria overengineering para as ~4 variáveis geridas hoje pelo framework. Gatilho: crescimento real do número de env vars geridas, ou pedido explícito de um usuário enterprise.

**Telemetria contínua com métricas agregadas.** Decisão atual: rejeitada (opção "c" da matriz 5.6 do relatório); diferente do trace opt-in local (`WIZZ_TRACE`), que já existe e nunca sai da máquina do usuário. Racional: agregação contradiz a filosofia local/stateless do framework e exigiria infraestrutura de coleta que hoje não existe. Gatilho: o framework ganhar usuários externos em escala que justifique investir em infra de agregação.

**Distribuição desacoplada / marketplace interno de skills.** Decisão atual: manter tudo junto num único pacote npm, versionado como um todo (matriz 5.6 do relatório). Racional: granularidade fina (versionar cada skill/MCP/CLI separadamente) só compensa quando existe mais de um consumidor do registry; hoje só o próprio wizz-method lê `skills-registry.yaml`. O campo opcional `metadata.version` (ver "Adding Components" acima) é o único preparo feito agora, sem migrar nada retroativamente. Gatilho: 2 ou mais consumidores reais do registry além do próprio wizz-method.

**Evals de LLM como gate de release.** Decisão atual: `routing-eval-llm.yaml` roda manual/semanal, nunca bloqueia PR. Racional: o dataset de roteamento ainda não é robusto o suficiente para confiar o sinal como gate automático; falsos negativos travariam PRs por motivo errado. Gatilho: o dataset de roteamento amadurecer o suficiente (alimentado pelo trace real do `WIZZ_TRACE`/`trace-report`) para o sinal ser confiável.

## Reporting Security Vulnerabilities

Do **not** open a public GitHub issue for security vulnerabilities. Instead, email **<security@wizzcomms.com>** with:

1. Description of the vulnerability.
2. Steps to reproduce (if applicable).
3. Potential impact.
4. Suggested fix (if you have one).

We aim to acknowledge reports within 48 hours and provide a timeline for remediation. Security patches are released as soon as fixes are ready.

## Code of Conduct

All participants must abide by our [Code of Conduct](https://github.com/wizzcomms/wizz-method/blob/main/CODE_OF_CONDUCT.md). Violations should be reported to <support@wizzcomms.com>.
