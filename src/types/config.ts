/**
 * Configuration types for archctl project config
 */

/**
 * Discriminated union for rule configurations
 * Each rule type has a 'kind' field that determines which concrete class to instantiate
 */

export interface ForbiddenLayerImportRuleConfig {
  kind: 'forbidden-layer-import';
  id: string;
  title: string;
  description: string;
  fromLayer: string;
  toLayer: string;
}

export interface AllowedLayerImportRuleConfig {
  kind: 'allowed-layer-import';
  id: string;
  title: string;
  description: string;
  fromLayer: string;
  allowedLayers: string[];
}

export interface FilePatternLayerRuleConfig {
  kind: 'file-pattern-layer';
  id: string;
  title: string;
  description: string;
  pattern: string;
  requiredLayer: string;
}

export interface MaxDependenciesRuleConfig {
  kind: 'max-dependencies';
  id: string;
  title: string;
  description: string;
  maxDependencies: number;
  layer?: string;
}

export interface NaturalLanguageRuleConfig {
  kind: 'natural-language';
  id: string;
  title: string;
  description: string;
  prompt: string;
  severity?: 'info' | 'warning' | 'error';
}

export interface CyclicDependencyRuleConfig {
  kind: 'cyclic-dependency';
  id: string;
  title: string;
  description: string;
}

export interface ExternalDependencyRuleConfig {
  kind: 'external-dependency';
  id: string;
  title: string;
  description: string;
  allowedPackages: string[];
  layer?: string;
}

export interface AllowedCapabilityRuleConfig {
  kind: 'allowed-capability';
  id: string;
  title: string;
  description: string;
  allowedCapabilities: string[];
  layer?: string;
}

export interface ForbiddenCapabilityRuleConfig {
  kind: 'forbidden-capability';
  id: string;
  title: string;
  description: string;
  forbiddenCapabilities: string[];
  layer?: string;
}

/**
 * Discriminated union of all rule config types
 */
export type RuleConfig =
  | ForbiddenLayerImportRuleConfig
  | AllowedLayerImportRuleConfig
  | FilePatternLayerRuleConfig
  | MaxDependenciesRuleConfig
  | CyclicDependencyRuleConfig
  | ExternalDependencyRuleConfig
  | AllowedCapabilityRuleConfig
  | ForbiddenCapabilityRuleConfig
  | NaturalLanguageRuleConfig;

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

  /**
   * Capability patterns for detecting code actions
   * Defines what imports/calls indicate specific capabilities
   */
  capabilities?: CapabilityPattern[];

  /**
   * Concrete rule configurations using discriminated union
   * These are instantiated into BaseRule instances at runtime
   */
  rules: RuleConfig[];
}
