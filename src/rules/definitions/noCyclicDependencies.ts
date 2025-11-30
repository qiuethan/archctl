import type { RuleDefinition } from '../../types/rules';

export const noCyclicDependenciesRule: RuleDefinition = {
  id: 'no-cyclic-dependencies',
  label: 'No cyclic dependencies between modules',
  kind: 'dependency',
  defaultSeverity: 'error',
  description:
    'Modules/packages must not import each other in a way that causes circular dependency at runtime or build time.',
  defaultConfig: {
    enforceCycleDetection: true,
  },
  tags: ['clean-code', 'build-stability'],
};
