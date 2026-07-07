/**
 * Preflight Tools Check Tests (Tarefa 3.5c da auditoria, parte 2 item D6)
 *
 * Cobre tools/installer/core/preflight-tools-check.js — checagem de
 * git/curl no PATH antes do install, com runner injetável (nunca dispara
 * um processo real de git/curl no teste).
 *
 * Usage: node test/test-preflight-tools-check.js
 */

const { detectRequiredTools, isOnPath, checkRequiredTools } = require('../tools/installer/core/preflight-tools-check');

const colors = {
  reset: '[0m',
  green: '[32m',
  red: '[31m',
  cyan: '[36m',
  dim: '[2m',
};

let passed = 0;
let failed = 0;

function check(condition, testName, errorMessage = '') {
  if (condition) {
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    passed++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (errorMessage) console.log(`  ${colors.dim}${errorMessage}${colors.reset}`);
    failed++;
  }
}

console.log(`\n${colors.cyan}Preflight Tools Check Tests${colors.reset}\n`);

// --- isOnPath ---

check(isOnPath('git', () => Buffer.from('git version 2.40.0')) === true, 'isOnPath: runner succeeds -> true');

check(
  isOnPath('git', () => {
    throw new Error('ENOENT');
  }) === false,
  'isOnPath: runner throws -> false',
);

// --- detectRequiredTools ---

{
  const result = detectRequiredTools({ runner: () => Buffer.from('ok') });
  check(result.git === true && result.curl === true, 'detectRequiredTools: both present -> {git:true, curl:true}');
}

{
  const result = detectRequiredTools({
    runner: (bin) => {
      if (bin === 'git') throw new Error('ENOENT');
      return Buffer.from('ok');
    },
  });
  check(result.git === false && result.curl === true, 'detectRequiredTools: git missing -> {git:false, curl:true}');
}

{
  const result = detectRequiredTools({
    runner: (bin) => {
      if (bin === 'curl') throw new Error('ENOENT');
      return Buffer.from('ok');
    },
  });
  check(result.git === true && result.curl === false, 'detectRequiredTools: curl missing -> {git:true, curl:false}');
}

// --- checkRequiredTools: exit behavior ---

async function withMockedExit(fn) {
  const originalExit = process.exit;
  let exitCode = null;
  process.exit = (code) => {
    exitCode = code === undefined ? 0 : code;
    throw new Error('__process_exit__');
  };
  try {
    await fn();
    return { exitCode: null, threw: false };
  } catch (error) {
    if (error.message === '__process_exit__') return { exitCode, threw: true };
    throw error;
  } finally {
    process.exit = originalExit;
  }
}

(async () => {
  {
    const { exitCode, threw } = await withMockedExit(() => checkRequiredTools({ runner: () => Buffer.from('ok') }));
    check(!threw && exitCode === null, 'checkRequiredTools: git+curl present -> does not exit');
  }

  {
    const { exitCode, threw } = await withMockedExit(() =>
      checkRequiredTools({
        runner: (bin) => {
          if (bin === 'git') throw new Error('ENOENT');
          return Buffer.from('ok');
        },
      }),
    );
    check(threw && exitCode === 1, 'checkRequiredTools: git missing -> process.exit(1)', `threw=${threw} exitCode=${exitCode}`);
  }

  {
    const { exitCode, threw } = await withMockedExit(() =>
      checkRequiredTools({
        runner: (bin) => {
          if (bin === 'curl') throw new Error('ENOENT');
          return Buffer.from('ok');
        },
      }),
    );
    check(!threw && exitCode === null, 'checkRequiredTools: curl missing -> warns but does not exit');
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exitCode = failed > 0 ? 1 : 0;
})().catch((error) => {
  console.error(`${colors.red}Test runner failed:${colors.reset}`, error.message);
  process.exitCode = 1;
});
