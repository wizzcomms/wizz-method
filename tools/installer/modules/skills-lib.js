// Installs the global skills library (src/skills-lib) into the project.
//
// The skills-registry.yaml is the single source of truth: it maps each AREA
// (designer, copy, seo, growth, ...) to the skill ids that area pulls. This
// module reads that registry, resolves the user's chosen areas to a set of
// skill ids, and copies only those skill directories into `_wizz/skills-lib/`.
//
// From there the existing verbatim-skill pipeline takes over untouched:
//   collectSkills() discovers `_wizz/skills-lib/<id>/SKILL.md`
//   → writeSkillManifest() records them in `_wizz/_config/skill-manifest.csv`
//   → installVerbatimSkills() copies each into every selected IDE's skills dir.
//
// It also installs the registry itself into `_wizz/_config/` so the maestro can
// read the same file at runtime (the routing source and the install source stay
// identical by construction). Every step is a no-op when its source is missing.
//
// On top of the monolith copy, it also SLICES the registry per area into
// `_wizz/_config/registry/` (index.yaml + <area>.yaml + _shared.yaml). Area
// agents read their own slice at runtime instead of the whole ~26KB file; the
// monolith copy stays in place as the fallback/compat path (see
// generateRegistrySlices doc below for the exact shape of each slice).

const path = require('node:path');
const fs = require('../fs-native');
const yaml = require('yaml');
const { getProjectRoot, getSourcePath } = require('../project-root');
const { resolveAreaEntries } = require('./registry-resolve');

/**
 * Resolve which skill ids to install from the registry for the chosen areas.
 * Empty / undefined / containing 'all' means every area. Utility skills
 * (graphify, find-skills, ...) are cross-cutting and always included.
 *
 * Wrapper fino sobre `resolveAreaEntries` (A16): a resolução por área vive em
 * `registry-resolve.js`; aqui só sobra reduzir as entradas resolvidas ao
 * `id` (esta função nunca precisou de mais nada — nem de `areas`).
 *
 * @param {Object} registry - Parsed skills-registry.yaml
 * @param {string[]} [selectedAreas] - Area keys to install
 * @returns {string[]} Deduped skill ids
 */
function resolveSkillIds(registry, selectedAreas) {
  const entries = resolveAreaEntries(registry, selectedAreas, {
    listKey: 'skills',
    utilityKey: 'utility',
  });
  return entries.map((entry) => entry.id);
}

/**
 * Recursively collect every file path under a directory.
 * @param {string} dir - Directory to walk
 * @param {string[]} acc - Accumulator of absolute file paths
 */
async function collectFiles(dir, acc) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(full, acc);
    } else {
      acc.push(full);
    }
  }
}

const isCopyableEntry = (src) => {
  const name = path.basename(src);
  if (name === '.DS_Store' || name === 'Thumbs.db' || name === 'desktop.ini') return false;
  return !(name.startsWith('.') && name !== '.gitkeep');
};

// Header stamped on every generated slice — warns readers (humans and agents)
// not to hand-edit a file that gets clobbered on the next install.
const SLICE_HEADER =
  '# GERADO PELO INSTALLER — NÃO EDITAR (sobrescrito a cada install).\n' +
  '# Fonte única: skills-registry.yaml na raiz do repo. Esta fatia existe só\n' +
  '# para leitura leve em runtime; qualquer mudança de conteúdo vai no monólito.\n\n';

/**
 * Slice the parsed registry into `_wizz/_config/registry/`:
 *   - index.yaml: version + areas (only `agent`/`summary`) — a lightweight
 *     area→agent map for the maestro to route without loading full skill lists.
 *   - <area>.yaml: the full block for that area (skills/mcps/clis/references),
 *     wrapped as `area: <name>` + the area's own fields, for the area agent
 *     that owns it to read directly instead of the monolith.
 *   - _shared.yaml: the cross-cutting sections (utility, mcp_utility,
 *     cli_utility, squads) any agent may still need alongside its own slice.
 *
 * ALL areas are sliced regardless of `selectedAreas` — generation is cheap
 * (in-memory yaml.stringify) and this avoids a missing-slice bug if the user
 * later switches to an agent whose area wasn't installed this run.
 *
 * @param {Object} registry - Parsed skills-registry.yaml
 * @param {string} registryDir - Destination dir (`_wizz/_config/registry`)
 * @param {(absPath: string) => void} trackFile - Record an installed file
 */
async function generateRegistrySlices(registry, registryDir, trackFile) {
  await fs.ensureDir(registryDir);

  const areas = (registry && registry.areas) || {};

  const indexAreas = {};
  for (const [name, area] of Object.entries(areas)) {
    indexAreas[name] = { agent: area && area.agent, summary: area && area.summary };
  }
  const indexPath = path.join(registryDir, 'index.yaml');
  await fs.writeFile(indexPath, SLICE_HEADER + yaml.stringify({ version: registry && registry.version, areas: indexAreas }));
  trackFile(indexPath);

  for (const [name, area] of Object.entries(areas)) {
    const areaPath = path.join(registryDir, `${name}.yaml`);
    await fs.writeFile(areaPath, SLICE_HEADER + yaml.stringify({ area: name, ...area }));
    trackFile(areaPath);
  }

  const sharedPath = path.join(registryDir, '_shared.yaml');
  await fs.writeFile(
    sharedPath,
    SLICE_HEADER +
      yaml.stringify({
        utility: (registry && registry.utility) || [],
        mcp_utility: (registry && registry.mcp_utility) || [],
        cli_utility: (registry && registry.cli_utility) || [],
        squads: (registry && registry.squads) || {},
      }),
  );
  trackFile(sharedPath);
}

/**
 * Copy the area-selected skills from src/skills-lib into `_wizz/skills-lib`, and
 * the registry into `_wizz/_config/skills-registry.yaml`. No-op when sources are
 * absent (e.g. a dev tree without the library), so it is always safe to call.
 *
 * @param {Object} args
 * @param {string} args.wizzDir - Installed `_wizz` directory
 * @param {string[]} [args.selectedAreas] - Area keys; empty/undefined => all areas
 * @param {(absPath: string) => void} [args.trackFile] - Record an installed file
 * @returns {Promise<{copied: number, skipped: string[], registry: boolean}>}
 */
async function installSkillsLib({ wizzDir, selectedAreas, trackFile = () => {} }) {
  const srcLib = getSourcePath('skills-lib');
  const srcRegistry = path.join(getProjectRoot(), 'skills-registry.yaml');

  if (!(await fs.pathExists(srcLib)) || !(await fs.pathExists(srcRegistry))) {
    return { copied: 0, skipped: [], registry: false };
  }

  let registry;
  try {
    registry = yaml.parse(await fs.readFile(srcRegistry, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse skills-registry.yaml: ${error.message}`);
  }

  const ids = resolveSkillIds(registry, selectedAreas);
  const destLib = path.join(wizzDir, 'skills-lib');
  const skipped = [];
  let copied = 0;

  for (const id of ids) {
    const srcSkill = path.join(srcLib, id);
    const skillMd = path.join(srcSkill, 'SKILL.md');
    if (!(await fs.pathExists(skillMd))) {
      // A registry id with no shipped skill directory — record and skip quietly.
      skipped.push(id);
      continue;
    }

    const destSkill = path.join(destLib, id);
    await fs.remove(destSkill); // clear stale files before copy
    await fs.copy(srcSkill, destSkill, { filter: isCopyableEntry });

    const files = [];
    await collectFiles(destSkill, files);
    for (const file of files) trackFile(file);
    copied++;
  }

  // Install the registry so the maestro reads the same source at runtime.
  const destRegistry = path.join(wizzDir, '_config', 'skills-registry.yaml');
  await fs.ensureDir(path.dirname(destRegistry));
  await fs.copy(srcRegistry, destRegistry);
  trackFile(destRegistry);

  // Also slice it per area (see generateRegistrySlices) so agents can read a
  // few KB instead of the whole monolith; the copy above stays as fallback.
  const registryDir = path.join(wizzDir, '_config', 'registry');
  await generateRegistrySlices(registry, registryDir, trackFile);

  return { copied, skipped, registry: true };
}

module.exports = { installSkillsLib, resolveSkillIds, generateRegistrySlices };
