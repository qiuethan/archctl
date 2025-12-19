import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { BaselineService } from '../../../src/infrastructure/baseline/baselineService';
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
      expect(baselineViolation.range).toEqual({ startLine: 1, startCol: 0, endLine: 1, endCol: 10 });
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

      const baselineViolation = baselineService.violationToBaseline(violation, '2025-01-15T10:00:00Z');

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

