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
    // Domain layer isolation
    {
      kind: 'allowed-layer-import',
      id: 'domain-isolation',
      title: 'Domain Layer Isolation',
      description: 'Domain layer can only import from domain layer',
      fromLayer: 'domain',
      allowedLayers: ['domain'],
    },
    // Application layer dependencies
    {
      kind: 'allowed-layer-import',
      id: 'application-dependencies',
      title: 'Application Layer Dependencies',
      description: 'Application layer can import from domain and infrastructure',
      fromLayer: 'application',
      allowedLayers: ['domain', 'infrastructure', 'application'],
    },
    // Infrastructure layer dependencies
    {
      kind: 'allowed-layer-import',
      id: 'infrastructure-dependencies',
      title: 'Infrastructure Layer Dependencies',
      description: 'Infrastructure layer can import from domain and infrastructure',
      fromLayer: 'infrastructure',
      allowedLayers: ['domain', 'infrastructure'],
    },
    // API layer dependencies
    {
      kind: 'allowed-layer-import',
      id: 'api-dependencies',
      title: 'API Layer Dependencies',
      description: 'API layer can import from application and domain',
      fromLayer: 'api',
      allowedLayers: ['application', 'domain', 'api'],
    },
    // Strict domain modularity
    {
      kind: 'max-dependencies',
      id: 'max-deps-domain',
      title: 'Max Dependencies in Domain',
      description: 'Domain files should have at most 8 dependencies for DDD',
      maxDependencies: 8,
      layer: 'domain',
    },
    // Global dependency limit
    {
      kind: 'max-dependencies',
      id: 'max-deps-global',
      title: 'Max Dependencies Global',
      description: 'No file should have more than 15 dependencies',
      maxDependencies: 15,
    },
  ],
};
