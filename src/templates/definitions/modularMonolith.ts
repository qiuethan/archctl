import type { TemplateDefinition } from '../../types/templates';

/**
 * Modular Monolith Template
 *
 * Feature-based modules with clear boundaries, suitable for teams that want
 * microservice-like modularity without the operational overhead.
 */
export const modularMonolithTemplate: TemplateDefinition = {
  id: 'modular-monolith',
  label: 'Modular Monolith',
  description:
    'Feature-based modules with clear boundaries and communication contracts.',

  language: 'TypeScript',
  framework: 'Node.js',
  testing: 'Vitest',

  layers: [
    {
      name: 'features',
      path: 'src/features',
      description: 'Independent feature modules',
    },
    {
      name: 'shared',
      path: 'src/shared',
      description: 'Shared utilities and infrastructure',
    },
    {
      name: 'api',
      path: 'src/api',
      description: 'API gateway and routing',
    },
  ],

  rules: [
    {
      ruleId: 'no-feature-crosstalk',
      enabled: true,
      severityOverride: 'error',
    },
    {
      ruleId: 'no-business-logic-in-controllers',
      enabled: true,
    },
    {
      ruleId: 'limit-public-api-exposure',
      enabled: true,
      severityOverride: 'error',
    },
    {
      ruleId: 'no-cyclic-dependencies',
      enabled: true,
    },
    {
      ruleId: 'domain-events-usage',
      enabled: true,
      severityOverride: 'warning',
    },
  ],
};
