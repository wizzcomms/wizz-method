/**
 * Network Retry Tests (Tarefa 2.12 da auditoria)
 *
 * Cobre o retry pontual (1 re-tentativa, backoff curto) adicionado aos
 * call sites de rede do installer:
 *   - tools/installer/core/manifest.js             (fetchNpmVersion → registry npm)
 *   - tools/installer/modules/channel-resolver.js  (fetchJson → API do GitHub)
 *   - tools/installer/modules/external-manager.js  (execSyncWithRetry → git clone/fetch)
 *
 * Estratégia de mock: como `node:https` e `node:child_process` são módulos
 * built-in com cache único por processo, sobrescrever `https.get` /
 * `child_process.execFile` / `child_process.execSync` ANTES do primeiro
 * `require` dos módulos sob teste garante que a referência capturada
 * internamente (via destructuring no topo de cada arquivo) aponte para o
 * stub. Mesma família de técnica de test/test-installer-channels.js, mas
 * simulando falha de rede em vez de só testar funções puras.
 *
 * Usage: node test/test-network-retry.js
 */

const https = require('node:https');
const childProcess = require('node:child_process');

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
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    passed++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (errorMessage) {
      console.log(`  ${colors.dim}${errorMessage}${colors.reset}`);
    }
    failed++;
  }
}

function assertEqual(actual, expected, testName) {
  const ok = actual === expected;
  assert(ok, testName, ok ? '' : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function section(title) {
  console.log(`\n${colors.cyan}── ${title} ──${colors.reset}`);
}

// ───────────────────────────────────────────────────────────────────────────
// Fake https.get: consome uma fila de "respostas" em ordem, uma por chamada
// (a última é reusada se houver mais chamadas do que respostas na fila).
// Suporta as duas formas de assinatura usadas no repo:
//   https.get(url, callback)
//   https.get(url, options, callback)
// ───────────────────────────────────────────────────────────────────────────
function createFakeGet(responses) {
  let callCount = 0;
  const fakeGet = function (url, optionsOrCallback, maybeCallback) {
    const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
    const responseIndex = Math.min(callCount, responses.length - 1);
    const scenario = responses[responseIndex];
    callCount++;

    const listeners = {};
    const req = {
      on(event, handler) {
        listeners[event] = handler;
        return req;
      },
      setTimeout(_ms, handler) {
        listeners.timeout = handler;
        return req;
      },
      destroy() {},
    };

    process.nextTick(() => {
      if (scenario.type === 'error') {
        const err = new Error(scenario.message || 'simulated network error');
        if (scenario.code) err.code = scenario.code;
        if (listeners.error) listeners.error(err);
        return;
      }
      if (scenario.type === 'timeout') {
        if (listeners.timeout) listeners.timeout();
        return;
      }
      // type === 'response'
      const res = {
        statusCode: scenario.statusCode,
        on(event, handler) {
          if (event === 'data') handler(Buffer.from(scenario.body));
          if (event === 'end') handler();
          return res;
        },
      };
      callback(res);
    });

    return req;
  };
  fakeGet.getCallCount = () => callCount;
  return fakeGet;
}

// ───────────────────────────────────────────────────────────────────────────
// Fake execSync dispatcher: consome uma fila de "cenários" em ordem. Fica
// instalado permanentemente em vez do execSync real ANTES do require de
// external-manager.js, para que a const `execSync` capturada por
// destructuring no topo daquele módulo aponte para este dispatcher.
// ───────────────────────────────────────────────────────────────────────────
function createFakeExecSync(scenarios) {
  let callCount = 0;
  const fakeExecSync = function (_command, _options) {
    const scenario = scenarios[Math.min(callCount, scenarios.length - 1)];
    callCount++;
    if (scenario.type === 'error') {
      throw new Error(scenario.message);
    }
    return Buffer.from(scenario.result || 'ok');
  };
  fakeExecSync.getCallCount = () => callCount;
  return fakeExecSync;
}

// Força `npm view` a falhar sempre, para que Manifest#fetchNpmVersion caia
// no fallback via https.get em todo teste (sem depender de ter npm no PATH
// nem bater na rede real).
const originalExecFile = childProcess.execFile;
childProcess.execFile = function fakeExecFile(_file, _args, optionsOrCallback, maybeCallback) {
  const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
  process.nextTick(() => callback(new Error('npm CLI not available in test env')));
};

// Dispatcher mutável para execSync: cada teste troca `currentExecSync` antes
// de chamar execSyncWithRetry, então lê a partir dele indiretamente.
let currentExecSync = null;
const originalExecSync = childProcess.execSync;
childProcess.execSync = function dispatchExecSync(command, options) {
  if (!currentExecSync) {
    throw new Error('test setup error: currentExecSync not configured');
  }
  return currentExecSync(command, options);
};

const { Manifest } = require('../tools/installer/core/manifest');
const { fetchStableTags, tagExists, _clearTagCache } = require('../tools/installer/modules/channel-resolver');
const { isTransientGitError, execSyncWithRetry } = require('../tools/installer/modules/external-manager');

childProcess.execFile = originalExecFile;
childProcess.execSync = originalExecSync; // module-level closures in external-manager.js keep pointing at our dispatcher

const originalHttpsGet = https.get;

async function runTests() {
  // ─────────────────────────────────────────────────────────────────────────
  // manifest.js :: fetchNpmVersion (registry npm)
  // ─────────────────────────────────────────────────────────────────────────
  section('manifest.js :: fetchNpmVersion retry');

  {
    const fakeGet = createFakeGet([
      { type: 'error', code: 'ECONNRESET', message: 'read ECONNRESET' },
      { type: 'response', statusCode: 200, body: JSON.stringify({ 'dist-tags': { latest: '3.2.1' } }) },
    ]);
    https.get = fakeGet;
    const manifest = new Manifest();
    const version = await manifest.fetchNpmVersion('valid-test-pkg');
    https.get = originalHttpsGet;

    assertEqual(version, '3.2.1', 'transient ECONNRESET on 1st attempt, success on retry → resolves version');
    assertEqual(fakeGet.getCallCount(), 2, 'transient failure retried exactly once (2 calls total)');
  }

  {
    const fakeGet = createFakeGet([{ type: 'error', code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND' }]);
    https.get = fakeGet;
    const manifest = new Manifest();
    const version = await manifest.fetchNpmVersion('valid-test-pkg-2');
    https.get = originalHttpsGet;

    // 1 falha transitória seguida de outra falha transitória: ainda assim só
    // 1 retry é permitido (não é retry infinito) → resultado final null.
    assertEqual(version, null, 'ENOTFOUND on both attempts → gives up after 1 retry, resolves null');
    assertEqual(fakeGet.getCallCount(), 2, 'still only 2 calls total (1 retry, no more)');
  }

  {
    const fakeGet = createFakeGet([{ type: 'response', statusCode: 404, body: JSON.stringify({ error: 'Not Found' }) }]);
    https.get = fakeGet;
    const manifest = new Manifest();
    const version = await manifest.fetchNpmVersion('valid-test-pkg-3');
    https.get = originalHttpsGet;

    assertEqual(version, null, '404 (non-transient) → resolves null');
    assertEqual(fakeGet.getCallCount(), 1, '404 does NOT trigger a retry (only 1 call)');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // channel-resolver.js :: fetchJson via fetchStableTags/tagExists (API do GitHub)
  // ─────────────────────────────────────────────────────────────────────────
  section('channel-resolver.js :: fetchJson retry');

  {
    _clearTagCache();
    const fakeGet = createFakeGet([
      { type: 'error', code: 'ECONNRESET', message: 'read ECONNRESET' },
      { type: 'response', statusCode: 200, body: JSON.stringify([{ name: 'v1.0.0' }, { name: 'v2.0.0' }]) },
    ]);
    https.get = fakeGet;
    const tags = await fetchStableTags('acme', 'retry-test-1');
    https.get = originalHttpsGet;

    assertEqual(tags.length, 2, 'transient ECONNRESET on 1st attempt, success on retry → tags resolved');
    assertEqual(tags[0].version, '2.0.0', 'tags sorted desc, highest first');
    assertEqual(fakeGet.getCallCount(), 2, 'transient failure retried exactly once (2 calls total)');
  }

  {
    // 5xx também é transitório (spec: timeout, ECONNRESET, ENOTFOUND, EAI_AGAIN, 5xx)
    _clearTagCache();
    const fakeGet = createFakeGet([
      { type: 'response', statusCode: 502, body: 'Bad Gateway' },
      { type: 'response', statusCode: 200, body: JSON.stringify([{ name: 'v1.5.0' }]) },
    ]);
    https.get = fakeGet;
    const tags = await fetchStableTags('acme', 'retry-test-2');
    https.get = originalHttpsGet;

    assertEqual(tags.length, 1, '502 on 1st attempt, success on retry → tags resolved');
    assertEqual(tags[0].version, '1.5.0', 'resolved tag correct after retry');
    assertEqual(fakeGet.getCallCount(), 2, '5xx counts as transient, retried exactly once');
  }

  {
    // 404 (erro lógico/4xx) nunca deve re-tentar.
    const fakeGet = createFakeGet([{ type: 'response', statusCode: 404, body: JSON.stringify({ message: 'Not Found' }) }]);
    https.get = fakeGet;
    const exists = await tagExists('acme', 'retry-test-3', 'v9.9.9');
    https.get = originalHttpsGet;

    assertEqual(exists, false, '404 on tagExists resolves false');
    assertEqual(fakeGet.getCallCount(), 1, '404 (non-transient) does NOT trigger a retry (only 1 call)');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // external-manager.js :: execSyncWithRetry (git clone/fetch)
  // ─────────────────────────────────────────────────────────────────────────
  section('external-manager.js :: execSyncWithRetry (git clone/fetch)');

  assert(
    isTransientGitError(new Error("fatal: unable to access 'https://x': Could not resolve host: github.com")),
    'isTransientGitError: "could not resolve host" classified as transient',
  );
  assert(
    isTransientGitError(new Error('ssh: connect to host github.com port 22: Connection timed out')),
    'isTransientGitError: "timed out" classified as transient',
  );
  assert(
    isTransientGitError(new Error('error: RPC failed; curl 56 GnuTLS recv error: Connection reset by peer')),
    'isTransientGitError: "connection reset" classified as transient',
  );
  assert(isTransientGitError(new Error('fatal: early EOF')), 'isTransientGitError: "early EOF" classified as transient');
  assert(
    !isTransientGitError(new Error("fatal: repository 'https://x/y.git' not found")),
    'isTransientGitError: "repository not found" (erro lógico) NOT classified as transient',
  );
  assert(
    !isTransientGitError(new Error("fatal: couldn't find remote ref v9.9.9")),
    'isTransientGitError: missing tag/ref (erro lógico) NOT classified as transient',
  );

  {
    // execSync falha 1x com erro transitório (host GitHub inalcançável) e
    // sucede na re-tentativa — exercita a função real execSyncWithRetry
    // (incluindo o blockingDelay síncrono entre tentativas).
    const fakeExecSync = createFakeExecSync([
      { type: 'error', message: "fatal: unable to access 'https://github.com/x/y.git/': Could not resolve host: github.com" },
      { type: 'success', result: 'abc123\n' },
    ]);
    currentExecSync = fakeExecSync;
    const result = execSyncWithRetry('git clone --depth 1 "https://github.com/x/y.git" "/tmp/x"', { stdio: 'pipe' });
    currentExecSync = null;

    assertEqual(result.toString(), 'abc123\n', 'transient git error on 1st attempt, success on retry');
    assertEqual(fakeExecSync.getCallCount(), 2, 'transient git failure retried exactly once (2 calls total)');
  }

  {
    // Erro lógico (repo inexistente) nunca deve re-tentar.
    const fakeExecSync = createFakeExecSync([{ type: 'error', message: "fatal: repository 'https://github.com/x/y.git/' not found" }]);
    currentExecSync = fakeExecSync;
    let threw = false;
    try {
      execSyncWithRetry('git clone --depth 1 "https://github.com/x/y.git" "/tmp/x"', { stdio: 'pipe' });
    } catch {
      threw = true;
    }
    currentExecSync = null;

    assert(threw, 'non-transient git error propagates (does not retry)');
    assertEqual(fakeExecSync.getCallCount(), 1, 'non-transient git failure does NOT retry (only 1 call)');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────
  console.log('');
  console.log(`${colors.cyan}========================================`);
  console.log('Test Results:');
  console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${failed}${colors.reset}`);
  console.log(`========================================${colors.reset}\n`);

  if (failed === 0) {
    console.log(`${colors.green}✨ All network retry tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Some network retry tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error(`${colors.red}Test runner failed:${colors.reset}`, error.message);
  console.error(error.stack);
  process.exit(1);
});
