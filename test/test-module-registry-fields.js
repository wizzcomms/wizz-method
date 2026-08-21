/**
 * Module Registry Field Tests
 *
 * Cobre os campos do registry portados do BMAD 6.11 (`wizz-modules.yaml`):
 *   - deprecated / deprecation-message
 *   - marketplace-plugin
 *   - post-install-message
 *   - aliases (resolução de código legado)
 *
 * Também trava as URLs do registry contra o bug de rebrand: um sed de
 * `bmad-` -> `wizz-` já quebrou 3 URLs de repositório upstream, deixando
 * cis/gds/automator impossíveis de instalar.
 *
 * Usage: node test/test-module-registry-fields.js
 */

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('yaml');

const { ExternalModuleManager } = require('../tools/installer/modules/external-manager');

const colors = {
  reset: '[0m',
  green: '[32m',
  red: '[31m',
  cyan: '[36m',
  dim: '[2m',
};

let passed = 0;
let failed = 0;

function assert(condition, testName, errorMessage = '') {
  if (condition) {
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    passed++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (errorMessage) console.log(`  ${colors.dim}${errorMessage}${colors.reset}`);
    failed++;
  }
}

function assertEqual(actual, expected, testName) {
  const ok = actual === expected;
  assert(ok, testName, ok ? '' : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function section(title) {
  console.log(`\n${colors.cyan}── ${title} ──${colors.reset}`);
}

const REGISTRY_PATH = path.join(__dirname, '..', 'wizz-modules.yaml');
const registry = yaml.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

async function runTests() {
  const mgr = new ExternalModuleManager();
  const modules = await mgr.listAvailable();
  const byCode = new Map(modules.map((m) => [m.code, m]));

  // ───────────────────────────────────────────────────────────────────────
  section('URLs do registry (regressão do rebrand bmad- -> wizz-)');

  for (const [key, mod] of Object.entries(registry.modules || {})) {
    const url = mod.url || mod.repository || '';
    const owner = url.replace(/^https:\/\/github\.com\//, '').split('/')[0];
    if (owner !== 'bmad-code-org') continue;
    const repo = url.replace(/^https:\/\/github\.com\/[^/]+\//, '').replace(/\.git$/, '');
    assert(
      !repo.startsWith('wizz-'),
      `${key}: URL do upstream não foi rebrandeada (${repo})`,
      `O repositório bmad-code-org/${repo} não existe. O rebrand vale só para nomes de exibição, nunca para URLs de terceiros.`,
    );
  }

  // ───────────────────────────────────────────────────────────────────────
  section('_normalizeModule expõe os campos novos');

  const loop = byCode.get('bmad-loop');
  assert(!!loop, 'bmad-loop está registrado');
  assertEqual(loop.marketplacePlugin, true, 'bmad-loop: marketplacePlugin = true');
  assert(typeof loop.postInstallMessage === 'string' && loop.postInstallMessage.length > 0, 'bmad-loop: postInstallMessage preenchido');
  assert(Array.isArray(loop.aliases) && loop.aliases.includes('bauto'), 'bmad-loop: aliases inclui bauto');
  assertEqual(loop.deprecated, false, 'bmad-loop: não é depreciado');

  const tea = byCode.get('tea');
  assertEqual(tea.deprecated, false, 'tea: deprecated default é false');
  assertEqual(tea.marketplacePlugin, false, 'tea: marketplacePlugin default é false');
  assertEqual(tea.postInstallMessage, null, 'tea: postInstallMessage default é null');
  assert(Array.isArray(tea.aliases) && tea.aliases.length === 0, 'tea: aliases default é array vazio');

  // ───────────────────────────────────────────────────────────────────────
  section('Módulos depreciados');

  for (const code of ['automator', 'wds']) {
    const mod = byCode.get(code);
    assert(!!mod, `${code} está registrado`);
    assertEqual(mod.deprecated, true, `${code}: deprecated = true`);
    assert(typeof mod.deprecationMessage === 'string' && mod.deprecationMessage.length > 0, `${code}: deprecation-message preenchido`);
  }

  // O filtro do picker: escondido a menos que já instalado.
  const installed = new Set(['wds']);
  const visible = new Set(modules.filter((m) => !m.builtIn && (!m.deprecated || installed.has(m.code))).map((m) => m.code));
  assert(!visible.has('automator'), 'picker esconde automator (depreciado, não instalado)');
  assert(visible.has('wds'), 'picker mostra wds (depreciado, mas instalado)');
  assert(visible.has('bmad-loop'), 'picker mostra bmad-loop (não depreciado)');

  // ───────────────────────────────────────────────────────────────────────
  section('Resolução por alias');

  const byAlias = await mgr.getModuleByCode('bauto');
  assert(!!byAlias, 'getModuleByCode("bauto") resolve');
  assertEqual(byAlias && byAlias.code, 'bmad-loop', 'bauto resolve para bmad-loop');

  const canonical = await mgr.resolveCanonicalCode('bauto');
  assertEqual(canonical, 'bmad-loop', 'resolveCanonicalCode("bauto") = bmad-loop');

  const unknown = await mgr.resolveCanonicalCode('nao-existe');
  assertEqual(unknown, 'nao-existe', 'resolveCanonicalCode devolve o input em código desconhecido');

  const exact = await mgr.getModuleByCode('cis');
  assertEqual(exact && exact.code, 'cis', 'match exato de code tem prioridade sobre alias');

  // ───────────────────────────────────────────────────────────────────────
  console.log(`\n========================================`);
  console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${failed}${colors.reset}`);
  console.log(`========================================\n`);

  if (failed === 0) {
    console.log(`${colors.green}✨ All module registry field tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Some module registry field tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error(`${colors.red}Test runner failed:${colors.reset}`, error.message);
  console.error(error.stack);
  process.exit(1);
});
