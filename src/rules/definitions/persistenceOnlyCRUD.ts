import type { RuleDefinition } from '../../types/rules';

export const persistenceOnlyCRUDRule: RuleDefinition = {
  id: 'persistence-only-crud',
  label: 'Persistence layer should expose only CRUD operations',
  kind: 'semantic',
  defaultSeverity: 'warning',
  description:
    'Database, storage, and ORM adapters should expose simple CRUD operations and not embed domain/business logic.',
  defaultConfig: {
    allowedMethodPrefixes: ['create', 'read', 'get', 'update', 'delete'],
    bannedKeywords: ['process', 'business', 'applyRule'],
  },
  tags: ['ddd', 'anti-pattern'],
};
