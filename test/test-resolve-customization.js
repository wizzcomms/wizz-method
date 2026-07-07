/**
 * resolve_customization.py `include` Tests
 *
 * The resolver (src/scripts/resolve_customization.py) merges base/team/user
 * customize.toml layers for a Wizz skill. Tarefa 2.1 (auditoria 2026-07-07,
 * findings A11/M17) added an optional `include = ["path.md"]` key so
 * customize.toml/overrides can reference a shared markdown file instead of
 * copy-pasting the same instruction text into 15 places. This suite covers
 * the resolver directly (as a Python subprocess), not the toml content:
 *   1. a toml with `include` gets the referenced file's content injected
 *      into `activation_steps_append`, ahead of any entries already there;
 *   2. a toml without `include` resolves exactly as before (aditivo check);
 *   3. an `include` pointing at a missing file warns to stderr and fails
 *      open (resolution still succeeds, the missing content just isn't
 *      injected) — matching the resolver's existing fail-open philosophy
 *      for optional inputs.
 *
 * Usage: node test/test-resolve-customization.js
 * Exit codes: 0 = all tests pass, 1 = test failures
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

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

const SCRIPT_PATH = path.join(__dirname, '..', 'src', 'scripts', 'resolve_customization.py');

function makeTempProject() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-resolve-include-'));
  // find_project_root() walks up looking for `_wizz/` or `.git`; a bare
  // `.git` dir is enough to anchor project_root at tmpDir without needing
  // a real git repo.
  fs.mkdirSync(path.join(tmpDir, '.git'));
  return tmpDir;
}

function runResolver(skillDir, key) {
  // spawnSync (not execFileSync) so stderr is captured even when the
  // process exits 0 — the fail-open warning case needs both.
  const result = spawnSync('python3', [SCRIPT_PATH, '--skill', skillDir, '--key', key], {
    encoding: 'utf8',
  });
  return {
    code: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

// --- 1. toml with `include` resolves the referenced content ---------------
{
  const tmpDir = makeTempProject();
  const skillDir = path.join(tmpDir, 'agents', 'my-skill');
  const sharedDir = path.join(tmpDir, 'agents', '_shared');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.mkdirSync(sharedDir, { recursive: true });

  fs.writeFileSync(
    path.join(sharedDir, 'communication-rules.md'),
    ['# doc comment, dropped from the injected content', '', 'SHARED PARAGRAPH ONE.', '', 'SHARED PARAGRAPH TWO.', ''].join('\n'),
    'utf8',
  );

  fs.writeFileSync(
    path.join(skillDir, 'customize.toml'),
    [
      '[agent]',
      'name = "My Skill"',
      'include = ["../_shared/communication-rules.md"]',
      'activation_steps_append = ["AGENT SPECIFIC LINE."]',
      '',
    ].join('\n'),
    'utf8',
  );

  const result = runResolver(skillDir, 'agent.activation_steps_append');
  assert(result.code === 0, 'include: resolver exits 0', result.stderr);
  assert(result.stderr.trim() === '', 'include: no warning on stderr for an existing file', result.stderr);

  let steps = [];
  try {
    steps = JSON.parse(result.stdout)['agent.activation_steps_append'];
  } catch {
    // leave steps empty, the assertions below will fail with a clear message
  }
  assert(
    Array.isArray(steps) && steps.includes('SHARED PARAGRAPH ONE.'),
    'include: shared paragraph one is injected',
    JSON.stringify(steps),
  );
  assert(
    Array.isArray(steps) && steps.includes('SHARED PARAGRAPH TWO.'),
    'include: shared paragraph two is injected',
    JSON.stringify(steps),
  );
  assert(
    Array.isArray(steps) && !steps.some((s) => s.startsWith('#')),
    'include: the doc-comment heading block is not injected as an instruction',
    JSON.stringify(steps),
  );
  assert(
    Array.isArray(steps) && steps.at(-1) === 'AGENT SPECIFIC LINE.',
    "include: the toml's own activation_steps_append entry still appears, after the included content",
    JSON.stringify(steps),
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// --- 2. toml without `include` resolves exactly as before (aditivo) -------
{
  const tmpDir = makeTempProject();
  const skillDir = path.join(tmpDir, 'agents', 'plain-skill');
  fs.mkdirSync(skillDir, { recursive: true });

  fs.writeFileSync(
    path.join(skillDir, 'customize.toml'),
    ['[agent]', 'name = "Plain Skill"', 'activation_steps_append = ["ONLY LINE."]', ''].join('\n'),
    'utf8',
  );

  const result = runResolver(skillDir, 'agent.activation_steps_append');
  assert(result.code === 0, 'no include: resolver exits 0', result.stderr);
  assert(result.stderr.trim() === '', 'no include: no warning emitted', result.stderr);

  let steps = [];
  try {
    steps = JSON.parse(result.stdout)['agent.activation_steps_append'];
  } catch {
    // leave steps empty
  }
  assert(
    Array.isArray(steps) && steps.length === 1 && steps[0] === 'ONLY LINE.',
    'no include: array is unchanged (no injected content, no stray key)',
    JSON.stringify(steps),
  );

  const fullResult = runResolver(skillDir, 'agent');
  let agentTable = null;
  try {
    agentTable = JSON.parse(fullResult.stdout).agent;
  } catch {
    // leave null
  }
  assert(
    agentTable !== null && !Object.prototype.hasOwnProperty.call(agentTable, 'include'),
    'no include: resolved output never carries a stray `include` key',
    JSON.stringify(agentTable),
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// --- 3. `include` pointing at a missing file fails open with a warning ----
{
  const tmpDir = makeTempProject();
  const skillDir = path.join(tmpDir, 'agents', 'broken-include-skill');
  fs.mkdirSync(skillDir, { recursive: true });

  fs.writeFileSync(
    path.join(skillDir, 'customize.toml'),
    [
      '[agent]',
      'name = "Broken Include Skill"',
      'include = ["../_shared/does-not-exist.md"]',
      'activation_steps_append = ["SURVIVES."]',
      '',
    ].join('\n'),
    'utf8',
  );

  const result = runResolver(skillDir, 'agent.activation_steps_append');
  assert(result.code === 0, 'missing include: resolver still exits 0 (fail-open)', result.stderr);
  assert(/warning:.*include not found/i.test(result.stderr), 'missing include: a clear warning is written to stderr', result.stderr);

  let steps = [];
  try {
    steps = JSON.parse(result.stdout)['agent.activation_steps_append'];
  } catch {
    // leave steps empty
  }
  assert(
    Array.isArray(steps) && steps.length === 1 && steps[0] === 'SURVIVES.',
    "missing include: resolution still completes with the toml's own entries",
    JSON.stringify(steps),
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log(`\n${colors.cyan}${'='.repeat(55)}${colors.reset}`);
console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
console.log(`  Failed: ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`);
console.log(`${colors.cyan}${'='.repeat(55)}${colors.reset}\n`);

if (failed === 0) {
  console.log(`${colors.green}✨ All resolve_customization include tests passed!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ Some resolve_customization include tests failed${colors.reset}\n`);
  process.exit(1);
}
