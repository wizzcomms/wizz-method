// Configures the recommended MCP servers for the chosen skill areas.
//
// The skills-registry.yaml is the single source of truth: besides mapping each
// AREA to its skills, it declares an `mcps:` list per area (plus a top-level
// `mcp_utility:` for cross-cutting servers like context7). This module reads
// that registry, resolves the user's chosen areas to a deduped set of MCP
// entries, and MERGES the selected ones into the project's `.mcp.json`.
//
// Design rules (kept deliberately conservative):
//   - ADDITIVE: an existing server with the same id is never overwritten. The
//     user's hand-tuned config always wins; we only ADD what is missing.
//   - SECRETS STAY PLACEHOLDERS: `env` values come straight from the registry
//     as `${VAR}` placeholders. We never read, infer, or write a real token.
//   - NO-OP WHEN ABSENT: missing registry / no MCPs => returns empty, writes
//     nothing. Always safe to call.
//
// The caller decides WHICH ids to write (the interactive multiselect) and which
// to merely recommend; this module exposes the resolution + merge primitives and
// a `claude mcp add` command renderer for the recommend path.

const path = require('node:path');
const crypto = require('node:crypto');
const fs = require('../fs-native');
const { defaultExec } = require('./cli-config');
const { resolveAreaEntries } = require('./registry-resolve');

/**
 * Resolve the recommended MCP entries for the chosen areas, deduped by id.
 * Empty / undefined / containing 'all' means every area. The cross-cutting
 * `mcp_utility:` servers are always included.
 *
 * Wrapper fino sobre `resolveAreaEntries` (A16): a resolução por área em si
 * (sentinel `wantAll`, dedupe por Map, lista cross-cutting) vive em
 * `registry-resolve.js`; aqui só ficam a forma da entrada de MCP e o filtro
 * de elegibilidade (precisa de `server`).
 *
 * @param {Object} registry - Parsed skills-registry.yaml
 * @param {string[]} [selectedAreas] - Area keys to resolve
 * @returns {Array<{id: string, when: string, server: Object, areas: string[]}>}
 *   One entry per unique MCP id, carrying which area(s) recommended it.
 */
function resolveMcps(registry, selectedAreas) {
  return resolveAreaEntries(registry, selectedAreas, {
    listKey: 'mcps',
    utilityKey: 'mcp_utility',
    isActionable: (mcp) => !!mcp.server,
    mapEntry: (mcp) => ({
      when: mcp.when || '',
      server: mcp.server,
      // `setup` (optional) declares how to make a `command:`-relative server
      // actually usable before it is written: install the backing package,
      // download runtime assets, resolve the binary to an absolute path, and
      // verify it boots. Carried here so prepareMcps() can act on it; dropped
      // from what toServerConfig() writes (it never belongs in .mcp.json).
      setup: mcp.setup || null,
    }),
  });
}

/**
 * Normalize a registry `server` block into the shape written to `.mcp.json`.
 * Drops empty `args`/`env` so the output stays minimal and diff-friendly.
 * @param {Object} server - { command, args?, env? } from the registry
 * @returns {Object} Sanitized server config
 */
function toServerConfig(server) {
  const out = { command: server.command };
  if (Array.isArray(server.args) && server.args.length > 0) out.args = [...server.args];
  if (server.env && Object.keys(server.env).length > 0) out.env = { ...server.env };
  return out;
}

/**
 * Content marker for a server block (A13: "Merge aditivo do .mcp.json congela
 * pins de segurança para sempre"). Hashes the NORMALIZED (`toServerConfig`)
 * shape, not the raw registry `server`, so the hash matches exactly what
 * lands on disk in `.mcp.json` — a block written by the installer and a block
 * hand-typed by a user with the same effective config hash identically.
 * @param {Object} server - { command, args?, env? }
 * @returns {string} sha256 hex digest
 */
function hashServerBlock(server) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(toServerConfig(server || {})))
    .digest('hex');
}

/**
 * POSIX-quote a path so it survives interpolation into a shell command even
 * when it contains spaces or shell metacharacters. Single-quote wrapped, with
 * embedded single quotes escaped the classic `'\''` way.
 * @param {string} value
 * @returns {string}
 */
function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'\\''`)}'`;
}

/**
 * Substitute the `{bin}` placeholder in a setup command with the shell-quoted
 * absolute path of the resolved binary. Lets the registry write portable setup
 * commands (`{bin} install`, `{bin} --version`) that bind to the real path at
 * run time instead of relying on PATH.
 * @param {string} command - Command template possibly containing `{bin}`
 * @param {string} binPath - Absolute path to substitute
 * @returns {string}
 */
function substituteBin(command, binPath) {
  return String(command).replaceAll('{bin}', shellQuote(binPath));
}

/**
 * Resolve the absolute path of a binary an MCP server shells out to. A bare
 * `command: "scrapling"` is fragile: the MCP subprocess spawned by the client
 * does not always inherit the user's ~/.local/bin on PATH, so a relative name
 * fails with ENOENT even when the tool is installed. We resolve and write the
 * absolute path instead. Tries `command -v` first (honors the current PATH),
 * then the conventional user-local bin dirs where `uv tool` / `pipx` / `pip
 * --user` land executables:
 *   - `~/.local/bin` (uv tool / pipx / pip --user on Linux, and pip --user
 *     on modern macOS with `--user` in a non-framework Python)
 *   - `/opt/homebrew/bin` and `/usr/local/bin` (Homebrew on Apple Silicon and
 *     Intel respectively); a client launched via `npx` from a GUI app often
 *     inherits a minimal PATH that never saw `brew shellenv`, so a Homebrew
 *     install looks absent and gets reinstalled via uv/pipx/pip (duplicate
 *     binary) unless we check here too
 *   - `~/Library/Python/<version>/bin` (macOS `pip install --user`, which
 *     lands executables under a Python-version-specific directory, not
 *     `~/.local/bin`)
 * Returns null when the binary is nowhere to be found.
 *
 * @param {string} bin - Binary name to locate
 * @param {Function} [exec] - Injected runner (command, opts) => {ok, stdout,...}
 * @returns {Promise<string|null>} Absolute path, or null if not found.
 */
async function resolveBinPath(bin, exec = defaultExec) {
  if (!bin) return null;
  const viaWhich = await exec(`command -v ${bin}`, { timeoutMs: 5000 });
  if (viaWhich.ok) {
    const found = (viaWhich.stdout || '').trim().split('\n')[0].trim();
    if (found) return found;
  }

  const home = process.env.HOME || process.env.USERPROFILE || '';
  const candidateDirs = [];
  if (home) candidateDirs.push(path.join(home, '.local', 'bin'));
  candidateDirs.push('/opt/homebrew/bin', '/usr/local/bin');

  for (const dir of candidateDirs) {
    const candidate = path.join(dir, bin);
    if (await fs.pathExists(candidate)) return candidate;
  }

  if (home && process.platform === 'darwin') {
    const pyUserBase = path.join(home, 'Library', 'Python');
    try {
      const versions = await fs.readdir(pyUserBase);
      for (const version of versions) {
        const candidate = path.join(pyUserBase, version, 'bin', bin);
        if (await fs.pathExists(candidate)) return candidate;
      }
    } catch {
      // No ~/Library/Python directory; pip --user was never used here, or
      // there is nothing to enumerate. Not an error condition.
    }
  }

  return null;
}

/**
 * Run an MCP entry's `setup` block so the server is genuinely usable BEFORE it
 * lands in .mcp.json. This closes the ENOENT gap where the installer wrote a
 * server config but never installed the backing tool. Contract (detect-first,
 * mirroring cli-config's install philosophy):
 *
 *   1. DETECT  — resolve the binary; if already present we skip installation.
 *   2. INSTALL — on a miss, run `setup.install` (package + its MCP extra), then
 *      re-resolve. `setup.post_install` (e.g. downloading browsers) runs after,
 *      only on a fresh install, with `{bin}` bound to the resolved path.
 *   3. RESOLVE — rewrite `server.command` to the ABSOLUTE path so the client's
 *      MCP subprocess never depends on PATH inheriting ~/.local/bin.
 *   4. VERIFY  — run `setup.verify` ({bin} bound). A failure means writing the
 *      config would point at a broken/missing binary, so we DO NOT write it —
 *      the entry is reported failed and the caller drops it with a clear message.
 *
 * Immutable: returns a new entry with a patched `server.command`; the input is
 * never mutated. Entries without a `setup` block pass through untouched.
 *
 * @param {Object} args
 * @param {Object} args.mcp - Resolved MCP entry (id, server, setup?)
 * @param {Function} [args.exec] - Injected runner (command, opts) => {ok,...}
 * @returns {Promise<{mcp: Object, ok: boolean, ran: boolean, error: string|null}>}
 */
async function prepareMcp({ mcp, exec = defaultExec }) {
  const setup = mcp && mcp.setup;
  if (!setup) return { mcp, ok: true, ran: false, error: null };

  const bin = setup.bin || (mcp.server && mcp.server.command);
  if (!bin) {
    return { mcp, ok: false, ran: false, error: 'setup declarado sem `bin` nem `server.command` para resolver' };
  }

  // 1. DETECT — install only when the binary is not already resolvable.
  let binPath = await resolveBinPath(bin, exec);
  const freshInstall = !binPath;

  if (freshInstall) {
    if (!setup.install) {
      return { mcp, ok: false, ran: false, error: `binário '${bin}' ausente e setup não tem comando \`install\`` };
    }
    const installed = await exec(setup.install, { timeoutMs: 900_000 });
    if (!installed.ok) {
      return { mcp, ok: false, ran: true, error: `instalação falhou: ${(installed.stderr || 'erro desconhecido').trim()}` };
    }
    binPath = await resolveBinPath(bin, exec);
    if (!binPath) {
      return {
        mcp,
        ok: false,
        ran: true,
        error: `'${bin}' não encontrado no PATH nem em ~/.local/bin após a instalação`,
      };
    }
    // 2. POST-INSTALL (e.g. browser download) — fresh installs only, idempotent.
    if (setup.post_install) {
      const post = await exec(substituteBin(setup.post_install, binPath), { timeoutMs: 900_000 });
      if (!post.ok) {
        return { mcp, ok: false, ran: true, error: `pós-instalação falhou: ${(post.stderr || 'erro desconhecido').trim()}` };
      }
    }
  }

  // 4. VERIFY — never write a config pointing at a binary that cannot boot.
  if (setup.verify) {
    const verified = await exec(substituteBin(setup.verify, binPath), { timeoutMs: 60_000 });
    if (!verified.ok) {
      return { mcp, ok: false, ran: freshInstall, error: `verificação falhou: ${(verified.stderr || 'erro desconhecido').trim()}` };
    }
  }

  // 3. RESOLVE — patch the absolute path; leave args/env/everything else intact.
  const patched = { ...mcp, server: { ...mcp.server, command: binPath } };
  return { mcp: patched, ok: true, ran: freshInstall, error: null };
}

/**
 * Prepare every MCP entry (see prepareMcp), splitting the set into `ready`
 * (safe to write, with any `server.command` patched to an absolute path) and
 * `failed` (setup did not complete — the caller must NOT write these and should
 * surface the error so the user can fix it manually). Never throws: each entry
 * is isolated so one broken tool never blocks the others or the wider install.
 *
 * @param {Object} args
 * @param {Array<Object>} args.mcps - Resolved MCP entries to prepare
 * @param {Function} [args.exec] - Injected runner (command, opts) => {ok,...}
 * @returns {Promise<{ready: Array<Object>, failed: Array<{id: string, error: string}>}>}
 */
async function prepareMcps({ mcps, exec = defaultExec }) {
  const ready = [];
  const failed = [];
  for (const mcp of mcps || []) {
    const res = await prepareMcp({ mcp, exec });
    if (res.ok) ready.push(res.mcp);
    else failed.push({ id: mcp.id, error: res.error || 'falha desconhecida' });
  }
  return { ready, failed };
}

/**
 * Render the `claude mcp add` command for an MCP entry — used to recommend
 * servers the user chose NOT to write (nothing is lost; they can add later).
 * @param {{id: string, server: Object}} mcp - Resolved MCP entry
 * @returns {string} A copy-pasteable shell command
 */
function renderAddCommand({ id, server }) {
  const envFlags = Object.entries(server.env || {})
    .map(([k, v]) => `-e ${k}=${v}`)
    .join(' ');
  const args = (server.args || []).join(' ');
  const cmd = `${server.command}${args ? ` ${args}` : ''}`;
  return `claude mcp add ${id}${envFlags ? ` ${envFlags}` : ''} -- ${cmd}`.replaceAll(/\s+/g, ' ').trim();
}

/**
 * Split resolved MCP entries into those that still need the DETECT/INSTALL/
 * VERIFY/RESOLVE pipeline (prepareMcps) and those whose id is already present
 * in `.mcp.json` and will be skipped anyway by the additive merge in
 * writeMcpConfig. Filtering here avoids paying for a subprocess-heavy setup
 * (npm install -g, browser download, binary verification) on every
 * re-install for servers we already know will be discarded downstream.
 *
 * Read failures (missing/malformed `.mcp.json`) fall back to "prepare
 * everything", the safe default, and let writeMcpConfig raise the real
 * error later if the file truly is invalid JSON.
 *
 * @param {Object} args
 * @param {string} args.projectDir - Project root where `.mcp.json` lives
 * @param {Array<{id: string}>} args.mcps - Resolved MCP entries to partition
 * @returns {Promise<{toPrepare: Array<Object>, alreadyConfigured: string[]}>}
 */
async function partitionAlreadyConfigured({ projectDir, mcps }) {
  if (!mcps || mcps.length === 0) return { toPrepare: [], alreadyConfigured: [] };

  const file = path.join(projectDir, '.mcp.json');
  let existingIds = new Set();
  if (await fs.pathExists(file)) {
    try {
      const config = JSON.parse(await fs.readFile(file, 'utf8'));
      const servers =
        config && typeof config === 'object' && config.mcpServers && !Array.isArray(config.mcpServers) ? config.mcpServers : null;
      if (servers) existingIds = new Set(Object.keys(servers));
    } catch {
      return { toPrepare: [...mcps], alreadyConfigured: [] };
    }
  }

  const toPrepare = [];
  const alreadyConfigured = [];
  for (const mcp of mcps) {
    if (mcp && mcp.id && existingIds.has(mcp.id)) alreadyConfigured.push(mcp.id);
    else toPrepare.push(mcp);
  }
  return { toPrepare, alreadyConfigured };
}

/**
 * Merge the chosen MCP entries into `<projectDir>/.mcp.json`, additively.
 * Reads any existing file (preserving unknown keys and existing servers),
 * adds ids not already present, and writes back pretty-printed JSON.
 *
 * A13 ("Merge aditivo do .mcp.json congela pins de segurança para sempre"):
 * for an id already present, `previousPins[id]` (the hash the installer
 * recorded the LAST time it wrote that block, from
 * `skill-deps-cache.json`/`deps-cache.js`) tells us whether the on-disk block
 * is still exactly what we wrote or whether the user hand-edited it:
 *   - on-disk hash === current registry hash        → nothing to do (current)
 *   - on-disk hash === previousPins[id] (untouched)  → the registry pin moved
 *     and the user never touched this block: SAFE to apply the update automatically
 *     (`pinUpdated`). This is not overwriting a customization — it is finishing
 *     an update the user already implicitly opted into by never editing our block.
 *   - on-disk hash !== previousPins[id] (or no recorded hash — pre-A13 install)
 *     → the user's edit (or an unknown state) wins; NEVER overwritten, only
 *     surfaced (`pinCustomized`) so the caller can warn "update available, but
 *     this server was customized".
 *
 * @param {Object} args
 * @param {string} args.projectDir - Project root where `.mcp.json` lives
 * @param {Array<{id: string, server: Object}>} args.mcps - Entries to write
 * @param {Record<string,string>} [args.previousPins] - id => hash recorded at
 *   the installer's last write of that block (from skill-deps-cache.json)
 * @param {(absPath: string) => void} [args.trackFile] - Record the written file
 * @param {boolean} [args.dryRun] - Compute the merge (added/skipped/pinHashes/
 *   etc.) WITHOUT touching disk. Used by fresh installs (A14): `.mcp.json`
 *   lives outside `_wizz/`, so it must not be mutated until the atomic
 *   install's tmp→real swap has succeeded — but `pinHashes` is still needed
 *   beforehand to seed `skill-deps-cache.json`. The caller re-invokes without
 *   `dryRun` after the swap to perform the real write.
 * @returns {Promise<{added: string[], skipped: string[], file: string|null,
 *   pinHashes: Record<string,string>, pinUpdated: Array<{id:string,from:string,to:string}>,
 *   pinCustomized: Array<{id:string}>}>}
 *   `added` = ids newly written. `skipped` = ids already current, nothing to
 *   do. `pinCustomized` = ids left intact because the on-disk block diverges
 *   from what we last wrote (a separate bucket from `skipped` so the caller
 *   can warn specifically about those). `pinHashes` = id => hash of what is
 *   now on disk for every resolved id, meant to be persisted as the NEXT
 *   `previousPins`.
 */
async function writeMcpConfig({ projectDir, mcps, previousPins = {}, trackFile = () => {}, dryRun = false }) {
  const empty = { added: [], skipped: [], file: null, pinHashes: {}, pinUpdated: [], pinCustomized: [] };
  if (!mcps || mcps.length === 0) return empty;

  const file = path.join(projectDir, '.mcp.json');
  let config = {};
  if (await fs.pathExists(file)) {
    try {
      config = JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (error) {
      throw new Error(`.mcp.json existe mas não é JSON válido: ${error.message}`);
    }
  }
  if (!config || typeof config !== 'object') config = {};
  if (!config.mcpServers || typeof config.mcpServers !== 'object') config.mcpServers = {};

  const added = [];
  const skipped = [];
  const pinHashes = {};
  const pinUpdated = [];
  const pinCustomized = [];
  let changed = false;

  for (const mcp of mcps) {
    const newHash = hashServerBlock(mcp.server);

    if (Object.prototype.hasOwnProperty.call(config.mcpServers, mcp.id)) {
      const onDisk = config.mcpServers[mcp.id];
      const onDiskHash = hashServerBlock(onDisk);

      if (onDiskHash === newHash) {
        skipped.push(mcp.id); // already current, nothing to do
        pinHashes[mcp.id] = newHash;
        continue;
      }

      const recordedHash = previousPins[mcp.id];
      if (recordedHash && recordedHash === onDiskHash) {
        // Untouched since our last write, and the registry pin moved — safe
        // to apply automatically. Never a silent overwrite of user work.
        config.mcpServers[mcp.id] = toServerConfig(mcp.server);
        pinUpdated.push({ id: mcp.id, from: recordedHash, to: newHash });
        pinHashes[mcp.id] = newHash;
        changed = true;
      } else {
        // No recorded hash (pre-A13 install) or the hash diverges: the user
        // may have hand-edited this block. Never clobber it — only report.
        pinCustomized.push({ id: mcp.id });
        pinHashes[mcp.id] = onDiskHash;
      }
      continue;
    }

    config.mcpServers[mcp.id] = toServerConfig(mcp.server);
    added.push(mcp.id);
    pinHashes[mcp.id] = newHash;
    changed = true;
  }

  if (!changed || dryRun) return { added, skipped, file, pinHashes, pinUpdated, pinCustomized };

  await fs.writeJson(file, config, { spaces: 2 });
  trackFile(file);
  return { added, skipped, file, pinHashes, pinUpdated, pinCustomized };
}

module.exports = {
  resolveMcps,
  toServerConfig,
  hashServerBlock,
  renderAddCommand,
  writeMcpConfig,
  prepareMcp,
  prepareMcps,
  partitionAlreadyConfigured,
  resolveBinPath,
  shellQuote,
  substituteBin,
};
