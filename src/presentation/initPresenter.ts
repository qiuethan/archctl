import { messages } from '../utils/messages';
import { colors } from '../utils/colors';

/**
 * Presentation layer for init command
 * Handles all formatting and display logic
 */

/**
 * Display welcome message
 */
export function displayWelcome(): void {
  console.log(colors.bold.cyan(messages.init.welcome));
}

/**
 * Display config already exists error
 */
export function displayConfigExists(configPath: string): void {
  console.error(
    `${colors.symbols.error} ${colors.path(configPath)} ${colors.error(messages.init.alreadyExists)}`
  );
  console.log(`${colors.dim('Use')} ${colors.code('--force')} ${colors.dim('to overwrite.')}`);
}

/**
 * Display success message
 */
export function displayInitSuccess(configPath: string): void {
  console.log(
    `\n${colors.symbols.check} ${colors.success.bold(messages.init.success)} ${colors.path(configPath)}`
  );
  console.log(`\n${colors.bold(messages.init.nextStepsHeader)}`);
  messages.init.nextSteps.forEach((step, index) => {
    console.log(`  ${colors.primary((index + 1).toString() + '.')} ${colors.dim(step)}`);
  });
}
