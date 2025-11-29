/**
 * Centralized message strings for easy editing and localization
 */

export const messages = {
  // CLI Help and Info
  cliName: 'archctl – architecture control CLI',
  cliUsage: 'archctl <command> [options]',
  cliMoreInfo: 'For more information, visit: https://github.com/yourusername/archctl',

  // Commands
  commands: {
    init: {
      name: 'init',
      description: 'Initialize architecture folder and config',
    },
    sync: {
      name: 'sync',
      description: 'Propagate architecture documentation',
    },
    lint: {
      name: 'lint',
      description: 'Enforce architecture rules',
    },
    prompt: {
      name: 'prompt',
      description: 'Generate AI prompts with architecture context',
    },
  },

  // Init Command Options
  initOptions: {
    out: {
      flag: '--out',
      description: 'Folder to store architecture files (default: ".archctl")',
    },
    force: {
      flag: '--force',
      description: 'Overwrite existing archctl.config.json if present',
    },
  },

  // Examples
  examples: {
    init: 'archctl init',
    initWithOut: 'archctl init --out .archctl --force',
    sync: 'archctl sync',
    lint: 'archctl lint',
    prompt: 'archctl prompt',
  },

  // Init Command Messages
  init: {
    success: '✓ Initialized architecture config at:',
    nextStepsHeader: '\nNext steps:',
    nextSteps: [
      '  1. Edit the config to define your architecture layers',
      '  2. Add rules to enforce architectural constraints',
      '  3. Run `archctl lint` to check your codebase',
    ],
    alreadyExists: 'already exists. Use --force to overwrite or choose a different --out directory.',
    defaultConfigName: 'My Architecture',
  },

  // Sync Command Messages
  sync: {
    notImplemented: '⚠️  Sync command is not yet implemented.',
    plannedFeaturesHeader: '\nPlanned features:',
    plannedFeatures: [
      '  - Generate architecture documentation',
      '  - Create/update README sections',
      '  - Export diagrams (Mermaid, PlantUML)',
      '  - Sync with ADR tools',
    ],
    foundConfig: 'Found config at:',
  },

  // Lint Command Messages
  lint: {
    notImplemented: '⚠️  Lint command is not yet implemented.',
    plannedFeaturesHeader: '\nPlanned features:',
    plannedFeatures: [
      '  - Check layer dependency violations',
      '  - Validate naming conventions',
      '  - Enforce file structure rules',
      '  - Custom rule execution',
      '  - Configurable severity levels',
    ],
    foundConfig: 'Found config at:',
    loadedConfig: 'Loaded config:',
    rulesDefined: 'Rules defined:',
  },

  // Prompt Command Messages
  prompt: {
    notImplemented: '⚠️  Prompt command is not yet implemented.',
    plannedFeaturesHeader: '\nPlanned features:',
    plannedFeatures: [
      '  - Generate architecture-aware AI prompts',
      '  - Include layer definitions and constraints',
      '  - Add relevant code patterns and examples',
      '  - Support multiple prompt templates',
      '  - Copy to clipboard or save to file',
    ],
    foundConfig: 'Found config at:',
    loadedConfig: 'Loaded config:',
  },

  // Common Messages
  common: {
    noConfigFound: 'No archctl.config.json found. Run `archctl init` first.',
    unknownCommand: 'Unknown command:',
    version: 'archctl v0.1.0',
    error: 'Error:',
    failedToLoadConfig: 'Failed to load config:',
  },

  // Config Loader Messages
  config: {
    notFound: 'Config file not found:',
    invalidName: 'Config must have a valid "name" field',
  },
};
