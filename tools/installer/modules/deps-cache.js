// Writes a project-local cache manifest of the skill dependencies (CLIs + MCPs)
// resolved at install-time for the chosen areas.
//
// Behavior B of the "Doutrina de Instalação" (skills-registry.yaml, rule 2):
// when the installed skills declare NPX/CLI/MCP dependencies, detect them and
// cache the result in the project so future runs and the maestro can see —
// without re-resolving the registry or re-probing PATH — exactly which deps
// belong to this project's skills and what state they were left in:
//   - clis.installed / clis.recommended / clis.alreadyPresent
//   - mcps.written (merged into .mcp.json) / mcps.recommended
//
// This is a passive manifest (a cache, not an installer): it records the plan
// the install already executed. It never runs commands, never writes secrets
// (MCP env stays as the registry `${VAR}` placeholders), and is a no-op when
// there is nothing to record. Written into `_wizz/_config/` next to the
// installed skills-registry.yaml so the routing source and the dep cache stay
// co-located.

const path = require('node:path');
const fs = require('../fs-native');

const CACHE_BASENAME = 'skill-deps-cache.json';

/**
 * Shape a resolved CLI entry for the cache: identity + the copy-pasteable
 * install command, dropping the transient `installed` probe flag (its bucket
 * already encodes that). Returns a new object; never mutates the input.
 * @param {{id: string, when?: string, install?: string, areas?: string[]}} cli
 * @returns {{id: string, when: string, install: string, areas: string[]}}
 */
function shapeCli(cli) {
  return {
    id: cli.id,
    when: cli.when || '',
    install: cli.install || '',
    areas: Array.isArray(cli.areas) ? [...cli.areas] : [],
  };
}

/**
 * Shape a resolved MCP entry for the cache: identity + the server block as it
 * came from the registry (env values remain `${VAR}` placeholders — no real
 * token is ever cached). Returns a new object; never mutates the input.
 * @param {{id: string, when?: string, server?: Object, areas?: string[]}} mcp
 * @returns {{id: string, when: string, server: Object, areas: string[]}}
 */
function shapeMcp(mcp) {
  return {
    id: mcp.id,
    when: mcp.when || '',
    server: mcp.server ? { ...mcp.server } : {},
    areas: Array.isArray(mcp.areas) ? [...mcp.areas] : [],
  };
}

/**
 * Build the cache object from the install-time cli/mcp plans. Pure: no I/O,
 * no mutation of the inputs. Exposed for tests and for the caller to inspect.
 * @param {Object} args
 * @param {string[]} [args.selectedAreas] - Chosen area keys ([] => all areas)
 * @param {{toInstall?: Object[], toRecommend?: Object[], alreadyInstalled?: Object[]}} [args.cliPlan]
 * @param {{toWrite?: Object[], toRecommend?: Object[]}} [args.mcpPlan]
 * @returns {Object} The manifest to be written.
 */
function buildDepsCache({ selectedAreas, cliPlan = {}, mcpPlan = {} }) {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    selectedAreas: Array.isArray(selectedAreas) ? [...selectedAreas] : [],
    clis: {
      installed: (cliPlan.toInstall || []).map(shapeCli),
      recommended: (cliPlan.toRecommend || []).map(shapeCli),
      alreadyPresent: (cliPlan.alreadyInstalled || []).map(shapeCli),
    },
    mcps: {
      written: (mcpPlan.toWrite || []).map(shapeMcp),
      recommended: (mcpPlan.toRecommend || []).map(shapeMcp),
    },
  };
}

/**
 * True when a built cache has no dependency entries at all — nothing worth
 * persisting (e.g. no `bmm` module, or the chosen areas declare no deps).
 * @param {Object} cache - Output of buildDepsCache
 * @returns {boolean}
 */
function isEmptyDepsCache(cache) {
  const c = cache.clis || {};
  const m = cache.mcps || {};
  return (
    (c.installed || []).length === 0 &&
    (c.recommended || []).length === 0 &&
    (c.alreadyPresent || []).length === 0 &&
    (m.written || []).length === 0 &&
    (m.recommended || []).length === 0
  );
}

/**
 * Build and write the deps cache into `<wizzDir>/_config/skill-deps-cache.json`.
 * No-op (writes nothing, returns wrote:false) when there are no deps to record,
 * so it is always safe to call. Never throws for lack of deps; a real fs error
 * propagates to the caller, which already wraps this step in a warn-not-abort.
 *
 * @param {Object} args
 * @param {string} args.wizzDir - Installed `_wizz` directory
 * @param {string[]} [args.selectedAreas] - Chosen area keys ([] => all)
 * @param {Object} [args.cliPlan] - The install-time CLI plan (from ui.selectClis)
 * @param {Object} [args.mcpPlan] - The install-time MCP plan (from ui.selectMcps)
 * @param {(absPath: string) => void} [args.trackFile] - Record the written file
 * @returns {Promise<{wrote: boolean, file: string|null, counts: Object}>}
 */
async function writeDepsCache({ wizzDir, selectedAreas, cliPlan, mcpPlan, trackFile = () => {} }) {
  const cache = buildDepsCache({ selectedAreas, cliPlan, mcpPlan });
  const counts = {
    clisInstalled: cache.clis.installed.length,
    clisRecommended: cache.clis.recommended.length,
    clisAlreadyPresent: cache.clis.alreadyPresent.length,
    mcpsWritten: cache.mcps.written.length,
    mcpsRecommended: cache.mcps.recommended.length,
  };

  if (isEmptyDepsCache(cache)) return { wrote: false, file: null, counts };

  const file = path.join(wizzDir, '_config', CACHE_BASENAME);
  await fs.ensureDir(path.dirname(file));
  await fs.writeJson(file, cache, { spaces: 2 });
  trackFile(file);
  return { wrote: true, file, counts };
}

module.exports = {
  buildDepsCache,
  isEmptyDepsCache,
  writeDepsCache,
  shapeCli,
  shapeMcp,
  CACHE_BASENAME,
};
