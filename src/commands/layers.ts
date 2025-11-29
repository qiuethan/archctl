import type { ParsedArgs, LayerConfig, LayerMapping } from '../types';
import { findConfigFile, loadConfig, saveConfig } from '../infrastructure/config/configService';
import { getLayerPreset, getAllLayerPresets } from '../infrastructure/layers/layerPresets';
import * as layerService from '../infrastructure/layers/layerService';
import { messages } from '../messages';

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
      console.error(`${messages.layers.help.unknownSubcommand} ${subcommand}`);
      console.log(messages.layers.help.availableSubcommands);
      console.log(messages.layers.help.listUsage);
      console.log(messages.layers.help.addUsage);
      console.log(messages.layers.help.mapUsage);
      process.exit(1);
  }
}

/**
 * List all layers and their mappings
 */
function cmdLayersList(args: ParsedArgs): void {
  const configPath = findConfigFile();

  if (!configPath) {
    console.error(messages.layers.common.configNotFound);
    process.exit(1);
  }

  const config = loadConfig(configPath);

  // Display layers
  if (config.layers.length === 0) {
    console.log(messages.layers.list.noLayers);
    console.log(messages.layers.list.suggestAddHeader);
    console.log(messages.layers.list.suggestAddPreset);
    console.log(messages.layers.list.suggestAddCustom);
    return;
  }

  console.log(messages.layers.list.layersHeader);
  config.layers.forEach((layer) => {
    console.log(`  Layer "${layer.name}": ${layer.description}`);
  });

  // Display layer mappings
  console.log(messages.layers.list.mappingsHeader);
  if (!config.layerMappings || config.layerMappings.length === 0) {
    console.log(`  ${messages.layers.list.noMappings}`);
    console.log(`  ${messages.layers.list.suggestMap}`);
    return;
  }

  config.layerMappings.forEach((mapping) => {
    const parts = [`include: ${JSON.stringify(mapping.include)}`];
    if (mapping.exclude) {
      parts.push(`exclude: ${JSON.stringify(mapping.exclude)}`);
    }
    if (mapping.priority !== undefined) {
      parts.push(`priority: ${mapping.priority}`);
    }
    console.log(`  Layer "${mapping.layer}": ${parts.join(', ')}`);
  });
}

/**
 * Add a new layer to the configuration
 */
function cmdLayersAdd(args: ParsedArgs): void {
  const configPath = findConfigFile();

  if (!configPath) {
    console.error(messages.layers.common.configNotFound);
    process.exit(1);
  }

  const config = loadConfig(configPath);

  let layerName: string;
  let layerDescription: string;

  // Check if using preset
  if (args.preset) {
    const preset = getLayerPreset(args.preset as string);
    if (!preset) {
      console.error(`${messages.layers.add.presetNotFound} ${args.preset}`);
      console.log(messages.layers.add.availablePresets);
      getAllLayerPresets().forEach((p) => {
        console.log(`  ${p.id}: ${p.description}`);
      });
      process.exit(1);
    }

    layerName = preset.name;
    layerDescription = (args.description as string) || preset.description;
  } else if (args.name && args.description) {
    layerName = args.name as string;
    layerDescription = args.description as string;
  } else {
    console.error(messages.layers.add.missingArgs);
    console.log(messages.layers.add.examplesHeader);
    console.log(messages.layers.add.examplePreset);
    console.log(messages.layers.add.exampleCustom);
    process.exit(1);
  }

  // Check for duplicate
  if (layerService.layerExists(config, layerName)) {
    const existingLayer = layerService.findLayer(config, layerName)!;
    console.error(`${messages.layers.add.duplicate} ${existingLayer.name}`);
    console.log(messages.layers.add.suggestList);
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

  console.log(`${messages.layers.add.success} "${newLayer.name}": ${newLayer.description}`);
  console.log(`${messages.layers.common.configSaved} ${configPath}`);
}

/**
 * Map files/folders to a layer
 */
function cmdLayersMap(args: ParsedArgs): void {
  const configPath = findConfigFile();

  if (!configPath) {
    console.error(messages.layers.common.configNotFound);
    process.exit(1);
  }

  // Get the project root and validate location
  const projectRoot = layerService.getProjectRoot(configPath);
  const currentDir = process.cwd();

  // Check if current directory is within the project
  if (!layerService.validateWithinProject(projectRoot, currentDir)) {
    console.error('Error: Must run this command from within the project directory.');
    console.error(`Project root: ${projectRoot}`);
    console.error(`Current directory: ${currentDir}`);
    process.exit(1);
  }

  const config = loadConfig(configPath);

  // Validate required arguments
  if (!args.layer) {
    console.error(messages.layers.map.missingLayer);
    process.exit(1);
  }

  const layerName = args.layer as string;

  // Check if layer exists
  if (!layerService.layerExists(config, layerName)) {
    console.error(`${messages.layers.map.layerNotFound} ${layerName}`);
    console.log(messages.layers.map.suggestList);
    console.log(messages.layers.map.suggestAdd);
    process.exit(1);
  }

  // Get include paths
  let includePaths: string[];
  if (Array.isArray(args.include)) {
    includePaths = args.include as string[];
  } else if (args.include) {
    includePaths = [args.include as string];
  } else {
    console.error(messages.layers.map.missingInclude);
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
  const parts = [`include: ${JSON.stringify(processedIncludes)}`];
  if (excludePaths) {
    parts.push(`exclude: ${JSON.stringify(excludePaths)}`);
  }
  if (priority !== undefined) {
    parts.push(`priority: ${priority}`);
  }
  console.log(`${messages.layers.map.success} "${layerName}": ${parts.join(', ')}`);
  console.log(`${messages.layers.common.configSaved} ${configPath}`);
}
