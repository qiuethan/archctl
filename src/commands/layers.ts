import * as path from 'path';
import type { ParsedArgs, ArchctlConfig, LayerConfig, LayerMapping } from '../types';
import { findConfigFile, loadConfig, saveConfig } from '../config/loader';
import { messages } from '../messages';
import { getLayerPreset, getAllLayerPresets } from '../config/layerPresets';

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

  // Check for duplicate (case-insensitive)
  const existingLayer = config.layers.find(
    (layer) => layer.name.toLowerCase() === layerName.toLowerCase()
  );

  if (existingLayer) {
    console.error(`${messages.layers.add.duplicate} ${existingLayer.name}`);
    console.log(messages.layers.add.suggestList);
    process.exit(1);
  }

  // Add the layer
  const newLayer: LayerConfig = {
    name: layerName,
    description: layerDescription,
  };

  config.layers.push(newLayer);

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

  // Get the project root (directory containing .archctl)
  const projectRoot = path.dirname(path.dirname(configPath));
  const currentDir = process.cwd();

  // Check if current directory is within the project
  const relativeToCurrent = path.relative(projectRoot, currentDir);
  if (relativeToCurrent.startsWith('..')) {
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
  const layer = config.layers.find((l) => l.name === layerName);
  if (!layer) {
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
  const processedIncludes = includePaths.map((p) => {
    // Convert path to be relative to project root
    const absolutePath = path.resolve(currentDir, p);
    const relativeToRoot = path.relative(projectRoot, absolutePath);
    // Normalize to forward slashes and add glob pattern if needed
    return normalizePathPattern(relativeToRoot.replace(/\\/g, '/'));
  });

  // Get exclude paths if provided
  let excludePaths: string[] | undefined;
  if (args.exclude) {
    const excludeList = Array.isArray(args.exclude) ? (args.exclude as string[]) : [args.exclude as string];
    excludePaths = excludeList.map((p) => {
      // Convert path to be relative to project root
      const absolutePath = path.resolve(currentDir, p);
      const relativeToRoot = path.relative(projectRoot, absolutePath);
      // Normalize to forward slashes and add glob pattern if needed
      return normalizePathPattern(relativeToRoot.replace(/\\/g, '/'));
    });
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

  // Initialize layerMappings if needed
  if (!config.layerMappings) {
    config.layerMappings = [];
  }

  // Add mapping
  config.layerMappings.push(mapping);

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

/**
 * Normalize a path pattern for layer mapping
 * - If contains * or ?, treat as glob and return as-is
 * - If looks like a file (has extension), return as-is
 * - If looks like a directory, append /**
 */
function normalizePathPattern(pattern: string): string {
  // Already a glob pattern
  if (pattern.includes('*') || pattern.includes('?')) {
    return pattern;
  }

  // Check if it looks like a file (has extension in last segment)
  const lastSegment = pattern.split(/[/\\]/).pop() || '';
  const hasExtension = lastSegment.includes('.');

  if (hasExtension) {
    // Treat as file path
    return pattern;
  }

  // Treat as directory, append /**
  // Normalize path separators to forward slashes
  const normalized = pattern.replace(/\\/g, '/');
  return normalized.endsWith('/') ? `${normalized}**` : `${normalized}/**`;
}
