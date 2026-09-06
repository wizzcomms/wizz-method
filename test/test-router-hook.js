// Testa o hook wizz-router-enforce (tools/hooks/): isTrivial determinístico e
// a seleção de contexto por modo (projeto Wizz vs flat).

const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const {
  isTrivial,
  buildContext,
  findWizzRoot,
  isTraceEnabled,
  getTraceFile,
  traceLine,
  getGlobalSkillsDir,
  checkFallbackWarnings,
} = require('../tools/hooks/wizz-router-enforce.js');

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
  'legal, gostei', // reação/feedback sem pedido, cai na regex de saudação
  "trocar 'envie' por 'enviar' na linha 42", // edição pontual com linha
  'como tá o deploy?', // pergunta de status
  'link?', // pergunta de 1 palavra, informacional
  'esqueci a senha', // frase de suporte/estado pessoal, não é tarefa
  'rebatiza Home para Landing', // rename de nome próprio ("X para Y")
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
  'e agora?', // curto e ambíguo — deve receber injeção, não escapar do roteamento
  'melhora isso', // curto e ambíguo — mesmo caso, prompt de trabalho real
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
check('dispatch separa personas Skill dos tipos nativos de Agent', () => {
  const ctx = buildContext(true);
  assert.ok(ctx.includes('Personas são skills, não subagent_type'));
  assert.ok(ctx.includes('Agent usa tipos disponíveis wizz-exec-*'));
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

console.log('test-router-hook: trace opt-in (WIZZ_TRACE)');

check('trace desligado por padrão (sem WIZZ_TRACE)', () => {
  delete process.env.WIZZ_TRACE;
  assert.strictEqual(isTraceEnabled(), false);
});

check('trace ligado só com WIZZ_TRACE=1', () => {
  process.env.WIZZ_TRACE = '1';
  assert.strictEqual(isTraceEnabled(), true);
  process.env.WIZZ_TRACE = '0';
  assert.strictEqual(isTraceEnabled(), false);
  delete process.env.WIZZ_TRACE;
});

check('trace desligado: não escreve no arquivo (custo zero)', () => {
  delete process.env.WIZZ_TRACE;
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-trace-test-'));
  try {
    const traceFile = path.join(base, 'wizz-trace.jsonl');
    process.env.WIZZ_TRACE_FILE = traceFile;
    traceLine({ ts: 'x', isTrivial: true, mode: null });
    assert.strictEqual(fs.existsSync(traceFile), false);
  } finally {
    delete process.env.WIZZ_TRACE_FILE;
    fs.rmSync(base, { recursive: true, force: true });
  }
});

check('trace ligado: grava 1 linha JSON válida por chamada (append-only)', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-trace-test-'));
  try {
    const traceFile = path.join(base, 'wizz-trace.jsonl');
    process.env.WIZZ_TRACE = '1';
    process.env.WIZZ_TRACE_FILE = traceFile;
    traceLine({ ts: 't1', isTrivial: false, mode: 'flat' });
    traceLine({ ts: 't2', isTrivial: false, mode: 'wizz' });
    const lines = fs.readFileSync(traceFile, 'utf8').trim().split('\n');
    assert.strictEqual(lines.length, 2);
    const first = JSON.parse(lines[0]);
    const second = JSON.parse(lines[1]);
    assert.strictEqual(first.mode, 'flat');
    assert.strictEqual(second.mode, 'wizz');
  } finally {
    delete process.env.WIZZ_TRACE;
    delete process.env.WIZZ_TRACE_FILE;
    fs.rmSync(base, { recursive: true, force: true });
  }
});

check('trace nunca lança mesmo se o arquivo não puder ser escrito (fail-silent)', () => {
  process.env.WIZZ_TRACE = '1';
  // Diretório em vez de arquivo: appendFileSync deve falhar e ser engolido.
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-trace-test-'));
  try {
    process.env.WIZZ_TRACE_FILE = base; // é um diretório, não um arquivo
    assert.doesNotThrow(() => traceLine({ ts: 'x' }));
  } finally {
    delete process.env.WIZZ_TRACE;
    delete process.env.WIZZ_TRACE_FILE;
    fs.rmSync(base, { recursive: true, force: true });
  }
});

console.log('test-router-hook: warning de fallback');

check('flat: warning quando routing-table-flat.md ausente no global', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-fallback-test-'));
  try {
    process.env.WIZZ_GLOBAL_SKILLS_DIR = base; // vazio: sem wizz-router/references/
    const warnings = checkFallbackWarnings(false, null);
    assert.strictEqual(warnings.length, 1);
    assert.ok(/routing-table-flat\.md/.test(warnings[0]));
  } finally {
    delete process.env.WIZZ_GLOBAL_SKILLS_DIR;
    fs.rmSync(base, { recursive: true, force: true });
  }
});

check('flat: sem warning quando routing-table-flat.md existe', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-fallback-test-'));
  try {
    const refsDir = path.join(base, 'wizz-router', 'references');
    fs.mkdirSync(refsDir, { recursive: true });
    fs.writeFileSync(path.join(refsDir, 'routing-table-flat.md'), '# ok');
    process.env.WIZZ_GLOBAL_SKILLS_DIR = base;
    assert.deepStrictEqual(checkFallbackWarnings(false, null), []);
  } finally {
    delete process.env.WIZZ_GLOBAL_SKILLS_DIR;
    fs.rmSync(base, { recursive: true, force: true });
  }
});

check('wizz: warning quando _wizz/config.toml ausente (install incompleto)', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-fallback-test-'));
  try {
    fs.mkdirSync(path.join(base, '_wizz'), { recursive: true }); // sem config.toml
    const warnings = checkFallbackWarnings(true, base);
    assert.strictEqual(warnings.length, 1);
    assert.ok(/config\.toml/.test(warnings[0]));
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

check('wizz: sem warning quando _wizz/config.toml existe', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-fallback-test-'));
  try {
    fs.mkdirSync(path.join(base, '_wizz'), { recursive: true });
    fs.writeFileSync(path.join(base, '_wizz', 'config.toml'), '');
    assert.deepStrictEqual(checkFallbackWarnings(true, base), []);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

check('getGlobalSkillsDir respeita override e cai no default (~/.claude/skills)', () => {
  delete process.env.WIZZ_GLOBAL_SKILLS_DIR;
  assert.ok(getGlobalSkillsDir().endsWith(path.join('.claude', 'skills')));
  process.env.WIZZ_GLOBAL_SKILLS_DIR = '/tmp/custom-skills';
  assert.strictEqual(getGlobalSkillsDir(), '/tmp/custom-skills');
  delete process.env.WIZZ_GLOBAL_SKILLS_DIR;
});

if (failures > 0) {
  console.error(`\ntest-router-hook: ${failures} falha(s)`);
  process.exit(1);
}
console.log('\ntest-router-hook: OK');
