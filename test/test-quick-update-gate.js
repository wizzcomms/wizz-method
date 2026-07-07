/**
 * Quick Update Gate Test
 *
 * Regression test for the isQuickUpdate() gate in
 * tools/installer/core/installer.js (_installAndConfigure, ~line 309):
 *
 *   if (!config.isQuickUpdate() && (config.modules || []).includes('bmm')) { ... }
 *
 * Quick Update must skip installing the global skills library, MCP servers,
 * and CLIs. Only a fresh install / Modify that includes the `bmm` module
 * should run them (see project memory: "Quick Update pula skills").
 *
 * Also covers the C6 fix (installer audit, 2026-07-07): the gate being
 * silent was the actual bug users hit ("atualizei e não veio skill"). It is
 * not enough for the functions to not run; the installer must say so. This
 * file asserts the "during" log fired from the `else if` branch right next
 * to the gate in `_installAndConfigure`. The other two legs of the fix (the
 * "Quick Update" menu hint in ui.js and the final-summary line in
 * commands/install.js) are UI/CLI-orchestration code outside what this
 * lightweight harness drives, and are covered by direct code review instead.
 *
 * This drives `Installer._installAndConfigure` directly (bypassing the full
 * `install()` orchestration, which needs a real project scaffold) with:
 *  - skills-lib / mcp-config / cli-config swapped in require.cache for tiny
 *    spy functions, so no real fs.copy, no `npm install -g`, no shell-out
 *    ever runs, and we can just count calls;
 *  - manifest-generator stubbed to a no-op, since this test only cares about
 *    the gate, not manifest generation;
 *  - prompts stubbed with log recorders (not pure no-ops) so the
 *    communication assertions can check message content;
 *  - the pieces irrelevant to the gate (_installSharedScripts,
 *    generateModuleConfigs, mergeModuleHelpCatalogs) overridden per-instance
 *    to no-ops — light mocking, no changes to installer.js itself.
 *
 * Usage: node test/test-quick-update-gate.js
 */

const path = require('node:path');
const os = require('node:os');
const fs = require('../tools/installer/fs-native');

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
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    passed++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (errorMessage) console.log(`  ${colors.dim}${errorMessage}${colors.reset}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Spies, installed into require.cache BEFORE core/installer.js ever loads, so
// its top-level `const { installSkillsLib } = require('../modules/skills-lib')`
// (and siblings) destructure our spies instead of the real implementations.
// ---------------------------------------------------------------------------
const calls = { skillsLib: 0, mcp: 0, cli: 0 };

function stubModule(relPath, exports) {
  const resolved = require.resolve(relPath);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
}

stubModule('../tools/installer/modules/skills-lib', {
  installSkillsLib: async () => {
    calls.skillsLib++;
    return { registry: true, copied: 0, skipped: [] };
  },
});

stubModule('../tools/installer/modules/mcp-config', {
  writeMcpConfig: async () => {
    calls.mcp++;
    return { added: [], skipped: [] };
  },
  renderAddCommand: () => '',
  prepareMcps: async () => {
    calls.mcp++;
    return { ready: [], failed: [] };
  },
  // installer.js calls this before prepareMcps to skip ids the additive
  // merge would discard anyway (M26). Not the focus of this file, so pass
  // everything through untouched.
  partitionAlreadyConfigured: async ({ mcps }) => ({ toPrepare: mcps || [], alreadyConfigured: [] }),
});

stubModule('../tools/installer/modules/cli-config', {
  installClis: async () => {
    calls.cli++;
    return { installed: [], failed: [] };
  },
  renderInstallCommand: () => '',
});

stubModule('../tools/installer/core/manifest-generator', {
  ManifestGenerator: class {
    constructor() {
      this.agents = [];
    }
    async generateManifests() {}
  },
});

// No spinner/TTY behavior needed — just run each task's function and let log
// calls no-op, so a failure in the code under test throws instead of hanging.
// `log` calls are also recorded (not just no-op'd) so the communication tests
// below (C6: Quick Update must say what it skips) can assert on message
// content, not just call counts.
const loggedMessages = [];
function resetLoggedMessages() {
  loggedMessages.length = 0;
}
function makeLogRecorder(level) {
  return async (msg) => {
    loggedMessages.push({ level, msg: String(msg) });
  };
}
stubModule('../tools/installer/prompts', {
  tasks: async (taskList) => {
    for (const t of taskList) {
      await t.task(() => {});
    }
  },
  getColor: async () => ({
    cyan: (s) => s,
    yellow: (s) => s,
    dim: (s) => s,
    green: (s) => s,
    red: (s) => s,
  }),
  log: {
    info: makeLogRecorder('info'),
    warn: makeLogRecorder('warn'),
    error: makeLogRecorder('error'),
    message: makeLogRecorder('message'),
    success: makeLogRecorder('success'),
    step: makeLogRecorder('step'),
  },
});

// Guard: fail loudly instead of silently if core/installer.js was already
// cached by something else in this process — the stubs above only take
// effect on a fresh require.
delete require.cache[require.resolve('../tools/installer/core/installer')];

const { Installer } = require('../tools/installer/core/installer');

function resetCalls() {
  calls.skillsLib = 0;
  calls.mcp = 0;
  calls.cli = 0;
}

function buildConfig(quickUpdate) {
  return {
    modules: ['bmm'],
    ides: [],
    selectedAreas: [],
    // Non-empty plans so a real install path would visibly call MCP/CLI.
    mcpPlan: { toWrite: [{ id: 'fake-mcp', server: {} }], toRecommend: [] },
    cliPlan: { toInstall: [{ id: 'fake-cli' }], toRecommend: [], alreadyInstalled: [] },
    setOverrides: null,
    isQuickUpdate: () => quickUpdate,
  };
}

async function runGate(quickUpdate, wizzDir) {
  const installer = new Installer();
  // Light instance-level mocks for pieces unrelated to the gate under test —
  // avoids needing a full real project scaffold (real src/scripts dir, real
  // module help catalogs, etc.). No edits to installer.js.
  installer._installSharedScripts = async () => {};
  installer.generateModuleConfigs = async () => {};
  installer.mergeModuleHelpCatalogs = async () => {};

  const config = buildConfig(quickUpdate);
  const originalConfig = {};
  const paths = {
    wizzDir,
    projectRoot: wizzDir,
    manifestFile: () => path.join(wizzDir, '_config', 'manifest.csv'),
    centralConfig: () => path.join(wizzDir, '_config', 'config.toml'),
    centralUserConfig: () => path.join(wizzDir, '_config', 'config.user.toml'),
  };
  const officialModules = {
    moduleConfigs: {},
    createModuleDirectories: async () => ({ createdDirs: [], movedDirs: [], createdWdsFolders: [] }),
  };
  const addResult = () => {};

  // officialModuleIds and allModules are both set to config.modules /
  // empty respectively: allModules=[] skips the (unrelated)
  // _installOfficialModules branch entirely, keeping this test focused on
  // the skills/MCP/CLI gate only.
  await installer._installAndConfigure(config, originalConfig, paths, config.modules, [], addResult, officialModules, []);
}

async function main() {
  let tmpDir;
  try {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wizz-quickupdate-gate-'));
    const wizzDir = path.join(tmpDir, '_wizz');
    await fs.ensureDir(wizzDir);

    // Case 1: Quick Update (isQuickUpdate() === true) + bmm module selected
    // => skills/MCP/CLI installers must NOT run.
    resetCalls();
    resetLoggedMessages();
    await runGate(true, wizzDir);
    assert(calls.skillsLib === 0, 'Quick Update: installSkillsLib is NOT called');
    assert(calls.mcp === 0, 'Quick Update: MCP config (prepareMcps/writeMcpConfig) is NOT called');
    assert(calls.cli === 0, 'Quick Update: installClis is NOT called');

    // C6: the gate being silent was the actual bug ("atualizei e não veio
    // skill"). Assert the "during" communication log fires, mentioning what
    // was skipped, instead of only verifying the functions weren't called.
    const skipNotice = loggedMessages.find((m) => /skills globais, mcps e clis/i.test(m.msg) && /modify wizz installation/i.test(m.msg));
    assert(!!skipNotice, 'Quick Update: logs a notice that skills/MCPs/CLIs were not touched', JSON.stringify(loggedMessages));

    // Case 2: fresh install / Modify (isQuickUpdate() === false) + bmm module
    // => skills/MCP/CLI installers MUST run.
    resetCalls();
    resetLoggedMessages();
    await runGate(false, wizzDir);
    assert(calls.skillsLib === 1, 'Fresh install + bmm: installSkillsLib IS called');
    assert(calls.mcp > 0, 'Fresh install + bmm: MCP config IS called');
    assert(calls.cli === 1, 'Fresh install + bmm: installClis IS called');

    // The skip notice is specific to Quick Update; a real install/Modify run
    // must not print it (nothing was actually skipped in this path).
    const spuriousSkipNotice = loggedMessages.find((m) => /skills globais, mcps e clis/i.test(m.msg));
    assert(!spuriousSkipNotice, 'Fresh install + bmm: does NOT log the Quick-Update skip notice', JSON.stringify(loggedMessages));
  } catch (error) {
    console.log(`${colors.red}Test setup failed: ${error.message}${colors.reset}`);
    console.log(error.stack);
    failed++;
  } finally {
    if (tmpDir) await fs.remove(tmpDir).catch(() => {});
  }

  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${failed}${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  if (failed === 0) {
    console.log(`${colors.green}All quick-update-gate tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}Some quick-update-gate tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

main();
