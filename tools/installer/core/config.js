/**
 * Clean install configuration built from user input.
 * User input comes from either UI answers or headless CLI flags.
 */
class Config {
  constructor({
    directory,
    modules,
    ides,
    selectedAreas,
    mcpPlan,
    cliPlan,
    skipPrompts,
    verbose,
    actionType,
    coreConfig,
    moduleConfigs,
    quickUpdate,
    channelOptions,
    setOverrides,
  }) {
    this.directory = directory;
    this.modules = Object.freeze([...modules]);
    this.ides = Object.freeze([...ides]);
    // Global-skills areas the user chose to install (from skills-registry.yaml).
    // Empty means "all areas" when skills-lib is installed; see installSkillsLib.
    this.selectedAreas = Object.freeze([...(selectedAreas || [])]);
    // MCP plan resolved from the registry for the chosen areas:
    //   toWrite     — merged into the project .mcp.json (placeholder secrets)
    //   toRecommend — printed as `claude mcp add ...` for the user to run later
    // Empty/absent on quick-update or non-wizz installs. See modules/mcp-config.js.
    this.mcpPlan = mcpPlan || { toWrite: [], toRecommend: [] };
    // CLI plan resolved from the registry for the chosen areas:
    //   toInstall        — `install` command run during the install (opt-in)
    //   toRecommend      — printed for the user to run later
    //   alreadyInstalled — detected on PATH, reported and skipped
    // Empty/absent on quick-update or non-wizz installs. See modules/cli-config.js.
    this.cliPlan = cliPlan || { toInstall: [], toRecommend: [], alreadyInstalled: [] };
    this.skipPrompts = skipPrompts;
    this.verbose = verbose;
    this.actionType = actionType;
    this.coreConfig = coreConfig;
    this.moduleConfigs = moduleConfigs;
    this._quickUpdate = quickUpdate;
    // channelOptions carry a Map + Set; don't deep-freeze.
    this.channelOptions = channelOptions || null;
    // Parsed `--set <module>.<key>=<value>` overrides, applied as a TOML
    // patch AFTER the install finishes. Shape: { moduleCode: { key: value } }.
    // Intentionally NOT integrated with the prompt/template/schema flow; see
    // `tools/installer/set-overrides.js` for the rationale and tradeoffs.
    this.setOverrides = setOverrides || {};
    Object.freeze(this);
  }

  /**
   * Build a clean install config from raw user input.
   * @param {Object} userInput - UI answers or CLI flags
   * @returns {Config}
   */
  static build(userInput) {
    const modules = [...(userInput.modules || [])];
    if (userInput.installCore && !modules.includes('core')) {
      modules.unshift('core');
    }

    return new Config({
      directory: userInput.directory,
      modules,
      ides: userInput.skipIde ? [] : [...(userInput.ides || [])],
      selectedAreas: userInput.selectedAreas || [],
      mcpPlan: userInput.mcpPlan || { toWrite: [], toRecommend: [] },
      cliPlan: userInput.cliPlan || { toInstall: [], toRecommend: [], alreadyInstalled: [] },
      skipPrompts: userInput.skipPrompts || false,
      verbose: userInput.verbose || false,
      actionType: userInput.actionType,
      coreConfig: userInput.coreConfig || {},
      moduleConfigs: userInput.moduleConfigs || null,
      quickUpdate: userInput._quickUpdate || false,
      channelOptions: userInput.channelOptions || null,
      setOverrides: userInput.setOverrides || {},
    });
  }

  hasCoreConfig() {
    return this.coreConfig && Object.keys(this.coreConfig).length > 0;
  }

  isQuickUpdate() {
    return this._quickUpdate;
  }
}

module.exports = { Config };
