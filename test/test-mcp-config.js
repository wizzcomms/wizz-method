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

const { resolveMcps, toServerConfig, renderAddCommand, writeMcpConfig } = require('../tools/installer/modules/mcp-config');

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
      assertEqual(res, { added: [], skipped: [], file: null }, 'empty mcps => no-op');
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
