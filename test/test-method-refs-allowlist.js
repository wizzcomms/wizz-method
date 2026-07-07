/**
 * Method Refs Allowlist Tests
 *
 * Tests collectRegistryIds()/isValidReference() from tools/validate-method-refs.js.
 *
 * M15 (auditoria 2026-07-07): a allowlist de tokens de CLI/MCP era hardcoded
 * (VALID_NON_SKILL_TOKENS) e unida aos ids do registry, sem nunca podar — uma
 * CLI removida do registry continuava "válida" para sempre. Este teste fecha
 * o caso extremo: uma CLI presente no registry hoje some do registry amanhã
 * e o validador precisa parar de aceitá-la como referência.
 *
 * Usage: node test/test-method-refs-allowlist.js
 */

const { collectRegistryIds, isValidReference, EXTRA_TOOL_TOKENS } = require('../tools/validate-method-refs.js');

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

function section(title) {
  console.log(`\n${colors.cyan}── ${title} ──${colors.reset}`);
}

const REGISTRY_WITH_RTK = {
  areas: {
    growth: {
      clis: [{ id: 'rtk', when: 'token economy', check: 'rtk --version', install: 'curl -fsSL https://x/install.sh | sh' }],
      mcps: [{ id: 'magic', when: 'UI', server: { command: 'npx', args: ['-y', '@21st-dev/magic'] } }],
    },
  },
  utility: [],
  mcp_utility: [{ id: 'context7', when: 'docs', server: { command: 'npx' } }],
  cli_utility: [],
};

const REGISTRY_WITHOUT_RTK = {
  areas: {
    growth: {
      clis: [],
      mcps: [{ id: 'magic', when: 'UI', server: { command: 'npx', args: ['-y', '@21st-dev/magic'] } }],
    },
  },
  utility: [],
  mcp_utility: [{ id: 'context7', when: 'docs', server: { command: 'npx' } }],
  cli_utility: [],
};

function runTests() {
  section('collectRegistryIds — deriva do registry, não hardcoded');

  {
    const ids = collectRegistryIds(REGISTRY_WITH_RTK);
    assert(ids.tools.has('rtk'), 'CLI presente no registry entra na allowlist');
    assert(ids.tools.has('magic'), 'MCP presente no registry entra na allowlist');
    assert(ids.tools.has('context7'), 'MCP cross-cutting (mcp_utility) entra na allowlist');
  }

  {
    // O caso extremo do M15: CLI removida do registry deixa de ser válida.
    const ids = collectRegistryIds(REGISTRY_WITHOUT_RTK);
    assert(!ids.tools.has('rtk'), 'CLI removida do registry deixa de ser aceita como referência válida');
    assert(ids.tools.has('magic'), 'demais entradas do registry continuam válidas');
  }

  {
    const validWith = { skills: new Set(), agents: new Set(), tools: collectRegistryIds(REGISTRY_WITH_RTK).tools };
    const validWithout = { skills: new Set(), agents: new Set(), tools: collectRegistryIds(REGISTRY_WITHOUT_RTK).tools };
    assert(isValidReference('rtk', validWith), 'isValidReference aceita `rtk` enquanto está no registry');
    assert(!isValidReference('rtk', validWithout), 'isValidReference rejeita `rtk` depois que sai do registry');
  }

  section('EXTRA_TOOL_TOKENS — lista extra mínima, só o genuinamente fora do registry');

  {
    // Cada item da lista extra precisa ter uma razão documentada no código
    // (comentário por token) por não estar no registry — aqui só garantimos
    // que a lista continua pequena e não virou uma allowlist paralela de novo.
    assert(EXTRA_TOOL_TOKENS.size <= 6, `lista extra continua mínima (tamanho atual: ${EXTRA_TOOL_TOKENS.size})`);
  }

  {
    const ids = collectRegistryIds(REGISTRY_WITHOUT_RTK);
    for (const token of EXTRA_TOOL_TOKENS) {
      assert(ids.tools.has(token), `token extra "${token}" continua na allowlist mesmo sem entrada correspondente no registry`);
    }
  }

  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${failed}${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  if (failed === 0) {
    console.log(`${colors.green}✨ All method-refs allowlist tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Some method-refs allowlist tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

runTests();
