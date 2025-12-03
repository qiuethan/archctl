/**
 * Rule system types for rule enforcement
 */

import type { Capability } from './capabilities';
import type { ContextMapping } from './config';

/**
 * Rule severity levels
 */
export type RuleSeverity = 'info' | 'warning' | 'error';

/**
 * File information for rule checking
 */
export interface FileInfo {
  path: string;
  layer: string | null;
  language: string;
  imports: string[];
  dependencyCount: number;
  capabilities?: Capability[];
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

  /** Context mappings (vertical architecture) */
  contextMappings?: ContextMapping[];

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
