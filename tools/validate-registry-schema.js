/**
 * skills-registry.yaml Schema Validator
 *
 * skills-registry.yaml is the single source of truth consumed by both the
 * installer (tools/installer/ui.js, `_loadSkillsRegistry`) and the
 * router/maestro (routing decisions). Today a malformed file degrades both
 * consumers silently: `_loadSkillsRegistry()` swallows parse errors and
 * returns null, so area/MCP/CLI selection just comes back empty with no
 * warning (audit finding M11). This validator gives that SPOF a real gate:
 * it checks the minimal structure required per entry type (skills, mcps,
 * clis, squads) and fails loud — non-zero exit + explicit message — on
 * anything from unparsable YAML to a missing required field.
 *
 * Usage:
 *   node tools/validate-registry-schema.js
 *   node tools/validate-registry-schema.js --strict   (warnings also fail)
 *   node tools/validate-registry-schema.js path/to/other-registry.yaml
 */

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('yaml');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_REGISTRY_PATH = path.join(PROJECT_ROOT, 'skills-registry.yaml');

// Known "<os>", "<arch>" and "<os>-<arch>" tokens accepted by the installer's
// platform gate (see tools/installer/modules/cli-config.js `matchesPlatform`).
// Keeping this list here (not imported) on purpose: this validator must stay
// usable standalone, with zero coupling to installer internals that could
// themselves be broken by the same bad YAML it is meant to catch.
const KNOWN_OS = new Set(['darwin', 'linux', 'win32']);
const KNOWN_ARCH = new Set(['arm64', 'x64']);

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isValidPlatformToken(token) {
  if (!isNonEmptyString(token)) return false;
  if (KNOWN_OS.has(token) || KNOWN_ARCH.has(token)) return true;
  const [os, arch] = token.split('-');
  return KNOWN_OS.has(os) && KNOWN_ARCH.has(arch);
}

// "x.y.z" (3-part numeric semver) — matches what cli-config.js's
// extractVersion/compareSemver expect to parse out of a `check` command's
// output, and reused below for `metadata.version` (fase 3, item 3.7).
const SEMVER_RE = /^\d+\.\d+\.\d+$/;

/**
 * Validate the optional `metadata.version` field on any entry type (skill,
 * MCP, CLI). Added in fase 3 (item 3.7) as prep work for eventual decoupled
 * distribution: OPTIONAL everywhere, not retroactively required on existing
 * entries — see docs/governance.md "Adding Components". When present it must
 * be a plain "x.y.z" semver string, same shape as `min_version` below.
 */
function validateMetadataVersion(entry, where, errors) {
  if (!('metadata' in entry)) return;
  if (!isPlainObject(entry.metadata)) {
    errors.push(`${where}: "metadata" must be an object when present`);
    return;
  }
  if ('version' in entry.metadata) {
    const raw = entry.metadata.version;
    if (!isNonEmptyString(raw) || !SEMVER_RE.test(raw)) {
      errors.push(`${where}: "metadata.version" must be a plain "x.y.z" version (got ${JSON.stringify(raw)})`);
    }
  }
}

/**
 * Validate one skill-shaped entry ({id, when, ...}).
 * @param {*} entry
 * @param {string} where - human-readable location for error messages
 * @param {string[]} errors
 */
function validateSkillEntry(entry, where, errors) {
  if (!isPlainObject(entry)) {
    errors.push(`${where}: entry is not an object`);
    return;
  }
  if (!isNonEmptyString(entry.id)) errors.push(`${where}: missing/invalid "id"`);
  if (!isNonEmptyString(entry.when)) errors.push(`${where}: missing/invalid "when"`);
  if ('entry' in entry && typeof entry.entry !== 'boolean') {
    errors.push(`${where}: "entry" must be a boolean when present`);
  }
  if ('door' in entry && !isNonEmptyString(entry.door)) {
    errors.push(`${where}: "door" must be a non-empty string when present`);
  }
  validateMetadataVersion(entry, where, errors);
}

/**
 * Validate one MCP-shaped entry ({id, when, server: {command, args, env?}}).
 */
function validateMcpEntry(entry, where, errors) {
  if (!isPlainObject(entry)) {
    errors.push(`${where}: entry is not an object`);
    return;
  }
  if (!isNonEmptyString(entry.id)) errors.push(`${where}: missing/invalid "id"`);
  if (!isNonEmptyString(entry.when)) errors.push(`${where}: missing/invalid "when"`);
  if (!isPlainObject(entry.server)) {
    errors.push(`${where}: missing/invalid "server" object`);
    return;
  }
  if (!isNonEmptyString(entry.server.command)) errors.push(`${where}: server.command missing/invalid`);
  if (!Array.isArray(entry.server.args) || !entry.server.args.every((a) => typeof a === 'string')) {
    errors.push(`${where}: server.args must be an array of strings`);
  }
  if ('env' in entry.server) {
    if (isPlainObject(entry.server.env)) {
      for (const [key, value] of Object.entries(entry.server.env)) {
        if (typeof value !== 'string') {
          errors.push(`${where}: server.env.${key} must be a string`);
        } else if (isNonEmptyString(value) && !/^\$\{.+\}$/.test(value)) {
          // Secrets must always be placeholders — never a literal token committed to the registry.
          errors.push(`${where}: server.env.${key} looks like a literal value, expected a "\${VAR}" placeholder`);
        }
      }
    } else {
      errors.push(`${where}: server.env must be an object when present`);
    }
  }
  validateMetadataVersion(entry, where, errors);
}

/**
 * Validate one CLI-shaped entry
 * ({id, when, check, install, platform?, min_version?, verify?}).
 *
 * `min_version` (M27) and `verify` (M14) are optional fields added in the
 * fase 2 auditoria: `min_version` is compared via semver by `detectClis`
 * against whatever version the `check` command prints, so it must itself be
 * a plain "x.y.z" string the same comparator can parse. `verify` is just a
 * shell command like `check`/`install` — a non-empty string is all that is
 * required (its content is opaque to the schema, same as `check`).
 */
function validateCliEntry(entry, where, errors) {
  if (!isPlainObject(entry)) {
    errors.push(`${where}: entry is not an object`);
    return;
  }
  if (!isNonEmptyString(entry.id)) errors.push(`${where}: missing/invalid "id"`);
  if (!isNonEmptyString(entry.when)) errors.push(`${where}: missing/invalid "when"`);
  if (!isNonEmptyString(entry.check)) errors.push(`${where}: missing/invalid "check"`);
  if (!isNonEmptyString(entry.install)) errors.push(`${where}: missing/invalid "install"`);
  if ('platform' in entry) {
    const tokens = Array.isArray(entry.platform) ? entry.platform : [entry.platform];
    for (const token of tokens) {
      if (!isValidPlatformToken(token)) {
        errors.push(`${where}: invalid platform gate "${token}" (expected os/arch token like "darwin", "arm64" or "darwin-arm64")`);
      }
    }
  }
  if ('min_version' in entry) {
    const raw = entry.min_version;
    const asString = typeof raw === 'number' ? String(raw) : raw;
    if (!isNonEmptyString(asString) || !SEMVER_RE.test(asString)) {
      errors.push(`${where}: "min_version" must be a plain "x.y.z" version (got ${JSON.stringify(raw)})`);
    }
  }
  if ('verify' in entry && !isNonEmptyString(entry.verify)) {
    errors.push(`${where}: "verify" must be a non-empty string when present`);
  }
  validateMetadataVersion(entry, where, errors);
}

/**
 * Duplicate-id check scoped to a single list (accidental copy/paste within
 * the same area or the same cross-cutting block). Cross-references — the
 * same skill id pulled by two different areas — are legitimate by design
 * (e.g. "analytics-tracking" is shared by `ads` and `growth`) and must NOT
 * be flagged here.
 */
function checkDuplicateIds(list, where, errors) {
  const seen = new Map();
  for (const entry of list || []) {
    if (!entry || !isNonEmptyString(entry.id)) continue;
    seen.set(entry.id, (seen.get(entry.id) || 0) + 1);
  }
  for (const [id, count] of seen) {
    if (count > 1) errors.push(`${where}: duplicate id "${id}" (${count}x) in the same list`);
  }
}

/**
 * Validate the full registry structure. Pure function: takes the parsed
 * object, returns { errors, warnings }. Never throws — callers decide what
 * "failing loud" means for their context (process.exit, assertion, etc).
 * @param {*} registry - result of yaml.parse(readFileSync(...))
 * @returns {{errors: string[], warnings: string[]}}
 */
function validateRegistrySchema(registry) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(registry)) {
    errors.push('root: registry must parse to an object');
    return { errors, warnings };
  }

  if (typeof registry.version !== 'number') {
    errors.push('root: "version" must be a number');
  }

  if (!isPlainObject(registry.areas) || Object.keys(registry.areas).length === 0) {
    errors.push('root: "areas" must be a non-empty object');
  } else {
    for (const [areaId, area] of Object.entries(registry.areas)) {
      const base = `areas.${areaId}`;
      if (!isPlainObject(area)) {
        errors.push(`${base}: area must be an object`);
        continue;
      }
      if (!isNonEmptyString(area.agent)) errors.push(`${base}: missing/invalid "agent"`);
      if (!isNonEmptyString(area.summary)) errors.push(`${base}: missing/invalid "summary"`);

      if (Array.isArray(area.skills)) {
        for (const [i, entry] of area.skills.entries()) validateSkillEntry(entry, `${base}.skills[${i}]`, errors);
        checkDuplicateIds(area.skills, `${base}.skills`, errors);
      } else {
        errors.push(`${base}: "skills" must be an array`);
      }

      if ('mcps' in area) {
        if (Array.isArray(area.mcps)) {
          for (const [i, entry] of area.mcps.entries()) validateMcpEntry(entry, `${base}.mcps[${i}]`, errors);
          checkDuplicateIds(area.mcps, `${base}.mcps`, errors);
        } else {
          errors.push(`${base}: "mcps" must be an array when present`);
        }
      }

      if ('clis' in area) {
        if (Array.isArray(area.clis)) {
          for (const [i, entry] of area.clis.entries()) validateCliEntry(entry, `${base}.clis[${i}]`, errors);
          checkDuplicateIds(area.clis, `${base}.clis`, errors);
        } else {
          errors.push(`${base}: "clis" must be an array when present`);
        }
      }
    }
  }

  if ('utility' in registry) {
    if (Array.isArray(registry.utility)) {
      for (const [i, entry] of registry.utility.entries()) validateSkillEntry(entry, `utility[${i}]`, errors);
      checkDuplicateIds(registry.utility, 'utility', errors);
    } else {
      errors.push('root: "utility" must be an array when present');
    }
  }

  if ('mcp_utility' in registry) {
    if (Array.isArray(registry.mcp_utility)) {
      for (const [i, entry] of registry.mcp_utility.entries()) validateMcpEntry(entry, `mcp_utility[${i}]`, errors);
      checkDuplicateIds(registry.mcp_utility, 'mcp_utility', errors);
    } else {
      errors.push('root: "mcp_utility" must be an array when present');
    }
  }

  if ('cli_utility' in registry) {
    if (Array.isArray(registry.cli_utility)) {
      for (const [i, entry] of registry.cli_utility.entries()) validateCliEntry(entry, `cli_utility[${i}]`, errors);
      checkDuplicateIds(registry.cli_utility, 'cli_utility', errors);
    } else {
      errors.push('root: "cli_utility" must be an array when present');
    }
  }

  if ('squads' in registry) {
    if (isPlainObject(registry.squads)) {
      for (const [squadId, squad] of Object.entries(registry.squads)) {
        const base = `squads.${squadId}`;
        if (!isPlainObject(squad)) {
          errors.push(`${base}: squad must be an object`);
          continue;
        }
        if (!isNonEmptyString(squad.domain)) errors.push(`${base}: missing/invalid "domain"`);
        if (!isNonEmptyString(squad.when)) errors.push(`${base}: missing/invalid "when"`);
        if (!Array.isArray(squad.advises) || squad.advises.length === 0 || !squad.advises.every(isNonEmptyString)) {
          errors.push(`${base}: "advises" must be a non-empty array of non-empty strings`);
        }
      }
    } else {
      errors.push('root: "squads" must be an object when present');
    }
  }

  return { errors, warnings };
}

module.exports = { validateRegistrySchema, isValidPlatformToken };

if (require.main === module) {
  const strict = process.argv.includes('--strict');
  const targetArg = process.argv.slice(2).find((a) => !a.startsWith('--'));
  const registryPath = targetArg ? path.resolve(targetArg) : DEFAULT_REGISTRY_PATH;

  if (!fs.existsSync(registryPath)) {
    console.error(`✗ registry file not found: ${registryPath}`);
    process.exit(1);
  }

  let registry;
  try {
    registry = yaml.parse(fs.readFileSync(registryPath, 'utf8'));
  } catch (error) {
    // This is the failure mode M11 flags: a corrupted registry must be loud,
    // never a silent null that degrades routing/install with no explanation.
    console.error(`✗ ${path.relative(PROJECT_ROOT, registryPath)} failed to parse as YAML:`);
    console.error(`  ${error.message}`);
    process.exit(1);
  }

  const { errors, warnings } = validateRegistrySchema(registry);

  for (const w of warnings) console.warn(`⚠ ${w}`);
  for (const e of errors) console.error(`✗ ${e}`);

  if (errors.length > 0) {
    console.error(`\n${errors.length} schema error(s) in ${path.relative(PROJECT_ROOT, registryPath)}`);
    process.exit(1);
  }
  if (strict && warnings.length > 0) {
    console.error(`\n${warnings.length} warning(s) in ${path.relative(PROJECT_ROOT, registryPath)} (--strict)`);
    process.exit(1);
  }

  console.log(`✓ ${path.relative(PROJECT_ROOT, registryPath)} schema OK`);
  process.exit(0);
}
