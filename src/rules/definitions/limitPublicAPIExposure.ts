import type { RuleDefinition } from '../../types/rules';

export const limitPublicAPIExposureRule: RuleDefinition = {
  id: 'limit-public-api-exposure',
  label: 'Only approved contracts should be public API',
  kind: 'semantic',
  defaultSeverity: 'warning',
  description:
    'A module should only expose its defined interface. Extra public exports may indicate leaking implementation details across boundaries.',
  defaultConfig: {
    enforceIndexFiles: true,
    allowedPublicFolders: ['src/public', 'src/api'],
  },
  tags: ['module-boundary', 'api-design'],
  aiAssisted: true,
};
