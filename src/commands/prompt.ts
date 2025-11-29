import type { ParsedArgs } from '../types';
import * as configService from '../services/configService';
import { messages } from '../utils/messages';

/**
 * Prompt command - generate AI prompts with architecture context
 * TODO: Implement prompt generation to:
 * - Load architecture configuration
 * - Build context about layers, rules, and patterns
 * - Generate prompts for AI assistants (ChatGPT, Claude, etc.)
 * - Include relevant code examples and constraints
 * - Support different prompt templates (feature, refactor, debug)
 */
export function cmdPrompt(args: ParsedArgs): void {
  const configPath = configService.findConfig();

  if (!configPath) {
    console.error(messages.common.noConfigFound);
    process.exit(1);
  }

  console.log(`${messages.prompt.foundConfig} ${configPath}`);

  try {
    const config = configService.loadConfig(configPath);
    console.log(`${messages.prompt.loadedConfig} ${config.name}`);

    console.log(`\n${messages.prompt.notImplemented}`);
    console.log(messages.prompt.plannedFeaturesHeader);
    messages.prompt.plannedFeatures.forEach((feature) => console.log(feature));

    // TODO: Implement prompt generation
    // const promptType = args.type || 'feature';
    // const prompt = generatePrompt(config, promptType, args);
    // console.log('\n--- Generated Prompt ---\n');
    // console.log(prompt);
    // if (args.copy) {
    //   copyToClipboard(prompt);
    // }
  } catch (error) {
    console.error(`${messages.common.failedToLoadConfig}`, error);
    process.exit(1);
  }
}
