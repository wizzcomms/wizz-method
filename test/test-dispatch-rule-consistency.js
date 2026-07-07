/**
 * Dispatch rule consistency (Tarefa 2.3 da auditoria, finding A1/M1).
 *
 * A regra de dispatch ("2+ áreas → maestro, sempre. Senão, conte os 3
 * fatores restantes; 2+ fatores → maestro.") é escrita à mão em 4 lugares
 * (PT-BR completo, PT-BR curto do hook, paráfrase em inglês). Nenhum build
 * gera essas 4 cópias de uma fonte única — a decisão explícita do relatório
 * (matriz 5.4) foi NÃO gerar no build e sim comparar via teste de CI.
 *
 * Este teste não compara string exata (as formulações são legitimamente
 * diferentes: PT longo, PT curto, EN). Em vez disso extrai os PARÂMETROS
 * normativos de cada fonte via regex e falha se os valores divergirem:
 *   - limiar de áreas ("2+ áreas" / "2+ areas")
 *   - limiar de fatores ("2+ fatores" / "2+ factors")
 *   - os 3 fatores contados (multi-passo, planejamento, artefato memorável)
 *
 * Usage: node test/test-dispatch-rule-consistency.js
 * Exit codes: 0 = todas as fontes concordam, 1 = divergência encontrada
 */

const fs = require('node:fs');
const path = require('node:path');

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
    console.log(`  ${colors.green}✓${colors.reset} ${testName}`);
    passed++;
  } else {
    console.log(`  ${colors.red}✗${colors.reset} ${testName}`);
    if (errorMessage) console.log(`    ${colors.dim}${errorMessage}${colors.reset}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n${colors.cyan}── ${title} ──${colors.reset}`);
}

const repoRoot = path.join(__dirname, '..');

// As 4 cópias confirmadas pelo finding A1.
const SOURCES = [
  {
    label: 'src/skills-lib/wizz-router/SKILL.md',
    file: path.join(repoRoot, 'src', 'skills-lib', 'wizz-router', 'SKILL.md'),
    marker: '**Regra de dispatch:**',
  },
  {
    label: 'src/modules/wizz/agents/wizz-maestro/SKILL.md',
    file: path.join(repoRoot, 'src', 'modules', 'wizz', 'agents', 'wizz-maestro', 'SKILL.md'),
    marker: '**Regra de dispatch:**',
  },
  {
    label: 'src/bmm-skills/4-implementation/wizz-quick-dev/SKILL.md',
    file: path.join(repoRoot, 'src', 'bmm-skills', '4-implementation', 'wizz-quick-dev', 'SKILL.md'),
    marker: '**Dispatch rule:**',
  },
  // tools/hooks/wizz-router-enforce.js: em vez de fazer regex sobre a
  // concatenação de strings no source (frágil a reformatação), chama a
  // função exportada e usa o texto normativo de fato injetado no prompt.
  { label: 'tools/hooks/wizz-router-enforce.js (buildContext)', hookFn: true },
];

// Extrai, a partir do marcador, a linha/parágrafo que contém a regra
// (até a primeira quebra de linha). Falha alto se o marcador sumir —
// sinal de que alguém reescreveu a regra sem passar por este teste.
function extractRuleLine(content, marker, label) {
  const idx = content.indexOf(marker);
  if (idx === -1) {
    throw new Error(`${label}: marcador "${marker}" não encontrado (a regra de dispatch mudou de lugar/formato?)`);
  }
  const rest = content.slice(idx);
  const endOfLine = rest.indexOf('\n');
  return (endOfLine === -1 ? rest : rest.slice(0, endOfLine)).trim();
}

// Extrai os parâmetros normativos (limiares + fatores) de um trecho de
// texto, PT-BR ou EN. Não compara string exata — só os VALORES.
function extractParams(text, label) {
  const areaMatch = text.match(/(\d+)\+\s*(?:[aá]reas|areas)/i);
  const factorMatch = text.match(/(\d+)\+\s*(?:fatores|factors)/i);
  if (!areaMatch) {
    throw new Error(`${label}: não encontrei o limiar "N+ áreas/areas" no texto: ${JSON.stringify(text)}`);
  }
  if (!factorMatch) {
    throw new Error(`${label}: não encontrei o limiar "N+ fatores/factors" no texto: ${JSON.stringify(text)}`);
  }

  const factorCategories = [];
  if (/multi-?passo|multi-?step/i.test(text)) factorCategories.push('multi-step');
  if (/planej|planning/i.test(text)) factorCategories.push('planning');
  if (/artefato|artifact/i.test(text)) factorCategories.push('artifact');

  return {
    areaThreshold: Number(areaMatch[1]),
    factorThreshold: Number(factorMatch[1]),
    factorCategories: factorCategories.sort(),
    raw: text,
  };
}

section('Extração dos parâmetros normativos das 4 fontes');

const extracted = [];
for (const source of SOURCES) {
  try {
    let text;
    if (source.hookFn) {
      const { buildContext } = require(path.join(repoRoot, 'tools', 'hooks', 'wizz-router-enforce.js'));
      text = buildContext(true); // true = contexto de projeto Wizz (onde a regra de dispatch vive)
    } else {
      const content = fs.readFileSync(source.file, 'utf8');
      text = extractRuleLine(content, source.marker, source.label);
    }
    const params = extractParams(text, source.label);
    extracted.push({ label: source.label, ...params });
    assert(
      true,
      `${source.label}: parâmetros extraídos (área ${params.areaThreshold}+, fator ${params.factorThreshold}+, fatores: ${params.factorCategories.join(', ')})`,
    );
  } catch (error) {
    assert(false, `${source.label}: falha ao extrair parâmetros`, error.message);
  }
}

if (extracted.length === SOURCES.length) {
  section('Comparação de valores entre as 4 fontes (não string exata)');

  const [baseline, ...rest] = extracted;

  assert(
    extracted.every((e) => e.areaThreshold === baseline.areaThreshold),
    `limiar de áreas consistente entre as 4 fontes (${baseline.areaThreshold}+)`,
    JSON.stringify(extracted.map((e) => ({ label: e.label, areaThreshold: e.areaThreshold }))),
  );

  assert(
    extracted.every((e) => e.factorThreshold === baseline.factorThreshold),
    `limiar de fatores consistente entre as 4 fontes (${baseline.factorThreshold}+)`,
    JSON.stringify(extracted.map((e) => ({ label: e.label, factorThreshold: e.factorThreshold }))),
  );

  assert(
    baseline.factorCategories.length === 3,
    'a fonte de referência lista os 3 fatores esperados (multi-step, planning, artifact)',
    JSON.stringify(baseline.factorCategories),
  );

  for (const source of rest) {
    assert(
      JSON.stringify(source.factorCategories) === JSON.stringify(baseline.factorCategories),
      `${source.label}: mesmos 3 fatores que ${baseline.label}`,
      `esperado ${JSON.stringify(baseline.factorCategories)}, veio ${JSON.stringify(source.factorCategories)}`,
    );
  }
} else {
  assert(false, 'todas as 4 fontes puderam ser extraídas (pré-requisito para comparar valores)');
}

console.log(`\n${colors.cyan}${'='.repeat(55)}${colors.reset}`);
console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
console.log(`  Failed: ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`);
console.log(`${colors.cyan}${'='.repeat(55)}${colors.reset}\n`);

if (failed === 0) {
  console.log(`${colors.green}✨ As 4 cópias da regra de dispatch concordam nos parâmetros normativos!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ Divergência na regra de dispatch entre as 4 fontes${colors.reset}\n`);
  process.exit(1);
}
