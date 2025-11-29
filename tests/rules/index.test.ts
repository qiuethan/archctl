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
      const rule = RULES_BY_ID['no-infrastructure-to-domain'];
      expect(rule).toBeDefined();
      expect(rule?.id).toBe('no-infrastructure-to-domain');
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
      const rule = getRuleById('no-infrastructure-to-domain');
      expect(rule).toBeDefined();
      expect(rule?.id).toBe('no-infrastructure-to-domain');
    });

    it('should return undefined when ID does not exist', () => {
      const rule = getRuleById('non-existent-rule');
      expect(rule).toBeUndefined();
    });
  });

  describe('getRulesByTags', () => {
    it('should return rules matching any of the provided tags', () => {
      const rules = getRulesByTags(['ddd']);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some((r) => r.tags?.includes('ddd'))).toBe(true);
    });

    it('should return empty array when no rules match tags', () => {
      const rules = getRulesByTags(['non-existent-tag']);
      expect(rules).toEqual([]);
    });

    it('should match multiple tags (OR logic)', () => {
      const rules = getRulesByTags(['ddd', 'clean-architecture']);
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

    it('should return semantic rules', () => {
      const semanticRules = getRulesByKind('semantic');
      expect(semanticRules.length).toBeGreaterThan(0);
      semanticRules.forEach((rule) => {
        expect(rule.kind).toBe('semantic');
      });
    });
  });

  describe('Example Rules', () => {
    it('should have no-infrastructure-to-domain rule', () => {
      const rule = getRuleById('no-infrastructure-to-domain');
      expect(rule).toBeDefined();
      expect(rule?.label).toBe('Infrastructure must not depend directly on Domain');
      expect(rule?.kind).toBe('dependency');
      expect(rule?.defaultSeverity).toBe('error');
      expect(rule?.tags).toContain('clean-architecture');
    });

    it('should have domain-no-ui-awareness rule', () => {
      const rule = getRuleById('domain-no-ui-awareness');
      expect(rule).toBeDefined();
      expect(rule?.label).toBe('Domain must not depend on UI');
      expect(rule?.kind).toBe('dependency');
      expect(rule?.defaultSeverity).toBe('error');
      expect(rule?.tags).toContain('ddd');
    });
  });
});
