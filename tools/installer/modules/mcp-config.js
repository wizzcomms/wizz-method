// Configures the recommended MCP servers for the chosen skill areas.
//
// The skills-registry.yaml is the single source of truth: besides mapping each
// AREA to its skills, it declares an `mcps:` list per area (plus a top-level
// `mcp_utility:` for cross-cutting servers like context7). This module reads
// that registry, resolves the user's chosen areas to a deduped set of MCP
// entries, and MERGES the selected ones into the project's `.mcp.json`.
//
// Design rules (kept deliberately conservative):
//   - ADDITIVE: an existing server with the same id is never overwritten. The
//     user's hand-tuned config always wins; we only ADD what is missing.
//   - SECRETS STAY PLACEHOLDERS: `env` values come straight from the registry
//     as `${VAR}` placeholders. We never read, infer, or write a real token.
//   - NO-OP WHEN ABSENT: missing registry / no MCPs => returns empty, writes
//     nothing. Always safe to call.
//
// The caller decides WHICH ids to write (the interactive multiselect) and which
// to merely recommend; this module exposes the resolution + merge primitives and
// a `claude mcp add` command renderer for the recommend path.

const path = require('node:path');
const fs = require('../fs-native');

/**
 * Resolve the recommended MCP entries for the chosen areas, deduped by id.
 * Empty / undefined / containing 'all' means every area. The cross-cutting
 * `mcp_utility:` servers are always included.
 *
 * @param {Object} registry - Parsed skills-registry.yaml
 * @param {string[]} [selectedAreas] - Area keys to resolve
 * @returns {Array<{id: string, when: string, server: Object, areas: string[]}>}
 *   One entry per unique MCP id, carrying which area(s) recommended it.
 */
function resolveMcps(registry, selectedAreas) {
  const byId = new Map();
  const areas = (registry && registry.areas) || {};
  const wantAll = !selectedAreas || selectedAreas.length === 0 || selectedAreas.includes('all');
  const chosen = wantAll ? Object.keys(areas) : selectedAreas;

  const add = (mcp, areaKey) => {
    if (!mcp || !mcp.id || !mcp.server) return;
    const existing = byId.get(mcp.id);
    if (existing) {
      if (areaKey && !existing.areas.includes(areaKey)) existing.areas.push(areaKey);
      return;
    }
    byId.set(mcp.id, {
      id: mcp.id,
      when: mcp.when || '',
      server: mcp.server,
      areas: areaKey ? [areaKey] : [],
    });
  };

  for (const area of chosen) {
    for (const mcp of (areas[area] && areas[area].mcps) || []) add(mcp, area);
  }
  // Cross-cutting servers are offered regardless of area selection.
  for (const mcp of (registry && registry.mcp_utility) || []) add(mcp, null);

  return [...byId.values()];
}

/**
 * Normalize a registry `server` block into the shape written to `.mcp.json`.
 * Drops empty `args`/`env` so the output stays minimal and diff-friendly.
 * @param {Object} server - { command, args?, env? } from the registry
 * @returns {Object} Sanitized server config
 */
function toServerConfig(server) {
  const out = { command: server.command };
  if (Array.isArray(server.args) && server.args.length > 0) out.args = [...server.args];
  if (server.env && Object.keys(server.env).length > 0) out.env = { ...server.env };
  return out;
}

/**
 * Render the `claude mcp add` command for an MCP entry — used to recommend
 * servers the user chose NOT to write (nothing is lost; they can add later).
 * @param {{id: string, server: Object}} mcp - Resolved MCP entry
 * @returns {string} A copy-pasteable shell command
 */
function renderAddCommand({ id, server }) {
  const envFlags = Object.entries(server.env || {})
    .map(([k, v]) => `-e ${k}=${v}`)
    .join(' ');
  const args = (server.args || []).join(' ');
  const cmd = `${server.command}${args ? ` ${args}` : ''}`;
  return `claude mcp add ${id}${envFlags ? ` ${envFlags}` : ''} -- ${cmd}`.replaceAll(/\s+/g, ' ').trim();
}

/**
 * Merge the chosen MCP entries into `<projectDir>/.mcp.json`, additively.
 * Reads any existing file (preserving unknown keys and existing servers),
 * adds only ids not already present, and writes back pretty-printed JSON.
 *
 * @param {Object} args
 * @param {string} args.projectDir - Project root where `.mcp.json` lives
 * @param {Array<{id: string, server: Object}>} args.mcps - Entries to write
 * @param {(absPath: string) => void} [args.trackFile] - Record the written file
 * @returns {Promise<{added: string[], skipped: string[], file: string|null}>}
 *   `added` = ids newly written, `skipped` = ids already present (left intact).
 */
async function writeMcpConfig({ projectDir, mcps, trackFile = () => {} }) {
  if (!mcps || mcps.length === 0) return { added: [], skipped: [], file: null };

  const file = path.join(projectDir, '.mcp.json');
  let config = {};
  if (await fs.pathExists(file)) {
    try {
      config = JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (error) {
      throw new Error(`.mcp.json existe mas não é JSON válido: ${error.message}`);
    }
  }
  if (!config || typeof config !== 'object') config = {};
  if (!config.mcpServers || typeof config.mcpServers !== 'object') config.mcpServers = {};

  const added = [];
  const skipped = [];
  for (const mcp of mcps) {
    if (Object.prototype.hasOwnProperty.call(config.mcpServers, mcp.id)) {
      skipped.push(mcp.id); // never clobber the user's existing server
      continue;
    }
    config.mcpServers[mcp.id] = toServerConfig(mcp.server);
    added.push(mcp.id);
  }

  if (added.length === 0) return { added, skipped, file };

  await fs.writeJson(file, config, { spaces: 2 });
  trackFile(file);
  return { added, skipped, file };
}

module.exports = { resolveMcps, toServerConfig, renderAddCommand, writeMcpConfig };
