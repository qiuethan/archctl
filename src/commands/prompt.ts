import type { ParsedArgs } from '../types';
import { findConfigFile, loadConfig } from '../config/loader';

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
  const configPath = findConfigFile();

  if (!configPath) {
    console.error('No architecture.config.json found. Run `archctl init` first.');
    process.exit(1);
  }

  console.log(`Found config at: ${configPath}`);

  try {
    const config = loadConfig(configPath);
    console.log(`Loaded config: ${config.name}`);

    console.log('\n⚠️  Prompt command is not yet implemented.');
    console.log('\nPlanned features:');
    console.log('  - Generate architecture-aware AI prompts');
    console.log('  - Include layer definitions and constraints');
    console.log('  - Add relevant code patterns and examples');
    console.log('  - Support multiple prompt templates');
    console.log('  - Copy to clipboard or save to file');

    // TODO: Implement prompt generation
    // const promptType = args.type || 'feature';
    // const prompt = generatePrompt(config, promptType, args);
    // console.log('\n--- Generated Prompt ---\n');
    // console.log(prompt);
    // if (args.copy) {
    //   copyToClipboard(prompt);
    // }
  } catch (error) {
    console.error('Failed to load config:', error);
    process.exit(1);
  }
}
