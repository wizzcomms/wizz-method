const prompts = require('./prompts');

const CLIUtils = {
  /**
   * Display Wizz Method logo and version using @clack intro + box
   */
  async displayLogo() {
    const color = await prompts.getColor();
    const termWidth = process.stdout.columns || 80;

    // Full "WIZZ METHOD" logo for wide terminals, "WIZZ" only for narrow
    const logoWide = [
      '██╗    ██╗ ██╗ ███████╗ ███████╗    ███╗   ███╗ ███████╗ ████████╗ ██╗  ██╗  ██████╗  ██████╗  ™',
      '██║    ██║ ██║ ╚══███╔╝ ╚══███╔╝    ████╗ ████║ ██╔════╝ ╚══██╔══╝ ██║  ██║ ██╔═══██╗ ██╔══██╗',
      '██║ █╗ ██║ ██║   ███╔╝    ███╔╝     ██╔████╔██║ █████╗      ██║    ███████║ ██║   ██║ ██║  ██║',
      '██║███╗██║ ██║  ███╔╝    ███╔╝      ██║╚██╔╝██║ ██╔══╝      ██║    ██╔══██║ ██║   ██║ ██║  ██║',
      '╚███╔███╔╝ ██║ ███████╗ ███████╗    ██║ ╚═╝ ██║ ███████╗    ██║    ██║  ██║ ╚██████╔╝ ██████╔╝',
      ' ╚══╝╚══╝  ╚═╝ ╚══════╝ ╚══════╝    ╚═╝     ╚═╝ ╚══════╝    ╚═╝    ╚═╝  ╚═╝  ╚═════╝  ╚═════╝ ',
    ];

    const logoNarrow = [
      '    ██╗    ██╗ ██╗ ███████╗ ███████╗ ™',
      '    ██║    ██║ ██║ ╚══███╔╝ ╚══███╔╝',
      '    ██║ █╗ ██║ ██║   ███╔╝    ███╔╝ ',
      '    ██║███╗██║ ██║  ███╔╝    ███╔╝  ',
      '    ╚███╔███╔╝ ██║ ███████╗ ███████╗',
      '     ╚══╝╚══╝  ╚═╝ ╚══════╝ ╚══════╝',
    ];

    const logoLines = termWidth >= 95 ? logoWide : logoNarrow;
    const logo = logoLines.map((line) => color.blue(line)).join('\n');
    const tagline = color.white('    Agile AI-Driven Development, the Wizz way\n    © Wizz! comms.  ·  Built on BMAD Core');

    await prompts.box(`${logo}\n${tagline}`, '', {
      contentAlign: 'center',
      rounded: true,
      formatBorder: color.blue,
    });
  },

  /**
   * Display module configuration header
   * @param {string} moduleName - Module name (fallback if no custom header)
   * @param {string} header - Custom header from module.yaml
   * @param {string} subheader - Custom subheader from module.yaml
   */
  async displayModuleConfigHeader(moduleName, header = null, subheader = null) {
    const title = header || `Configuring ${moduleName.toUpperCase()} Module`;
    await prompts.note(subheader || '', title);
  },
};

module.exports = { CLIUtils };
