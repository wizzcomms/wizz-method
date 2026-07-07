// Resolves + installs the command-line tools the agents shell out to.
//
// Sibling of modules/mcp-config.js. Where MCPs are *servers* merged into the
// project's .mcp.json, CLIs are *binaries* the agents call directly (e.g.
// `agent-browser` for browser verification, `rtk` for token economy). The
// skills-registry.yaml is the single source of truth for both: each AREA may
// declare a `clis:` list, plus a top-level `cli_utility:` for cross-cutting
// tools. Each entry has:
//   id      — the command name (used to detect + label)
//   when    — when this CLI helps (same disambiguation role as skills' `when`)
//   check   — command run to detect if it is ALREADY installed (e.g. `x --version`)
//   install — command run to install it (e.g. `npm install -g x`, `curl … | sh`)
//
// Design rules (deliberately conservative, mirroring mcp-config):
//   - DETECT FIRST: never reinstall something already on PATH. `check` decides.
//   - INSTALL IS OPT-IN: the caller (the interactive multiselect / --clis flag)
//     decides what to actually install; everything else is merely recommended
//     by printing its `install` command. Nothing runs without an explicit choice.
//   - NO-OP WHEN ABSENT: missing registry / no CLIs => empty, runs nothing.
//   - FAILURE NEVER THROWS UPSTREAM: installClis collects failures and returns
//     them so a bad network / EACCES never aborts the whole install.
//
// The install/check commands come from our own registry (not user input), and
// running them (npm install -g, curl | sh) is inherently a trust-the-source
// operation — hence install is opt-in and recommend-only by default.

const { exec } = require('node:child_process');
const { promisify } = require('node:util');
const { resolveAreaEntries } = require('./registry-resolve');

const execAsync = promisify(exec);

/**
 * Default command runner: runs a shell command, never throws. A non-zero exit
 * resolves to `{ ok: false, ... }` so callers branch on `ok`, not exceptions.
 * Uses a shell so registry commands with pipes (`curl … | sh`) work as written.
 * @param {string} command - Full shell command to run
 * @param {{timeoutMs?: number}} [opts]
 * @returns {Promise<{ok: boolean, stdout: string, stderr: string}>}
 */
async function defaultExec(command, { timeoutMs = 300_000 } = {}) {
  try {
    const { stdout, stderr } = await execAsync(command, { timeout: timeoutMs });
    return { ok: true, stdout: stdout || '', stderr: stderr || '' };
  } catch (error) {
    return { ok: false, stdout: error.stdout || '', stderr: error.stderr || error.message || '' };
  }
}

/**
 * Current "<platform>-<arch>" tag (e.g. "darwin-arm64"). Injectable for tests.
 * @returns {string}
 */
function currentPlatformTag() {
  return `${process.platform}-${process.arch}`;
}

/**
 * A CLI entry may declare `platform:` to gate it to specific OS/arch combos —
 * e.g. a tool that only builds on Apple Silicon. Accepts a string or array of
 * tokens matched against the current tag: a full "darwin-arm64", a bare OS
 * ("darwin"), or a bare arch ("arm64"). No `platform` field => runs everywhere.
 * @param {{platform?: string|string[]}} cli
 * @param {string} tag - Current "<platform>-<arch>" tag
 * @returns {boolean}
 */
function matchesPlatform(cli, tag) {
  const p = cli && cli.platform;
  if (!p) return true;
  const wanted = Array.isArray(p) ? p : [p];
  const [os, arch] = tag.split('-');
  return wanted.some((w) => w === tag || w === os || w === arch);
}

/**
 * Resolve the recommended CLI entries for the chosen areas, deduped by id.
 * Empty / undefined / containing 'all' means every area. The cross-cutting
 * `cli_utility:` tools are always included. Entries missing `id` or `install`
 * are dropped — a CLI we cannot install is not actionable. Entries whose
 * `platform:` gate does not match the current OS/arch are dropped too, so a
 * Mac-only tool is never even suggested on Linux/Windows.
 *
 * Wrapper fino sobre `resolveAreaEntries` (A16): a resolução por área em si
 * vive em `registry-resolve.js`; aqui só ficam a forma da entrada de CLI e o
 * filtro de elegibilidade (precisa de `install` + bater o gate de plataforma).
 *
 * @param {Object} registry - Parsed skills-registry.yaml
 * @param {string[]} [selectedAreas] - Area keys to resolve
 * @param {string} [platformTag] - Current "<platform>-<arch>" (injectable for tests)
 * @returns {Array<{id: string, when: string, check: string, install: string, platform: (string|string[]|undefined), areas: string[]}>}
 */
function resolveClis(registry, selectedAreas, platformTag = currentPlatformTag()) {
  return resolveAreaEntries(registry, selectedAreas, {
    listKey: 'clis',
    utilityKey: 'cli_utility',
    isActionable: (cli) => !!cli.install && matchesPlatform(cli, platformTag),
    mapEntry: (cli) => ({
      when: cli.when || '',
      check: cli.check || '',
      install: cli.install,
      platform: cli.platform,
    }),
  });
}

/**
 * The copy-pasteable install command for a CLI entry — used to recommend the
 * tools the user chose NOT to install (nothing is lost; they run it later).
 * @param {{install?: string}} cli - Resolved CLI entry
 * @returns {string} The install command, or '' if none.
 */
function renderInstallCommand(cli) {
  return (cli && cli.install) || '';
}

/**
 * Annotate each CLI with `installed: boolean` by running its `check` command.
 * Immutable: returns new objects, never mutates the input. An entry without a
 * `check` cannot be verified, so it is reported as not installed (we offer it
 * rather than silently assume it is present).
 *
 * @param {Array<Object>} clis - Resolved CLI entries
 * @param {Function} [exec] - Injected runner (command, opts) => {ok,...}
 * @returns {Promise<Array<Object>>} Copies with an added `installed` flag.
 */
async function detectClis(clis, exec = defaultExec) {
  return Promise.all(
    (clis || []).map(async (cli) => {
      if (!cli.check) return { ...cli, installed: false };
      const res = await exec(cli.check, { timeoutMs: 5000 });
      return { ...cli, installed: !!res.ok };
    }),
  );
}

/**
 * Run the install command for each CLI, collecting outcomes. Never throws:
 * a failed install (network, EACCES, missing command) lands in `failed` with
 * its error so the caller can warn and continue the broader install.
 *
 * @param {Object} args
 * @param {Array<{id: string, install?: string}>} args.clis - Entries to install
 * @param {Function} [args.exec] - Injected runner (command, opts) => {ok,...}
 * @returns {Promise<{installed: string[], failed: Array<{id: string, error: string}>}>}
 */
async function installClis({ clis, exec = defaultExec }) {
  const installed = [];
  const failed = [];
  for (const cli of clis || []) {
    if (!cli.install) {
      failed.push({ id: cli.id, error: 'sem comando de instalação no registry' });
      continue;
    }
    const res = await exec(cli.install, { timeoutMs: 300_000 });
    if (res.ok) installed.push(cli.id);
    else failed.push({ id: cli.id, error: (res.stderr || 'falha desconhecida').trim() });
  }
  return { installed, failed };
}

module.exports = { resolveClis, renderInstallCommand, detectClis, installClis, defaultExec, matchesPlatform, currentPlatformTag };
