import type { RuleDefinition } from '../../types/rules';

export const domainEventsUsageRule: RuleDefinition = {
  id: 'domain-events-usage',
  label: 'Important state changes should emit domain events',
  kind: 'semantic',
  defaultSeverity: 'warning',
  description:
    'When important domain state changes, use Domain Events to notify other parts of the system. Missing events may indicate poor domain modeling.',
  defaultConfig: {
    detectSignificantStateChanges: true,
  },
  tags: ['ddd', 'domain-events'],
  aiAssisted: true,
};
