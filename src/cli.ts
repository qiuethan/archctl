#!/usr/bin/env node

import { parseArgs } from './utils/args';
import { cmdInit } from './commands/init';

function printHelp() {
  console.log(`archctl – architecture control CLI

Usage:
  archctl init [--out architecture] [--force]

Commands:
  init      Initialize architecture folder and empty config.

Options:
  --out       Folder to store architecture files (default: "architecture")
  --force     Overwrite existing architecture.config.json if present

Examples:
  archctl init
  archctl init --out arch
  archctl init --out config/arch --force
`);
}

async function main() {
  const { cmd, args } = parseArgs();

  switch (cmd) {
    case 'init':
      cmdInit(args);
      break;

    case undefined:
    case '-h':
    case '--help':
    case 'help':
      printHelp();
      break;

    default:
      console.error(`Unknown command: ${cmd}`);
      printHelp();
      process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
