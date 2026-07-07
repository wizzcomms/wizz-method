const path = require('node:path');
const fs = require('../fs-native');
const { Manifest } = require('./manifest');
const { OfficialModules } = require('../modules/official-modules');
const { installSkillsLib } = require('../modules/skills-lib');
const { writeMcpConfig, renderAddCommand, prepareMcps } = require('../modules/mcp-config');
const { installClis, renderInstallCommand } = require('../modules/cli-config');
const { writeDepsCache, readPreviousMcpPins } = require('../modules/deps-cache');
const { IdeManager } = require('../ide/manager');
const { FileOps } = require('../file-ops');
const { Config } = require('./config');
const { ManifestGenerator } = require('./manifest-generator');
const prompts = require('../prompts');
const { WIZZ_FOLDER_NAME } = require('../ide/shared/path-utils');
const { InstallPaths } = require('./install-paths');
const { ExternalModuleManager } = require('../modules/external-manager');
const { resolveModuleVersion } = require('../modules/version-resolver');

const { ExistingInstall } = require('./existing-install');
const { warnPreNativeSkillsLegacy } = require('./legacy-warnings');
const userFilePreservation = require('./user-file-preservation');
const moduleConfigWriter = require('./module-config-writer');
const helpCatalog = require('./help-catalog');
const quickUpdateModule = require('./quick-update');

class Installer {
  constructor() {
    this.externalModuleManager = new ExternalModuleManager();
    this.manifest = new Manifest();
    this.ideManager = new IdeManager();
    this.fileOps = new FileOps();
    this.installedFiles = new Set(); // Track all installed files
    this.wizzFolderName = WIZZ_FOLDER_NAME;
  }

  /**
   * Main installation method
   * @param {Object} config - Installation configuration
   * @param {string} config.directory - Target directory
   * @param {string[]} config.modules - Modules to install (including 'core')
   * @param {string[]} config.ides - IDEs to configure
   */
  async install(originalConfig) {
    let updateState = null;

    try {
      const config = Config.build(originalConfig);
      const paths = await InstallPaths.create(config);
      const officialModules = await OfficialModules.build(config, paths);
      const existingInstall = await ExistingInstall.detect(paths.wizzDir);

      try {
        await warnPreNativeSkillsLegacy({
          projectRoot: paths.projectRoot,
          existingVersion: existingInstall.installed ? existingInstall.version : null,
        });
      } catch (error) {
        // Legacy-dir scan is informational; never let it abort install.
        await prompts.log.warn(`Warning: Could not check for legacy WIZZ entries: ${error.message}`);
      }

      if (existingInstall.installed) {
        await this._removeDeselectedModules(existingInstall, config, paths, originalConfig._preserveModules || []);
        updateState = await this._prepareUpdateState(paths, config, existingInstall, officialModules);
        await this._removeDeselectedIdes(existingInstall, config, paths);
      }

      await this._validateIdeSelection(config);

      // Capture pre-install module versions for from→to display
      const preInstallVersions = new Map();
      if (existingInstall.installed) {
        const existingModules = await this.manifest.getAllModuleVersions(paths.wizzDir);
        for (const mod of existingModules) {
          if (mod.name && mod.version) {
            preInstallVersions.set(mod.name, mod.version);
          }
        }
      }

      // Results collector for consolidated summary
      const results = [];
      const addResult = (step, status, detail = '', meta = {}) => results.push({ step, status, detail, ...meta });

      // Capture previously installed skill rows before they get overwritten
      const preservedModules = originalConfig._preserveModules || [];
      const previousSkillManifestRows = await this._readSkillManifestRows(paths.wizzDir);
      const previousSkillIds = this._getPreviousSkillIdsForCleanup(previousSkillManifestRows, preservedModules);

      const allModules = config.modules || [];

      await this._installAndConfigure(
        config,
        originalConfig,
        paths,
        allModules,
        allModules,
        addResult,
        officialModules,
        previousSkillManifestRows,
      );

      await this._setupIdes(config, allModules, paths, addResult, previousSkillIds);

      // Skills are now in IDE directories — remove redundant copies from _wizz/.
      // Also cleans up skill dirs left by older installer versions.
      await this._cleanupSkillDirs(paths.wizzDir);

      const restoreResult = await this._restoreUserFiles(paths, updateState);

      // Render consolidated summary
      await this.renderInstallSummary(results, {
        wizzDir: paths.wizzDir,
        modules: config.modules,
        ides: config.ides,
        customFiles: restoreResult.customFiles.length > 0 ? restoreResult.customFiles : undefined,
        modifiedFiles: restoreResult.modifiedFiles.length > 0 ? restoreResult.modifiedFiles : undefined,
        preInstallVersions,
      });

      // Some steps (IDE setup, global skills/MCP/CLI provisioning) are
      // best-effort and record their outcome in `results` instead of
      // throwing, so one broken IDE or MCP never aborts the rest of the
      // install. That used to mean a real per-step failure was invisible to
      // the caller: `success` was always true and the CLI always exited 0.
      // Surface it structurally instead: 'error' rows (hard failures, e.g.
      // a suspended/broken IDE setup) flip success to false; 'warn' rows
      // (recoverable, e.g. a single MCP whose setup script failed) keep
      // success true but are still counted so CI/automation can detect
      // "succeeded with warnings" without parsing log text (see M24).
      const errorCount = results.filter((r) => r.status === 'error').length;
      const warningCount = results.filter((r) => r.status === 'warn').length;

      return {
        success: errorCount === 0,
        path: paths.wizzDir,
        modules: config.modules,
        ides: config.ides,
        projectDir: paths.projectRoot,
        errors: errorCount,
        warnings: warningCount,
      };
    } catch (error) {
      await prompts.log.error('Installation failed');

      // Clean up any temp backup directories that were created before the failure
      try {
        if (updateState?.tempBackupDir && (await fs.pathExists(updateState.tempBackupDir))) {
          await fs.remove(updateState.tempBackupDir);
        }
        if (updateState?.tempModifiedBackupDir && (await fs.pathExists(updateState.tempModifiedBackupDir))) {
          await fs.remove(updateState.tempModifiedBackupDir);
        }
      } catch {
        // Best-effort cleanup — don't mask the original error
      }

      throw error;
    }
  }

  /**
   * Remove modules that were previously installed but are no longer selected.
   * No confirmation — the user's module selection is the decision.
   */
  async _removeDeselectedModules(existingInstall, config, paths, preservedModules = []) {
    const previouslyInstalled = new Set(existingInstall.moduleIds);
    const newlySelected = new Set(config.modules || []);
    const preserved = new Set(preservedModules);
    const toRemove = [...previouslyInstalled].filter((m) => !newlySelected.has(m) && m !== 'core' && !preserved.has(m));

    for (const moduleId of toRemove) {
      const modulePath = paths.moduleDir(moduleId);
      try {
        if (await fs.pathExists(modulePath)) {
          await fs.remove(modulePath);
        }
      } catch (error) {
        await prompts.log.warn(`Warning: Failed to remove ${moduleId}: ${error.message}`);
      }
    }
  }

  /**
   * Fail fast if all selected IDEs are suspended.
   */
  async _validateIdeSelection(config) {
    if (!config.ides || config.ides.length === 0) return;

    await this.ideManager.ensureInitialized();
    const suspendedIdes = config.ides.filter((ide) => {
      const handler = this.ideManager.handlers.get(ide);
      return handler?.platformConfig?.suspended;
    });

    if (suspendedIdes.length > 0 && suspendedIdes.length === config.ides.length) {
      for (const ide of suspendedIdes) {
        const handler = this.ideManager.handlers.get(ide);
        await prompts.log.error(`${handler.displayName || ide}: ${handler.platformConfig.suspended}`);
      }
      throw new Error(
        `All selected tool(s) are suspended: ${suspendedIdes.join(', ')}. Installation aborted to prevent upgrading _wizz/ without a working IDE configuration.`,
      );
    }
  }

  /**
   * Remove IDEs that were previously installed but are no longer selected.
   * No confirmation — the user's IDE selection is the decision.
   */
  async _removeDeselectedIdes(existingInstall, config, paths) {
    const previouslyInstalled = new Set(existingInstall.ides);
    const newlySelected = new Set(config.ides || []);
    const toRemove = [...previouslyInstalled].filter((ide) => !newlySelected.has(ide));

    if (toRemove.length === 0) return;

    // Pass the newly-selected list as remainingIdes so cleanupByList skips
    // target_dir wipes for IDEs whose directory is still owned by a peer
    // (e.g. removing 'cursor' while 'gemini' remains — both share .agents/skills).
    const results = await this.ideManager.cleanupByList(paths.projectRoot, toRemove, {
      remainingIdes: [...newlySelected],
    });

    for (const result of results || []) {
      if (result && result.success === false) {
        await prompts.log.warn(`Warning: Failed to remove ${result.ide}: ${result.error || 'unknown error'}`);
      }
    }
  }

  /**
   * Install modules, create directories, generate configs and manifests.
   */
  async _installAndConfigure(
    config,
    originalConfig,
    paths,
    officialModuleIds,
    allModules,
    addResult,
    officialModules,
    previousSkillManifestRows = [],
  ) {
    const isQuickUpdate = config.isQuickUpdate();
    const moduleConfigs = officialModules.moduleConfigs;

    const dirResults = { createdDirs: [], movedDirs: [], createdWdsFolders: [] };

    const installTasks = [];

    installTasks.push({
      title: 'Installing shared scripts',
      task: async () => {
        await this._installSharedScripts(paths);
        addResult('Shared scripts', 'ok');
        return 'Shared scripts installed';
      },
    });

    if (allModules.length > 0) {
      installTasks.push({
        title: isQuickUpdate ? `Updating ${allModules.length} module(s)` : `Installing ${allModules.length} module(s)`,
        task: async (message) => {
          const installedModuleNames = new Set();

          await this._installOfficialModules(config, paths, officialModuleIds, addResult, isQuickUpdate, officialModules, {
            message,
            installedModuleNames,
          });

          return `${allModules.length} module(s) ${isQuickUpdate ? 'updated' : 'installed'}`;
        },
      });
    }

    installTasks.push({
      title: 'Creating module directories',
      task: async (message) => {
        const verboseMode = process.env.WIZZ_VERBOSE_INSTALL === 'true' || config.verbose;
        const moduleLogger = {
          log: async (msg) => (verboseMode ? await prompts.log.message(msg) : undefined),
          error: async (msg) => await prompts.log.error(msg),
          warn: async (msg) => await prompts.log.warn(msg),
        };

        if (config.modules && config.modules.length > 0) {
          for (const moduleName of config.modules) {
            message(`Setting up ${moduleName}...`);
            const result = await officialModules.createModuleDirectories(moduleName, paths.wizzDir, {
              installedIDEs: config.ides || [],
              moduleConfig: moduleConfigs[moduleName] || {},
              existingModuleConfig: officialModules.existingConfig?.[moduleName] || {},
              coreConfig: moduleConfigs.core || {},
              logger: moduleLogger,
              silent: true,
            });
            if (result) {
              dirResults.createdDirs.push(...result.createdDirs);
              dirResults.movedDirs.push(...(result.movedDirs || []));
              dirResults.createdWdsFolders.push(...result.createdWdsFolders);
            }
          }
        }

        addResult('Module directories', 'ok');
        return 'Module directories created';
      },
    });

    const configTask = {
      title: 'Generating configurations',
      task: async (message) => {
        await this.generateModuleConfigs(paths.wizzDir, moduleConfigs);
        addResult('Configurations', 'ok', 'generated');

        this.installedFiles.add(paths.manifestFile());
        this.installedFiles.add(paths.centralConfig());
        this.installedFiles.add(paths.centralUserConfig());

        // Install the global skills library (area-filtered) BEFORE manifests, so
        // collectSkills discovers `_wizz/skills-lib/<id>` and the verbatim pipeline
        // carries them into each IDE. Gated on the `bmm` (Wizz Method) module,
        // which now owns the area agents + router; additive, so a failure here
        // warns and never aborts the install.
        if (!config.isQuickUpdate() && (config.modules || []).includes('bmm')) {
          message('Installing global skills...');
          try {
            const result = await installSkillsLib({
              wizzDir: paths.wizzDir,
              selectedAreas: config.selectedAreas || [],
              trackFile: (p) => this.installedFiles.add(p),
            });
            if (result.registry) {
              addResult('Global skills', 'ok', `${result.copied} installed`);
            }
            if (result.skipped.length > 0) {
              await prompts.log.warn(`Skills no registry sem pasta em skills-lib (ignoradas): ${result.skipped.join(', ')}`);
            }
          } catch (error) {
            await prompts.log.warn(`Falha ao instalar skills globais: ${error.message}`);
            addResult('Global skills', 'warn', error.message);
          }

          // Configure recommended MCP servers for the chosen areas. The user's
          // multiselect already split them into write vs recommend; we merge the
          // chosen ones into .mcp.json (additive) and print `claude mcp add` for
          // the rest. Additive + placeholder-secret, so it never clobbers config
          // or leaks tokens; a failure warns and never aborts the install.
          const mcpPlan = config.mcpPlan || { toWrite: [], toRecommend: [] };
          let mcpPinHashes = {};
          try {
            const toWrite = mcpPlan.toWrite || [];
            if (toWrite.length > 0) {
              message('Configuring MCP servers...');
              // Every resolved MCP goes through prepareMcps (DETECT→INSTALL→
              // VERIFY→RESOLVE) — including ids already present in .mcp.json.
              // A13 needs the RESOLVED server (setup-bearing entries like
              // scrapling get their command rewritten to an absolute path) to
              // hash-compare against what's on disk; comparing against the raw
              // registry command would always "look changed" for those. This
              // is still cheap for an already-installed binary: prepareMcp is
              // detect-first, so only a genuinely missing binary pays for the
              // network-heavy install/post_install steps.
              const { ready: mcpsReady, failed: mcpsFailed } = await prepareMcps({ mcps: toWrite });
              for (const f of mcpsFailed) {
                await prompts.log.warn(
                  `MCP ${f.id} não pôde ser preparado (${f.error}). Config NÃO escrita para evitar ENOENT — instale manualmente e adicione depois com \`claude mcp add\`.`,
                );
              }
              if (mcpsFailed.length > 0) {
                addResult('MCP servers', 'warn', `falharam: ${mcpsFailed.map((f) => f.id).join(', ')}`);
              }
              // A13 ("merge aditivo congela pins para sempre"): read the pin
              // hashes the LAST install recorded so writeMcpConfig can tell an
              // untouched block (safe to auto-update the pin) from a
              // user-customized one (never overwritten, only warned about).
              const previousPins = await readPreviousMcpPins(paths.wizzDir);
              // Intentionally NOT tracked in installedFiles: .mcp.json is a
              // shared, user-owned config we merge into (it may hold the user's
              // own servers). Tracking it would expose it to uninstall removal
              // and manifest hash-management, which must never touch it.
              const mcpResult = await writeMcpConfig({
                projectDir: paths.projectRoot,
                mcps: mcpsReady,
                previousPins,
              });
              mcpPinHashes = mcpResult.pinHashes || {};
              if (mcpResult.added.length > 0) {
                addResult('MCP servers', 'ok', `${mcpResult.added.join(', ')} → .mcp.json`);
              }
              const pinUpdated = mcpResult.pinUpdated || [];
              if (pinUpdated.length > 0) {
                await prompts.log.info(
                  `MCPs com pin atualizado (bloco não havia sido customizado): ${pinUpdated.map((u) => u.id).join(', ')}`,
                );
                addResult('MCP servers', 'ok', `pin atualizado: ${pinUpdated.map((u) => u.id).join(', ')}`);
              }
              const pinCustomized = mcpResult.pinCustomized || [];
              if (pinCustomized.length > 0) {
                await prompts.log.warn(
                  `Há atualização de pin disponível para ${pinCustomized.map((c) => c.id).join(', ')}, mas o bloco no .mcp.json foi customizado (diferente do que o installer escreveu) — mantido intacto. Atualize manualmente se quiser o pin novo.`,
                );
              }
              if (mcpResult.skipped.length > 0) {
                await prompts.log.info(`MCPs já presentes e atualizados no .mcp.json (mantidos): ${mcpResult.skipped.join(', ')}`);
              }
            }
            const toRecommend = mcpPlan.toRecommend || [];
            if (toRecommend.length > 0) {
              const lines = toRecommend.map((m) => `  ${renderAddCommand(m)}`).join('\n');
              await prompts.log.info(`MCPs recomendados (rode quando quiser):\n${lines}`);
            }
            // Remind only when a written server expects secrets the user must fill.
            const needsSecrets = toWrite.filter((m) => m.server && m.server.env && Object.keys(m.server.env).length > 0);
            if (needsSecrets.length > 0) {
              const vars = [...new Set(needsSecrets.flatMap((m) => Object.values(m.server.env)))];
              await prompts.log.warn(`Defina as variáveis de ambiente dos MCPs antes de usar: ${vars.join(', ')}`);
            }
          } catch (error) {
            await prompts.log.warn(`Falha ao configurar MCPs: ${error.message}`);
            addResult('MCP servers', 'warn', error.message);
          }

          // Install/recommend the CLIs the agents shell out to (agent-browser,
          // rtk). The ui already detected what's present and split the rest into
          // install-now vs recommend; here we run the chosen install commands and
          // print the rest. Install runs system commands (npm install -g, curl |
          // sh) — a failure warns and never aborts the install. CLIs are not
          // tracked in installedFiles (they live outside the project tree).
          const cliPlan = config.cliPlan || { toInstall: [], toRecommend: [], alreadyInstalled: [] };
          try {
            const alreadyInstalled = cliPlan.alreadyInstalled || [];
            if (alreadyInstalled.length > 0) {
              await prompts.log.info(`CLIs já instalados (mantidos): ${alreadyInstalled.map((c) => c.id).join(', ')}`);
            }
            const toInstall = cliPlan.toInstall || [];
            if (toInstall.length > 0) {
              message('Installing CLIs...');
              const cliResult = await installClis({ clis: toInstall });
              if (cliResult.installed.length > 0) {
                addResult('CLIs', 'ok', `instalados: ${cliResult.installed.join(', ')}`);
              }
              for (const f of cliResult.failed) {
                await prompts.log.warn(
                  `Falha ao instalar CLI ${f.id}: ${f.error}. Rode manualmente: ${renderInstallCommand(toInstall.find((c) => c.id === f.id) || {})}`,
                );
              }
              if (cliResult.failed.length > 0) {
                addResult('CLIs', 'warn', `falharam: ${cliResult.failed.map((f) => f.id).join(', ')}`);
              }
              // M14: verify failure never aborts (CLIs are opt-in) — just a
              // clear warning that the tool cloned/installed but a runtime
              // dependency might still be missing.
              for (const w of cliResult.warnings || []) {
                await prompts.log.warn(`CLI ${w.id} instalado, mas ${w.warning}`);
              }
            }
            const toRecommend = cliPlan.toRecommend || [];
            if (toRecommend.length > 0) {
              const lines = toRecommend.map((c) => `  ${renderInstallCommand(c)}`).join('\n');
              await prompts.log.info(`CLIs recomendados (rode quando quiser):\n${lines}`);
            }
          } catch (error) {
            await prompts.log.warn(`Falha ao configurar CLIs: ${error.message}`);
            addResult('CLIs', 'warn', error.message);
          }

          // Persist a project-local cache of the skill dependencies (CLIs +
          // MCPs) resolved for the chosen areas, so future runs and the maestro
          // know which deps belong to this project's skills — and in what state
          // they were left (installed / recommended / already-present / written)
          // — without re-resolving the registry or re-probing PATH. Passive
          // manifest, additive, no secrets; a failure warns and never aborts.
          try {
            const depsResult = await writeDepsCache({
              wizzDir: paths.wizzDir,
              selectedAreas: config.selectedAreas || [],
              cliPlan: config.cliPlan || {},
              // pinHashes (A13) is the writeMcpConfig result computed above,
              // not part of the config-time plan — merged in here so the
              // NEXT install's readPreviousMcpPins() can see it.
              mcpPlan: { ...config.mcpPlan, pinHashes: mcpPinHashes },
              trackFile: (p) => this.installedFiles.add(p),
            });
            if (depsResult.wrote) {
              addResult('Skill deps cache', 'ok', 'skill-deps-cache.json');
            }
          } catch (error) {
            await prompts.log.warn(`Falha ao gravar cache de dependências: ${error.message}`);
            addResult('Skill deps cache', 'warn', error.message);
          }
        } else if (config.isQuickUpdate() && (config.modules || []).includes('bmm')) {
          // Gate above only runs for fresh installs / Modify. Quick Update
          // preserves settings and skips provisioning entirely, so say it
          // explicitly instead of leaving the user to notice by absence
          // (see project memory: "atualizei e não veio skill").
          await prompts.log.info(
            'Quick Update: skills globais, MCPs e CLIs não foram alterados. Rode install e escolha "Modify Wizz Installation" para instalar itens novos.',
          );
        }

        message('Generating manifests...');
        const manifestGen = new ManifestGenerator();
        const preservedModules = originalConfig._preserveModules || [];

        const allModulesForManifest = config.isQuickUpdate()
          ? originalConfig._existingModules || allModules || []
          : preservedModules.length > 0
            ? [...allModules, ...preservedModules]
            : allModules || [];

        let modulesForCsvPreserve;
        if (config.isQuickUpdate()) {
          modulesForCsvPreserve = originalConfig._existingModules || allModules || [];
        } else {
          modulesForCsvPreserve = preservedModules.length > 0 ? [...allModules, ...preservedModules] : allModules;
        }

        await this._trackPreservedModuleFiles(paths.wizzDir, preservedModules);

        await manifestGen.generateManifests(paths.wizzDir, allModulesForManifest, [...this.installedFiles], {
          ides: config.ides || [],
          preservedModules: modulesForCsvPreserve,
          moduleConfigs,
        });
        await this._appendPreservedSkillManifestRows(paths.wizzDir, previousSkillManifestRows, preservedModules);

        // Apply post-install --set TOML patches. Runs after writeCentralConfig
        // (inside generateManifests above) so the patch operates on the
        // freshly written `_wizz/config.toml` / `_wizz/config.user.toml`.
        // See `tools/installer/set-overrides.js` for routing rules.
        if (config.setOverrides && Object.keys(config.setOverrides).length > 0) {
          const { applySetOverrides } = require('../set-overrides');
          const applied = await applySetOverrides(config.setOverrides, paths.wizzDir);
          if (applied.length > 0) {
            const summary = applied.map((a) => `${a.module}.${a.key} → ${a.file}`).join(', ');
            await prompts.log.info(`Applied --set overrides: ${summary}`);
          }
        }

        message('Generating help catalog...');
        await this.mergeModuleHelpCatalogs(paths.wizzDir, manifestGen.agents);
        addResult('Help catalog', 'ok');

        return 'Configurations generated';
      },
    };
    installTasks.push(configTask);

    // Run install + dirs first, then render dir output, then run config generation
    const mainTasks = installTasks.filter((t) => t !== configTask);
    await prompts.tasks(mainTasks);

    const color = await prompts.getColor();
    if (dirResults.movedDirs.length > 0) {
      const lines = dirResults.movedDirs.map((d) => `  ${d}`).join('\n');
      await prompts.log.message(color.cyan(`Moved directories:\n${lines}`));
    }
    if (dirResults.createdDirs.length > 0) {
      const lines = dirResults.createdDirs.map((d) => `  ${d}`).join('\n');
      await prompts.log.message(color.yellow(`Created directories:\n${lines}`));
    }
    if (dirResults.createdWdsFolders.length > 0) {
      const lines = dirResults.createdWdsFolders.map((f) => color.dim(`  \u2713 ${f}/`)).join('\n');
      await prompts.log.message(color.cyan(`Created WDS folder structure:\n${lines}`));
    }

    await prompts.tasks([configTask]);
  }

  /**
   * Set up IDE integrations for each selected IDE.
   */
  async _setupIdes(config, allModules, paths, addResult, previousSkillIds = new Set()) {
    if (config.skipIde || !config.ides || config.ides.length === 0) return;

    await this.ideManager.ensureInitialized();
    const validIdes = config.ides.filter((ide) => ide && typeof ide === 'string');

    if (validIdes.length === 0) {
      addResult('IDE configuration', 'warn', 'no valid IDEs selected');
      return;
    }

    const setupResults = await this.ideManager.setupBatch(validIdes, paths.projectRoot, paths.wizzDir, {
      selectedModules: allModules || [],
      verbose: config.verbose,
      previousSkillIds,
    });

    for (const setupResult of setupResults) {
      const ide = setupResult.ide;
      if (setupResult.success) {
        addResult(ide, 'ok', setupResult.detail || '');
      } else {
        addResult(ide, 'error', setupResult.error || 'failed');
      }
    }
  }

  /**
   * Remove skill directories from _wizz/ after IDE installation.
   * Skills are self-contained in IDE directories, so _wizz/ only needs
   * module-level files (config.yaml, _config/, etc.).
   * Also cleans up skill dirs left by older installer versions.
   * @param {string} wizzDir - WIZZ installation directory
   */
  async _cleanupSkillDirs(wizzDir) {
    const csv = require('csv-parse/sync');
    const csvPath = path.join(wizzDir, '_config', 'skill-manifest.csv');
    if (!(await fs.pathExists(csvPath))) return;

    const csvContent = await fs.readFile(csvPath, 'utf8');
    const records = csv.parse(csvContent, { columns: true, skip_empty_lines: true });
    const wizzFolderName = path.basename(wizzDir);
    const wizzPrefix = wizzFolderName + '/';

    for (const record of records) {
      if (!record.path) continue;
      const relativePath = record.path.startsWith(wizzPrefix) ? record.path.slice(wizzPrefix.length) : record.path;
      const sourceDir = path.dirname(path.join(wizzDir, relativePath));
      if (await fs.pathExists(sourceDir)) {
        await fs.remove(sourceDir);
        await this._removeEmptyParents(path.dirname(sourceDir), wizzDir);
      }
    }
  }

  /**
   * Remove now-empty parent directories left behind after skill dir cleanup.
   * Walks up from dir, stopping at (and never removing) wizzDir. Best-effort:
   * a directory that vanishes or fills in mid-walk just ends the walk.
   * @param {string} dir - Directory to start walking up from
   * @param {string} wizzDir - WIZZ installation directory (boundary)
   */
  async _removeEmptyParents(dir, wizzDir) {
    let current = dir;
    while (true) {
      // Path-boundary check (not a string prefix, so siblings like _wizz2 don't match).
      const rel = path.relative(wizzDir, current);
      if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) break;
      try {
        const entries = await fs.readdir(current);
        if (entries.length > 0) break;
        await fs.rmdir(current);
      } catch (error) {
        await prompts.log.warn(`Warning: could not remove empty directory ${current}: ${error.message}`);
        break;
      }
      current = path.dirname(current);
    }
  }

  async _readSkillManifestRows(wizzDir) {
    const csvPath = path.join(wizzDir, '_config', 'skill-manifest.csv');
    if (!(await fs.pathExists(csvPath))) return [];

    try {
      const csvParse = require('csv-parse/sync');
      const content = await fs.readFile(csvPath, 'utf8');
      return csvParse.parse(content, { columns: true, skip_empty_lines: true });
    } catch (error) {
      await prompts.log.warn(`Failed to parse skill-manifest.csv: ${error.message}`);
      return [];
    }
  }

  _getPreviousSkillIdsForCleanup(previousRows, preservedModules = []) {
    const preservedModuleSet = new Set(preservedModules || []);
    const ids = new Set();
    for (const row of previousRows || []) {
      if (row.canonicalId && !preservedModuleSet.has(row.module)) {
        ids.add(row.canonicalId);
      }
    }
    return ids;
  }

  async _appendPreservedSkillManifestRows(wizzDir, previousRows, preservedModules = []) {
    if (!previousRows || previousRows.length === 0 || preservedModules.length === 0) return;

    const preservedModuleSet = new Set(preservedModules);
    const rowsToPreserve = previousRows.filter((row) => row.canonicalId && row.module && preservedModuleSet.has(row.module));
    if (rowsToPreserve.length === 0) return;

    const csvPath = path.join(wizzDir, '_config', 'skill-manifest.csv');
    if (!(await fs.pathExists(csvPath))) return;

    const currentRows = await this._readSkillManifestRows(wizzDir);
    const activeIds = new Set(currentRows.map((row) => row.canonicalId).filter(Boolean));
    const appendedRows = [];

    for (const row of rowsToPreserve) {
      if (activeIds.has(row.canonicalId)) continue;
      activeIds.add(row.canonicalId);
      appendedRows.push(
        [row.canonicalId, row.name || row.canonicalId, row.description || '', row.module, row.path || '']
          .map((field) => this.escapeCSVField(field))
          .join(','),
      );
    }

    if (appendedRows.length === 0) return;

    const currentContent = await fs.readFile(csvPath, 'utf8');
    const prefix = currentContent.endsWith('\n') ? currentContent : `${currentContent}\n`;
    await fs.writeFile(csvPath, prefix + appendedRows.join('\n') + '\n', 'utf8');
  }

  /**
   * Restore custom and modified files that were backed up before the update.
   * No-op for fresh installs (updateState is null).
   * @param {Object} paths - InstallPaths instance
   * @param {Object|null} updateState - From _prepareUpdateState, or null for fresh installs
   * @returns {Object} { customFiles, modifiedFiles } — lists of restored files
   */
  async _restoreUserFiles(paths, updateState) {
    return userFilePreservation.restoreUserFiles(paths, updateState);
  }

  /**
   * Common update preparation: detect files, preserve core config, back up.
   * @param {Object} paths - InstallPaths instance
   * @param {Object} config - Clean config (may have coreConfig updated)
   * @param {Object} existingInstall - Detection result
   * @param {Object} officialModules - OfficialModules instance
   * @returns {Object} Update state: { customFiles, modifiedFiles, tempBackupDir, tempModifiedBackupDir }
   */
  async _prepareUpdateState(paths, config, existingInstall, officialModules) {
    // Detect custom and modified files BEFORE updating (compare current files vs files-manifest.csv)
    const existingFilesManifest = await this.readFilesManifest(paths.wizzDir);
    const { customFiles, modifiedFiles } = await this.detectCustomFiles(paths.wizzDir, existingFilesManifest);

    // Preserve existing core configuration during updates
    // (no-op for quick-update which already has core config from collectModuleConfigQuick)
    const coreConfigPath = paths.moduleConfig('core');
    if ((await fs.pathExists(coreConfigPath)) && (!config.coreConfig || Object.keys(config.coreConfig).length === 0)) {
      try {
        const yaml = require('yaml');
        const coreConfigContent = await fs.readFile(coreConfigPath, 'utf8');
        const existingCoreConfig = yaml.parse(coreConfigContent);

        config.coreConfig = existingCoreConfig;
        officialModules.moduleConfigs.core = existingCoreConfig;
      } catch (error) {
        await prompts.log.warn(`Warning: Could not read existing core config: ${error.message}`);
      }
    }

    const backupDirs = await this._backupUserFiles(paths, customFiles, modifiedFiles);

    return {
      customFiles,
      modifiedFiles,
      tempBackupDir: backupDirs.tempBackupDir,
      tempModifiedBackupDir: backupDirs.tempModifiedBackupDir,
    };
  }

  /**
   * Back up custom and modified files to temp directories before overwriting.
   * Returns the temp directory paths (or undefined if no files to back up).
   * @param {Object} paths - InstallPaths instance
   * @param {string[]} customFiles - Absolute paths of custom (user-added) files
   * @param {Object[]} modifiedFiles - Array of { path, relativePath } for modified files
   * @returns {Object} { tempBackupDir, tempModifiedBackupDir } — undefined if no files
   */
  async _backupUserFiles(paths, customFiles, modifiedFiles) {
    return userFilePreservation.backupUserFiles(paths, customFiles, modifiedFiles);
  }

  /**
   * Sync src/scripts/* → _wizz/scripts/ so shared Python scripts
   * (e.g. resolve_customization.py) are available at install time.
   * Excludes dev-only tests and Python caches so they don't ship to users.
   * Wipes the destination first so files removed or renamed in source
   * don't linger and get recorded as installed. Also seeds
   * _wizz/custom/.gitignore on fresh installs so *.user.toml overrides
   * stay out of version control.
   */
  async _installSharedScripts(paths) {
    const srcScriptsDir = path.join(paths.srcDir, 'src', 'scripts');
    if (!(await fs.pathExists(srcScriptsDir))) {
      throw new Error(`Shared scripts source directory not found: ${srcScriptsDir}`);
    }

    await fs.remove(paths.scriptsDir);
    await fs.ensureDir(paths.scriptsDir);
    // Ship only the runtime scripts — dev-only tests and Python caches must not land in user projects.
    const isInstallable = (srcPath) => {
      const base = path.basename(srcPath);
      return base !== 'tests' && base !== '__pycache__' && base !== '.pytest_cache' && !base.endsWith('.pyc');
    };
    await fs.copy(srcScriptsDir, paths.scriptsDir, { overwrite: true, filter: isInstallable });
    await this._trackFilesRecursive(paths.scriptsDir);

    const customGitignore = path.join(paths.customDir, '.gitignore');
    if (!(await fs.pathExists(customGitignore))) {
      await fs.writeFile(customGitignore, '*.user.toml\n', 'utf8');
      this.installedFiles.add(customGitignore);
    }
  }

  async _trackFilesRecursive(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await this._trackFilesRecursive(full);
      } else if (entry.isFile()) {
        this.installedFiles.add(full);
      }
    }
  }

  async _trackPreservedModuleFiles(wizzDir, preservedModules = []) {
    for (const moduleName of preservedModules) {
      const modulePath = path.join(wizzDir, moduleName);
      if (await fs.pathExists(modulePath)) {
        await this._trackFilesRecursive(modulePath);
      }
    }
  }

  /**
   * Install official (non-custom) modules.
   * @param {Object} config - Installation configuration
   * @param {Object} paths - InstallPaths instance
   * @param {string[]} officialModuleIds - Official module IDs to install
   * @param {Function} addResult - Callback to record installation results
   * @param {boolean} isQuickUpdate - Whether this is a quick update
   * @param {Object} ctx - Shared context: { message, installedModuleNames }
   */
  async _installOfficialModules(config, paths, officialModuleIds, addResult, isQuickUpdate, officialModules, ctx) {
    const { message, installedModuleNames } = ctx;
    const { CustomModuleManager } = require('../modules/custom-module-manager');

    for (const moduleName of officialModuleIds) {
      if (installedModuleNames.has(moduleName)) continue;
      installedModuleNames.add(moduleName);

      message(`${isQuickUpdate ? 'Updating' : 'Installing'} ${moduleName}...`);

      const moduleConfig = officialModules.moduleConfigs[moduleName] || {};
      const installResult = await officialModules.install(
        moduleName,
        paths.wizzDir,
        (filePath) => {
          this.installedFiles.add(filePath);
        },
        {
          skipModuleInstaller: true,
          moduleConfig: moduleConfig,
          installer: this,
          silent: true,
          channelOptions: config.channelOptions,
        },
      );

      // Get display name from source module.yaml and resolve the freshest version metadata we can find locally.
      const sourcePath = await officialModules.findModuleSource(moduleName, {
        silent: true,
        channelOptions: config.channelOptions,
      });
      const moduleInfo = sourcePath ? await officialModules.getModuleInfo(sourcePath, moduleName, '') : null;
      const displayName = moduleInfo?.name || moduleName;

      const resolution = officialModules.externalModuleManager.getResolution(moduleName);
      const cachedResolution = CustomModuleManager._resolutionCache.get(moduleName);
      const versionInfo = await resolveModuleVersion(moduleName, {
        moduleSourcePath: sourcePath,
        fallbackVersion: resolution?.version || cachedResolution?.version,
        marketplacePluginNames: cachedResolution?.pluginName ? [cachedResolution.pluginName] : [],
      });
      // Prefer the git tag recorded by the resolution (e.g. "v1.7.0") over
      // the on-disk package.json (which may be ahead of the released tag).
      const version = resolution?.version || versionInfo.version || '';
      addResult(displayName, 'ok', '', {
        moduleCode: moduleName,
        newVersion: version,
        newChannel: resolution?.channel || null,
        newSha: resolution?.sha || null,
      });
    }
  }

  /**
   * Read files-manifest.csv
   * @param {string} wizzDir - WIZZ installation directory
   * @returns {Array} Array of file entries from files-manifest.csv
   */
  async readFilesManifest(wizzDir) {
    const filesManifestPath = path.join(wizzDir, '_config', 'files-manifest.csv');
    if (!(await fs.pathExists(filesManifestPath))) {
      return [];
    }

    try {
      const content = await fs.readFile(filesManifestPath, 'utf8');
      const lines = content.split('\n');
      const files = [];

      for (let i = 1; i < lines.length; i++) {
        // Skip header
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV line properly handling quoted values
        const parts = [];
        let current = '';
        let inQuotes = false;

        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current); // Add last part

        if (parts.length >= 4) {
          files.push({
            type: parts[0],
            name: parts[1],
            module: parts[2],
            path: parts[3],
            hash: parts[4] || null, // Hash may not exist in old manifests
          });
        }
      }

      return files;
    } catch (error) {
      await prompts.log.warn('Could not read files-manifest.csv: ' + error.message);
      return [];
    }
  }

  /**
   * Detect custom and modified files
   * @param {string} wizzDir - WIZZ installation directory
   * @param {Array} existingFilesManifest - Previous files from files-manifest.csv
   * @returns {Object} Object with customFiles and modifiedFiles arrays
   */
  async detectCustomFiles(wizzDir, existingFilesManifest) {
    return userFilePreservation.detectCustomFiles(wizzDir, existingFilesManifest, { manifest: this.manifest });
  }

  /**
   * Generate clean config.yaml files for each installed module
   * @param {string} wizzDir - WIZZ installation directory
   * @param {Object} moduleConfigs - Collected configuration values
   */
  async generateModuleConfigs(wizzDir, moduleConfigs) {
    return moduleConfigWriter.generateModuleConfigs(wizzDir, moduleConfigs, { trackFile: (p) => this.installedFiles.add(p) });
  }

  /**
   * Merge all module-help.csv files into a single wizz-help.csv.
   * Scans all installed modules for module-help.csv and merges them.
   * Output preserves the source schema verbatim — see schema below.
   * @param {string} wizzDir - WIZZ installation directory
   * @param {Array<Object>} _agentEntries - Unused; retained for call-site compatibility
   */
  async mergeModuleHelpCatalogs(wizzDir, agentEntries = []) {
    return helpCatalog.mergeModuleHelpCatalogs(wizzDir, agentEntries, { trackFile: (p) => this.installedFiles.add(p) });
  }

  /**
   * Render a consolidated install summary using prompts.note()
   * @param {Array} results - Array of {step, status: 'ok'|'error'|'warn', detail}
   * @param {Object} context - {wizzDir, modules, ides, customFiles, modifiedFiles}
   */
  async renderInstallSummary(results, context = {}) {
    const color = await prompts.getColor();
    const selectedIdes = new Set((context.ides || []).map((ide) => String(ide).toLowerCase()));

    // Build step lines with status indicators
    const preVersions = context.preInstallVersions || new Map();
    const lines = [];
    for (const r of results) {
      const stepLabel = r.step;

      let icon;
      if (r.status === 'ok') {
        icon = color.green('\u2713');
      } else if (r.status === 'warn') {
        icon = color.yellow('!');
      } else {
        icon = color.red('\u2717');
      }

      // Build version detail for module results
      let detail = '';
      if (r.moduleCode && r.newVersion) {
        const oldVersion = preVersions.get(r.moduleCode);
        // Format a version label for display:
        //   "main" → "main @ <short-sha>" (next channel shows what SHA landed)
        //   "v1.7.0" or "1.7.0" → "v1.7.0" (prefix 'v' when missing)
        //   anything else (legacy strings) → as-is
        const fmt = (v, sha) => {
          if (typeof v !== 'string' || !v) return '';
          if (v === 'main' || v === 'HEAD') return sha ? `main @ ${sha.slice(0, 7)}` : 'main';
          if (/^v?\d+\.\d+\.\d+/.test(v)) return v.startsWith('v') ? v : `v${v}`;
          return v;
        };
        const newV = fmt(r.newVersion, r.newSha);
        // 'main'/'HEAD' strings only identify the channel, not the commit, so
        // we can't assert "no change" without comparing SHAs — and preVersions
        // doesn't carry the old SHA. Render these as a refresh instead of a
        // false-negative "no change".
        const isMainLike = oldVersion === 'main' || oldVersion === 'HEAD';
        if (oldVersion && oldVersion === r.newVersion && !isMainLike) {
          detail = ` (${newV}, no change)`;
        } else if (oldVersion && isMainLike) {
          detail = ` (${newV}, refreshed)`;
        } else if (oldVersion) {
          detail = ` (${fmt(oldVersion, r.newSha)} → ${newV})`;
        } else {
          detail = ` (${newV}, installed)`;
        }
      } else if (r.detail) {
        detail = ` (${r.detail})`;
      }
      lines.push(`  ${icon}  ${stepLabel}${detail}`);
    }

    if ((context.ides || []).length === 0) {
      lines.push(`  ${color.green('\u2713')}  No IDE selected (installed in _wizz only)`);
    }

    // Context and warnings
    lines.push('');
    if (context.wizzDir) {
      lines.push(`  Installed to: ${context.wizzDir}`);
    }
    if (context.customFiles && context.customFiles.length > 0) {
      lines.push(`  ${color.cyan(`Custom files preserved: ${context.customFiles.length}`)}`);
    }
    if (context.modifiedFiles && context.modifiedFiles.length > 0) {
      lines.push(`  ${color.yellow(`Modified files backed up (.bak): ${context.modifiedFiles.length}`)}`);
    }

    // Next steps
    lines.push(
      '',
      '  Get started:',
      `    1. Launch your AI agent from your project folder`,
      `    2. Not sure what to do? Invoke the ${color.cyan('wizz-help')} skill and ask it what to do!`,
      '',
      `    Docs and Guides: ${color.blue('https://method.wizzcomms.com/')}`,
      `    Source: ${color.blue('https://github.com/wizzcomms/wizz-method/')}`,
    );

    await prompts.box(lines.join('\n'), 'Wizz Method is ready to use!', {
      rounded: true,
      formatBorder: color.green,
    });
  }

  /**
   * Quick update method - preserves all settings and only prompts for new config fields
   * @param {Object} config - Configuration with directory
   * @returns {Object} Update result
   */
  async quickUpdate(config) {
    return quickUpdateModule.quickUpdate(this, config);
  }

  /**
   * Uninstall WIZZ with selective removal options
   * @param {string} directory - Project directory
   * @param {Object} options - Uninstall options
   * @param {boolean} [options.removeModules=true] - Remove _wizz/ directory
   * @param {boolean} [options.removeIdeConfigs=true] - Remove IDE configurations
   * @param {boolean} [options.removeOutputFolder=false] - Remove user artifacts output folder
   * @returns {Object} Result with success status and removed components
   */
  async uninstall(directory, options = {}) {
    const projectDir = path.resolve(directory);
    const { wizzDir } = await this.findWizzDir(projectDir);

    if (!(await fs.pathExists(wizzDir))) {
      return { success: false, reason: 'not-installed' };
    }

    // 1. DETECT: Read state BEFORE deleting anything
    const existingInstall = await ExistingInstall.detect(wizzDir);
    const outputFolder = await this._readOutputFolder(wizzDir);

    const removed = { modules: false, ideConfigs: false, outputFolder: false };

    // 2. IDE CLEANUP (before _wizz/ deletion so configs are accessible)
    if (options.removeIdeConfigs !== false) {
      await this.uninstallIdeConfigs(projectDir, existingInstall, { silent: options.silent });
      removed.ideConfigs = true;
    }

    // 3. OUTPUT FOLDER (only if explicitly requested)
    if (options.removeOutputFolder === true && outputFolder) {
      removed.outputFolder = await this.uninstallOutputFolder(projectDir, outputFolder);
    }

    // 4. WIZZ DIRECTORY (last, after everything that needs it)
    if (options.removeModules !== false) {
      removed.modules = await this.uninstallModules(projectDir);
    }

    return { success: true, removed, version: existingInstall.installed ? existingInstall.version : null };
  }

  /**
   * Uninstall IDE configurations only
   * @param {string} projectDir - Project directory
   * @param {Object} existingInstall - Detection result from detector.detect()
   * @param {Object} [options] - Options (e.g. { silent: true })
   * @returns {Promise<Object>} Results from IDE cleanup
   */
  async uninstallIdeConfigs(projectDir, existingInstall, options = {}) {
    await this.ideManager.ensureInitialized();
    const cleanupOptions = { isUninstall: true, silent: options.silent };
    const ideList = existingInstall.ides;
    if (ideList.length > 0) {
      return this.ideManager.cleanupByList(projectDir, ideList, cleanupOptions);
    }
    return this.ideManager.cleanup(projectDir, cleanupOptions);
  }

  /**
   * Remove user artifacts output folder
   * @param {string} projectDir - Project directory
   * @param {string} outputFolder - Output folder name (relative)
   * @returns {Promise<boolean>} Whether the folder was removed
   */
  async uninstallOutputFolder(projectDir, outputFolder) {
    if (!outputFolder) return false;
    const resolvedProject = path.resolve(projectDir);
    const outputPath = path.resolve(resolvedProject, outputFolder);
    if (!outputPath.startsWith(resolvedProject + path.sep)) {
      return false;
    }
    if (await fs.pathExists(outputPath)) {
      await fs.remove(outputPath);
      return true;
    }
    return false;
  }

  /**
   * Remove the _wizz/ directory
   * @param {string} projectDir - Project directory
   * @returns {Promise<boolean>} Whether the directory was removed
   */
  async uninstallModules(projectDir) {
    const { wizzDir } = await this.findWizzDir(projectDir);
    if (await fs.pathExists(wizzDir)) {
      await fs.remove(wizzDir);
      return true;
    }
    return false;
  }

  /**
   * Get installation status
   */
  async getStatus(directory) {
    const projectDir = path.resolve(directory);
    const { wizzDir } = await this.findWizzDir(projectDir);
    return await ExistingInstall.detect(wizzDir);
  }

  /**
   * Get available modules
   */
  async getAvailableModules() {
    return await new OfficialModules().listAvailable();
  }

  /**
   * Get the configured output folder name for a project
   * Resolves wizzDir internally from projectDir
   * @param {string} projectDir - Project directory
   * @returns {string} Output folder name (relative, default: '_wizz-output')
   */
  async getOutputFolder(projectDir) {
    const { wizzDir } = await this.findWizzDir(projectDir);
    return this._readOutputFolder(wizzDir);
  }

  /**
   * Find the wizz installation directory in a project
   * Always uses the standard _wizz folder name
   * @param {string} projectDir - Project directory
   * @returns {Promise<Object>} { wizzDir: string }
   */
  async findWizzDir(projectDir) {
    const wizzDir = path.join(projectDir, WIZZ_FOLDER_NAME);
    return { wizzDir };
  }

  /**
   * Read the output_folder setting from module config files
   * Checks bmm/config.yaml first, then other module configs
   * @param {string} wizzDir - WIZZ installation directory
   * @returns {string} Output folder path or default
   */
  async _readOutputFolder(wizzDir) {
    const yaml = require('yaml');

    // Check bmm/config.yaml first (most common)
    const bmmConfigPath = path.join(wizzDir, 'bmm', 'config.yaml');
    if (await fs.pathExists(bmmConfigPath)) {
      try {
        const content = await fs.readFile(bmmConfigPath, 'utf8');
        const config = yaml.parse(content);
        if (config && config.output_folder) {
          // Strip {project-root}/ prefix if present
          return config.output_folder.replace(/^\{project-root\}[/\\]/, '');
        }
      } catch (error) {
        await prompts.log.warn(`Warning: could not read ${bmmConfigPath}: ${error.message}`);
      }
    }

    // Scan other module config.yaml files
    try {
      const entries = await fs.readdir(wizzDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === 'bmm' || entry.name.startsWith('_')) continue;
        const configPath = path.join(wizzDir, entry.name, 'config.yaml');
        if (await fs.pathExists(configPath)) {
          try {
            const content = await fs.readFile(configPath, 'utf8');
            const config = yaml.parse(content);
            if (config && config.output_folder) {
              return config.output_folder.replace(/^\{project-root\}[/\\]/, '');
            }
          } catch (error) {
            await prompts.log.warn(`Warning: could not read ${configPath}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      await prompts.log.warn(`Warning: could not scan ${wizzDir} for module configs: ${error.message}`);
    }

    // Default fallback
    return '_wizz-output';
  }

  /**
   * Parse a CSV line, handling quoted fields.
   * Thin wrapper — see `core/help-catalog.js` for the implementation and the
   * M15 rationale (auditoria 2026-07-07) on why this delegates to
   * `csv-parse/sync`.
   * @param {string} line - CSV line to parse
   * @returns {Array} Array of field values
   */
  parseCSVLine(line) {
    return helpCatalog.parseCSVLine(line);
  }

  /**
   * Escape a CSV field if it contains special characters.
   * Thin wrapper — see `core/help-catalog.js` for the implementation and the
   * M15 rationale (auditoria 2026-07-07) on why this stays manual.
   * @param {string} field - Field value to escape
   * @returns {string} Escaped field
   */
  escapeCSVField(field) {
    return helpCatalog.escapeCSVField(field);
  }
}

module.exports = { Installer };
