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
  
  /**
   * Entry point file for the application (relative to project root)
   * Example: "src/index.ts", "src/main.ts", "app.js"
   * Used for code tracing and dependency analysis
   */
  entryPoint?: string;
  
  /**
   * Directories to exclude from dependency analysis
   * Note: Automatically reads from .gitignore if present
   * Additional excludes can be specified here
   * Example: ["tests", "scripts", "docs", "examples"]
   */
  exclude?: string[];
  
  layers: LayerConfig[];
  layerMappings?: LayerMapping[];
  rules: ProjectRule[];
}
