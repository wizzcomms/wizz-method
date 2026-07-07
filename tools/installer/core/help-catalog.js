/**
 * `wizz-help.csv` catalog merge.
 *
 * Extracted from `Installer.mergeModuleHelpCatalogs` (installer god-object
 * breakup, A15/A17, auditoria 2026-07-07, item 3.1). Also carries
 * `parseCSVLine`/`escapeCSVField`, which used to be duplicated across the
 * installer — see the per-function comments below for the M15 rationale
 * (auditoria 2026-07-07) on why the read path now delegates to
 * `csv-parse/sync` while the write path (`escapeCSVField`) stays manual.
 */
const path = require('node:path');
const fs = require('../fs-native');
const prompts = require('../prompts');
const { getSourcePath } = require('../project-root');
const { MODULE_HELP_CSV_HEADER } = require('../modules/module-help-schema');

/**
 * Parse a CSV line, handling quoted fields.
 *
 * M15 (auditoria 2026-07-07): este método tinha um parser manual próprio,
 * convivendo com `csv-parse/sync` já usado em `_cleanupSkillDirs` /
 * `_readSkillManifestRows`. Único parser de LEITURA de CSV no installer
 * agora — csv-parse/sync fica por trás dos dois caminhos. Preserva o
 * contrato "nunca lança" do parser manual antigo: uma linha malformada
 * (aspas não fechadas, raríssimo num module-help.csv curado à mão) cai no
 * fallback e devolve a linha inteira como campo único, que o chamador já
 * descarta (`columns.length < COLUMN_COUNT - 1`).
 * @param {string} line - CSV line to parse
 * @returns {Array} Array of field values
 */
function parseCSVLine(line) {
  const { parse } = require('csv-parse/sync');
  try {
    const rows = parse(line, { relax_column_count: true, relax_quotes: true, skip_empty_lines: false });
    return rows[0] || [line];
  } catch {
    return [line];
  }
}

/**
 * Escape a CSV field if it contains special characters.
 *
 * Continua manual de propósito (M15): `csv-stringify/sync`, o par de
 * ESCRITA de `csv-parse/sync`, não é dependência deste repo (conferido em
 * package.json). Adicionar uma lib só para este método não compensa;
 * remover o parser de LEITURA duplicado já fecha a lacuna real do
 * finding.
 * @param {string} field - Field value to escape
 * @returns {string} Escaped field
 */
function escapeCSVField(field) {
  if (field === null || field === undefined) {
    return '';
  }
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape inner quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

/**
 * Merge all module-help.csv files into a single wizz-help.csv.
 * Scans all installed modules for module-help.csv and merges them.
 * Output preserves the source schema verbatim — see schema below.
 * @param {string} wizzDir - WIZZ installation directory
 * @param {Array<Object>} _agentEntries - Unused; retained for call-site compatibility
 * @param {Object} deps - Injected dependencies
 * @param {(filePath: string) => void} deps.trackFile - Records a written file as installed
 */
async function mergeModuleHelpCatalogs(wizzDir, _agentEntries = [], { trackFile }) {
  const allRows = [];
  const headerRow = MODULE_HELP_CSV_HEADER;
  const COLUMN_COUNT = 13;
  const PHASE_INDEX = 7;

  // Get all installed module directories
  const entries = await fs.readdir(wizzDir, { withFileTypes: true });
  const nonModuleDirs = new Set(['_config', '_memory', 'memory', 'docs', 'scripts', 'custom']);
  const installedModules = entries.filter((entry) => entry.isDirectory() && !nonModuleDirs.has(entry.name)).map((entry) => entry.name);

  // Add core module to scan (it's installed at root level as _config, but we check src/core-skills)
  const coreModulePath = getSourcePath('core-skills');
  const modulePaths = new Map();

  // Map all module source paths
  if (await fs.pathExists(coreModulePath)) {
    modulePaths.set('core', coreModulePath);
  }

  // Map installed module paths
  for (const moduleName of installedModules) {
    const modulePath = path.join(wizzDir, moduleName);
    modulePaths.set(moduleName, modulePath);
  }

  // Scan each module for module-help.csv
  for (const [moduleName, modulePath] of modulePaths) {
    const helpFilePath = path.join(modulePath, 'module-help.csv');

    if (await fs.pathExists(helpFilePath)) {
      try {
        const content = await fs.readFile(helpFilePath, 'utf8');
        const lines = content.split('\n').filter((line) => line.trim() && !line.startsWith('#'));

        let headerWarned = false;
        for (const line of lines) {
          // Header row: warn on drift from canonical schema, then skip.
          // Data rows are loaded positionally regardless, so the warning
          // is advisory — the maintainer should rename their columns.
          if (line.startsWith('module,')) {
            if (!headerWarned && line.trim() !== headerRow) {
              await prompts.log.warn(
                `  ${moduleName}/module-help.csv header does not match canonical schema. ` +
                  `Expected: ${headerRow} | Found: ${line.trim()} | Data loaded positionally.`,
              );
              headerWarned = true;
            }
            continue;
          }

          // Parse the line - handle quoted fields with commas
          const columns = parseCSVLine(line);
          if (columns.length < COLUMN_COUNT - 1) continue;

          // Pad short rows; truncate over-long rows
          const padded = columns.slice(0, COLUMN_COUNT);
          while (padded.length < COLUMN_COUNT) padded.push('');

          // If module column is empty, fill with this module's name
          // (core stays empty so its rows render as universal tools)
          if ((!padded[0] || padded[0].trim() === '') && moduleName !== 'core') {
            padded[0] = moduleName;
          }

          allRows.push(padded.map((c) => escapeCSVField(c)).join(','));
        }

        if (process.env.WIZZ_VERBOSE_INSTALL === 'true') {
          await prompts.log.message(`  Merged module-help from: ${moduleName}`);
        }
      } catch (error) {
        await prompts.log.warn(`  Warning: Failed to read module-help.csv from ${moduleName}: ${error.message}`);
      }
    }
  }

  // Sort by module, then phase. Stable sort preserves authored order within a phase.
  const decorated = allRows.map((row, index) => ({ row, index, cols: parseCSVLine(row) }));
  decorated.sort((a, b) => {
    const moduleA = (a.cols[0] || '').toLowerCase();
    const moduleB = (b.cols[0] || '').toLowerCase();
    if (moduleA !== moduleB) return moduleA.localeCompare(moduleB);

    const phaseA = a.cols[PHASE_INDEX] || '';
    const phaseB = b.cols[PHASE_INDEX] || '';
    if (phaseA !== phaseB) return phaseA.localeCompare(phaseB);

    return a.index - b.index;
  });
  const sortedRows = decorated.map((d) => d.row);

  // Write merged catalog
  const outputDir = path.join(wizzDir, '_config');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'wizz-help.csv');

  const mergedContent = [headerRow, ...sortedRows].join('\n');
  await fs.writeFile(outputPath, mergedContent, 'utf8');

  // Track the installed file
  trackFile(outputPath);

  if (process.env.WIZZ_VERBOSE_INSTALL === 'true') {
    await prompts.log.message(`  Generated wizz-help.csv: ${sortedRows.length} workflows`);
  }
}

module.exports = { mergeModuleHelpCatalogs, parseCSVLine, escapeCSVField };
