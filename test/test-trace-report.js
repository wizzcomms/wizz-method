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
// Reusa a implementação real (nunca reimplementa/hardcoda o catálogo aqui,
// `collectSkillCatalog`/`getRegistryFile` leem o skills-registry.yaml de
// verdade em runtime; os testes de --coverage abaixo derivam os ids a testar
// desse catálogo ao vivo, então continuam válidos mesmo com o registry em
// edição concorrente por outro agente).
const traceReportModule = require('../tools/installer/commands/trace-report.js');

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
  // decision + ladder lines written by tools/hooks/wizz-decision-trace.js —
  // aggregate() must IGNORE these (typed lines) so they don't pollute the
  // trivial/mode counts above; aggregateLadder() is the only consumer.
  '{"ts":"2026-01-01T10:05:00.000Z","type":"decision","session":"sess-1","decision":{"rota":"agent:designer"}}',
  '{"ts":"2026-01-01T10:05:00.000Z","type":"ladder","sessionId":"sess-1","execs":["wizz-exec-sonnet"],"rota":"agent:designer"}',
  '{"ts":"2026-01-01T10:06:00.000Z","type":"decision","session":"sess-2","decision":{"rota":"agent:copy"}}',
  '{"ts":"2026-01-01T10:06:00.000Z","type":"ladder","sessionId":"sess-2","execs":[],"rota":"agent:copy"}',
  '{"ts":"2026-01-01T10:07:00.000Z","type":"decision","session":"sess-3","decision":{"rota":"maestro"}}',
  '{"ts":"2026-01-01T10:07:00.000Z","type":"ladder","sessionId":"sess-3","execs":["wizz-exec-opus"],"rota":"maestro"}',
  '{"ts":"2026-01-01T10:08:00.000Z","type":"decision","session":"sess-4","decision":{"rota":"flat"}}',
  '{"ts":"2026-01-01T10:08:00.000Z","type":"ladder","sessionId":"sess-4","execs":[],"rota":"flat"}',
];

const TIMEOUT_MS = 15_000;

function runCommand(env, extraArgs = []) {
  const repoRoot = path.resolve(__dirname, '..');
  const cli = path.join(repoRoot, 'tools', 'installer', 'wizz-cli.js');
  try {
    const stdout = execFileSync(process.execPath, [cli, 'trace-report', ...extraArgs], {
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

// Escapa um id de skill (pode conter '-') para uso literal em RegExp.
function escapeRegExp(s) {
  return s.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

// Verdadeiro se `id` aparece como item de lista com marcador (2 espaços de
// indentação, gerados por `formatCoverageSummary`, ainda visíveis dentro do
// padding que `prompts.box` acrescenta): não como substring solta de outro
// texto. Ids de skill são curtos o bastante pra nunca serem quebrados pelo
// wrap de linha do box (ao contrário de paths longos, ver Case 1 acima).
function listsAsNeverConsidered(output, id) {
  return new RegExp(`  ${escapeRegExp(id)}(\\s|$)`, 'm').test(output);
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

    // --- Aderência à Escada de Modelos: 4 ladder lines in the fixture ---
    // sess-1 agent:designer (exec), sess-2 agent:copy (no exec) → both
    // bucket as "agent:*" (1/2 invoked); sess-3 maestro (exec); sess-4 flat
    // (no exec) → 2/4 invoked overall.
    assert(out.includes('Aderência à Escada de Modelos'), 'output includes the model-ladder adherence box title');
    assert(/Pedidos roteados com dado de escada:\s*4/.test(out), 'counts the 4 ladder-typed lines', out);
    assert(/Invocaram algum wizz-exec-\*:\s*2 \(50%\)/.test(out), 'counts 2/4 (50%) invoking a wizz-exec-*', out);
    assert(/agent:\*\s+1\/2 \(50%\)/.test(out), 'agent:* bucket: 1/2 (50%) invoked', out);
    assert(/maestro\s+1\/1 \(100%\)/.test(out), 'maestro bucket: 1/1 (100%) invoked', out);
    assert(/flat\s+0\/1 \(0%\)/.test(out), 'flat bucket: 0/1 (0%) invoked', out);

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

    // --- Case 3: --coverage, JSONL ausente (P2 da auditoria 360°) ---
    // O ramo --coverage é alcançado DEPOIS do early-return de "arquivo
    // ausente" (ver action() em trace-report.js), então o comportamento
    // deve ser idêntico ao Case 2: mensagem amigável, sem stack trace, exit
    // 0, e a caixa de cobertura não deve aparecer (o early-return acontece
    // antes de ler o catálogo).
    const coverageMissingResult = runCommand({ WIZZ_TRACE_FILE: missingFile }, ['--coverage']);
    assert(
      coverageMissingResult.spawnError === null,
      '--coverage exits 0 when trace file is missing',
      coverageMissingResult.spawnError ? coverageMissingResult.spawnError.message : '',
    );
    assert(
      /nenhum trace encontrado/i.test(coverageMissingResult.stdout) || /nenhum trace encontrado/i.test(coverageMissingResult.stderr),
      '--coverage missing-file case prints the same friendly message (no stack trace)',
    );
    assert(!/at\s+.*\.js:\d+:\d+/.test(coverageMissingResult.stdout), '--coverage missing-file case does not print a JS stack trace');
    assert(
      !coverageMissingResult.stdout.includes('Cobertura do Catálogo de Skills'),
      '--coverage missing-file case never reaches the coverage box',
    );

    // --- Case 4 & 5: --coverage against the real skills-registry.yaml catalog ---
    // Deriva o catálogo AO VIVO via a mesma função de produção (nunca
    // hardcoda ids/contagem aqui): assim os casos continuam válidos mesmo
    // com o registry em edição concorrente por outro agente (ver nota no
    // topo do arquivo).
    const catalogIds = traceReportModule._internal.collectSkillCatalog(traceReportModule._internal.getRegistryFile());
    assert(
      catalogIds.length >= 3,
      'live catalog has at least 3 skill ids to build the coverage fixtures',
      `catalog size: ${catalogIds.length}`,
    );

    if (catalogIds.length >= 3) {
      const [selectedId, discardedId, ...restIds] = catalogIds;
      const neverConsideredId = restIds[0];

      // Case 4: mix real de selecionada / descartada com motivo / nunca
      // considerada, mais 1 linha corrompida no meio (deve ser ignorada,
      // fail-open, mesmo espírito do Case 1).
      const coverageTmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wizz-trace-coverage-'));
      const coverageFixtureFile = path.join(coverageTmpDir, 'wizz-trace.jsonl');
      const decisionLine = JSON.stringify({
        ts: '2026-01-01T10:00:00.000Z',
        type: 'decision',
        session: 'sess-cov-1',
        decision: {
          rota: 'agent:designer',
          sel: [selectedId],
          desc: [[discardedId, 'motivo curto de teste']],
          gate: 'ok',
          repetiria: true,
        },
      });
      await fs.writeFile(coverageFixtureFile, [decisionLine, '{not valid json'].join('\n') + '\n', 'utf8');

      try {
        const coverageResult = runCommand({ WIZZ_TRACE_FILE: coverageFixtureFile }, ['--coverage']);
        assert(
          coverageResult.spawnError === null,
          '--coverage exits 0 against a fixture mixing selected/discarded/never-considered + 1 corrupted line',
          coverageResult.spawnError ? coverageResult.spawnError.message : '',
        );
        const covOut = coverageResult.stdout;

        assert(covOut.includes('Cobertura do Catálogo de Skills'), 'output includes the coverage box title');
        assert(
          new RegExp(`Catálogo:\\s*${catalogIds.length} skills`).test(covOut),
          'catalog total matches the live registry count',
          covOut,
        );
        assert(/Traces de decisão:\s*1/.test(covOut), 'counts exactly 1 decision line (corrupted line ignored, fail-open)', covOut);
        assert(/Selecionadas \(sel\):\s*1 /.test(covOut), 'counts 1 selected skill', covOut);
        assert(/Descartadas c\/ motivo:\s*1 /.test(covOut), 'counts 1 discarded-with-reason skill', covOut);
        assert(
          new RegExp(`Nunca consideradas:\\s*${catalogIds.length - 2} `).test(covOut),
          'never-considered count = catalog total minus the 2 mentioned skills',
          covOut,
        );
        assert(
          !listsAsNeverConsidered(covOut, selectedId),
          `selected skill "${selectedId}" does not appear in the never-considered list`,
          covOut,
        );
        assert(
          !listsAsNeverConsidered(covOut, discardedId),
          `discarded-with-reason skill "${discardedId}" does not appear in the never-considered list`,
          covOut,
        );
        assert(
          listsAsNeverConsidered(covOut, neverConsideredId),
          `a skill never mentioned in any trace ("${neverConsideredId}") is listed as never-considered`,
          covOut,
        );

        if (!coverageResult.spawnError && failed > 0) {
          console.log(`\n${colors.dim}--- case 4 (--coverage, mixed) output ---${colors.reset}`);
          console.log(covOut);
        }
      } finally {
        await fs.remove(coverageTmpDir).catch(() => {});
      }

      // Case 5: catálogo 100% coberto (sel cobre TODOS os ids do catálogo
      // ao vivo): "Nunca consideradas" deve vir vazia, cobertura 100%.
      const fullTmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wizz-trace-coverage-full-'));
      const fullFixtureFile = path.join(fullTmpDir, 'wizz-trace.jsonl');
      const fullDecisionLine = JSON.stringify({
        ts: '2026-01-01T10:00:00.000Z',
        type: 'decision',
        session: 'sess-cov-full',
        decision: { rota: 'maestro', sel: catalogIds, desc: [], gate: 'ok', repetiria: true },
      });
      await fs.writeFile(fullFixtureFile, fullDecisionLine + '\n', 'utf8');

      try {
        const fullResult = runCommand({ WIZZ_TRACE_FILE: fullFixtureFile }, ['--coverage']);
        assert(
          fullResult.spawnError === null,
          '--coverage exits 0 against a fixture covering the whole catalog',
          fullResult.spawnError ? fullResult.spawnError.message : '',
        );
        const fullOut = fullResult.stdout;
        assert(/Nunca consideradas:\s*0 \(0%\)/.test(fullOut), 'never-considered count is 0 when sel covers the whole catalog', fullOut);
        assert(/Cobertura do catálogo:\s*100%/.test(fullOut), 'coverage percentage is 100% when the whole catalog is mentioned', fullOut);
        assert(/catálogo 100% coberto/i.test(fullOut), 'output states the catalog is 100% covered instead of listing ids');

        if (!fullResult.spawnError && failed > 0) {
          console.log(`\n${colors.dim}--- case 5 (--coverage, full) output ---${colors.reset}`);
          console.log(fullOut);
        }
      } finally {
        await fs.remove(fullTmpDir).catch(() => {});
      }
    }

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
