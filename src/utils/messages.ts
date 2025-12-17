/**
 * Centralized message strings for easy editing and localization
 */

import packageJson from '../../package.json';

export const messages = {
  // CLI Help and Info
  cliName: 'archctl - Architecture Control CLI',
  cliUsage: 'archctl <command> [options]',
  cliMoreInfo: 'For more information, visit: https://github.com/qiuethan/archctl',

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
    contexts: {
      name: 'contexts',
      description: 'Manage vertical contexts and visibility rules',
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
    suggest: {
      name: 'suggest',
      description: 'Analyze codebase and suggest architecture configuration',
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
    contextsList: 'archctl contexts list',
    contextsAdd: 'archctl contexts add --context <name> --include <path> --public <path>',
    contextsVisibility: 'archctl contexts visibility --context <name> --allow billing,shared',
    sync: 'archctl sync',
    lint: 'archctl lint',
    suggest: 'archctl suggest',
    prompt: 'archctl prompt',
  },

  // Init Command Messages
  init: {
    welcome: 'Initializing archctl architecture configuration.\n',
    success: 'Successfully initialized architecture configuration at:',
    nextStepsHeader: '\nNext steps:',
    nextSteps: [
      '  1. Review and customize layers in the configuration file',
      '  2. Add layer mappings to associate file paths with layers',
      '  3. Add context mappings and visibility rules for vertical slices (optional)',
      '  4. Run `archctl lint` to validate your architecture',
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
    notImplemented: 'Sync command is not yet implemented.',
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
    notImplemented: 'Lint command is not yet implemented.',
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
    notImplemented: 'Prompt command is not yet implemented.',
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
      layersHeader: '\nDefined Layers:',
      mappingsHeader: '\nLayer Mappings:',
      noMappings: 'No layer mappings defined yet.',
      suggestMap:
        'Use `archctl layers map --layer <name> --include <path>` to map files to layers.',
    },

    // Add subcommand
    add: {
      success: 'Successfully added layer',
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
      success: 'Successfully mapped layer',
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
      configNotFound: 'Error: Configuration file not found. Run `archctl init` first.',
      configSaved: 'Configuration saved to:',
    },
  },

  // Contexts Command Messages
  contexts: {
    common: {
      configSaved: 'Configuration saved to:',
    },
    list: {
      contextMappingsHeader: 'Context mappings:',
      noContextMappings: 'No context mappings defined yet.',
      suggestAdd:
        'Use `archctl contexts add --context <name> --include <path> --public <path>` to add one.',
      visibilityHeader: 'Context visibility rules:',
      noVisibilityRules: 'No context-visibility rules defined yet.',
      suggestVisibility:
        'Use `archctl contexts visibility --context <name> --allow <ctx1,ctx2>` to define boundaries.',
    },
    add: {
      success: 'Successfully added/updated context',
      missingContext: 'Missing required argument: --context <name>',
      missingInclude: 'Missing required argument: --include <path>',
    },
    remove: {
      removedInclude: 'Removed include path for context',
      removedPublic: 'Removed public path for context',
      removedContext: 'Removed all mappings for context',
      contextNotFound: 'Context not found:',
    },
    visibility: {
      updated: 'Updated context visibility',
    },
    help: {
      unknownSubcommand: 'Error: Unknown contexts subcommand:',
      availableSubcommands: '\nAvailable subcommands:',
      listUsage:
        '  archctl contexts list                                          # List contexts and visibility',
      addUsage:
        '  archctl contexts add --context <name> --include <path> [--public <path>] [--exclude <path>] [--priority <n>]',
      removeUsage:
        '  archctl contexts remove --context <name> [--include <path> | --public <path>]',
      unmapUsage:
        '  archctl contexts unmap --context <name> --include <path>              # Alias for remove with include',
      visibilityUsage:
        '  archctl contexts visibility --context <name> --allow <ctx1,ctx2>      # Set allowed dependencies',
    },
  },

  // Common Messages
  common: {
    noConfigFound: 'Configuration file not found. Run `archctl init` first.',
    unknownCommand: 'Unknown command:',
    version: `archctl v${packageJson.version}`,
    error: 'Error:',
    failedToLoadConfig: 'Failed to load config:',
  },

  // Config Loader Messages
  config: {
    notFound: 'Configuration file not found:',
    invalidName: 'Configuration must have a valid "name" field',
  },
};
