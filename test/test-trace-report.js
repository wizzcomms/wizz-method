/**
 * Trace Report Test
 *
 * End-to-end smoke test for `tools/installer/commands/trace-report.js` via
 * the real `wizz-cli.js trace-report` entry point (Tarefa 3.8-E2 da
 * auditoria 360°). Follows the same spirit as `test-install-smoke.js`:
 * spawn the real CLI via `execFileSync` against a throwaway fixture file
 * instead of mocking the aggregation logic, so a regression in the
 * auto-discovery wiring (commands/*.js loaded by wizz-cli.js) or in the
 * `WIZZ_TRACE_FILE` env var contract would be caught here too.
 *
 * Fixture mixes: trivial lines, routed lines in both `mode: 'wizz'` and
 * `mode: 'flat'`, one line with non-empty `warnings`, and one corrupted
 * (non-JSON) line that must be skipped (fail-open) without crashing the
 * command or breaking the other counts.
 *
 * Usage: node test/test-trace-report.js
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

const FIXTURE_LINES = [
  // trivial
  '{"ts":"2026-01-01T10:00:00.000Z","isTrivial":true,"mode":null}',
  '{"ts":"2026-01-01T10:01:00.000Z","isTrivial":true,"mode":null}',
  // routed, mode wizz
  '{"ts":"2026-01-01T10:02:00.000Z","isTrivial":false,"mode":"wizz","contextInjected":"ctx","warnings":[]}',
  // routed, mode flat, with warnings (non-empty)
  '{"ts":"2026-01-01T10:03:00.000Z","isTrivial":false,"mode":"flat","contextInjected":"ctx","warnings":["routing-table-flat.md ausente"]}',
  // routed, mode flat, no warnings
  '{"ts":"2026-01-01T10:04:00.000Z","isTrivial":false,"mode":"flat","contextInjected":"ctx","warnings":[]}',
  // corrupted line (must be skipped, fail-open)
  '{not valid json',
];

const TIMEOUT_MS = 15_000;

function runCommand(env) {
  const repoRoot = path.resolve(__dirname, '..');
  const cli = path.join(repoRoot, 'tools', 'installer', 'wizz-cli.js');
  try {
    const stdout = execFileSync(process.execPath, [cli, 'trace-report'], {
      cwd: repoRoot,
      encoding: 'utf8',
      timeout: TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });
    return { stdout, stderr: '', exitCode: 0, spawnError: null };
  } catch (error) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: typeof error.status === 'number' ? error.status : null,
      spawnError: error,
    };
  }
}

async function main() {
  let fixtureFile;
  let missingFile;

  try {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wizz-trace-report-'));
    fixtureFile = path.join(tmpDir, 'wizz-trace.jsonl');
    missingFile = path.join(tmpDir, 'does-not-exist.jsonl');

    await fs.writeFile(fixtureFile, FIXTURE_LINES.join('\n') + '\n', 'utf8');

    // --- Case 1: fixture with mixed trivial/routed/modes/corrupted lines ---
    const result = runCommand({ WIZZ_TRACE_FILE: fixtureFile });

    assert(result.spawnError === null, 'trace-report exits 0 against fixture', result.spawnError ? result.spawnError.message : '');

    const out = result.stdout;
    // The box wraps long paths across lines, so assert on the basename
    // (short enough to survive wrapping) rather than the full path.
    assert(out.includes(path.basename(fixtureFile)), 'output references the fixture trace file name');
    // "Total" counts successfully parsed entries only (5) — the 1 corrupted
    // line is reported separately under "ignoradas (corrompidas)" below,
    // matching the spec's split between "total" and "linhas corrompidas
    // ignoradas (fail-open)" as distinct aggregations.
    assert(/Total de linhas:\s*5/.test(out), 'total counts the 5 successfully parsed entries (corrupted line excluded)', out);
    assert(/Triviais:\s*2/.test(out), 'counts 2 trivial lines', out);
    assert(/Roteados:\s*3/.test(out), 'counts 3 routed (non-trivial) lines', out);
    assert(/modo wizz:\s*1/.test(out), 'counts 1 line with mode wizz', out);
    assert(/modo flat:\s*2/.test(out), 'counts 2 lines with mode flat', out);
    assert(/modo nulo:\s*0/.test(out), 'counts 0 routed lines with null mode', out);
    assert(/Com warnings:\s*1/.test(out), 'counts 1 routed line with non-empty warnings', out);
    assert(/ignoradas \(corrompidas\):\s*1/.test(out), 'counts 1 corrupted line as ignored (fail-open)', out);
    assert(out.includes('2026-01-01T10:00:00.000Z'), 'period start reflects earliest ts');
    assert(out.includes('2026-01-01T10:04:00.000Z'), 'period end reflects latest ts');

    // --- Case 2: missing trace file ---
    const missingResult = runCommand({ WIZZ_TRACE_FILE: missingFile });
    assert(
      missingResult.spawnError === null,
      'trace-report exits 0 when trace file is missing',
      missingResult.spawnError ? missingResult.spawnError.message : '',
    );
    assert(
      /nenhum trace encontrado/i.test(missingResult.stdout) || /nenhum trace encontrado/i.test(missingResult.stderr),
      'missing-file case prints a friendly message (no stack trace)',
    );
    assert(!/at\s+.*\.js:\d+:\d+/.test(missingResult.stdout), 'missing-file case does not print a JS stack trace');

    if (result.spawnError || missingResult.spawnError || failed > 0) {
      console.log(`\n${colors.dim}--- case 1 output ---${colors.reset}`);
      console.log(out);
      console.log(`\n${colors.dim}--- case 2 output ---${colors.reset}`);
      console.log(missingResult.stdout + missingResult.stderr);
    }
  } catch (error) {
    console.log(`${colors.red}Test setup failed: ${error.message}${colors.reset}`);
    console.log(error.stack);
    failed++;
  } finally {
    if (fixtureFile) await fs.remove(path.dirname(fixtureFile)).catch(() => {});
  }

  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${failed}${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  if (failed === 0) {
    console.log(`${colors.green}All trace-report tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}Some trace-report tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

main();
