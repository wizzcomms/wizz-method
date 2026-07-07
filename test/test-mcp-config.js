/**
 * MCP Config Module Tests
 *
 * Unit tests for tools/installer/modules/mcp-config.js — the registry-driven
 * MCP resolution + additive .mcp.json merge used by the installer's MCP step.
 *
 * Pure logic (resolveMcps/toServerConfig/renderAddCommand) is deterministic;
 * writeMcpConfig is exercised against a real temp dir (no mocks).
 *
 * Usage: node test/test-mcp-config.js
 */

const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const fsp = require('node:fs/promises');

const {
  resolveMcps,
  toServerConfig,
  hashServerBlock,
  renderAddCommand,
  writeMcpConfig,
  prepareMcp,
  prepareMcps,
  shellQuote,
  substituteBin,
} = require('../tools/installer/modules/mcp-config');

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

function assertEqual(actual, expected, testName) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  assert(ok, testName, ok ? '' : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function section(title) {
  console.log(`\n${colors.cyan}── ${title} ──${colors.reset}`);
}

// A small fixture registry mirroring the real shape.
const REGISTRY = {
  areas: {
    designer: {
      mcps: [
        { id: 'magic', when: 'UI', server: { command: 'npx', args: ['-y', '@21st-dev/magic'], env: { API_KEY: '${MAGIC_API_KEY}' } } },
      ],
    },
    ads: {
      mcps: [
        {
          id: 'meta-ads',
          when: 'ads',
          server: { command: 'npx', args: ['-y', 'mcp-meta-ads'], env: { META_ACCESS_TOKEN: '${META_ACCESS_TOKEN}' } },
        },
      ],
    },
    qa: {
      mcps: [{ id: 'sample-qa-mcp', when: 'qa', server: { command: 'npx', args: ['-y', 'some-qa-mcp'] } }],
    },
    copy: {}, // area with no mcps
  },
  mcp_utility: [{ id: 'context7', when: 'docs', server: { command: 'npx', args: ['-y', '@upstash/context7-mcp'] } }],
};

async function runTests() {
  // ───────────────────────────────────────────────────────────────────────
  section('resolveMcps');

  {
    const r = resolveMcps(REGISTRY, ['designer']);
    const ids = r.map((m) => m.id).sort();
    assertEqual(ids, ['context7', 'magic'], 'one area + cross-cutting utility');
  }
  {
    const r = resolveMcps(REGISTRY, []);
    const ids = r.map((m) => m.id).sort();
    assertEqual(ids, ['context7', 'magic', 'meta-ads', 'sample-qa-mcp'], 'empty selection => all areas + utility');
  }
  {
    const r = resolveMcps(REGISTRY, ['all']);
    assert(r.length === 4, "'all' sentinel resolves every area");
  }
  {
    const r = resolveMcps(REGISTRY, ['copy']);
    assertEqual(
      r.map((m) => m.id),
      ['context7'],
      'area without mcps still gets utility only',
    );
  }
  {
    const r = resolveMcps({ areas: {} }, ['designer']);
    assertEqual(r, [], 'missing mcp_utility + unknown area => empty');
  }
  {
    const r = resolveMcps(null, ['designer']);
    assertEqual(r, [], 'null registry => empty (safe)');
  }
  {
    // utility id should never duplicate even across multiple areas
    const r = resolveMcps(REGISTRY, ['designer', 'ads']);
    const context7 = r.filter((m) => m.id === 'context7');
    assert(context7.length === 1, 'cross-cutting id deduped across areas');
  }
  {
    // an id present in two areas records both
    const reg = {
      areas: {
        a: { mcps: [{ id: 'dup', when: 'x', server: { command: 'npx' } }] },
        b: { mcps: [{ id: 'dup', when: 'y', server: { command: 'npx' } }] },
      },
    };
    const r = resolveMcps(reg, ['a', 'b']);
    assert(r.length === 1 && r[0].areas.length === 2, 'duplicate id merges areas list');
  }

  // ───────────────────────────────────────────────────────────────────────
  section('toServerConfig');

  assertEqual(toServerConfig({ command: 'npx', args: ['-y', 'x'] }), { command: 'npx', args: ['-y', 'x'] }, 'keeps command + args');
  assertEqual(toServerConfig({ command: 'npx', args: [] }), { command: 'npx' }, 'drops empty args');
  assertEqual(toServerConfig({ command: 'npx', env: {} }), { command: 'npx' }, 'drops empty env');
  assertEqual(
    toServerConfig({ command: 'npx', args: ['x'], env: { K: '${K}' } }),
    { command: 'npx', args: ['x'], env: { K: '${K}' } },
    'keeps placeholder env',
  );

  // ───────────────────────────────────────────────────────────────────────
  section('renderAddCommand');

  assertEqual(
    renderAddCommand({ id: 'context7', server: { command: 'npx', args: ['-y', '@upstash/context7-mcp'] } }),
    'claude mcp add context7 -- npx -y @upstash/context7-mcp',
    'no env => plain command',
  );
  assertEqual(
    renderAddCommand({ id: 'magic', server: { command: 'npx', args: ['-y', '@21st-dev/magic'], env: { API_KEY: '${MAGIC_API_KEY}' } } }),
    'claude mcp add magic -e API_KEY=${MAGIC_API_KEY} -- npx -y @21st-dev/magic',
    'env => -e flags before --',
  );

  // ───────────────────────────────────────────────────────────────────────
  section('writeMcpConfig (temp dir)');

  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'wizz-mcp-'));
  try {
    const mcps = resolveMcps(REGISTRY, ['designer']); // context7 + magic

    // 1. Fresh write into a dir with no .mcp.json
    {
      const res = await writeMcpConfig({ projectDir: tmp, mcps });
      assertEqual(res.added.sort(), ['context7', 'magic'], 'fresh: adds both ids');
      assertEqual(res.skipped, [], 'fresh: nothing skipped');
      const written = JSON.parse(fs.readFileSync(path.join(tmp, '.mcp.json'), 'utf8'));
      assert(written.mcpServers.magic.env.API_KEY === '${MAGIC_API_KEY}', 'fresh: placeholder secret preserved, not a real token');
      assert(written.mcpServers.context7 && !written.mcpServers.context7.env, 'fresh: no env when registry has none');
    }

    // 2. Re-run is idempotent / additive — existing ids are skipped, not clobbered
    {
      const res = await writeMcpConfig({ projectDir: tmp, mcps });
      assertEqual(res.added, [], 're-run: adds nothing');
      assertEqual(res.skipped.sort(), ['context7', 'magic'], 're-run: both skipped (already present)');
    }

    // 3. Never overwrite a user's hand-tuned server with the same id
    {
      const file = path.join(tmp, '.mcp.json');
      const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
      cfg.mcpServers.magic = { command: 'custom-magic', args: ['--mine'] };
      cfg.mcpServers.userOwn = { command: 'keep-me' };
      fs.writeFileSync(file, JSON.stringify(cfg, null, 2));

      await writeMcpConfig({ projectDir: tmp, mcps });
      const after = JSON.parse(fs.readFileSync(file, 'utf8'));
      assertEqual(after.mcpServers.magic.command, 'custom-magic', 'user server with same id is preserved');
      assertEqual(after.mcpServers.userOwn.command, 'keep-me', 'unrelated user server is preserved');
    }

    // 4. Empty mcps => no file written
    {
      const tmp2 = await fsp.mkdtemp(path.join(os.tmpdir(), 'wizz-mcp-'));
      const res = await writeMcpConfig({ projectDir: tmp2, mcps: [] });
      assertEqual(res, { added: [], skipped: [], file: null, pinHashes: {}, pinUpdated: [], pinCustomized: [] }, 'empty mcps => no-op');
      assert(!fs.existsSync(path.join(tmp2, '.mcp.json')), 'empty mcps => no .mcp.json created');
      await fsp.rm(tmp2, { recursive: true, force: true });
    }

    // 5. Corrupt existing .mcp.json => throws a clear error
    {
      const tmp3 = await fsp.mkdtemp(path.join(os.tmpdir(), 'wizz-mcp-'));
      fs.writeFileSync(path.join(tmp3, '.mcp.json'), '{ not json');
      let threw = false;
      try {
        await writeMcpConfig({ projectDir: tmp3, mcps });
      } catch (error) {
        threw = /não é JSON válido/.test(error.message);
      }
      assert(threw, 'corrupt .mcp.json => throws clear error');
      await fsp.rm(tmp3, { recursive: true, force: true });
    }
  } finally {
    await fsp.rm(tmp, { recursive: true, force: true });
  }

  // ───────────────────────────────────────────────────────────────────────
  section('writeMcpConfig — pin content marker (A13)');

  {
    const tmpPin = await fsp.mkdtemp(path.join(os.tmpdir(), 'wizz-mcp-pin-'));
    try {
      const oldMagic = { id: 'magic', when: 'UI', server: { command: 'npx', args: ['-y', '@21st-dev/magic@0.1.0'] } };
      const newMagic = { id: 'magic', when: 'UI', server: { command: 'npx', args: ['-y', '@21st-dev/magic@0.2.0'] } };

      // 1. First write: records the hash of what actually landed on disk.
      const first = await writeMcpConfig({ projectDir: tmpPin, mcps: [oldMagic] });
      assertEqual(first.added, ['magic'], 'first write: added');
      const recordedHash = first.pinHashes.magic;
      assert(!!recordedHash, 'first write: returns a pinHash for the written id');
      assertEqual(recordedHash, hashServerBlock(oldMagic.server), 'pinHash matches hashServerBlock of what was written');

      // 2. Re-install with the registry pin bumped + the PREVIOUS hash passed
      //    in: the on-disk block is untouched since our last write (its hash
      //    equals the recorded one) => safe to auto-apply the new pin.
      const second = await writeMcpConfig({
        projectDir: tmpPin,
        mcps: [newMagic],
        previousPins: { magic: recordedHash },
      });
      assertEqual(
        second.pinUpdated,
        [{ id: 'magic', from: recordedHash, to: hashServerBlock(newMagic.server) }],
        'hash matches previous => pin update applied',
      );
      assertEqual(second.pinCustomized, [], 'no customization reported when the update was applied');
      const afterUpdate = JSON.parse(fs.readFileSync(path.join(tmpPin, '.mcp.json'), 'utf8'));
      assertEqual(afterUpdate.mcpServers.magic.args, ['-y', '@21st-dev/magic@0.2.0'], 'on-disk block now carries the new pin');

      // 3. Re-install again, same registry pin, same previousPins as last
      //    write recorded => nothing to do (already current).
      const third = await writeMcpConfig({
        projectDir: tmpPin,
        mcps: [newMagic],
        previousPins: { magic: second.pinHashes.magic },
      });
      assertEqual(third.skipped, ['magic'], 'already current => skipped, no pinUpdated/pinCustomized');
      assertEqual(third.pinUpdated, [], 'nothing to update when already current');
      assertEqual(third.pinCustomized, [], 'nothing customized when already current');
    } finally {
      await fsp.rm(tmpPin, { recursive: true, force: true });
    }
  }

  {
    const tmpPin2 = await fsp.mkdtemp(path.join(os.tmpdir(), 'wizz-mcp-pin-'));
    try {
      const oldMagic = { id: 'magic', when: 'UI', server: { command: 'npx', args: ['-y', '@21st-dev/magic@0.1.0'] } };
      const newMagic = { id: 'magic', when: 'UI', server: { command: 'npx', args: ['-y', '@21st-dev/magic@0.2.0'] } };

      const first = await writeMcpConfig({ projectDir: tmpPin2, mcps: [oldMagic] });
      const recordedHash = first.pinHashes.magic;

      // The user hand-edits the block after our write (e.g. adds a flag) —
      // its on-disk hash no longer matches what we recorded.
      const file = path.join(tmpPin2, '.mcp.json');
      const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
      cfg.mcpServers.magic.args.push('--my-flag');
      fs.writeFileSync(file, JSON.stringify(cfg, null, 2));

      const second = await writeMcpConfig({
        projectDir: tmpPin2,
        mcps: [newMagic],
        previousPins: { magic: recordedHash },
      });
      assertEqual(second.pinUpdated, [], 'hash diverges (user edit) => no auto-apply');
      assert(second.pinCustomized.length === 1 && second.pinCustomized[0].id === 'magic', 'diverging hash reported as customized');
      const untouched = JSON.parse(fs.readFileSync(file, 'utf8'));
      assert(untouched.mcpServers.magic.args.includes('--my-flag'), 'customized block is never overwritten');
      assert(!untouched.mcpServers.magic.args.includes('@21st-dev/magic@0.2.0'), 'new pin was NOT silently applied over a customization');
    } finally {
      await fsp.rm(tmpPin2, { recursive: true, force: true });
    }
  }

  {
    const tmpPin3 = await fsp.mkdtemp(path.join(os.tmpdir(), 'wizz-mcp-pin-'));
    try {
      // Pre-A13 install: a block already on disk with NO recorded pin hash at
      // all (previousPins is empty/missing the id). Same conservative
      // behavior as a diverging hash: never overwritten, only reported.
      const oldMagic = { id: 'magic', when: 'UI', server: { command: 'npx', args: ['-y', '@21st-dev/magic@0.1.0'] } };
      const newMagic = { id: 'magic', when: 'UI', server: { command: 'npx', args: ['-y', '@21st-dev/magic@0.2.0'] } };
      await writeMcpConfig({ projectDir: tmpPin3, mcps: [oldMagic] }); // no previousPins recorded downstream

      const res = await writeMcpConfig({ projectDir: tmpPin3, mcps: [newMagic] }); // previousPins defaults to {}
      assertEqual(res.pinUpdated, [], 'no recorded pin history => never auto-applied');
      assert(
        res.pinCustomized.length === 1 && res.pinCustomized[0].id === 'magic',
        'no history => reported same as customized (conservative default)',
      );
    } finally {
      await fsp.rm(tmpPin3, { recursive: true, force: true });
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  section('resolveMcps carries setup');

  {
    const reg = {
      areas: {
        research: {
          mcps: [
            { id: 'scrapling', when: 'scrape', server: { command: 'scrapling', args: ['mcp'] }, setup: { bin: 'scrapling', install: 'x' } },
          ],
        },
      },
    };
    const r = resolveMcps(reg, ['research']);
    assert(r[0].setup && r[0].setup.bin === 'scrapling', 'setup block carried through resolveMcps');
  }
  {
    const r = resolveMcps(REGISTRY, ['designer']); // magic + context7, neither has setup
    assert(
      r.every((m) => 'setup' in m),
      'every resolved entry exposes a setup field',
    );
    assert(r.find((m) => m.id === 'magic').setup === null, 'entry without setup => null (not undefined)');
  }

  // ───────────────────────────────────────────────────────────────────────
  section('shellQuote / substituteBin');

  assertEqual(shellQuote('/usr/local/bin/x'), "'/usr/local/bin/x'", 'wraps plain path in single quotes');
  assertEqual(shellQuote('/a b/x'), "'/a b/x'", 'quotes path containing a space');
  assertEqual(shellQuote("/a'b/x"), String.raw`'/a'\''b/x'`, 'escapes an embedded single quote');
  assertEqual(substituteBin('{bin} --version', '/a/x'), "'/a/x' --version", 'substitutes {bin} once');
  assertEqual(substituteBin('{bin} install; {bin} run', '/a/x'), "'/a/x' install; '/a/x' run", 'substitutes every {bin}');

  // ───────────────────────────────────────────────────────────────────────
  section('prepareMcp (injected exec)');

  // resolveBinPath falls back to $HOME/.local/bin when `command -v` misses.
  // Point HOME at an empty temp dir so that fallback can't accidentally resolve
  // a real binary present on the dev machine — the injected exec is then the
  // sole authority over what "installed" means, keeping these tests hermetic.
  const originalHome = process.env.HOME;
  const emptyHome = await fsp.mkdtemp(path.join(os.tmpdir(), 'wizz-home-'));
  process.env.HOME = emptyHome;

  const scraplingEntry = () => ({
    id: 'scrapling',
    when: 'scrape',
    server: { command: 'scrapling', args: ['mcp'] },
    setup: { bin: 'scrapling', install: 'uv tool install "scrapling[ai]"', post_install: '{bin} install', verify: '{bin} --version' },
  });

  {
    // Detect-first: binary already present => no install, patch to absolute path.
    const calls = [];
    const exec = async (cmd) => {
      calls.push(cmd);
      if (cmd.startsWith('command -v')) return { ok: true, stdout: '/usr/local/bin/scrapling\n', stderr: '' };
      if (cmd.includes('--version')) return { ok: true, stdout: 'scrapling 0.3', stderr: '' };
      return { ok: false, stdout: '', stderr: 'unexpected: ' + cmd };
    };
    const res = await prepareMcp({ mcp: scraplingEntry(), exec });
    assert(res.ok && res.ran === false, 'already installed => ok, no fresh install');
    assertEqual(res.mcp.server.command, '/usr/local/bin/scrapling', 'command patched to absolute path');
    assert(!calls.some((c) => c.includes('uv tool install')), 'detect-first: install command never runs when binary present');
  }

  {
    // Fresh install: first resolve misses, install runs, second resolve hits,
    // browsers + verify pass, command patched to the ~/.local/bin path.
    const calls = [];
    let whichCalls = 0;
    const exec = async (cmd) => {
      calls.push(cmd);
      if (cmd.startsWith('command -v')) {
        whichCalls++;
        return whichCalls === 1
          ? { ok: false, stdout: '', stderr: '' }
          : { ok: true, stdout: '/home/u/.local/bin/scrapling\n', stderr: '' };
      }
      if (cmd.includes('uv tool install')) return { ok: true, stdout: '', stderr: '' };
      if (cmd.includes('--version')) return { ok: true, stdout: 'scrapling 0.3', stderr: '' };
      if (cmd.endsWith(' install')) return { ok: true, stdout: '', stderr: '' }; // {bin} install (browsers)
      return { ok: false, stdout: '', stderr: 'unexpected: ' + cmd };
    };
    const res = await prepareMcp({ mcp: scraplingEntry(), exec });
    assert(res.ok && res.ran === true, 'missing binary => install runs, ok');
    assertEqual(res.mcp.server.command, '/home/u/.local/bin/scrapling', 'command patched to resolved absolute path');
    assert(
      calls.some((c) => c.includes('uv tool install')),
      'install command ran',
    );
    assert(
      calls.some((c) => c.includes("'/home/u/.local/bin/scrapling' install")),
      'browser post_install ran against the absolute path',
    );
  }

  {
    // Verify fails => entry reported failed, config NOT considered writable.
    const exec = async (cmd) => {
      if (cmd.startsWith('command -v')) return { ok: true, stdout: '/usr/local/bin/scrapling\n', stderr: '' };
      if (cmd.includes('--version')) return { ok: false, stdout: '', stderr: 'ModuleNotFoundError: mcp' };
      return { ok: true, stdout: '', stderr: '' };
    };
    const res = await prepareMcp({ mcp: scraplingEntry(), exec });
    assert(!res.ok, 'verify failure => not ok');
    assert(/verifica/.test(res.error || ''), 'verify failure => clear error message');
  }

  {
    // Install fails => not ok, clear error, no verify attempted.
    const exec = async (cmd) => {
      if (cmd.startsWith('command -v')) return { ok: false, stdout: '', stderr: '' };
      if (cmd.includes('uv tool install')) return { ok: false, stdout: '', stderr: 'network unreachable' };
      return { ok: false, stdout: '', stderr: 'unexpected: ' + cmd };
    };
    const res = await prepareMcp({ mcp: scraplingEntry(), exec });
    assert(!res.ok, 'install failure => not ok');
    assert(/instala/.test(res.error || ''), 'install failure => clear error message');
  }

  {
    // Installed but never resolvable afterwards => explicit not-found error.
    let whichCalls = 0;
    const exec = async (cmd) => {
      if (cmd.startsWith('command -v')) {
        whichCalls++;
        return { ok: false, stdout: '', stderr: '' };
      }
      if (cmd.includes('uv tool install')) return { ok: true, stdout: '', stderr: '' };
      return { ok: true, stdout: '', stderr: '' };
    };
    const res = await prepareMcp({ mcp: scraplingEntry(), exec });
    assert(!res.ok && /não encontrado/.test(res.error || ''), 'install ok but unresolved => not-found error');
    assert(whichCalls >= 2, 're-resolves after install');
  }

  {
    // No setup block => untouched pass-through, exec never called.
    const noSetup = { id: 'context7', server: { command: 'npx', args: ['-y', 'x'] } };
    const exec = async () => {
      throw new Error('exec should not run for a setup-less entry');
    };
    const res = await prepareMcp({ mcp: noSetup, exec });
    assert(res.ok && res.ran === false && res.mcp === noSetup, 'setup-less entry passes through untouched');
  }

  // ───────────────────────────────────────────────────────────────────────
  section('prepareMcps (split ready/failed)');

  {
    const good = { id: 'context7', server: { command: 'npx', args: ['-y', 'x'] } }; // no setup => always ready
    const exec = async (cmd) => {
      if (cmd.startsWith('command -v')) return { ok: true, stdout: '/x/scrapling\n', stderr: '' };
      if (cmd.includes('--version')) return { ok: false, stdout: '', stderr: 'boom' }; // scrapling verify fails
      return { ok: true, stdout: '', stderr: '' };
    };
    const { ready, failed } = await prepareMcps({ mcps: [good, scraplingEntry()], exec });
    assertEqual(
      ready.map((m) => m.id),
      ['context7'],
      'ready keeps the healthy server, drops the broken one',
    );
    assert(failed.length === 1 && failed[0].id === 'scrapling', 'failed carries the broken id + error');
    assert(!!failed[0].error, 'failed entry has an error string');
  }

  {
    const res = await prepareMcps({ mcps: [], exec: async () => ({ ok: true }) });
    assertEqual(res, { ready: [], failed: [] }, 'empty input => empty split (safe)');
  }

  // Restore HOME now that the resolve-sensitive sections are done.
  process.env.HOME = originalHome;
  await fsp.rm(emptyHome, { recursive: true, force: true });

  // ───────────────────────────────────────────────────────────────────────
  section('setup never leaks into .mcp.json');

  {
    const tmp4 = await fsp.mkdtemp(path.join(os.tmpdir(), 'wizz-mcp-'));
    try {
      // A prepared entry: setup sits beside server; only server is written.
      const prepared = {
        id: 'scrapling',
        server: { command: '/usr/local/bin/scrapling', args: ['mcp'] },
        setup: { bin: 'scrapling', install: 'x' },
      };
      await writeMcpConfig({ projectDir: tmp4, mcps: [prepared] });
      const written = JSON.parse(fs.readFileSync(path.join(tmp4, '.mcp.json'), 'utf8'));
      assertEqual(
        written.mcpServers.scrapling,
        { command: '/usr/local/bin/scrapling', args: ['mcp'] },
        'writes absolute command + args only',
      );
      assert(!('setup' in written.mcpServers.scrapling), 'setup block is never written to .mcp.json');
    } finally {
      await fsp.rm(tmp4, { recursive: true, force: true });
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${failed}${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  if (failed === 0) {
    console.log(`${colors.green}✨ All mcp-config tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Some mcp-config tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error(`${colors.red}Test runner failed:${colors.reset}`, error.message);
  console.error(error.stack);
  process.exit(1);
});
