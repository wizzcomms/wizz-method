// Resolução genérica de entradas por área do skills-registry.yaml.
//
// A16 (auditoria 2026-07-07): resolveMcps (mcp-config.js), resolveClis
// (cli-config.js) e resolveSkillIds (skills-lib.js) implementavam
// literalmente o mesmo algoritmo — sentinel `wantAll` -> `chosen = wantAll ?
// Object.keys(areas) : selectedAreas` -> dedupe por Map acumulando `areas[]`
// -> inclusão da lista cross-cutting (`mcp_utility`/`cli_utility`/`utility`)
// -> só a FORMA da entrada final (quais campos ela carrega) mudava por
// chamador. Esta função extrai o algoritmo; os três módulos originais viram
// wrappers finos que só declaram o que é específico deles: a chave da lista
// por área/utility, o filtro de elegibilidade (`isActionable`) e a forma dos
// campos extras (`mapEntry`).
//
// Contrato preservado: mesma assinatura pública e mesmo comportamento
// observável dos três resolvers originais. As suítes test/test-mcp-config.js,
// test/test-cli-config.js e o teste de instalação que cobre skills-lib.js são
// o safety net desta extração.

/**
 * Resolve entradas cross-cutting-aware por área, deduplicadas por `id`.
 *
 * Vazio/undefined/contendo `'all'` em `selectedAreas` significa "todas as
 * áreas" (mesmo sentinel usado pelos três resolvers originais). A lista
 * `utilityKey` no topo do registry (ex.: `mcp_utility`, `cli_utility`,
 * `utility`) é sempre incluída, independente da seleção de área.
 *
 * @param {Object} registry - skills-registry.yaml já parseado
 * @param {string[]} [selectedAreas] - Chaves de área a resolver
 * @param {Object} opts
 * @param {string} opts.listKey - Chave da lista por área (ex.: 'mcps', 'clis', 'skills')
 * @param {string} opts.utilityKey - Chave da lista cross-cutting no topo do registry
 * @param {(raw: Object) => boolean} [opts.isActionable] - Filtro extra de elegibilidade
 *   além de exigir `id` (que esta função já garante). Default: sempre true.
 * @param {(raw: Object) => Object} [opts.mapEntry] - Molda os campos extras da entrada
 *   resolvida. `id` e `areas` são sempre geridos por esta função e sobrescrevem
 *   qualquer campo homônimo devolvido por `mapEntry`. Default: devolve o objeto
 *   cru como veio do registry.
 * @returns {Array<Object>} Uma entrada por id único, com `id` + `areas: string[]`
 *   somados aos campos de `mapEntry`. Quando o mesmo id aparece em mais de uma
 *   área, `areas` acumula todas elas (a primeira ocorrência decide os demais
 *   campos, igual ao comportamento original).
 */
function resolveAreaEntries(registry, selectedAreas, opts) {
  const { listKey, utilityKey, isActionable = () => true, mapEntry = (raw) => raw } = opts;
  const byId = new Map();
  const areas = (registry && registry.areas) || {};
  const wantAll = !selectedAreas || selectedAreas.length === 0 || selectedAreas.includes('all');
  const chosen = wantAll ? Object.keys(areas) : selectedAreas;

  const add = (raw, areaKey) => {
    if (!raw || !raw.id) return;
    if (!isActionable(raw)) return;
    const existing = byId.get(raw.id);
    if (existing) {
      if (areaKey && !existing.areas.includes(areaKey)) existing.areas.push(areaKey);
      return;
    }
    byId.set(raw.id, {
      ...mapEntry(raw),
      id: raw.id,
      areas: areaKey ? [areaKey] : [],
    });
  };

  for (const area of chosen) {
    for (const raw of (areas[area] && areas[area][listKey]) || []) add(raw, area);
  }
  // A lista cross-cutting é oferecida independente da seleção de área.
  for (const raw of (registry && registry[utilityKey]) || []) add(raw, null);

  return [...byId.values()];
}

module.exports = { resolveAreaEntries };
