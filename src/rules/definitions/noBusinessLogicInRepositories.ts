import type { RuleDefinition } from '../../types/rules';

export const noBusinessLogicInRepositoriesRule: RuleDefinition = {
  id: 'no-business-logic-in-repositories',
  label: 'Repository layer must not contain business logic',
  kind: 'semantic',
  defaultSeverity: 'error',
  description:
    'Repositories should only handle persistence and querying logic — no domain rules, validation, or computations.',
  defaultConfig: {
    repositoryLayers: ['repositories', 'persistence'],
    detectKeywords: ['discount', 'calculate', 'evaluate', 'applyRule'],
  },
  tags: ['dao-pattern', 'clean-architecture'],
  aiAssisted: true,
};
