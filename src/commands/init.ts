import * as fs from 'fs';
import * as path from 'path';
import { getOutDir, ensureDir } from '../utils/fs';
import type { ParsedArgs, ArchConfig } from '../types';
import { messages } from '../messages';
import { constants } from '../constants';

/**
 * Initialize a new architecture configuration
 * Creates the output directory and a skeleton architecture.config.json
 */
export function cmdInit(args: ParsedArgs): void {
  const outDir = getOutDir(args);

  ensureDir(outDir);

  const configPath = path.join(outDir, constants.configFileName);

  if (fs.existsSync(configPath) && !args.force) {
    console.error(`${configPath} ${messages.init.alreadyExists}`);
    process.exit(1);
  }

  const initialConfig: ArchConfig = {
    name: messages.init.defaultConfigName,
    language: constants.defaultConfig.language,
    framework: constants.defaultConfig.framework,
    testing: constants.defaultConfig.testing,
    layers: [],
    rules: [],
  };

  fs.writeFileSync(configPath, JSON.stringify(initialConfig, null, 2), 'utf-8');

  console.log(`${messages.init.success} ${configPath}`);
  console.log(messages.init.nextStepsHeader);
  messages.init.nextSteps.forEach((step) => console.log(step));
}
