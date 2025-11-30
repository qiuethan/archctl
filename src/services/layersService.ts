import type { ArchctlConfig, LayerConfig, LayerMapping } from '../types';
import * as layerInfra from '../infrastructure/layers/layerService';
import { getLayerPreset, getAllLayerPresets } from '../infrastructure/layers/layerPresets';

/**
 * Application service for layer management
 * Contains business logic for layer operations
 */

export interface AddLayerInput {
  presetId?: string | undefined;
  name?: string | undefined;
  description?: string | undefined;
}

export interface AddLayerMappingInput {
  layerName: string;
  includePaths?: string[] | undefined;
  excludePaths?: string[] | undefined;
  priority?: number | undefined;
  projectRoot: string;
  currentDir: string;
}

export interface ParsedMappingArgs {
  layerName?: string | undefined;
  include?: string | string[] | undefined;
  exclude?: string | string[] | undefined;
  priority?: string | number | undefined;
}

/**
 * Add a new layer to the configuration
 * Validates input and creates the layer
 */
export function addLayer(config: ArchctlConfig, input: AddLayerInput): LayerConfig {
  let layerName: string;
  let layerDescription: string;

  // Check if using preset
  if (input.presetId) {
    const preset = getLayerPreset(input.presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${input.presetId}`);
    }
    layerName = preset.name;
    layerDescription = input.description || preset.description;
  } else if (input.name && input.description) {
    layerName = input.name;
    layerDescription = input.description;
  } else {
    throw new Error('Must provide either presetId or both name and description');
  }

  // Check for duplicate
  if (layerInfra.layerExists(config, layerName)) {
    throw new Error(`Layer already exists: ${layerName}`);
  }

  // Create the layer
  const newLayer: LayerConfig = {
    name: layerName,
    description: layerDescription,
  };

  // Add to config
  layerInfra.addLayer(config, newLayer);

  return newLayer;
}

/**
 * Add a layer mapping to the configuration
 * Processes paths and creates the mapping
 */
export function addLayerMapping(
  config: ArchctlConfig,
  input: AddLayerMappingInput
): LayerMapping {
  // Validate layer exists
  if (!layerInfra.layerExists(config, input.layerName)) {
    throw new Error(`Layer not found: ${input.layerName}`);
  }

  // Process exclude paths if provided
  let processedExcludes: string[] | undefined;
  if (input.excludePaths && input.excludePaths.length > 0) {
    processedExcludes = layerInfra.processPathsForMapping(
      input.projectRoot,
      input.currentDir,
      input.excludePaths
    );
  }

  // If no include paths provided, add excludes to all existing mappings for this layer
  if (!input.includePaths || input.includePaths.length === 0) {
    if (!processedExcludes || processedExcludes.length === 0) {
      throw new Error('Must provide either --include or --exclude');
    }

    // Find all mappings for this layer and add excludes
    let updated = false;
    if (config.layerMappings) {
      for (const existingMapping of config.layerMappings) {
        if (existingMapping.layer === input.layerName) {
          const currentExcludes = existingMapping.exclude || [];
          const mergedExcludes = [...new Set([...currentExcludes, ...processedExcludes])];
          existingMapping.exclude = mergedExcludes;
          updated = true;
        }
      }
    }

    if (!updated) {
      throw new Error(`No existing mappings found for layer "${input.layerName}". Use --include to create a new mapping.`);
    }

    // Return the first updated mapping
    return config.layerMappings!.find(m => m.layer === input.layerName)!;
  }

  // Process include paths
  const processedIncludes = layerInfra.processPathsForMapping(
    input.projectRoot,
    input.currentDir,
    input.includePaths
  );

  // Check for existing mapping for this layer
  if (config.layerMappings) {
    const existingMapping = config.layerMappings.find(m => m.layer === input.layerName);
    
    if (existingMapping) {
      // Merge new includes into existing mapping
      const mergedIncludes = [...new Set([...existingMapping.include, ...processedIncludes])];
      existingMapping.include = mergedIncludes;
      
      // Merge excludes if provided
      if (processedExcludes && processedExcludes.length > 0) {
        const currentExcludes = existingMapping.exclude || [];
        const mergedExcludes = [...new Set([...currentExcludes, ...processedExcludes])];
        existingMapping.exclude = mergedExcludes;
      }
      
      // Update priority if provided
      if (input.priority !== undefined && !isNaN(input.priority)) {
        existingMapping.priority = input.priority;
      }
      
      return existingMapping;
    }
  }

  // Create new layer mapping (no existing mapping for this layer)
  const mapping: LayerMapping = {
    layer: input.layerName,
    include: processedIncludes,
  };

  if (processedExcludes && processedExcludes.length > 0) {
    mapping.exclude = processedExcludes;
  }

  if (input.priority !== undefined && !isNaN(input.priority)) {
    mapping.priority = input.priority;
  }

  // Add to config
  layerInfra.addLayerMapping(config, mapping);

  return mapping;
}

export interface RemoveLayerMappingResult {
  layerName: string;
  includePath?: string | undefined;
  excludePath?: string | undefined;
  removed: boolean;
}

/**
 * Remove a layer mapping or exclude patterns
 */
export function removeLayerMapping(
  config: ArchctlConfig,
  layerName?: string,
  includePath?: string,
  excludePath?: string
): RemoveLayerMappingResult {
  // Validate required arguments
  if (!layerName) {
    throw new Error('Missing required argument: --layer');
  }

  // Check if layer exists
  if (!layerInfra.layerExists(config, layerName)) {
    throw new Error(`Layer not found: ${layerName}`);
  }

  // If exclude path is provided, remove it from matching mappings
  if (excludePath) {
    const removed = layerInfra.removeExcludeFromMapping(config, layerName, excludePath, includePath);
    if (!removed) {
      throw new Error(`No exclude pattern "${excludePath}" found for layer "${layerName}"`);
    }
    return { layerName, includePath, excludePath, removed };
  }

  // Otherwise remove the entire mapping
  const removed = layerInfra.removeLayerMapping(config, layerName, includePath);
  
  if (!removed) {
    if (includePath) {
      throw new Error(`No mapping found for layer "${layerName}" with path "${includePath}"`);
    } else {
      throw new Error(`No mappings found for layer "${layerName}"`);
    }
  }

  return { layerName, includePath, removed };
}

/**
 * Remove a layer and all its mappings
 */
export function removeLayer(config: ArchctlConfig, layerName: string): boolean {
  const removed = layerInfra.removeLayer(config, layerName);
  
  if (!removed) {
    throw new Error(`Layer not found: ${layerName}`);
  }

  return removed;
}

/**
 * Get all available layer presets
 */
export function getAvailablePresets() {
  return getAllLayerPresets();
}

/**
 * Check if a layer exists
 */
export function layerExists(config: ArchctlConfig, layerName: string): boolean {
  return layerInfra.layerExists(config, layerName);
}

/**
 * Find a layer by name
 */
export function findLayer(config: ArchctlConfig, layerName: string): LayerConfig | undefined {
  return layerInfra.findLayer(config, layerName);
}

/**
 * Get project root from config path
 */
export function getProjectRoot(configPath: string): string {
  return layerInfra.getProjectRoot(configPath);
}

/**
 * Validate that current directory is within project
 */
export function validateWithinProject(projectRoot: string, currentDir: string): boolean {
  return layerInfra.validateWithinProject(projectRoot, currentDir);
}

/**
 * Parse and validate layer mapping arguments from CLI
 * Throws errors for missing or invalid arguments
 */
export function parseMappingArguments(
  args: ParsedMappingArgs,
  projectRoot: string,
  currentDir: string
): AddLayerMappingInput {
  // Validate required arguments
  if (!args.layerName) {
    throw new Error('Missing required argument: --layer');
  }

  // Parse include paths (optional if exclude is provided)
  let includePaths: string[] | undefined;
  if (Array.isArray(args.include)) {
    includePaths = args.include;
  } else if (args.include) {
    includePaths = [args.include];
  } else if (!args.exclude) {
    // Only require include if exclude is not provided
    throw new Error('Missing required argument: --include');
  }

  // Parse exclude paths
  let excludePaths: string[] | undefined;
  if (args.exclude) {
    excludePaths = Array.isArray(args.exclude) ? args.exclude : [args.exclude];
  }

  // Parse priority
  let priority: number | undefined;
  if (args.priority !== undefined) {
    const parsed = typeof args.priority === 'string' 
      ? parseInt(args.priority, 10) 
      : args.priority;
    if (!isNaN(parsed)) {
      priority = parsed;
    }
  }

  return {
    layerName: args.layerName,
    includePaths,
    excludePaths,
    priority,
    projectRoot,
    currentDir,
  };
}
