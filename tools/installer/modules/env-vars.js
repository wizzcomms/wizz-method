// Smart env var assistance for MCP `${VAR}` placeholders (Fase 3, item 3.3 da
// auditoria 360°; design primário em
// `_audit/2026-07-07-parte3-auditoria-installer-envvars.md`, seção E).
//
// PROBLEM: a registry-driven `.mcp.json` entry can declare `env: { KEY:
// "${SOME_VAR}" }` (or a `${VAR}` inside `args`). If `SOME_VAR` is not set
// anywhere the MCP subprocess fails at runtime with an opaque error. This
// module detects those placeholders, tries to resolve them from the
// environment, and — only when interactive — offers to fill the gap.
//
// C7 (the bug this design fixes): the naive version of this feature persists
// the secret to `.env` or `~/.wizz-env`. Neither is read by the Claude Code
// runtime that spawns the MCP subprocess, so the secret would never actually
// reach it — the feature would *look* like it worked and silently not. The
// ONLY place Claude Code is confirmed to merge into every subprocess's
// environment for a project is the `env` key of that project's
// `.claude/settings.local.json`. That is the sole persistence target here.
//
// Design rules (deliberately conservative, mirrors mcp-config.js):
//   - NEVER write the real value into `.mcp.json` — it keeps the `${VAR}`
//     placeholder forever; only `.claude/settings.local.json` ever sees the
//     secret.
//   - NEVER overwrite a key the user (or a previous run) already put in
//     `settings.local.json` — additive merge only, same spirit as the
//     `.mcp.json` merge in mcp-config.js.
//   - NEVER echo the secret in a log line, an error message, or the DX
//     summary — only variable names and status are printed.
//   - NEVER fail the install over a var the user chose to skip — the
//     placeholder stays in `.mcp.json`, and the summary explains how to
//     configure it later.
//
// API (decomposed per E3 so each piece is unit-testable without a TTY):
//   extractEnvPlaceholders(mcps)              — pure
//   resolveEnvVars(vars, opts)                — I/O read (providers + prompt)
//   persistEnvValues(toPersist, opts)         — I/O write (settings.local.json)
//   persistProjectEnv(projectDir, envRecord)  — the actual writer, reusable
//   promptMissingEnvVars(mcps, opts)          — thin orchestrator of the above

const path = require('node:path');
const fs = require('../fs-native');
const prompts = require('../prompts');

// Deliberately POSIX-strict (uppercase + underscore only): this both matches
// standard env var naming and doubles as a defensive filter against false
// positives like `{bin}` (no `$` prefix at all, so it never matches) or a
// lowercase template token that isn't meant to be an env var.
const ENV_VAR_REGEX = /\$\{([A-Z_][A-Z0-9_]*)(?::-([^}]*))?\}/g;

/**
 * Scan a list of resolved MCP entries for `${VAR}` / `${VAR:-default}`
 * placeholders in `server.env` values and `server.args` items. Pure: no I/O,
 * no prompting — just extraction + dedup.
 *
 * A var with a default (`${VAR:-default}`) is still returned (`hasDefault:
 * true`) so callers can report it, but `resolveEnvVars` treats it as an
 * automatic skip: the Claude Code runtime resolves `${VAR:-default}` itself,
 * so asking the user for it would be pointless.
 *
 * @param {Array<{id: string, server: {env?: Object, args?: string[]}}>} mcps
 * @returns {Array<{name: string, mcpIds: string[], hasDefault: boolean, default: string|undefined}>}
 */
function extractEnvPlaceholders(mcps) {
  const byName = new Map();

  for (const mcp of mcps || []) {
    const server = mcp && mcp.server;
    if (!server) continue;

    const haystacks = [...Object.values(server.env || {}), ...(Array.isArray(server.args) ? server.args : [])].filter(
      (value) => typeof value === 'string',
    );

    for (const value of haystacks) {
      for (const match of value.matchAll(ENV_VAR_REGEX)) {
        const name = match[1];
        const hasDefault = match[2] !== undefined;

        let entry = byName.get(name);
        if (!entry) {
          entry = { name, mcpIds: new Set(), hasDefault: false, default: undefined };
          byName.set(name, entry);
        }
        if (mcp.id) entry.mcpIds.add(mcp.id);
        // A default seen on ANY occurrence marks the var as having one, even
        // if another occurrence (unlikely, but defensive) omitted it.
        if (hasDefault) {
          entry.hasDefault = true;
          entry.default = match[2];
        }
      }
    }
  }

  return [...byName.values()].map((entry) => ({ ...entry, mcpIds: [...entry.mcpIds] }));
}

/**
 * `process.env` as an env var provider (E3 seam: `{ name, available, get }`).
 * @returns {{name: string, available: () => Promise<boolean>, get: (name: string) => Promise<string|undefined>}}
 */
function createProcessEnvProvider() {
  return {
    name: 'process.env',
    available: async () => true,
    get: async (name) => process.env[name],
  };
}

/**
 * Minimal `.env` parser: `KEY=value` per line, `#` comments, blank lines
 * skipped, optional matching single/double quotes stripped. Intentionally
 * not a full dotenv implementation (no multiline values, no `export` prefix,
 * no interpolation) — this reads a value that may already exist, it never
 * writes one, and the registry only has 4 single-var MCPs today (E2).
 * @param {string} content
 * @returns {Record<string, string>}
 */
function parseDotenv(content) {
  const result = {};
  for (const rawLine of String(content).split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!key) continue;
    let value = line.slice(eq + 1).trim();
    if (value.length >= 2) {
      const first = value[0];
      const last = value.at(-1);
      if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        value = value.slice(1, -1);
      }
    }
    result[key] = value;
  }
  return result;
}

/**
 * A `.env` file as an env var provider — read-only, and only consulted if
 * the file exists (E1: "arquivo .env se existir"). Never created, never
 * written; a var found here is classified `existing`, same as `process.env`.
 * @param {string} dotenvPath - Absolute path to the candidate `.env` file
 * @returns {{name: string, available: () => Promise<boolean>, get: (name: string) => Promise<string|undefined>}}
 */
function createDotenvFileProvider(dotenvPath) {
  let cache = null;

  async function load() {
    if (cache) return cache;
    cache = {};
    if (!dotenvPath || !(await fs.pathExists(dotenvPath))) return cache;
    try {
      cache = parseDotenv(await fs.readFile(dotenvPath, 'utf8'));
    } catch {
      // Unreadable .env (permissions, race) — treat as absent, never throw.
      cache = {};
    }
    return cache;
  }

  return {
    name: 'dotenv',
    available: async () => !!dotenvPath && (await fs.pathExists(dotenvPath)),
    get: async (name) => (await load())[name],
  };
}

/**
 * Try each provider in order, returning the first non-empty value found.
 * A provider throwing or being unavailable is skipped, never fatal — one
 * broken provider must not block the chain (e.g. an unreadable `.env`).
 * @param {string} name - Var name to look up
 * @param {Array<Object>} providers
 * @returns {Promise<string|undefined>}
 */
async function findInProviders(name, providers) {
  for (const provider of providers || []) {
    if (!provider) continue;
    try {
      const isAvailable = typeof provider.available === 'function' ? await provider.available() : true;
      if (!isAvailable) continue;
      const value = await provider.get(name);
      if (value !== undefined && value !== null && value !== '') return value;
    } catch {
      continue;
    }
  }
  return;
}

/**
 * Default interactive prompter: masks input via `password()` (never
 * `text()` — E4), never echoes the value anywhere else. An empty submission
 * (plain Enter) is treated as "skip this one", same as a hard cancel.
 * @returns {(entry: {name: string, mcpIds: string[]}) => Promise<string|undefined>}
 */
function createDefaultPrompter() {
  return async (entry) => {
    const usedBy = entry.mcpIds && entry.mcpIds.length > 0 ? ` (usada por: ${entry.mcpIds.join(', ')})` : '';
    const value = await prompts.password({
      message: `Valor para ${entry.name}${usedBy} — Enter para pular:`,
      // @clack/prompts requires synchronous validate (prompts.js:763-765);
      // format is unknown per-var, so we only guard against literal
      // whitespace-only input slipping through as a "value".
      validate: (input) => (typeof input === 'string' && input.trim() !== input ? 'Sem espaços no início/fim' : undefined),
    });
    if (value === undefined || value === null || value === '') return;
    return value;
  };
}

/**
 * Resolve a list of extracted vars against provider chain + optional
 * interactive prompt. Pure I/O, no persistence — that is `persistEnvValues`'s
 * job. Fully testable without a real TTY via the injected `prompter`.
 *
 * @param {Array<{name: string, mcpIds: string[], hasDefault: boolean}>} vars
 * @param {Object} [opts]
 * @param {boolean} [opts.interactive=false] - Whether to prompt for missing vars
 * @param {Array<Object>} [opts.providers] - Provider chain, tried in order
 * @param {(entry) => Promise<string|undefined>} [opts.prompter] - Injectable prompt fn
 * @returns {Promise<{filled: Array, skipped: Array, existing: Array, toPersist: Record<string,string>}>}
 */
async function resolveEnvVars(vars, opts = {}) {
  const { interactive = false, providers = [createProcessEnvProvider()], prompter = null } = opts;

  const filled = [];
  const skipped = [];
  const existing = [];
  const toPersist = {};

  for (const entry of vars || []) {
    // A default is resolved by the Claude Code runtime itself; asking would
    // be redundant, so this is an unconditional skip regardless of what the
    // providers know (E7: "com default => sempre skipped").
    if (entry.hasDefault) {
      skipped.push(entry);
      continue;
    }

    const found = await findInProviders(entry.name, providers);
    if (found !== undefined) {
      existing.push(entry);
      continue;
    }

    if (!interactive || !prompter) {
      skipped.push(entry);
      continue;
    }

    const answer = await prompter(entry);
    if (answer === undefined || answer === null || answer === '') {
      skipped.push(entry);
      continue;
    }

    filled.push(entry);
    toPersist[entry.name] = answer;
  }

  return { filled, skipped, existing, toPersist };
}

/**
 * The actual writer: merge `envRecord` into `<projectDir>/.claude/settings.local.json`
 * under the `env` key. Additive only — a key already present in the file is
 * NEVER overwritten (the user, or a previous run, may have hand-edited it).
 * Exported standalone (not just via `persistEnvValues`) because 3.8-E1 (the
 * `WIZZ_TRACE` opt-in) reuses this exact writer for a value that has nothing
 * to do with MCP env vars — one merge implementation, two callers.
 *
 * chmod 600 is applied after a write that actually changed the file (POSIX
 * only; `process.platform === 'win32'` short-circuits to a documented no-op,
 * and any chmod failure is swallowed — a permission tweak must never fail
 * the install).
 *
 * @param {string} projectDir - Project root (settings.local.json lives at
 *   `<projectDir>/.claude/settings.local.json`)
 * @param {Record<string,string>} envRecord - Vars to merge into `env`
 * @returns {Promise<string|null>} Absolute path written/merged, or null when
 *   `envRecord` is empty (no-op, nothing to persist)
 */
async function persistProjectEnv(projectDir, envRecord) {
  if (!envRecord || Object.keys(envRecord).length === 0) return null;

  const claudeDir = path.join(projectDir, '.claude');
  const file = path.join(claudeDir, 'settings.local.json');
  await fs.ensureDir(claudeDir);

  let settings = {};
  if (await fs.pathExists(file)) {
    try {
      settings = JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (error) {
      throw new Error(`.claude/settings.local.json existe mas não é JSON válido: ${error.message}`);
    }
  }
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) settings = {};
  if (!settings.env || typeof settings.env !== 'object' || Array.isArray(settings.env)) settings.env = {};

  let changed = false;
  for (const [key, value] of Object.entries(envRecord)) {
    // Never overwrite: a key already present wins, always.
    if (Object.prototype.hasOwnProperty.call(settings.env, key)) continue;
    settings.env[key] = value;
    changed = true;
  }

  if (changed) {
    await fs.writeJson(file, settings, { spaces: 2 });
    if (process.platform !== 'win32') {
      try {
        await fs.chmod(file, 0o600);
      } catch {
        // Best-effort: some filesystems/CI sandboxes reject chmod. Never
        // fail the install over a permission tweak on a file we just wrote.
      }
    }
  }

  return file;
}

/**
 * `persistEnvValues(toPersist, { projectDir, target })` — the E3-shaped
 * entry point. Only `target: 'settings-local'` is implemented: writing
 * secrets to a `dotenv` target is exactly the C7 anti-pattern this whole
 * design exists to avoid (the value would never reach the MCP subprocess's
 * environment), so it is rejected rather than silently doing the wrong
 * thing. `target` is still an explicit parameter (vs. hardcoding) so the
 * seam matches the audit's documented shape for future targets.
 *
 * @param {Record<string,string>} toPersist - Vars to persist (from `resolveEnvVars`)
 * @param {Object} opts
 * @param {string} opts.projectDir - Project root
 * @param {string} [opts.target='settings-local'] - Persistence target
 * @returns {Promise<string|null>} Absolute path written, or null when empty
 */
async function persistEnvValues(toPersist, opts = {}) {
  const { projectDir, target = 'settings-local' } = opts;
  if (!toPersist || Object.keys(toPersist).length === 0) return null;

  if (target !== 'settings-local') {
    throw new Error(
      `persistEnvValues: target '${target}' não suportado (só 'settings-local' escreve secrets em local lido pelo runtime — ver C7 na auditoria)`,
    );
  }

  return persistProjectEnv(projectDir, toPersist);
}

/**
 * Render the DX summary (E6) — the highest-value part of this feature: turn
 * a skipped var from a dead end into a 30-second fix. One line per var,
 * grouped by outcome. Never includes a raw secret value, only names/status.
 * @param {{filled: Array, skipped: Array, existing: Array}} resolved
 * @returns {string|null} Formatted block, or null when there is nothing to say
 */
function formatSummary({ filled, skipped, existing }) {
  const total = (filled?.length || 0) + (skipped?.length || 0) + (existing?.length || 0);
  if (total === 0) return null;

  const lines = [];
  for (const entry of existing || []) {
    lines.push(`  ✓ ${entry.name.padEnd(28)} já existia no ambiente`);
  }
  for (const entry of filled || []) {
    lines.push(`  ✓ ${entry.name.padEnd(28)} configurada agora (.claude/settings.local.json)`);
  }
  for (const entry of skipped || []) {
    if (entry.hasDefault) {
      lines.push(`  ✓ ${entry.name.padEnd(28)} tem default no MCP, nada a configurar`);
      continue;
    }
    const usedBy = entry.mcpIds && entry.mcpIds.length > 0 ? entry.mcpIds.join(', ') : 'desconhecido';
    lines.push(
      `  ○ ${entry.name.padEnd(28)} pulada — MCP ${usedBy} fica inativo até configurar`,
      `      → adicione em .claude/settings.local.json: { "env": { "${entry.name}": "..." } }`,
    );
  }

  return `Env vars dos MCPs:\n${lines.join('\n')}`;
}

/**
 * Thin orchestrator: extract → resolve → persist → summarize. Composes the
 * three primitives above; this is what the installer calls.
 *
 * Contract (E1, enforced by the CALLER, not here — this function only does
 * what it's told):
 *   - Call with the `ready` subset of `toWrite` (never `toRecommend`).
 *   - Call with `interactive: false` whenever `!!options.yes ||
 *     !process.stdin.isTTY` — the caller computes that, this module has no
 *     opinion on what "interactive" means, only how to behave given it.
 *
 * @param {Array<Object>} mcps - Resolved MCP entries to scan (already
 *   filtered by the caller to exclude ids already in `.mcp.json` and to
 *   exclude `toRecommend`)
 * @param {Object} [opts]
 * @param {string} opts.projectDir - Project root (for persistence + the
 *   default `.env` provider)
 * @param {boolean} [opts.interactive=false]
 * @param {Array<Object>} [opts.providers] - Defaults to `[processEnv, dotenvFile(<projectDir>/.env)]`
 * @param {(entry) => Promise<string|undefined>} [opts.prompter] - Defaults to
 *   the masked `password()` prompter
 * @returns {Promise<{filled: Array, skipped: Array, existing: Array, envFile: string|null}>}
 */
async function promptMissingEnvVars(mcps, opts = {}) {
  const { projectDir, interactive = false, providers, prompter } = opts;

  const vars = extractEnvPlaceholders(mcps);
  if (vars.length === 0) return { filled: [], skipped: [], existing: [], envFile: null };

  const resolvedProviders = providers || [createProcessEnvProvider(), createDotenvFileProvider(path.join(projectDir, '.env'))];
  const resolvedPrompter = interactive ? prompter || createDefaultPrompter() : null;

  const resolved = await resolveEnvVars(vars, {
    interactive,
    providers: resolvedProviders,
    prompter: resolvedPrompter,
  });

  let envFile = null;
  if (Object.keys(resolved.toPersist).length > 0) {
    envFile = await persistEnvValues(resolved.toPersist, { projectDir, target: 'settings-local' });
  }

  const summary = formatSummary(resolved);
  if (summary) await prompts.log.info(summary);

  return { filled: resolved.filled, skipped: resolved.skipped, existing: resolved.existing, envFile };
}

module.exports = {
  extractEnvPlaceholders,
  resolveEnvVars,
  persistEnvValues,
  persistProjectEnv,
  promptMissingEnvVars,
  createProcessEnvProvider,
  createDotenvFileProvider,
  formatSummary,
};
