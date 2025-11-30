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

  layers: [
    {
      name: 'features',
      description: 'Independent feature modules',
    },
    {
      name: 'shared',
      description: 'Shared utilities and common code',
    },
    {
      name: 'api',
      description: 'REST/GraphQL API layer',
    },
  ],

  rules: [
    // Features can only import from shared and themselves
    {
      kind: 'allowed-layer-import' as const,
      id: 'features-dependencies',
      title: 'Feature Module Dependencies',
      description: 'Feature modules can only import from shared layer and themselves',
      fromLayer: 'features',
      allowedLayers: ['shared', 'features'],
    },
    // Shared layer isolation
    {
      kind: 'allowed-layer-import' as const,
      id: 'shared-isolation',
      title: 'Shared Layer Isolation',
      description: 'Shared layer can only import from shared',
      fromLayer: 'shared',
      allowedLayers: ['shared'],
    },
    // API layer dependencies
    {
      kind: 'allowed-layer-import' as const,
      id: 'api-dependencies',
      title: 'API Layer Dependencies',
      description: 'API layer can import from features and shared',
      fromLayer: 'api',
      allowedLayers: ['features', 'shared', 'api'],
    },
    // Keep modules small
    {
      kind: 'max-dependencies' as const,
      id: 'max-deps-features',
      title: 'Max Dependencies in Features',
      description: 'Feature files should have at most 12 dependencies',
      maxDependencies: 12,
      layer: 'features',
    },
    // Global dependency limit
    {
      kind: 'max-dependencies' as const,
      id: 'max-deps-global',
      title: 'Max Dependencies Global',
      description: 'No file should have more than 20 dependencies',
      maxDependencies: 20,
    },
    // Detect circular dependencies
    {
      kind: 'cyclic-dependency' as const,
      id: 'no-cyclic-dependencies',
      title: 'No Cyclic Dependencies',
      description: 'Prevent circular dependencies between files',
    },
  ],
};
