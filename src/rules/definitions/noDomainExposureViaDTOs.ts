import type { RuleDefinition } from '../../types/rules';

export const noDomainExposureViaDTOsRule: RuleDefinition = {
  id: 'no-domain-exposure-via-dtos',
  label: 'DTOs must not expose domain entities directly',
  kind: 'dependency',
  defaultSeverity: 'error',
  description:
    'APIs should communicate via DTOs mapped from domain. Domain entities should not be returned directly across boundaries.',
  defaultConfig: {
    apiLayers: ['controllers', 'api'],
    domainLayers: ['domain'],
    forbidExportDomainModels: true,
  },
  tags: ['api-design', 'ddd'],
};
