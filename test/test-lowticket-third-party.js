/**
 * Módulo lowticket — guarda de material de terceiro
 *
 * O conhecimento em src/modules/lowticket/ é uma DESTILAÇÃO: fato, número,
 * checklist e análise, escritos do zero. A fonte bruta (aula, PDF assinado,
 * transcrição, prompt comprado) fica na máquina do autor, fora do npm.
 *
 * O porte da base local para o módulo é semi-automático (o passe mecânico é
 * um script no projeto de origem, e alguns arquivos são mantidos à mão). Um
 * re-porte descuidado desfaz os ajustes manuais e traz de volta citação
 * verbatim e nome de produto de terceiro — foi exatamente o que aconteceu uma
 * vez durante a construção do módulo. Este teste é a trava: falha alto quando
 * isso volta a acontecer.
 *
 * Usage: node test/test-lowticket-third-party.js
 * Exit codes: 0 = limpo, 1 = achou material que não pode ser publicado
 */

const fs = require('node:fs');
const path = require('node:path');

const MODULE_DIR = path.resolve(__dirname, '..', 'src', 'modules', 'lowticket');
const PROJECT_ROOT = path.resolve(__dirname, '..');

const RED = '[31m';
const GREEN = '[32m';
const CYAN = '[36m';
const RESET = '[0m';

// Nome próprio de produto, autor ou cliente que não pode viajar no pacote.
const BANNED_NAMES = [
  [/\bfranklim\b/i, 'nome do autor da fonte de origem'],
  [/\bthe scale compound\b/i, 'nome da mentoria de origem'],
  [/\bezgi\b/i, 'ferramenta citada pela fonte, nomeada'],
  [/\bdeivyson\b/i, 'perfil de terceiro'],
  [/\bgle digital\b/i, 'empresa de terceiro'],
  [/\bequipa invis[íi]vel\b/i, 'nome de cliente'],
  [/\bthalita\b/i, 'nome de cliente'],
  [/\bmindmeister\b/i, 'contabilidade local, não é conhecimento'],
];

// Caminho que só existe na máquina do autor. O terceiro campo, quando
// presente, é o único arquivo autorizado a citar aquele caminho.
const BANNED_PATHS = [
  [/base\/fontes\b/, 'pasta local de fontes brutas'],
  // swipe-file.md é o arquivo que DOCUMENTA o caminho convencional de fallback
  // (passo 3 da resolução), então é o único lugar onde ele pode aparecer.
  [/base\/criativos\b/, 'pasta local do swipe file (só references/swipe-file.md pode citar)', 'swipe-file.md'],
  [/\/Users\//, 'caminho absoluto da máquina do autor'],
  [/\bObsidian Vault\b/, 'vault pessoal'],
];

// Citação verbatim: linha de blockquote que abre com aspas. Parágrafo em
// blockquote é análise própria e passa; `> "..."` é fala de outra pessoa
// colada, e é justamente o que não pode ser republicado.
const VERBATIM_QUOTE = /^>\s*"/;

// Citação de arquivo-fonte. (.md e .html ficam de fora: o módulo cita os
// próprios shards em backtick.)
const SOURCE_FILE_CITE = /`[^`\n]*\.(?:pdf|docx|txt)`/i;

let failures = 0;
let filesScanned = 0;

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(md|ya?ml)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

function report(file, line, text, why) {
  failures += 1;
  console.error(`  ${RED}x${RESET} ${path.relative(PROJECT_ROOT, file)}:${line} — ${why}`);
  console.error(`      ${text.trim().slice(0, 120)}`);
}

console.log(`${CYAN}Módulo lowticket — guarda de material de terceiro${RESET}\n`);

if (!fs.existsSync(MODULE_DIR)) {
  console.error(`Módulo não encontrado em ${MODULE_DIR}`);
  process.exit(1);
}

for (const file of walk(MODULE_DIR)) {
  filesScanned += 1;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (const [i, text] of lines.entries()) {
    const lineNo = i + 1;
    for (const [regex, why] of BANNED_NAMES) if (regex.test(text)) report(file, lineNo, text, why);
    for (const [regex, why, allowedIn] of BANNED_PATHS) {
      if (allowedIn && path.basename(file) === allowedIn) continue;
      if (regex.test(text)) report(file, lineNo, text, why);
    }
    if (VERBATIM_QUOTE.test(text)) report(file, lineNo, text, 'citação verbatim de terceiro (blockquote com aspas)');
    if (SOURCE_FILE_CITE.test(text)) report(file, lineNo, text, 'citação de arquivo-fonte local');
  }
}

console.log(`  Arquivos verificados: ${filesScanned}`);
if (failures === 0) {
  console.log(`${GREEN}Nada de terceiro no módulo lowticket.${RESET}`);
  process.exit(0);
}
console.error(`\n${RED}${failures} ocorrência(s).${RESET}`);
console.error('Reescreva com as suas palavras, ou tire. Regra: escreva o fato, nunca a frase.');
process.exit(1);
