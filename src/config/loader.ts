import * as fs from 'fs';
import * as path from 'path';
import type { ArchConfig } from '../types';

/**
 * Load and validate architecture.config.json
 * TODO: Add JSON schema validation using ajv or zod
 */
export function loadConfig(configPath: string): ArchConfig {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(content) as ArchConfig;

  // TODO: Add proper validation
  validateConfig(config);

  return config;
}

/**
 * Validate configuration structure
 * TODO: Implement comprehensive validation
 */
function validateConfig(config: ArchConfig): void {
  if (!config.name || typeof config.name !== 'string') {
    throw new Error('Config must have a valid "name" field');
  }

  // TODO: Add more validation rules
  // - Validate layers array
  // - Validate rules array
  // - Check for required fields
  // - Validate rule types and severities
}

/**
 * Find the architecture config file starting from a directory
 * Walks up the directory tree looking for architecture.config.json
 */
export function findConfigFile(startDir: string = process.cwd()): string | null {
  let currentDir = startDir;

  while (true) {
    const configPath = path.join(currentDir, 'architecture.config.json');
    if (fs.existsSync(configPath)) {
      return configPath;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached root
      return null;
    }
    currentDir = parentDir;
  }
}
