import { select, input, confirm } from '@inquirer/prompts';
import type { ParsedArgs } from '../types';
import type { RuleConfig } from '../types/config';
import * as configService from '../services/configService';
import * as ruleService from '../services/ruleService';
import * as presenter from '../presentation/rulesPresenter';

/**
 * Main entry point for rules command
 */
export function cmdRules(args: ParsedArgs): void {
  const subcommand = args._?.[0];

  switch (subcommand) {
    case 'list':
      cmdRulesList(args);
      break;

    case 'add':
      cmdRulesAdd(args);
      break;

    case 'remove':
      cmdRulesRemove(args);
      break;

    default:
      presenter.displayUnknownSubcommand(subcommand);
      process.exit(1);
  }
}

/**
 * List all rules
 */
function cmdRulesList(args: ParsedArgs): void {
  const configPath = configService.findConfig();

  if (!configPath) {
    presenter.displayConfigNotFound();
    process.exit(1);
  }

  const config = configService.loadConfig(configPath);
  presenter.displayRulesList(config.rules);
}

/**
 * Add a custom rule interactively
 */
async function cmdRulesAdd(args: ParsedArgs): Promise<void> {
  const configPath = configService.findConfig();

  if (!configPath) {
    presenter.displayConfigNotFound();
    process.exit(1);
  }

  const config = configService.loadConfig(configPath);

  console.log('🔧 Add a custom architecture rule\n');

  // Select rule type
  const ruleKinds = ruleService.getAvailableRuleKinds();
  const ruleKind = await select({
    message: 'What type of rule do you want to add?',
    choices: ruleKinds.map((k: { value: string; name: string; description: string }) => ({
      name: `${k.name} - ${k.description}`,
      value: k.value,
    })),
  });

  // Get rule ID
  const id = await input({
    message: 'Rule ID (e.g., "my-custom-rule"):',
    validate: (value) => {
      if (!value) return 'Rule ID is required';
      if (config.rules.some((r) => r.id === value)) {
        return `Rule with ID "${value}" already exists`;
      }
      return true;
    },
  });

  // Get rule title
  const title = await input({
    message: 'Rule title:',
    validate: (value) => (value ? true : 'Title is required'),
  });

  // Get rule description
  const description = await input({
    message: 'Rule description:',
    validate: (value) => (value ? true : 'Description is required'),
  });

  let ruleConfig: RuleConfig;

  // Get rule-specific configuration
  switch (ruleKind) {
    case 'forbidden-layer-import': {
      const fromLayer = await select({
        message: 'From layer:',
        choices: config.layers.map((l) => ({ name: l.name, value: l.name })),
      });

      const toLayer = await select({
        message: 'To layer (forbidden):',
        choices: config.layers.map((l) => ({ name: l.name, value: l.name })),
      });

      ruleConfig = {
        kind: 'forbidden-layer-import',
        id,
        title,
        description,
        fromLayer,
        toLayer,
      };
      break;
    }

    case 'allowed-layer-import': {
      const fromLayer = await select({
        message: 'From layer:',
        choices: config.layers.map((l) => ({ name: l.name, value: l.name })),
      });

      const allowedLayersInput = await input({
        message: 'Allowed layers (comma-separated):',
        validate: (value) => (value ? true : 'At least one layer is required'),
      });

      const allowedLayers = allowedLayersInput.split(',').map((l) => l.trim());

      ruleConfig = {
        kind: 'allowed-layer-import',
        id,
        title,
        description,
        fromLayer,
        allowedLayers,
      };
      break;
    }

    case 'file-pattern-layer': {
      const pattern = await input({
        message: 'File pattern (glob, e.g., "**/*Repository.ts"):',
        validate: (value) => (value ? true : 'Pattern is required'),
      });

      const requiredLayer = await select({
        message: 'Required layer:',
        choices: config.layers.map((l) => ({ name: l.name, value: l.name })),
      });

      ruleConfig = {
        kind: 'file-pattern-layer',
        id,
        title,
        description,
        pattern,
        requiredLayer,
      };
      break;
    }

    case 'max-dependencies': {
      const maxDependencies = await input({
        message: 'Maximum dependencies:',
        validate: (value) => {
          const num = parseInt(value, 10);
          if (isNaN(num) || num < 1) return 'Must be a positive number';
          return true;
        },
      });

      const applyToLayer = await confirm({
        message: 'Apply to specific layer only?',
        default: false,
      });

      let layer: string | undefined;
      if (applyToLayer) {
        layer = await select({
          message: 'Which layer:',
          choices: config.layers.map((l) => ({ name: l.name, value: l.name })),
        });
      }

      ruleConfig = {
        kind: 'max-dependencies',
        id,
        title,
        description,
        maxDependencies: parseInt(maxDependencies, 10),
        ...(layer && { layer }),
      };
      break;
    }

    case 'cyclic-dependency': {
      ruleConfig = {
        kind: 'cyclic-dependency',
        id,
        title,
        description,
      };
      break;
    }

    default:
      console.error('Unknown rule kind');
      process.exit(1);
  }

  // Add rule via service
  try {
    const addedRule = ruleService.addRule(config, { ruleConfig });
    
    // Save config
    configService.saveConfig(configPath, config);
    
    // Display success
    presenter.displayRuleAdded(addedRule, configPath);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

/**
 * Remove a rule
 */
function cmdRulesRemove(args: ParsedArgs): void {
  const configPath = configService.findConfig();

  if (!configPath) {
    presenter.displayConfigNotFound();
    process.exit(1);
  }

  const config = configService.loadConfig(configPath);

  const ruleId = args.id as string | undefined;

  if (!ruleId) {
    console.error('Error: Must provide --id <rule-id>');
    process.exit(1);
  }

  try {
    ruleService.removeRule(config, ruleId);
    
    // Save config
    configService.saveConfig(configPath, config);
    
    // Display success
    presenter.displayRuleRemoved(ruleId, configPath);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}
