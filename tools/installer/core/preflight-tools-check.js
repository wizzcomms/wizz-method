/**
 * Preflight check for `git`/`curl` in PATH (Tarefa 3.5c da auditoria,
 * parte 2 item D6: "dependência de git/curl no PATH não checada antes dos
 * installs → mensagem amigável em vez de stderr cru").
 *
 * `git` is a hard dependency of the install flow: official/custom module
 * fetch and the changelog/version resolution all shell out to `git clone`/
 * `git fetch`/`git rev-parse` deep inside custom-module-manager.js and
 * external-manager.js. Without this check, a missing `git` surfaces as a
 * raw `Command failed: git clone ...` / `ENOENT` stack trace from wherever
 * the first git call happens to live — this check fails fast, once, with a
 * plain-language message instead.
 *
 * `curl` is only used by specific optional CLI `install:` commands in
 * skills-registry.yaml (e.g. `curl ... | sh`), which are opt-in and
 * user-triggered, never run automatically during a plain install. Missing
 * `curl` is therefore a warning, not a blocking error.
 *
 * Deliberately NOT wired into tools/installer/core/installer.js (that file
 * is in scope for a separate god-object extraction pass) — this is called
 * directly from the CLI entry point (commands/install.js), same pattern as
 * ../core/wsl-node-check.js.
 */
const { execFileSync } = require('node:child_process');
const prompts = require('../prompts');

/**
 * @param {string} bin
 * @param {(bin: string, args: string[]) => Buffer} runner injectable for tests
 * @returns {boolean}
 */
function isOnPath(bin, runner = defaultRunner) {
  try {
    runner(bin, ['--version']);
    return true;
  } catch {
    return false;
  }
}

function defaultRunner(bin, args) {
  return execFileSync(bin, args, { stdio: 'pipe' });
}

/**
 * @param {{ runner?: Function }} [deps] injectable for tests
 * @returns {{ git: boolean, curl: boolean }}
 */
function detectRequiredTools(deps = {}) {
  const runner = deps.runner || defaultRunner;
  return {
    git: isOnPath('git', runner),
    curl: isOnPath('curl', runner),
  };
}

async function checkRequiredTools(deps = {}) {
  const detection = detectRequiredTools(deps);

  if (!detection.git) {
    await prompts.log.error(
      [
        '`git` was not found on your PATH.',
        '',
        'The Wizz Method installer needs git to fetch official and custom modules.',
        'Install git (https://git-scm.com/downloads) and rerun this command.',
      ].join('\n'),
    );
    process.exit(1);
  }

  if (!detection.curl) {
    await prompts.log.warn(
      '`curl` was not found on your PATH. Most of the installer works fine without it, ' +
        'but some optional CLI installs from the registry (skills-registry.yaml `install:` commands) shell out to curl and will fail until it is installed.',
    );
  }

  return detection;
}

module.exports = { checkRequiredTools, detectRequiredTools, isOnPath };
