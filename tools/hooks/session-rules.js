// session-rules.js — SessionStart hook
//
// Fonte de verdade: wizz-method/tools/hooks/. Instalar via `npm run sync:global`.
//
// Três responsabilidades, um processo só (SessionStart roda 1x por sessão):
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
//   3. Teto da auto-memória: o teto de 40 memórias e 8 KB de índice está
//      escrito no CLAUDE.md global desde 2026-08-28, mas nada disparava a
//      checagem — quem estoura só descobre quando o índice já custa caro em
//      toda sessão. Aqui a checagem acontece sozinha, 1x por sessão, e só
//      fala quando há o que dizer. Abaixo de 90% do teto: silêncio, zero token.
//
// Nunca bloqueia: qualquer erro vira "sem feature ativa" e a sessão segue.

const fs = require('node:fs');
const os = require('node:os');
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

// ── Teto da auto-memória ────────────────────────────────────────────────
// Fonte do teto: ~/.claude/CLAUDE.md ("Teto da auto-memória", 2026-08-28).
// Mudou lá, mude aqui: test/test-feature-context.js falha se divergirem.
const MEMORY_MAX_FILES = 40;
const MEMORY_MAX_INDEX_BYTES = 8 * 1024;
// Avisa ANTES de estourar. Estourar já significa sessões caras rodando faz
// tempo; o valor do aviso está em chegar enquanto a poda ainda é barata.
const MEMORY_WARN_RATIO = 0.9;

/**
 * Resolve o diretório de auto-memória do projeto. O slug histórico do Claude
 * Code troca `/` e `.` por `-`, mas nem sempre normalizou espaço do mesmo
 * jeito, então há um fallback por basename. O fallback só vale quando há UM
 * candidato: aviso apontando para o projeto errado é pior que aviso nenhum.
 * @param {string} cwd
 * @returns {string} caminho do diretório, ou '' quando não há memória
 */
function resolveMemoryDir(cwd) {
  try {
    const base = path.join(os.homedir(), '.claude', 'projects');
    const direct = path.join(base, cwd.replaceAll(/[/.]/g, '-'), 'memory');
    if (fs.existsSync(direct)) return direct;

    const name = path.basename(cwd);
    if (!name) return '';
    const matches = fs
      .readdirSync(base)
      .filter((entry) => entry.endsWith(`-${name}`) || entry.endsWith(`-${name.replaceAll(/[ .]/g, '-')}`))
      .map((entry) => path.join(base, entry, 'memory'))
      .filter((dir) => fs.existsSync(dir));
    return matches.length === 1 ? matches[0] : '';
  } catch {
    return '';
  }
}

/**
 * Conta as memórias e mede o índice. `_archive/` fica de fora de propósito:
 * é exatamente para onde a poda move os originais, então contá-lo faria o
 * aviso nunca sumir depois de resolvido.
 * @param {string} memoryDir
 * @returns {{files: number, indexBytes: number}}
 */
function measureMemory(memoryDir) {
  let files = 0;
  let indexBytes = 0;
  try {
    for (const entry of fs.readdirSync(memoryDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      if (entry.name === 'MEMORY.md') {
        indexBytes = fs.statSync(path.join(memoryDir, entry.name)).size;
        continue;
      }
      files++;
    }
  } catch {
    return { files: 0, indexBytes: 0 };
  }
  return { files, indexBytes };
}

/**
 * Monta o aviso a partir da medida. Parte pura de propósito: é o que decide o
 * silêncio, então precisa ser testável sem montar um ~/.claude falso.
 * Devolve '' abaixo de 90% dos dois tetos — o caso comum, e o silêncio é o
 * que mantém o custo em zero.
 * @param {number} files
 * @param {number} indexBytes
 * @returns {string}
 */
function formatMemoryCeiling(files, indexBytes) {
  if (files === 0 && indexBytes === 0) return '';

  const over = files > MEMORY_MAX_FILES || indexBytes > MEMORY_MAX_INDEX_BYTES;
  const near =
    files >= Math.floor(MEMORY_MAX_FILES * MEMORY_WARN_RATIO) || indexBytes >= Math.floor(MEMORY_MAX_INDEX_BYTES * MEMORY_WARN_RATIO);
  if (!over && !near) return '';

  const kb = (indexBytes / 1024).toFixed(1);
  const estado = `${files}/${MEMORY_MAX_FILES} memórias e índice de ${kb}/8 KB`;

  return over
    ? `TETO DA AUTO-MEMÓRIA ESTOURADO neste projeto: ${estado}. Acima do teto o índice custa mais token por sessão do que economiza. Antes de gravar qualquer memória nova, pode: funda por subsistema (N memórias do mesmo tema viram 1 arquivo com seções) e mova os originais para \`_archive/\`, que não entra no índice. Nunca apague. Método em project_poda_automemoria_plano.`
    : `AUTO-MEMÓRIA PERTO DO TETO neste projeto: ${estado}. Ainda cabe, mas ao gravar memória nova prefira ATUALIZAR um registro existente a criar um segundo, e verifique se o fato não pertence a outra camada (decisão e estado de projeto são do Cérebro, não daqui).`;
}

/**
 * Resolve, mede e formata. É o que o hook chama; a decisão de falar ou calar
 * mora em formatMemoryCeiling.
 * @param {string} cwd
 * @returns {string}
 */
function buildMemoryCeilingContext(cwd) {
  const memoryDir = resolveMemoryDir(cwd);
  if (!memoryDir) return '';
  const { files, indexBytes } = measureMemory(memoryDir);
  return formatMemoryCeiling(files, indexBytes);
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

  // Um cwd só para as duas resoluções: o do payload manda, porque o
  // process.cwd() do hook pode não ser o projeto da sessão. Feature e teto
  // de memória olhando projetos diferentes seria pior que não avisar.
  let cwd = process.cwd();
  try {
    const payload = JSON.parse(raw || '{}');
    if (payload && typeof payload.cwd === 'string' && payload.cwd) cwd = payload.cwd;
  } catch {
    // payload ausente ou inválido: cai no cwd do processo
  }

  try {
    const feature = buildFeatureContext(cwd);
    if (feature) context += `\n\n${feature}`;
  } catch {
    // resolução de feature NUNCA derruba as regras de comunicação
  }

  try {
    const ceiling = buildMemoryCeilingContext(cwd);
    if (ceiling) context += `\n\n${ceiling}`;
  } catch {
    // teto da memória é aviso, não gate: erro aqui não afeta o resto
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
  MEMORY_MAX_FILES,
  MEMORY_MAX_INDEX_BYTES,
  MEMORY_WARN_RATIO,
  resolveMemoryDir,
  measureMemory,
  formatMemoryCeiling,
  buildMemoryCeilingContext,
  toSlug,
  featureFromBranch,
  readConfigFeature,
  findWizzRoot,
  buildFeatureContext,
  readGitBranch,
};
