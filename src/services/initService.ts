import type { ArchctlConfig } from '../types';
import { TEMPLATES, getTemplateById } from '../templates';
import { constants } from '../utils/constants';

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
    exclude: [
      'node_modules',
      '.git',
      'dist',
      'build',
      'target',
      constants.defaultOutDir,
      'coverage',
    ],
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
  entryPoint: string
): ArchctlConfig {
  const template = getTemplateById(templateId);

  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Templates now provide concrete RuleConfig objects directly
  const config: ArchctlConfig = {
    name: projectName,
    exclude: [
      'node_modules',
      '.git',
      'dist',
      'build',
      'target',
      constants.defaultOutDir,
      'coverage',
    ],
    layers: template.layers.map((layer) => ({
      name: layer.name,
      description: layer.description,
    })),
    layerMappings: [],
    rules: template.rules, // Direct copy of RuleConfig objects
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
