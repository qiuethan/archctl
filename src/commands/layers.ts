import type { ParsedArgs, LayerConfig, LayerMapping } from '../types';
import { findConfigFile, loadConfig, saveConfig } from '../infrastructure/config/configService';
import { getLayerPreset, getAllLayerPresets } from '../infrastructure/layers/layerPresets';
import * as layerService from '../infrastructure/layers/layerService';
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

    case 'map':
      cmdLayersMap(args);
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
  const configPath = findConfigFile();

  if (!configPath) {
    presenter.displayConfigNotFound();
    process.exit(1);
  }

  const config = loadConfig(configPath);
  presenter.displayLayersList(config);
}

/**
 * Add a new layer to the configuration
 */
function cmdLayersAdd(args: ParsedArgs): void {
  const configPath = findConfigFile();

  if (!configPath) {
    presenter.displayConfigNotFound();
    process.exit(1);
  }

  const config = loadConfig(configPath);

  let layerName: string;
  let layerDescription: string;

  // Check if using preset
  if (args.preset) {
    const preset = getLayerPreset(args.preset as string);
    if (!preset) {
      presenter.displayPresetNotFound(args.preset as string, getAllLayerPresets());
      process.exit(1);
    }

    layerName = preset.name;
    layerDescription = (args.description as string) || preset.description;
  } else if (args.name && args.description) {
    layerName = args.name as string;
    layerDescription = args.description as string;
  } else {
    presenter.displayMissingAddArgs();
    process.exit(1);
  }

  // Check for duplicate
  if (layerService.layerExists(config, layerName)) {
    const existingLayer = layerService.findLayer(config, layerName)!;
    presenter.displayLayerExists(existingLayer.name);
    process.exit(1);
  }

  // Add the layer
  const newLayer: LayerConfig = {
    name: layerName,
    description: layerDescription,
  };

  layerService.addLayer(config, newLayer);

  // Save config
  saveConfig(configPath, config);

  presenter.displayLayerAdded(newLayer, configPath);
}

/**
 * Map files/folders to a layer
 */
function cmdLayersMap(args: ParsedArgs): void {
  const configPath = findConfigFile();

  if (!configPath) {
    presenter.displayConfigNotFound();
    process.exit(1);
  }

  // Get the project root and validate location
  const projectRoot = layerService.getProjectRoot(configPath);
  const currentDir = process.cwd();

  // Check if current directory is within the project
  if (!layerService.validateWithinProject(projectRoot, currentDir)) {
    presenter.displayMustRunFromProject(projectRoot, currentDir);
    process.exit(1);
  }

  const config = loadConfig(configPath);

  // Validate required arguments
  if (!args.layer) {
    presenter.displayMissingLayer();
    process.exit(1);
  }

  const layerName = args.layer as string;

  // Check if layer exists
  if (!layerService.layerExists(config, layerName)) {
    presenter.displayLayerNotFound(layerName);
    process.exit(1);
  }

  // Get include paths
  let includePaths: string[];
  if (Array.isArray(args.include)) {
    includePaths = args.include as string[];
  } else if (args.include) {
    includePaths = [args.include as string];
  } else {
    presenter.displayMissingInclude();
    process.exit(1);
  }

  // Process include paths (convert to relative to project root and normalize)
  const processedIncludes = layerService.processPathsForMapping(
    projectRoot,
    currentDir,
    includePaths
  );

  // Get exclude paths if provided
  let excludePaths: string[] | undefined;
  if (args.exclude) {
    const excludeList = Array.isArray(args.exclude) ? (args.exclude as string[]) : [args.exclude as string];
    excludePaths = layerService.processPathsForMapping(
      projectRoot,
      currentDir,
      excludeList
    );
  }

  // Get priority
  const priority = args.priority ? parseInt(args.priority as string, 10) : undefined;

  // Create layer mapping
  const mapping: LayerMapping = {
    layer: layerName,
    include: processedIncludes,
  };

  if (excludePaths && excludePaths.length > 0) {
    mapping.exclude = excludePaths;
  }

  if (priority !== undefined && !isNaN(priority)) {
    mapping.priority = priority;
  }

  // Add mapping
  layerService.addLayerMapping(config, mapping);

  // Save config
  saveConfig(configPath, config);

  // Display success message
  presenter.displayLayerMapped(layerName, processedIncludes, excludePaths, priority, configPath);
}
