#!/usr/bin/env node

import { parseArgs } from './utils/args';
import { cmdInit } from './commands/init';
import { cmdSync } from './commands/sync';
import { cmdLint } from './commands/lint';
import { cmdPrompt } from './commands/prompt';

function printHelp() {
  console.log(`archctl – architecture control CLI

Usage:
  archctl <command> [options]

Commands:
  init      Initialize architecture folder and config
  sync      Propagate architecture documentation
  lint      Enforce architecture rules
  prompt    Generate AI prompts with architecture context

Init Options:
  --out       Folder to store architecture files (default: "architecture")
  --force     Overwrite existing architecture.config.json if present

Examples:
  archctl init
  archctl init --out .archctl --force
  archctl sync
  archctl lint
  archctl prompt

For more information, visit: https://github.com/yourusername/archctl
`);
}

async function main() {
  const { cmd, args } = parseArgs();

  switch (cmd) {
    case 'init':
      cmdInit(args);
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
      console.log('archctl v0.1.0');
      break;

    default:
      console.error(`Unknown command: ${cmd}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
