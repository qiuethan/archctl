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
    'Clean Architecture with domain-centric layers and strict dependency rules.',

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
      name: 'presentation',
      description: 'UI, controllers, API endpoints',
    },
  ],

  rules: [
    // Domain layer isolation - can only import from domain
    {
      kind: 'allowed-layer-import',
      id: 'domain-isolation',
      title: 'Domain Layer Isolation',
      description: 'Domain layer can only import from domain layer (pure domain)',
      fromLayer: 'domain',
      allowedLayers: ['domain'],
    },
    // Application layer dependencies
    {
      kind: 'allowed-layer-import',
      id: 'application-dependencies',
      title: 'Application Layer Dependencies',
      description: 'Application layer can import from domain, infrastructure, and shared',
      fromLayer: 'application',
      allowedLayers: ['domain', 'infrastructure', 'shared', 'application'],
    },
    // Infrastructure layer dependencies
    {
      kind: 'allowed-layer-import',
      id: 'infrastructure-dependencies',
      title: 'Infrastructure Layer Dependencies',
      description: 'Infrastructure layer can import from domain, shared, and infrastructure',
      fromLayer: 'infrastructure',
      allowedLayers: ['domain', 'shared', 'infrastructure'],
    },
    // Presentation layer dependencies
    {
      kind: 'allowed-layer-import',
      id: 'presentation-dependencies',
      title: 'Presentation Layer Dependencies',
      description: 'Presentation layer can import from application, domain, and shared',
      fromLayer: 'presentation',
      allowedLayers: ['application', 'domain', 'shared', 'presentation'],
    },
    // Shared layer isolation
    {
      kind: 'allowed-layer-import',
      id: 'shared-isolation',
      title: 'Shared Layer Isolation',
      description: 'Shared layer can only import from domain and shared',
      fromLayer: 'shared',
      allowedLayers: ['domain', 'shared'],
    },
    // Keep domain files modular
    {
      kind: 'max-dependencies',
      id: 'max-deps-domain',
      title: 'Max Dependencies in Domain',
      description: 'Domain files should have at most 10 dependencies to maintain modularity',
      maxDependencies: 10,
      layer: 'domain',
    },
    // Global dependency limit
    {
      kind: 'max-dependencies',
      id: 'max-deps-global',
      title: 'Max Dependencies Global',
      description: 'No file should have more than 20 dependencies',
      maxDependencies: 20,
    },
  ],
};
