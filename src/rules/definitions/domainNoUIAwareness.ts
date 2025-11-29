import type { RuleDefinition } from '../../types/rules';

export const domainNoUIAwarenessRule: RuleDefinition = {
  id: 'domain-no-ui-awareness',
  label: 'Domain must not depend on UI',
  kind: 'dependency',
  defaultSeverity: 'error',
  description:
    'The Domain layer must not reference UI-related code. Domain should be UI-agnostic.',
  defaultConfig: {
    fromLayers: ['domain'],
    toLayersForbidden: ['ui', 'presentation'],
  },
  tags: ['ddd', 'clean-architecture', 'dependency'],
};
