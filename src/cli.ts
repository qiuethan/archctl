#!/usr/bin/env node

import { parseArgs } from './utils/args';
import { cmdInit } from './commands/init';
import { cmdSync } from './commands/sync';
import { cmdLint } from './commands/lint';
import { cmdPrompt } from './commands/prompt';
import { cmdLayers } from './commands/layers';
import { messages } from './messages';

function printHelp() {
  const { cliName, cliUsage, commands, initOptions, examples, cliMoreInfo } = messages;

  console.log(`${cliName}

Usage:
  ${cliUsage}

Commands:
  ${commands.init.name.padEnd(10)}${commands.init.description}
  ${commands.layers.name.padEnd(10)}${commands.layers.description}
  ${commands.sync.name.padEnd(10)}${commands.sync.description}
  ${commands.lint.name.padEnd(10)}${commands.lint.description}
  ${commands.prompt.name.padEnd(10)}${commands.prompt.description}

Init Options:
  ${initOptions.out.flag.padEnd(12)}${initOptions.out.description}
  ${initOptions.force.flag.padEnd(12)}${initOptions.force.description}

Examples:
  ${examples.init}
  ${examples.initWithOut}
  ${examples.layersList}
  ${examples.layersAdd}
  ${examples.layersMap}
  ${examples.sync}
  ${examples.lint}
  ${examples.prompt}

${cliMoreInfo}
`);
}

async function main() {
  const { cmd, args } = parseArgs();

  switch (cmd) {
    case 'init':
      await cmdInit(args);
      break;

    case 'sync':
      cmdSync(args);
      break;

    case 'lint':
      cmdLint(args);
      break;

    case 'prompt':
      cmdPrompt(args);
      break;

    case 'layers':
      cmdLayers(args);
      break;

    case undefined:
    case '-h':
    case '--help':
    case 'help':
      printHelp();
      break;

    case '-v':
    case '--version':
    case 'version':
      // TODO: Read version from package.json
      console.log(messages.common.version);
      break;

    default:
      console.error(`${messages.common.unknownCommand} ${cmd}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${messages.common.error}`, err.message || err);
  process.exit(1);
});
