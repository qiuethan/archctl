import * as fs from 'fs';
import * as path from 'path';
import type { ArchctlConfig } from '../../types';
import { messages } from '../../utils/messages';
import { constants } from '../../utils/constants';

/**
 * Config service - handles all configuration file operations
 * This is the infrastructure layer for config management
 */

/**
 * Load and validate archctl.config.json
 */
export function loadConfig(configPath: string): ArchctlConfig {
  if (!fs.existsSync(configPath)) {
    throw new Error(`${messages.config.notFound} ${configPath}`);
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(content) as ArchctlConfig;

  validateConfig(config);

  return config;
}

/**
 * Save configuration to file
 */
export function saveConfig(configPath: string, config: ArchctlConfig): void {
  const content = JSON.stringify(config, null, 2);
  fs.writeFileSync(configPath, content, 'utf-8');
}

/**
 * Find the architecture config file starting from a directory
 * Walks up the directory tree looking for the config file
 * Checks both the directory root and the .archctl subdirectory
 */
export function findConfigFile(startDir: string = process.cwd()): string | null {
  let currentDir = startDir;

  while (true) {
    // Check in .archctl subdirectory first (preferred location)
    const archctlPath = path.join(currentDir, constants.defaultOutDir, constants.configFileName);
    if (fs.existsSync(archctlPath)) {
      return archctlPath;
    }

    // Also check in the directory root (for backwards compatibility)
    const rootPath = path.join(currentDir, constants.configFileName);
    if (fs.existsSync(rootPath)) {
      return rootPath;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached root
      return null;
    }
    currentDir = parentDir;
  }
}

/**
 * Validate configuration structure
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
}
