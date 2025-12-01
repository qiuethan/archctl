/**
 * Core types for archctl configuration and rules
 */

// Re-export rule types from rules module
export type { RuleSeverity } from './rules';

// Re-export template types from templates module
export type { TemplateDefinition, TemplateLayer } from './templates';

// Re-export config types from config module
export type { LayerConfig, LayerMapping, ArchctlConfig } from './config';

// Re-export graph types from graph module
export type { DependencyKind, ProjectFileNode, DependencyEdge, ProjectGraph } from './graph';

// Re-export scanner types from scanner module
export type { FileInfo, ScanResult, ProjectScanner } from './scanner';

export interface ParsedArgs {
  _?: string[]; // Positional arguments
  [key: string]: string | boolean | string[] | undefined;
}

export interface CommandContext {
  args: ParsedArgs;
  cwd: string;
}
