import type { TemplateDefinition } from '../../types/templates';

/**
 * DDD Microservices Template
 *
 * Domain-Driven Design applied to microservices architecture with strict
 * bounded contexts and anti-corruption layers.
 */
export const dddMicroservicesTemplate: TemplateDefinition = {
  id: 'ddd-microservices',
  label: 'DDD Microservices',
  description:
    'Domain-Driven Design with microservices, bounded contexts, and event-driven communication.',

  layers: [
    {
      name: 'domain',
      description: 'Domain models, aggregates, and business rules',
    },
    {
      name: 'application',
      description: 'Application services and use cases',
    },
    {
      name: 'infrastructure',
      description: 'Persistence, messaging, external integrations',
    },
    {
      name: 'api',
      description: 'REST/GraphQL API layer',
    },
  ],

  rules: [
    {
      ruleId: 'aggregate-root-only-mutation',
      enabled: true,
      severityOverride: 'error',
    },
    {
      ruleId: 'domain-events-usage',
      enabled: true,
      severityOverride: 'error',
    },
    {
      ruleId: 'domain-models-immutable',
      enabled: true,
      severityOverride: 'error',
    },
    {
      ruleId: 'no-shared-state-between-microservices',
      enabled: true,
      severityOverride: 'error',
    },
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
      ruleId: 'no-business-logic-in-repositories',
      enabled: true,
    },
    {
      ruleId: 'persistence-only-crud',
      enabled: true,
    },
    {
      ruleId: 'no-cyclic-dependencies',
      enabled: true,
    },
  ],
};
