// `wizz trace-report` — resume o arquivo de trace local do roteamento
// (Tarefa 3.8-E2 da auditoria 360°, ver `_audit/`). Só leitura: agrega o
// JSONL escrito pelo hook global `tools/hooks/wizz-router-enforce.js`
// (função `traceLine`, opt-in via WIZZ_TRACE=1) e imprime um resumo.
//
// A fórmula do caminho do arquivo replica `getTraceFile()` de
// tools/hooks/wizz-router-enforce.js (linha ~170) — os dois arquivos vivem
// em árvores independentes (tools/hooks/ vs tools/installer/), então
// duplicar as 2 linhas é aceitável; qualquer mudança na fórmula do hook
// precisa ser espelhada aqui.

const os = require('node:os');
const path = require('node:path');
const yaml = require('yaml');
const fs = require('../fs-native');
const prompts = require('../prompts');
const { getProjectRoot } = require('../project-root');

function getTraceFile() {
  return process.env.WIZZ_TRACE_FILE || path.join(os.homedir(), '.claude', 'wizz-trace.jsonl');
}

// `--coverage` (P2 da auditoria 360°, "evals de descoberta"): cruza o
// catálogo de skills do skills-registry.yaml (fonte única, lido em runtime
// e nunca hardcoded aqui) contra os marcadores de decisão (`type:
// "decision"`, escritos por tools/hooks/wizz-decision-trace.js) já
// agregados no mesmo JSONL. Mede subutilização de roteamento: uma skill
// pode estar SELECIONADA (`sel`), DESCARTADA COM MOTIVO (`desc`, correto:
// foi considerada e explicitamente preterida) ou NUNCA CONSIDERADA (não
// aparece em nenhum dos dois arrays de nenhum trace): esta última é a
// falha de roteamento silenciosa que o item da auditoria pede pra medir.
function getRegistryFile() {
  return path.join(getProjectRoot(), 'skills-registry.yaml');
}

// Lê e parseia skills-registry.yaml, devolvendo o catálogo de ids de
// skills em ordem alfabética estável (mesma lista independente da ordem em
// que as áreas/skills aparecem no YAML). Escopo deliberado: só as skills
// `areas.*.skills[]` e as cross-cutting `utility[]` (find-skills,
// enhance-prompt, wizz-router; também são skills de verdade em
// src/skills-lib/). CLIs/MCPs/squads ficam de fora: `sel`/`desc` no
// marcador de decisão podem citar agentes ou skills (ver encerramento.md),
// mas este comando mede especificamente subutilização de SKILL, não de
// ferramenta/squad. Lança em vez de devolver `null` em erro: quem chama
// decide como reportar (fail-clear, não fail-silent: ao contrário do
// trace, o catálogo é a fonte de verdade e um erro aqui é um bug real).
function collectSkillCatalog(registryFile) {
  const raw = fs.readFileSync(registryFile, 'utf8');
  const registry = yaml.parse(raw);
  const ids = new Set();
  for (const area of Object.values(registry.areas || {})) {
    for (const skill of area.skills || []) {
      if (skill && typeof skill.id === 'string') ids.add(skill.id);
    }
  }
  for (const item of registry.utility || []) {
    if (item && typeof item.id === 'string') ids.add(item.id);
  }
  return [...ids].sort();
}

// Agrega os traces `type: "decision"` já parseados contra o catálogo.
// Função pura (mesmo espírito de `aggregate`/`aggregateLadder`), testável
// sem tocar em disco. `catalogIds` já deve vir ordenado (saída de
// `collectSkillCatalog`): a ordem de `neverConsidered` deriva dela, então
// a saída é estável entre execuções.
//
// Ids de `sel`/`desc` que não pertencem ao catálogo (ex.: agente
// "wizz-designer" em vez de skill) são ignorados aqui, não contados como
// erro: o marcador aceita os dois tipos (encerramento.md), este comando só
// mede a fatia de skills.
//
// Categorização mutuamente exclusiva por skill (soma sempre = catalogTotal):
// selecionada (apareceu em algum `sel`) > descartada-só (apareceu só em
// `desc`, nunca em `sel`) > nunca considerada (nenhum dos dois). Se uma
// skill foi selecionada numa decisão e descartada noutra, conta como
// selecionada: "foi de fato usada ao menos uma vez" pesa mais que "também
// foi preterida uma vez" para o proposito de subutilização.
function aggregateCoverage(entries, catalogIds) {
  const catalogSet = new Set(catalogIds);
  const selected = new Set();
  const discarded = new Set();
  let decisionCount = 0;

  for (const entry of entries) {
    if (!entry || entry.type !== 'decision') continue;
    const decision = entry.decision;
    if (!decision || typeof decision !== 'object') continue;
    decisionCount++;

    if (Array.isArray(decision.sel)) {
      for (const id of decision.sel) {
        if (typeof id === 'string' && catalogSet.has(id)) selected.add(id);
      }
    }
    if (Array.isArray(decision.desc)) {
      for (const pair of decision.desc) {
        if (Array.isArray(pair) && typeof pair[0] === 'string' && catalogSet.has(pair[0])) {
          discarded.add(pair[0]);
        }
      }
    }
  }

  const discardedOnly = [];
  const neverConsidered = [];
  for (const id of catalogIds) {
    if (selected.has(id)) continue;
    if (discarded.has(id)) discardedOnly.push(id);
    else neverConsidered.push(id);
  }

  return {
    catalogTotal: catalogIds.length,
    decisionCount,
    selectedCount: selected.size,
    discardedOnlyCount: discardedOnly.length,
    neverConsidered,
  };
}

function formatCoverageSummary(stats, registryFile) {
  const consideredCount = stats.catalogTotal - stats.neverConsidered.length;
  const lines = [
    `Catálogo:                ${stats.catalogTotal} skills (${registryFile})`,
    `Traces de decisão:       ${stats.decisionCount}`,
    `Selecionadas (sel):      ${stats.selectedCount} (${pct(stats.selectedCount, stats.catalogTotal)})`,
    `Descartadas c/ motivo:   ${stats.discardedOnlyCount} (${pct(stats.discardedOnlyCount, stats.catalogTotal)})`,
    `Nunca consideradas:      ${stats.neverConsidered.length} (${pct(stats.neverConsidered.length, stats.catalogTotal)})`,
    `Cobertura do catálogo:   ${pct(consideredCount, stats.catalogTotal)}`,
  ];

  if (stats.decisionCount === 0) {
    lines.push('', '(nenhum trace de decisão encontrado; rode com WIZZ_TRACE=1 e feche pedidos roteados pra gerar dados)');
  } else if (stats.neverConsidered.length === 0) {
    lines.push('', 'Nunca consideradas: nenhuma, catálogo 100% coberto.');
  } else {
    lines.push('', 'Nunca consideradas:');
    for (const id of stats.neverConsidered) lines.push(`  ${id}`);
  }

  return lines.join('\n');
}

// Faz o parse de 1 linha JSONL. Retorna `null` (em vez de lançar) para
// linhas corrompidas — fail-open, mesmo espírito do resto do framework: o
// trace nunca pode quebrar quem o lê.
function parseLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

// Agrega as entradas já parseadas em contadores/período. Função pura, sem
// I/O, para ser testável isoladamente do disco.
//
// Linhas tipadas (`type: "decision"` do marcador 🧭 e `type: "ladder"` da
// escada de modelos, ambas escritas por tools/hooks/wizz-decision-trace.js)
// são IGNORADAS aqui: são outra granularidade de evento (o fecho de um
// pedido, não o roteamento em si) e contá-las junto de trivial/mode poluiria
// as contagens. `type: "ladder"` alimenta só `aggregateLadder`, abaixo.
function aggregate(entries) {
  const byMode = { wizz: 0, flat: 0, null: 0 };
  let total = 0;
  let trivialCount = 0;
  let warningsCount = 0;
  let firstTs = null;
  let lastTs = null;

  for (const entry of entries) {
    if (entry.type === 'decision' || entry.type === 'ladder') continue;
    total++;

    if (entry.isTrivial) {
      trivialCount++;
    } else {
      const modeKey = entry.mode === 'wizz' || entry.mode === 'flat' ? entry.mode : 'null';
      byMode[modeKey]++;
      if (Array.isArray(entry.warnings) && entry.warnings.length > 0) warningsCount++;
    }

    if (typeof entry.ts === 'string') {
      if (firstTs === null || entry.ts < firstTs) firstTs = entry.ts;
      if (lastTs === null || entry.ts > lastTs) lastTs = entry.ts;
    }
  }

  return {
    total,
    trivialCount,
    routedCount: total - trivialCount,
    byMode,
    warningsCount,
    firstTs,
    lastTs,
  };
}

// Bucket de rota pra agregação da escada de modelos: agrupa qualquer
// "agent:*" (designer, copy, seo, etc.) numa única chave — o que importa
// pra aderência é "foi delegado a um agente de área", não qual área
// especificamente. `maestro` e `flat` ficam como buckets próprios; qualquer
// outro valor (ou ausência) cai em `outro`.
function ladderBucket(rota) {
  if (typeof rota !== 'string' || rota.length === 0) return 'outro';
  if (rota.startsWith('agent:')) return 'agent:*';
  if (rota === 'maestro') return 'maestro';
  if (rota === 'flat') return 'flat';
  return 'outro';
}

// Agrega as linhas `type: "ladder"` (uma por pedido roteado que fechou com
// marcador de decisão — ver wizz-decision-trace.js) em aderência à escada
// de modelos: quantos pedidos invocaram algum subagente wizz-exec-*,
// quebrado por rota. Função pura, mesmo espírito de `aggregate`.
function aggregateLadder(entries) {
  const byRoute = {};

  const bump = (bucket, invoked) => {
    if (!byRoute[bucket]) byRoute[bucket] = { total: 0, withExec: 0 };
    byRoute[bucket].total++;
    if (invoked) byRoute[bucket].withExec++;
  };

  let total = 0;
  let withExec = 0;

  for (const entry of entries) {
    if (!entry || entry.type !== 'ladder') continue;
    total++;
    const invoked = Array.isArray(entry.execs) && entry.execs.length > 0;
    if (invoked) withExec++;
    bump(ladderBucket(entry.rota), invoked);
  }

  return { total, withExec, byRoute };
}

// Percentual formatado, protegido contra divisão por zero (mostra "—" em
// vez de NaN%/Infinity% quando o denominador é 0).
function pct(part, total) {
  if (!total) return '—';
  return `${Math.round((part / total) * 100)}%`;
}

function formatSummary(stats, traceFile) {
  const lines = [
    `Arquivo:        ${traceFile}`,
    `Total de linhas: ${stats.total}`,
    `Triviais:        ${stats.trivialCount}`,
    `Roteados:        ${stats.routedCount}`,
    `  modo wizz:     ${stats.byMode.wizz}`,
    `  modo flat:     ${stats.byMode.flat}`,
    `  modo nulo:     ${stats.byMode.null}`,
    `Com warnings:    ${stats.warningsCount}`,
    `Período:         ${stats.firstTs || '—'} → ${stats.lastTs || '—'}`,
  ];
  if (stats.corruptedCount > 0) {
    lines.push(`Linhas ignoradas (corrompidas): ${stats.corruptedCount}`);
  }
  return lines.join('\n');
}

// Ordem de exibição fixa das rotas na segunda caixa — independente da ordem
// em que apareceram no arquivo, pra saída estável entre execuções.
const ROUTE_DISPLAY_ORDER = ['agent:*', 'maestro', 'flat', 'outro'];

function formatLadderSummary(ladderStats) {
  const lines = [
    `Pedidos roteados com dado de escada: ${ladderStats.total}`,
    `Invocaram algum wizz-exec-*:         ${ladderStats.withExec} (${pct(ladderStats.withExec, ladderStats.total)})`,
    'Por rota:',
  ];

  const routes = ROUTE_DISPLAY_ORDER.filter((route) => ladderStats.byRoute[route]);
  if (routes.length === 0) {
    lines.push('  (sem dados)');
  } else {
    for (const route of routes) {
      const bucket = ladderStats.byRoute[route];
      lines.push(`  ${route.padEnd(8)} ${bucket.withExec}/${bucket.total} (${pct(bucket.withExec, bucket.total)})`);
    }
  }

  return lines.join('\n');
}

module.exports = {
  command: 'trace-report',
  description: 'Resume o arquivo local de trace do roteamento (WIZZ_TRACE)',
  options: [['--coverage', 'Cruza o catálogo de skills do registry contra os traces: mede skills nunca consideradas no roteamento']],
  action: async (options) => {
    try {
      const traceFile = getTraceFile();

      if (!(await fs.pathExists(traceFile))) {
        await prompts.log.warn('Nenhum trace encontrado.');
        await prompts.log.message(`Local esperado: ${traceFile}`);
        await prompts.log.message('Rode o install e ligue o medidor de roteamento, ou exporte WIZZ_TRACE=1.');
        process.exit(0);
        return;
      }

      const raw = await fs.readFile(traceFile, 'utf8');
      const rawLines = raw.split('\n').filter((line) => line.trim().length > 0);

      const entries = [];
      let corruptedCount = 0;
      for (const line of rawLines) {
        const parsed = parseLine(line);
        if (parsed === null) {
          corruptedCount++;
        } else {
          entries.push(parsed);
        }
      }

      // `--coverage` é um modo alternativo, não aditivo: troca as 2 caixas
      // base (contagem trivial/mode e escada de modelos) por 1 caixa focada
      // em subutilização de skills. Motivo: são leituras diferentes do mesmo
      // JSONL (roteamento agregado vs catálogo x descoberta): misturar as
      // 3 caixas por padrão poluiria a saída sem ganho pro caso de uso de
      // cada flag.
      if (options.coverage) {
        const registryFile = getRegistryFile();
        let catalogIds;
        try {
          catalogIds = collectSkillCatalog(registryFile);
        } catch (error) {
          await prompts.log.error(`Não foi possível ler o catálogo de skills: ${error.message}`);
          await prompts.log.message(`Esperado em: ${registryFile}`);
          process.exit(1);
          return;
        }

        const coverageStats = aggregateCoverage(entries, catalogIds);
        await prompts.box(formatCoverageSummary(coverageStats, registryFile), 'Cobertura do Catálogo de Skills');
        process.exit(0);
        return;
      }

      const stats = { ...aggregate(entries), corruptedCount };

      await prompts.box(formatSummary(stats, traceFile), 'Wizz Trace Report');

      const ladderStats = aggregateLadder(entries);
      await prompts.box(formatLadderSummary(ladderStats), 'Aderência à Escada de Modelos');

      process.exit(0);
    } catch (error) {
      await prompts.log.error(`Trace report failed: ${error.message}`);
      if (process.env.WIZZ_DEBUG) {
        await prompts.log.message(error.stack);
      }
      process.exit(1);
    }
  },
  // Exportado só para teste unitário direto da agregação, sem precisar
  // spawnar o processo pra cada caso de borda.
  _internal: {
    aggregate,
    parseLine,
    formatSummary,
    aggregateLadder,
    ladderBucket,
    formatLadderSummary,
    pct,
    collectSkillCatalog,
    aggregateCoverage,
    formatCoverageSummary,
    getRegistryFile,
  },
};
