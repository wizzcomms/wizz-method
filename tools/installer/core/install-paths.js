const path = require('node:path');
const fs = require('../fs-native');
const { getProjectRoot } = require('../project-root');
const { WIZZ_FOLDER_NAME } = require('../ide/shared/path-utils');

class InstallPaths {
  /**
   * @param {Object} config - Clean install config (from Config.build)
   * @param {Object} [options]
   * @param {boolean} [options.useTmp] - When true (fresh installs only, A14),
   *   the returned `wizzDir` points at a sibling `_wizz.tmp-<pid>/` scaffold
   *   instead of the real `_wizz/` — nothing is written under the real name
   *   until the caller renames it in with `fs.rename` after a successful
   *   install (see `Installer.install`/`toReal()`). `realWizzDir` always
   *   carries the eventual real path so the caller can perform that rename.
   * @returns {Promise<InstallPaths>}
   */
  static async create(config, { useTmp = false } = {}) {
    const srcDir = getProjectRoot();
    await assertReadableDir(srcDir, 'Wizz source root');

    const pkgPath = path.join(srcDir, 'package.json');
    await assertReadableFile(pkgPath, 'package.json');
    const version = require(pkgPath).version;

    const projectRoot = path.resolve(config.directory);
    await ensureWritableDir(projectRoot, 'project root');

    const realWizzDir = path.join(projectRoot, WIZZ_FOLDER_NAME);
    const isUpdate = await fs.pathExists(realWizzDir);

    // The tmp scaffold lives beside the real one (same parent dir, same
    // filesystem) so the eventual swap is a same-volume `fs.rename` — never
    // `os.tmpdir()`, which can be a different filesystem and make the rename
    // fail or silently fall back to copy+delete (non-atomic).
    const wizzDir = useTmp ? path.join(projectRoot, `${WIZZ_FOLDER_NAME}.tmp-${process.pid}`) : realWizzDir;

    const configDir = path.join(wizzDir, '_config');
    const coreDir = path.join(wizzDir, 'core');
    const scriptsDir = path.join(wizzDir, 'scripts');
    const customDir = path.join(wizzDir, 'custom');

    for (const [dir, label] of [
      [wizzDir, 'wizz directory'],
      [configDir, 'config directory'],
      [coreDir, 'core module directory'],
      [scriptsDir, 'shared scripts directory'],
      [customDir, 'customizations directory'],
    ]) {
      await ensureWritableDir(dir, label);
    }

    return new InstallPaths({
      srcDir,
      version,
      projectRoot,
      wizzDir,
      realWizzDir,
      configDir,
      coreDir,
      scriptsDir,
      customDir,
      isUpdate,
      isTmp: useTmp,
    });
  }

  constructor(props) {
    Object.assign(this, props);
    Object.freeze(this);
  }

  /**
   * Rewrite every wizzDir-derived field from the tmp scaffold to the real
   * `_wizz/` path. Call ONLY after the tmp directory has actually been
   * renamed into place (`fs.rename(paths.wizzDir, paths.realWizzDir)`) — this
   * is a pure string rewrite, it performs no filesystem I/O itself. A no-op
   * (returns `this`) when this instance was never a tmp variant.
   * @returns {InstallPaths}
   */
  toReal() {
    if (!this.isTmp) return this;
    const rewrite = (p) => this.realWizzDir + p.slice(this.wizzDir.length);
    return new InstallPaths({
      srcDir: this.srcDir,
      version: this.version,
      projectRoot: this.projectRoot,
      wizzDir: this.realWizzDir,
      realWizzDir: this.realWizzDir,
      configDir: rewrite(this.configDir),
      coreDir: rewrite(this.coreDir),
      scriptsDir: rewrite(this.scriptsDir),
      customDir: rewrite(this.customDir),
      isUpdate: this.isUpdate,
      isTmp: false,
    });
  }

  manifestFile() {
    return path.join(this.configDir, 'manifest.yaml');
  }
  centralConfig() {
    return path.join(this.wizzDir, 'config.toml');
  }
  centralUserConfig() {
    return path.join(this.wizzDir, 'config.user.toml');
  }
  filesManifest() {
    return path.join(this.configDir, 'files-manifest.csv');
  }
  helpCatalog() {
    return path.join(this.configDir, 'wizz-help.csv');
  }
  moduleDir(name) {
    return path.join(this.wizzDir, name);
  }
  moduleConfig(name) {
    return path.join(this.wizzDir, name, 'config.yaml');
  }
}

async function assertReadableDir(dirPath, label) {
  const stat = await fs.stat(dirPath).catch(() => null);
  if (!stat) {
    throw new Error(`${label} does not exist: ${dirPath}`);
  }
  if (!stat.isDirectory()) {
    throw new Error(`${label} is not a directory: ${dirPath}`);
  }
  try {
    await fs.access(dirPath, fs.constants.R_OK);
  } catch {
    throw new Error(`${label} is not readable: ${dirPath}`);
  }
}

async function assertReadableFile(filePath, label) {
  const stat = await fs.stat(filePath).catch(() => null);
  if (!stat) {
    throw new Error(`${label} does not exist: ${filePath}`);
  }
  if (!stat.isFile()) {
    throw new Error(`${label} is not a file: ${filePath}`);
  }
  try {
    await fs.access(filePath, fs.constants.R_OK);
  } catch {
    throw new Error(`${label} is not readable: ${filePath}`);
  }
}

async function ensureWritableDir(dirPath, label) {
  const stat = await fs.stat(dirPath).catch(() => null);
  if (stat && !stat.isDirectory()) {
    throw new Error(`${label} exists but is not a directory: ${dirPath}`);
  }

  try {
    await fs.ensureDir(dirPath);
  } catch (error) {
    if (error.code === 'EACCES') {
      throw new Error(`${label}: permission denied creating directory: ${dirPath}`);
    }
    if (error.code === 'ENOSPC') {
      throw new Error(`${label}: no space left on device: ${dirPath}`);
    }
    throw new Error(`${label}: cannot create directory: ${dirPath} (${error.message})`);
  }

  try {
    await fs.access(dirPath, fs.constants.R_OK | fs.constants.W_OK);
  } catch {
    throw new Error(`${label} is not writable: ${dirPath}`);
  }
}

module.exports = { InstallPaths };
