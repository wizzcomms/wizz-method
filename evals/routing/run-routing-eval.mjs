// run-routing-eval.mjs — avalia o roteamento do Wizz Method contra
// evals/routing/dataset.json.
//
// Dois níveis:
//   1. DETERMINÍSTICO (default, rápido, roda em CI): valida o gate isTrivial()
//      do hook wizz-router-enforce contra os rótulos do dataset.
//      - expected "trivial"        → isTrivial deve ser true
//      - expected "agent:*"/"maestro" → isTrivial deve ser false
//   2. LLM (--llm, requer `claude` CLI logado, custa tokens): para os casos
//      não-triviais, pergunta ao modelo qual a rota (agent:<area> | maestro)
//      usando a mesma regra de dispatch do Diretor/maestro e compara.
//
// Uso:
//   node evals/routing/run-routing-eval.mjs            # só determinístico
//   node evals/routing/run-routing-eval.mjs --llm      # inclui rota via LLM
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

const dataset = JSON.parse(fs.readFileSync(path.join(here, 'dataset.json'), 'utf8'));
const useLlm = process.argv.includes('--llm');
const modelIdx = process.argv.indexOf('--model');
const model = modelIdx === -1 ? 'haiku' : process.argv[modelIdx + 1];

const DISPATCH_RULE =
  'Você é o Diretor do Wizz Method. Classifique o pedido do usuário em UMA rota:\n' +
  '- "maestro": toca 2+ áreas OU 2+ fatores altos (multi-passo, precisa planejar, gera artefato pra memória).\n' +
  '- "agent:<area>": 1 área só e leve. Áreas: designer, copy, seo, growth, social, ads, qa, memoria, dev.\n' +
  'Responda SÓ com JSON: {"route":"maestro"} ou {"route":"agent:<area>"}.';

let passTrivial = 0;
let failTrivial = 0;
let passRoute = 0;
let failRoute = 0;
const failures = [];

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
}

console.log(`isTrivial: ${passTrivial}/${passTrivial + failTrivial} corretos`);
if (useLlm) {
  const total = passRoute + failRoute;
  console.log(`rota LLM (${model}): ${passRoute}/${total} corretos (${total ? Math.round((100 * passRoute) / total) : 0}%)`);
}
if (failures.length > 0) {
  console.log('\nFalhas:');
  for (const f of failures) console.log(`  ✗ ${f}`);
}

// Gate: o determinístico é obrigatório; a rota LLM é informativa (meta ≥ 90%).
process.exitCode = failTrivial > 0 ? 1 : 0;
