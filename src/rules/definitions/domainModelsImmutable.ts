import type { RuleDefinition } from '../../types/rules';

export const domainModelsImmutableRule: RuleDefinition = {
  id: 'domain-models-immutable',
  label: 'Domain models must be immutable or validate state changes',
  kind: 'semantic',
  defaultSeverity: 'warning',
  description:
    'Entities and value objects should protect state and enforce invariants. Direct property mutation should be discouraged.',
  defaultConfig: {
    bannedPatterns: ['public set', 'mutable field'],
    preferredChangeMethodPrefixes: ['update', 'apply'],
  },
  tags: ['ddd', 'domain-model'],
  aiAssisted: true,
};
