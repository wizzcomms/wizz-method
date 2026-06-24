const path = require('node:path');
const fs = require('../../fs-native');
const csv = require('csv-parse/sync');

/**
 * Read the global skill-manifest.csv and return the set of canonicalIds.
 * These define which directory entries in a target_dir are WIZZ-owned, regardless
 * of whether they happen to start with "wizz-" (custom modules can ship skills
 * with any prefix, e.g. "fred-cool-skill").
 *
 * @param {string} wizzDir - Path to the _wizz install directory
 * @returns {Promise<Set<string>>} Set of canonicalIds, or empty set if manifest missing
 */
async function getInstalledCanonicalIds(wizzDir) {
  const ids = new Set();
  if (!wizzDir) return ids;

  const csvPath = path.join(wizzDir, '_config', 'skill-manifest.csv');
  if (!(await fs.pathExists(csvPath))) return ids;

  try {
    const content = await fs.readFile(csvPath, 'utf8');
    const records = csv.parse(content, { columns: true, skip_empty_lines: true });
    for (const record of records) {
      if (record.canonicalId) ids.add(record.canonicalId);
    }
  } catch {
    // Unreadable/invalid manifest — treat as no info
  }

  return ids;
}

/**
 * Test whether a directory entry is WIZZ-owned.
 * Prefers the manifest's canonicalIds; falls back to the legacy "wizz" prefix
 * when no manifest is available (early install, ancestor lookup with no wizz dir).
 *
 * @param {string} entry - Directory entry name
 * @param {Set<string>|null} canonicalIds - From getInstalledCanonicalIds, or null
 * @returns {boolean}
 */
function isWizzOwnedEntry(entry, canonicalIds) {
  if (!entry || typeof entry !== 'string') return false;
  if (entry.toLowerCase().startsWith('wizz-os-')) return false;
  if (canonicalIds && canonicalIds.size > 0) return canonicalIds.has(entry);
  return entry.toLowerCase().startsWith('wizz');
}

module.exports = { getInstalledCanonicalIds, isWizzOwnedEntry };
