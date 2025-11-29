import type { TemplateDefinition } from '../../types/templates';

/**
 * Clean Architecture Template
 *
 * Implements Uncle Bob's Clean Architecture pattern with clear layer separation
 * and dependency rules flowing inward toward the domain.
 */
export const cleanArchitectureTemplate: TemplateDefinition = {
  id: 'clean-architecture',
  label: 'Clean Architecture',
  description:
    'Uncle Bob\'s Clean Architecture with domain-centric layers and strict dependency rules.',

  language: 'TypeScript',
  framework: 'Node.js',
  testing: 'Vitest',

  layers: [
    {
      name: 'domain',
      description: 'Core business logic, entities, and domain rules',
    },
    {
      name: 'application',
      description: 'Use cases and application services',
    },
    {
      name: 'infrastructure',
      description: 'External concerns: DB, APIs, file system',
    },
    {
      name: 'presentation',
      description: 'UI, controllers, API endpoints',
    },
  ],

  rules: [
    {
      ruleId: 'no-infrastructure-to-domain',
      enabled: true,
    },
    {
      ruleId: 'domain-no-ui-awareness',
      enabled: true,
    },
    {
      ruleId: 'no-domain-exposure-via-dtos',
      enabled: true,
    },
    {
      ruleId: 'no-business-logic-in-controllers',
      enabled: true,
    },
    {
      ruleId: 'aggregate-root-only-mutation',
      enabled: true,
    },
    {
      ruleId: 'domain-models-immutable',
      enabled: true,
      severityOverride: 'error',
    },
    {
      ruleId: 'domain-events-usage',
      enabled: true,
    },
    {
      ruleId: 'no-cyclic-dependencies',
      enabled: true,
    },
  ],
};
