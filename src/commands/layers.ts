import type { ParsedArgs } from '../types';
import * as configService from '../services/configService';
import * as layersService from '../services/layersService';
import * as presenter from '../presentation/layersPresenter';

/**
 * Main entry point for layers command
 */
export function cmdLayers(args: ParsedArgs): void {
  const subcommand = args._?.[0];

  switch (subcommand) {
    case 'list':
      cmdLayersList(args);
      break;

    case 'add':
      cmdLayersAdd(args);
      break;

    case 'remove':
      cmdLayersRemove(args);
      break;

    case 'map':
      cmdLayersMap(args);
      break;

    case 'unmap':
      cmdLayersUnmap(args);
      break;

    default:
      presenter.displayUnknownSubcommand(subcommand);
      process.exit(1);
  }
}

/**
 * List all layers and their mappings
 */
function cmdLayersList(args: ParsedArgs): void {
  const configPath = configService.findConfig();

  if (!configPath) {
    presenter.displayConfigNotFound();
    process.exit(1);
  }

  const config = configService.loadConfig(configPath);
  presenter.displayLayersList(config);
}

/**
 * Add a new layer to the configuration
 */
function cmdLayersAdd(args: ParsedArgs): void {
  const configPath = configService.findConfig();

  if (!configPath) {
    presenter.displayConfigNotFound();
    process.exit(1);
  }

  const config = configService.loadConfig(configPath);

  try {
    const newLayer = layersService.addLayer(config, {
      presetId: args.preset as string | undefined,
      name: args.name as string | undefined,
      description: args.description as string | undefined,
    });

    // Save config
    configService.saveConfig(configPath, config);

    presenter.displayLayerAdded(newLayer, configPath);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith('Preset not found')) {
        presenter.displayPresetNotFound(args.preset as string, layersService.getAvailablePresets());
      } else if (error.message.startsWith('Layer already exists')) {
        const layerName = error.message.split(': ')[1] || 'unknown';
        presenter.displayLayerExists(layerName);
      } else if (error.message.includes('Must provide')) {
        presenter.displayMissingAddArgs();
      } else {
        console.error(error.message);
      }
    }
    process.exit(1);
  }
}

/**
 * Map files/folders to a layer
 */
function cmdLayersMap(args: ParsedArgs): void {
  const configPath = configService.findConfig();

  if (!configPath) {
    presenter.displayConfigNotFound();
    process.exit(1);
  }

  const projectRoot = layersService.getProjectRoot(configPath);
  const currentDir = process.cwd();

  // Validate current directory is within project
  if (!layersService.validateWithinProject(projectRoot, currentDir)) {
    presenter.displayMustRunFromProject(projectRoot, currentDir);
    process.exit(1);
  }

  const config = configService.loadConfig(configPath);

  try {
    // Parse and validate arguments (service layer)
    const mappingInput = layersService.parseMappingArguments(
      {
        layerName: typeof args.layer === 'string' ? args.layer : undefined,
        include: Array.isArray(args.include) || typeof args.include === 'string' ? args.include : undefined,
        exclude: Array.isArray(args.exclude) || typeof args.exclude === 'string' ? args.exclude : undefined,
        priority: typeof args.priority === 'string' || typeof args.priority === 'number' ? args.priority : undefined,
      },
      projectRoot,
      currentDir
    );

    // Add mapping (service layer)
    const mapping = layersService.addLayerMapping(config, mappingInput);

    // Save config (infrastructure layer)
    configService.saveConfig(configPath, config);

    // Display success (presentation layer)
    presenter.displayLayerMapped(
      mappingInput.layerName,
      mapping.include,
      mapping.exclude,
      mapping.priority,
      configPath
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Missing required argument: --layer')) {
        presenter.displayMissingLayer();
      } else if (error.message.includes('Missing required argument: --include')) {
        presenter.displayMissingInclude();
      } else if (error.message.startsWith('Layer not found')) {
        const layerName = error.message.split(': ')[1] || args.layer as string;
        presenter.displayLayerNotFound(layerName);
      } else {
        console.error(error.message);
      }
    }
    process.exit(1);
  }
}

/**
 * Remove a layer
 */
export function cmdLayersRemove(args: ParsedArgs): void {
  const configPath = configService.findConfig();

  if (!configPath) {
    presenter.displayConfigNotFound();
    process.exit(1);
  }

  const config = configService.loadConfig(configPath);

  // Validate required arguments
  if (!args.layer) {
    console.error('Error: Missing required argument --layer');
    process.exit(1);
  }

  const layerName = args.layer as string;

  try {
    layersService.removeLayer(config, layerName);

    // Save config
    configService.saveConfig(configPath, config);

    console.log(`✓ Removed layer "${layerName}" and all its mappings`);
    console.log(`✓ Config saved to: ${configPath}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

/**
 * Remove a layer mapping (unmap) - inverse of map command
 * Can remove entire mappings, or just exclude patterns
 */
export function cmdLayersUnmap(args: ParsedArgs): void {
  const configPath = configService.findConfig();

  if (!configPath) {
    presenter.displayConfigNotFound();
    process.exit(1);
  }

  const config = configService.loadConfig(configPath);

  try {
    // Service layer handles validation and business logic
    const result = layersService.removeLayerMapping(
      config,
      args.layer as string | undefined,
      args.include as string | undefined,
      args.exclude as string | undefined
    );

    // Save config
    configService.saveConfig(configPath, config);

    // Presentation layer handles display
    presenter.displayUnmapSuccess(result, configPath);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}
