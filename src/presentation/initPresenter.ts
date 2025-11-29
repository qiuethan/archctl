import { messages } from '../utils/messages';

/**
 * Presentation layer for init command
 * Handles all formatting and display logic
 */

/**
 * Display welcome message
 */
export function displayWelcome(): void {
  console.log(messages.init.welcome);
}

/**
 * Display config already exists error
 */
export function displayConfigExists(configPath: string): void {
  console.error(`${configPath} ${messages.init.alreadyExists}`);
}

/**
 * Display success message
 */
export function displayInitSuccess(configPath: string): void {
  console.log(`\n${messages.init.success} ${configPath}`);
  console.log(messages.init.nextStepsHeader);
  messages.init.nextSteps.forEach((step) => console.log(step));
}
