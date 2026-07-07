// Testa o hook wizz-router-enforce (tools/hooks/): isTrivial determinístico e
// a seleção de contexto por modo (projeto Wizz vs flat).

const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const { isTrivial, buildContext, findWizzRoot } = require('../tools/hooks/wizz-router-enforce.js');

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures++;
    console.error(`  ✗ ${name}: ${error.message}`);
  }
}

console.log('test-router-hook: isTrivial');

const TRIVIAL = [
  '',
  '   ',
  '/wizz-router auditoria',
  '/cerebro ver',
  'oi',
  'bom dia, tudo bem?',
  'obrigado!',
  'ok',
  'valeu',
  'corrige esse typo',
  'typo no README',
  'rename a variável userName',
  'renomeia a função getData',
  'sim',
  'não',
  'todas',
  'dispara todas as skills',
  'o que foi feito ontem?',
  'qual o status do deploy?',
  'me mostra o resultado',
  'explica isso',
  'e agora?', // curto, sem verbo de ação
  'legal, gostei', // curto, sem verbo de ação
  "trocar 'envie' por 'enviar' na linha 42", // edição pontual com linha
  'como tá o deploy?', // pergunta de status
];

const NON_TRIVIAL = [
  'cria uma landing page para o produto novo',
  'implementa autenticação com Clerk no app',
  'refatora o módulo de pagamentos',
  'audita a segurança do endpoint de login',
  'analisa a performance do banco',
  'faz deploy pra produção',
  'quero melhorar o SEO do site inteiro e criar conteúdo',
  'adiciona rate limiting nas rotas de API',
  'corrige o bug do formulário que não envia',
  'testa o fluxo de signup de ponta a ponta',
  'configura o CI pra rodar os evals',
  'build tá quebrado, resolve', // curto mas tem verbo de ação
  'melhora o email de onboarding', // curto mas tem verbo de ação
  'plano pra reduzir churn', // curto mas tem intenção de trabalho
];

for (const prompt of TRIVIAL) {
  check(`trivial: ${JSON.stringify(prompt.slice(0, 40))}`, () => assert.strictEqual(isTrivial(prompt), true));
}
for (const prompt of NON_TRIVIAL) {
  check(`não-trivial: ${JSON.stringify(prompt.slice(0, 40))}`, () => assert.strictEqual(isTrivial(prompt), false));
}

console.log('test-router-hook: buildContext');

check('projeto Wizz → delega maestro/agente, sem router', () => {
  const ctx = buildContext(true);
  assert.ok(ctx.includes('wizz-maestro'));
  assert.ok(/N[AÃ]O invoque wizz-router/i.test(ctx));
});
check('flat → manda pro router', () => {
  const ctx = buildContext(false);
  assert.ok(ctx.includes('wizz-router'));
});
check('injeções são curtas (< 400 chars ≈ ~100 tokens)', () => {
  assert.ok(buildContext(true).length < 400, `wizz: ${buildContext(true).length}`);
  assert.ok(buildContext(false).length < 400, `flat: ${buildContext(false).length}`);
});

console.log('test-router-hook: findWizzRoot');

check('detecta _wizz/ em ancestral e ausência em dir limpo', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-hook-test-'));
  try {
    const project = path.join(base, 'proj');
    const nested = path.join(project, 'src', 'components');
    fs.mkdirSync(path.join(project, '_wizz'), { recursive: true });
    fs.mkdirSync(nested, { recursive: true });
    assert.strictEqual(findWizzRoot(nested), project);
    const clean = path.join(base, 'clean', 'a', 'b');
    fs.mkdirSync(clean, { recursive: true });
    assert.strictEqual(findWizzRoot(clean), null);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

if (failures > 0) {
  console.error(`\ntest-router-hook: ${failures} falha(s)`);
  process.exit(1);
}
console.log('\ntest-router-hook: OK');
