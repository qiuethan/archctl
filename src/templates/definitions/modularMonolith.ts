import type { TemplateDefinition } from '../../types/templates';

/**
 * Modular Monolith Template
 *
 * Feature-based vertical slices with clear boundaries and explicit contracts.
 * Provides microservice-like modularity within a single deployable unit,
 * reducing operational complexity while maintaining architectural discipline.
 */
export const modularMonolithTemplate: TemplateDefinition = {
  id: 'modular-monolith',
  label: 'Modular Monolith',
  description: 'Vertical slice architecture with independent feature modules and explicit inter-module contracts.',

  layers: [
    {
      name: 'features',
      description: 'Self-contained feature modules with their own domain, logic, and data access',
    },
    {
      name: 'shared',
      description: 'Shared kernel: common utilities, cross-cutting concerns, and reusable components',
    },
    {
      name: 'api',
      description: 'Public API contracts and routing layer that coordinates feature modules',
    },
  ],

  rules: [
    // Feature module isolation
    {
      kind: 'allowed-layer-import' as const,
      id: 'features-dependencies',
      title: 'Feature Module Isolation',
      description: 'Feature modules should be independent and only depend on the shared kernel',
      fromLayer: 'features',
      allowedLayers: ['shared', 'features'],
    },
    // Shared kernel purity
    {
      kind: 'allowed-layer-import' as const,
      id: 'shared-isolation',
      title: 'Shared Kernel Purity',
      description: 'Shared kernel must not depend on feature modules to prevent coupling',
      fromLayer: 'shared',
      allowedLayers: ['shared'],
    },
    // API coordination layer
    {
      kind: 'allowed-layer-import' as const,
      id: 'api-dependencies',
      title: 'API Coordination Layer',
      description: 'API layer orchestrates feature modules and exposes public contracts',
      fromLayer: 'api',
      allowedLayers: ['features', 'shared', 'api'],
    },
    // Feature cohesion
    {
      kind: 'max-dependencies' as const,
      id: 'max-deps-features',
      title: 'Feature Module Cohesion',
      description: 'Feature modules should be cohesive with focused responsibilities',
      maxDependencies: 10,
      layer: 'features',
    },
    // Overall complexity limit
    {
      kind: 'max-dependencies' as const,
      id: 'max-deps-global',
      title: 'Global Complexity Limit',
      description: 'Files should maintain reasonable complexity for maintainability',
      maxDependencies: 15,
    },
    // Prevent circular dependencies
    {
      kind: 'cyclic-dependency' as const,
      id: 'no-cyclic-dependencies',
      title: 'No Circular Dependencies',
      description: 'Circular dependencies indicate improper module boundaries and must be eliminated',
    },
    // Prevent feature cross-talk
    {
      kind: 'forbidden-layer-import' as const,
      id: 'no-direct-feature-coupling',
      title: 'No Direct Feature Coupling',
      description: 'Features should communicate through events or shared contracts, not direct imports',
      fromLayer: 'features',
      toLayer: 'features',
    },
  ],
};
