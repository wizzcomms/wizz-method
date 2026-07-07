# Test Suite

Tests for the WIZZ-METHOD tooling infrastructure (installer, hooks, registry, docs build). All tests are plain Node scripts (no test framework/runner dependency) — each exits non-zero on failure and prints a pass/fail summary.

## Quick Start

```bash
# Run everything (all suites below + lint + format + sync:check)
npm test

# Run all quality checks (subset of test + build + strict validators)
npm run quality

# Run one suite directly
npm run test:install
node test/test-install-smoke.js   # or invoke the file directly
```

## Test Scripts

Each script below has a matching `npm run test:<name>` in `package.json` and is included in the aggregate `npm test`, unless noted otherwise.

| Script | File | Covers |
|---|---|---|
| `test:cli` | `test-cli-config.js` | `tools/installer/modules/cli-config.js` — registry-driven CLI resolve/detect/install |
| `test:deps` | `test-deps-cache.js` | `tools/installer/modules/deps-cache.js` — install-time dependency cache manifest |
| `test:dispatch-rule` | `test-dispatch-rule-consistency.js` | The maestro/router dispatch rule ("2+ áreas → maestro...") stays consistent across the 4 places it's hand-written |
| `test:fetch-assets` | `test-fetch-assets.js` | `tools/fetch-assets.mjs` — lazy downloader for heavy assets (huashu MP3s, canvas-design fonts) |
| `test:refs` | `test-file-refs-csv.js` | `extractCsvRefs()` in `tools/validate-file-refs.js` against fixtures |
| `test:install-smoke` | `test-install-smoke.js` | End-to-end: real `wizz-cli.js install --yes` via `tools/installer/commands/install.js` |
| `test:install` | `test-installation-components.js` | Installation components in isolation (agent YAML→XML compilation, custom file preservation, help catalog merge, etc.) |
| `test:channels` | `test-installer-channels.js` | Pure planning/resolution modules: `channel-plan.js` and related |
| `test:mcp` | `test-mcp-config.js` | `tools/installer/modules/mcp-config.js` — registry-driven MCP resolve + additive `.mcp.json` merge |
| `test:method-refs-allowlist` | `test-method-refs-allowlist.js` | `collectRegistryIds()`/`isValidReference()` in `tools/validate-method-refs.js` |
| `test:network-retry` | `test-network-retry.js` | Retry-with-backoff wrapper on the installer's network call sites |
| `test:urls` | `test-parse-source-urls.js` | `CustomModuleManager.parseSource()` — Git URL parsing across hosts/path shapes |
| `test:preflight-tools-check` | `test-preflight-tools-check.js` | `tools/installer/core/preflight-tools-check.js` — friendly git/curl-on-PATH check before install |
| `test:quickupdate` | `test-quick-update-gate.js` | The `isQuickUpdate()` gate in `tools/installer/core/installer.js` |
| `test:registry-schema` | `test-registry-schema.js` | `validateRegistrySchema()` in `tools/validate-registry-schema.js` against fixtures + the real `skills-registry.yaml` |
| `test:rehype-plugins` | `test-rehype-plugins.mjs` | `website/src/rehype-markdown-links.js` + `rehype-base-paths.js` (docs site link/base-path rewriting) |
| `test:resolver` | `test-resolve-customization.js` | `src/scripts/resolve_customization.py` — base/team/user `customize.toml` merge, incl. `include` |
| `test:rtk-hook` | `test-rtk-hook.js` | `tools/hooks/rtk-rewrite.sh` (synced to `~/.claude/hooks/` via `npm run sync:global`) |
| `test:hooks` | `test-router-hook.js` | `tools/hooks/wizz-router-enforce.js` — `isTrivial` determinism + context selection (wizz vs flat mode) |
| `test:sync-check` | `test-sync-check.js` | `tools/sync-check.mjs` — repo-vs-global hash comparison/warning |
| `test:trace-report` | `test-trace-report.js` | `tools/installer/commands/trace-report.js` via the real `wizz-cli.js trace-report` entry point |
| `test:workflow-path-regex` | `test-workflow-path-regex.js` | Source/install workflow path regexes in `ModuleManager` (`tools/installer/modules/manager.js`) |

Not run by `npm test` (deliberately out of the default gate):

- `eval:routing` (`evals/routing/run-routing-eval.mjs`) — deterministic routing eval, runs in `.github/workflows/quality.yaml` as its own CI step, not folded into `npm test`.
- `eval:routing:llm` (`evals/routing/run-routing-eval.mjs --llm`) — LLM-graded routing eval, manual/weekly (`.github/workflows/routing-eval-llm.yaml`), not a merge gate.

## Test Fixtures

Located in `test/fixtures/`:

```text
test/fixtures/
└── file-refs-csv/    # Fixtures for file reference CSV tests
```

Other suites (e.g. `test-registry-schema.js`, `test-mcp-config.js`) construct fixtures inline instead of reading from `test/fixtures/`.

## Conventions

- No external test framework: each file defines its own `assert()` helper, prints ✓/✗ per case, and calls `process.exit(1)` on any failure so CI/`npm test` fails loud.
- Name a new test file `test-<topic>.js` (or `.mjs` if it needs ESM import of a `.mjs`/ESM source module), add a matching `test:<topic>` script in `package.json`, and append it to the `test` aggregate script — otherwise it's an orphan that never runs in CI (this happened to `test-rehype-plugins.mjs` and `test-workflow-path-regex.js` until the Fase 3 audit wired them in).
- See `docs/reference/testing.md` for the broader picture (what's covered, what's manual/periodic, and the CI eval gates).
