import type { RuleDefinition } from '../../types/rules';

export const noFeatureCrossTalkRule: RuleDefinition = {
  id: 'no-feature-crosstalk',
  label: 'Feature modules must not import each other directly',
  kind: 'dependency',
  defaultSeverity: 'warning',
  description:
    'Feature-based modules should only communicate via defined service interfaces or the application layer, not via direct cross-imports.',
  defaultConfig: {
    featureRootGlob: 'src/features/*',
    forbidCrossImports: true,
  },
  tags: ['modular-monolith', 'microservices', 'structure'],
};