import * as fs from 'fs';
import * as path from 'path';
import { getOutDir, ensureDir } from '../utils/fs';

export function cmdInit(args: Record<string, any>) {
  const outDir = getOutDir(args);

  ensureDir(outDir);

  const configPath = path.join(outDir, 'architecture.config.json');

  if (fs.existsSync(configPath) && !args.force) {
    console.error(
      `${configPath} already exists. Use --force to overwrite or choose a different --out directory.`
    );
    process.exit(1);
  }

  const initialConfig = {
    name: 'My Architecture',
    language: '',
    framework: '',
    testing: '',
    layers: [],
    rules: []
  };

  fs.writeFileSync(
    configPath,
    JSON.stringify(initialConfig, null, 2),
    'utf-8'
  );

  console.log(`Initialized architecture config at: ${configPath}`);
}
