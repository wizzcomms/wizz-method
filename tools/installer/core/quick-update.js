/**
 * Quick Update orchestration.
 *
 * Extracted from `Installer.quickUpdate` (installer god-object breakup,
 * A15/A17, auditoria 2026-07-07, item 3.1). Kept as composition rather than
 * a method on `Installer`: this function takes the `Installer` instance as
 * an explicit parameter and calls its public surface (`findWizzDir`,
 * `externalModuleManager`, `manifest`, `install`) instead of inheriting from
 * it, so it can be tested/reasoned about independently.
 */
const path = require('node:path');
const fs = require('../fs-native');
const { OfficialModules } = require('../modules/official-modules');
const { ExistingInstall } = require('./existing-install');
const { getProjectRoot } = require('../project-root');
const prompts = require('../prompts');

/**
 * Quick update: preserves all settings and only prompts for new config fields.
 * @param {import('./installer').Installer} installer - Installer instance (composition, not inheritance)
 * @param {Object} config - Configuration with directory
 * @returns {Object} Update result
 */
async function quickUpdate(installer, config) {
  const projectDir = path.resolve(config.directory);
  const { wizzDir } = await installer.findWizzDir(projectDir);

  // Check if wizz directory exists
  if (!(await fs.pathExists(wizzDir))) {
    throw new Error(`Wizz not installed at ${wizzDir}. Use regular install for first-time setup.`);
  }

  // Announce the scope up front: Quick Update only refreshes already
  // installed modules with preserved settings. It never provisions global
  // skills, MCP servers, or CLIs (see the isQuickUpdate() gate below, in
  // _installAndConfigure); that only happens on a fresh install or
  // Modify. Surfacing this before any work starts avoids the confusion of
  // "I updated and skills didn't come" (see project memory).
  await prompts.log.info(
    'Quick Update: atualiza os módulos já instalados com as configurações preservadas. Skills globais, MCPs e CLIs novos não são provisionados neste modo; rode install e escolha "Modify Wizz Installation" para isso.',
  );

  // Detect existing installation
  const existingInstall = await ExistingInstall.detect(wizzDir);
  const installedModules = existingInstall.moduleIds;
  const configuredIdes = existingInstall.ides;
  const projectRoot = path.dirname(wizzDir);

  // Get available modules (what we have source for)
  const availableModulesData = await new OfficialModules().listAvailable();
  const availableModules = [...availableModulesData.modules];

  // Add external official modules to available modules
  const externalModules = await installer.externalModuleManager.listAvailable();
  for (const externalModule of externalModules) {
    if (installedModules.includes(externalModule.code) && !availableModules.some((m) => m.id === externalModule.code)) {
      availableModules.push({
        id: externalModule.code,
        name: externalModule.name,
        isExternal: true,
        fromExternal: true,
      });
    }
  }

  // Add installed custom modules to available modules
  const { CustomModuleManager } = require('../modules/custom-module-manager');
  const customMgr = new CustomModuleManager();
  for (const moduleId of installedModules) {
    if (!availableModules.some((m) => m.id === moduleId)) {
      const customSource = await customMgr.findModuleSourceByCode(moduleId, { wizzDir });
      if (customSource) {
        availableModules.push({
          id: moduleId,
          name: moduleId,
          isExternal: true,
          fromCustom: true,
        });
      }
    }
  }

  const availableModuleIds = new Set(availableModules.map((m) => m.id));

  // Only update modules that are BOTH installed AND available (we have source for)
  const modulesToUpdate = installedModules.filter((id) => availableModuleIds.has(id));
  const skippedModules = installedModules.filter((id) => !availableModuleIds.has(id));

  if (skippedModules.length > 0) {
    await prompts.log.warn(`Skipping ${skippedModules.length} module(s) - no source available: ${skippedModules.join(', ')}`);
  }

  // Build channel options from the existing manifest FIRST so the config
  // collector below (which triggers external-module clones via
  // findModuleSource) knows each module's recorded channel and doesn't
  // silently redecide it. Without this, modules previously on 'next' or
  // 'pinned' would trigger a stable-channel tag lookup at config-collection
  // time, burning GitHub API quota and potentially failing.
  const manifestData = await installer.manifest.read(wizzDir);
  const channelOptions = { global: null, nextSet: new Set(), pins: new Map(), warnings: [] };
  if (manifestData?.modulesDetailed) {
    const { fetchStableTags, classifyUpgrade, parseGitHubRepo } = require('../modules/channel-resolver');
    for (const entry of manifestData.modulesDetailed) {
      if (!entry?.name || !entry?.channel) continue;
      if (entry.channel === 'pinned' && entry.version) {
        channelOptions.pins.set(entry.name, entry.version);
        continue;
      }
      if (entry.channel === 'next') {
        channelOptions.nextSet.add(entry.name);
        continue;
      }
      // Stable: classify the available upgrade. Patches and minors fall
      // through (stable default picks up the top tag). A major upgrade
      // requires opt-in, so under quick-update's non-interactive semantics
      // we pin to the current version to prevent a silent breaking jump.
      if (entry.channel === 'stable' && entry.version && entry.repoUrl) {
        const parsed = parseGitHubRepo(entry.repoUrl);
        if (!parsed) continue;
        try {
          const tags = await fetchStableTags(parsed.owner, parsed.repo);
          if (tags.length === 0) continue;
          const topTag = tags[0].tag;
          const cls = classifyUpgrade(entry.version, topTag);
          if (cls === 'major') {
            channelOptions.pins.set(entry.name, entry.version);
            await prompts.log.warn(
              `${entry.name} ${entry.version} → ${topTag} is a new major release; staying on ${entry.version}. ` +
                `Run \`wizz install\` (Modify) with \`--pin ${entry.name}=${topTag}\` to accept.`,
            );
          }
        } catch (error) {
          // Tag lookup failed (offline, rate-limited). Stay on the current
          // version rather than guessing — the existing cache is already
          // at that ref, so re-using it keeps the install stable.
          channelOptions.pins.set(entry.name, entry.version);
          await prompts.log.warn(`Could not check ${entry.name} for updates (${error.message}); staying on ${entry.version}.`);
        }
      }
    }
  }

  // Load existing configs and collect new fields (if any)
  await prompts.log.info('Checking for new configuration options...');
  const quickModules = new OfficialModules({ channelOptions });
  await quickModules.loadExistingConfig(projectDir);

  let promptedForNewFields = false;

  const corePrompted = await quickModules.collectModuleConfigQuick('core', projectDir, true);
  if (corePrompted) {
    promptedForNewFields = true;
  }

  for (const moduleName of modulesToUpdate) {
    if (moduleName === 'core') continue; // Already collected above
    const modulePrompted = await quickModules.collectModuleConfigQuick(moduleName, projectDir, true);
    if (modulePrompted) {
      promptedForNewFields = true;
    }
  }

  if (!promptedForNewFields) {
    await prompts.log.success('All configuration is up to date, no new options to configure');
  }

  quickModules.collectedConfig._meta = {
    version: require(path.join(getProjectRoot(), 'package.json')).version,
    installDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };

  // Build config and delegate to install()
  const installConfig = {
    directory: projectDir,
    modules: modulesToUpdate,
    ides: configuredIdes,
    coreConfig: quickModules.collectedConfig.core,
    moduleConfigs: quickModules.collectedConfig,
    // Forward `--set` overrides so the post-install patch step
    // (`applySetOverrides`) runs at the end of quick-update too. The
    // installer.install path applies them after writeCentralConfig.
    setOverrides: config.setOverrides || {},
    actionType: 'install',
    _quickUpdate: true,
    _preserveModules: skippedModules,
    _existingModules: installedModules,
    channelOptions,
  };

  const installResult = await installer.install(installConfig);

  return {
    // Quick Update delegates to install() under the hood; propagate its
    // real success/errors/warnings instead of always reporting success so
    // a partial failure (e.g. an IDE setup step) isn't hidden behind a
    // green "Quick update complete!" (see M24 in the installer audit).
    success: installResult.success,
    moduleCount: modulesToUpdate.length,
    hadNewFields: promptedForNewFields,
    modules: modulesToUpdate,
    skippedModules: skippedModules,
    ides: configuredIdes,
    errors: installResult.errors || 0,
    warnings: installResult.warnings || 0,
  };
}

module.exports = { quickUpdate };
