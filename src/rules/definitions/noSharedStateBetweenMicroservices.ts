import type { RuleDefinition } from '../../types/rules';

export const noSharedStateBetweenMicroservicesRule: RuleDefinition = {
  id: 'no-shared-state-between-microservices',
  label: 'Microservices must communicate only via external contracts',
  kind: 'dependency',
  defaultSeverity: 'error',
  description:
    'Microservices should not share in-memory state or directly access each other’s repositories. Communication should happen via APIs, messaging, or events.',
  defaultConfig: {
    serviceRootGlob: 'src/services/*',
    forbiddenImportPatterns: ['*/repositories/**', '*/persistence/**'],
  },
  tags: ['microservices', 'separation'],
};
