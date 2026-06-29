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

const path = require('node:path');
const fs = require('../fs-native');
const yaml = require('yaml');
const { getProjectRoot, getSourcePath } = require('../project-root');

/**
 * Resolve which skill ids to install from the registry for the chosen areas.
 * Empty / undefined / containing 'all' means every area. Utility skills
 * (graphify, find-skills, ...) are cross-cutting and always included.
 * @param {Object} registry - Parsed skills-registry.yaml
 * @param {string[]} [selectedAreas] - Area keys to install
 * @returns {string[]} Deduped skill ids
 */
function resolveSkillIds(registry, selectedAreas) {
  const ids = new Set();
  const areas = (registry && registry.areas) || {};
  const wantAll = !selectedAreas || selectedAreas.length === 0 || selectedAreas.includes('all');
  const chosen = wantAll ? Object.keys(areas) : selectedAreas;

  for (const area of chosen) {
    const skills = (areas[area] && areas[area].skills) || [];
    for (const skill of skills) {
      if (skill && skill.id) ids.add(skill.id);
    }
  }
  for (const util of (registry && registry.utility) || []) {
    if (util && util.id) ids.add(util.id);
  }
  return [...ids];
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

  return { copied, skipped, registry: true };
}

module.exports = { installSkillsLib, resolveSkillIds };
