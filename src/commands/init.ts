import * as fs from 'fs';
import * as path from 'path';
import { input, confirm, select } from '@inquirer/prompts';
import { getOutDir, ensureDir } from '../utils/fs';
import type { ParsedArgs, ArchctlConfig, ProjectRule } from '../types';
import { saveConfig } from '../infrastructure/config/configService';
import { messages } from '../messages';
import { constants } from '../constants';
import { TEMPLATES, getTemplateById } from '../templates';
import { RULES_BY_ID } from '../rules';

/**
 * Initialize a new architecture configuration
 * Interactive process to set up archctl.config.json
 */
export async function cmdInit(args: ParsedArgs): Promise<void> {
  console.log(messages.init.welcome);

  const outDir = getOutDir(args);
  ensureDir(outDir);

  const configPath = path.join(outDir, constants.configFileName);

  // Check if config already exists
  if (fs.existsSync(configPath) && !args.force) {
    console.error(`${configPath} ${messages.init.alreadyExists}`);
    process.exit(1);
  }

  // Step 1: Project name
  const projectName = await input({
    message: messages.init.prompts.projectName,
    default: messages.init.defaultConfigName,
  });

  // Step 2: Template selection
  const useTemplate = await confirm({
    message: messages.init.prompts.useTemplate,
    default: true,
  });

  let config: ArchctlConfig;

  if (useTemplate) {
    // Build template choices
    const templateChoices = [
      ...TEMPLATES.map((template) => ({
        name: `${template.label} - ${template.description}`,
        value: template.id,
        description: template.description,
      })),
      {
        name: messages.init.prompts.customSetup,
        value: 'none',
        description: messages.init.templateDescriptions.none,
      },
    ];

    const selectedTemplateId = await select({
      message: messages.init.prompts.selectTemplate,
      choices: templateChoices,
    });

    if (selectedTemplateId === 'none') {
      // Custom setup
      config = await createCustomConfig(projectName);
    } else {
      // Use template
      config = await createConfigFromTemplate(projectName, selectedTemplateId);
    }
  } else {
    // Custom setup
    config = await createCustomConfig(projectName);
  }

  // Write config file
  saveConfig(configPath, config);

  console.log(`\n${messages.init.success} ${configPath}`);
  console.log(messages.init.nextStepsHeader);
  messages.init.nextSteps.forEach((step) => console.log(step));
}

/**
 * Create a custom configuration by prompting for details
 */
async function createCustomConfig(projectName: string): Promise<ArchctlConfig> {
  return {
    name: projectName,
    layers: [],
    layerMappings: [],
    rules: [],
  };
}

/**
 * Create configuration from a template
 */
async function createConfigFromTemplate(
  projectName: string,
  templateId: string,
): Promise<ArchctlConfig> {
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

  return {
    name: projectName,
    layers: template.layers.map((layer) => ({
      name: layer.name,
      description: layer.description,
    })),
    layerMappings: [],
    rules,
  };
}
