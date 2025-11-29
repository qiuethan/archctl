import * as fs from 'fs';
import * as path from 'path';
import { getOutDir, ensureDir } from '../utils/fs';
import type { ParsedArgs, ArchConfig } from '../types';

/**
 * Initialize a new architecture configuration
 * Creates the output directory and a skeleton architecture.config.json
 */
export function cmdInit(args: ParsedArgs): void {
  const outDir = getOutDir(args);

  ensureDir(outDir);

  const configPath = path.join(outDir, 'architecture.config.json');

  if (fs.existsSync(configPath) && !args.force) {
    console.error(
      `${configPath} already exists. Use --force to overwrite or choose a different --out directory.`
    );
    process.exit(1);
  }

  const initialConfig: ArchConfig = {
    name: 'My Architecture',
    language: '',
    framework: '',
    testing: '',
    layers: [],
    rules: [],
  };

  fs.writeFileSync(configPath, JSON.stringify(initialConfig, null, 2), 'utf-8');

  console.log(`✓ Initialized architecture config at: ${configPath}`);
  console.log('\nNext steps:');
  console.log('  1. Edit the config to define your architecture layers');
  console.log('  2. Add rules to enforce architectural constraints');
  console.log('  3. Run `archctl lint` to check your codebase');
}
