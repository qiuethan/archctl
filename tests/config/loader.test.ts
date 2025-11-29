import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, findConfigFile } from '../../src/config/loader';
import type { ArchctlConfig } from '../../src/types';

describe('loadConfig', () => {
  const testDir = path.join(process.cwd(), 'test-config-loader');
  const testConfigPath = path.join(testDir, 'archctl.config.json');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it('should load a valid config file', () => {
    const validConfig: ArchctlConfig = {
      name: 'Test Architecture',
      language: 'TypeScript',
      framework: 'Node.js',
      testing: 'Vitest',
      layers: [],
      layerMappings: [],
      rules: [],
    };

    fs.writeFileSync(testConfigPath, JSON.stringify(validConfig), 'utf-8');

    const config = loadConfig(testConfigPath);
    expect(config).toEqual(validConfig);
  });

  it('should throw error if config file does not exist', () => {
    const nonExistentPath = path.join(testDir, 'nonexistent.json');

    expect(() => {
      loadConfig(nonExistentPath);
    }).toThrow('Config file not found');
  });

  it('should throw error if config is missing required fields', () => {
    const invalidConfig = {
      // Missing 'name' field
      language: 'TypeScript',
    };

    fs.writeFileSync(testConfigPath, JSON.stringify(invalidConfig), 'utf-8');

    expect(() => {
      loadConfig(testConfigPath);
    }).toThrow('Config must have a valid "name" field');
  });
});

describe('findConfigFile', () => {
  const testDir = path.join(process.cwd(), 'test-find-config');
  const nestedDir = path.join(testDir, 'nested', 'deep');
  const configPath = path.join(testDir, 'archctl.config.json');

  beforeEach(() => {
    if (!fs.existsSync(nestedDir)) {
      fs.mkdirSync(nestedDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it('should find config in current directory', () => {
    fs.writeFileSync(configPath, '{}', 'utf-8');

    const found = findConfigFile(testDir);
    expect(found).toBe(configPath);
  });

  it('should find config in parent directory', () => {
    fs.writeFileSync(configPath, '{}', 'utf-8');

    const found = findConfigFile(nestedDir);
    expect(found).toBe(configPath);
  });

  it('should return null if no config found', () => {
    const found = findConfigFile(nestedDir);
    expect(found).toBeNull();
  });
});
