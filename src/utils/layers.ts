/**
 * Layer resolution utilities
 *
 * Provides helpers to resolve which layer a file belongs to based on
 * glob pattern mappings defined in the project config.
 */

import { minimatch } from 'minimatch';
import type { LayerConfig, LayerMapping } from '../types/config';

/**
 * Resolve which layer a file belongs to based on layer mappings
 *
 * @param filePath - The file path to check (absolute or relative)
 * @param layers - Array of layer definitions from config
 * @param mappings - Array of layer mappings with glob patterns
 * @returns The layer name if a mapping matches, or null if no match
 *
 * @example
 * ```ts
 * const layer = resolveLayerForFile(
 *   'src/domain/user.ts',
 *   config.layers,
 *   config.layerMappings
 * );
 * // Returns: 'domain'
 * ```
 */
export function resolveLayerForFile(
  filePath: string,
  layers: LayerConfig[],
  mappings: LayerMapping[] = [],
): string | null {
  // Normalize path separators to forward slashes for consistent matching
  const normalized = filePath.replace(/\\/g, '/');

  // Sort mappings by priority (highest first)
  // If no priority is specified, default to 0
  const sorted = [...mappings].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
  );

  // Check each mapping in priority order
  for (const mapping of sorted) {
    // Check if file matches any include pattern
    const included = mapping.include.some((pattern) =>
      minimatch(normalized, pattern, { dot: true }),
    );

    if (!included) {
      continue;
    }

    // Check if file matches any exclude pattern
    const excluded = mapping.exclude?.some((pattern) =>
      minimatch(normalized, pattern, { dot: true }),
    );

    if (excluded) {
      continue;
    }

    // Validate that the layer exists in the config
    const layerExists = layers.some((layer) => layer.name === mapping.layer);
    if (!layerExists) {
      console.warn(
        `Warning: Layer mapping references non-existent layer "${mapping.layer}"`,
      );
      continue;
    }

    return mapping.layer;
  }

  // No mapping matched
  return null;
}

/**
 * Get all files that belong to a specific layer
 *
 * @param layer - The layer name to filter by
 * @param files - Array of file paths to check
 * @param layers - Array of layer definitions from config
 * @param mappings - Array of layer mappings with glob patterns
 * @returns Array of file paths that belong to the specified layer
 */
export function getFilesForLayer(
  layer: string,
  files: string[],
  layers: LayerConfig[],
  mappings: LayerMapping[] = [],
): string[] {
  return files.filter((file) => {
    const resolvedLayer = resolveLayerForFile(file, layers, mappings);
    return resolvedLayer === layer;
  });
}

/**
 * Group files by their resolved layers
 *
 * @param files - Array of file paths to group
 * @param layers - Array of layer definitions from config
 * @param mappings - Array of layer mappings with glob patterns
 * @returns Map of layer name to array of file paths
 */
export function groupFilesByLayer(
  files: string[],
  layers: LayerConfig[],
  mappings: LayerMapping[] = [],
): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  // Initialize with empty arrays for all known layers
  layers.forEach((layer) => {
    grouped.set(layer.name, []);
  });

  // Add special key for unmapped files
  grouped.set('__unmapped__', []);

  // Group files
  files.forEach((file) => {
    const layer = resolveLayerForFile(file, layers, mappings);
    if (layer) {
      grouped.get(layer)?.push(file);
    } else {
      grouped.get('__unmapped__')?.push(file);
    }
  });

  return grouped;
}
