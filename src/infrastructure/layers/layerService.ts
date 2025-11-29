import * as path from 'path';
import type { ArchctlConfig, LayerConfig, LayerMapping } from '../../types';
import { toRelativePath, normalizePathPattern, isWithinDirectory } from '../../utils/path';

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
 */
export function processPathsForMapping(
  projectRoot: string,
  currentDir: string,
  paths: string[]
): string[] {
  return paths.map((p) => {
    const relativePath = toProjectRelativePath(projectRoot, currentDir, p);
    return normalizePathPattern(relativePath);
  });
}
