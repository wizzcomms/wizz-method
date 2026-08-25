/**
 * skills-lib <-> skills-registry.yaml Parity Test
 *
 * Guards against the "orphan skill" bug class: a skill directory ships in
 * `src/skills-lib/<id>/SKILL.md` but is never referenced by any area's
 * `skills[]` list nor by the cross-cutting `utility[]` list in
 * skills-registry.yaml. The router (wizz-router / the flat routing table)
 * can still surface such a skill by name, but the installer never copies it
 * into a project (`_wizz/skills-lib/`) — so an agent gets routed to a skill
 * that was never installed. This has already caused 2 production bugs.
 *
 * This test mirrors, on purpose, the exact "what does the installer copy"
 * rule implemented by `resolveSkillIds()` in
 * tools/installer/modules/skills-lib.js (a thin wrapper over
 * `resolveAreaEntries()` in tools/installer/modules/registry-resolve.js),
 * called with `listKey: 'skills'` and `utilityKey: 'utility'`. With no area
 * filter (the "install everything" case used here, since a skill missing
 * from EVERY area is an orphan no matter which areas a given user picks),
 * that reduces to: every `areas.*.skills[].id` plus every `utility[].id`.
 *
 * Two layers, same shape as test/test-registry-schema.js:
 *   1. Fixture-based unit tests for the two pure helpers (listing lib dirs,
 *      collecting registered ids), so the *logic* is covered independent of
 *      today's registry content.
 *   2. A regression check against the REAL src/skills-lib/ and the REAL
 *      skills-registry.yaml — this is the guard that actually catches a
 *      future orphan the moment it lands, not months later.
 *
 * Usage: node test/test-registry-lib-parity.js
 * Exit codes: 0 = no orphans (all fixture tests + real-data check pass)
 *             1 = at least one orphan skill, or a fixture test failed
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const yaml = require('yaml');

const colors = {
  reset: '[0m',
  green: '[32m',
  red: '[31m',
  yellow: '[33m',
  cyan: '[36m',
  dim: '[2m',
};

let passed = 0;
let failed = 0;

function assert(condition, testName, errorMessage = '') {
  if (condition) {
    console.log(`  ${colors.green}✓${colors.reset} ${testName}`);
    passed++;
  } else {
    console.log(`  ${colors.red}✗${colors.reset} ${testName}`);
    if (errorMessage) console.log(`    ${colors.dim}${errorMessage}${colors.reset}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n${colors.cyan}── ${title} ──${colors.reset}`);
}

// ─────────────────────────────────────────────────────────────────────────
// ALLOWLIST — intentional exceptions to the parity rule. Empty by default:
// every entry here MUST carry a comment explaining why that skill directory
// is deliberately not reachable via areas.*.skills[]/utility[] (e.g. it is
// only ever pulled in as part of an external bundle installed by a CLI
// entry's `install` command, never copied directly by resolveSkillIds()).
//
// Do NOT add `security-audit-pentest` or `ctc-align` here: both are expected
// to be registered as normal `skills[]` entries (qa area / design area). If
// either shows up as an orphan when this test runs, the fix is to register
// it in skills-registry.yaml, not to allowlist it.
// ─────────────────────────────────────────────────────────────────────────
const ALLOWLIST = new Set([]);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SKILLS_LIB_DIR = path.join(PROJECT_ROOT, 'src', 'skills-lib');
const REGISTRY_PATH = path.join(PROJECT_ROOT, 'skills-registry.yaml');

/**
 * List the immediate subdirectories of `libRoot` that are installable skills,
 * i.e. contain a `SKILL.md` file directly inside them. Nested directories
 * (references/, assets/, scripts/, or a reference skill buried under
 * `<skill>/references/.../SKILL.md`) are intentionally NOT walked — only
 * depth-1 dirs are candidates, matching what `installSkillsLib()` actually
 * copies (`path.join(srcLib, id)` for each resolved id).
 * @param {string} libRoot - absolute path to src/skills-lib
 * @returns {string[]} sorted list of installable skill directory names
 */
function listInstallableSkillDirs(libRoot) {
  let entries;
  try {
    entries = fs.readdirSync(libRoot, { withFileTypes: true });
  } catch {
    return [];
  }
  const dirs = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.')) continue;
    const skillMd = path.join(libRoot, entry.name, 'SKILL.md');
    if (fs.existsSync(skillMd)) dirs.push(entry.name);
  }
  return dirs.sort();
}

/**
 * Collect every skill id the installer can actually resolve and copy, for
 * the "install everything" case (no area filter): every
 * `areas.<area>.skills[].id` across ALL areas, plus every `utility[].id`.
 * Mirrors `resolveAreaEntries(registry, undefined, { listKey: 'skills',
 * utilityKey: 'utility' })` from tools/installer/modules/registry-resolve.js
 * without importing it, so this test stays a standalone check on the data
 * shape rather than a white-box test of that module's internals.
 * @param {Object} registry - parsed skills-registry.yaml
 * @returns {Set<string>} ids installable by at least one area selection
 */
function collectRegisteredSkillIds(registry) {
  const ids = new Set();
  const areas = (registry && registry.areas) || {};
  for (const area of Object.values(areas)) {
    for (const entry of (area && area.skills) || []) {
      if (entry && typeof entry.id === 'string' && entry.id.trim()) ids.add(entry.id);
    }
  }
  for (const entry of (registry && registry.utility) || []) {
    if (entry && typeof entry.id === 'string' && entry.id.trim()) ids.add(entry.id);
  }
  return ids;
}

/**
 * Skill-lib directories with no registered id anywhere reachable, minus the
 * documented allowlist.
 * @param {string[]} libDirs
 * @param {Set<string>} registeredIds
 * @param {Set<string>} allowlist
 * @returns {string[]} sorted orphan ids
 */
function findOrphans(libDirs, registeredIds, allowlist) {
  return libDirs.filter((id) => !registeredIds.has(id) && !allowlist.has(id)).sort();
}

// ─────────────────────────────────────────────────────────────────────────
// Layer 1 — fixture-based unit tests for the two pure helpers.
// ─────────────────────────────────────────────────────────────────────────

section('listInstallableSkillDirs — fixture directory tree');
{
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-lib-parity-'));
  try {
    // A real installable skill.
    fs.mkdirSync(path.join(tmpRoot, 'good-skill'));
    fs.writeFileSync(path.join(tmpRoot, 'good-skill', 'SKILL.md'), '# good-skill\n');

    // A shared references dir at the TOP level (no SKILL.md of its own) —
    // must be ignored, mirroring src/skills-lib/references/.
    fs.mkdirSync(path.join(tmpRoot, 'references'));
    fs.writeFileSync(path.join(tmpRoot, 'references', 'notes.md'), 'shared notes\n');

    // A skill with a NESTED reference skill under references/ — the nested
    // SKILL.md must not surface as a top-level installable id.
    fs.mkdirSync(path.join(tmpRoot, 'skill-with-refs', 'references', 'nested-topic'), { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, 'skill-with-refs', 'SKILL.md'), '# skill-with-refs\n');
    fs.writeFileSync(path.join(tmpRoot, 'skill-with-refs', 'references', 'nested-topic', 'SKILL.md'), '# nested, not installable\n');

    // A directory with assets but no SKILL.md — not an installable skill.
    fs.mkdirSync(path.join(tmpRoot, 'assets-only'));
    fs.writeFileSync(path.join(tmpRoot, 'assets-only', 'logo.png'), 'not-a-real-png');

    // A stray file at the lib root (not a directory) — must be ignored.
    fs.writeFileSync(path.join(tmpRoot, 'README.md'), 'stray file\n');

    const dirs = listInstallableSkillDirs(tmpRoot);
    assert(dirs.includes('good-skill'), 'top-level dir with SKILL.md is listed', JSON.stringify(dirs));
    assert(dirs.includes('skill-with-refs'), 'skill dir with a references/ subfolder is still listed once', JSON.stringify(dirs));
    assert(!dirs.includes('references'), 'shared top-level references/ dir (no own SKILL.md) is NOT listed');
    assert(!dirs.includes('nested-topic'), 'nested reference SKILL.md does not surface as a top-level id');
    assert(!dirs.includes('assets-only'), 'dir without SKILL.md is NOT listed');
    assert(dirs.length === 2, 'exactly the 2 real skills are listed', JSON.stringify(dirs));
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}
{
  const dirs = listInstallableSkillDirs(path.join(os.tmpdir(), 'wizz-lib-parity-does-not-exist'));
  assert(Array.isArray(dirs) && dirs.length === 0, 'missing lib root returns an empty list instead of throwing');
}

section('collectRegisteredSkillIds — fixture registry');
{
  const registry = {
    areas: {
      designer: {
        skills: [
          { id: 'taste-skill', when: 'x' },
          { id: 'impeccable', when: 'y' },
        ],
      },
      copy: {
        skills: [{ id: 'copywriting', when: 'z' }],
      },
    },
    utility: [{ id: 'graphify', when: 'w' }],
  };
  const ids = collectRegisteredSkillIds(registry);
  assert(ids.has('taste-skill') && ids.has('impeccable'), 'ids from one area are collected');
  assert(ids.has('copywriting'), 'ids from a second area are collected too (not just the first)');
  assert(ids.has('graphify'), 'utility[] ids are collected alongside area skills');
  assert(ids.size === 4, 'no extra/missing ids', JSON.stringify([...ids]));
}
{
  // An id registered only under `clis[]` or `mcps[]` does NOT count as a
  // registered SKILL id — those are different installable kinds entirely.
  const registry = {
    areas: {
      video: {
        skills: [],
        clis: [{ id: 'ctc-align-tool', when: 'x', check: 'true', install: 'true' }],
      },
    },
    utility: [],
  };
  const ids = collectRegisteredSkillIds(registry);
  assert(!ids.has('ctc-align-tool'), 'an id present only in clis[] is not treated as a registered skill id');
}
{
  const ids = collectRegisteredSkillIds({});
  assert(ids.size === 0, 'empty/malformed registry yields an empty id set instead of throwing');
}

section('findOrphans — set difference + allowlist');
{
  const libDirs = ['a', 'b', 'c'];
  const registered = new Set(['a', 'b']);
  const orphans = findOrphans(libDirs, registered, new Set());
  assert(orphans.length === 1 && orphans[0] === 'c', 'unregistered lib dir is flagged as orphan', JSON.stringify(orphans));
}
{
  const libDirs = ['a', 'b', 'c'];
  const registered = new Set(['a', 'b']);
  const orphans = findOrphans(libDirs, registered, new Set(['c']));
  assert(orphans.length === 0, 'allowlisted id is excluded from orphans', JSON.stringify(orphans));
}

// ─────────────────────────────────────────────────────────────────────────
// Layer 2 — regression: the REAL src/skills-lib/ vs the REAL registry.
// ─────────────────────────────────────────────────────────────────────────

section('Regression — real src/skills-lib/ vs real skills-registry.yaml');

const libDirs = listInstallableSkillDirs(SKILLS_LIB_DIR);

let registry = null;
let parseError = null;
try {
  registry = yaml.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
} catch (error) {
  parseError = error;
}
assert(parseError === null, 'skills-registry.yaml parses as YAML', parseError ? parseError.message : '');

const registeredIds = registry ? collectRegisteredSkillIds(registry) : new Set();
const orphans = registry ? findOrphans(libDirs, registeredIds, ALLOWLIST) : [...libDirs];

console.log(`\n${colors.cyan}── Summary ──${colors.reset}`);
console.log(`  Skills in src/skills-lib/ (have SKILL.md): ${colors.cyan}${libDirs.length}${colors.reset}`);
console.log(`  Registered skill ids (areas[].skills[] + utility[]): ${colors.cyan}${registeredIds.size}${colors.reset}`);
console.log(
  `  Orphans (in lib, not registered anywhere, not allowlisted): ${orphans.length > 0 ? colors.red : colors.green}${orphans.length}${colors.reset}`,
);

if (orphans.length > 0) {
  console.log(
    `\n  ${colors.yellow}Orphan skill directories (exist in src/skills-lib/, not reachable via skills-registry.yaml):${colors.reset}`,
  );
  for (const id of orphans) {
    console.log(`    ${colors.red}✗${colors.reset} src/skills-lib/${id}/SKILL.md — no areas.*.skills[].id or utility[].id matches "${id}"`);
  }
  console.log(
    `\n  ${colors.dim}Fix: add "- id: ${orphans[0]}" under the right area's "skills:" (or "utility:" if cross-cutting)` +
      ` in skills-registry.yaml. If this skill is intentionally not installer-reachable (e.g. it only ships as part of` +
      ` an external bundle), add it to ALLOWLIST at the top of this file with a comment explaining why.${colors.reset}`,
  );
}

assert(orphans.length === 0, 'every installable skill in src/skills-lib/ is reachable from skills-registry.yaml', JSON.stringify(orphans));

console.log(`\n${colors.cyan}${'='.repeat(55)}${colors.reset}`);
console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
console.log(`  Failed: ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`);
console.log(`${colors.cyan}${'='.repeat(55)}${colors.reset}\n`);

if (failed === 0) {
  console.log(`${colors.green}✨ All registry/lib parity tests passed!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ Some registry/lib parity tests failed${colors.reset}\n`);
  process.exit(1);
}
