const path = require('node:path');
const prompts = require('../prompts');
const { Installer } = require('../core/installer');
const { Manifest } = require('../core/manifest');
const { UI } = require('../ui');

const installer = new Installer();
const manifest = new Manifest();
const ui = new UI();

module.exports = {
  command: 'status',
  description: 'Display Wizz installation status and module versions',
  options: [],
  action: async (options) => {
    try {
      // Find the wizz directory
      const projectDir = process.cwd();
      const { wizzDir } = await installer.findWizzDir(projectDir);

      // Check if wizz directory exists
      const fs = require('../fs-native');
      if (!(await fs.pathExists(wizzDir))) {
        await prompts.log.warn('No Wizz installation found in the current directory.');
        await prompts.log.message(`Expected location: ${wizzDir}`);
        await prompts.log.message('Run "wizz install" to set up a new installation.');
        process.exit(0);
        return;
      }

      // Read manifest
      const manifestData = await manifest._readRaw(wizzDir);

      if (!manifestData) {
        await prompts.log.warn('No Wizz installation manifest found.');
        await prompts.log.message('Run "wizz install" to set up a new installation.');
        process.exit(0);
        return;
      }

      // Get installation info
      const installation = manifestData.installation || {};
      const modules = manifestData.modules || [];

      // Check for available updates (only for external modules)
      const availableUpdates = await manifest.checkForUpdates(wizzDir);

      // Display status
      await ui.displayStatus({
        installation,
        modules,
        availableUpdates,
        wizzDir,
      });

      process.exit(0);
    } catch (error) {
      await prompts.log.error(`Status check failed: ${error.message}`);
      if (process.env.WIZZ_DEBUG) {
        await prompts.log.message(error.stack);
      }
      process.exit(1);
    }
  },
};
