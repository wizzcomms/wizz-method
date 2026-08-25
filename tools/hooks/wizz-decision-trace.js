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

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Captura, na mesma linha do marcador, do `{` até o último `}` daquela
// linha. Suficiente porque o marcador é sempre um objeto JSON plano — `desc`
// usa array de arrays (`[...]`), nunca objetos aninhados — então o último
// `}` da linha é sempre o fechamento do próprio marcador.
const MARKER_LINE_RE = /🧭\s*(\{[\s\S]*\})\s*$/;

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

// Lê o transcript (JSONL, 1 mensagem por linha) e devolve o texto da ÚLTIMA
// mensagem de assistant encontrada. Linhas corrompidas são ignoradas
// (fail-open); se não houver nenhuma mensagem de assistant, devolve ''.
function readLastAssistantText(transcriptPath) {
  const raw = fs.readFileSync(transcriptPath, 'utf8');
  const lines = raw.split('\n');
  let lastText = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let entry;
    try {
      entry = JSON.parse(trimmed);
    } catch {
      continue; // linha corrompida — ignora, não derruba a leitura
    }
    if (entry && entry.type === 'assistant') {
      const text = extractAssistantText(entry);
      if (text) lastText = text;
    }
  }
  return lastText;
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

      const lastText = readLastAssistantText(transcriptPath);
      const decision = extractDecision(lastText);
      if (!decision) {
        process.exit(0); // nem todo pedido é roteado — ausência é normal
        return;
      }

      appendDecision({
        ts: new Date().toISOString(),
        type: 'decision',
        session: payload.session_id || null,
        decision,
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
    readLastAssistantText,
    extractDecision,
    appendDecision,
    runHook,
  };
}
