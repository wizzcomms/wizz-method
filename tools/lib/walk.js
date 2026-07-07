// Walk de arquivos/diretórios compartilhado pelos validadores do repo.
//
// M15 (auditoria 2026-07-07): `walkFiles` + skip-dirs estava reimplementado
// de forma divergente em validate-method-refs.js e validate-file-refs.js, e
// validate-skills.js tinha dois walks próprios (um de diretórios de skill,
// outro de arquivos dentro de uma skill). Esta lib extrai o padrão comum
// (recursão + skip-dirs) sem impor um comportamento único: cada chamador
// passa as opções (`skipDirs`, `extensions`) que preservam o que já tinha.
//
// Uso: `require('../tools/lib/walk')` a partir de qualquer validador em
// tools/*.js (CommonJS, igual aos validadores).

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_SKIP_DIRS = new Set(['node_modules', '.git']);

/**
 * Coleta recursivamente os caminhos de arquivo sob `root`.
 *
 * - Se `root` for um arquivo (não diretório), devolve `[root]` (respeitando
 *   o filtro de extensão) — permite tratar um arquivo solto e um diretório
 *   pela mesma chamada (comportamento herdado de
 *   validate-method-refs.js:walkFiles, que recebe tanto `README.md` quanto
 *   `docs/` na mesma lista `SCAN_ROOTS`).
 * - `skipDirs`: nomes de diretório a pular, comparados com `entry.name`
 *   (não é path completo). Default: `{node_modules, .git}`.
 * - `extensions`: `Set<string>` de extensões (com ponto, ex: `.md`) a
 *   incluir. Omitido/null = todos os arquivos (comportamento herdado de
 *   validate-skills.js:collectSkillFiles, que não filtra por extensão).
 *
 * @param {string} root - Caminho absoluto (arquivo ou diretório)
 * @param {{skipDirs?: Set<string>, extensions?: Set<string>|null}} [opts]
 * @returns {string[]} Caminhos absolutos, em ordem de descoberta (não ordenado)
 */
function walkFiles(root, opts = {}) {
  const skipDirs = opts.skipDirs || DEFAULT_SKIP_DIRS;
  const extensions = opts.extensions || null;
  if (!fs.existsSync(root)) return [];

  const matches = (file) => !extensions || extensions.has(path.extname(file));

  const stat = fs.statSync(root);
  if (stat.isFile()) return matches(root) ? [root] : [];

  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.isFile()) {
        const full = path.join(dir, entry.name);
        if (matches(full)) files.push(full);
      }
    }
  };
  walk(root);
  return files;
}

/**
 * Encontra, recursivamente sob cada diretório em `rootDirs`, os diretórios
 * que contêm diretamente o arquivo `markerFile` (ex.: `SKILL.md`). Continua
 * descendo mesmo depois de achar um marcador (skills podem estar aninhadas).
 *
 * Usado por validate-skills.js:discoverSkillDirs para descobrir skills sem
 * reimplementar o walk de novo.
 *
 * @param {string[]} rootDirs - Diretórios raiz onde procurar
 * @param {string} markerFile - Nome do arquivo marcador (ex.: 'SKILL.md')
 * @param {{skipDirs?: Set<string>}} [opts]
 * @returns {string[]} Diretórios (absolutos) que contêm o marcador, ordenados
 */
function findDirsWithFile(rootDirs, markerFile, opts = {}) {
  const skipDirs = opts.skipDirs || DEFAULT_SKIP_DIRS;
  const found = [];

  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || skipDirs.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (fs.existsSync(path.join(full, markerFile))) found.push(full);
      walk(full);
    }
  };

  for (const rootDir of rootDirs) walk(rootDir);
  return found.sort();
}

module.exports = { walkFiles, findDirsWithFile, DEFAULT_SKIP_DIRS };
