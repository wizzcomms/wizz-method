---
title: Testing Options
description: Comparing the built-in QA workflow with the Test Architect (TEA) module for test automation.
sidebar:
  order: 6
---

The Wizz Method provides two testing paths: a built-in QA workflow for fast test generation and an installable Test Architect module for enterprise-grade test strategy.

## Which Should You Use?

| Factor | Built-in QA | TEA Module |
| --- | --- | --- |
| **Best for** | Small-medium projects, quick coverage | Large projects, regulated or complex domains |
| **Setup** | Nothing to install -- included in BMM | Install separately via `npx wizz-method install` |
| **Approach** | Generate tests fast, iterate later | Plan first, then generate with traceability |
| **Test types** | API and E2E tests | API, E2E, ATDD, NFR, and more |
| **Strategy** | Happy path + critical edge cases | Risk-based prioritization (P0-P3) |
| **Workflow count** | 1 (Automate) | 9 (design, ATDD, automate, review, trace, and others) |

:::tip[Start with built-in QA]
Most projects should start with the built-in QA workflow. If you later need test strategy, quality gates, or requirements traceability, install TEA alongside it.
:::

## Built-in QA Workflow

The built-in QA workflow (`wizz-qa-generate-e2e-tests`) is part of the BMM (Agile suite) module, available through the Developer agent. It generates working tests quickly using your project's existing test framework -- no configuration or additional installation required.

**Trigger:** `QA` (via the Developer agent) or `wizz-qa-generate-e2e-tests`

### What It Does

The QA workflow (Automate) walks through five steps:

1. **Detect test framework** -- scans `package.json` and existing test files for your framework (Jest, Vitest, Playwright, Cypress, or any standard runner). If none exists, analyzes the project stack and suggests one.
2. **Identify features** -- asks what to test or auto-discovers features in the codebase.
3. **Generate API tests** -- covers status codes, response structure, happy path, and 1-2 error cases.
4. **Generate E2E tests** -- covers user workflows with semantic locators and visible-outcome assertions.
5. **Run and verify** -- executes the generated tests and fixes failures immediately.

The workflow produces a test summary saved to your project's implementation artifacts folder.

### Test Patterns

Generated tests follow a "simple and maintainable" philosophy:

- **Standard framework APIs only** -- no external utilities or custom abstractions
- **Semantic locators** for UI tests (roles, labels, text rather than CSS selectors)
- **Independent tests** with no order dependencies
- **No hardcoded waits or sleeps**
- **Clear descriptions** that read as feature documentation

:::note[Scope]
The QA workflow generates tests only. For code review and story validation, use the Code Review workflow (`CR`) instead.
:::

### When to Use Built-in QA

- Quick test coverage for a new or existing feature
- Beginner-friendly test automation without advanced setup
- Standard test patterns that any developer can read and maintain
- Small-medium projects where comprehensive test strategy is unnecessary

## Test Architect (TEA) Module

TEA is a standalone module that provides an expert agent (Murat) and nine structured workflows for enterprise-grade testing. It goes beyond test generation into test strategy, risk-based planning, quality gates, and requirements traceability.

- **Documentation:** [TEA Module Docs](https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/)
- **Install:** `npx wizz-method install` and select the TEA module
- **npm:** [`bmad-method-test-architecture-enterprise`](https://www.npmjs.com/package/bmad-method-test-architecture-enterprise)

### What TEA Provides

| Workflow | Purpose |
| --- | --- |
| Test Design | Create a comprehensive test strategy tied to requirements |
| ATDD | Acceptance-test-driven development with stakeholder criteria |
| Automate | Generate tests with advanced patterns and utilities |
| Test Review | Validate test quality and coverage against strategy |
| Traceability | Map tests back to requirements for audit and compliance |
| NFR Assessment | Evaluate non-functional requirements (performance, security) |
| CI Setup | Configure test execution in continuous integration pipelines |
| Framework Scaffolding | Set up test infrastructure and project structure |
| Release Gate | Make data-driven go/no-go release decisions |

TEA also supports P0-P3 risk-based prioritization and optional integrations with Playwright Utils and MCP tooling.

### When to Use TEA

- Projects that require requirements traceability or compliance documentation
- Teams that need risk-based test prioritization across many features
- Enterprise environments with formal quality gates before release
- Complex domains where test strategy must be planned before tests are written
- Projects that have outgrown the built-in QA's single-workflow approach

## How Testing Fits into Workflows

The QA Automate workflow appears in Phase 4 (Implementation) of the Wizz Method workflow map. It is designed to run **after a full epic is complete** — once all stories in an epic have been implemented and code-reviewed. A typical sequence:

1. For each story in the epic: implement with Dev (`DS`), then validate with Code Review (`CR`)
2. After the epic is complete: generate tests with `QA` (via the Developer agent) or TEA's Automate workflow
3. Run retrospective (`wizz-retrospective`) to capture lessons learned

The built-in QA workflow works directly from source code without loading planning documents (PRD, architecture). TEA workflows can integrate with upstream planning artifacts for traceability.

For more on where testing fits in the overall process, see the [Workflow Map](./workflow-map.md).

## Testing This Repo Itself

Everything above covers testing *inside a project you build with* Wizz Method. This section is about the different thing: how the wizz-method **framework repository** tests itself (the installer, hooks, registry, and docs build).

### Unit/integration suite (`npm test`)

`npm test` runs ~20 plain-Node test scripts (no test-framework dependency; each exits non-zero on failure) covering the installer's modules (CLI/MCP resolution, custom-file preservation, quick-update gate, channel planning), the registry schema validator, the two global hooks (`wizz-router-enforce.js`, `rtk-rewrite.sh`), the `resolve_customization.py` TOML merge resolver, and the docs-site rehype plugins — plus lint/format/`sync:check` at the end. Full list and what each one covers: `test/README.md`.

A new test file must be wired into `package.json` (`test:<name>` script + appended to the `test` aggregate) or it silently never runs in CI — this happened to two tests (`test-rehype-plugins.mjs`, `test-workflow-path-regex.js`) before the Fase 3 audit caught and fixed it.

### Routing evals (`eval:routing`, `eval:routing:llm`)

Two separate evals score the wizz-router/maestro dispatch decision against a fixture dataset (`evals/routing/`):

- `npm run eval:routing` — deterministic, rule-based scoring. Runs as its own step in `.github/workflows/quality.yaml` on every PR (a real gate).
- `npm run eval:routing:llm` — LLM-graded scoring of the same dataset, for nuance a deterministic rule can't capture. Runs on a manual/weekly schedule (`.github/workflows/routing-eval-llm.yaml`), **not** a merge gate — see `docs/governance.md` § "Gatilhos de reavaliação" for when it's promoted to one.

### Install smoke test (CI, Linux container)

`.github/workflows/quality.yaml` runs on `ubuntu-latest` and its "Run test suite" step includes `test/test-install-smoke.js`, which spawns a real `wizz-cli.js install --yes` against a temp directory and validates `_wizz/` + manifests + copied skills end-to-end. It intentionally does not select the `wizz` module (external MCP/CLI provisioning, area selection) — a real end-to-end run of a `setup:`-block CLI (e.g. `pip install "scrapling[ai]"`) is a known remaining gap, not yet covered by any CI job (see `_audit/2026-07-07-parte2-auditoria-mcps-clis-memoria-rtk.md` § J).

### Strict validators (`npm run quality`)

`npm run quality` adds strict-mode validators on top of `npm test`: `validate:refs` (file references), `validate:method-refs` (registry-id references), `validate:skills` (SKILL.md frontmatter), and `docs:build`/`docs:validate-sidebar` (the docs site actually builds and its sidebar order is valid). These are stricter/slower than their `test:*` counterparts and are meant for pre-release checks, not every commit.
