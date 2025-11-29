import type { RuleDefinition } from '../../types/rules';

export const noInfrastructureToDomainRule: RuleDefinition = {
  id: 'no-infrastructure-to-domain',
  label: 'Infrastructure must not depend directly on Domain',
  kind: 'dependency',
  defaultSeverity: 'error',
  description:
    'Infrastructure (e.g., DB, external APIs) should not import domain core logic directly — dependencies must flow from Domain outward.',
  defaultConfig: {
    fromLayers: ['infrastructure', 'persistence'],
    toLayersForbidden: ['domain'],
  },
  tags: ['clean-architecture', 'dependency', 'layering'],
};
