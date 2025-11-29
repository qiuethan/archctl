/**
 * Core types for archctl configuration and rules
 */

// Re-export rule types from rules module
export type { RuleKind, RuleSeverity, RuleDefinition, ProjectRule } from './rules';

// Re-export template types from templates module
export type { TemplateDefinition, TemplateLayer, TemplateRuleRef } from './templates';

// Re-export config types from config module
export type { LayerConfig, LayerMapping, ArchctlConfig } from './config';

export interface ParsedArgs {
  [key: string]: string | boolean;
}

export interface CommandContext {
  args: ParsedArgs;
  cwd: string;
}
