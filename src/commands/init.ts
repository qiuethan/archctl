import * as fs from 'fs';
import * as path from 'path';
import { input, confirm, select } from '@inquirer/prompts';
import { getOutDir, ensureDir } from '../utils/fs';
import { sanitizePathForConfig } from '../utils/path';
import type { ParsedArgs } from '../types';
import * as configService from '../services/configService';
import * as presenter from '../presentation/initPresenter';
import { messages } from '../utils/messages';
import { constants } from '../utils/constants';
import * as initService from '../services/initService';

/**
 * Initialize a new architecture configuration
 * Interactive process to set up archctl.config.json
 */
export async function cmdInit(args: ParsedArgs): Promise<void> {
  presenter.displayWelcome();

  const outDir = getOutDir(args);
  ensureDir(outDir);

  const configPath = path.join(outDir, constants.configFileName);

  // Check if config already exists
  if (fs.existsSync(configPath) && !args.force) {
    presenter.displayConfigExists(configPath);
    process.exit(1);
  }

  // Step 1: Project name
  const projectName = await input({
    message: messages.init.prompts.projectName,
    default: messages.init.defaultConfigName,
  });

  // Step 2: Entry point
  const entryPointInput = await input({
    message: messages.init.prompts.entryPoint,
    default: '',
  });

  // Sanitize entry point path if provided
  const entryPoint = entryPointInput.trim() 
    ? sanitizePathForConfig(entryPointInput.trim(), process.cwd())
    : '';

  // Step 3: Template selection
  const useTemplate = await confirm({
    message: messages.init.prompts.useTemplate,
    default: true,
  });

  let config;

  if (useTemplate) {
    // Build template choices
    const templates = initService.getAvailableTemplates();
    const templateChoices = [
      ...templates.map((template) => ({
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
      config = initService.createCustomConfig(projectName, entryPoint);
    } else {
      // Use template
      config = initService.createConfigFromTemplate(projectName, selectedTemplateId, entryPoint);
    }
  } else {
    // Custom setup
    config = initService.createCustomConfig(projectName, entryPoint);
  }

  // Write config file
  configService.saveConfig(configPath, config);

  presenter.displayInitSuccess(configPath);
}

