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
    layers: {
      name: 'layers',
      description: 'Manage architecture layers and mappings',
    },
    rules: {
      name: 'rules',
      description: 'Manage architecture rules',
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
    initWithOut: 'archctl init --out <dir> --force',
    layersList: 'archctl layers list',
    layersAdd: 'archctl layers add --preset <preset-id>',
    layersRemove: 'archctl layers remove --layer <name>',
    layersMap: 'archctl layers map --layer <name> --include <path>',
    layersMapWithExclude: 'archctl layers map --layer <name> --include <path> --exclude <pattern>',
    layersExcludeOnly: 'archctl layers map --layer <name> --exclude <pattern>',
    layersUnmap: 'archctl layers unmap --layer <name> --include <path>',
    graph: 'archctl graph',
    sync: 'archctl sync',
    lint: 'archctl lint',
    prompt: 'archctl prompt',
  },

  // Init Command Messages
  init: {
    welcome: "🏗️  Welcome to archctl! Let's set up your architecture configuration.\n",
    success: '✓ Initialized architecture config at:',
    nextStepsHeader: '\n✨ Next steps:',
    nextSteps: [
      '  1. Review and customize your layers in the config file',
      '  2. Add layer mappings to map file paths to layers',
      '  3. Run `archctl lint` to check your codebase',
    ],
    alreadyExists:
      'already exists. Use --force to overwrite or choose a different --out directory.',
    defaultConfigName: 'My Architecture',

    // Interactive prompts
    prompts: {
      projectName: 'What is your project name?',
      entryPoint: 'What is your application entry point? (e.g., src/index.ts)',
      useTemplate: 'Would you like to use a template?',
      selectTemplate: 'Select an architecture template:',
      customSetup: 'Custom (start from scratch)',
    },

    // Template descriptions for selection
    templateDescriptions: {
      none: 'Start with an empty configuration',
    },
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
      '  - Generate context-aware prompts for AI assistants',
      '  - Include architecture rules and constraints',
      '  - Add relevant code patterns and examples',
      '  - Support multiple prompt templates',
      '  - Copy to clipboard or save to file',
    ],
    foundConfig: 'Found config at:',
    loadedConfig: 'Loaded config:',
  },

  // Layers Command Messages
  layers: {
    // List subcommand
    list: {
      noLayers: 'No layers defined yet.',
      suggestAddHeader: '\nExamples:',
      suggestAddPreset: '  archctl layers add --preset <preset-id>',
      suggestAddCustom: '  archctl layers add --name <layer-name> --description <description>',
      layersHeader: '\n📦 Defined Layers:',
      mappingsHeader: '\n🗺️  Layer Mappings:',
      noMappings: 'No layer mappings defined yet.',
      suggestMap:
        'Use `archctl layers map --layer <name> --include <path>` to map files to layers.',
    },

    // Add subcommand
    add: {
      success: '✓ Added layer',
      duplicate: 'Error: Layer already exists:',
      suggestList: 'Use `archctl layers list` to see all layers.',
      missingArgs: 'Error: Must provide either --preset or both --name and --description',
      presetNotFound: 'Error: Preset not found:',
      availablePresets: '\nAvailable presets:',
      examplesHeader: '\nExamples:',
      examplePreset: '  archctl layers add --preset <preset-id>',
      exampleCustom: '  archctl layers add --name <layer-name> --description <description>',
    },

    // Map subcommand
    map: {
      success: '✓ Mapped layer',
      layerNotFound: 'Error: Layer not found:',
      suggestList: '\nUse `archctl layers list` to see available layers.',
      suggestAdd: 'Or use `archctl layers add` to create a new layer.',
      missingLayer: 'Error: Must provide --layer <name>',
      missingInclude: 'Error: Must provide at least one --include <path>',
    },

    // Help
    help: {
      unknownSubcommand: 'Error: Unknown layers subcommand:',
      availableSubcommands: '\nAvailable subcommands:',
      listUsage:
        '  archctl layers list                                          # List all layers and mappings',
      addUsage:
        '  archctl layers add --preset <id>                             # Add layer from preset',
      addCustomUsage:
        '  archctl layers add --name <name> --description <desc>        # Add custom layer',
      removeUsage:
        '  archctl layers remove --layer <name>                         # Remove layer and all mappings',
      mapUsage:
        '  archctl layers map --layer <name> --include <path>           # Map files to layer',
      mapWithExcludeUsage:
        '  archctl layers map --layer <name> --include <path> --exclude <path>  # Map with exclusions',
      excludeOnlyUsage:
        '  archctl layers map --layer <name> --exclude <path>           # Add excludes to all layer mappings',
      unmapUsage:
        '  archctl layers unmap --layer <name> [--include <path>]      # Remove mapping(s)',
      unmapExcludeUsage:
        '  archctl layers unmap --layer <name> --exclude <path>         # Remove exclude from all layer mappings',
      unmapSpecificExcludeUsage:
        '  archctl layers unmap --layer <name> --include <path> --exclude <path>  # Remove specific exclude',
    },

    // Common
    common: {
      configNotFound: 'Error: No config file found. Run `archctl init` first.',
      configSaved: '✓ Config saved to:',
    },
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
