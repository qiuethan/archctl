/**
 * Rule system types for the global rule library and project-specific instances
 */

/**
 * Rule kinds determine which enforcement engine processes the rule
 */
export type RuleKind =
  | 'dependency'
  | 'location'
  | 'tests'
  | 'naming'
  | 'complexity'
  | 'semantic';

/**
 * Rule severity levels
 */
export type RuleSeverity = 'info' | 'warning' | 'error';

/**
 * Base rule definition in the global library
 * These are reusable across templates and projects
 */
export interface RuleDefinition {
  /** Global, stable ID used across templates (like ESLint rule IDs) */
  id: string;

  /** Human-friendly name for UIs/CLI */
  label: string;

  /** What type of rule it is (drives which engine runs it) */
  kind: RuleKind;

  /** Default severity if template/project doesn't override */
  defaultSeverity: RuleSeverity;

  /** Default human description */
  description: string;

  /** Default engine config (kind-specific, but stored as generic JSON here) */
  defaultConfig: Record<string, unknown>;

  /** Tags for grouping/filtering in UIs */
  tags?: string[];

  /**
   * True if this rule is expected to rely on AI in enforcement/explanation.
   * The static engine can still do pre-checks, but full enforcement might need AI.
   */
  aiAssisted?: boolean;
}

/**
 * Project-level instantiated rule (lives in archctl.config.json)
 * Represents a rule that has been configured for a specific project
 */
export interface ProjectRule {
  /** Rule ID as stored in the project config (usually same as definition ID) */
  id: string;

  /** Rule kind, copied from the definition */
  kind: RuleKind;

  /** Whether this rule is active in this project */
  enabled: boolean;

  /** Final severity after applying template overrides */
  severity: RuleSeverity;

  /** Human description (can be edited by the project) */
  description: string;

  /** Final config after applying overrides */
  config: Record<string, unknown>;

  /** Optional provenance metadata */
  sourceRuleId?: string; // original global rule id
  sourceTemplateId?: string; // which template added it
}
