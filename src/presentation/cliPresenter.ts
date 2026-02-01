import { messages } from '../utils/messages';

/**
 * Presentation layer for general CLI output
 * Handles common formatting and display logic
 */

/**
 * Display CLI help
 */
export function displayHelp(): void {
  const { cliName, cliUsage, commands, initOptions, lintOptions, examples, cliMoreInfo } = messages;

  console.log(`${cliName}

Usage:
  ${cliUsage}

Commands:
  ${commands.init.name.padEnd(10)}${commands.init.description}
  ${commands.layers.name.padEnd(10)}${commands.layers.description}
  ${commands.contexts.name.padEnd(10)}${commands.contexts.description}
  ${commands.rules.name.padEnd(10)}${commands.rules.description}
  ${commands.sync.name.padEnd(10)}${commands.sync.description}
  ${commands.lint.name.padEnd(10)}${commands.lint.description}
  ${commands.prompt.name.padEnd(10)}${commands.prompt.description}

Init Options:
  ${initOptions.out.flag.padEnd(12)}${initOptions.out.description}
  ${initOptions.force.flag.padEnd(12)}${initOptions.force.description}

Lint Options:
  ${lintOptions.format.flag.padEnd(18)}${lintOptions.format.description}
  ${lintOptions.output.flag.padEnd(18)}${lintOptions.output.description}
  ${lintOptions['no-cache'].flag.padEnd(18)}${lintOptions['no-cache'].description}
  ${lintOptions['update-baseline'].flag.padEnd(18)}${lintOptions['update-baseline'].description}
  ${lintOptions.ratchet.flag.padEnd(18)}${lintOptions.ratchet.description}

Examples:
  ${examples.init}
  ${examples.initWithOut}
  ${examples.layersList}
  ${examples.layersAdd}
  ${examples.layersMap}
  ${examples.contextsList}
  ${examples.contextsAdd}
  ${examples.contextsVisibility}
  ${examples.sync}
  ${examples.lint}
  ${examples.lintWithBaseline}
  ${examples.lintWithRatchet}
  ${examples.lintHtml}
  ${examples.prompt}

${cliMoreInfo}
`);
}

/**
 * Display version
 */
export function displayVersion(): void {
  console.log(messages.common.version);
}

/**
 * Display unknown command error
 */
export function displayUnknownCommand(cmd: string): void {
  console.error(`${messages.common.unknownCommand} ${cmd}`);
}

/**
 * Display config not found error
 */
export function displayConfigNotFound(): void {
  console.error(messages.common.noConfigFound);
}
