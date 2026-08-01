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
// GLOBAL KEY STORE (`~/.claude/wizz-env.json`): a key the user already typed
// in ANY project is reused silently in every new install — the store is read
// by the installer only (C7 still holds: the runtime never reads it), and a
// hit is copied into the new project's `settings.local.json`. A key typed at
// the prompt is saved to the store too, so it is only ever asked once.
//
// API (decomposed per E3 so each piece is unit-testable without a TTY):
//   extractEnvPlaceholders(mcps)              — pure
//   resolveEnvVars(vars, opts)                — I/O read (providers + prompt)
//   persistEnvValues(toPersist, opts)         — I/O write (settings.local.json)
//   persistProjectEnv(projectDir, envRecord)  — the actual writer, reusable
//   persistGlobalEnv(storePath, envRecord)    — writer do store global
//   promptMissingEnvVars(mcps, opts)          — thin orchestrator of the above

const path = require('node:path');
const os = require('node:os');
const fs = require('../fs-native');
const prompts = require('../prompts');

// Global key store, read by the INSTALLER only (never by the Claude Code
// runtime — C7 still holds). A value found here is copied into the project's
// `.claude/settings.local.json` at install time, which IS what reaches the
// MCP subprocess. This is what makes a key typed once in project A resolve
// silently in projects B, C, D... without ever living in the global
// settings.json `env` (which would expose it to every session of every
// project — the exact pattern the 360° audit flagged as a security critical).
function defaultGlobalEnvPath() {
  return path.join(os.homedir(), '.claude', 'wizz-env.json');
}

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
 * The global key store (`~/.claude/wizz-env.json`, flat `{ "VAR": "value" }`
 * map, chmod 600) as a provider. Read-only here — `persistGlobalEnv` is the
 * writer. Marked `persistToProject: true`: unlike `process.env`, a value from
 * this store is NOT in the runtime's environment, so the resolver must copy
 * it into the project's `settings.local.json` for it to actually reach the
 * MCP subprocess (C7).
 * @param {string} storePath - Absolute path to the global store file
 * @returns {{name: string, persistToProject: boolean, available: () => Promise<boolean>, get: (name: string) => Promise<string|undefined>}}
 */
function createGlobalStoreProvider(storePath) {
  let cache = null;

  async function load() {
    if (cache) return cache;
    cache = {};
    if (!storePath || !(await fs.pathExists(storePath))) return cache;
    try {
      const parsed = JSON.parse(await fs.readFile(storePath, 'utf8'));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) cache = parsed;
    } catch {
      // Malformed/unreadable store — treat as empty, never throw.
      cache = {};
    }
    return cache;
  }

  return {
    name: 'global-store',
    persistToProject: true,
    available: async () => !!storePath && (await fs.pathExists(storePath)),
    get: async (name) => {
      const value = (await load())[name];
      return typeof value === 'string' && value !== '' ? value : undefined;
    },
  };
}

/**
 * Try each provider in order, returning the first non-empty value found and
 * the provider that had it (so the caller can honor `persistToProject`).
 * A provider throwing or being unavailable is skipped, never fatal — one
 * broken provider must not block the chain (e.g. an unreadable `.env`).
 * @param {string} name - Var name to look up
 * @param {Array<Object>} providers
 * @returns {Promise<{value: string, provider: Object}|undefined>}
 */
async function findInProviders(name, providers) {
  for (const provider of providers || []) {
    if (!provider) continue;
    try {
      const isAvailable = typeof provider.available === 'function' ? await provider.available() : true;
      if (!isAvailable) continue;
      const value = await provider.get(name);
      if (value !== undefined && value !== null && value !== '') return { value, provider };
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
 * @returns {Promise<{filled: Array, skipped: Array, existing: Array, imported: Array,
 *   toPersist: Record<string,string>, toPersistGlobal: Record<string,string>}>}
 *   `existing` = found in a runtime-visible source (process.env/.env), nothing
 *   to write. `imported` = found in a `persistToProject` provider (the global
 *   store): resolved without prompting, but must be written to the project's
 *   settings.local.json (included in `toPersist`). `toPersistGlobal` = the
 *   subset of typed answers that should ALSO be saved to the global store so
 *   the next project never asks.
 */
async function resolveEnvVars(vars, opts = {}) {
  const { interactive = false, providers = [createProcessEnvProvider()], prompter = null } = opts;

  const filled = [];
  const skipped = [];
  const existing = [];
  const imported = [];
  const toPersist = {};
  const toPersistGlobal = {};

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
      if (found.provider && found.provider.persistToProject) {
        imported.push(entry);
        toPersist[entry.name] = found.value;
      } else {
        existing.push(entry);
      }
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
    toPersistGlobal[entry.name] = answer;
  }

  return { filled, skipped, existing, imported, toPersist, toPersistGlobal };
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
 * Merge `envRecord` into the flat global store (`~/.claude/wizz-env.json`).
 * Additive only — a key already present is never overwritten (same rule as
 * `persistProjectEnv`; a prompt only ever fires for a var no provider had,
 * so an overwrite here would always mean clobbering something newer). File
 * is chmod 600 after any write that changed it, same best-effort semantics
 * as the project writer.
 *
 * @param {string} storePath - Absolute path to the global store file
 * @param {Record<string,string>} envRecord - Vars to merge
 * @returns {Promise<string|null>} Path written/merged, or null when empty
 */
async function persistGlobalEnv(storePath, envRecord) {
  if (!storePath || !envRecord || Object.keys(envRecord).length === 0) return null;

  await fs.ensureDir(path.dirname(storePath));

  let store = {};
  if (await fs.pathExists(storePath)) {
    try {
      const parsed = JSON.parse(await fs.readFile(storePath, 'utf8'));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) store = parsed;
    } catch {
      // A corrupt store must never eat keys the user just typed: keep the
      // broken file aside and start a fresh store with the new values.
      try {
        await fs.rename(storePath, `${storePath}.bak`);
      } catch {
        // Even the rename failing must not block the install.
      }
    }
  }

  let changed = false;
  for (const [key, value] of Object.entries(envRecord)) {
    if (Object.prototype.hasOwnProperty.call(store, key)) continue;
    store[key] = value;
    changed = true;
  }

  if (changed) {
    await fs.writeJson(storePath, store, { spaces: 2 });
    if (process.platform !== 'win32') {
      try {
        await fs.chmod(storePath, 0o600);
      } catch {
        // Best-effort, same as persistProjectEnv.
      }
    }
  }

  return storePath;
}

/**
 * Render the DX summary (E6) — the highest-value part of this feature: turn
 * a skipped var from a dead end into a 30-second fix. One line per var,
 * grouped by outcome. Never includes a raw secret value, only names/status.
 * @param {{filled: Array, skipped: Array, existing: Array, imported: Array}} resolved
 * @returns {string|null} Formatted block, or null when there is nothing to say
 */
function formatSummary({ filled, skipped, existing, imported }) {
  const total = (filled?.length || 0) + (skipped?.length || 0) + (existing?.length || 0) + (imported?.length || 0);
  if (total === 0) return null;

  const lines = [];
  for (const entry of existing || []) {
    lines.push(`  ✓ ${entry.name.padEnd(28)} já existia no ambiente`);
  }
  for (const entry of imported || []) {
    lines.push(`  ✓ ${entry.name.padEnd(28)} importada do global (~/.claude/wizz-env.json)`);
  }
  for (const entry of filled || []) {
    lines.push(`  ✓ ${entry.name.padEnd(28)} configurada agora (+ salva no global p/ próximos projetos)`);
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
 * @param {Array<Object>} [opts.providers] - Defaults to `[processEnv,
 *   dotenvFile(<projectDir>/.env), globalStore(~/.claude/wizz-env.json)]`
 * @param {string} [opts.globalEnvPath] - Global store path (default
 *   `~/.claude/wizz-env.json`); used for both the default provider chain and
 *   the save-on-prompt write. Injectable so tests never touch the real home.
 * @param {(entry) => Promise<string|undefined>} [opts.prompter] - Defaults to
 *   the masked `password()` prompter
 * @returns {Promise<{filled: Array, skipped: Array, existing: Array, imported: Array, envFile: string|null}>}
 */
async function promptMissingEnvVars(mcps, opts = {}) {
  const { projectDir, interactive = false, providers, prompter, globalEnvPath = defaultGlobalEnvPath() } = opts;

  const vars = extractEnvPlaceholders(mcps);
  if (vars.length === 0) return { filled: [], skipped: [], existing: [], imported: [], envFile: null };

  const resolvedProviders = providers || [
    createProcessEnvProvider(),
    createDotenvFileProvider(path.join(projectDir, '.env')),
    createGlobalStoreProvider(globalEnvPath),
  ];
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

  // Typed answers also go to the global store so the NEXT project resolves
  // them silently. Failure here must never block the install — the project
  // write above already succeeded, which is what this install needs.
  if (Object.keys(resolved.toPersistGlobal).length > 0) {
    try {
      await persistGlobalEnv(globalEnvPath, resolved.toPersistGlobal);
    } catch {
      // Global save is a convenience for future installs, never a blocker.
    }
  }

  const summary = formatSummary(resolved);
  if (summary) await prompts.log.info(summary);

  return {
    filled: resolved.filled,
    skipped: resolved.skipped,
    existing: resolved.existing,
    imported: resolved.imported,
    envFile,
  };
}

module.exports = {
  extractEnvPlaceholders,
  resolveEnvVars,
  persistEnvValues,
  persistProjectEnv,
  persistGlobalEnv,
  promptMissingEnvVars,
  createProcessEnvProvider,
  createDotenvFileProvider,
  createGlobalStoreProvider,
  defaultGlobalEnvPath,
  formatSummary,
};
