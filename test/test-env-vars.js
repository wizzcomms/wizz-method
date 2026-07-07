/**
 * Env Vars Module Tests
 *
 * Unit tests for tools/installer/modules/env-vars.js — the "Smart Env Var
 * Detection" feature (Fase 3, item 3.3 of the audit; design in
 * `_audit/2026-07-07-parte3-auditoria-installer-envvars.md`, seção E).
 *
 * Covers the E7 checklist:
 *   - extractEnvPlaceholders (pure): 7 cases
 *   - resolveEnvVars (injected providers/prompter, no real TTY): 5 cases
 *   - persistEnvValues / persistProjectEnv: 4 cases
 *   - non-interactive compatibility (E5 formula): 2 cases
 *   - security regression: captured stdout never contains the typed secret
 *
 * Usage: node test/test-env-vars.js
 */

const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const fsp = require('node:fs/promises');

const {
  extractEnvPlaceholders,
  resolveEnvVars,
  persistEnvValues,
  persistProjectEnv,
  promptMissingEnvVars,
  createProcessEnvProvider,
  createDotenvFileProvider,
} = require('../tools/installer/modules/env-vars');

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

function assertEqual(actual, expected, testName) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  assert(ok, testName, ok ? '' : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function section(title) {
  console.log(`\n${colors.cyan}── ${title} ──${colors.reset}`);
}

// Sort a placeholders array by name for order-independent comparisons.
function sortByName(entries) {
  return [...entries].sort((a, b) => a.name.localeCompare(b.name));
}

async function runTests() {
  // ───────────────────────────────────────────────────────────────────────
  section('extractEnvPlaceholders');

  {
    const mcps = [{ id: 'magic', server: { command: 'npx', env: { API_KEY: '${MAGIC_API_KEY}' } } }];
    const r = extractEnvPlaceholders(mcps);
    assertEqual(
      r.map((e) => ({ name: e.name, mcpIds: e.mcpIds, hasDefault: e.hasDefault })),
      [{ name: 'MAGIC_API_KEY', mcpIds: ['magic'], hasDefault: false }],
      'single var, single mcp',
    );
  }

  {
    const mcps = [
      { id: 'server-a', server: { command: 'npx', env: { TOKEN: '${SHARED_TOKEN}' } } },
      { id: 'server-b', server: { command: 'npx', env: { TOKEN: '${SHARED_TOKEN}' } } },
    ];
    const r = extractEnvPlaceholders(mcps);
    assert(r.length === 1, 'shared var: dedups to one entry');
    assertEqual(r[0].mcpIds.sort(), ['server-a', 'server-b'], 'shared var: mcpIds accumulates both ids');
  }

  {
    const mcps = [{ id: 'x', server: { command: 'npx', env: { A: '${WITH_DEFAULT:-fallback}' } } }];
    const r = extractEnvPlaceholders(mcps);
    assert(r.length === 1 && r[0].hasDefault === true, '${VAR:-default} => hasDefault true');
    assertEqual(r[0].default, 'fallback', '${VAR:-default} => default value captured');
  }

  {
    const mcps = [{ id: 'x', server: { command: 'npx', env: { A: '${lowercase_var}' } } }];
    const r = extractEnvPlaceholders(mcps);
    assertEqual(r, [], 'lowercase var name is ignored (POSIX-strict regex)');
  }

  {
    const mcps = [{ id: 'x', server: { command: '{bin}', args: ['{bin}', 'install'] } }];
    const r = extractEnvPlaceholders(mcps);
    assertEqual(r, [], '{bin} template token (no $ prefix) is ignored');
  }

  {
    const mcps = [{ id: 'x', server: { command: 'npx', args: ['-y', 'pkg'] } }];
    const r = extractEnvPlaceholders(mcps);
    assertEqual(r, [], 'mcp with no env/placeholder args => no placeholders found');
  }

  {
    const mcps = [{ id: 'x', server: { command: 'npx', args: ['--token', '${ARG_TOKEN}'] } }];
    const r = extractEnvPlaceholders(mcps);
    assertEqual(
      r.map((e) => e.name),
      ['ARG_TOKEN'],
      'placeholder found in args, not just env',
    );
  }

  {
    // Defensive: empty/undefined input never throws.
    assertEqual(extractEnvPlaceholders([]), [], 'empty mcps => empty result');
    assertEqual(extractEnvPlaceholders(), [], 'undefined mcps => empty result (safe)');
  }

  // ───────────────────────────────────────────────────────────────────────
  section('resolveEnvVars');

  {
    // 1. Hit in process.env => existing, never prompted, never persisted.
    process.env.WIZZ_TEST_EXISTING_VAR = 'already-set';
    try {
      const vars = [{ name: 'WIZZ_TEST_EXISTING_VAR', mcpIds: ['x'], hasDefault: false }];
      const prompterCalled = { value: false };
      const res = await resolveEnvVars(vars, {
        interactive: true,
        providers: [createProcessEnvProvider()],
        prompter: async () => {
          prompterCalled.value = true;
          return 'should-not-be-used';
        },
      });
      assertEqual(
        res.existing.map((e) => e.name),
        ['WIZZ_TEST_EXISTING_VAR'],
        'hit in process.env => existing',
      );
      assertEqual(res.filled, [], 'existing var => not filled');
      assertEqual(res.toPersist, {}, 'existing var => nothing to persist');
      assert(!prompterCalled.value, 'existing var => provider hit short-circuits before prompting');
    } finally {
      delete process.env.WIZZ_TEST_EXISTING_VAR;
    }
  }

  {
    // 2. Non-interactive + missing => skipped, prompter never invoked.
    const vars = [{ name: 'WIZZ_TEST_MISSING_NONINTERACTIVE', mcpIds: ['x'], hasDefault: false }];
    let prompterCalls = 0;
    const res = await resolveEnvVars(vars, {
      interactive: false,
      providers: [],
      prompter: async () => {
        prompterCalls++;
        return 'irrelevant';
      },
    });
    assertEqual(
      res.skipped.map((e) => e.name),
      ['WIZZ_TEST_MISSING_NONINTERACTIVE'],
      'non-interactive + missing => skipped',
    );
    assert(prompterCalls === 0, 'non-interactive => prompter never called');
  }

  {
    // 3. Interactive + user provides a value => filled + toPersist.
    const vars = [{ name: 'WIZZ_TEST_FILLED_VAR', mcpIds: ['magic'], hasDefault: false }];
    const res = await resolveEnvVars(vars, {
      interactive: true,
      providers: [],
      prompter: async () => 'user-typed-value',
    });
    assertEqual(
      res.filled.map((e) => e.name),
      ['WIZZ_TEST_FILLED_VAR'],
      'interactive + provided => filled',
    );
    assertEqual(res.toPersist, { WIZZ_TEST_FILLED_VAR: 'user-typed-value' }, 'interactive + provided => toPersist carries the value');
  }

  {
    // 4. Cancel (prompter returns undefined, e.g. empty Enter or cancel sentinel) => skipped.
    const vars = [{ name: 'WIZZ_TEST_CANCELLED_VAR', mcpIds: [], hasDefault: false }];
    const res = await resolveEnvVars(vars, {
      interactive: true,
      providers: [],
      prompter: async () => {},
    });
    assertEqual(
      res.skipped.map((e) => e.name),
      ['WIZZ_TEST_CANCELLED_VAR'],
      'cancelled prompt => skipped',
    );
    assertEqual(res.toPersist, {}, 'cancelled prompt => nothing to persist');
  }

  {
    // 5. Var with a default is ALWAYS skipped, even interactive with a
    // provider that would resolve it and a prompter that would fill it.
    process.env.WIZZ_TEST_DEFAULT_VAR = 'would-be-found';
    try {
      const vars = [{ name: 'WIZZ_TEST_DEFAULT_VAR', mcpIds: ['x'], hasDefault: true, default: 'fallback' }];
      let prompterCalls = 0;
      const res = await resolveEnvVars(vars, {
        interactive: true,
        providers: [createProcessEnvProvider()],
        prompter: async () => {
          prompterCalls++;
          return 'never';
        },
      });
      assertEqual(
        res.skipped.map((e) => e.name),
        ['WIZZ_TEST_DEFAULT_VAR'],
        'hasDefault => always skipped',
      );
      assert(prompterCalls === 0, 'hasDefault => never prompted');
      assertEqual(res.existing, [], 'hasDefault => never classified as existing either');
    } finally {
      delete process.env.WIZZ_TEST_DEFAULT_VAR;
    }
  }

  // dotenv provider, as a bonus: value found in a real .env file => existing.
  {
    const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'wizz-env-dotenv-'));
    try {
      fs.writeFileSync(path.join(tmp, '.env'), 'DOTENV_VAR=from-dotenv-file\n# a comment\nQUOTED="quoted value"\n');
      const vars = [
        { name: 'DOTENV_VAR', mcpIds: ['x'], hasDefault: false },
        { name: 'QUOTED', mcpIds: ['x'], hasDefault: false },
      ];
      const res = await resolveEnvVars(vars, {
        interactive: false,
        providers: [createProcessEnvProvider(), createDotenvFileProvider(path.join(tmp, '.env'))],
      });
      assertEqual(
        sortByName(res.existing).map((e) => e.name),
        ['DOTENV_VAR', 'QUOTED'],
        '.env file provider resolves both vars',
      );
    } finally {
      await fsp.rm(tmp, { recursive: true, force: true });
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  section('persistEnvValues / persistProjectEnv');

  {
    // 1. Destination does not exist => created, with the merged env.
    const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'wizz-env-persist-'));
    try {
      const file = await persistEnvValues({ MY_VAR: 'secret-value' }, { projectDir: tmp, target: 'settings-local' });
      assert(!!file && fs.existsSync(file), 'destination missing => file created');
      const written = JSON.parse(fs.readFileSync(file, 'utf8'));
      assertEqual(written.env, { MY_VAR: 'secret-value' }, 'created file has the env key with the persisted value');
    } finally {
      await fsp.rm(tmp, { recursive: true, force: true });
    }
  }

  {
    // 2. Destination exists with unrelated keys => merged, unrelated keys preserved.
    const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'wizz-env-persist-'));
    try {
      const claudeDir = path.join(tmp, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      const file = path.join(claudeDir, 'settings.local.json');
      fs.writeFileSync(file, JSON.stringify({ permissions: { allow: ['Bash(git *)'] }, env: { OTHER_VAR: 'kept' } }, null, 2));

      await persistProjectEnv(tmp, { NEW_VAR: 'added' });

      const after = JSON.parse(fs.readFileSync(file, 'utf8'));
      assertEqual(after.permissions, { allow: ['Bash(git *)'] }, 'unrelated top-level key (permissions) preserved');
      assertEqual(after.env, { OTHER_VAR: 'kept', NEW_VAR: 'added' }, 'existing env keys preserved + new key merged in');
    } finally {
      await fsp.rm(tmp, { recursive: true, force: true });
    }
  }

  {
    // 3. A key that already exists is NEVER overwritten by a new value.
    const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'wizz-env-persist-'));
    try {
      const claudeDir = path.join(tmp, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      const file = path.join(claudeDir, 'settings.local.json');
      fs.writeFileSync(file, JSON.stringify({ env: { GUARDED_VAR: 'hand-edited-by-user' } }, null, 2));

      await persistProjectEnv(tmp, { GUARDED_VAR: 'installer-would-overwrite-this' });

      const after = JSON.parse(fs.readFileSync(file, 'utf8'));
      assertEqual(after.env.GUARDED_VAR, 'hand-edited-by-user', 'existing key is preserved, never overwritten');
    } finally {
      await fsp.rm(tmp, { recursive: true, force: true });
    }
  }

  {
    // 4. chmod is skipped on Windows (documented no-op), and never throws
    // the install over a permission tweak. We simulate win32 by overriding
    // process.platform and confirm fs-native.chmod is never invoked.
    const originalPlatform = process.platform;
    const fsNative = require('../tools/installer/fs-native');
    const originalChmod = fsNative.chmod;
    let chmodCalls = 0;
    fsNative.chmod = async (...args) => {
      chmodCalls++;
      return originalChmod(...args);
    };
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'wizz-env-persist-win-'));
    try {
      const file = await persistEnvValues({ WIN_VAR: 'x' }, { projectDir: tmp, target: 'settings-local' });
      assert(!!file && fs.existsSync(file), 'win32: file still written');
      assert(chmodCalls === 0, 'win32: chmod is a documented no-op, never called');
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform });
      fsNative.chmod = originalChmod;
      await fsp.rm(tmp, { recursive: true, force: true });
    }
  }

  {
    // Empty toPersist => no-op, no file created.
    const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'wizz-env-persist-empty-'));
    try {
      const file = await persistEnvValues({}, { projectDir: tmp, target: 'settings-local' });
      assertEqual(file, null, 'empty toPersist => returns null, no-op');
      assert(!fs.existsSync(path.join(tmp, '.claude', 'settings.local.json')), 'empty toPersist => no file created');
    } finally {
      await fsp.rm(tmp, { recursive: true, force: true });
    }
  }

  {
    // C7 guardrail: a 'dotenv' target is refused outright (never silently
    // persists a secret somewhere the runtime doesn't read).
    let threw = false;
    try {
      await persistEnvValues({ X: 'y' }, { projectDir: os.tmpdir(), target: 'dotenv' });
    } catch (error) {
      threw = /não suportado/.test(error.message);
    }
    assert(threw, "target 'dotenv' is rejected with a clear error (C7 anti-pattern guard)");
  }

  // ───────────────────────────────────────────────────────────────────────
  section('non-interactive compatibility (E5 formula: !!options.yes || !process.stdin.isTTY)');

  {
    // --yes with a TTY still skips (yes wins regardless of TTY).
    const optionsYes = { yes: true };
    const fakeIsTTY = true;
    const interactive = !(!!optionsYes.yes || !fakeIsTTY);
    assert(interactive === false, '--yes with TTY => computed interactive=false (still non-interactive)');

    const vars = [{ name: 'WIZZ_TEST_YES_TTY', mcpIds: [], hasDefault: false }];
    let prompterCalls = 0;
    const res = await resolveEnvVars(vars, {
      interactive,
      providers: [],
      prompter: async () => {
        prompterCalls++;
        return 'irrelevant';
      },
    });
    assertEqual(
      res.skipped.map((e) => e.name),
      ['WIZZ_TEST_YES_TTY'],
      '--yes + TTY => var skipped',
    );
    assert(prompterCalls === 0, '--yes + TTY => prompter never invoked');
  }

  {
    // No TTY, no --yes, also skips (CI/piped stdin without an explicit --yes).
    const optionsYes = { yes: false };
    const fakeIsTTY = false;
    const interactive = !(!!optionsYes.yes || !fakeIsTTY);
    assert(interactive === false, 'no TTY + no --yes => computed interactive=false');

    const vars = [{ name: 'WIZZ_TEST_NO_TTY', mcpIds: [], hasDefault: false }];
    let prompterCalls = 0;
    const res = await resolveEnvVars(vars, {
      interactive,
      providers: [],
      prompter: async () => {
        prompterCalls++;
        return 'irrelevant';
      },
    });
    assertEqual(
      res.skipped.map((e) => e.name),
      ['WIZZ_TEST_NO_TTY'],
      'no TTY + no --yes => var skipped',
    );
    assert(prompterCalls === 0, 'no TTY + no --yes => prompter never invoked');
  }

  // ───────────────────────────────────────────────────────────────────────
  section('security regression: typed secret never reaches stdout/logs');

  {
    const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'wizz-env-security-'));
    const SECRET_MARKER = 'sk-super-secret-do-not-leak-8f2a91';
    try {
      const mcps = [{ id: 'magic', server: { command: 'npx', env: { API_KEY: '${SECURITY_TEST_VAR}' } } }];

      // Capture everything written to stdout/stderr during the call.
      const originalStdoutWrite = process.stdout.write.bind(process.stdout);
      const originalStderrWrite = process.stderr.write.bind(process.stderr);
      const chunks = [];
      process.stdout.write = (chunk, ...rest) => {
        chunks.push(String(chunk));
        return originalStdoutWrite(chunk, ...rest);
      };
      process.stderr.write = (chunk, ...rest) => {
        chunks.push(String(chunk));
        return originalStderrWrite(chunk, ...rest);
      };

      let result;
      try {
        result = await promptMissingEnvVars(mcps, {
          projectDir: tmp,
          interactive: true,
          providers: [],
          prompter: async () => SECRET_MARKER,
        });
      } finally {
        process.stdout.write = originalStdoutWrite;
        process.stderr.write = originalStderrWrite;
      }

      const captured = chunks.join('');
      assert(!captured.includes(SECRET_MARKER), 'typed secret value never appears in captured stdout/stderr');
      assertEqual(
        result.filled.map((e) => e.name),
        ['SECURITY_TEST_VAR'],
        'sanity: the var was actually filled',
      );

      // And double-check the persisted file has the real value (it SHOULD be
      // there — only the terminal/log output must never show it).
      const persisted = JSON.parse(fs.readFileSync(path.join(tmp, '.claude', 'settings.local.json'), 'utf8'));
      assertEqual(persisted.env.SECURITY_TEST_VAR, SECRET_MARKER, 'value IS persisted to settings.local.json (just never logged)');
    } finally {
      await fsp.rm(tmp, { recursive: true, force: true });
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  section('promptMissingEnvVars (orchestrator)');

  {
    // No placeholders at all => no-op, no persistence attempted.
    const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'wizz-env-orch-'));
    try {
      const res = await promptMissingEnvVars([{ id: 'x', server: { command: 'npx' } }], { projectDir: tmp, interactive: true });
      assertEqual(res, { filled: [], skipped: [], existing: [], envFile: null }, 'no placeholders => fully empty result');
      assert(!fs.existsSync(path.join(tmp, '.claude')), 'no placeholders => .claude/ never created');
    } finally {
      await fsp.rm(tmp, { recursive: true, force: true });
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${failed}${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  if (failed === 0) {
    console.log(`${colors.green}✨ All env-vars tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Some env-vars tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error(`${colors.red}Test runner failed:${colors.reset}`, error.message);
  console.error(error.stack);
  process.exit(1);
});
