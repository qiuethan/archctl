import * as fs from 'fs';
import * as path from 'path';
import type { ArchctlConfig } from '../types';
import { messages } from '../messages';
import { constants } from '../constants';

/**
 * Load and validate archctl.config.json
 * TODO: Add JSON schema validation using ajv or zod
 */
export function loadConfig(configPath: string): ArchctlConfig {
  if (!fs.existsSync(configPath)) {
    throw new Error(`${messages.config.notFound} ${configPath}`);
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(content) as ArchctlConfig;

  // TODO: Add proper validation
  validateConfig(config);

  return config;
}

/**
 * Validate configuration structure
 * TODO: Implement comprehensive validation
 */
function validateConfig(config: ArchctlConfig): void {
  if (!config.name || typeof config.name !== 'string') {
    throw new Error(messages.config.invalidName);
  }

  // Validate layers array
  if (!Array.isArray(config.layers)) {
    throw new Error('Config must have a layers array');
  }

  // Validate layer mappings if present
  if (config.layerMappings && !Array.isArray(config.layerMappings)) {
    throw new Error('layerMappings must be an array');
  }

  // TODO: Add more validation rules
  // - Validate rules array
  // - Check for required fields
  // - Validate rule types and severities
  // - Validate layer mapping references
}

/**
 * Find the architecture config file starting from a directory
 * Walks up the directory tree looking for the config file
 */
export function findConfigFile(startDir: string = process.cwd()): string | null {
  let currentDir = startDir;

  while (true) {
    const configPath = path.join(currentDir, constants.configFileName);
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
