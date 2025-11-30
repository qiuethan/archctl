import type { RuleDefinition } from '../../types/rules';

export const noBusinessLogicInControllersRule: RuleDefinition = {
  id: 'no-business-logic-in-controllers',
  label: 'No business logic in controller layer',
  kind: 'semantic',
  defaultSeverity: 'error',
  description:
    'Controllers should only handle routing/validation and delegate business logic to service or domain layers.',
  defaultConfig: {
    allowedLayersForBusinessLogic: ['domain', 'application', 'services'],
    controllerLayers: ['controllers', 'api'],
  },
  tags: ['domain-driven', 'best-practices'],
  aiAssisted: true,
};
