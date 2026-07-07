/**
 * Install Smoke Test
 *
 * End-to-end smoke test for `tools/installer/commands/install.js` via the
 * real `wizz-cli.js install --yes` entry point, the orchestrator that wires
 * together module selection, IDE/tool setup, global skills, and manifest
 * generation. Per the 2026-07-07 audit (A17, "75% dos módulos do installer
 * sem teste direto"), `commands/install.js` was flagged as the single
 * biggest test gap in the repo: nothing drove the real CLI entry point
 * ponta-a-ponta, only individual components in isolation.
 *
 * This spawns `node tools/installer/wizz-cli.js install --yes --tools
 * claude-code` against a throwaway temp directory and asserts:
 *  - the process exits 0 (no thrown error);
 *  - the core `_wizz/` scaffold and its manifests exist;
 *  - global skills were copied to `.claude/skills` (claude-code IDE target);
 *  - the module output directories (`_wizz-output/*`, `docs/`) exist.
 *
 * No network mocking needed: with `--yes` and no `--modules` flag, module
 * selection defaults to `bmm` (default_selected: true in
 * src/bmm-skills/module.yaml) plus the always-included `core` module. Both
 * ship inside this repo, so module resolution/copy is 100% local disk I/O,
 * no git clone / npm install. The `wizz` module (external MCP/CLI
 * provisioning, area selection) is not selected by default and stays out of
 * scope here, matching real-world default `--yes` behavior. The only
 * network touch left in the flow is the best-effort `npm view` update check
 * fired by wizz-cli.js at startup (5s timeout, wrapped in try/catch, never
 * affects the exit code). Left as-is rather than mocked, since a failure
 * there is silently swallowed and cannot fail this test.
 *
 * Usage: node test/test-install-smoke.js
 */

const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const fs = require('../tools/installer/fs-native');

const colors = {
  reset: '[0m',
  green: '[32m',
  red: '[31m',
  cyan: '[36m',
  dim: '[2m',
};

let passed = 0;
let failed = 0;

function assert(condition, testName, errorMessage = '') {
  if (condition) {
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    passed++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (errorMessage) console.log(`  ${colors.dim}${errorMessage}${colors.reset}`);
    failed++;
  }
}

// Real end-to-end run: no --modules override, no --areas/--mcps/--clis, so
// the flow exercises the exact code path a first-time `--yes` user hits.
const INSTALL_TIMEOUT_MS = 90_000;

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const cli = path.join(repoRoot, 'tools', 'installer', 'wizz-cli.js');
  let tmpDir;

  try {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wizz-install-smoke-'));

    const start = Date.now();
    let output = '';
    let spawnError = null;
    try {
      output = execFileSync(process.execPath, [cli, 'install', '--yes', '--directory', tmpDir, '--tools', 'claude-code'], {
        cwd: repoRoot,
        encoding: 'utf8',
        timeout: INSTALL_TIMEOUT_MS,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      spawnError = error;
      output = `${error.stdout || ''}${error.stderr || ''}`;
    }
    const elapsedMs = Date.now() - start;

    assert(spawnError === null, 'install --yes exits 0 (no thrown error)', spawnError ? spawnError.message : '');
    assert(elapsedMs < INSTALL_TIMEOUT_MS, `install --yes completes within ${INSTALL_TIMEOUT_MS}ms budget`, `took ${elapsedMs}ms`);

    const wizzDir = path.join(tmpDir, '_wizz');
    assert(await fs.pathExists(wizzDir), '_wizz/ scaffold created');
    assert(await fs.pathExists(path.join(wizzDir, '_config', 'manifest.yaml')), '_wizz/_config/manifest.yaml generated');
    assert(await fs.pathExists(path.join(wizzDir, '_config', 'skill-manifest.csv')), '_wizz/_config/skill-manifest.csv generated');
    assert(await fs.pathExists(path.join(wizzDir, 'bmm', 'config.yaml')), 'bmm module installed (config.yaml)');
    assert(await fs.pathExists(path.join(wizzDir, 'core', 'config.yaml')), 'core module installed (config.yaml)');

    const skillsDir = path.join(tmpDir, '.claude', 'skills');
    assert(await fs.pathExists(skillsDir), '.claude/skills/ created (claude-code tool target)');
    assert(await fs.pathExists(path.join(skillsDir, 'wizz-router')), 'wizz-router global skill copied to .claude/skills');

    assert(await fs.pathExists(path.join(tmpDir, '_wizz-output', 'planning-artifacts')), '_wizz-output/planning-artifacts created');
    assert(
      await fs.pathExists(path.join(tmpDir, '_wizz-output', 'implementation-artifacts')),
      '_wizz-output/implementation-artifacts created',
    );
    assert(await fs.pathExists(path.join(tmpDir, 'docs')), 'docs/ (project knowledge folder) created');

    if (spawnError || failed > 0) {
      console.log(`\n${colors.dim}--- install output (tail) ---${colors.reset}`);
      console.log(output.slice(-4000));
    }
  } catch (error) {
    console.log(`${colors.red}Test setup failed: ${error.message}${colors.reset}`);
    console.log(error.stack);
    failed++;
  } finally {
    if (tmpDir) await fs.remove(tmpDir).catch(() => {});
  }

  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${failed}${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  if (failed === 0) {
    console.log(`${colors.green}All install-smoke tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}Some install-smoke tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

main();
