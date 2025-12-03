import type { TemplateDefinition } from '../../types/templates';

/**
 * DDD Microservices Template
 *
 * Domain-Driven Design applied to microservices architecture with strict
 * bounded contexts, aggregates, and event-driven communication patterns.
 * Emphasizes strategic and tactical DDD patterns.
 */
export const dddMicroservicesTemplate: TemplateDefinition = {
  id: 'ddd-microservices',
  label: 'DDD Microservices',
  description:
    'Domain-Driven Design with bounded contexts, aggregates, domain events, and anti-corruption layers.',

  layers: [
    {
      name: 'domain',
      description: 'Aggregates, entities, value objects, domain events, and domain services',
    },
    {
      name: 'application',
      description:
        'Application services, command handlers, query handlers, and use case orchestration',
    },
    {
      name: 'infrastructure',
      description: 'Repositories, event publishers, message brokers, and external service adapters',
    },
    {
      name: 'api',
      description: 'API contracts, REST endpoints, GraphQL resolvers, and anti-corruption layers',
    },
  ],

  capabilities: [
    {
      type: 'network',
      imports: ['axios', 'node-fetch', 'http', 'https'],
      calls: ['fetch', 'axios.get', 'axios.post'],
      description: 'HTTP requests and API calls',
    },
    {
      type: 'database',
      imports: ['pg', 'mongodb', 'typeorm', 'prisma'],
      calls: ['query', 'find', 'save', 'create', 'update'],
      description: 'Database operations',
    },
    {
      type: 'messaging',
      imports: ['amqplib', 'kafkajs', 'redis'],
      calls: ['publish', 'subscribe', 'sendToQueue'],
      description: 'Message broker and event bus operations',
    },
  ],

  rules: [
    // Domain layer isolation - pure domain model
    {
      kind: 'allowed-layer-import' as const,
      id: 'domain-isolation',
      title: 'Domain Model Purity',
      description:
        'Domain layer must be technology-agnostic and only reference other domain components',
      fromLayer: 'domain',
      allowedLayers: ['domain'],
    },
    // Application layer dependencies
    {
      kind: 'allowed-layer-import' as const,
      id: 'application-dependencies',
      title: 'Application Service Dependencies',
      description:
        'Application services orchestrate domain logic and define infrastructure interfaces',
      fromLayer: 'application',
      allowedLayers: ['domain', 'application'],
    },
    // Infrastructure layer dependencies
    {
      kind: 'allowed-layer-import' as const,
      id: 'infrastructure-dependencies',
      title: 'Infrastructure Implementation',
      description:
        'Infrastructure implements repository and adapter interfaces defined by application layer',
      fromLayer: 'infrastructure',
      allowedLayers: ['domain', 'application', 'infrastructure'],
    },
    // API layer dependencies
    {
      kind: 'allowed-layer-import' as const,
      id: 'api-dependencies',
      title: 'API Boundary Dependencies',
      description: 'API layer translates external requests to application commands and queries',
      fromLayer: 'api',
      allowedLayers: ['application', 'api'],
    },
    // Aggregate boundaries
    {
      kind: 'max-dependencies' as const,
      id: 'max-deps-domain',
      title: 'Aggregate Complexity Limit',
      description: 'Domain aggregates should be small and focused with minimal dependencies',
      maxDependencies: 6,
      layer: 'domain',
    },
    // Service complexity limit
    {
      kind: 'max-dependencies' as const,
      id: 'max-deps-global',
      title: 'Service Complexity Limit',
      description: 'Services should maintain reasonable complexity for microservice architecture',
      maxDependencies: 12,
    },
    // Prevent circular dependencies
    {
      kind: 'cyclic-dependency' as const,
      id: 'no-cyclic-dependencies',
      title: 'No Circular Dependencies',
      description:
        'Circular dependencies indicate improper aggregate boundaries and must be resolved',
    },
    // Domain must not depend on infrastructure
    {
      kind: 'forbidden-layer-import' as const,
      id: 'domain-no-infrastructure',
      title: 'Domain Infrastructure Independence',
      description: 'Domain model must not depend on infrastructure to maintain portability',
      fromLayer: 'domain',
      toLayer: 'infrastructure',
    },
    // Domain must not depend on API
    {
      kind: 'forbidden-layer-import' as const,
      id: 'domain-no-api',
      title: 'Domain API Independence',
      description:
        'Domain model must not depend on API layer to maintain bounded context integrity',
      fromLayer: 'domain',
      toLayer: 'api',
    },
    // Domain layer purity
    {
      kind: 'forbidden-capability' as const,
      id: 'domain-no-io',
      title: 'Domain Model Purity',
      description: 'Domain model must be pure - no I/O, network, database, or messaging operations',
      forbiddenCapabilities: ['network', 'database', 'messaging'],
      layer: 'domain',
    },
    // Infrastructure capabilities
    {
      kind: 'allowed-capability' as const,
      id: 'infrastructure-capabilities',
      title: 'Infrastructure Capabilities',
      description: 'Infrastructure can perform database, messaging, and network operations',
      allowedCapabilities: ['network', 'database', 'messaging'],
      layer: 'infrastructure',
    },
  ],
};
