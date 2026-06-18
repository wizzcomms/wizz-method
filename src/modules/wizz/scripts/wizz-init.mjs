#!/usr/bin/env node
// wizz-init — aplica a personalização Wizz num projeto que já tem o BMAD instalado.
//
// O que faz (idempotente, seguro de rodar de novo):
//   1. Seta o idioma para PT-BR em _bmad/bmm/config.yaml (communication_language
//      e document_output_language).
//   2. Copia os overrides Wizz (overrides/*.toml) para _bmad/custom/, dando aos
//      agentes BMAD o tom PT-BR fácil + protocolo de encerramento.
//
// Uso:
//   node src/modules/wizz/scripts/wizz-init.mjs [caminho-do-projeto]
// Sem argumento, usa o diretório atual.

import { readFile, writeFile, readdir, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LANG = 'Português (BR)';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const overridesDir = path.resolve(__dirname, '..', 'overrides');

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
  if (lines.length && lines.at(-1).trim() !== '') lines.push('');
  lines.push(`${key}: "${value}"`);
  return lines.join('\n');
}

async function main() {
  const projectRoot = path.resolve(process.argv[2] || process.cwd());
  const bmadDir = path.join(projectRoot, '_bmad');

  if (!(await exists(bmadDir))) {
    console.error(`✗ Não achei _bmad/ em ${projectRoot}. Rode o instalador do BMAD primeiro.`);
    process.exit(1);
  }

  const done = [];

  // 1) Idioma PT-BR no config do bmm.
  const bmmConfig = path.join(bmadDir, 'bmm', 'config.yaml');
  if (await exists(bmmConfig)) {
    let content = await readFile(bmmConfig, 'utf8');
    content = upsertYamlKey(content, 'communication_language', LANG);
    content = upsertYamlKey(content, 'document_output_language', LANG);
    await writeFile(bmmConfig, content, 'utf8');
    done.push(`idioma → "${LANG}" em _bmad/bmm/config.yaml`);
  } else {
    done.push('aviso: _bmad/bmm/config.yaml não encontrado — idioma não setado (instale o módulo bmm)');
  }

  // 2) Copia overrides Wizz para _bmad/custom/.
  const customDir = path.join(bmadDir, 'custom');
  await mkdir(customDir, { recursive: true });
  if (await exists(overridesDir)) {
    const files = (await readdir(overridesDir)).filter((f) => f.endsWith('.toml'));
    for (const f of files) {
      const src = path.join(overridesDir, f);
      const dest = path.join(customDir, f);
      await writeFile(dest, await readFile(src, 'utf8'), 'utf8');
    }
    done.push(`${files.length} overrides Wizz copiados para _bmad/custom/`);
  }

  console.log('✅ wizz-init concluído:');
  for (const d of done) console.log(`   - ${d}`);
  console.log('\n➡️ Próximo passo: invoque o wizz-maestro e mande seu pedido. Ele escolhe o agente certo.');
}

main().catch((err) => {
  console.error('✗ wizz-init falhou:', err.message);
  process.exit(1);
});
