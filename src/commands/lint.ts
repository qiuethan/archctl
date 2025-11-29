import type { ParsedArgs } from '../types';
import * as configService from '../services/configService';
import { messages } from '../utils/messages';

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
  const configPath = configService.findConfig();

  if (!configPath) {
    console.error(messages.common.noConfigFound);
    process.exit(1);
  }

  console.log(`${messages.lint.foundConfig} ${configPath}`);

  try {
    const config = configService.loadConfig(configPath);
    console.log(`${messages.lint.loadedConfig} ${config.name}`);
    console.log(`${messages.lint.rulesDefined} ${config.rules.length}`);

    console.log(`\n${messages.lint.notImplemented}`);
    console.log(messages.lint.plannedFeaturesHeader);
    messages.lint.plannedFeatures.forEach((feature) => console.log(feature));

    // TODO: Implement linting logic
    // const violations = checkRules(config, args);
    // reportViolations(violations);
    // if (violations.some(v => v.severity === 'error')) {
    //   process.exit(1);
    // }
  } catch (error) {
    console.error(`${messages.common.failedToLoadConfig}`, error);
    process.exit(1);
  }
}
