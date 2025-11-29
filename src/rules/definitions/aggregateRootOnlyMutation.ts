import type { RuleDefinition } from '../../types/rules';

export const aggregateRootOnlyMutationRule: RuleDefinition = {
  id: 'aggregate-root-only-mutation',
  label: 'Only aggregate roots may mutate domain state',
  kind: 'semantic',
  defaultSeverity: 'error',
  description:
    'Domain objects should allow state changes only via defined aggregate roots, not by directly mutating child entities.',
  defaultConfig: {
    detectMutationsOutsideAggregateRoot: true,
  },
  tags: ['ddd', 'domain', 'state-management'],
  aiAssisted: true,
};
