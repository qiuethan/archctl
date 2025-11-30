import type { ArchctlConfig, LayerConfig, LayerMapping } from '../types';
import { messages } from '../utils/messages';

/**
 * Presentation layer for layers command
 * Handles all formatting and display logic
 */

/**
 * Display layers list
 */
export function displayLayersList(config: ArchctlConfig): void {
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
 * Display success message for adding a layer
 */
export function displayLayerAdded(layer: LayerConfig, configPath: string): void {
  console.log(`${messages.layers.add.success} "${layer.name}": ${layer.description}`);
  console.log(`${messages.layers.common.configSaved} ${configPath}`);
}

/**
 * Display success message for mapping a layer
 */
export function displayLayerMapped(
  layerName: string,
  includes: string[],
  excludes?: string[],
  priority?: number,
  configPath?: string
): void {
  const parts = [`include: ${JSON.stringify(includes)}`];
  if (excludes) {
    parts.push(`exclude: ${JSON.stringify(excludes)}`);
  }
  if (priority !== undefined) {
    parts.push(`priority: ${priority}`);
  }
  console.log(`${messages.layers.map.success} "${layerName}": ${parts.join(', ')}`);
  if (configPath) {
    console.log(`${messages.layers.common.configSaved} ${configPath}`);
  }
}

/**
 * Display error: config not found
 */
export function displayConfigNotFound(): void {
  console.error('Configuration file not found. Run `archctl init` to initialize.');
}

/**
 * Display error: layer already exists
 */
export function displayLayerExists(existingLayerName: string): void {
  console.error(`A layer with the name "${existingLayerName}" already exists. Please choose a different name.`);
  console.error(`${messages.layers.add.duplicate} ${existingLayerName}`);
  console.log(messages.layers.add.suggestList);
}

/**
 * Display error: layer not found
 */
export function displayLayerNotFound(layerName: string): void {
  console.error(`${messages.layers.map.layerNotFound} ${layerName}`);
  console.log(messages.layers.map.suggestList);
  console.log(messages.layers.map.suggestAdd);
}

/**
 * Display error: missing arguments for add
 */
export function displayMissingAddArgs(): void {
  console.error(messages.layers.add.missingArgs);
  console.log(messages.layers.add.examplesHeader);
  console.log(messages.layers.add.examplePreset);
  console.log(messages.layers.add.exampleCustom);
}

/**
 * Display error: preset not found
 */
export function displayPresetNotFound(presetId: string, availablePresets: Array<{id: string; description: string}>): void {
  console.error(`${messages.layers.add.presetNotFound} ${presetId}`);
  console.log(messages.layers.add.availablePresets);
  availablePresets.forEach((p) => {
    console.log(`  ${p.id}: ${p.description}`);
  });
}

/**
 * Display error: missing layer argument
 */
export function displayMissingLayer(): void {
  console.error(messages.layers.map.missingLayer);
}

/**
 * Display error: missing include argument
 */
export function displayMissingInclude(): void {
  console.error(messages.layers.map.missingInclude);
}

/**
 * Display error: must run from within project
 */
export function displayMustRunFromProject(projectRoot: string, currentDir: string): void {
  console.error('Command must be run from within the project directory.');
  console.error(`Project root: ${projectRoot}`);
  console.error(`Current directory: ${currentDir}`);
}

/**
 * Display success message for layer removal
 */
export function displayLayerRemoved(layerName: string, configPath: string): void {
  console.log(`\n✓ Removed layer "${layerName}" and all its mappings`);
  console.log(`${messages.layers.common.configSaved} ${configPath}`);
}

/**
 * Display success message for unmap operation
 */
export function displayUnmapSuccess(
  result: { layerName: string; includePath?: string | undefined; excludePath?: string | undefined },
  configPath: string
): void {
  if (result.excludePath) {
    if (result.includePath) {
      console.log(`✓ Removed exclude "${result.excludePath}" from layer "${result.layerName}" mapping "${result.includePath}"`);
    } else {
      console.log(`✓ Removed exclude "${result.excludePath}" from all "${result.layerName}" mappings`);
    }
  } else if (result.includePath) {
    console.log(`✓ Removed mapping for layer "${result.layerName}" with path "${result.includePath}"`);
  } else {
    console.log(`✓ Removed all mappings for layer "${result.layerName}"`);
  }
  console.log(`${messages.layers.common.configSaved} ${configPath}`);
}

/**
 * Display help for unknown subcommand
 */
export function displayUnknownSubcommand(subcommand: string | undefined): void {
  console.error(`${messages.layers.help.unknownSubcommand} ${subcommand || '(none)'}`);
  console.log(messages.layers.help.availableSubcommands);
  console.log(messages.layers.help.listUsage);
  console.log(messages.layers.help.addUsage);
  console.log(messages.layers.help.addCustomUsage);
  console.log(messages.layers.help.removeUsage);
  console.log(messages.layers.help.mapUsage);
  console.log(messages.layers.help.mapWithExcludeUsage);
  console.log(messages.layers.help.excludeOnlyUsage);
  console.log(messages.layers.help.unmapUsage);
  console.log(messages.layers.help.unmapExcludeUsage);
  console.log(messages.layers.help.unmapSpecificExcludeUsage);
}
