/**
 * skills-registry.yaml Schema Validator Tests
 *
 * Tests validateRegistrySchema() from tools/validate-registry-schema.js
 * against constructed fixtures (valid, missing fields, wrong types,
 * duplicate ids, bad platform gates), plus two regression guards:
 *   1. the real skills-registry.yaml still passes (catches drift the moment
 *      a bad edit lands, not months later — see audit finding M11).
 *   2. genuinely broken YAML makes the CLI fail loud (non-zero exit + a
 *      clear message), instead of silently degrading like
 *      ui.js's old `_loadSkillsRegistry() { ... catch { return null; } }`.
 *
 * Usage: node test/test-registry-schema.js
 * Exit codes: 0 = all tests pass, 1 = test failures
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const yaml = require('yaml');
const { validateRegistrySchema, isValidPlatformToken } = require('../tools/validate-registry-schema.js');

const colors = {
  reset: '[0m',
  green: '[32m',
  red: '[31m',
  cyan: '[36m',
  dim: '[2m',
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

// A minimal, fully-valid registry mirroring the real shape.
function validRegistry() {
  return {
    version: 1,
    areas: {
      qa: {
        agent: 'wizz-qa',
        summary: 'QA area',
        skills: [{ id: 'adversarial-reviewer', when: 'hunt bugs' }],
        mcps: [
          {
            id: 'exa',
            when: 'web research',
            server: { command: 'npx', args: ['-y', 'exa-mcp-server@3.2.1'], env: { EXA_API_KEY: '${EXA_API_KEY}' } },
          },
        ],
        clis: [{ id: 'agent-browser', when: 'browser E2E', check: 'agent-browser --version', install: 'npm install -g agent-browser' }],
      },
      designer: {
        agent: 'wizz-designer',
        summary: 'Design area',
        skills: [{ id: 'taste-skill', when: 'anti-slop', entry: true, door: 'direcao' }],
      },
    },
    utility: [{ id: 'graphify', when: 'knowledge graph' }],
    mcp_utility: [{ id: 'context7', when: 'lib docs', server: { command: 'npx', args: ['-y', '@upstash/context7-mcp@3.2.2'] } }],
    cli_utility: [{ id: 'rtk', when: 'token economy', check: 'rtk --version', install: 'curl -fsSL https://example.test/install.sh | sh' }],
    squads: {
      'design-squad': { domain: 'Design', advises: ['designer'], when: 'design panel' },
    },
  };
}

section('validateRegistrySchema — valid registry');
{
  const { errors, warnings } = validateRegistrySchema(validRegistry());
  assert(errors.length === 0, 'minimal valid registry has zero errors', JSON.stringify(errors));
  assert(warnings.length === 0, 'minimal valid registry has zero warnings', JSON.stringify(warnings));
}

section('validateRegistrySchema — root-level errors');
{
  const { errors } = validateRegistrySchema(null);
  assert(
    errors.some((e) => e.includes('must parse to an object')),
    'null registry is rejected',
  );
}
{
  const { errors } = validateRegistrySchema('not an object');
  assert(
    errors.some((e) => e.includes('must parse to an object')),
    'scalar (string) registry is rejected',
  );
}
{
  const reg = { ...validRegistry(), version: '1' };
  const { errors } = validateRegistrySchema(reg);
  assert(
    errors.some((e) => e.includes('"version"')),
    'string version is rejected (must be a number)',
  );
}
{
  const reg = { ...validRegistry(), areas: {} };
  const { errors } = validateRegistrySchema(reg);
  assert(
    errors.some((e) => e.includes('"areas"')),
    'empty areas object is rejected',
  );
}

section('validateRegistrySchema — area-level errors');
{
  const reg = validRegistry();
  delete reg.areas.qa.agent;
  const { errors } = validateRegistrySchema(reg);
  assert(errors.includes('areas.qa: missing/invalid "agent"'), 'area missing "agent" is caught', JSON.stringify(errors));
}
{
  const reg = validRegistry();
  delete reg.areas.qa.summary;
  const { errors } = validateRegistrySchema(reg);
  assert(errors.includes('areas.qa: missing/invalid "summary"'), 'area missing "summary" is caught');
}
{
  const reg = validRegistry();
  reg.areas.qa.skills = 'not-an-array';
  const { errors } = validateRegistrySchema(reg);
  assert(errors.includes('areas.qa: "skills" must be an array'), 'non-array "skills" is caught');
}

section('validateRegistrySchema — skill entry errors');
{
  const reg = validRegistry();
  reg.areas.qa.skills.push({ when: 'no id here' });
  const { errors } = validateRegistrySchema(reg);
  assert(
    errors.some((e) => e.includes('missing/invalid "id"')),
    'skill entry missing id is caught',
  );
}
{
  const reg = validRegistry();
  reg.areas.qa.skills.push({ id: 'x' });
  const { errors } = validateRegistrySchema(reg);
  assert(
    errors.some((e) => e.includes('missing/invalid "when"')),
    'skill entry missing when is caught',
  );
}
{
  const reg = validRegistry();
  reg.areas.designer.skills[0].entry = 'yes'; // must be boolean
  const { errors } = validateRegistrySchema(reg);
  assert(
    errors.some((e) => e.includes('"entry" must be a boolean')),
    'skill entry with non-boolean "entry" is caught',
  );
}

section('validateRegistrySchema — metadata.version (fase 3, item 3.7)');
{
  // Optional field: absent entirely is fine (no error), even on the real
  // registry's dozens of pre-existing entries (checked separately below).
  const reg = validRegistry();
  const { errors } = validateRegistrySchema(reg);
  assert(errors.length === 0, 'entries without "metadata" at all are still valid', JSON.stringify(errors));
}
{
  const reg = validRegistry();
  reg.areas.qa.skills[0].metadata = { version: '1.0.0' };
  const { errors } = validateRegistrySchema(reg);
  assert(errors.length === 0, 'skill entry with a valid "metadata.version" (x.y.z) passes', JSON.stringify(errors));
}
{
  const reg = validRegistry();
  reg.areas.qa.skills[0].metadata = { version: '1.0' }; // not x.y.z
  const { errors } = validateRegistrySchema(reg);
  assert(
    errors.some((e) => e.includes('"metadata.version" must be a plain "x.y.z" version')),
    'skill entry with a malformed "metadata.version" is caught',
    JSON.stringify(errors),
  );
}
{
  const reg = validRegistry();
  reg.areas.qa.mcps[0].metadata = 'not-an-object';
  const { errors } = validateRegistrySchema(reg);
  assert(
    errors.some((e) => e.includes('"metadata" must be an object')),
    'MCP entry with non-object "metadata" is caught',
    JSON.stringify(errors),
  );
}

section('validateRegistrySchema — MCP entry errors');
{
  const reg = validRegistry();
  delete reg.areas.qa.mcps[0].server;
  const { errors } = validateRegistrySchema(reg);
  assert(
    errors.some((e) => e.includes('missing/invalid "server"')),
    'mcp entry missing server object is caught',
  );
}
{
  const reg = validRegistry();
  reg.areas.qa.mcps[0].server.args = 'exa-mcp-server'; // must be array
  const { errors } = validateRegistrySchema(reg);
  assert(
    errors.some((e) => e.includes('server.args must be an array')),
    'mcp entry with non-array server.args is caught',
  );
}
{
  const reg = validRegistry();
  reg.areas.qa.mcps[0].server.env = { EXA_API_KEY: 'sk-live-1234567890' }; // literal secret, not a placeholder
  const { errors } = validateRegistrySchema(reg);
  assert(
    errors.some((e) => e.includes('expected a "${VAR}" placeholder')),
    'mcp entry with a literal (non-placeholder) secret value is caught',
  );
}

section('validateRegistrySchema — CLI entry errors + platform gate');
{
  const reg = validRegistry();
  delete reg.areas.qa.clis[0].install;
  const { errors } = validateRegistrySchema(reg);
  assert(
    errors.some((e) => e.includes('missing/invalid "install"')),
    'cli entry missing install is caught',
  );
}
{
  const reg = validRegistry();
  reg.areas.qa.clis[0].platform = 'macos-m1'; // not a recognized token
  const { errors } = validateRegistrySchema(reg);
  assert(
    errors.some((e) => e.includes('invalid platform gate')),
    'unrecognized platform gate token is caught',
  );
}
{
  assert(isValidPlatformToken('darwin-arm64'), 'darwin-arm64 is a valid platform token');
  assert(isValidPlatformToken('darwin'), 'bare "darwin" is a valid platform token');
  assert(isValidPlatformToken('arm64'), 'bare "arm64" is a valid platform token');
  assert(!isValidPlatformToken('macos'), '"macos" (not a real node os token) is invalid');
  assert(!isValidPlatformToken(''), 'empty string is invalid');
}

section('validateRegistrySchema — squads');
{
  const reg = validRegistry();
  delete reg.squads['design-squad'].domain;
  const { errors } = validateRegistrySchema(reg);
  assert(
    errors.some((e) => e.includes('missing/invalid "domain"')),
    'squad missing domain is caught',
  );
}
{
  const reg = validRegistry();
  reg.squads['design-squad'].advises = [];
  const { errors } = validateRegistrySchema(reg);
  assert(
    errors.some((e) => e.includes('"advises" must be a non-empty array')),
    'squad with empty advises list is caught',
  );
}

section('validateRegistrySchema — duplicate ids');
{
  // Same id twice in the SAME list (accidental copy/paste) is an error.
  const reg = validRegistry();
  reg.areas.qa.skills.push({ id: 'adversarial-reviewer', when: 'duplicate on purpose' });
  const { errors } = validateRegistrySchema(reg);
  assert(
    errors.some((e) => e.includes('duplicate id "adversarial-reviewer"')),
    'duplicate id within the same list is caught',
  );
}
{
  // The SAME skill id pulled by two DIFFERENT areas is legitimate by design
  // (e.g. the real registry shares "analytics-tracking" between ads/growth)
  // and must NOT be flagged.
  const reg = validRegistry();
  reg.areas.designer.skills.push({ id: 'adversarial-reviewer', when: 'shared across areas, this is fine' });
  const { errors } = validateRegistrySchema(reg);
  assert(
    !errors.some((e) => e.includes('duplicate id "adversarial-reviewer"')),
    'same id shared across two different areas is NOT flagged as duplicate',
    JSON.stringify(errors),
  );
}

section('Regression — the real skills-registry.yaml');
{
  const registryPath = path.join(__dirname, '..', 'skills-registry.yaml');
  const registry = yaml.parse(fs.readFileSync(registryPath, 'utf8'));
  const { errors } = validateRegistrySchema(registry);
  assert(errors.length === 0, 'real skills-registry.yaml passes schema validation', JSON.stringify(errors, null, 2));
}

section('Regression — CLI fails loud on invalid YAML (never silently degrades)');
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-registry-schema-'));
  const brokenPath = path.join(tmpDir, 'broken-registry.yaml');
  // Deliberately malformed YAML: unclosed bracket.
  fs.writeFileSync(brokenPath, 'version: 1\nareas: [unterminated\n');
  const scriptPath = path.join(__dirname, '..', 'tools', 'validate-registry-schema.js');

  let threw = false;
  let output = '';
  try {
    execFileSync('node', [scriptPath, brokenPath], { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    threw = true;
    output = `${error.stdout || ''}${error.stderr || ''}`;
  }
  assert(threw, 'invalid YAML makes the CLI exit non-zero (fails loud, no silent null)');
  assert(/failed to parse/i.test(output), 'invalid YAML produces an explicit parse-error message', output);

  fs.rmSync(tmpDir, { recursive: true, force: true });
}
{
  // A structurally valid YAML file that still fails schema rules (missing
  // required fields) must also exit non-zero, distinct from a parse error.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-registry-schema-'));
  const invalidSchemaPath = path.join(tmpDir, 'invalid-schema-registry.yaml');
  fs.writeFileSync(invalidSchemaPath, 'version: 1\nareas:\n  qa: {}\n');
  const scriptPath = path.join(__dirname, '..', 'tools', 'validate-registry-schema.js');

  let threw = false;
  let output = '';
  try {
    execFileSync('node', [scriptPath, invalidSchemaPath], { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    threw = true;
    output = `${error.stdout || ''}${error.stderr || ''}`;
  }
  assert(threw, 'schema-invalid (but parseable) YAML makes the CLI exit non-zero');
  assert(/schema error/i.test(output), 'schema errors are reported explicitly', output);

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log(`\n${colors.cyan}${'='.repeat(55)}${colors.reset}`);
console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
console.log(`  Failed: ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`);
console.log(`${colors.cyan}${'='.repeat(55)}${colors.reset}\n`);

if (failed === 0) {
  console.log(`${colors.green}✨ All registry schema tests passed!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ Some registry schema tests failed${colors.reset}\n`);
  process.exit(1);
}
