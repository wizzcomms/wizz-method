/**
 * Install Smoke Test — MCP `setup:` pipeline (real, not mocked)
 *
 * Extends the coverage of test-install-smoke.js, which explicitly stays out
 * of MCP/CLI provisioning scope (see its top comment). test-mcp-config.js
 * covers merge/idempotency of `.mcp.json` but with `exec` mocked via
 * `defaultExec` injection — it never runs a real `pip`/`uv install`. Neither
 * closes the gap the 2026-07-07 audit (Parte 2, seção J) flagged: the only
 * `setup:` block in skills-registry.yaml today (`scrapling`, area `growth`)
 * has never been exercised end-to-end — detect → install → post_install
 * (browser download) → verify → resolve to an absolute path.
 *
 * This spawns `wizz-cli.js install --yes --modules bmm --areas growth
 * --mcps scrapling --tools claude-code` against a throwaway temp directory
 * and asserts the real pipeline (tools/installer/modules/mcp-config.js,
 * `prepareMcp`) produced a working `.mcp.json` entry:
 *  - `command` resolved to an ABSOLUTE path (never the bare `scrapling`
 *    string from the registry) — i.e. `resolveBinPath` ran;
 *  - that path exists on disk;
 *  - the process exited 0, meaning `setup.verify` (`{bin} --version`) ran
 *    without error (a failed verify makes prepareMcp drop the entry instead
 *    of writing it, which would fail the assertion above instead).
 *
 * Module choice: `--modules wizz` alone does NOT gate skill-area/MCP
 * selection — `selectSkillAreas`/`selectMcps` in tools/installer/ui.js check
 * `selectedModules.includes('bmm')` (confirmed by reading ui.js directly;
 * the `wizz` module, src/modules/wizz, is only the PT-BR agent-persona
 * layer). `bmm` is also the module `--yes` already defaults to, but it is
 * requested explicitly here so this test does not silently stop covering
 * anything if that default ever changes.
 *
 * Real network + real package install: `uv tool install` / `pipx install` /
 * `pip install --user "scrapling[ai]==0.4.10"`, then `scrapling install`
 * (downloads browser binaries). This is exactly why the task 3.6 spec keeps
 * this OUT of `npm test` and out of every PR gate — see
 * .github/workflows/install-smoke-mcp.yaml (workflow_dispatch + weekly cron,
 * same non-gating pattern as routing-eval-llm.yaml).
 *
 * Environment gate: skips (exit 0, clear warning) when none of `uv` / `pipx`
 * / `pip` / `pip3` is on PATH — matching exactly what
 * `setup.install` in skills-registry.yaml tries, in order. Detected BEFORE
 * spawning the install, so a missing package manager never looks like a
 * pipeline regression.
 *
 * Usage: node test/test-install-smoke-mcp.js
 */

const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const fs = require('../tools/installer/fs-native');

const colors = {
  reset: '[0m',
  green: '[32m',
  red: '[31m',
  yellow: '[33m',
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

// `setup.install` in skills-registry.yaml tries these in order: `uv tool
// install || pipx install || pip install --user`. Mirroring the same list
// here (plus `pip3`, since some environments only expose that name) means
// the pre-flight gate never diverges from what the real pipeline needs.
const PACKAGE_MANAGERS = ['uv', 'pipx', 'pip', 'pip3'];

/**
 * Detect whether any package manager the `scrapling` setup block relies on
 * is on PATH, BEFORE attempting the real install. Never throws.
 * @returns {string|null} The first package manager found, or null.
 */
function detectPackageManager() {
  for (const bin of PACKAGE_MANAGERS) {
    try {
      execFileSync('command', ['-v', bin], { shell: true, stdio: ['ignore', 'pipe', 'ignore'] });
      return bin;
    } catch {
      // Not found — try the next candidate.
    }
  }
  return null;
}

// scrapling[ai] plus its `post_install` browser download is a genuinely
// heavy, network-bound operation. Generous but bounded, matching the CI
// workflow's job-level timeout.
const INSTALL_TIMEOUT_MS = 480_000; // 8 minutes

async function main() {
  const packageManager = detectPackageManager();
  if (!packageManager) {
    console.log(
      `${colors.yellow}⚠${colors.reset} Nenhum gerenciador de pacote Python (${PACKAGE_MANAGERS.join(', ')}) encontrado no PATH — ` +
        `pulando o smoke test do setup: do MCP scrapling (gap de ambiente, não regressão de pipeline).`,
    );
    process.exit(0);
    return;
  }
  console.log(`${colors.dim}Gerenciador de pacote detectado: ${packageManager}${colors.reset}\n`);

  const repoRoot = path.resolve(__dirname, '..');
  const cli = path.join(repoRoot, 'tools', 'installer', 'wizz-cli.js');
  let tmpDir;

  try {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wizz-install-smoke-mcp-'));

    const start = Date.now();
    let output = '';
    let spawnError = null;
    try {
      output = execFileSync(
        process.execPath,
        [
          cli,
          'install',
          '--yes',
          '--directory',
          tmpDir,
          '--tools',
          'claude-code',
          '--modules',
          'bmm',
          '--areas',
          'growth',
          '--mcps',
          'scrapling',
        ],
        {
          cwd: repoRoot,
          encoding: 'utf8',
          timeout: INSTALL_TIMEOUT_MS,
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
    } catch (error) {
      spawnError = error;
      output = `${error.stdout || ''}${error.stderr || ''}`;
    }
    const elapsedMs = Date.now() - start;

    assert(spawnError === null, 'install --yes --mcps scrapling exits 0 (no thrown error)', spawnError ? spawnError.message : '');
    assert(elapsedMs < INSTALL_TIMEOUT_MS, `install completes within the ${INSTALL_TIMEOUT_MS}ms budget`, `took ${elapsedMs}ms`);

    const mcpConfigPath = path.join(tmpDir, '.mcp.json');
    const mcpConfigExists = await fs.pathExists(mcpConfigPath);
    assert(mcpConfigExists, '.mcp.json written to the project root');

    let scraplingCommand = null;
    if (mcpConfigExists) {
      const raw = await fs.readFile(mcpConfigPath, 'utf8');
      let config = null;
      try {
        config = JSON.parse(raw);
      } catch (error) {
        assert(false, '.mcp.json parses as valid JSON', error.message);
      }
      const entry = config && config.mcpServers && config.mcpServers.scrapling;
      assert(!!entry, '.mcp.json has a "scrapling" server entry', raw);
      scraplingCommand = entry && entry.command;
    }

    assert(
      !!scraplingCommand && path.isAbsolute(scraplingCommand),
      'scrapling server "command" is an absolute path (resolveBinPath ran, not the bare registry string)',
      `got: ${JSON.stringify(scraplingCommand)}`,
    );
    if (scraplingCommand && path.isAbsolute(scraplingCommand)) {
      assert(await fs.pathExists(scraplingCommand), `resolved scrapling binary exists on disk (${scraplingCommand})`);
    }

    if (spawnError || failed > 0) {
      console.log(`\n${colors.dim}--- install output (tail) ---${colors.reset}`);
      console.log(output.slice(-6000));
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
    console.log(`${colors.green}All install-smoke-mcp tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}Some install-smoke-mcp tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

main();
