/**
 * Baseline types for architecture debt tracking
 *
 * A baseline is a snapshot of known violations that allows teams to:
 * - Freeze the current state of violations
 * - Only fail CI on NEW violations (drift detection)
 * - Track metrics and trends over time
 */

import type { PositionRange } from './rules';

/**
 * A violation stored in the baseline
 * This is similar to RuleViolation but includes a fingerprint for comparison
 */
export interface BaselineViolation {
  /** Unique fingerprint for this violation (used for comparison) */
  fingerprint: string;

  /** Rule ID that was violated */
  ruleId: string;

  /** Severity of the violation */
  severity: 'info' | 'warning' | 'error';

  /** Human-readable message */
  message: string;

  /** File where the violation occurred (relative to project root) */
  file: string;

  /** Position range for the violation */
  range?: PositionRange;

  /** Optional suggestion for fixing */
  suggestion?: string;

  /** Timestamp when this violation was first added to baseline */
  firstSeen: string; // ISO 8601 timestamp

  /** Additional metadata from the original violation */
  metadata?: Record<string, unknown>;
}

/**
 * Metrics snapshot stored in the baseline
 * These metrics help track trends over time
 */
export interface BaselineMetrics {
  /** Total number of violations */
  totalViolations: number;

  /** Number of errors */
  errors: number;

  /** Number of warnings */
  warnings: number;

  /** Number of info-level violations */
  info: number;

  /** Number of unique files affected */
  filesAffected: number;

  /** Timestamp when metrics were calculated */
  timestamp: string; // ISO 8601 timestamp

  /** Average dependencies per file (coupling score) - higher = more coupled */
  couplingScore?: number;

  /** Average violations per affected file (violation density) - higher = more concentrated */
  violationDensity?: number;

  /** Overall architecture health score (0-100) - higher = healthier */
  healthScore?: number;
}

/**
 * Complete baseline structure stored in .archctl/baseline.json
 */
export interface Baseline {
  /** Version of the baseline format (for migration/compatibility) */
  version: string;

  /** When this baseline was created/updated */
  createdAt: string; // ISO 8601 timestamp

  /** When this baseline was last updated */
  updatedAt: string; // ISO 8601 timestamp

  /** All violations in the baseline */
  violations: BaselineViolation[];

  /** Metrics snapshot */
  metrics: BaselineMetrics;

  /** Optional: History of metrics over time (for trend tracking) */
  metricsHistory?: BaselineMetrics[];
}
