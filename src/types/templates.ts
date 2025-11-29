/**
 * Template system types for reusable architecture configurations
 */

import type { RuleSeverity } from './rules';

/**
 * Reference to a global rule with optional overrides for a template
 */
export interface TemplateRuleRef {
  /** ID of a global rule in the rule library */
  ruleId: string;

  /** Turn this rule on/off for this template (default: true) */
  enabled?: boolean;

  /** Override severity for this architecture */
  severityOverride?: RuleSeverity;

  /** Override config fields from the RuleDefinition.defaultConfig */
  configOverride?: Record<string, unknown>;
}

/**
 * Layer definition within a template (conceptual only, no file paths)
 */
export interface TemplateLayer {
  name: string;
  description: string;
}

/**
 * A template definition for a specific architecture style
 */
export interface TemplateDefinition {
  id: string;
  label: string;
  description: string;

  layers: TemplateLayer[];

  /** Rules selected from the global rule library */
  rules: TemplateRuleRef[];
}
