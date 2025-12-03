import type { TemplateDefinition } from '../../types/templates';

/**
 * Clean Architecture Template
 *
 * Implements Clean Architecture pattern with clear layer separation
 * and dependency rules flowing inward toward the domain core.
 * Based on hexagonal architecture principles with ports and adapters.
 */
export const cleanArchitectureTemplate: TemplateDefinition = {
  id: 'clean-architecture',
  label: 'Clean Architecture',
  description:
    'Clean Architecture with domain-centric layers, dependency inversion, and strict boundary enforcement.',

  layers: [
    {
      name: 'domain',
      description:
        'Core business logic: entities, value objects, domain services, and business rules',
    },
    {
      name: 'application',
      description: 'Use cases and application services that orchestrate domain logic',
    },
    {
      name: 'infrastructure',
      description:
        'External concerns: database, file system, external APIs, and third-party services',
    },
    {
      name: 'presentation',
      description: 'User interface adapters: controllers, views, API endpoints, and DTOs',
    },
  ],

  capabilities: [
    {
      type: 'network',
      imports: ['axios', 'node-fetch', 'http', 'https'],
      calls: ['fetch', 'axios.get', 'axios.post', 'axios.put', 'axios.delete'],
      description: 'HTTP requests and network operations',
    },
    {
      type: 'filesystem',
      imports: ['fs', 'fs/promises', 'fs-extra'],
      calls: ['readFile', 'writeFile', 'readFileSync', 'writeFileSync', 'existsSync'],
      description: 'File system read/write operations',
    },
    {
      type: 'database',
      imports: ['pg', 'mysql', 'mongodb', 'typeorm', 'prisma'],
      calls: ['query', 'execute', 'find', 'save', 'create', 'update', 'delete'],
      description: 'Database queries and operations',
    },
    {
      type: 'process',
      imports: ['child_process'],
      calls: ['exec', 'execSync', 'spawn', 'fork'],
      description: 'Process spawning and system calls',
    },
  ],

  rules: [
    // Domain layer isolation - pure business logic
    {
      kind: 'allowed-layer-import' as const,
      id: 'domain-isolation',
      title: 'Domain Layer Isolation',
      description: 'Domain layer must remain pure and only reference other domain components',
      fromLayer: 'domain',
      allowedLayers: ['domain'],
    },
    // Application layer dependencies
    {
      kind: 'allowed-layer-import' as const,
      id: 'application-dependencies',
      title: 'Application Layer Dependencies',
      description:
        'Application layer orchestrates domain logic and may depend on infrastructure interfaces',
      fromLayer: 'application',
      allowedLayers: ['domain', 'application'],
    },
    // Infrastructure layer dependencies
    {
      kind: 'allowed-layer-import' as const,
      id: 'infrastructure-dependencies',
      title: 'Infrastructure Layer Dependencies',
      description:
        'Infrastructure implements domain interfaces and may reference application layer',
      fromLayer: 'infrastructure',
      allowedLayers: ['domain', 'application', 'infrastructure'],
    },
    // Presentation layer dependencies
    {
      kind: 'allowed-layer-import' as const,
      id: 'presentation-dependencies',
      title: 'Presentation Layer Dependencies',
      description: 'Presentation layer adapts external requests to application use cases',
      fromLayer: 'presentation',
      allowedLayers: ['application', 'presentation'],
    },
    // Keep domain files focused
    {
      kind: 'max-dependencies' as const,
      id: 'max-deps-domain',
      title: 'Domain Layer Modularity',
      description:
        'Domain files should have minimal dependencies to maintain single responsibility',
      maxDependencies: 8,
      layer: 'domain',
    },
    // Global dependency limit
    {
      kind: 'max-dependencies' as const,
      id: 'max-deps-global',
      title: 'Global Dependency Limit',
      description: 'Files should not exceed reasonable dependency counts to maintain testability',
      maxDependencies: 15,
    },
    // Prevent circular dependencies
    {
      kind: 'cyclic-dependency' as const,
      id: 'no-cyclic-dependencies',
      title: 'No Circular Dependencies',
      description:
        'Circular dependencies violate clean architecture principles and must be eliminated',
    },
    // Domain must not depend on presentation
    {
      kind: 'forbidden-layer-import' as const,
      id: 'domain-no-ui-awareness',
      title: 'Domain Independence from UI',
      description: 'Domain layer must not have any knowledge of presentation or UI concerns',
      fromLayer: 'domain',
      toLayer: 'presentation',
    },
    // Domain must not depend on infrastructure
    {
      kind: 'forbidden-layer-import' as const,
      id: 'domain-no-infrastructure',
      title: 'Domain Independence from Infrastructure',
      description: 'Domain layer must not directly depend on infrastructure implementations',
      fromLayer: 'domain',
      toLayer: 'infrastructure',
    },
    // Domain layer purity - no I/O capabilities
    {
      kind: 'forbidden-capability' as const,
      id: 'domain-no-io',
      title: 'Domain Layer Purity',
      description: 'Domain layer must be pure - no I/O, network, or database operations',
      forbiddenCapabilities: ['network', 'filesystem', 'database', 'process'],
      layer: 'domain',
    },
    // Infrastructure layer capabilities
    {
      kind: 'allowed-capability' as const,
      id: 'infrastructure-capabilities',
      title: 'Infrastructure Layer Capabilities',
      description: 'Infrastructure can perform I/O, network, and database operations',
      allowedCapabilities: ['network', 'filesystem', 'database', 'process'],
      layer: 'infrastructure',
    },
  ],
};
