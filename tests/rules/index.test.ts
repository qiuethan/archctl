import { describe, it, expect } from 'vitest';
import {
  RULE_DEFINITIONS,
  RULES_BY_ID,
  getRuleById,
  getRulesByTags,
  getRulesByKind,
} from '../../src/rules';

describe('Rule Library', () => {
  describe('RULE_DEFINITIONS', () => {
    it('should contain at least 2 example rules', () => {
      expect(RULE_DEFINITIONS.length).toBeGreaterThanOrEqual(2);
    });

    it('should have unique rule IDs', () => {
      const ids = RULE_DEFINITIONS.map((rule) => rule.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required fields on each rule', () => {
      RULE_DEFINITIONS.forEach((rule) => {
        expect(rule.id).toBeTruthy();
        expect(rule.label).toBeTruthy();
        expect(rule.kind).toBeTruthy();
        expect(rule.defaultSeverity).toBeTruthy();
        expect(rule.description).toBeTruthy();
        expect(rule.defaultConfig).toBeDefined();
      });
    });
  });

  describe('RULES_BY_ID', () => {
    it('should contain all rules from RULE_DEFINITIONS', () => {
      expect(Object.keys(RULES_BY_ID).length).toBe(RULE_DEFINITIONS.length);
    });

    it('should allow lookup by ID', () => {
      const rule = RULES_BY_ID['no-controller-to-repo'];
      expect(rule).toBeDefined();
      expect(rule?.id).toBe('no-controller-to-repo');
      expect(rule?.kind).toBe('dependency');
    });

    it('should have correct mapping for all rules', () => {
      RULE_DEFINITIONS.forEach((rule) => {
        expect(RULES_BY_ID[rule.id]).toBe(rule);
      });
    });
  });

  describe('getRuleById', () => {
    it('should return rule when ID exists', () => {
      const rule = getRuleById('no-controller-to-repo');
      expect(rule).toBeDefined();
      expect(rule?.id).toBe('no-controller-to-repo');
    });

    it('should return undefined when ID does not exist', () => {
      const rule = getRuleById('non-existent-rule');
      expect(rule).toBeUndefined();
    });
  });

  describe('getRulesByTags', () => {
    it('should return rules matching any of the provided tags', () => {
      const rules = getRulesByTags(['testing']);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some((r) => r.tags?.includes('testing'))).toBe(true);
    });

    it('should return empty array when no rules match tags', () => {
      const rules = getRulesByTags(['non-existent-tag']);
      expect(rules).toEqual([]);
    });

    it('should match multiple tags (OR logic)', () => {
      const rules = getRulesByTags(['testing', 'layering']);
      expect(rules.length).toBeGreaterThan(0);
    });
  });

  describe('getRulesByKind', () => {
    it('should return rules of specified kind', () => {
      const dependencyRules = getRulesByKind('dependency');
      expect(dependencyRules.length).toBeGreaterThan(0);
      dependencyRules.forEach((rule) => {
        expect(rule.kind).toBe('dependency');
      });
    });

    it('should return empty array when no rules of that kind exist', () => {
      const semanticRules = getRulesByKind('semantic');
      expect(semanticRules).toEqual([]);
    });
  });

  describe('Example Rules', () => {
    it('should have no-controller-to-repo rule', () => {
      const rule = getRuleById('no-controller-to-repo');
      expect(rule).toBeDefined();
      expect(rule?.label).toBe('Controllers cannot depend directly on repositories');
      expect(rule?.kind).toBe('dependency');
      expect(rule?.defaultSeverity).toBe('error');
      expect(rule?.tags).toContain('layering');
    });

    it('should have require-tests-for-services rule', () => {
      const rule = getRuleById('require-tests-for-services');
      expect(rule).toBeDefined();
      expect(rule?.label).toBe('Services must have tests');
      expect(rule?.kind).toBe('tests');
      expect(rule?.defaultSeverity).toBe('warning');
      expect(rule?.tags).toContain('testing');
    });
  });
});
