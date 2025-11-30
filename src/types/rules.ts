/**
 * Rule system types for the global rule library and project-specific instances
 */

/**
 * Rule kinds determine which enforcement engine processes the rule
 */
export type RuleKind = 'dependency' | 'location' | 'tests' | 'naming' | 'complexity' | 'semantic';

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

/**
 * File information for rule checking
 */
export interface FileInfo {
  path: string;
  layer: string | null;
  language: string;
  imports: string[];
  dependencyCount: number;
}

/**
 * Context provided to rules for checking
 */
export interface RuleContext {
  /** All files in the project */
  files: Map<string, FileInfo>;

  /** Dependency graph edges */
  dependencies: Array<{ from: string; to: string }>;

  /** Layer configuration */
  layers: Array<{ name: string; description: string }>;

  /** Layer mappings */
  layerMappings: Array<{
    layer: string;
    include: string[];
    exclude?: string[];
  }>;

  /** Project root directory */
  projectRoot: string;
}

/**
 * Position range in a file
 */
export interface PositionRange {
  /** Starting line (1-indexed) */
  startLine: number;

  /** Starting column (0-indexed) */
  startCol: number;

  /** Ending line (1-indexed) */
  endLine: number;

  /** Ending column (0-indexed) */
  endCol: number;
}

/**
 * A rule violation found during checking
 */
export interface RuleViolation {
  /** Rule ID that was violated */
  ruleId: string;

  /** Severity of the violation */
  severity: RuleSeverity;

  /** Human-readable message */
  message: string;

  /** File where the violation occurred */
  file: string;

  /** Optional line number (deprecated, use range instead) */
  line?: number;

  /** Position range for the violation */
  range?: PositionRange;

  /** Optional suggestion for fixing */
  suggestion?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Abstract base class for all rules
 * Concrete rules and natural language rules extend from this
 */
export abstract class BaseRule {
  readonly id: string;
  readonly title: string;
  readonly description: string;

  constructor(id: string, title: string, description: string) {
    this.id = id;
    this.title = title;
    this.description = description;
  }

  /**
   * Check the rule against the provided context
   * Returns an array of violations (empty if no violations)
   */
  abstract check(ctx: RuleContext): RuleViolation[];

  /**
   * Get a human-readable summary of this rule
   */
  getSummary(): string {
    return `[${this.id}] ${this.title}: ${this.description}`;
  }
}
