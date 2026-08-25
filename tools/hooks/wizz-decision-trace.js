// wizz-decision-trace.js — Stop event hook (v1)
//
// Fonte de verdade: wizz-method/tools/hooks/. Instalar em ~/.claude/hooks via
// `npm run sync:global` (nunca editar a cópia global direto — ela é
// substituída pelo sync).
//
// Fecha a lacuna "o trace grava o que foi INJETADO, não o que foi OBEDECIDO":
// tools/hooks/wizz-router-enforce.js (UserPromptSubmit) já grava, opt-in via
// WIZZ_TRACE=1, qual contexto de roteamento foi injetado no prompt. Mas
// injetar não é obedecer — o agente pode ignorar a dica. Para medir a
// decisão de fato tomada, todo agente wizz emite, no fecho de um pedido
// roteado (ver src/modules/wizz/_shared/encerramento.md), 1 linha marcador:
//
//   🧭 {"rota":"agent:designer","sel":["canvas-design"],"desc":[["hyperframes","motivo"]],"gate":"ok","repetiria":true}
//
// Este hook roda no evento Stop (fim da resposta do assistant). Ele lê o
// transcript apontado por `transcript_path` no payload do hook, pega a
// ÚLTIMA mensagem do assistant, extrai a última ocorrência do marcador 🧭 e
// appenda uma linha `{"type":"decision",...}` no MESMO arquivo usado pelo
// enforce (~/.claude/wizz-trace.jsonl, honrando WIZZ_TRACE_FILE) — os dois
// hooks compartilham o mesmo JSONL, distinguível pelo campo `type`
// ("decision" aqui; as linhas do enforce não têm esse campo).
//
// Opt-in: só faz algo com WIZZ_TRACE=1 (mesma convenção do enforce); senão
// sai 0 sem tocar em disco nem ler o transcript. Nem todo pedido é roteado
// (marcador ausente é normal, não é erro) e o marcador é telemetria: falha
// em QUALQUER etapa (payload inválido, transcript ilegível, JSON do marcador
// quebrado) sai 0 em silêncio — este hook nunca pode bloquear ou derrubar a
// sessão.
//
// P1 da auditoria 360° (medir aderência à escada de modelos): no MESMO passe
// de leitura do transcript, quando há marcador de decisão no turno, também
// varre o turno atual em busca de invocação de subagente wizz-exec-*
// (Task/Agent com subagent_type contendo "wizz-exec") e appenda uma segunda
// linha `{"type":"ladder",...}` no mesmo JSONL — mesmas garantias de
// opt-in/fail-silent/custo-zero. Só medição, nenhum enforcement novo.

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Captura, na mesma linha do marcador, do `{` até o último `}` daquela
// linha. Suficiente porque o marcador é sempre um objeto JSON plano — `desc`
// usa array de arrays (`[...]`), nunca objetos aninhados — então o último
// `}` da linha é sempre o fechamento do próprio marcador.
const MARKER_LINE_RE = /🧭\s*(\{[\s\S]*\})\s*$/;

// Detecta invocação de subagente da escada de modelos: tool_use de
// Task/Agent cujo subagent_type (ou campo equivalente) contém "wizz-exec"
// (case-insensitive — cobre wizz-exec-haiku/sonnet/opus/review).
const EXEC_NAME_RE = /wizz-exec/i;

function isTraceEnabled() {
  return process.env.WIZZ_TRACE === '1';
}

function getTraceFile() {
  return process.env.WIZZ_TRACE_FILE || path.join(os.homedir(), '.claude', 'wizz-trace.jsonl');
}

// Concatena todos os blocos `type: "text"` do conteúdo de uma mensagem de
// assistant (o array `content` mistura text/tool_use/thinking/etc. — só nos
// interessa texto).
function extractAssistantText(entry) {
  const content = entry && entry.message && entry.message.content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((block) => block && block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n');
}

// Lê o transcript (JSONL, 1 mensagem por linha) e devolve o array de
// entradas já parseadas. Linhas corrompidas são ignoradas (fail-open). Passe
// único de leitura do disco — tanto o marcador de decisão quanto a detecção
// de execs da escada de modelos partem deste mesmo array em memória.
function readTranscriptEntries(transcriptPath) {
  const raw = fs.readFileSync(transcriptPath, 'utf8');
  const lines = raw.split('\n');
  const entries = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      entries.push(JSON.parse(trimmed));
    } catch {
      continue; // linha corrompida — ignora, não derruba a leitura
    }
  }
  return entries;
}

// Devolve o texto da ÚLTIMA mensagem de assistant entre as entradas dadas;
// '' se não houver nenhuma.
function lastAssistantText(entries) {
  let lastText = '';
  for (const entry of entries) {
    if (entry && entry.type === 'assistant') {
      const text = extractAssistantText(entry);
      if (text) lastText = text;
    }
  }
  return lastText;
}

// Varre só o TURNO ATUAL (entradas depois da última mensagem de `user`) em
// busca de tool_use de Task/Agent cujo subagent_type contenha "wizz-exec".
// Execs de turnos anteriores não contam — o objetivo é medir a escada de
// modelos usada NESTE pedido, não o histórico acumulado da sessão.
function extractExecInvocations(entries) {
  let lastUserIndex = -1;
  for (const [i, entry] of entries.entries()) {
    if (entry && entry.type === 'user') lastUserIndex = i;
  }
  const currentTurn = entries.slice(lastUserIndex + 1);

  const execs = [];
  for (const entry of currentTurn) {
    if (!entry || entry.type !== 'assistant') continue;
    const content = entry.message && entry.message.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (!block || block.type !== 'tool_use') continue;
      if (block.name !== 'Task' && block.name !== 'Agent') continue;
      const input = block.input || {};
      const candidate = input.subagent_type || input.subagentType || input.agent || block.name;
      if (typeof candidate === 'string' && EXEC_NAME_RE.test(candidate)) {
        execs.push(candidate);
      }
    }
  }
  return execs;
}

// Extrai a última ocorrência do marcador 🧭 {...} num texto e devolve o
// objeto já parseado, ou `null` se o marcador estiver ausente ou o JSON for
// inválido.
function extractDecision(text) {
  if (!text) return null;
  const lines = text.split('\n');
  let lastRaw = null;
  for (const line of lines) {
    const match = MARKER_LINE_RE.exec(line);
    if (match) lastRaw = match[1];
  }
  if (!lastRaw) return null;
  try {
    return JSON.parse(lastRaw);
  } catch {
    return null;
  }
}

// Appenda 1 linha JSON no trace file. Fail-silent — nunca lança.
function appendDecision(entry) {
  try {
    fs.appendFileSync(getTraceFile(), JSON.stringify(entry) + '\n');
  } catch {
    // trace nunca pode derrubar o hook
  }
}

function runHook() {
  let input = '';
  const stdinTimeout = setTimeout(() => process.exit(0), 3000);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => (input += chunk));
  process.stdin.on('end', () => {
    clearTimeout(stdinTimeout);
    try {
      // Custo zero quando desligado: nem chega a tocar no payload/transcript.
      if (!isTraceEnabled()) {
        process.exit(0);
        return;
      }

      const payload = JSON.parse(input);
      const transcriptPath = payload.transcript_path;
      if (!transcriptPath || !fs.existsSync(transcriptPath)) {
        process.exit(0);
        return;
      }

      const entries = readTranscriptEntries(transcriptPath);
      const lastText = lastAssistantText(entries);
      const decision = extractDecision(lastText);
      if (!decision) {
        process.exit(0); // nem todo pedido é roteado — ausência é normal
        return;
      }

      const ts = new Date().toISOString();
      const sessionId = payload.session_id || null;

      appendDecision({
        ts,
        type: 'decision',
        session: sessionId,
        decision,
      });

      // Mesmo turno, mesmo passe de leitura: registra a escada de modelos
      // (quais wizz-exec-* foram invocados neste pedido roteado, se algum).
      const execs = extractExecInvocations(entries);
      appendDecision({
        ts,
        type: 'ladder',
        sessionId,
        execs,
        rota: decision.rota || null,
      });

      process.exit(0);
    } catch {
      // Falha em silêncio em qualquer etapa — nunca bloqueia a sessão.
      process.exit(0);
    }
  });
}

if (require.main === module) {
  runHook();
} else {
  module.exports = {
    isTraceEnabled,
    getTraceFile,
    extractAssistantText,
    readTranscriptEntries,
    lastAssistantText,
    extractDecision,
    extractExecInvocations,
    appendDecision,
    runHook,
  };
}
