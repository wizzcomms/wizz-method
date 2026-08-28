/**
 * Feature Context Test — session-rules.js
 *
 * O hook SessionStart resolve a feature ativa SOZINHO (branch git > config >
 * nada), para o usuário nunca precisar invocar `wizz-set-feature` nem responder
 * "qual é o slug?". Este teste protege as três propriedades que fazem isso
 * valer a pena:
 *
 *   1. Um branch de tronco (main/master/release/...) NUNCA vira feature. Se
 *      virasse, toda sessão em main gravaria artefato numa subpasta "main/" e
 *      etiquetaria memória com um tema que não existe.
 *   2. O branch ganha do config. O config fica velho (ninguém troca ao voltar
 *      pra outra feature); o branch descreve o trabalho de agora.
 *   3. Sem projeto Wizz e sem branch de feature, a saída é VAZIA. Silêncio custa
 *      zero token, e esse é o caso comum (sessão de conversa, repo alheio).
 *
 * Uso: node test/test-feature-context.js
 * Exit: 0 = tudo passou, 1 = alguma propriedade quebrou
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const hook = require('../tools/hooks/session-rules.js');

const colors = { reset: '[0m', green: '[32m', red: '[31m', cyan: '[36m', dim: '[2m' };
let passed = 0;
let failed = 0;

function assert(condition, name, detail = '') {
  if (condition) {
    console.log(`  ${colors.green}✓${colors.reset} ${name}`);
    passed++;
  } else {
    console.log(`  ${colors.red}✗${colors.reset} ${name}`);
    if (detail) console.log(`    ${colors.dim}${detail}${colors.reset}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n${colors.cyan}── ${title} ──${colors.reset}`);
}

/**
 * Monta um projeto de mentira num tmpdir: branch git opcional (só o `.git/HEAD`,
 * que é tudo que o hook lê) e config do bmm opcional.
 * @param {{branch?: string, feature?: string|null, wizz?: boolean}} opts
 * @returns {string} caminho da raiz criada
 */
function makeProject({ branch, feature, wizz = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-feature-'));
  if (branch) {
    fs.mkdirSync(path.join(root, '.git'), { recursive: true });
    fs.writeFileSync(path.join(root, '.git', 'HEAD'), `ref: refs/heads/${branch}\n`);
  }
  if (wizz) {
    const cfgDir = path.join(root, '_wizz', 'bmm');
    fs.mkdirSync(cfgDir, { recursive: true });
    const body =
      feature === null || feature === undefined ? 'project_name: teste\n' : `project_name: teste\nactive_feature: "${feature}"\n`;
    fs.writeFileSync(path.join(cfgDir, 'config.yaml'), body);
  }
  return root;
}

// ─────────────────────────────────────────────────────────────────────────
section('toSlug: normalização igual à da skill');

assert(hook.toSlug('Dashboard Financeiro') === 'dashboard-financeiro', 'espaço vira hífen e cai pra minúscula');
assert(hook.toSlug('Ação Rápida') === 'acao-rapida', 'acento é removido, não vira hífen');
assert(hook.toSlug('  --oferta--  ') === 'oferta', 'hífen sobrando nas pontas some');
assert(hook.toSlug('a'.repeat(90)).length === 60, 'slug é truncado em 60 caracteres');
assert(hook.toSlug(null) === '', 'entrada não-string devolve vazio em vez de explodir');

// ─────────────────────────────────────────────────────────────────────────
section('featureFromBranch: tronco nunca vira feature');

for (const trunk of ['main', 'master', 'develop', 'dev', 'staging', 'prod', 'production', 'release', 'MAIN']) {
  assert(hook.featureFromBranch(trunk) === '', `branch "${trunk}" não vira feature`);
}
assert(hook.featureFromBranch('release/1.2.0') === '', 'branch de release não vira feature');
assert(hook.featureFromBranch('v/2.0') === '', 'branch de versão não vira feature');
assert(hook.featureFromBranch('42') === '', 'branch que é só número de issue não vira feature');
assert(hook.featureFromBranch('') === '', 'branch vazio (detached HEAD) não vira feature');

section('featureFromBranch: prefixo de tipo é descartado, o nome fica');

assert(hook.featureFromBranch('feat/dashboard-financeiro') === 'dashboard-financeiro', 'feat/ é removido');
assert(hook.featureFromBranch('feature/oferta-low-ticket') === 'oferta-low-ticket', 'feature/ é removido');
assert(hook.featureFromBranch('hotfix/pixel-quebrado') === 'pixel-quebrado', 'hotfix/ é removido');
assert(hook.featureFromBranch('chore-limpeza') === 'limpeza', 'prefixo com hífen também é removido');
assert(hook.featureFromBranch('painel-assinaturas') === 'painel-assinaturas', 'branch sem prefixo passa inteiro');

// ─────────────────────────────────────────────────────────────────────────
section('readGitBranch: lê .git/HEAD sem subprocesso');

{
  const root = makeProject({ branch: 'feat/x' });
  assert(hook.readGitBranch(root) === 'feat/x', 'lê o branch do HEAD');

  const sub = path.join(root, 'a', 'b');
  fs.mkdirSync(sub, { recursive: true });
  assert(hook.readGitBranch(sub) === 'feat/x', 'acha o .git subindo a partir de uma subpasta');

  fs.writeFileSync(path.join(root, '.git', 'HEAD'), 'a1b2c3d4e5f6\n');
  assert(hook.readGitBranch(root) === '', 'detached HEAD devolve vazio');

  const semGit = makeProject({ wizz: false });
  assert(hook.readGitBranch(semGit) === '', 'fora de repo git devolve vazio sem lançar');
}

// ─────────────────────────────────────────────────────────────────────────
section('findWizzRoot / readConfigFeature');

{
  const root = makeProject({ feature: 'oferta-vinho' });
  assert(hook.findWizzRoot(root) === root, 'acha a raiz com _wizz/');
  const sub = path.join(root, 'src', 'app');
  fs.mkdirSync(sub, { recursive: true });
  assert(hook.findWizzRoot(sub) === root, 'acha a raiz subindo de uma subpasta');
  assert(hook.findWizzRoot(makeProject({ wizz: false })) === '', 'projeto sem _wizz devolve vazio');

  assert(hook.readConfigFeature(root).slug === 'oferta-vinho', 'lê active_feature do config');
  assert(hook.readConfigFeature(makeProject({ feature: '' })).slug === '', 'active_feature vazio devolve vazio');
  assert(hook.readConfigFeature(makeProject({ feature: null })).slug === '', 'config sem a chave devolve vazio');
  assert(hook.readConfigFeature('/nao/existe').slug === '', 'config inexistente devolve vazio sem lançar');
}

// ─────────────────────────────────────────────────────────────────────────
section('buildFeatureContext: as três propriedades que importam');

{
  const semNada = makeProject({ branch: 'main', feature: '' });
  assert(hook.buildFeatureContext(semNada) === '', 'main + config vazio => saída VAZIA (custo zero)');

  const foraDeWizz = makeProject({ branch: 'main', wizz: false });
  assert(hook.buildFeatureContext(foraDeWizz) === '', 'fora de projeto Wizz e em main => saída VAZIA');

  const soConfig = makeProject({ branch: 'main', feature: 'painel-assinaturas' });
  const ctxConfig = hook.buildFeatureContext(soConfig);
  assert(ctxConfig.includes('FEATURE ATIVA: painel-assinaturas'), 'em main, o config é usado');
  assert(ctxConfig.includes('(do config)'), 'a origem "config" é declarada');

  const soBranch = makeProject({ branch: 'feat/dashboard-financeiro', feature: '' });
  const ctxBranch = hook.buildFeatureContext(soBranch);
  assert(ctxBranch.includes('FEATURE ATIVA: dashboard-financeiro'), 'sem config, o branch é usado');
  assert(ctxBranch.includes('derivada do branch git'), 'a origem "branch" é declarada');

  const conflito = makeProject({ branch: 'feat/oferta-nova', feature: 'feature-antiga' });
  const ctxConflito = hook.buildFeatureContext(conflito);
  assert(ctxConflito.includes('FEATURE ATIVA: oferta-nova'), 'branch GANHA do config quando os dois existem');
  assert(ctxConflito.includes('feature-antiga'), 'o config defasado é citado para ser corrigido');
  assert(ctxConflito.includes('_wizz/bmm/config.yaml'), 'o caminho do config a corrigir é dito');

  assert(ctxConflito.includes('NÃO peça confirmação'), 'a instrução de não perguntar está sempre presente');
  assert(ctxConflito.includes('tema/feature'), 'a feature é declarada como o tema da memória');

  const foraDeWizzComBranch = makeProject({ branch: 'feat/algo', wizz: false });
  const ctxFora = hook.buildFeatureContext(foraDeWizzComBranch);
  assert(ctxFora.includes('FEATURE ATIVA: algo'), 'fora de projeto Wizz, o branch ainda vale como tema de memória');
  assert(ctxFora.includes('não é projeto Wizz'), 'fora de projeto Wizz não promete subpasta de artefato');
}

section('regra de comunicação: fonte única contra a cópia do hook');
{
  // A regra de comunicação existe em DOIS lugares por necessidade técnica: o
  // arquivo compartilhado (que entra no prompt de todo agente via `include`) e
  // a constante RULES deste hook (que roda de ~/.claude/hooks, longe do repo,
  // e por isso precisa ser autocontida). Duas cópias só são aceitáveis enquanto
  // dizem a mesma coisa. Este teste é o que impede a segunda de envelhecer.
  const hookSrc = fs.readFileSync(path.join(__dirname, '..', 'tools', 'hooks', 'session-rules.js'), 'utf8');
  const sharedSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'modules', 'wizz', '_shared', 'communication-rules.md'), 'utf8');

  const rulesMatch = hookSrc.match(/const RULES =([\s\S]*?);\n/);
  assert(Boolean(rulesMatch), 'o hook ainda declara a constante RULES');
  const hookRules = rulesMatch ? rulesMatch[1] : '';

  // Cada pilar é uma ideia, não uma frase: as duas cópias têm registros
  // diferentes (uma é instrução de sistema, a outra é prompt de agente), então
  // comparar texto literal daria falso positivo toda vez que alguém reescreve.
  const PILARES = [
    { nome: 'não narrar o passo a passo', hook: /não narrar o passo a passo/i, shared: /não narre o passo a passo/i },
    {
      nome: 'pausar só em decisão do usuário ou risco irreversível',
      hook: /risco\s+' \+\s*'irrevers|risco irrevers/i,
      shared: /risco irrevers/i,
    },
    { nome: 'fechar com resumo curto', hook: /resumo curto/i, shared: /resumo curto/i },
    { nome: 'sem em-dash', hook: /em-dash/i, shared: /em-dash|travessão/i },
    {
      nome: 'enxuto por default, expandir sob demanda',
      hook: /expandir só sob demanda/i,
      shared: /expanda só quando pedirem|expandir só sob demanda/i,
    },
  ];

  for (const pilar of PILARES) {
    assert(pilar.hook.test(hookRules), `hook cobre o pilar: ${pilar.nome}`);
    assert(pilar.shared.test(sharedSrc), `fonte única cobre o pilar: ${pilar.nome}`);
  }

  assert(/FONTE ÚNICA/.test(sharedSrc), 'a fonte única se declara como fonte única (quem editar sabe que existe cópia)');
  assert(/communication-rules\.md/.test(hookSrc), 'o hook aponta de volta para a fonte única');
}

// ─────────────────────────────────────────────────────────────────────────
console.log(`\n${colors.cyan}${'='.repeat(55)}${colors.reset}`);
console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
console.log(`  Failed: ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`);
console.log(`${colors.cyan}${'='.repeat(55)}${colors.reset}\n`);
process.exit(failed > 0 ? 1 : 0);
