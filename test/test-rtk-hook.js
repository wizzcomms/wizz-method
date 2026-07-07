/**
 * RTK Hook Smoke Test
 *
 * Regression coverage for tools/hooks/rtk-rewrite.sh (fonte de verdade,
 * sincronizado pra ~/.claude/hooks/ via `npm run sync:global`).
 *
 * Auditoria 2026-07-07 (C4/RT1) achou um bug reproduzível no binário `rtk`
 * (0.30.1): em comando multi-linha, `rtk rewrite` só reescreve a 1ª linha;
 * as demais passam cruas, sem aviso. O hook foi corrigido pra reescrever
 * linha a linha em vez de delegar o CMD inteiro de uma vez. Este é um teste
 * de fumaça de verdade: exercita o script real via subprocess (stdin JSON,
 * como o PreToolUse hook do Claude Code faz), não uma unidade mockada — é
 * exatamente o "roda a cada release, pega drift de comportamento" pedido
 * pela correção C4.4.
 *
 * Fail-open consistente com o resto do framework: se `rtk` ou `jq` não
 * estiverem no PATH desta máquina/CI, os testes são pulados (não falham) —
 * o próprio hook se comporta assim em produção (ver rtk-rewrite.sh).
 *
 * Usage: node test/test-rtk-hook.js
 */

const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const HOOK = path.join(__dirname, '..', 'tools', 'hooks', 'rtk-rewrite.sh');

let passed = 0;
let failed = 0;
let skipped = 0;

function assert(condition, name, detail = '') {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function hasCommand(cmd) {
  const res = spawnSync('sh', ['-c', `command -v ${cmd}`]);
  return res.status === 0;
}

/**
 * Runs the hook with a given `tool_input.command`, optionally overriding
 * PATH/env (used to stub a fake `rtk` binary for the timeout test).
 */
function runHook(command, { env = process.env, timeoutMs = 10_000 } = {}) {
  const input = JSON.stringify({ tool_input: { command } });
  const res = spawnSync(HOOK, [], { input, encoding: 'utf8', env, timeout: timeoutMs });
  return res;
}

function parseHookOutput(res) {
  const stdout = (res.stdout || '').trim();
  if (!stdout) return null; // hook exited without rewriting (no change / fail-open)
  return JSON.parse(stdout);
}

async function main() {
  assert(fs.existsSync(HOOK), 'tools/hooks/rtk-rewrite.sh existe');
  const stat = fs.statSync(HOOK);
  assert((stat.mode & 0o111) !== 0, 'tools/hooks/rtk-rewrite.sh é executável (+x)');

  if (!hasCommand('jq') || !hasCommand('rtk')) {
    console.log('\ntest-rtk-hook: jq/rtk ausentes nesta máquina — pulando os testes de comportamento (fail-open, mesmo critério do hook).');
    skipped++;
  } else {
    console.log('test-rtk-hook: rewrite básico (single-line)');
    {
      const res = runHook('git status');
      assert(res.status === 0, 'hook sai com exit 0', `stderr: ${res.stderr}`);
      const out = parseHookOutput(res);
      if (out) {
        assert(
          out.hookSpecificOutput?.updatedInput?.command?.startsWith('rtk '),
          'comando reescrito começa com "rtk "',
          JSON.stringify(out),
        );
        assert(out.hookSpecificOutput.permissionDecision === 'allow', 'permissionDecision é "allow"');
      } else {
        // rtk local pode não ter regra de rewrite pra "git status" numa
        // versão futura; não é o que este teste regride. Registra e segue.
        console.log('    (sem rewrite pra "git status" nesta versão de rtk — não é o alvo deste teste)');
      }
    }

    console.log('test-rtk-hook: regressão do bug multi-linha (C4/RT1)');
    {
      const multiline = 'git status\ngit diff\ngit log';
      const res = runHook(multiline);
      assert(res.status === 0, 'hook sai com exit 0 em comando multi-linha', `stderr: ${res.stderr}`);
      const out = parseHookOutput(res);
      assert(out !== null, 'hook produz rewrite pra comando multi-linha (rtk conhece "git")');
      if (out) {
        const rewritten = out.hookSpecificOutput.updatedInput.command;
        const lines = rewritten.split('\n');
        assert(lines.length === 3, 'preserva as 3 linhas originais', rewritten);
        for (const [i, line] of lines.entries()) {
          assert(line.startsWith('rtk '), `linha ${i + 1} foi reescrita ("${line}")`, rewritten);
        }
      }
    }

    console.log('test-rtk-hook: guard multi-linha (heredoc/continuação/string aberta passam intactos)');
    {
      // Corpo de heredoc que parece comando NÃO pode ser reescrito
      // (corromperia os dados do heredoc: `git status` viraria `rtk git status`).
      const unsafeCases = [
        ['heredoc', 'cat <<EOF\ngit status\nEOF'],
        ['continuação com \\', 'git log \\\ngit status'],
        ['string multi-linha', 'echo "abre aqui\ngit status"'],
      ];
      for (const [name, cmd] of unsafeCases) {
        const res = runHook(cmd);
        assert(res.status === 0, `${name}: hook sai com exit 0`, `stderr: ${res.stderr}`);
        assert((res.stdout || '').trim() === '', `${name}: passa intacto (sem rewrite parcial)`);
      }
    }

    console.log('test-rtk-hook: sem mudança (comando sem regra de rewrite)');
    {
      const res = runHook('echo hi-from-test-rtk-hook');
      assert(res.status === 0, 'hook sai com exit 0');
      assert((res.stdout || '').trim() === '', 'stdout vazio quando não há rewrite (tool roda o comando original)');
    }
  }

  console.log('test-rtk-hook: timeout interno (rtk travado não trava o prompt)');
  {
    const fakeBinDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'rtk-hook-fake-bin-'));
    try {
      const fakeRtk = path.join(fakeBinDir, 'rtk');
      fs.writeFileSync(
        fakeRtk,
        '#!/bin/bash\n' +
          'if [ "$1" = "--version" ]; then echo "rtk 0.43.0"; exit 0; fi\n' +
          'if [ "$1" = "rewrite" ]; then sleep 5; echo "rtk $2"; exit 0; fi\n',
      );
      fs.chmodSync(fakeRtk, 0o755);
      // jq real ainda é necessário (o fake só substitui rtk); se ausente,
      // pula (mesmo critério de fail-open dos blocos acima).
      if (hasCommand('jq')) {
        const env = { ...process.env, PATH: `${fakeBinDir}:${process.env.PATH}`, RTK_HOOK_TIMEOUT: '1' };
        const start = Date.now();
        const res = runHook('git status', { env, timeoutMs: 4000 });
        const elapsedMs = Date.now() - start;
        assert(res.status === 0, 'hook sai com exit 0 mesmo com rtk travado', `stderr: ${res.stderr}`);
        assert(elapsedMs < 3000, `hook retorna bem antes do rtk travado (5s) — levou ${elapsedMs}ms com RTK_HOOK_TIMEOUT=1`);
        assert((res.stdout || '').trim() === '', 'fail-open: sem rewrite (comando original passa sem alteração), não o texto travado');
      } else {
        console.log('  (jq ausente — pulando teste de timeout)');
        skipped++;
      }
    } finally {
      fs.rmSync(fakeBinDir, { recursive: true, force: true });
    }
  }

  console.log(
    `\n${failed === 0 ? 'test-rtk-hook: OK' : `test-rtk-hook: ${failed} falha(s)`}${skipped > 0 ? ` (${skipped} bloco(s) pulado(s))` : ''}`,
  );
  console.log(`Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
