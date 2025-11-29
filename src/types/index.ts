/**
 * Core types for archctl configuration and rules
 */

// Re-export rule types from rules module
export type { RuleKind, RuleSeverity, RuleDefinition, ProjectRule } from './rules';
import type { ProjectRule } from './rules';

// Re-export template types from templates module
export type { TemplateDefinition, TemplateLayer, TemplateRuleRef } from './templates';

export interface ArchConfig {
  name: string;
  language: string;
  framework: string;
  testing: string;
  layers: LayerConfig[];
  rules: ProjectRule[];
}

export interface LayerConfig {
  name: string;
  path: string;
  description?: string;
}

export interface ParsedArgs {
  [key: string]: string | boolean;
}

export interface CommandContext {
  args: ParsedArgs;
  cwd: string;
}
