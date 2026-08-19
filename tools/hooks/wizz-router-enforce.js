// wizz-router-enforce.js — UserPromptSubmit hook (v2)
//
// Fonte de verdade: wizz-method/tools/hooks/. Instalar em ~/.claude/hooks via
// `npm run sync:global` (nunca editar a cópia global direto — ela é substituída).
//
// v2 (2026-07): detecta projeto Wizz (_wizz/ no cwd ou ancestrais) e injeta uma
// dica CURTA de delegação direta (maestro/agente da área) em vez do mandato
// completo do router. Fora de projeto Wizz mantém o router, também em versão
// curta. Injeção caiu de ~250 para ~50-70 tokens por prompt.
//
// Advisory-only: nunca bloqueia o prompt; falha em silêncio.
//
// Observabilidade (opt-in, custo zero quando desligado):
// - WIZZ_TRACE=1 grava uma linha JSON por decisão em ~/.claude/wizz-trace.jsonl
//   (override: WIZZ_TRACE_FILE). Trace é sempre fail-silent — nunca derruba o hook.
// - Fallback de roteamento (tabela flat ausente no global, install de projeto
//   Wizz incompleto) emite 1 warning em stderr, independente do trace estar
//   ligado. Custo: 1 fs.existsSync por prompt não-trivial.

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const TRIVIAL_PATTERNS = [
  // Já é slash command / invocação explícita de skill — já roteado
  /^\s*\//,
  // Conversa pura / saudações / reação sem pedido
  /^(oi|olá|ola|hey|hi|hello|tudo bem|bom dia|boa tarde|boa noite|obrigad[oa]|valeu|vlw|ok|okay|certo|perfeito|show|massa|legal)\b/i,
  // Typo / rename / ajuste inline pequeno
  /\btypo\b/i,
  /\bcorrige?\s+(esse|este|o|a)?\s*typo\b/i,
  /\brename\s+(a\s+)?(vari[aá]vel|fun[cç][aã]o|arquivo|classe|m[eé]todo)\b/i,
  /\brenomei[ao]\s+(a\s+)?(vari[aá]vel|fun[cç][aã]o|arquivo|classe|m[eé]todo)\b/i,
  // Rename no formato "rebatiza/renomeia X para Y" (objeto é nome próprio, não termo técnico)
  /\b(rename|renomeia|renomear|renomeou|rebatiza|rebatizar|rebatizou)\b.*\bpara\b/i,
  // Edição pontual apontando linha específica ("troca X por Y na linha 42")
  /\bna linha \d+\b/i,
  // Resposta a pergunta do próprio router — evita re-injetar no follow-up
  /^(sim|n[aã]o|todas|nenhuma|cancela|dispara?\s+(todas|ambas|essas|todas\s+as\s+skills))/i,
  // Perguntas puras de status / o que foi feito
  /^(o que foi feito|qual o status|me conta|como (t[aá]|est[aá]|ficou|ficaram)|me mostra|explica)/i,
  // Pergunta de 1 palavra só ("link?", "cadê?") — informacional, sem pedido de trabalho
  /^\S+\?$/,
  // Frase de suporte/estado pessoal ("esqueci a senha") — informacional, não é tarefa
  /^esqueci\b/i,
];

function isTrivial(prompt) {
  const trimmed = String(prompt || '').trim();
  if (!trimmed) return true;

  // Slash command — já roteado explicitamente
  if (trimmed.startsWith('/')) return true;

  for (const pattern of TRIVIAL_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  // Sem heurística de tamanho: um prompt curto e ambíguo (ex.: "e o funil?",
  // "melhora isso") NÃO é trivial por padrão. Custo de injetar contexto à toa
  // é ~50-70 tokens; custo de deixar um pedido real escapar do roteamento é
  // alto (ver bug de 2026-08-19). Só as regras explícitas acima marcam trivial.
  return false;
}

// Sobe no máximo 8 níveis procurando _wizz/ (projeto Wizz instalado).
function findWizzRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 8 && dir; i++) {
    try {
      if (fs.existsSync(path.join(dir, '_wizz'))) return dir;
    } catch {
      return null;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

function buildContext(isWizzProject) {
  if (isWizzProject) {
    return (
      '🎛️ Projeto Wizz: NÃO invoque wizz-router. 2+ áreas → sempre Skill `wizz-maestro`. ' +
      '1 área: 2+ fatores (multi-passo, planejar, artefato memorável) → `wizz-maestro`; ' +
      'senão → Skill do agente da área (ex: wizz-designer, wizz-quick-dev). Trivial → direto.'
    );
  }
  return (
    '🎛️ Pedido não-trivial: invoque a Skill `wizz-router` antes de agir para ' +
    'mapear skills/MCPs (liste candidatas via AskUserQuestion e confirme). ' +
    'Exceção: edição trivial de 1 linha e conversa pura.'
  );
}

function isTraceEnabled() {
  return process.env.WIZZ_TRACE === '1';
}

function getTraceFile() {
  return process.env.WIZZ_TRACE_FILE || path.join(os.homedir(), '.claude', 'wizz-trace.jsonl');
}

// Grava 1 linha JSON por decisão quando WIZZ_TRACE=1. Append-only,
// fail-silent, e não faz nada (nem chega a serializar) quando desligado —
// custo zero no caminho comum.
function traceLine(entry) {
  if (!isTraceEnabled()) return;
  try {
    fs.appendFileSync(getTraceFile(), JSON.stringify(entry) + '\n');
  } catch {
    // trace nunca pode derrubar o hook
  }
}

function getGlobalSkillsDir() {
  return process.env.WIZZ_GLOBAL_SKILLS_DIR || path.join(os.homedir(), '.claude', 'skills');
}

// Verifica se os artefatos de que o roteamento depende de fato existem.
// Devolve uma lista de avisos legíveis (vazia = tudo ok); nunca lança.
function checkFallbackWarnings(isWizzProject, wizzRoot) {
  const warnings = [];
  try {
    if (isWizzProject) {
      const configPath = path.join(wizzRoot, '_wizz', 'config.toml');
      if (!fs.existsSync(configPath)) {
        warnings.push(`_wizz/config.toml não encontrado em ${wizzRoot} (install de projeto Wizz incompleto?)`);
      }
    } else {
      const flatTablePath = path.join(getGlobalSkillsDir(), 'wizz-router', 'references', 'routing-table-flat.md');
      if (!fs.existsSync(flatTablePath)) {
        warnings.push(`routing-table-flat.md não encontrada em ${flatTablePath} — rode "npm run sync:global" no repo wizz-method`);
      }
    }
  } catch {
    // fail-silent — checagem de fallback nunca bloqueia o prompt
  }
  return warnings;
}

// Warning visível mesmo com trace desligado: fallback de roteamento é raro
// e sinaliza um bug de sincronização (ex.: o próprio C1 da auditoria), então
// vale a pena aparecer em stderr independente de WIZZ_TRACE.
function emitFallbackWarnings(warnings) {
  for (const warning of warnings) {
    try {
      process.stderr.write(`[wizz-router-enforce] fallback: ${warning}\n`);
    } catch {
      // fail-silent
    }
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
      const data = JSON.parse(input);
      const prompt = data.prompt || '';
      const trivial = !prompt || isTrivial(prompt);
      if (trivial) {
        traceLine({ ts: new Date().toISOString(), isTrivial: true, mode: null });
        process.exit(0);
      }

      const cwd = data.cwd || process.cwd();
      const wizzRoot = findWizzRoot(cwd);
      const isWizzProject = Boolean(wizzRoot);
      const context = buildContext(isWizzProject);

      const warnings = checkFallbackWarnings(isWizzProject, wizzRoot);
      if (warnings.length > 0) emitFallbackWarnings(warnings);

      traceLine({
        ts: new Date().toISOString(),
        isTrivial: false,
        mode: isWizzProject ? 'wizz' : 'flat',
        contextInjected: context,
        warnings,
      });

      const output = {
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: context,
        },
      };
      process.stdout.write(JSON.stringify(output));
    } catch {
      // Falha em silêncio — nunca bloquear o prompt
      process.exit(0);
    }
  });
}

if (require.main === module) {
  runHook();
} else {
  module.exports = {
    isTrivial,
    buildContext,
    findWizzRoot,
    isTraceEnabled,
    getTraceFile,
    traceLine,
    getGlobalSkillsDir,
    checkFallbackWarnings,
    emitFallbackWarnings,
  };
}
