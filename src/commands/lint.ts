import type { ParsedArgs } from '../types';
import { findConfigFile, loadConfig } from '../config/loader';

/**
 * Lint command - enforce architecture rules
 * TODO: Implement linting logic to:
 * - Parse the codebase
 * - Check dependency rules (layer violations)
 * - Check naming conventions
 * - Check file structure rules
 * - Report violations with severity levels
 */
export function cmdLint(args: ParsedArgs): void {
  const configPath = findConfigFile();

  if (!configPath) {
    console.error('No architecture.config.json found. Run `archctl init` first.');
    process.exit(1);
  }

  console.log(`Found config at: ${configPath}`);

  try {
    const config = loadConfig(configPath);
    console.log(`Loaded config: ${config.name}`);
    console.log(`Rules defined: ${config.rules.length}`);

    console.log('\n⚠️  Lint command is not yet implemented.');
    console.log('\nPlanned features:');
    console.log('  - Check layer dependency violations');
    console.log('  - Validate naming conventions');
    console.log('  - Enforce file structure rules');
    console.log('  - Custom rule execution');
    console.log('  - Configurable severity levels');

    // TODO: Implement linting logic
    // const violations = checkRules(config, args);
    // reportViolations(violations);
    // if (violations.some(v => v.severity === 'error')) {
    //   process.exit(1);
    // }
  } catch (error) {
    console.error('Failed to load config:', error);
    process.exit(1);
  }
}
