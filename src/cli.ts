#!/usr/bin/env node

import { parseArgs } from './utils/args';
import { cmdInit } from './commands/init';
import { cmdSync } from './commands/sync';
import { cmdLint } from './commands/lint';
import { cmdPrompt } from './commands/prompt';
import { cmdLayers } from './commands/layers';
import { cmdRules } from './commands/rules';
import { cmdContexts } from './commands/contexts';
import * as presenter from './presentation/cliPresenter';

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
      await cmdLint(args);
      break;

    case 'prompt':
      cmdPrompt(args);
      break;

    case 'layers':
      cmdLayers(args);
      break;

    case 'contexts':
      cmdContexts(args);
      break;

    case 'rules':
      cmdRules(args);
      break;

    case undefined:
    case '-h':
    case '--help':
    case 'help':
      presenter.displayHelp();
      break;

    case '-v':
    case '--version':
    case 'version':
      presenter.displayVersion();
      break;

    default:
      presenter.displayUnknownCommand(cmd);
      presenter.displayHelp();
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('Error:', message);
  process.exit(1);
});
