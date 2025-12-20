import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { RuleViolation } from '../../types/rules';
import type { Baseline, BaselineViolation, BaselineMetrics } from '../../types/baseline';

export class BaselineService {
  private baselinePath: string;
  private baseline: Baseline | null = null;
  private readonly BASELINE_VERSION = '1.0.0';

  /**
   * Constructor - Initialize the service with project root
   * 
   * @param projectRoot - Absolute path to project root directory
   */
  constructor(projectRoot: string) {
    this.baselinePath = path.join(projectRoot, '.archctl', 'baseline.json');
    this.baseline = this.loadBaseline();
  }

  /**
   * Load baseline from disk
   * 
   * @returns Baseline object or null if file doesn't exist or is invalid
   */
  private loadBaseline(): Baseline | null {
    try {
      if (!fs.existsSync(this.baselinePath)) {
        return null;
      }

      const content = fs.readFileSync(this.baselinePath, 'utf-8');
      const data = JSON.parse(content) as Baseline;

      if (data.version === this.BASELINE_VERSION) {
        return data;
      }

      console.warn(
        `Baseline version mismatch. Expected ${this.BASELINE_VERSION}, got ${data.version}. ` +
        'Baseline will be recreated.'
      );
      return null;
    } catch (error) {
      console.warn('Failed to load baseline:', error);
      return null;
    }
  }

  /**
   * Get the current baseline (loads from disk if not already loaded)
   * 
   * @returns Baseline object or null if no baseline exists
   */
  public getBaseline(): Baseline | null {
    return this.baseline;
  }

  /**
   * Check if a baseline exists
   * 
   * @returns true if baseline file exists and is valid
   */
  public hasBaseline(): boolean {
    return this.baseline !== null;
  }

  /**
   * Generate a fingerprint for a violation
   * 
   * @param violation - The rule violation to fingerprint
   * @returns Unique hash string identifying this violation
   */
  public generateViolationFingerprint(violation: RuleViolation): string {
    const positionKey = violation.range
      ? `${violation.range.startLine}:${violation.range.startCol}:${violation.range.endLine}:${violation.range.endCol}`
      : violation.line?.toString() || '0';

    const key = `${violation.ruleId}:${violation.file}:${positionKey}:${this.hashMessage(violation.message)}`;

    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * Hash a message string (for fingerprint fallback)
   * 
   * @param message - Violation message
   * @returns Hash of the message
   */
  private hashMessage(message: string): string {
    const truncated = message.substring(0, 100);
    return crypto.createHash('md5').update(truncated).digest('hex').substring(0, 8);
  }

  /**
   * Convert a RuleViolation to a BaselineViolation
   * 
   * @param violation - Current rule violation
   * @param firstSeen - When this violation was first seen (ISO timestamp)
   * @returns BaselineViolation with fingerprint
   */
  public violationToBaseline(violation: RuleViolation, firstSeen: string): BaselineViolation {
    return {
      fingerprint: this.generateViolationFingerprint(violation),
      ruleId: violation.ruleId,
      severity: violation.severity,
      message: violation.message,
      file: violation.file,
      ...(violation.range !== undefined && { range: violation.range }),
      ...(violation.suggestion !== undefined && { suggestion: violation.suggestion }),
      firstSeen,
      ...(violation.metadata !== undefined && { metadata: violation.metadata }),
    };
  }

  /**
   * Calculate metrics from violations
   * 
   * @param violations - Array of violations to calculate metrics for
   * @returns BaselineMetrics object
   */
  public calculateMetrics(violations: BaselineViolation[]): BaselineMetrics {
    const errors = violations.filter((v) => v.severity === 'error').length;
    const warnings = violations.filter((v) => v.severity === 'warning').length;
    const info = violations.filter((v) => v.severity === 'info').length;

    const uniqueFiles = new Set(violations.map((v) => v.file));

    return {
      totalViolations: violations.length,
      errors,
      warnings,
      info,
      filesAffected: uniqueFiles.size,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a new baseline from current violations
   * 
   * @param violations - Current rule violations to baseline
   * @returns Baseline object
   */
  public createBaseline(violations: RuleViolation[]): Baseline {
    const now = new Date().toISOString();

    const baselineViolations: BaselineViolation[] = violations.map((v) =>
      this.violationToBaseline(v, now)
    );

    const metrics = this.calculateMetrics(baselineViolations);

    this.baseline = {
      version: this.BASELINE_VERSION,
      createdAt: now,
      updatedAt: now,
      violations: baselineViolations,
      metrics,
    };

    return this.baseline;
  }

  /**
   * Update existing baseline with new violations
   * 
   * @param violations - Current rule violations
   * @param maxHistorySize - Maximum number of metrics snapshots to keep (default: 50)
   */
  public updateBaseline(violations: RuleViolation[], maxHistorySize: number = 50): void {
    const now = new Date().toISOString();
    const existingBaseline = this.baseline;

    if (!existingBaseline) {
      this.baseline = this.createBaseline(violations);
      return;
    }

    const existingMap = new Map<string, BaselineViolation>();
    for (const existing of existingBaseline.violations) {
      existingMap.set(existing.fingerprint, existing);
    }

    const updatedViolations: BaselineViolation[] = violations.map((v) => {
      const fingerprint = this.generateViolationFingerprint(v);
      const existing = existingMap.get(fingerprint);

      if (existing) {
        return existing;
      } else {
        return this.violationToBaseline(v, now);
      }
    });

    // Store current metrics in history before updating
    const metricsHistory = existingBaseline.metricsHistory || [];
    metricsHistory.push(existingBaseline.metrics);

    // Keep only last N snapshots to prevent file bloat
    const trimmedHistory = metricsHistory.slice(-maxHistorySize);

    const metrics = this.calculateMetrics(updatedViolations);

    this.baseline = {
      version: this.BASELINE_VERSION,
      createdAt: existingBaseline.createdAt,
      updatedAt: now,
      violations: updatedViolations,
      metrics,
      metricsHistory: trimmedHistory,
    };
  }

  /**
   * Save baseline to disk
   */
  public save(): void {
    if (!this.baseline) {
      return;
    }

    try {
      const dir = path.dirname(this.baselinePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(
        this.baselinePath,
        JSON.stringify(this.baseline, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.warn('Failed to save baseline:', error);
      throw error;
    }
  }

  /**
   * Compare current violations against baseline
   * 
   * @param currentViolations - Current rule violations from lint check
   * @returns Object containing new, resolved, and unchanged violations
   */
  public compareViolations(currentViolations: RuleViolation[]): {
    new: RuleViolation[];
    resolved: BaselineViolation[];
    unchanged: RuleViolation[];
  } {
    if (!this.baseline) {
      return {
        new: currentViolations,
        resolved: [],
        unchanged: [],
      };
    }

    const baselineMap = new Map<string, BaselineViolation>();
    for (const baselineViolation of this.baseline.violations) {
      baselineMap.set(baselineViolation.fingerprint, baselineViolation);
    }

    const currentFingerprints = new Set<string>();
    const newViolations: RuleViolation[] = [];
    const unchangedViolations: RuleViolation[] = [];

    for (const violation of currentViolations) {
      const fingerprint = this.generateViolationFingerprint(violation);
      currentFingerprints.add(fingerprint);

      if (baselineMap.has(fingerprint)) {
        unchangedViolations.push(violation);
      } else {
        newViolations.push(violation);
      }
    }

    const resolvedViolations: BaselineViolation[] = [];
    for (const baselineViolation of this.baseline.violations) {
      if (!currentFingerprints.has(baselineViolation.fingerprint)) {
        resolvedViolations.push(baselineViolation);
      }
    }

    return {
      new: newViolations,
      resolved: resolvedViolations,
      unchanged: unchangedViolations,
    };
  }

  /**
   * Clear the baseline (delete the file)
   */
  public clear(): void {
    try {
      if (fs.existsSync(this.baselinePath)) {
        fs.unlinkSync(this.baselinePath);
      }
      this.baseline = null;
    } catch (error) {
      console.warn('Failed to clear baseline:', error);
    }
  }
}

