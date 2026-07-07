// Parsers de frontmatter compartilhados pelos validadores do repo.
//
// M15 (auditoria 2026-07-07): `parseFrontmatter` estava reimplementado em
// validate-method-refs.js (via `yaml.parse`, estrito) e 2x em
// validate-skills.js (parser manual linha-a-linha, tolerante). As três
// variantes têm comportamento DIFERENTE de propósito — cada validador
// depende de nuances distintas — então esta lib não as funde numa só; ela
// só para de duplicar a implementação, centralizando as 3 num único lugar
// com nome próprio para cada uma:
//   - parseFrontmatterYaml: `yaml.parse` real (estrito: só reconhece o
//     fechamento `\n---\n`; um `---` final sem newline devolve null).
//   - parseFrontmatterSimple: parser manual linha-a-linha; ignora linhas
//     indentadas (valores aninhados) e NÃO junta continuações multi-linha.
//   - parseFrontmatterMultiline: parser manual que junta continuações de
//     valor (descriptions que ocupam várias linhas) na mesma chave.
// parseFrontmatterSimple e parseFrontmatterMultiline aceitam o fechamento
// tolerante (`---` final sem newline) que parseFrontmatterYaml não aceita —
// preservando o comportamento exato que validate-skills.js já tinha.

const yaml = require('yaml');

/**
 * Remove aspas simples/duplas envolvendo o valor, se houver.
 * @param {string} value
 * @returns {string}
 */
function stripQuotes(value) {
  if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * Extrai o bloco de frontmatter (texto entre os `---`), sem parsear.
 * @param {string} content - Conteúdo completo do arquivo
 * @param {{lenient?: boolean}} [opts] - `lenient`: aceita também um `---`
 *   final sem newline de fechamento (ex.: arquivo termina em `\n---`)
 * @returns {string|null} Bloco de frontmatter, ou null se não houver
 */
function frontmatterBlock(content, { lenient = false } = {}) {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith('---')) return null;

  let end = trimmed.indexOf('\n---\n', 3);
  if (end === -1) {
    if (lenient && trimmed.endsWith('\n---')) {
      end = trimmed.length - 4;
    } else {
      return null;
    }
  }
  return trimmed.slice(3, end);
}

/**
 * Parse de frontmatter via YAML real. Fechamento estrito (`\n---\n`); um
 * `---` final sem newline devolve null, igual ao comportamento original de
 * validate-method-refs.js.
 * @param {string} content
 * @returns {Object|null} Objeto parseado, ou null se não houver frontmatter
 *   válido (ausente, sem fechamento, ou YAML inválido)
 */
function parseFrontmatterYaml(content) {
  const block = frontmatterBlock(content, { lenient: false });
  if (block === null) return null;
  try {
    return yaml.parse(block);
  } catch {
    return null;
  }
}

/**
 * Parse manual linha-a-linha: só reconhece pares `chave: valor` na coluna 0;
 * linhas indentadas (valores aninhados) são ignoradas; nenhuma continuação
 * multi-linha é aplicada. Fechamento tolerante (aceita `---` final sem
 * newline).
 * @param {string} content
 * @returns {Object|null} Objeto com pares chave/valor, ou null se não houver
 *   frontmatter
 */
function parseFrontmatterSimple(content) {
  const block = frontmatterBlock(content, { lenient: true });
  if (block === null) return null;

  const fmBlock = block.trim();
  if (fmBlock === '') return {};

  const result = {};
  for (const line of fmBlock.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    if (line[0] === ' ' || line[0] === '\t') continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    result[key] = stripQuotes(value);
  }
  return result;
}

/**
 * Parse manual que junta continuações de valor multi-linha (ex.:
 * `description:` que ocupa várias linhas) na mesma chave. Fechamento
 * tolerante (aceita `---` final sem newline). Linhas de comentário YAML
 * (`#`) dentro de uma continuação são ignoradas.
 * @param {string} content
 * @returns {Object|null} Objeto com pares chave/valor, ou null se não houver
 *   frontmatter
 */
function parseFrontmatterMultiline(content) {
  const block = frontmatterBlock(content, { lenient: true });
  if (block === null) return null;

  const fmBlock = block.trim();
  if (fmBlock === '') return {};

  const result = {};
  let currentKey = null;
  let currentValue = '';

  for (const line of fmBlock.split('\n')) {
    const colonIndex = line.indexOf(':');
    // Nova chave: precisa começar na coluna 0 (sem indentação) e ter ':'.
    if (colonIndex > 0 && line[0] !== ' ' && line[0] !== '\t') {
      if (currentKey !== null) result[currentKey] = stripQuotes(currentValue.trim());
      currentKey = line.slice(0, colonIndex).trim();
      currentValue = line.slice(colonIndex + 1);
    } else if (currentKey !== null) {
      if (line.trimStart().startsWith('#')) continue;
      currentValue += '\n' + line;
    }
  }
  if (currentKey !== null) result[currentKey] = stripQuotes(currentValue.trim());

  return result;
}

module.exports = { parseFrontmatterYaml, parseFrontmatterSimple, parseFrontmatterMultiline, stripQuotes, frontmatterBlock };
