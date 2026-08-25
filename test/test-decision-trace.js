/**
 * Decision Trace Hook Test
 *
 * Regression coverage for tools/hooks/wizz-decision-trace.js (fonte de
 * verdade, sincronizado pra ~/.claude/hooks/ via `npm run sync:global`).
 *
 * Fecha a lacuna "o trace grava o que foi INJETADO, não o que foi OBEDECIDO":
 * tools/hooks/wizz-router-enforce.js (UserPromptSubmit) grava só o contexto
 * injetado no prompt. Este hook roda no evento Stop, lê o transcript
 * (transcript_path do payload), extrai a última ocorrência do marcador 🧭
 * emitido pelo agente no fecho (ver src/modules/wizz/_shared/
 * encerramento.md) e appenda a decisão real no mesmo wizz-trace.jsonl.
 *
 * Exercita o script real via subprocess (stdin JSON, como o Stop hook do
 * Claude Code faz) contra um transcript JSONL de fixture em os.tmpdir() —
 * mesmo espírito de test-rtk-hook.js: teste de fumaça de verdade, não uma
 * unidade mockada.
 *
 * Usage: node test/test-decision-trace.js
 */

const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const HOOK = path.join(__dirname, '..', 'tools', 'hooks', 'wizz-decision-trace.js');

const colors = {
  reset: '\u001B[0m',
  green: '\u001B[32m',
  red: '\u001B[31m',
  dim: '\u001B[2m',
};

let passed = 0;
let failed = 0;

function assert(condition, name, detail = '') {
  if (condition) {
    console.log(`  ${colors.green}✓${colors.reset} ${name}`);
    passed++;
  } else {
    console.log(`  ${colors.red}✗${colors.reset} ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

const VALID_MARKER = {
  rota: 'agent:designer',
  sel: ['canvas-design'],
  desc: [['hyperframes', 'carrossel é estático não vídeo']],
  gate: 'ok',
  repetiria: true,
};
const MARKER_LINE = `🧭 ${JSON.stringify(VALID_MARKER)}`;

function transcriptLine(entry) {
  return JSON.stringify(entry);
}

function userMessage(text) {
  return transcriptLine({
    type: 'user',
    message: { role: 'user', content: [{ type: 'text', text }] },
  });
}

function assistantMessage(text) {
  return transcriptLine({
    type: 'assistant',
    message: { role: 'assistant', content: [{ type: 'text', text }] },
  });
}

// Mensagem de assistant com um tool_use de Task/Agent — simula a invocação
// de um subagente wizz-exec-* pela escada de modelos.
function assistantToolUse(name, input) {
  return transcriptLine({
    type: 'assistant',
    message: { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_01', name, input }] },
  });
}

function writeTranscript(dir, lines) {
  const file = path.join(dir, `transcript-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`);
  fs.writeFileSync(file, lines.join('\n') + '\n', 'utf8');
  return file;
}

/**
 * Runs the hook with a given stdin payload and env overrides. Mirrors the
 * spawnSync pattern used by test-rtk-hook.js.
 */
function runHook(payload, envOverrides) {
  const input = JSON.stringify(payload);
  const env = { ...process.env, ...envOverrides };
  return spawnSync(process.execPath, [HOOK], { input, encoding: 'utf8', env, timeout: 10_000 });
}

function readTraceLines(traceFile) {
  if (!fs.existsSync(traceFile)) return [];
  return fs
    .readFileSync(traceFile, 'utf8')
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l));
}

async function main() {
  assert(fs.existsSync(HOOK), 'tools/hooks/wizz-decision-trace.js existe');

  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-decision-trace-test-'));

  try {
    console.log('test-decision-trace: marcador presente + WIZZ_TRACE=1 → appenda a decisão');
    {
      const transcript = writeTranscript(base, [
        userMessage('cria um carrossel pro produto novo'),
        assistantMessage(`✅ O que fiz\nMontei o carrossel.\n\n${MARKER_LINE}`),
      ]);
      const traceFile = path.join(base, `trace-ok-${Date.now()}.jsonl`);
      const res = runHook({ transcript_path: transcript, session_id: 'sess-abc' }, { WIZZ_TRACE: '1', WIZZ_TRACE_FILE: traceFile });
      assert(res.status === 0, 'hook sai com exit 0', `stderr: ${res.stderr}`);
      const lines = readTraceLines(traceFile);
      assert(lines.length === 2, 'appenda 2 linhas (decision + ladder)', JSON.stringify(lines));
      if (lines.length === 2) {
        const entry = lines[0];
        assert(entry.type === 'decision', 'campo type é "decision"');
        assert(entry.session === 'sess-abc', 'campo session vem do payload do hook');
        assert(typeof entry.ts === 'string' && entry.ts.length > 0, 'campo ts está presente');
        assert(
          JSON.stringify(entry.decision) === JSON.stringify(VALID_MARKER),
          'objeto decision bate com o marcador emitido',
          JSON.stringify(entry.decision),
        );

        const ladder = lines[1];
        assert(ladder.type === 'ladder', 'segunda linha tem type "ladder"');
        assert(ladder.sessionId === 'sess-abc', 'campo sessionId da linha ladder vem do payload do hook');
        assert(Array.isArray(ladder.execs) && ladder.execs.length === 0, 'sem tool_use de exec no turno → execs vazio');
        assert(ladder.rota === VALID_MARKER.rota, 'campo rota da linha ladder vem do marcador de decisão');
      }
    }

    console.log('test-decision-trace: última ocorrência do marcador vence (não a primeira)');
    {
      const firstMarker = { ...VALID_MARKER, rota: 'agent:copy', repetiria: false };
      const secondMarker = { ...VALID_MARKER, rota: 'agent:seo' };
      const transcript = writeTranscript(base, [
        userMessage('pedido 1'),
        assistantMessage(`resposta 1\n🧭 ${JSON.stringify(firstMarker)}`),
        userMessage('pedido 2, refaz'),
        assistantMessage(`resposta 2\n🧭 ${JSON.stringify(secondMarker)}`),
      ]);
      const traceFile = path.join(base, `trace-last-${Date.now()}.jsonl`);
      const res = runHook({ transcript_path: transcript }, { WIZZ_TRACE: '1', WIZZ_TRACE_FILE: traceFile });
      assert(res.status === 0, 'hook sai com exit 0', `stderr: ${res.stderr}`);
      const lines = readTraceLines(traceFile);
      assert(
        lines.length === 2 && lines[0].decision && lines[0].decision.rota === 'agent:seo',
        'usa o marcador da ÚLTIMA mensagem de assistant, não o primeiro',
      );
      assert(
        lines[1] && lines[1].type === 'ladder' && lines[1].rota === 'agent:seo',
        'linha ladder também usa o marcador da última mensagem',
      );
    }

    console.log('test-decision-trace: escada de modelos — exec detectado no turno atual');
    {
      const transcript = writeTranscript(base, [
        userMessage('cria uma campanha de ads'),
        assistantToolUse('Task', { subagent_type: 'wizz-exec-sonnet', description: 'gera variações de anúncio' }),
        assistantMessage(`✅ Campanha pronta.\n\n${MARKER_LINE}`),
      ]);
      const traceFile = path.join(base, `trace-exec-${Date.now()}.jsonl`);
      const res = runHook({ transcript_path: transcript, session_id: 'sess-exec' }, { WIZZ_TRACE: '1', WIZZ_TRACE_FILE: traceFile });
      assert(res.status === 0, 'hook sai com exit 0', `stderr: ${res.stderr}`);
      const lines = readTraceLines(traceFile);
      assert(lines.length === 2, 'appenda decision + ladder', JSON.stringify(lines));
      const ladder = lines[1];
      assert(ladder && ladder.type === 'ladder', 'segunda linha é ladder');
      assert(
        Array.isArray(ladder.execs) && ladder.execs.length === 1 && ladder.execs[0] === 'wizz-exec-sonnet',
        'execs contém o wizz-exec-sonnet invocado no turno atual',
        JSON.stringify(ladder && ladder.execs),
      );
    }

    console.log('test-decision-trace: escada de modelos — sem invocação de exec no turno');
    {
      const transcript = writeTranscript(base, [
        userMessage('responde uma dúvida rápida'),
        assistantMessage(`✅ Respondido direto, sem delegar.\n\n${MARKER_LINE}`),
      ]);
      const traceFile = path.join(base, `trace-noexec-${Date.now()}.jsonl`);
      const res = runHook({ transcript_path: transcript, session_id: 'sess-noexec' }, { WIZZ_TRACE: '1', WIZZ_TRACE_FILE: traceFile });
      assert(res.status === 0, 'hook sai com exit 0', `stderr: ${res.stderr}`);
      const lines = readTraceLines(traceFile);
      assert(lines.length === 2, 'appenda decision + ladder', JSON.stringify(lines));
      const ladder = lines[1];
      assert(
        ladder && Array.isArray(ladder.execs) && ladder.execs.length === 0,
        'execs vazio quando nenhum wizz-exec-* foi invocado no turno',
        JSON.stringify(ladder && ladder.execs),
      );
    }

    console.log('test-decision-trace: escada de modelos — exec de turno anterior é excluído');
    {
      const transcript = writeTranscript(base, [
        userMessage('pedido 1: cria posts pro instagram'),
        assistantToolUse('Task', { subagent_type: 'wizz-exec-haiku', description: 'gera legendas' }),
        assistantMessage('✅ Posts prontos (pedido 1, sem marcador de decisão).'),
        userMessage('pedido 2: só uma pergunta rápida, não precisa delegar nada'),
        assistantMessage(`✅ Respondido direto.\n\n${MARKER_LINE}`),
      ]);
      const traceFile = path.join(base, `trace-prevturn-${Date.now()}.jsonl`);
      const res = runHook({ transcript_path: transcript, session_id: 'sess-prevturn' }, { WIZZ_TRACE: '1', WIZZ_TRACE_FILE: traceFile });
      assert(res.status === 0, 'hook sai com exit 0', `stderr: ${res.stderr}`);
      const lines = readTraceLines(traceFile);
      assert(lines.length === 2, 'appenda decision + ladder', JSON.stringify(lines));
      const ladder = lines[1];
      assert(
        ladder && Array.isArray(ladder.execs) && ladder.execs.length === 0,
        'exec invocado no pedido 1 (turno anterior) NÃO conta pro ladder do pedido 2',
        JSON.stringify(ladder && ladder.execs),
      );
    }

    console.log('test-decision-trace: marcador ausente → nada appendado, exit 0');
    {
      const transcript = writeTranscript(base, [userMessage('oi, tudo bem?'), assistantMessage('Tudo bem! Como posso ajudar hoje?')]);
      const traceFile = path.join(base, `trace-noop-${Date.now()}.jsonl`);
      const res = runHook({ transcript_path: transcript }, { WIZZ_TRACE: '1', WIZZ_TRACE_FILE: traceFile });
      assert(res.status === 0, 'hook sai com exit 0 sem marcador', `stderr: ${res.stderr}`);
      assert(!fs.existsSync(traceFile), 'nenhum arquivo de trace é criado quando o marcador está ausente');
    }

    console.log('test-decision-trace: JSON inválido no marcador → nada appendado, exit 0');
    {
      const transcript = writeTranscript(base, [
        userMessage('pedido qualquer'),
        assistantMessage('✅ feito\n🧭 {"rota":"agent:designer", isso não é json valido}'),
      ]);
      const traceFile = path.join(base, `trace-badjson-${Date.now()}.jsonl`);
      const res = runHook({ transcript_path: transcript }, { WIZZ_TRACE: '1', WIZZ_TRACE_FILE: traceFile });
      assert(res.status === 0, 'hook sai com exit 0 com marcador corrompido', `stderr: ${res.stderr}`);
      assert(!fs.existsSync(traceFile), 'nenhum arquivo de trace é criado quando o JSON do marcador é inválido');
    }

    console.log('test-decision-trace: WIZZ_TRACE desligado → nada appendado, exit 0 (mesmo com marcador válido)');
    {
      const transcript = writeTranscript(base, [userMessage('pedido qualquer'), assistantMessage(`✅ feito\n${MARKER_LINE}`)]);
      const traceFile = path.join(base, `trace-off-${Date.now()}.jsonl`);
      const env = { ...process.env, WIZZ_TRACE_FILE: traceFile };
      delete env.WIZZ_TRACE;
      const res = spawnSync(process.execPath, [HOOK], {
        input: JSON.stringify({ transcript_path: transcript }),
        encoding: 'utf8',
        env,
        timeout: 10_000,
      });
      assert(res.status === 0, 'hook sai com exit 0 com trace desligado', `stderr: ${res.stderr}`);
      assert(!fs.existsSync(traceFile), 'nenhum arquivo de trace é tocado quando WIZZ_TRACE está desligado');
    }

    console.log('test-decision-trace: transcript_path ausente/inexistente → fail-silent, exit 0');
    {
      const traceFile = path.join(base, `trace-missing-${Date.now()}.jsonl`);
      const resMissingField = runHook({ session_id: 'x' }, { WIZZ_TRACE: '1', WIZZ_TRACE_FILE: traceFile });
      assert(resMissingField.status === 0, 'exit 0 quando payload não tem transcript_path', `stderr: ${resMissingField.stderr}`);

      const resMissingFile = runHook(
        { transcript_path: path.join(base, 'nao-existe.jsonl') },
        { WIZZ_TRACE: '1', WIZZ_TRACE_FILE: traceFile },
      );
      assert(
        resMissingFile.status === 0,
        'exit 0 quando transcript_path aponta pra arquivo inexistente',
        `stderr: ${resMissingFile.stderr}`,
      );
      assert(!fs.existsSync(traceFile), 'nenhum arquivo de trace é criado');
    }

    console.log('test-decision-trace: payload de stdin inválido → fail-silent, exit 0');
    {
      const traceFile = path.join(base, `trace-badstdin-${Date.now()}.jsonl`);
      const res = spawnSync(process.execPath, [HOOK], {
        input: '{not valid json',
        encoding: 'utf8',
        env: { ...process.env, WIZZ_TRACE: '1', WIZZ_TRACE_FILE: traceFile },
        timeout: 10_000,
      });
      assert(res.status === 0, 'exit 0 com stdin JSON malformado', `stderr: ${res.stderr}`);
      assert(!fs.existsSync(traceFile), 'nenhum arquivo de trace é criado');
    }
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }

  console.log(`\n${failed === 0 ? 'test-decision-trace: OK' : `test-decision-trace: ${failed} falha(s)`}`);
  console.log(`Passed: ${colors.green}${passed}${colors.reset}, Failed: ${colors.red}${failed}${colors.reset}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
