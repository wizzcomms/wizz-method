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

## Reporting Security Vulnerabilities

Do **not** open a public GitHub issue for security vulnerabilities. Instead, email **<security@wizzcomms.com>** with:

1. Description of the vulnerability.
2. Steps to reproduce (if applicable).
3. Potential impact.
4. Suggested fix (if you have one).

We aim to acknowledge reports within 48 hours and provide a timeline for remediation. Security patches are released as soon as fixes are ready.

## Code of Conduct

All participants must abide by our [Code of Conduct](https://github.com/wizzcomms/wizz-method/blob/main/CODE_OF_CONDUCT.md). Violations should be reported to <support@wizzcomms.com>.
