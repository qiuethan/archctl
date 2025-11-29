import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { cmdInit } from '../../src/commands/init';

describe('cmdInit', () => {
  const testOutDir = path.join(process.cwd(), 'test-architecture');
  const testConfigPath = path.join(testOutDir, 'architecture.config.json');

  // Mock console methods
  const originalLog = console.log;
  const originalError = console.error;
  const mockLog = vi.fn();
  const mockError = vi.fn();

  beforeEach(() => {
    console.log = mockLog;
    console.error = mockError;
    // Clean up test directory if it exists
    if (fs.existsSync(testOutDir)) {
      fs.rmSync(testOutDir, { recursive: true });
    }
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    // Clean up test directory
    if (fs.existsSync(testOutDir)) {
      fs.rmSync(testOutDir, { recursive: true });
    }
  });

  it('should create architecture directory and config file', () => {
    cmdInit({ out: testOutDir });

    expect(fs.existsSync(testOutDir)).toBe(true);
    expect(fs.existsSync(testConfigPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf-8'));
    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('layers');
    expect(config).toHaveProperty('rules');
    expect(Array.isArray(config.layers)).toBe(true);
    expect(Array.isArray(config.rules)).toBe(true);
  });

  it('should create config with correct structure', () => {
    cmdInit({ out: testOutDir });

    const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf-8'));
    expect(config).toEqual({
      name: 'My Architecture',
      language: '',
      framework: '',
      testing: '',
      layers: [],
      rules: [],
    });
  });

  it('should log success message', () => {
    cmdInit({ out: testOutDir });

    expect(mockLog).toHaveBeenCalledWith(
      expect.stringContaining('Initialized architecture config at:')
    );
  });

  it('should not overwrite existing config without --force', () => {
    // Create initial config
    cmdInit({ out: testOutDir });

    // Mock process.exit to prevent test from exiting
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Try to init again without force
    expect(() => {
      cmdInit({ out: testOutDir });
    }).toThrow('process.exit called');

    expect(mockError).toHaveBeenCalledWith(
      expect.stringContaining('already exists')
    );

    mockExit.mockRestore();
  });

  it('should overwrite existing config with --force', () => {
    // Create initial config
    cmdInit({ out: testOutDir });

    // Modify the config
    const modifiedConfig = { name: 'Modified' };
    fs.writeFileSync(testConfigPath, JSON.stringify(modifiedConfig), 'utf-8');

    // Init again with force
    cmdInit({ out: testOutDir, force: true });

    // Check that config was overwritten
    const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf-8'));
    expect(config.name).toBe('My Architecture');
  });
});
