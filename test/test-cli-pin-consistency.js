/**
 * skills-registry.yaml — consistência do pin de SHA das CLIs
 *
 * Um `install:` que faz `git checkout <sha>` fixa a versão. O `check:` é quem
 * decide se aquilo já está instalado. Quando o check só pergunta "existe uma
 * pasta com esse nome?", ele responde "sim" para QUALQUER versão: o pin sobe
 * no registry, o usuário continua com o bundle antigo, e nada avisa.
 *
 * Este teste amarra os dois: toda entrada de CLI cujo `install` fixa um SHA
 * precisa citar o MESMO SHA no `check`. Assim, bumpar o pin sem atualizar o
 * check quebra o build em vez de virar drift silencioso.
 *
 * Usage: node test/test-cli-pin-consistency.js
 * Exit codes: 0 = todos os pins conferem, 1 = check e install divergem
 */

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('yaml');

const REGISTRY = path.resolve(__dirname, '..', 'skills-registry.yaml');

const RED = '[31m';
const GREEN = '[32m';
const CYAN = '[36m';
const RESET = '[0m';

const SHA_RE = /\b[0-9a-f]{40}\b/g;

function collectClis(registry) {
  const out = [];
  for (const [area, def] of Object.entries(registry.areas || {})) {
    for (const cli of def.clis || []) out.push({ ...cli, where: `areas.${area}.clis` });
  }
  for (const cli of registry.cli_utility || []) out.push({ ...cli, where: 'cli_utility' });
  return out;
}

/**
 * SHAs de 40 hex citados num comando, deduplicados.
 * @param {string} cmd - Comando do registry (check ou install)
 * @returns {string[]} SHAs únicos encontrados
 */
function shasIn(cmd) {
  return [...new Set(String(cmd || '').match(SHA_RE) || [])];
}

let failures = 0;
let pinned = 0;

console.log(`${CYAN}skills-registry.yaml — consistência do pin de SHA das CLIs${RESET}\n`);

const registry = yaml.parse(fs.readFileSync(REGISTRY, 'utf8'));

for (const cli of collectClis(registry)) {
  const installShas = shasIn(cli.install);
  if (installShas.length === 0) continue; // não é bundle fixado por SHA
  pinned += 1;

  const checkShas = shasIn(cli.check);
  const missing = installShas.filter((sha) => !checkShas.includes(sha));

  if (!cli.check) {
    failures += 1;
    console.error(`  ${RED}x${RESET} ${cli.where} → ${cli.id}: fixa SHA no install mas não tem check`);
  } else if (missing.length > 0) {
    failures += 1;
    console.error(`  ${RED}x${RESET} ${cli.where} → ${cli.id}: o check não confere o SHA fixado`);
    console.error(`      install fixa: ${missing.join(', ')}`);
    console.error(`      check   diz : ${cli.check}`);
  } else {
    console.log(`  ${GREEN}v${RESET} ${cli.id}: check confere o SHA ${installShas.join(', ')}`);
  }
}

console.log(`\n  Entradas com pin de SHA: ${pinned}`);
if (failures === 0) {
  console.log(`${GREEN}Todo pin de SHA é verificado pelo check.${RESET}`);
  process.exit(0);
}
console.error(`\n${RED}${failures} entrada(s) com check que não valida o pin.${RESET}`);
console.error('Um check que só testa "a pasta existe" aprova qualquer versão. Compare o SHA.');
process.exit(1);
