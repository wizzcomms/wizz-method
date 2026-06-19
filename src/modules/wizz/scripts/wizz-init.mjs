// wizz-init — aplica a personalização Wizz num projeto que já tem o BMAD instalado.
//
// O que faz (idempotente, seguro de rodar de novo):
//   1. Pergunta o idioma e o seta em _bmad/bmm/config.yaml (communication_language
//      e document_output_language).
//   2. Copia os overrides Wizz (overrides/*.toml) para _bmad/custom/, dando aos
//      agentes BMAD o tom fácil + protocolo de encerramento.
//
// Uso:
//   node src/modules/wizz/scripts/wizz-init.mjs [caminho-do-projeto] [--lang "<idioma>"]
// Sem argumento de caminho, usa o diretório atual.
// O idioma pode ser passado de forma não-interativa por flag (--lang "English")
// ou pela variável de ambiente WIZZ_LANG. Sem isso, num terminal interativo o
// script pergunta; em CI (sem TTY) usa o padrão "Português (BR)".

import { readFile, writeFile, readdir, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_LANG = 'Português (BR)';
const LANG_OPTIONS = ['Português (BR)', 'English', 'Español', 'Français', 'Deutsch', 'Italiano'];
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const overridesDir = path.resolve(__dirname, '..', 'overrides');

// Lê o idioma pedido por flag (--lang "x" / --lang=x) ou por env WIZZ_LANG.
function langFromArgs(argv) {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--lang' || a === '--language') return (argv[i + 1] || '').trim() || null;
    const m = a.match(/^--lang(?:uage)?=(.+)$/);
    if (m) return m[1].trim();
  }
  if (process.env.WIZZ_LANG && process.env.WIZZ_LANG.trim()) return process.env.WIZZ_LANG.trim();
  return null;
}

// Pergunta promisificada sobre o readline estável (node:readline).
function ask(rl, q) {
  return new Promise((resolve) => rl.question(q, resolve));
}

// Decide o idioma: flag/env > prompt interativo > padrão PT-BR (não-interativo).
async function pickLanguage(argv) {
  const fromArgs = langFromArgs(argv);
  if (fromArgs) return { lang: fromArgs, source: 'flag/env' };

  if (!stdin.isTTY) return { lang: DEFAULT_LANG, source: 'padrão (sem TTY)' };

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    console.log('Em qual idioma os agentes devem se comunicar?');
    for (const [i, opt] of LANG_OPTIONS.entries()) console.log(`  ${i + 1}) ${opt}`);
    console.log(`  ${LANG_OPTIONS.length + 1}) Outro (digitar)`);
    const raw = await ask(rl, `Escolha [1-${LANG_OPTIONS.length + 1}] (Enter = 1): `);
    const answer = raw.trim();

    if (answer === '') return { lang: LANG_OPTIONS[0], source: 'escolha' };
    const n = Number(answer);
    if (Number.isInteger(n) && n >= 1 && n <= LANG_OPTIONS.length) {
      return { lang: LANG_OPTIONS[n - 1], source: 'escolha' };
    }
    if (n === LANG_OPTIONS.length + 1) {
      const customRaw = await ask(rl, 'Digite o idioma (ex.: "Português (PT)"): ');
      const custom = customRaw.trim();
      return { lang: custom || DEFAULT_LANG, source: custom ? 'escolha' : 'padrão' };
    }
    // resposta não numérica: trata como idioma livre digitado direto
    return { lang: answer, source: 'escolha' };
  } finally {
    rl.close();
  }
}

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// Substitui (ou acrescenta) uma chave de primeiro nível num YAML simples key: value.
function upsertYamlKey(content, key, value) {
  const lines = content.split('\n');
  const re = new RegExp(`^(\\s*)${key}\\s*:.*$`);
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) {
      const indent = lines[i].match(re)[1] || '';
      lines[i] = `${indent}${key}: "${value}"`;
      return lines.join('\n');
    }
  }
  // não existe: acrescenta no fim
  if (lines.length > 0 && lines.at(-1).trim() !== '') lines.push('');
  lines.push(`${key}: "${value}"`);
  return lines.join('\n');
}

// Primeiro argumento posicional (ignora flags --x e o valor de --lang/--language).
function projectArg(argv) {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--lang' || a === '--language') {
      i++; // pula o valor da flag
      continue;
    }
    if (a.startsWith('--')) continue;
    return a;
  }
  return null;
}

async function main() {
  const projectRoot = path.resolve(projectArg(process.argv.slice(2)) || process.cwd());
  const bmadDir = path.join(projectRoot, '_bmad');

  if (!(await exists(bmadDir))) {
    throw new Error(`Não achei _bmad/ em ${projectRoot}. Rode o instalador do BMAD primeiro.`);
  }

  const done = [];

  // 1) Idioma escolhido no config do bmm.
  const { lang, source } = await pickLanguage(process.argv.slice(2));
  const bmmConfig = path.join(bmadDir, 'bmm', 'config.yaml');
  if (await exists(bmmConfig)) {
    let content = await readFile(bmmConfig, 'utf8');
    content = upsertYamlKey(content, 'communication_language', lang);
    content = upsertYamlKey(content, 'document_output_language', lang);
    await writeFile(bmmConfig, content, 'utf8');
    done.push(`idioma → "${lang}" (${source}) em _bmad/bmm/config.yaml`);
  } else {
    done.push('aviso: _bmad/bmm/config.yaml não encontrado — idioma não setado (instale o módulo bmm)');
  }

  // 2) Copia overrides Wizz para _bmad/custom/.
  const customDir = path.join(bmadDir, 'custom');
  await mkdir(customDir, { recursive: true });
  if (await exists(overridesDir)) {
    const entries = await readdir(overridesDir);
    const files = entries.filter((f) => f.endsWith('.toml'));
    for (const f of files) {
      const content = await readFile(path.join(overridesDir, f), 'utf8');
      await writeFile(path.join(customDir, f), content, 'utf8');
    }
    done.push(`${files.length} overrides Wizz copiados para _bmad/custom/`);
  }

  console.log('✅ wizz-init concluído:');
  for (const d of done) console.log(`   - ${d}`);
  console.log('\n➡️ Próximo passo: invoque o wizz-maestro e mande seu pedido. Ele escolhe o agente certo.');
}

try {
  await main();
} catch (error) {
  console.error('✗ wizz-init falhou:', error.message);
  process.exitCode = 1;
}
