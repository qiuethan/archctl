/**
 * Configuration types for archctl project config
 */

import type { ProjectRule } from './rules';

/**
 * Conceptual layer definition (no file paths)
 */
export interface LayerConfig {
  name: string;
  description: string;
}

/**
 * Mapping from file paths to layers using glob patterns
 */
export interface LayerMapping {
  /** Name of the layer (must match an existing LayerConfig.name) */
  layer: string;

  /** Glob patterns that should map to this layer */
  include: string[];

  /** Optional glob patterns to exclude */
  exclude?: string[];

  /**
   * Optional priority. Higher values win when multiple mappings match.
   * If not provided, default to 0.
   */
  priority?: number;
}

/**
 * Shape of the archctl project config file (archctl.config.json)
 */
export interface ArchctlConfig {
  name: string;
  language?: string;
  framework?: string;
  testing?: string;

  /** Conceptual layers (name + description only) */
  layers: LayerConfig[];

  /** Optional mapping rules from paths → layers */
  layerMappings?: LayerMapping[];

  /** Project-specific rule instances */
  rules: ProjectRule[];
}
