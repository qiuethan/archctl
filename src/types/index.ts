/**
 * Core types for archctl configuration and rules
 */

export interface ArchConfig {
  name: string;
  language: string;
  framework: string;
  testing: string;
  layers: LayerConfig[];
  rules: RuleConfig[];
}

export interface LayerConfig {
  name: string;
  path: string;
  description?: string;
}

export interface RuleConfig {
  id: string;
  type: 'dependency' | 'naming' | 'structure' | 'custom';
  severity: 'error' | 'warning' | 'info';
  description: string;
  // TODO: Add specific rule configuration fields as needed
  config?: Record<string, unknown>;
}

export interface ParsedArgs {
  [key: string]: string | boolean;
}

export interface CommandContext {
  args: ParsedArgs;
  cwd: string;
}
