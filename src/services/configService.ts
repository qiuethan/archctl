import type { ArchctlConfig } from '../types/config';
import * as configInfra from '../infrastructure/config/configService';

/**
 * Application-layer config service
 * Provides config operations to commands without exposing infrastructure
 */

/**
 * Find the config file in the project
 */
export function findConfig(): string | null {
  return configInfra.findConfigFile();
}

/**
 * Load configuration from file
 */
export function loadConfig(configPath: string): ArchctlConfig {
  return configInfra.loadConfig(configPath);
}

/**
 * Save configuration to file
 */
export function saveConfig(configPath: string, config: ArchctlConfig): void {
  configInfra.saveConfig(configPath, config);
}

/**
 * Find and load config in one operation
 * Throws if config not found
 */
export function findAndLoadConfig(): { configPath: string; config: ArchctlConfig } {
  const configPath = findConfig();
  
  if (!configPath) {
    throw new Error('No archctl.config.json found. Run `archctl init` first.');
  }
  
  const config = loadConfig(configPath);
  
  return { configPath, config };
}
