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

const fs = require('node:fs');
const path = require('node:path');

const TRIVIAL_PATTERNS = [
  // Já é slash command / invocação explícita de skill — já roteado
  /^\s*\//,
  // Conversa pura / saudações
  /^(oi|olá|ola|hey|hi|hello|tudo bem|bom dia|boa tarde|boa noite|obrigad[oa]|valeu|vlw|ok|okay|certo|perfeito|show|massa)\b/i,
  // Typo / rename / ajuste inline pequeno
  /\btypo\b/i,
  /\bcorrige?\s+(esse|este|o|a)?\s*typo\b/i,
  /\brename\s+(a\s+)?(vari[aá]vel|fun[cç][aã]o|arquivo|classe|m[eé]todo)\b/i,
  /\brenomei[ao]\s+(a\s+)?(vari[aá]vel|fun[cç][aã]o|arquivo|classe|m[eé]todo)\b/i,
  // Edição pontual apontando linha específica ("troca X por Y na linha 42")
  /\bna linha \d+\b/i,
  // Resposta a pergunta do próprio router — evita re-injetar no follow-up
  /^(sim|n[aã]o|todas|nenhuma|cancela|dispara?\s+(todas|ambas|essas|todas\s+as\s+skills))/i,
  // Perguntas puras de status / o que foi feito
  /^(o que foi feito|qual o status|me conta|como (t[aá]|est[aá]|ficou|ficaram)|me mostra|explica)/i,
];

// Verbos técnicos de ação que, mesmo em prompt curto, justificam roteamento
const ACTION_VERBS = [
  'cria',
  'criar',
  'adiciona',
  'adicionar',
  'implementa',
  'implementar',
  'constrói',
  'construir',
  'faz',
  'fazer',
  'desenvolve',
  'desenvolver',
  'refatora',
  'refatorar',
  'muda',
  'mudar',
  'altera',
  'alterar',
  'conserta',
  'consertar',
  'corrige',
  'corrigir',
  'fix',
  'fixes',
  'otimiza',
  'otimizar',
  'improve',
  'redesign',
  'migra',
  'migrar',
  'build',
  'deploy',
  'configura',
  'configurar',
  'setup',
  'integra',
  'integrar',
  'add',
  'update',
  'remove',
  'delete',
  'instala',
  'instalar',
  'testa',
  'testar',
  'audita',
  'auditar',
  'analisa',
  'analisar',
  'melhora',
  'melhorar',
  'escreve',
  'escrever',
  'gera',
  'gerar',
  'revisa',
  'revisar',
  'ajusta',
  'ajustar',
  'monta',
  'montar',
  'plano',
  'planeja',
  'reduz',
  'aumenta',
  'lança',
  'publica',
];

function isTrivial(prompt) {
  const trimmed = String(prompt || '').trim();
  if (!trimmed) return true;

  // Slash command — já roteado explicitamente
  if (trimmed.startsWith('/')) return true;

  for (const pattern of TRIVIAL_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  // Prompt muito curto (< 30 chars) sem verbo de ação conhecido
  if (trimmed.length < 30) {
    const lower = trimmed.toLowerCase();
    const hasActionVerb = ACTION_VERBS.some((v) => lower.includes(v));
    if (!hasActionVerb) return true;
  }

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
      '🎛️ Projeto Wizz: NÃO invoque wizz-router. Pedido complexo (2+ áreas ou ' +
      '2+ fatores altos) → Skill `wizz-maestro`; 1 área e leve → Skill do agente ' +
      'da área (ex: wizz-designer, wizz-quick-dev). Trivial/conversa → direto.'
    );
  }
  return (
    '🎛️ Pedido não-trivial: invoque a Skill `wizz-router` antes de agir para ' +
    'mapear skills/MCPs (liste candidatas via AskUserQuestion e confirme). ' +
    'Exceção: edição trivial de 1 linha e conversa pura.'
  );
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
      if (!prompt || isTrivial(prompt)) process.exit(0);

      const cwd = data.cwd || process.cwd();
      const output = {
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: buildContext(Boolean(findWizzRoot(cwd))),
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
  module.exports = { isTrivial, buildContext, findWizzRoot };
}
