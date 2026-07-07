/**
 * CLI Config Module Tests
 *
 * Unit tests for tools/installer/modules/cli-config.js — the registry-driven
 * CLI resolution + detect + install used by the installer's CLI step. Mirrors
 * the MCP step (modules/mcp-config.js) but for command-line tools the agents
 * shell out to (e.g. agent-browser for browser verification, rtk for token
 * economy) instead of MCP servers written to .mcp.json.
 *
 * Pure logic (resolveClis/renderInstallCommand) is deterministic; detectClis
 * and installClis take an INJECTED exec runner so no real command is ever run
 * during tests (no npm install -g, no curl | sh).
 *
 * Usage: node test/test-cli-config.js
 */

const {
  resolveClis,
  renderInstallCommand,
  detectClis,
  installClis,
  matchesPlatform,
  extractVersion,
  compareSemver,
} = require('../tools/installer/modules/cli-config');

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

function assertEqual(actual, expected, testName) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  assert(ok, testName, ok ? '' : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function section(title) {
  console.log(`\n${colors.cyan}── ${title} ──${colors.reset}`);
}

// A small fixture registry mirroring the real shape.
const REGISTRY = {
  areas: {
    qa: {
      clis: [
        {
          id: 'agent-browser',
          when: 'browser',
          check: 'agent-browser --version',
          install: 'npm install -g agent-browser',
        },
      ],
    },
    designer: {}, // area with no clis
  },
  cli_utility: [
    {
      id: 'rtk',
      when: 'token economy',
      check: 'rtk --version',
      install: 'curl -fsSL https://example.test/install.sh | sh',
    },
  ],
};

// A controllable exec stub: maps a substring of the command to a canned result.
function fakeExec(matchers) {
  const calls = [];
  const exec = async (command) => {
    calls.push(command);
    for (const [needle, result] of matchers) {
      if (command.includes(needle)) return result;
    }
    return { ok: false, stdout: '', stderr: 'no match' };
  };
  exec.calls = calls;
  return exec;
}

async function runTests() {
  // ───────────────────────────────────────────────────────────────────────
  section('resolveClis');

  {
    const r = resolveClis(REGISTRY, ['qa']);
    const ids = r.map((c) => c.id).sort();
    assertEqual(ids, ['agent-browser', 'rtk'], 'one area + cross-cutting utility');
  }
  {
    const r = resolveClis(REGISTRY, []);
    const ids = r.map((c) => c.id).sort();
    assertEqual(ids, ['agent-browser', 'rtk'], 'empty selection => all areas + utility');
  }
  {
    const r = resolveClis(REGISTRY, ['all']);
    const ids = r.map((c) => c.id).sort();
    assertEqual(ids, ['agent-browser', 'rtk'], "'all' sentinel resolves every area");
  }
  {
    const r = resolveClis(REGISTRY, ['designer']);
    assertEqual(
      r.map((c) => c.id),
      ['rtk'],
      'area without clis still gets utility only',
    );
  }
  {
    const r = resolveClis({ areas: {} }, ['qa']);
    assertEqual(r, [], 'missing cli_utility + unknown area => empty');
  }
  {
    const r = resolveClis(null, ['qa']);
    assertEqual(r, [], 'null registry => empty (safe)');
  }

  // ───────────────────────────────────────────────────────────────────────
  section('resolveClis — platform gate');

  // A registry with a Mac-Apple-Silicon-only CLI (mirrors buttercut) plus an
  // ungated one. The gated entry must appear only on a matching OS/arch tag.
  const GATED = {
    areas: {
      designer: {
        clis: [
          { id: 'always', when: 'x', check: '', install: 'echo a' },
          { id: 'mac-only', when: 'edit video', platform: 'darwin-arm64', check: '', install: 'git clone x' },
        ],
      },
    },
  };
  {
    const ids = resolveClis(GATED, ['designer'], 'darwin-arm64')
      .map((c) => c.id)
      .sort();
    assertEqual(ids, ['always', 'mac-only'], 'darwin-arm64 => gated tool included');
  }
  {
    const ids = resolveClis(GATED, ['designer'], 'linux-x64').map((c) => c.id);
    assertEqual(ids, ['always'], 'linux-x64 => gated tool dropped');
  }
  {
    const ids = resolveClis(GATED, ['designer'], 'darwin-x64').map((c) => c.id);
    assertEqual(ids, ['always'], 'darwin-x64 (Intel Mac) => gated tool dropped');
  }
  {
    // Bare OS / arch tokens and array form both match.
    assert(matchesPlatform({ platform: 'darwin' }, 'darwin-arm64'), 'bare OS token matches');
    assert(matchesPlatform({ platform: 'arm64' }, 'darwin-arm64'), 'bare arch token matches');
    assert(matchesPlatform({ platform: ['linux-x64', 'darwin-arm64'] }, 'darwin-arm64'), 'array form matches');
    assert(!matchesPlatform({ platform: 'darwin-arm64' }, 'win32-x64'), 'non-match is rejected');
    assert(matchesPlatform({}, 'win32-x64'), 'no platform field => runs everywhere');
  }
  {
    // utility id should never duplicate even across multiple areas
    const r = resolveClis(REGISTRY, ['qa', 'designer']);
    const rtk = r.filter((c) => c.id === 'rtk');
    assert(rtk.length === 1, 'cross-cutting id deduped across areas');
  }
  {
    // an id present in two areas records both
    const reg = {
      areas: {
        a: { clis: [{ id: 'dup', when: 'x', check: 'dup -v', install: 'i' }] },
        b: { clis: [{ id: 'dup', when: 'y', check: 'dup -v', install: 'i' }] },
      },
    };
    const r = resolveClis(reg, ['a', 'b']);
    assert(r.length === 1 && r[0].areas.length === 2, 'duplicate id merges areas list');
  }
  {
    // entries missing id or install are ignored (a CLI we cannot act on is useless)
    const reg = {
      areas: {
        a: {
          clis: [
            { id: 'noinstall', when: 'x' },
            { when: 'y', install: 'i' },
          ],
        },
      },
    };
    const r = resolveClis(reg, ['a']);
    assertEqual(r, [], 'entries without id or install are dropped');
  }

  // ───────────────────────────────────────────────────────────────────────
  section('renderInstallCommand');

  assertEqual(
    renderInstallCommand({ id: 'agent-browser', install: 'npm install -g agent-browser' }),
    'npm install -g agent-browser',
    'returns the install command verbatim',
  );
  assertEqual(renderInstallCommand({ id: 'x' }), '', 'missing install => empty string');

  // ───────────────────────────────────────────────────────────────────────
  section('detectClis (injected exec)');

  {
    const clis = resolveClis(REGISTRY, ['qa']); // agent-browser + rtk
    const exec = fakeExec([
      ['agent-browser --version', { ok: true, stdout: '0.27.0' }],
      ['rtk --version', { ok: false, stdout: '', stderr: 'not found' }],
    ]);
    const detected = await detectClis(clis, exec);
    const ab = detected.find((c) => c.id === 'agent-browser');
    const rtk = detected.find((c) => c.id === 'rtk');
    assert(ab.installed === true, 'check exits 0 => installed true');
    assert(rtk.installed === false, 'check fails => installed false');
    assert(exec.calls.length === 2, 'runs one check per cli');
  }
  {
    // an entry with no `check` cannot be verified => treated as not installed (offer it)
    const detected = await detectClis([{ id: 'x', install: 'i' }], fakeExec([]));
    assert(detected[0].installed === false, 'no check field => installed false (cannot verify)');
  }
  {
    // detection never mutates the input entries (immutability)
    const input = resolveClis(REGISTRY, ['qa']);
    await detectClis(input, fakeExec([['agent-browser', { ok: true }]]));
    assert(
      input.every((c) => !('installed' in c)),
      'detectClis does not mutate its input',
    );
  }

  // ───────────────────────────────────────────────────────────────────────
  section('installClis (injected exec)');

  {
    const clis = resolveClis(REGISTRY, ['qa']);
    const exec = fakeExec([
      ['npm install -g agent-browser', { ok: true, stdout: 'added 1 package' }],
      ['install.sh', { ok: true, stdout: 'rtk installed' }],
    ]);
    const res = await installClis({ clis, exec });
    assertEqual(res.installed.sort(), ['agent-browser', 'rtk'], 'both install commands run => installed');
    assertEqual(res.failed, [], 'nothing failed');
    assertEqual(
      exec.calls.sort(),
      ['curl -fsSL https://example.test/install.sh | sh', 'npm install -g agent-browser'],
      'runs the install command verbatim (incl. pipe)',
    );
  }
  {
    const clis = resolveClis(REGISTRY, ['qa']);
    const exec = fakeExec([
      ['npm install -g agent-browser', { ok: true, stdout: 'ok' }],
      ['install.sh', { ok: false, stdout: '', stderr: 'curl: (6) could not resolve host' }],
    ]);
    const res = await installClis({ clis, exec });
    assertEqual(res.installed, ['agent-browser'], 'successful one is installed');
    assert(res.failed.length === 1 && res.failed[0].id === 'rtk', 'failed one is reported, not thrown');
    assert(/could not resolve/.test(res.failed[0].error), 'failure carries stderr for the user');
  }
  {
    const res = await installClis({ clis: [], exec: fakeExec([]) });
    assertEqual(res, { installed: [], failed: [], warnings: [] }, 'empty clis => no-op');
  }
  {
    // a CLI with no install command cannot be installed — reported as failed, never run
    const exec = fakeExec([]);
    const res = await installClis({ clis: [{ id: 'broken' }], exec });
    assert(res.failed.length === 1 && exec.calls.length === 0, 'missing install command => failed without running anything');
  }
  {
    // M14: verify runs post-install; a failure warns but the install itself
    // still counts (fail-open, CLIs are opt-in — never abort).
    const exec = fakeExec([
      ['git clone', { ok: true, stdout: '', stderr: '' }],
      ['command -v ffmpeg', { ok: false, stdout: '', stderr: 'ffmpeg: not found' }],
    ]);
    const res = await installClis({
      clis: [{ id: 'buttercut', install: 'git clone x buttercut', verify: 'command -v ffmpeg' }],
      exec,
    });
    assertEqual(res.installed, ['buttercut'], 'install still counts as installed despite verify failure');
    assertEqual(res.failed, [], 'verify failure never lands in failed (fail-open)');
    assert(res.warnings.length === 1 && res.warnings[0].id === 'buttercut', 'verify failure surfaces as a warning');
    assert(/ffmpeg: not found/.test(res.warnings[0].warning), 'warning carries the verify stderr for the user');
  }
  {
    // verify passes => installed cleanly, no warning at all.
    const exec = fakeExec([
      ['git clone', { ok: true, stdout: '', stderr: '' }],
      ['command -v ffmpeg', { ok: true, stdout: '/usr/bin/ffmpeg', stderr: '' }],
    ]);
    const res = await installClis({
      clis: [{ id: 'buttercut', install: 'git clone x buttercut', verify: 'command -v ffmpeg' }],
      exec,
    });
    assertEqual(res.installed, ['buttercut'], 'installed');
    assertEqual(res.warnings, [], 'verify success => no warning');
  }

  // ───────────────────────────────────────────────────────────────────────
  section('extractVersion / compareSemver');

  assertEqual(extractVersion('rtk 0.43.0'), '0.43.0', 'extracts version from prefixed text');
  assertEqual(extractVersion('agent-browser version: 0.27.0\n'), '0.27.0', 'extracts version with trailing newline');
  assertEqual(extractVersion('no version here'), null, 'no version in text => null');
  assert(compareSemver('0.30.1', '0.43.0') < 0, '0.30.1 < 0.43.0');
  assert(compareSemver('0.43.0', '0.43.0') === 0, '0.43.0 == 0.43.0');
  assert(compareSemver('1.0.0', '0.43.0') > 0, '1.0.0 > 0.43.0');
  assert(compareSemver('0.43.1', '0.43.0') > 0, '0.43.1 > 0.43.0 (patch-level)');

  // ───────────────────────────────────────────────────────────────────────
  section('detectClis — min_version (M27, rtk drift)');

  {
    // Installed version below the pin => NOT installed:true; the caller's
    // existing "missing => offer install" path becomes "offer upgrade".
    const clis = [{ id: 'rtk', check: 'rtk --version', min_version: '0.43.0' }];
    const exec = fakeExec([['rtk --version', { ok: true, stdout: 'rtk 0.30.1\n', stderr: '' }]]);
    const [detected] = await detectClis(clis, exec);
    assert(detected.installed === false, 'below min_version => installed: false, not true');
    assertEqual(detected.installedVersion, '0.30.1', 'carries the parsed installed version');
    assertEqual(detected.upgradeMessage, 'atualizando rtk 0.30.1 → 0.43.0', 'carries a clear upgrade message');
  }
  {
    // Installed version at or above the pin => installed:true, as normal.
    const clis = [{ id: 'rtk', check: 'rtk --version', min_version: '0.43.0' }];
    const exec = fakeExec([['rtk --version', { ok: true, stdout: 'rtk 0.43.0\n', stderr: '' }]]);
    const [detected] = await detectClis(clis, exec);
    assert(detected.installed === true, 'at min_version => installed: true');
    assert(!('upgradeMessage' in detected), 'no upgrade message when current');
  }
  {
    // Version above the pin also passes.
    const clis = [{ id: 'rtk', check: 'rtk --version', min_version: '0.43.0' }];
    const exec = fakeExec([['rtk --version', { ok: true, stdout: 'rtk 1.0.0\n', stderr: '' }]]);
    const [detected] = await detectClis(clis, exec);
    assert(detected.installed === true, 'above min_version => installed: true');
  }
  {
    // check fails outright => installed:false regardless of min_version;
    // no upgrade message (there is nothing installed to upgrade).
    const clis = [{ id: 'rtk', check: 'rtk --version', min_version: '0.43.0' }];
    const exec = fakeExec([['rtk --version', { ok: false, stdout: '', stderr: 'not found' }]]);
    const [detected] = await detectClis(clis, exec);
    assert(detected.installed === false && !detected.upgradeMessage, 'check fails => installed:false, no upgrade message');
  }
  {
    // No min_version declared => old ok-only behavior, unaffected.
    const clis = [{ id: 'agent-browser', check: 'agent-browser --version' }];
    const exec = fakeExec([['agent-browser --version', { ok: true, stdout: '0.27.0', stderr: '' }]]);
    const [detected] = await detectClis(clis, exec);
    assert(detected.installed === true, 'no min_version => unaffected, installed: true');
  }

  // ───────────────────────────────────────────────────────────────────────
  section('detectClis — verify (M14, clone-and-run deps)');

  {
    // check passes (the clone exists) but verify (minimal runtime dep) fails
    // => not considered plenously installed. A clear warning, never a throw.
    const clis = [{ id: 'buttercut', check: 'test -d ./buttercut', verify: 'command -v ffmpeg' }];
    const exec = fakeExec([
      ['test -d ./buttercut', { ok: true, stdout: '', stderr: '' }],
      ['command -v ffmpeg', { ok: false, stdout: '', stderr: 'ffmpeg: not found' }],
    ]);
    const [detected] = await detectClis(clis, exec);
    assert(detected.installed === false, 'check ok but verify fails => installed: false');
    assert(/verifica/.test(detected.verifyWarning || ''), 'carries a clear verify warning');
  }
  {
    // Both check and verify pass => genuinely installed.
    const clis = [{ id: 'buttercut', check: 'test -d ./buttercut', verify: 'command -v ffmpeg' }];
    const exec = fakeExec([
      ['test -d ./buttercut', { ok: true, stdout: '', stderr: '' }],
      ['command -v ffmpeg', { ok: true, stdout: '/usr/bin/ffmpeg', stderr: '' }],
    ]);
    const [detected] = await detectClis(clis, exec);
    assert(detected.installed === true, 'check + verify both pass => installed: true');
    assert(!('verifyWarning' in detected), 'no verify warning when it passes');
  }
  {
    // No verify declared => unaffected, old behavior.
    const clis = [{ id: 'voicebox', check: 'test -d ./voicebox' }];
    const exec = fakeExec([['test -d ./voicebox', { ok: true, stdout: '', stderr: '' }]]);
    const [detected] = await detectClis(clis, exec);
    assert(detected.installed === true, 'no verify field => unaffected, installed: true');
  }

  // ───────────────────────────────────────────────────────────────────────
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${failed}${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  if (failed === 0) {
    console.log(`${colors.green}✨ All cli-config tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Some cli-config tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error(`${colors.red}Test runner failed:${colors.reset}`, error.message);
  console.error(error.stack);
  process.exit(1);
});
