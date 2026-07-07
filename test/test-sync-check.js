/**
 * sync:check Tests
 *
 * Regression coverage for tools/sync-check.mjs (auditoria 2026-07-07, M10:
 * "um check leve que compara hashes repo vs global e avisa" — sync repo →
 * ~/.claude era manual e esquecível). O script é ESM (irmão de
 * tools/sync-global.mjs), então este teste roda ele como subprocess via
 * `--claude-dir` (destino injetável, sem tocar em ~/.claude de verdade) e
 * inspeciona stdout/exit code — mesmo padrão de test/test-rtk-hook.js pra
 * scripts que rodam via CLI.
 *
 * Cobre os 3 cenários pedidos:
 *   1. arquivo divergente (hook e skill) é detectado e reportado como DRIFT.
 *   2. árvore em sync (conteúdo idêntico) reporta ok, sem falso positivo.
 *   3. destino inexistente (pasta ~/.claude fake que nem existe) é reportado
 *      como "não instalado", sem lançar exceção nem sair com erro.
 *
 * sync:check é fail-open por design (lembrete, não gate): todo cenário
 * abaixo espera exit code 0, mesmo com drift.
 *
 * Usage: node test/test-sync-check.js
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, '..', 'tools', 'sync-check.mjs');
const REPO_ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

// fs.cpSync ainda é experimental na faixa de Node deste repo (>=20.12.0,
// só estabiliza em 22.3.0) — cópia recursiva manual em vez dele.
function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(from, to);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
    }
  }
}

function assert(condition, name, detail = '') {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

/** Roda `node tools/sync-check.mjs --claude-dir <dir>` e devolve { status, stdout }. */
function runSyncCheck(claudeDir) {
  try {
    const stdout = execFileSync('node', [SCRIPT, '--claude-dir', claudeDir], { encoding: 'utf8' });
    return { status: 0, stdout };
  } catch (error) {
    // sync:check é fail-open — se cair aqui, é um bug (nunca deveria sair !=0).
    return { status: error.status ?? 1, stdout: `${error.stdout || ''}${error.stderr || ''}` };
  }
}

console.log('test-sync-check: arquivo divergente detectado (hook e skill)');
{
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-sync-check-drift-'));
  const claudeDir = path.join(tmpBase, '.claude');
  fs.mkdirSync(path.join(claudeDir, 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(claudeDir, 'skills'), { recursive: true });

  // Hook divergente de propósito: copia o conteúdo real e adultera 1 byte.
  const hookSrc = path.join(REPO_ROOT, 'tools', 'hooks', 'wizz-router-enforce.js');
  const hookContent = fs.readFileSync(hookSrc, 'utf8');
  fs.writeFileSync(path.join(claudeDir, 'hooks', 'wizz-router-enforce.js'), `${hookContent}\n// drift proposital do teste\n`);

  // Skill divergente de propósito: copia a árvore real e adultera o SKILL.md.
  const skillSrc = path.join(REPO_ROOT, 'src', 'skills-lib', 'cloud-and-infra');
  const skillDest = path.join(claudeDir, 'skills', 'cloud-and-infra');
  copyDirRecursive(skillSrc, skillDest);
  fs.appendFileSync(path.join(skillDest, 'SKILL.md'), '\n<!-- drift proposital do teste -->\n');

  const { status, stdout } = runSyncCheck(claudeDir);
  assert(status === 0, 'exit code 0 mesmo com drift (fail-open)', stdout);
  assert(/DRIFT/.test(stdout) && /wizz-router-enforce\.js/.test(stdout), 'hook divergente aparece como DRIFT', stdout);
  assert(/DRIFT/.test(stdout) && /cloud-and-infra/.test(stdout), 'skill divergente aparece como DRIFT', stdout);

  fs.rmSync(tmpBase, { recursive: true, force: true });
}

console.log('\ntest-sync-check: árvore em sync reporta ok (sem falso positivo)');
{
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-sync-check-ok-'));
  const claudeDir = path.join(tmpBase, '.claude');
  fs.mkdirSync(path.join(claudeDir, 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(claudeDir, 'skills'), { recursive: true });

  // Cópia idêntica (byte a byte) de 1 hook e 1 skill pequenos.
  const hookSrc = path.join(REPO_ROOT, 'tools', 'hooks', 'session-rules.js');
  fs.copyFileSync(hookSrc, path.join(claudeDir, 'hooks', 'session-rules.js'));

  const skillSrc = path.join(REPO_ROOT, 'src', 'skills-lib', 'caching-and-queues');
  copyDirRecursive(skillSrc, path.join(claudeDir, 'skills', 'caching-and-queues'));

  const { status, stdout } = runSyncCheck(claudeDir);
  assert(status === 0, 'exit code 0 quando tudo está em sync', stdout);
  assert(!/DRIFT/.test(stdout), 'nenhum DRIFT reportado para árvore idêntica', stdout);
  assert(
    /session-rules\.js/.test(stdout) === false || !/DRIFT\s+hook session-rules\.js/.test(stdout),
    'hook idêntico não é reportado como drift',
    stdout,
  );
  assert(/0 com drift/.test(stdout), 'contagem final indica 0 drift', stdout);

  fs.rmSync(tmpBase, { recursive: true, force: true });
}

console.log('\ntest-sync-check: destino inexistente reportado como "não instalado", sem crash');
{
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-sync-check-missing-'));
  // Não cria o diretório — simula ~/.claude que nunca foi instalado.
  const claudeDir = path.join(tmpBase, 'nunca-existiu', '.claude');

  const { status, stdout } = runSyncCheck(claudeDir);
  assert(status === 0, 'exit code 0 mesmo com destino inteiramente ausente (sem crash)', stdout);
  assert(!/Error|ENOENT|Traceback/i.test(stdout), 'sem stack trace / exceção no output', stdout);
  assert(/não instalado/.test(stdout), 'reporta entradas como "não instalado"', stdout);
  assert(!/DRIFT/.test(stdout), 'nada é reportado como drift quando o destino nem existe', stdout);

  fs.rmSync(tmpBase, { recursive: true, force: true });
}

console.log(`\n${failed === 0 ? 'test-sync-check: OK' : `test-sync-check: ${failed} falha(s)`}`);
console.log(`Passed: ${passed}, Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
