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
const fs = require('../fs-native');
const prompts = require('../prompts');

function getTraceFile() {
  return process.env.WIZZ_TRACE_FILE || path.join(os.homedir(), '.claude', 'wizz-trace.jsonl');
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
function aggregate(entries) {
  const byMode = { wizz: 0, flat: 0, null: 0 };
  let trivialCount = 0;
  let warningsCount = 0;
  let firstTs = null;
  let lastTs = null;

  for (const entry of entries) {
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
    total: entries.length,
    trivialCount,
    routedCount: entries.length - trivialCount,
    byMode,
    warningsCount,
    firstTs,
    lastTs,
  };
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

module.exports = {
  command: 'trace-report',
  description: 'Resume o arquivo local de trace do roteamento (WIZZ_TRACE)',
  options: [],
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

      const stats = { ...aggregate(entries), corruptedCount };

      await prompts.box(formatSummary(stats, traceFile), 'Wizz Trace Report');

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
  _internal: { aggregate, parseLine, formatSummary },
};
