// session-rules.js — SessionStart hook
//
// Fonte de verdade: wizz-method/tools/hooks/. Instalar via `npm run sync:global`.
//
// Duas responsabilidades, um processo só (SessionStart roda 1x por sessão):
//
//   1. Regras de comunicação, injetadas UMA vez por sessão (antes:
//      no-narration-enforce repetia ~80 tokens em TODO prompt via
//      UserPromptSubmit). Mesmo conteúdo, custo fixo por sessão.
//
//   2. Feature ativa: resolve o `active_feature` SOZINHO, sem o usuário
//      precisar invocar `wizz-set-feature` e responder duas perguntas. Ordem:
//      branch git (mais fresco que o config) > `_wizz/bmm/config.yaml` > nada.
//      Custo zero quando não há `_wizz/` nem branch de feature: a linha
//      simplesmente não é emitida.
//
// Nunca bloqueia: qualquer erro vira "sem feature ativa" e a sessão segue.

const fs = require('node:fs');
const path = require('node:path');

// Cópia comprimida e INTENCIONAL da regra de comunicação. A fonte é
// src/modules/wizz/_shared/communication-rules.md; este hook precisa ser
// autocontido porque roda de ~/.claude/hooks, longe do repo. Editou lá,
// edite aqui: test/test-feature-context.js falha se as duas divergirem.
const RULES =
  'REGRA DE COMUNICAÇÃO (permanente, não-negociável): não narrar o passo a passo ' +
  'enquanto trabalha; pausar e perguntar SÓ em decisão do usuário ou risco ' +
  'irreversível; fechar SEMPRE com resumo curto em tópicos, linguagem simples, ' +
  'sem jargão; sem em-dashes; comunicação enxuta por default, expandir só sob demanda.';

// Branches que NUNCA viram feature: são linha principal, não trabalho nomeado.
const TRUNK = new Set(['main', 'master', 'develop', 'dev', 'staging', 'stage', 'prod', 'production', 'trunk', 'default', 'release']);

// Branch de release/versão não é feature: nomeia um corte do produto, não um trabalho.
const RELEASE_PREFIX = /^(release|rc|v)[/-]/i;

// Prefixos de convenção que descrevem o TIPO do trabalho, não a feature.
const TYPE_PREFIX = /^(feat|feature|fix|bugfix|hotfix|chore|refactor|docs|test|perf|ci|build|style)[/-]/i;

/**
 * Normaliza um texto livre para o mesmo slug kebab-case que a skill
 * `wizz-set-feature` grava, para branch e config nunca divergirem por formato.
 * @param {string} raw
 * @returns {string} slug kebab-case, ou '' se não sobrar nada utilizável
 */
function toSlug(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/g, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Lê o branch atual sem subprocesso: `.git/HEAD` já traz o ref, e um read de
 * arquivo é mais barato e mais seguro que um `git` no PATH (que pode nem existir).
 * Sobe até 6 níveis para achar o `.git` de um subdiretório do repo.
 * @param {string} cwd
 * @returns {string} nome do branch, ou '' (detached HEAD, sem repo, erro)
 */
function readGitBranch(cwd) {
  let dir = cwd;
  for (let i = 0; i < 6; i++) {
    const gitPath = path.join(dir, '.git');
    try {
      const stat = fs.statSync(gitPath);
      let headFile = path.join(gitPath, 'HEAD');
      if (stat.isFile()) {
        // worktree/submódulo: `.git` é um arquivo `gitdir: <caminho>`
        const m = /^gitdir:\s*(.+)$/m.exec(fs.readFileSync(gitPath, 'utf8'));
        if (!m) return '';
        const resolved = path.resolve(dir, m[1].trim());
        headFile = path.join(resolved, 'HEAD');
      }
      const head = fs.readFileSync(headFile, 'utf8').trim();
      const ref = /^ref:\s*refs\/heads\/(.+)$/.exec(head);
      return ref ? ref[1] : ''; // detached HEAD => sem branch => sem feature
    } catch {
      // segue subindo
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return '';
}

/**
 * Deriva um slug de feature do nome do branch. Branch de tronco e branch sem
 * nome útil devolvem '' (nenhuma feature), nunca um slug inventado.
 * @param {string} branch
 * @returns {string}
 */
function featureFromBranch(branch) {
  if (!branch) return '';
  if (TRUNK.has(branch.toLowerCase())) return '';
  if (RELEASE_PREFIX.test(branch)) return '';
  const stripped = branch.replace(TYPE_PREFIX, '');
  const slug = toSlug(stripped);
  if (!slug || TRUNK.has(slug)) return '';
  // Branch que é só um número de issue não descreve feature nenhuma.
  if (/^\d+$/.test(slug)) return '';
  return slug;
}

/**
 * Lê `active_feature` do config do módulo bmm. Parser de 1 chave de propósito:
 * o hook não pode depender de uma lib de YAML (roda fora do node_modules do repo).
 * @param {string} cwd
 * @returns {{slug: string, configPath: string}} slug '' quando ausente/vazio
 */
function readConfigFeature(cwd) {
  const configPath = path.join(cwd, '_wizz', 'bmm', 'config.yaml');
  try {
    const text = fs.readFileSync(configPath, 'utf8');
    const m = /^active_feature:\s*(.*)$/m.exec(text);
    if (!m) return { slug: '', configPath };
    const value = m[1]
      .replace(/#.*$/, '')
      .trim()
      .replaceAll(/^["']|["']$/g, '');
    return { slug: toSlug(value), configPath };
  } catch {
    return { slug: '', configPath };
  }
}

/**
 * Acha a raiz do projeto Wizz (a pasta que contém `_wizz/`) subindo do cwd.
 * O agente costuma rodar de uma subpasta, então checar só o cwd erraria.
 * @param {string} cwd
 * @returns {string} caminho da raiz, ou '' se não for projeto Wizz
 */
function findWizzRoot(cwd) {
  let dir = cwd;
  for (let i = 0; i < 6; i++) {
    try {
      if (fs.existsSync(path.join(dir, '_wizz'))) return dir;
    } catch {
      // ignora e segue subindo
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return '';
}

/**
 * Monta a linha de contexto da feature. Devolve '' quando não há feature
 * nenhuma. Silêncio custa zero token e é o caso comum fora de projeto Wizz.
 * @param {string} cwd
 * @returns {string}
 */
function buildFeatureContext(cwd) {
  const wizzRoot = findWizzRoot(cwd);
  const isWizzProject = Boolean(wizzRoot);
  const fromConfig = isWizzProject ? readConfigFeature(wizzRoot) : { slug: '', configPath: '' };
  const fromBranch = featureFromBranch(readGitBranch(cwd));

  // O branch ganha do config: é o que descreve o trabalho de AGORA. O config
  // pode ter ficado numa feature antiga que ninguém lembrou de trocar.
  const active = fromBranch || fromConfig.slug;
  if (!active) return '';

  const parts = [
    `FEATURE ATIVA: ${active}` + (fromBranch ? ' (derivada do branch git).' : ' (do config).'),
    'Use como contexto sem perguntar nada:',
    isWizzProject
      ? `artefatos de planejamento e implementação vão para as subpastas ${active}/;`
      : 'não é projeto Wizz, então não há subpasta de artefato;',
    `memória gravada nesta sessão leva tema/feature "${active}".`,
  ];

  if (fromBranch && isWizzProject && fromConfig.slug !== fromBranch) {
    parts.push(
      `O config (_wizz/bmm/config.yaml) ainda diz "${fromConfig.slug || 'vazio'}": grave "${active}" nele na primeira vez que escrever um artefato, e avise em UMA linha.`,
    );
  }

  parts.push(
    'NÃO peça confirmação de feature. Só invoque a skill wizz-set-feature se o usuário pedir explicitamente para trocar, ou se houver ambiguidade real entre duas features abertas.',
  );

  return parts.join(' ');
}

// Só lê stdin quando o hook é invocado direto pelo Claude Code. Sob `require`
// (os testes), o módulo expõe as funções puras sem consumir stdin nem sair.
if (require.main === module) {
  let input = '';
  const stdinTimeout = setTimeout(() => finish(''), 3000);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => (input += chunk));
  process.stdin.on('end', () => {
    clearTimeout(stdinTimeout);
    finish(input);
  });
}

function finish(raw) {
  let context = RULES;
  try {
    let cwd = process.cwd();
    try {
      const payload = JSON.parse(raw || '{}');
      if (payload && typeof payload.cwd === 'string' && payload.cwd) cwd = payload.cwd;
    } catch {
      // payload ausente ou inválido: cai no cwd do processo
    }
    const feature = buildFeatureContext(cwd);
    if (feature) context += `\n\n${feature}`;
  } catch {
    // resolução de feature NUNCA derruba as regras de comunicação
  }

  try {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: context,
        },
      }),
    );
  } catch {
    // nunca bloquear
  }
  process.exit(0);
}

module.exports = {
  toSlug,
  featureFromBranch,
  readConfigFeature,
  findWizzRoot,
  buildFeatureContext,
  readGitBranch,
};
