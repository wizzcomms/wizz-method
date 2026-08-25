// run-routing-eval.mjs — avalia o roteamento do Wizz Method contra
// evals/routing/dataset.json.
//
// Três níveis:
//   1. DETERMINÍSTICO (default, rápido, roda em CI): valida o gate isTrivial()
//      do hook wizz-router-enforce contra os rótulos do dataset. Também
//      valida, sempre (sem precisar de --llm), que todo id em
//      `expected_skills` de cada caso existe HOJE no catálogo do
//      skills-registry.yaml (lido em runtime, nunca hardcoded aqui);
//      isso é aviso, não falha, porque um id pode pertencer a uma skill
//      criada em paralelo por outro agente e ainda não mesclada.
//      - expected "trivial"        → isTrivial deve ser true
//      - expected "agent:*"/"maestro" → isTrivial deve ser false
//   2. LLM ROTA (--llm, requer `claude` CLI logado, custa tokens): para os
//      casos não-triviais, pergunta ao modelo qual a rota (agent:<area> |
//      maestro) usando a mesma regra de dispatch do Diretor/maestro e
//      compara.
//   3. LLM DESCOBERTA DE SKILL (--llm, P2 da auditoria 360°, "evals de
//      descoberta"): para casos com `expected_skills` não-vazio, simula o
//      passo de seleção de skill do agente da área (`expected: "agent:<area>"`)
//      dá ao modelo o catálogo real dessa área (id + when, do registry) e
//      o pedido, pede JSON no MESMO formato do marcador de decisão real
//      (`sel`/`desc`, ver encerramento.md) e verifica se cada skill
//      esperada aparece em `sel` OU em `desc` (considerada, mesmo que
//      descartada com motivo; só "nunca mencionada" é falha). Mede
//      subutilização de roteamento: uma skill relevante que o pedido nunca
//      nomeia literalmente (ex.: "carrossel pro Instagram" nunca diz
//      "canvas-design") mas que deveria ao menos ser cogitada.
//
// Uso:
//   node evals/routing/run-routing-eval.mjs            # só determinístico
//   node evals/routing/run-routing-eval.mjs --llm      # inclui rota + descoberta de skill via LLM
//   node evals/routing/run-routing-eval.mjs --llm --model haiku

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const require = createRequire(import.meta.url);
const { isTrivial } = require(path.join(repoRoot, 'tools', 'hooks', 'wizz-router-enforce.js'));
const yaml = require('yaml');

const dataset = JSON.parse(fs.readFileSync(path.join(here, 'dataset.json'), 'utf8'));
const useLlm = process.argv.includes('--llm');
const modelIdx = process.argv.indexOf('--model');
const model = modelIdx === -1 ? 'haiku' : process.argv[modelIdx + 1];

// Fonte única, lida em runtime (nunca hardcoded): mesmo skills-registry.yaml
// que o installer/router usam. Falha de leitura/parse não derruba o eval
// determinístico (isTrivial não depende do registry): só desativa as
// checagens de expected_skills, com um aviso claro.
let registry = null;
let registryError = null;
try {
  registry = yaml.parse(fs.readFileSync(path.join(repoRoot, 'skills-registry.yaml'), 'utf8'));
} catch (error) {
  registryError = error;
}

function getAreaSkills(area) {
  if (!registry || !area) return [];
  const skills = (registry.areas && registry.areas[area] && registry.areas[area].skills) || [];
  return skills.filter((s) => s && typeof s.id === 'string');
}

// Catálogo completo de ids de skill (todas as áreas), só pra checagem de
// existência, mesmo escopo de `collectSkillCatalog` em
// tools/installer/commands/trace-report.js (áreas + utility), reimplementado
// aqui em vez de importado porque aquele módulo é CJS com dependências
// próprias (prompts.js, fs-native) que não vale a pena puxar só por isto.
function collectAllSkillIds() {
  const ids = new Set();
  if (!registry) return ids;
  for (const area of Object.values(registry.areas || {})) {
    for (const skill of area.skills || []) if (skill && typeof skill.id === 'string') ids.add(skill.id);
  }
  for (const item of registry.utility || []) if (item && typeof item.id === 'string') ids.add(item.id);
  return ids;
}

const DISPATCH_RULE =
  'Você é o Diretor do Wizz Method. Classifique o pedido do usuário em UMA rota:\n' +
  '- "maestro": toca 2+ áreas OU 2+ fatores altos (multi-passo, precisa planejar, gera artefato pra memória).\n' +
  '- "agent:<area>": 1 área só e leve. Áreas: designer, copy, seo, growth, social, ads, qa, memoria, dev.\n' +
  'Responda SÓ com JSON: {"route":"maestro"} ou {"route":"agent:<area>"}.';

// Regra de seleção de skill: simula o passo que um agente de área faz DEPOIS
// de já ter sido roteado (o marcador 🧭 de encerramento.md): não a
// classificação de área em si (isso é o DISPATCH_RULE acima). Mesmo
// vocabulário sel/desc do marcador real, pra ficar simples de auditar.
const SKILL_SELECTION_RULE =
  'Você é o agente wizz da área abaixo, no Wizz Method. Dado o catálogo de skills da sua área (id e quando usar) ' +
  'e o pedido do usuário, decida quais skills você SELECIONARIA (sel) e quais você CONSIDEROU e DESCARTOU, com motivo ' +
  'curto (desc). Julgue pelo campo "quando usar" de cada skill, mesmo que o pedido não cite o nome dela literalmente. ' +
  'Responda SÓ com JSON: {"sel":["id1"],"desc":[["id2","motivo em até 6 palavras"]]}.';

function extractJsonObject(raw) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Roda a simulação de seleção de skill pra 1 caso e devolve os ids
// "nunca considerados" dentre os esperados (vazio = passou). `skipped` sinaliza
// casos que não dá pra avaliar (área desconhecida, catálogo vazio, ou nenhuma
// expected_skills sobrevive ao filtro de existência no catálogo ao vivo).
function evaluateSkillDiscovery(item, liveCatalogIds) {
  const area = typeof item.expected === 'string' && item.expected.startsWith('agent:') ? item.expected.slice('agent:'.length) : null;
  if (!area) return { skipped: true, reason: `expected "${item.expected}" não é agent:<area>` };

  const areaSkills = getAreaSkills(area);
  if (areaSkills.length === 0) return { skipped: true, reason: `área "${area}" sem skills no registry` };

  const wanted = Array.isArray(item.expected_skills) ? item.expected_skills : [];
  const liveExpected = wanted.filter((id) => liveCatalogIds.has(id));
  const droppedExpected = wanted.filter((id) => !liveCatalogIds.has(id));
  if (liveExpected.length === 0) {
    return { skipped: true, reason: 'nenhuma expected_skills existe no catálogo ao vivo', droppedExpected };
  }

  const catalogSnippet = areaSkills.map((s) => `- ${s.id}: ${s.when || '(sem descrição)'}`).join('\n');
  const prompt = `${SKILL_SELECTION_RULE}\n\nÁrea: ${area}\nCatálogo de skills:\n${catalogSnippet}\n\nPedido: ${item.prompt}`;

  const raw = execFileSync('claude', ['-p', '--model', model, '--output-format', 'text', prompt], {
    encoding: 'utf8',
    timeout: 120_000,
  });
  const parsed = extractJsonObject(raw);
  const sel = parsed && Array.isArray(parsed.sel) ? parsed.sel : [];
  const desc = parsed && Array.isArray(parsed.desc) ? parsed.desc : [];
  const considered = new Set([...sel, ...desc.map((pair) => (Array.isArray(pair) ? pair[0] : null)).filter(Boolean)]);
  const missing = liveExpected.filter((id) => !considered.has(id));
  return { skipped: false, missing, droppedExpected, sel, desc };
}

let passTrivial = 0;
let failTrivial = 0;
let passRoute = 0;
let failRoute = 0;
let passSkills = 0;
let failSkills = 0;
const failures = [];
const warnings = [];

if (registryError) {
  warnings.push(`skills-registry.yaml não pôde ser lido (${registryError.message}); checagens de expected_skills desativadas.`);
}

const liveCatalogIds = collectAllSkillIds();

// Checagem SEMPRE ativa (sem --llm, sem custo): todo id citado em
// expected_skills precisa existir HOJE no catálogo. Aviso, não falha:
// outro agente pode estar criando a skill em paralelo (ex.: launch-readiness
// na mesma leva desta auditoria) e o dataset já referenciar o id à frente do
// merge do registry.
if (registry) {
  for (const item of dataset) {
    if (!Array.isArray(item.expected_skills) || item.expected_skills.length === 0) continue;
    const missing = item.expected_skills.filter((id) => !liveCatalogIds.has(id));
    if (missing.length > 0) {
      warnings.push(`${item.id}: expected_skills ainda ausente do catálogo ao vivo: ${missing.join(', ')}`);
    }
  }
}

for (const item of dataset) {
  const expectTrivial = item.expected === 'trivial';
  const got = isTrivial(item.prompt);
  if (got === expectTrivial) {
    passTrivial++;
  } else {
    failTrivial++;
    failures.push(`[isTrivial] ${item.id}: esperado ${expectTrivial}, veio ${got} — "${item.prompt}"`);
  }

  if (useLlm && !expectTrivial) {
    try {
      const raw = execFileSync(
        'claude',
        ['-p', '--model', model, '--output-format', 'text', `${DISPATCH_RULE}\n\nPedido: ${item.prompt}`],
        { encoding: 'utf8', timeout: 120_000 },
      );
      const match = raw.match(/\{[^}]*"route"[^}]*\}/);
      const route = match ? JSON.parse(match[0]).route : null;
      if (route === item.expected) {
        passRoute++;
      } else {
        failRoute++;
        failures.push(`[route] ${item.id}: esperado ${item.expected}, veio ${route} — "${item.prompt}"`);
      }
    } catch (error) {
      failRoute++;
      failures.push(`[route] ${item.id}: erro ao rodar claude -p (${error.message.split('\n')[0]})`);
    }
  }

  if (useLlm && registry && Array.isArray(item.expected_skills) && item.expected_skills.length > 0) {
    try {
      const result = evaluateSkillDiscovery(item, liveCatalogIds);
      if (result.skipped) {
        warnings.push(`[skills] ${item.id}: pulado (${result.reason})`);
      } else if (result.missing.length === 0) {
        passSkills++;
      } else {
        failSkills++;
        failures.push(
          `[skills] ${item.id}: nunca considerou ${result.missing.join(', ')} (sel=${JSON.stringify(result.sel)} desc=${JSON.stringify(result.desc)}) "${item.prompt}"`,
        );
      }
    } catch (error) {
      failSkills++;
      failures.push(`[skills] ${item.id}: erro ao rodar claude -p (${error.message.split('\n')[0]})`);
    }
  }
}

console.log(`isTrivial: ${passTrivial}/${passTrivial + failTrivial} corretos`);
if (useLlm) {
  const total = passRoute + failRoute;
  console.log(`rota LLM (${model}): ${passRoute}/${total} corretos (${total ? Math.round((100 * passRoute) / total) : 0}%)`);
  const totalSkills = passSkills + failSkills;
  if (totalSkills > 0) {
    console.log(
      `descoberta de skill LLM (${model}): ${passSkills}/${totalSkills} corretos (${Math.round((100 * passSkills) / totalSkills)}%)`,
    );
  }
}
if (failures.length > 0) {
  console.log('\nFalhas:');
  for (const f of failures) console.log(`  ✗ ${f}`);
}
if (warnings.length > 0) {
  console.log('\nAvisos:');
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}

// Gate: o determinístico (isTrivial) é obrigatório. Rota LLM e descoberta de
// skill LLM são informativas (mesmo espírito, meta ≥ 90%): dependem do
// `claude` CLI logado e de julgamento não-determinístico do modelo, então
// nunca derrubam o exit code.
process.exitCode = failTrivial > 0 ? 1 : 0;
