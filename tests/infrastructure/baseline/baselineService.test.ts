import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { BaselineService, type GraphStats } from '../../../src/infrastructure/baseline/baselineService';
import type { RuleViolation } from '../../../src/types/rules';
import type { Baseline } from '../../../src/types/baseline';

describe('BaselineService', () => {
  let tempDir: string;
  let baselineService: BaselineService;

  beforeEach(() => {
    tempDir = path.join(process.cwd(), '.test-baseline-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });
    baselineService = new BaselineService(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with project root', () => {
      expect(baselineService).toBeDefined();
      expect(baselineService.hasBaseline()).toBe(false);
      expect(baselineService.getBaseline()).toBeNull();
    });

    it('should create .archctl directory path', () => {
      const expectedPath = path.join(tempDir, '.archctl', 'baseline.json');
      expect(fs.existsSync(path.dirname(expectedPath))).toBe(false);
    });
  });

  describe('hasBaseline', () => {
    it('should return false when no baseline exists', () => {
      expect(baselineService.hasBaseline()).toBe(false);
    });

    it('should return true when baseline exists', () => {
      const violations: RuleViolation[] = [
        {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
          range: { startLine: 1, startCol: 0, endLine: 1, endCol: 10 },
        },
      ];

      baselineService.createBaseline(violations);
      baselineService.save();

      const newService = new BaselineService(tempDir);
      expect(newService.hasBaseline()).toBe(true);
    });
  });

  describe('generateViolationFingerprint', () => {
    it('should generate consistent fingerprints for same violation', () => {
      const violation: RuleViolation = {
        ruleId: 'test-rule',
        severity: 'error',
        message: 'Test violation',
        file: 'src/test.ts',
        range: { startLine: 10, startCol: 5, endLine: 10, endCol: 15 },
      };

      const fp1 = baselineService.generateViolationFingerprint(violation);
      const fp2 = baselineService.generateViolationFingerprint(violation);

      expect(fp1).toBe(fp2);
      expect(fp1).toHaveLength(32); // MD5 hash length
    });

    it('should generate different fingerprints for different violations', () => {
      const violation1: RuleViolation = {
        ruleId: 'test-rule',
        severity: 'error',
        message: 'Test violation',
        file: 'src/test.ts',
        range: { startLine: 10, startCol: 5, endLine: 10, endCol: 15 },
      };

      const violation2: RuleViolation = {
        ruleId: 'test-rule',
        severity: 'error',
        message: 'Test violation',
        file: 'src/test2.ts', // Different file
        range: { startLine: 10, startCol: 5, endLine: 10, endCol: 15 },
      };

      const fp1 = baselineService.generateViolationFingerprint(violation1);
      const fp2 = baselineService.generateViolationFingerprint(violation2);

      expect(fp1).not.toBe(fp2);
    });

    it('should handle violations without range using line number', () => {
      const violation: RuleViolation = {
        ruleId: 'test-rule',
        severity: 'error',
        message: 'Test violation',
        file: 'src/test.ts',
        line: 42,
      };

      const fp = baselineService.generateViolationFingerprint(violation);
      expect(fp).toBeDefined();
      expect(fp).toHaveLength(32);
    });

    it('should handle violations without range or line', () => {
      const violation: RuleViolation = {
        ruleId: 'test-rule',
        severity: 'error',
        message: 'Test violation',
        file: 'src/test.ts',
      };

      const fp = baselineService.generateViolationFingerprint(violation);
      expect(fp).toBeDefined();
      expect(fp).toHaveLength(32);
    });
  });

  describe('violationToBaseline', () => {
    it('should convert RuleViolation to BaselineViolation', () => {
      const violation: RuleViolation = {
        ruleId: 'test-rule',
        severity: 'error',
        message: 'Test violation',
        file: 'src/test.ts',
        range: { startLine: 1, startCol: 0, endLine: 1, endCol: 10 },
        suggestion: 'Fix this',
      };

      const firstSeen = '2025-01-15T10:00:00Z';
      const baselineViolation = baselineService.violationToBaseline(violation, firstSeen);

      expect(baselineViolation.ruleId).toBe('test-rule');
      expect(baselineViolation.severity).toBe('error');
      expect(baselineViolation.message).toBe('Test violation');
      expect(baselineViolation.file).toBe('src/test.ts');
      expect(baselineViolation.range).toEqual({
        startLine: 1,
        startCol: 0,
        endLine: 1,
        endCol: 10,
      });
      expect(baselineViolation.suggestion).toBe('Fix this');
      expect(baselineViolation.firstSeen).toBe(firstSeen);
      expect(baselineViolation.fingerprint).toBeDefined();
    });

    it('should handle optional fields correctly', () => {
      const violation: RuleViolation = {
        ruleId: 'test-rule',
        severity: 'warning',
        message: 'Test violation',
        file: 'src/test.ts',
      };

      const baselineViolation = baselineService.violationToBaseline(
        violation,
        '2025-01-15T10:00:00Z'
      );

      expect(baselineViolation.range).toBeUndefined();
      expect(baselineViolation.suggestion).toBeUndefined();
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate metrics correctly', () => {
      const violations = [
        {
          fingerprint: 'fp1',
          ruleId: 'rule1',
          severity: 'error' as const,
          message: 'Error 1',
          file: 'src/file1.ts',
          firstSeen: '2025-01-15T10:00:00Z',
        },
        {
          fingerprint: 'fp2',
          ruleId: 'rule2',
          severity: 'error' as const,
          message: 'Error 2',
          file: 'src/file1.ts',
          firstSeen: '2025-01-15T10:00:00Z',
        },
        {
          fingerprint: 'fp3',
          ruleId: 'rule3',
          severity: 'warning' as const,
          message: 'Warning 1',
          file: 'src/file2.ts',
          firstSeen: '2025-01-15T10:00:00Z',
        },
        {
          fingerprint: 'fp4',
          ruleId: 'rule4',
          severity: 'info' as const,
          message: 'Info 1',
          file: 'src/file3.ts',
          firstSeen: '2025-01-15T10:00:00Z',
        },
      ];

      const metrics = baselineService.calculateMetrics(violations);

      expect(metrics.totalViolations).toBe(4);
      expect(metrics.errors).toBe(2);
      expect(metrics.warnings).toBe(1);
      expect(metrics.info).toBe(1);
      expect(metrics.filesAffected).toBe(3); // file1, file2, file3
      expect(metrics.timestamp).toBeDefined();
    });

    it('should handle empty violations array', () => {
      const metrics = baselineService.calculateMetrics([]);

      expect(metrics.totalViolations).toBe(0);
      expect(metrics.errors).toBe(0);
      expect(metrics.warnings).toBe(0);
      expect(metrics.info).toBe(0);
      expect(metrics.filesAffected).toBe(0);
    });

    it('should calculate violationDensity when no graphStats provided', () => {
      // INPUT: 10 violations across 5 files, no graphStats
      const violations = Array.from({ length: 10 }, (_, i) => ({
        fingerprint: `fp${i}`,
        ruleId: 'rule1',
        severity: 'error' as const,
        message: `Error ${i}`,
        file: `src/file${Math.floor(i / 2)}.ts`, // 5 unique files (0,0,1,1,2,2,3,3,4,4)
        firstSeen: '2025-01-15T10:00:00Z',
      }));

      // EXECUTE
      const metrics = baselineService.calculateMetrics(violations);

      // EXPECTED OUTPUT:
      // - violationDensity = 10 violations / 5 files = 2.0
      // - couplingScore and healthScore should be undefined
      expect(metrics.violationDensity).toBe(2.0);
      expect(metrics.couplingScore).toBeUndefined();
      expect(metrics.healthScore).toBeUndefined();
      expect(metrics.totalViolations).toBe(10);
      expect(metrics.filesAffected).toBe(5);
    });

    it('should calculate couplingScore when graphStats provided', () => {
      // INPUT: Violations + graphStats with averageDependenciesPerFile = 3.5
      const violations = [
        {
          fingerprint: 'fp1',
          ruleId: 'rule1',
          severity: 'error' as const,
          message: 'Error 1',
          file: 'src/file1.ts',
          firstSeen: '2025-01-15T10:00:00Z',
        },
      ];

      const graphStats: GraphStats = {
        totalFiles: 100,
        totalDependencies: 350,
        averageDependenciesPerFile: 3.5,
        unmappedFiles: 5,
      };

      // EXECUTE
      const metrics = baselineService.calculateMetrics(violations, graphStats);

      // EXPECTED OUTPUT:
      // - couplingScore = 3.5 (from graphStats.averageDependenciesPerFile)
      expect(metrics.couplingScore).toBe(3.5);
      expect(metrics.violationDensity).toBe(1.0); // 1 violation / 1 file
    });

    it('should calculate healthScore when graphStats provided', () => {
      // INPUT: 5 errors, 10 warnings, 5 info, moderate coupling, some unmapped files
      const violations = [
        ...Array.from({ length: 5 }, (_, i) => ({
          fingerprint: `error${i}`,
          ruleId: 'rule1',
          severity: 'error' as const,
          message: `Error ${i}`,
          file: `src/file${i}.ts`,
          firstSeen: '2025-01-15T10:00:00Z',
        })),
        ...Array.from({ length: 10 }, (_, i) => ({
          fingerprint: `warning${i}`,
          ruleId: 'rule2',
          severity: 'warning' as const,
          message: `Warning ${i}`,
          file: `src/file${i + 5}.ts`,
          firstSeen: '2025-01-15T10:00:00Z',
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          fingerprint: `info${i}`,
          ruleId: 'rule3',
          severity: 'info' as const,
          message: `Info ${i}`,
          file: `src/file${i + 15}.ts`,
          firstSeen: '2025-01-15T10:00:00Z',
        })),
      ];

      const graphStats: GraphStats = {
        totalFiles: 100,
        totalDependencies: 800, // 8 avg deps per file
        averageDependenciesPerFile: 8.0,
        unmappedFiles: 10, // 10% unmapped
      };

      // EXECUTE
      const metrics = baselineService.calculateMetrics(violations, graphStats);

      // EXPECTED OUTPUT:
      // Health score calculation:
      // - Start: 100
      // - Errors: 5 * 5 = -25
      // - Warnings: 10 * 2 = -20
      // - Info: 5 * 0.5 = -2.5
      // - Coupling: 8 <= 10, so no penalty
      // - Unmapped: 10/100 = 0.1 * 20 = -2
      // - Total: 100 - 25 - 20 - 2.5 - 2 = 50.5 → rounded to 51
      expect(metrics.healthScore).toBe(51);
      expect(metrics.couplingScore).toBe(8.0);
      expect(metrics.errors).toBe(5);
      expect(metrics.warnings).toBe(10);
      expect(metrics.info).toBe(5);
    });

    it('should not include additional metrics when graphStats not provided', () => {
      // INPUT: Violations without graphStats
      const violations = [
        {
          fingerprint: 'fp1',
          ruleId: 'rule1',
          severity: 'error' as const,
          message: 'Error 1',
          file: 'src/file1.ts',
          firstSeen: '2025-01-15T10:00:00Z',
        },
      ];

      // EXECUTE
      const metrics = baselineService.calculateMetrics(violations);

      // EXPECTED OUTPUT:
      // - violationDensity should be present (always calculated)
      // - couplingScore and healthScore should be undefined
      expect(metrics.violationDensity).toBeDefined();
      expect(metrics.violationDensity).toBe(1.0);
      expect(metrics.couplingScore).toBeUndefined();
      expect(metrics.healthScore).toBeUndefined();
    });

    it('should calculate healthScore correctly with high coupling penalty', () => {
      // INPUT: Low violations but high coupling (avgDeps = 15)
      const violations = [
        {
          fingerprint: 'fp1',
          ruleId: 'rule1',
          severity: 'error' as const,
          message: 'Error 1',
          file: 'src/file1.ts',
          firstSeen: '2025-01-15T10:00:00Z',
        },
      ];

      const graphStats: GraphStats = {
        totalFiles: 100,
        totalDependencies: 1500, // 15 avg deps per file
        averageDependenciesPerFile: 15.0,
        unmappedFiles: 0,
      };

      // EXECUTE
      const metrics = baselineService.calculateMetrics(violations, graphStats);

      // EXPECTED OUTPUT:
      // Health score:
      // - Start: 100
      // - Errors: 1 * 5 = -5
      // - Coupling: (15 - 10) * 2 = -10
      // - Total: 100 - 5 - 10 = 85
      expect(metrics.healthScore).toBe(85);
      expect(metrics.couplingScore).toBe(15.0);
    });

    it('should clamp healthScore to 0-100 range', () => {
      // INPUT: Very high violations and coupling
      const violations = Array.from({ length: 50 }, (_, i) => ({
        fingerprint: `error${i}`,
        ruleId: 'rule1',
        severity: 'error' as const,
        message: `Error ${i}`,
        file: `src/file${i}.ts`,
        firstSeen: '2025-01-15T10:00:00Z',
      }));

      const graphStats: GraphStats = {
        totalFiles: 100,
        totalDependencies: 3000, // 30 avg deps per file
        averageDependenciesPerFile: 30.0,
        unmappedFiles: 50, // 50% unmapped
      };

      // EXECUTE
      const metrics = baselineService.calculateMetrics(violations, graphStats);

      // EXPECTED OUTPUT:
      // Health score calculation would be negative, but should be clamped to 0
      // - Start: 100
      // - Errors: 50 * 5 = -250
      // - Coupling: (30 - 10) * 2 = -40
      // - Unmapped: 0.5 * 20 = -10
      // - Total: 100 - 250 - 40 - 10 = -200 → clamped to 0
      expect(metrics.healthScore).toBe(0);
      expect(metrics.healthScore).toBeGreaterThanOrEqual(0);
      expect(metrics.healthScore).toBeLessThanOrEqual(100);
    });

    it('should handle violationDensity when filesAffected is 0', () => {
      // INPUT: Empty violations array
      const violations: any[] = [];

      // EXECUTE
      const metrics = baselineService.calculateMetrics(violations);

      // EXPECTED OUTPUT:
      // - violationDensity should be 0 (not NaN or Infinity)
      expect(metrics.violationDensity).toBe(0);
      expect(metrics.filesAffected).toBe(0);
    });
  });

  describe('createBaseline', () => {
    it('should create a new baseline from violations', () => {
      const violations: RuleViolation[] = [
        {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
          range: { startLine: 1, startCol: 0, endLine: 1, endCol: 10 },
        },
      ];

      const baseline = baselineService.createBaseline(violations);

      expect(baseline.version).toBe('1.0.0');
      expect(baseline.violations).toHaveLength(1);
      expect(baseline.violations[0]!.ruleId).toBe('test-rule');
      expect(baseline.metrics.totalViolations).toBe(1);
      expect(baseline.createdAt).toBeDefined();
      expect(baseline.updatedAt).toBeDefined();
      expect(baseline.createdAt).toBe(baseline.updatedAt);
    });

    it('should create baseline with multiple violations', () => {
      const violations: RuleViolation[] = [
        {
          ruleId: 'rule1',
          severity: 'error',
          message: 'Error 1',
          file: 'src/file1.ts',
        },
        {
          ruleId: 'rule2',
          severity: 'warning',
          message: 'Warning 1',
          file: 'src/file2.ts',
        },
      ];

      const baseline = baselineService.createBaseline(violations);

      expect(baseline.violations).toHaveLength(2);
      expect(baseline.metrics.totalViolations).toBe(2);
      expect(baseline.metrics.errors).toBe(1);
      expect(baseline.metrics.warnings).toBe(1);
    });
  });

  describe('updateBaseline', () => {
    it('should create new baseline if none exists', () => {
      const violations: RuleViolation[] = [
        {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        },
      ];

      baselineService.updateBaseline(violations);

      expect(baselineService.hasBaseline()).toBe(true);
      const baseline = baselineService.getBaseline();
      expect(baseline).not.toBeNull();
      expect(baseline!.violations).toHaveLength(1);
    });

    it('should preserve firstSeen timestamp for existing violations', () => {
      const violation1: RuleViolation = {
        ruleId: 'test-rule',
        severity: 'error',
        message: 'Test violation',
        file: 'src/test.ts',
        range: { startLine: 1, startCol: 0, endLine: 1, endCol: 10 },
      };

      baselineService.updateBaseline([violation1]);
      baselineService.save();

      const originalBaseline = baselineService.getBaseline();
      const originalFirstSeen = originalBaseline!.violations[0]!.firstSeen;

      // Wait a bit to ensure different timestamp
      const violation2: RuleViolation = {
        ruleId: 'test-rule',
        severity: 'error',
        message: 'Test violation',
        file: 'src/test.ts',
        range: { startLine: 1, startCol: 0, endLine: 1, endCol: 10 },
      };

      baselineService.updateBaseline([violation2]);

      const updatedBaseline = baselineService.getBaseline();
      expect(updatedBaseline!.violations[0]!.firstSeen).toBe(originalFirstSeen);
    });

    it('should add new violations with current timestamp', () => {
      const violation1: RuleViolation = {
        ruleId: 'rule1',
        severity: 'error',
        message: 'Violation 1',
        file: 'src/file1.ts',
      };

      baselineService.updateBaseline([violation1]);
      baselineService.save();

      const violation2: RuleViolation = {
        ruleId: 'rule2',
        severity: 'error',
        message: 'Violation 2',
        file: 'src/file2.ts',
      };

      baselineService.updateBaseline([violation1, violation2]);

      const baseline = baselineService.getBaseline();
      expect(baseline!.violations).toHaveLength(2);

      const newViolation = baseline!.violations.find((v) => v.ruleId === 'rule2');
      expect(newViolation).toBeDefined();
      expect(newViolation!.firstSeen).toBeDefined();
    });

    it('should remove violations that no longer exist', () => {
      const violation1: RuleViolation = {
        ruleId: 'rule1',
        severity: 'error',
        message: 'Violation 1',
        file: 'src/file1.ts',
      };

      const violation2: RuleViolation = {
        ruleId: 'rule2',
        severity: 'error',
        message: 'Violation 2',
        file: 'src/file2.ts',
      };

      baselineService.updateBaseline([violation1, violation2]);
      baselineService.save();

      // Update with only violation1 (violation2 is resolved)
      baselineService.updateBaseline([violation1]);

      const baseline = baselineService.getBaseline();
      expect(baseline!.violations).toHaveLength(1);
      expect(baseline!.violations[0]!.ruleId).toBe('rule1');
    });

    describe('metricsHistory', () => {
      it('should not create history on first update', () => {
        const violation: RuleViolation = {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        };

        baselineService.updateBaseline([violation]);

        const baseline = baselineService.getBaseline();
        expect(baseline).not.toBeNull();
        expect(baseline!.metricsHistory).toBeUndefined();
      });

      it('should create history on second update', () => {
        const violation: RuleViolation = {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        };

        // First update
        baselineService.updateBaseline([violation]);
        const firstMetrics = baselineService.getBaseline()!.metrics;

        // Second update
        baselineService.updateBaseline([violation]);

        const baseline = baselineService.getBaseline();
        expect(baseline!.metricsHistory).toBeDefined();
        expect(baseline!.metricsHistory).toHaveLength(1);
        expect(baseline!.metricsHistory![0]).toEqual(firstMetrics);
      });

      it('should accumulate history with multiple updates', () => {
        const violation: RuleViolation = {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        };

        // First update - no history
        baselineService.updateBaseline([violation]);
        expect(baselineService.getBaseline()!.metricsHistory).toBeUndefined();

        // Second update - 1 entry
        baselineService.updateBaseline([violation]);
        expect(baselineService.getBaseline()!.metricsHistory).toHaveLength(1);

        // Third update - 2 entries
        baselineService.updateBaseline([violation]);
        expect(baselineService.getBaseline()!.metricsHistory).toHaveLength(2);

        // Fourth update - 3 entries
        baselineService.updateBaseline([violation]);
        expect(baselineService.getBaseline()!.metricsHistory).toHaveLength(3);
      });

      it('should trim history when exceeding default maxHistorySize (50)', () => {
        const violation: RuleViolation = {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        };

        // Create baseline
        baselineService.updateBaseline([violation]);

        // Update 55 times (exceeds default 50)
        for (let i = 0; i < 54; i++) {
          baselineService.updateBaseline([violation]);
        }

        const baseline = baselineService.getBaseline();
        expect(baseline!.metricsHistory).toBeDefined();
        expect(baseline!.metricsHistory).toHaveLength(50);
      });

      it('should trim history when exceeding custom maxHistorySize', () => {
        const violation: RuleViolation = {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        };

        // Create baseline
        baselineService.updateBaseline([violation]);

        // Update 15 times with custom maxHistorySize = 10
        for (let i = 0; i < 14; i++) {
          baselineService.updateBaseline([violation], undefined, 10);
        }

        const baseline = baselineService.getBaseline();
        expect(baseline!.metricsHistory).toBeDefined();
        expect(baseline!.metricsHistory).toHaveLength(10);
      });

      it('should not trim history when exactly at maxHistorySize', () => {
        const violation: RuleViolation = {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        };

        // Create baseline
        baselineService.updateBaseline([violation]);

        // Update exactly 50 more times (total 51 updates = 50 history entries)
        for (let i = 0; i < 50; i++) {
          baselineService.updateBaseline([violation]);
        }

        const baseline = baselineService.getBaseline();
        expect(baseline!.metricsHistory).toHaveLength(50);
      });

      it('should not trim history when below maxHistorySize', () => {
        const violation: RuleViolation = {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        };

        // Create baseline
        baselineService.updateBaseline([violation]);

        // Update 10 more times (total 11 updates = 10 history entries)
        for (let i = 0; i < 10; i++) {
          baselineService.updateBaseline([violation]);
        }

        const baseline = baselineService.getBaseline();
        expect(baseline!.metricsHistory).toHaveLength(10);
      });

      it('should handle undefined metricsHistory initially', () => {
        const violation: RuleViolation = {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        };

        // Create baseline (no history)
        baselineService.updateBaseline([violation]);
        baselineService.save();

        // Load in new service instance (simulates loading from disk)
        const newService = new BaselineService(tempDir);
        expect(newService.getBaseline()!.metricsHistory).toBeUndefined();

        // Update should create history
        newService.updateBaseline([violation]);
        expect(newService.getBaseline()!.metricsHistory).toHaveLength(1);
      });

      it('should persist history after save and load', () => {
        const violation: RuleViolation = {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        };

        // Create baseline and update 4 times (4 updates = 3 history entries)
        baselineService.updateBaseline([violation]);
        baselineService.updateBaseline([violation]);
        baselineService.updateBaseline([violation]);
        baselineService.updateBaseline([violation]);
        baselineService.save();

        // Load in new service instance
        const newService = new BaselineService(tempDir);
        const loadedBaseline = newService.getBaseline();

        expect(loadedBaseline!.metricsHistory).toBeDefined();
        expect(loadedBaseline!.metricsHistory).toHaveLength(3);
      });

      it('should persist trimmed history after save and load', () => {
        const violation: RuleViolation = {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        };

        // Create baseline
        baselineService.updateBaseline([violation]);

        // Update 55 times (exceeds default 50)
        for (let i = 0; i < 54; i++) {
          baselineService.updateBaseline([violation]);
        }
        baselineService.save();

        // Load in new service instance
        const newService = new BaselineService(tempDir);
        const loadedBaseline = newService.getBaseline();

        expect(loadedBaseline!.metricsHistory).toBeDefined();
        expect(loadedBaseline!.metricsHistory).toHaveLength(50);
      });

      it('should store correct metrics in history entries', () => {
        const violation1: RuleViolation = {
          ruleId: 'rule1',
          severity: 'error',
          message: 'Violation 1',
          file: 'src/file1.ts',
        };

        const violation2: RuleViolation = {
          ruleId: 'rule2',
          severity: 'warning',
          message: 'Violation 2',
          file: 'src/file2.ts',
        };

        // First update - 1 violation
        baselineService.updateBaseline([violation1]);
        const firstMetrics = baselineService.getBaseline()!.metrics;

        // Second update - 2 violations
        baselineService.updateBaseline([violation1, violation2]);
        const secondMetrics = baselineService.getBaseline()!.metrics;

        // Third update - check history
        baselineService.updateBaseline([violation1, violation2]);

        const baseline = baselineService.getBaseline();
        expect(baseline!.metricsHistory).toHaveLength(2);
        expect(baseline!.metricsHistory![0]).toEqual(firstMetrics);
        expect(baseline!.metricsHistory![1]).toEqual(secondMetrics);
        expect(baseline!.metricsHistory![0]!.totalViolations).toBe(1);
        expect(baseline!.metricsHistory![1]!.totalViolations).toBe(2);
      });
    });

    describe('updateBaseline with GraphStats', () => {
      it('should store metrics with graphStats in history', () => {
        // INPUT: Violations + graphStats for first update
        const violation: RuleViolation = {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        };

        const graphStats: GraphStats = {
          totalFiles: 100,
          totalDependencies: 350,
          averageDependenciesPerFile: 3.5,
          unmappedFiles: 5,
        };

        // EXECUTE: First update with graphStats
        baselineService.updateBaseline([violation], graphStats);
        const firstMetrics = baselineService.getBaseline()!.metrics;

        // EXECUTE: Second update with graphStats
        baselineService.updateBaseline([violation], graphStats);

        // EXPECTED OUTPUT:
        // - metricsHistory should contain firstMetrics with couplingScore and healthScore
        const baseline = baselineService.getBaseline();
        expect(baseline!.metricsHistory).toBeDefined();
        expect(baseline!.metricsHistory).toHaveLength(1);
        expect(baseline!.metricsHistory![0]!.couplingScore).toBe(3.5);
        expect(baseline!.metricsHistory![0]!.healthScore).toBeDefined();
        expect(baseline!.metricsHistory![0]!.violationDensity).toBeDefined();
        expect(baseline!.metricsHistory![0]).toEqual(firstMetrics);
      });

      it('should preserve graphStats metrics across updates', () => {
        // INPUT: Multiple updates with different graphStats
        const violation: RuleViolation = {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        };

        const graphStats1: GraphStats = {
          totalFiles: 100,
          totalDependencies: 300,
          averageDependenciesPerFile: 3.0,
          unmappedFiles: 0,
        };

        const graphStats2: GraphStats = {
          totalFiles: 100,
          totalDependencies: 400,
          averageDependenciesPerFile: 4.0,
          unmappedFiles: 5,
        };

        // EXECUTE: Three updates with different graphStats
        baselineService.updateBaseline([violation], graphStats1);
        const metrics1 = baselineService.getBaseline()!.metrics;

        baselineService.updateBaseline([violation], graphStats2);
        const metrics2 = baselineService.getBaseline()!.metrics;

        baselineService.updateBaseline([violation], graphStats1);

        // EXPECTED OUTPUT:
        // - History should contain metrics1 and metrics2 with their respective graphStats
        const baseline = baselineService.getBaseline();
        expect(baseline!.metricsHistory).toHaveLength(2);
        expect(baseline!.metricsHistory![0]!.couplingScore).toBe(3.0); // From graphStats1
        expect(baseline!.metricsHistory![1]!.couplingScore).toBe(4.0); // From graphStats2
        expect(baseline!.metrics.couplingScore).toBe(3.0); // Current metrics from graphStats1
      });

      it('should handle updates with and without graphStats', () => {
        // INPUT: Mix of updates with and without graphStats
        const violation: RuleViolation = {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        };

        const graphStats: GraphStats = {
          totalFiles: 100,
          totalDependencies: 350,
          averageDependenciesPerFile: 3.5,
          unmappedFiles: 0,
        };

        // EXECUTE: Update with graphStats, then without
        baselineService.updateBaseline([violation], graphStats);
        const metricsWithStats = baselineService.getBaseline()!.metrics;

        baselineService.updateBaseline([violation]); // No graphStats
        const metricsWithoutStats = baselineService.getBaseline()!.metrics;

        baselineService.updateBaseline([violation], graphStats);

        // EXPECTED OUTPUT:
        // - First history entry should have couplingScore/healthScore
        // - Second history entry should NOT have couplingScore/healthScore (but should have violationDensity)
        const baseline = baselineService.getBaseline();
        expect(baseline!.metricsHistory).toHaveLength(2);
        expect(baseline!.metricsHistory![0]!.couplingScore).toBe(3.5);
        expect(baseline!.metricsHistory![0]!.healthScore).toBeDefined();
        expect(baseline!.metricsHistory![1]!.couplingScore).toBeUndefined();
        expect(baseline!.metricsHistory![1]!.healthScore).toBeUndefined();
        expect(baseline!.metricsHistory![1]!.violationDensity).toBeDefined();
      });
    });
  });

  describe('save and loadBaseline', () => {
    it('should save baseline to disk', () => {
      const violations: RuleViolation[] = [
        {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        },
      ];

      baselineService.createBaseline(violations);
      baselineService.save();

      const baselinePath = path.join(tempDir, '.archctl', 'baseline.json');
      expect(fs.existsSync(baselinePath)).toBe(true);

      const content = fs.readFileSync(baselinePath, 'utf-8');
      const savedBaseline = JSON.parse(content) as Baseline;

      expect(savedBaseline.version).toBe('1.0.0');
      expect(savedBaseline.violations).toHaveLength(1);
    });

    it('should load baseline from disk', () => {
      const violations: RuleViolation[] = [
        {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        },
      ];

      baselineService.createBaseline(violations);
      baselineService.save();

      const newService = new BaselineService(tempDir);
      expect(newService.hasBaseline()).toBe(true);

      const loadedBaseline = newService.getBaseline();
      expect(loadedBaseline).not.toBeNull();
      expect(loadedBaseline!.violations).toHaveLength(1);
      expect(loadedBaseline!.violations[0]!.ruleId).toBe('test-rule');
    });

    it('should return null for non-existent baseline', () => {
      const newService = new BaselineService(tempDir);
      expect(newService.hasBaseline()).toBe(false);
      expect(newService.getBaseline()).toBeNull();
    });

    it('should return null for invalid baseline file', () => {
      const baselinePath = path.join(tempDir, '.archctl', 'baseline.json');
      fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
      fs.writeFileSync(baselinePath, 'invalid json', 'utf-8');

      const newService = new BaselineService(tempDir);
      expect(newService.hasBaseline()).toBe(false);
      expect(newService.getBaseline()).toBeNull();
    });

    it('should return null for baseline with wrong version', () => {
      const baselinePath = path.join(tempDir, '.archctl', 'baseline.json');
      fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
      fs.writeFileSync(
        baselinePath,
        JSON.stringify({ version: '2.0.0', violations: [], metrics: {} }),
        'utf-8'
      );

      const newService = new BaselineService(tempDir);
      expect(newService.hasBaseline()).toBe(false);
      expect(newService.getBaseline()).toBeNull();
    });
  });

  describe('compareViolations', () => {
    it('should return all violations as new when no baseline exists', () => {
      const violations: RuleViolation[] = [
        {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        },
      ];

      const comparison = baselineService.compareViolations(violations);

      expect(comparison.new).toHaveLength(1);
      expect(comparison.resolved).toHaveLength(0);
      expect(comparison.unchanged).toHaveLength(0);
    });

    it('should identify new violations', () => {
      const violation1: RuleViolation = {
        ruleId: 'rule1',
        severity: 'error',
        message: 'Violation 1',
        file: 'src/file1.ts',
        range: { startLine: 1, startCol: 0, endLine: 1, endCol: 10 },
      };

      baselineService.updateBaseline([violation1]);
      baselineService.save();

      const violation2: RuleViolation = {
        ruleId: 'rule2',
        severity: 'error',
        message: 'Violation 2',
        file: 'src/file2.ts',
        range: { startLine: 2, startCol: 0, endLine: 2, endCol: 10 },
      };

      const newService = new BaselineService(tempDir);
      const comparison = newService.compareViolations([violation1, violation2]);

      expect(comparison.new).toHaveLength(1);
      expect(comparison.new[0]!.ruleId).toBe('rule2');
      expect(comparison.unchanged).toHaveLength(1);
      expect(comparison.unchanged[0]!.ruleId).toBe('rule1');
      expect(comparison.resolved).toHaveLength(0);
    });

    it('should identify resolved violations', () => {
      const violation1: RuleViolation = {
        ruleId: 'rule1',
        severity: 'error',
        message: 'Violation 1',
        file: 'src/file1.ts',
        range: { startLine: 1, startCol: 0, endLine: 1, endCol: 10 },
      };

      const violation2: RuleViolation = {
        ruleId: 'rule2',
        severity: 'error',
        message: 'Violation 2',
        file: 'src/file2.ts',
        range: { startLine: 2, startCol: 0, endLine: 2, endCol: 10 },
      };

      baselineService.updateBaseline([violation1, violation2]);
      baselineService.save();

      const newService = new BaselineService(tempDir);
      const comparison = newService.compareViolations([violation1]);

      expect(comparison.new).toHaveLength(0);
      expect(comparison.unchanged).toHaveLength(1);
      expect(comparison.resolved).toHaveLength(1);
      expect(comparison.resolved[0]!.ruleId).toBe('rule2');
    });

    it('should identify unchanged violations', () => {
      const violation: RuleViolation = {
        ruleId: 'test-rule',
        severity: 'error',
        message: 'Test violation',
        file: 'src/test.ts',
        range: { startLine: 1, startCol: 0, endLine: 1, endCol: 10 },
      };

      baselineService.updateBaseline([violation]);
      baselineService.save();

      const newService = new BaselineService(tempDir);
      const comparison = newService.compareViolations([violation]);

      expect(comparison.new).toHaveLength(0);
      expect(comparison.resolved).toHaveLength(0);
      expect(comparison.unchanged).toHaveLength(1);
      expect(comparison.unchanged[0]!.ruleId).toBe('test-rule');
    });

    it('should handle mixed new, resolved, and unchanged violations', () => {
      const violation1: RuleViolation = {
        ruleId: 'rule1',
        severity: 'error',
        message: 'Violation 1',
        file: 'src/file1.ts',
        range: { startLine: 1, startCol: 0, endLine: 1, endCol: 10 },
      };

      const violation2: RuleViolation = {
        ruleId: 'rule2',
        severity: 'error',
        message: 'Violation 2',
        file: 'src/file2.ts',
        range: { startLine: 2, startCol: 0, endLine: 2, endCol: 10 },
      };

      baselineService.updateBaseline([violation1, violation2]);
      baselineService.save();

      const violation3: RuleViolation = {
        ruleId: 'rule3',
        severity: 'error',
        message: 'Violation 3',
        file: 'src/file3.ts',
        range: { startLine: 3, startCol: 0, endLine: 3, endCol: 10 },
      };

      const newService = new BaselineService(tempDir);
      const comparison = newService.compareViolations([violation1, violation3]);

      expect(comparison.unchanged).toHaveLength(1);
      expect(comparison.unchanged[0]!.ruleId).toBe('rule1');
      expect(comparison.new).toHaveLength(1);
      expect(comparison.new[0]!.ruleId).toBe('rule3');
      expect(comparison.resolved).toHaveLength(1);
      expect(comparison.resolved[0]!.ruleId).toBe('rule2');
    });
  });

  describe('clear', () => {
    it('should clear baseline and delete file', () => {
      const violations: RuleViolation[] = [
        {
          ruleId: 'test-rule',
          severity: 'error',
          message: 'Test violation',
          file: 'src/test.ts',
        },
      ];

      baselineService.createBaseline(violations);
      baselineService.save();

      const baselinePath = path.join(tempDir, '.archctl', 'baseline.json');
      expect(fs.existsSync(baselinePath)).toBe(true);

      baselineService.clear();

      expect(baselineService.hasBaseline()).toBe(false);
      expect(fs.existsSync(baselinePath)).toBe(false);
    });

    it('should handle clear when no baseline exists', () => {
      expect(() => {
        baselineService.clear();
      }).not.toThrow();
    });
  });
});
