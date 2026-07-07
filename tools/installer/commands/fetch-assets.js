// `wizz fetch-assets` — baixa sob demanda os assets pesados removidos do
// pacote npm (Tarefa 2.8 da auditoria): MP3 do huashu-design e fontes do
// canvas-design. Wrapper fino de commander sobre tools/fetch-assets.mjs (ESM
// puro, sem dependência nova) — o motor real fica lá; este arquivo só expõe
// o comando pro CLI e traduz flags/erros pro padrão dos outros comandos.
//
// `--bundle` (não posicional): o loader genérico em wizz-cli.js registra
// `program.command(name)` sem placeholder de argumento pros comandos deste
// diretório (todos os outros — install/status/uninstall — são só opções),
// então um positional aqui quebraria com "too many arguments". Mantém a
// mesma convenção do resto do CLI em vez de mexer no loader compartilhado.
//
// Por que uma flag --dest é essencial: uma skill instalada globalmente
// (~/.claude/skills/huashu-design/) ou num projeto (.claude/skills/...) é uma
// CÓPIA separada do pacote npm de origem — baixar só no pacote de origem não
// ajuda a cópia já instalada. `npx wizz-method fetch-assets --bundle
// huashu-audio --dest <pasta-da-skill>/assets`, rodado de dentro da skill
// instalada, resolve os dois casos (skill local ao repo em dev, ou instalada
// em qualquer lugar) sem a skill precisar saber onde o pacote wizz-method mora.

module.exports = {
  command: 'fetch-assets',
  description: 'Baixa sob demanda os assets pesados (MP3 do huashu-design, fontes do canvas-design)',
  options: [
    ['--bundle <name>', 'Bundle a baixar (huashu-audio | canvas-fonts)'],
    ['--dest <dir>', 'Destino da extração (default: local do bundle dentro do pacote wizz-method)'],
    ['--force', 'Ignora o cache e rebaixa mesmo se os arquivos já existirem'],
    ['--all', 'Baixa todos os bundles conhecidos'],
  ],
  action: async (options) => {
    const { fetchBundle, BUNDLES } = await import('../../fetch-assets.mjs');

    const targets = options.all ? Object.keys(BUNDLES) : options.bundle ? [options.bundle] : [];

    if (targets.length === 0) {
      console.error(
        'Uso: wizz fetch-assets --bundle <nome> [--dest <dir>] [--force]\n' +
          '     wizz fetch-assets --all\n' +
          `Bundles: ${Object.entries(BUNDLES)
            .map(([id, b]) => `\n  ${id} — ${b.description}`)
            .join('')}`,
      );
      process.exitCode = 1;
      return;
    }

    let exitCode = 0;
    for (const name of targets) {
      const meta = BUNDLES[name];
      if (!meta) {
        console.error(`✗ Bundle desconhecido: "${name}". Disponíveis: ${Object.keys(BUNDLES).join(', ')}`);
        exitCode = 1;
        continue;
      }
      try {
        const result = await fetchBundle({
          url: meta.url,
          sha256: meta.sha256,
          dest: options.dest || meta.dest,
          marker: meta.marker,
          force: options.force,
        });
        console.log(result.cached ? `✓ ${name}: já em cache (${result.dest})` : `✓ ${name}: baixado em ${result.dest}`);
      } catch (error) {
        exitCode = 1;
        console.error(`✗ ${name}: ${error.message}`);
      }
    }
    process.exitCode = exitCode;
  },
};
