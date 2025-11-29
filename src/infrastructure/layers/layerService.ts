import * as path from 'path';
import * as fs from 'fs';
import type { ArchctlConfig, LayerConfig, LayerMapping } from '../../types/config';
import { toRelativePath, isWithinDirectory, normalizePathPattern } from '../../utils/path';

/**
 * Layer service - handles all layer-related operations
 * This is the infrastructure layer that contains low-level logic
 */

/**
 * Get the project root directory from config path
 */
export function getProjectRoot(configPath: string): string {
  // Config is in .archctl/archctl.config.json, so go up two levels
  return path.dirname(path.dirname(configPath));
}

/**
 * Check if a layer exists in the config
 */
export function layerExists(config: ArchctlConfig, layerName: string): boolean {
  return config.layers.some(
    (layer) => layer.name.toLowerCase() === layerName.toLowerCase()
  );
}

/**
 * Find a layer by name (case-insensitive)
 */
export function findLayer(config: ArchctlConfig, layerName: string): LayerConfig | undefined {
  return config.layers.find(
    (layer) => layer.name.toLowerCase() === layerName.toLowerCase()
  );
}

/**
 * Add a layer to the config
 */
export function addLayer(config: ArchctlConfig, layer: LayerConfig): void {
  config.layers.push(layer);
}

/**
 * Add a layer mapping to the config
 */
export function addLayerMapping(config: ArchctlConfig, mapping: LayerMapping): void {
  if (!config.layerMappings) {
    config.layerMappings = [];
  }
  config.layerMappings.push(mapping);
}

/**
 * Remove a layer mapping from the config
 * Returns true if a mapping was removed, false otherwise
 */
export function removeLayerMapping(
  config: ArchctlConfig,
  layerName: string,
  includePath?: string
): boolean {
  if (!config.layerMappings || config.layerMappings.length === 0) {
    return false;
  }

  const initialLength = config.layerMappings.length;

  if (includePath) {
    // Normalize the input path (add /** if it's a directory pattern)
    const normalizedInput = normalizePathPattern(includePath);
    
    // Remove specific mapping by layer and include path
    // Match both the normalized version and the original
    config.layerMappings = config.layerMappings.filter(mapping => {
      if (mapping.layer !== layerName) return true;
      
      // Check if any include pattern matches (with or without /**)
      return !mapping.include.some(pattern => {
        const normalizedPattern = normalizePathPattern(pattern);
        return normalizedPattern === normalizedInput || 
               pattern === includePath ||
               normalizedPattern === includePath ||
               pattern === normalizedInput;
      });
    });
  } else {
    // Remove all mappings for the layer
    config.layerMappings = config.layerMappings.filter(
      mapping => mapping.layer !== layerName
    );
  }

  return config.layerMappings.length < initialLength;
}

/**
 * Remove exclude patterns from layer mappings
 * Returns true if any excludes were removed, false otherwise
 */
export function removeExcludeFromMapping(
  config: ArchctlConfig,
  layerName: string,
  excludePath: string,
  includePath?: string
): boolean {
  if (!config.layerMappings || config.layerMappings.length === 0) {
    return false;
  }

  // Normalize the exclude path for comparison
  const normalizedExclude = normalizePathPattern(excludePath);
  let removed = false;

  for (const mapping of config.layerMappings) {
    if (mapping.layer !== layerName) continue;
    
    // If includePath is specified, only remove from that specific mapping
    if (includePath) {
      const normalizedInclude = normalizePathPattern(includePath);
      const hasMatchingInclude = mapping.include.some(pattern => {
        const normalizedPattern = normalizePathPattern(pattern);
        return normalizedPattern === normalizedInclude || 
               pattern === includePath ||
               normalizedPattern === includePath ||
               pattern === normalizedInclude;
      });
      
      if (!hasMatchingInclude) continue;
    }
    
    // Remove the exclude pattern if it exists
    if (mapping.exclude && mapping.exclude.length > 0) {
      const initialLength = mapping.exclude.length;
      mapping.exclude = mapping.exclude.filter(pattern => {
        const normalizedPattern = normalizePathPattern(pattern);
        return !(normalizedPattern === normalizedExclude || 
                 pattern === excludePath ||
                 normalizedPattern === excludePath ||
                 pattern === normalizedExclude);
      });
      
      // Clean up empty exclude arrays
      if (mapping.exclude.length === 0) {
        delete mapping.exclude;
      }
      
      if (mapping.exclude === undefined || mapping.exclude.length < initialLength) {
        removed = true;
      }
    }
  }

  return removed;
}

/**
 * Remove a layer from the config
 * Also removes all associated mappings
 * Returns true if the layer was removed, false otherwise
 */
export function removeLayer(config: ArchctlConfig, layerName: string): boolean {
  const initialLength = config.layers.length;
  
  // Remove the layer
  config.layers = config.layers.filter(
    layer => layer.name.toLowerCase() !== layerName.toLowerCase()
  );
  
  // Remove all mappings for this layer
  if (config.layerMappings) {
    config.layerMappings = config.layerMappings.filter(
      mapping => mapping.layer !== layerName
    );
  }
  
  return config.layers.length < initialLength;
}

/**
 * Validate that current directory is within project
 */
export function validateWithinProject(projectRoot: string, currentDir: string): boolean {
  return isWithinDirectory(currentDir, projectRoot);
}

/**
 * Convert a path from current directory to project-root-relative
 */
export function toProjectRelativePath(
  projectRoot: string,
  currentDir: string,
  userPath: string
): string {
  return toRelativePath(userPath, projectRoot, currentDir);
}

// Note: normalizePathPattern is now imported from utils/path

/**
 * Process paths for layer mapping
 * Converts paths to project-relative and normalizes them
 * Validates that paths exist before processing
 */
export function processPathsForMapping(
  projectRoot: string,
  currentDir: string,
  paths: string[]
): string[] {
  return paths.map((p) => {
    // Resolve the absolute path to check if it exists
    const absolutePath = path.isAbsolute(p) 
      ? p 
      : path.resolve(currentDir, p);
    
    // Check if path exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Path does not exist: ${p}`);
    }
    
    const relativePath = toProjectRelativePath(projectRoot, currentDir, p);
    return normalizePathPattern(relativePath);
  });
}
