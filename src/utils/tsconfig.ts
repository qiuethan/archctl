import * as ts from 'typescript';
import * as path from 'path';

export interface TsConfigPaths {
  baseUrl?: string | undefined;
  paths?: Record<string, string[]> | undefined;
}

/**
 * Load and parse tsconfig.json from the project root
 */
export function loadTsConfig(projectRoot: string): TsConfigPaths | null {
  const configPath = ts.findConfigFile(projectRoot, (f) => ts.sys.fileExists(f), 'tsconfig.json');

  if (!configPath) {
    return null;
  }

  try {
    const configFile = ts.readConfigFile(configPath, (f) => ts.sys.readFile(f));

    if (configFile.error) {
      return null;
    }

    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(configPath)
    );

    return {
      baseUrl: parsedConfig.options.baseUrl || undefined,
      paths: parsedConfig.options.paths as Record<string, string[]> | undefined,
    };
  } catch (error) {
    console.warn('Failed to parse tsconfig.json:', error);
    return null;
  }
}
