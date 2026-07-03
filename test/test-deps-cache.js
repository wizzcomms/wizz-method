/**
 * Deps Cache Module Tests
 *
 * Unit tests for tools/installer/modules/deps-cache.js — the install-time
 * project-local cache manifest of the skill dependencies (CLIs + MCPs) resolved
 * for the chosen areas. Mirrors the mcp-config / cli-config test style.
 *
 * Pure logic (buildDepsCache/isEmptyDepsCache/shapeCli/shapeMcp) is
 * deterministic. writeDepsCache does real fs I/O, so it writes into a temp dir
 * that is cleaned up after each write test — no project tree is touched.
 *
 * Usage: node test/test-deps-cache.js
 */

const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

const {
  buildDepsCache,
  isEmptyDepsCache,
  writeDepsCache,
  shapeCli,
  shapeMcp,
  CACHE_BASENAME,
} = require('../tools/installer/modules/deps-cache');

const colors = {
  reset: '\u001B[0m',
  green: '\u001B[32m',
  red: '\u001B[31m',
  cyan: '\u001B[36m',
  dim: '\u001B[2m',
};

let passed = 0;
let failed = 0;

function assert(condition, testName, errorMessage = '') {
  if (condition) {
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    passed++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (errorMessage) console.log(`  ${colors.dim}${errorMessage}${colors.reset}`);
    failed++;
  }
}

const sampleCliPlan = {
  toInstall: [{ id: 'agent-browser', when: 'browser E2E', install: 'npm install -g agent-browser', areas: ['qa'] }],
  toRecommend: [{ id: 'rtk', when: 'token economy', install: 'curl ... | sh', areas: [] }],
  alreadyInstalled: [{ id: 'distribb', when: 'seo distribution', install: 'npx skills add x', areas: ['seo'], installed: true }],
};

const sampleMcpPlan = {
  toWrite: [
    {
      id: 'supabase',
      when: 'run SQL',
      server: { command: 'npx', args: ['-y', 'x'], env: { SUPABASE_ACCESS_TOKEN: '${SUPABASE_ACCESS_TOKEN}' } },
      areas: ['architect'],
    },
  ],
  toRecommend: [{ id: 'context7', when: 'docs', server: { command: 'npx', args: ['-y', 'y'] }, areas: [] }],
};

console.log(`\n${colors.cyan}buildDepsCache${colors.reset}\n`);

{
  const cache = buildDepsCache({ selectedAreas: ['qa', 'architect'], cliPlan: sampleCliPlan, mcpPlan: sampleMcpPlan });
  assert(cache.version === 1, 'stamps version 1');
  assert(Array.isArray(cache.selectedAreas) && cache.selectedAreas.length === 2, 'records selectedAreas');
  assert(typeof cache.generatedAt === 'string' && cache.generatedAt.includes('T'), 'stamps ISO generatedAt');
  assert(cache.clis.installed.length === 1 && cache.clis.installed[0].id === 'agent-browser', 'buckets installed CLIs');
  assert(cache.clis.recommended.length === 1 && cache.clis.recommended[0].id === 'rtk', 'buckets recommended CLIs');
  assert(cache.clis.alreadyPresent.length === 1 && cache.clis.alreadyPresent[0].id === 'distribb', 'buckets already-present CLIs');
  assert(cache.mcps.written.length === 1 && cache.mcps.written[0].id === 'supabase', 'buckets written MCPs');
  assert(cache.mcps.recommended.length === 1 && cache.mcps.recommended[0].id === 'context7', 'buckets recommended MCPs');
}

{
  // Immutability: buildDepsCache must not mutate the input plans.
  const cliPlan = structuredClone(sampleCliPlan);
  const mcpPlan = structuredClone(sampleMcpPlan);
  const before = JSON.stringify({ cliPlan, mcpPlan });
  buildDepsCache({ selectedAreas: [], cliPlan, mcpPlan });
  assert(JSON.stringify({ cliPlan, mcpPlan }) === before, 'does not mutate the input plans');
}

{
  // Secrets stay placeholders — no real token ever leaks into the cache.
  const cache = buildDepsCache({ selectedAreas: [], cliPlan: {}, mcpPlan: sampleMcpPlan });
  assert(cache.mcps.written[0].server.env.SUPABASE_ACCESS_TOKEN === '${SUPABASE_ACCESS_TOKEN}', 'keeps MCP env as ${VAR} placeholder');
}

{
  // The transient `installed` probe flag from detectClis is dropped.
  const shaped = shapeCli({ id: 'x', install: 'i', installed: true, areas: ['a'] });
  assert(shaped.installed === undefined, 'shapeCli drops transient installed flag');
  assert(shaped.areas.length === 1 && shaped.areas[0] === 'a', 'shapeCli copies areas');
}

{
  const shaped = shapeMcp({ id: 'x', server: { command: 'npx' } });
  assert(shaped.server.command === 'npx' && shaped.when === '', 'shapeMcp defaults when to empty string');
}

console.log(`\n${colors.cyan}isEmptyDepsCache${colors.reset}\n`);

{
  const empty = buildDepsCache({ selectedAreas: [], cliPlan: {}, mcpPlan: {} });
  assert(isEmptyDepsCache(empty) === true, 'empty plans => empty cache');
  const full = buildDepsCache({ selectedAreas: [], cliPlan: sampleCliPlan, mcpPlan: {} });
  assert(isEmptyDepsCache(full) === false, 'any CLI => not empty');
  const mcpOnly = buildDepsCache({ selectedAreas: [], cliPlan: {}, mcpPlan: { toRecommend: sampleMcpPlan.toRecommend } });
  assert(isEmptyDepsCache(mcpOnly) === false, 'any MCP => not empty');
}

console.log(`\n${colors.cyan}writeDepsCache${colors.reset}\n`);

async function withTempWizzDir(fn) {
  const wizzDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-deps-cache-'));
  try {
    return await fn(wizzDir);
  } finally {
    fs.rmSync(wizzDir, { recursive: true, force: true });
  }
}

(async () => {
  await withTempWizzDir(async (wizzDir) => {
    const tracked = [];
    const res = await writeDepsCache({
      wizzDir,
      selectedAreas: ['qa'],
      cliPlan: sampleCliPlan,
      mcpPlan: sampleMcpPlan,
      trackFile: (p) => tracked.push(p),
    });
    assert(res.wrote === true, 'writes when there are deps');
    const expected = path.join(wizzDir, '_config', CACHE_BASENAME);
    assert(res.file === expected, 'writes into _config/skill-deps-cache.json');
    assert(fs.existsSync(expected), 'file exists on disk');
    assert(tracked.length === 1 && tracked[0] === expected, 'tracks the written file');
    const onDisk = JSON.parse(fs.readFileSync(expected, 'utf8'));
    assert(onDisk.clis.installed[0].id === 'agent-browser', 'on-disk JSON is the cache');
    assert(res.counts.clisInstalled === 1 && res.counts.mcpsWritten === 1, 'returns counts');
  });

  await withTempWizzDir(async (wizzDir) => {
    const tracked = [];
    const res = await writeDepsCache({
      wizzDir,
      selectedAreas: [],
      cliPlan: {},
      mcpPlan: {},
      trackFile: (p) => tracked.push(p),
    });
    assert(res.wrote === false, 'no-op when there are no deps');
    assert(res.file === null, 'returns null file on no-op');
    assert(tracked.length === 0, 'tracks nothing on no-op');
    assert(!fs.existsSync(path.join(wizzDir, '_config', CACHE_BASENAME)), 'writes no file on no-op');
  });

  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`  Failed: ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  if (failed > 0) {
    console.log(`${colors.red}✗ deps-cache tests failed${colors.reset}\n`);
    process.exit(1);
  }
  console.log(`${colors.green}✨ All deps-cache tests passed!${colors.reset}\n`);
})();
