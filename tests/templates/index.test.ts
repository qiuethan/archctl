import { describe, it, expect } from 'vitest';
import { TEMPLATES, TEMPLATES_BY_ID, getTemplateById } from '../../src/templates';

describe('Template Library', () => {
  describe('TEMPLATES', () => {
    it('should contain at least 3 example templates', () => {
      expect(TEMPLATES.length).toBeGreaterThanOrEqual(3);
    });

    it('should have unique template IDs', () => {
      const ids = TEMPLATES.map((template) => template.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required fields on each template', () => {
      TEMPLATES.forEach((template) => {
        expect(template.id).toBeTruthy();
        expect(template.label).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(Array.isArray(template.layers)).toBe(true);
        expect(Array.isArray(template.rules)).toBe(true);
      });
    });

    it('should have valid layers in each template', () => {
      TEMPLATES.forEach((template) => {
        expect(template.layers.length).toBeGreaterThan(0);
        template.layers.forEach((layer) => {
          expect(layer.name).toBeTruthy();
          expect(layer.description).toBeTruthy();
        });
      });
    });

    it('should have valid rule configs in each template', () => {
      TEMPLATES.forEach((template) => {
        template.rules.forEach((ruleConfig) => {
          expect(ruleConfig.kind).toBeTruthy();
          expect(typeof ruleConfig.kind).toBe('string');
          expect(ruleConfig.id).toBeTruthy();
          expect(ruleConfig.title).toBeTruthy();
          expect(ruleConfig.description).toBeTruthy();
        });
      });
    });
  });

  describe('TEMPLATES_BY_ID', () => {
    it('should contain all templates from TEMPLATES', () => {
      expect(Object.keys(TEMPLATES_BY_ID).length).toBe(TEMPLATES.length);
    });

    it('should allow lookup by ID', () => {
      const template = TEMPLATES_BY_ID['clean-architecture'];
      expect(template).toBeDefined();
      expect(template?.id).toBe('clean-architecture');
    });

    it('should have correct mapping for all templates', () => {
      TEMPLATES.forEach((template) => {
        expect(TEMPLATES_BY_ID[template.id]).toBe(template);
      });
    });
  });

  describe('getTemplateById', () => {
    it('should return template when ID exists', () => {
      const template = getTemplateById('clean-architecture');
      expect(template).toBeDefined();
      expect(template?.id).toBe('clean-architecture');
      expect(template?.label).toBe('Clean Architecture');
    });

    it('should return undefined when ID does not exist', () => {
      const template = getTemplateById('non-existent-template');
      expect(template).toBeUndefined();
    });
  });

  describe('Example Templates', () => {
    it('should have clean-architecture template', () => {
      const template = getTemplateById('clean-architecture');
      expect(template).toBeDefined();
      expect(template?.label).toBe('Clean Architecture');
      expect(template?.layers.length).toBeGreaterThan(0);
      expect(template?.rules.length).toBeGreaterThan(0);
    });

    it('should have modular-monolith template', () => {
      const template = getTemplateById('modular-monolith');
      expect(template).toBeDefined();
      expect(template?.label).toBe('Modular Monolith');
      expect(template?.layers.length).toBeGreaterThan(0);
      expect(template?.rules.length).toBeGreaterThan(0);
    });

    it('should have ddd-microservices template', () => {
      const template = getTemplateById('ddd-microservices');
      expect(template).toBeDefined();
      expect(template?.label).toBe('DDD Microservices');
      expect(template?.layers.length).toBeGreaterThan(0);
      expect(template?.rules.length).toBeGreaterThan(0);
    });
  });

  describe('Template Rule Configs', () => {
    it('should have valid rule kinds', () => {
      const template = getTemplateById('clean-architecture');
      expect(template).toBeDefined();
      expect(template?.rules.length).toBeGreaterThan(0);

      const validKinds = [
        'forbidden-layer-import',
        'allowed-layer-import',
        'file-pattern-layer',
        'max-dependencies',
        'cyclic-dependency',
        'allowed-capability',
        'forbidden-capability',
      ];

      template?.rules.forEach((ruleConfig) => {
        expect(validKinds).toContain(ruleConfig.kind);
        expect(ruleConfig.id).toMatch(/^[a-z-]+$/);
      });
    });

    it('should have proper rule structure', () => {
      const template = getTemplateById('clean-architecture');

      template?.rules.forEach((ruleConfig) => {
        // All rules must have these fields
        expect(ruleConfig.kind).toBeTruthy();
        expect(ruleConfig.id).toBeTruthy();
        expect(ruleConfig.title).toBeTruthy();
        expect(ruleConfig.description).toBeTruthy();
      });
    });
  });
});
