import type { ArchctlConfig, ProjectRule } from '../types';
import { TEMPLATES, getTemplateById } from '../templates';
import { RULES_BY_ID } from '../rules';

/**
 * Application service for initialization logic
 * Contains business logic for creating and configuring archctl projects
 */

export interface InitConfig {
  projectName: string;
  entryPoint: string;
  templateId?: string;
}

/**
 * Create a custom configuration (no template)
 */
export function createCustomConfig(projectName: string, entryPoint: string): ArchctlConfig {
  const config: ArchctlConfig = {
    name: projectName,
    layers: [],
    layerMappings: [],
    rules: [],
  };

  if (entryPoint) {
    config.entryPoint = entryPoint;
  }

  return config;
}

/**
 * Create configuration from a template
 */
export function createConfigFromTemplate(
  projectName: string,
  templateId: string,
  entryPoint: string,
): ArchctlConfig {
  const template = getTemplateById(templateId);

  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Convert template rules to project rules
  const rules: ProjectRule[] = template.rules
    .map((ruleRef) => {
      const ruleDef = RULES_BY_ID[ruleRef.ruleId];
      if (!ruleDef) {
        console.warn(`Warning: Rule "${ruleRef.ruleId}" not found in rule library`);
        return null;
      }

      const projectRule: ProjectRule = {
        id: ruleRef.ruleId,
        kind: ruleDef.kind,
        enabled: ruleRef.enabled ?? true,
        severity: ruleRef.severityOverride ?? ruleDef.defaultSeverity,
        description: ruleDef.description,
        config: {
          ...ruleDef.defaultConfig,
          ...(ruleRef.configOverride ?? {}),
        },
        sourceRuleId: ruleDef.id,
        sourceTemplateId: template.id,
      };
      return projectRule;
    })
    .filter((rule): rule is ProjectRule => rule !== null);

  const config: ArchctlConfig = {
    name: projectName,
    layers: template.layers.map((layer) => ({
      name: layer.name,
      description: layer.description,
    })),
    layerMappings: [],
    rules,
  };

  if (entryPoint) {
    config.entryPoint = entryPoint;
  }

  return config;
}

/**
 * Get all available templates
 */
export function getAvailableTemplates() {
  return TEMPLATES;
}
