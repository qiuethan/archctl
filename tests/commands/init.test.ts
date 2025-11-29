import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { cmdInit } from '../../src/commands/init';
import * as prompts from '@inquirer/prompts';

// Mock the prompts module
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  confirm: vi.fn(),
  select: vi.fn(),
}));

describe('cmdInit', () => {
  const testOutDir = path.join(process.cwd(), 'test-architecture');
  const testConfigPath = path.join(testOutDir, 'archctl.config.json');

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
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Default mock responses for prompts
    vi.mocked(prompts.input)
      .mockResolvedValueOnce('Test Project') // project name
      .mockResolvedValueOnce(''); // entry point (empty)
    vi.mocked(prompts.confirm).mockResolvedValue(false); // Don't use template
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    // Clean up test directory
    if (fs.existsSync(testOutDir)) {
      fs.rmSync(testOutDir, { recursive: true });
    }
  });

  it('should create architecture directory and config file', async () => {
    await cmdInit({ out: testOutDir });

    expect(fs.existsSync(testOutDir)).toBe(true);
    expect(fs.existsSync(testConfigPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf-8'));
    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('layers');
    expect(config).toHaveProperty('layerMappings');
    expect(config).toHaveProperty('rules');
    expect(Array.isArray(config.layers)).toBe(true);
    expect(Array.isArray(config.rules)).toBe(true);
  });

  it('should create config with correct structure for custom setup', async () => {
    vi.mocked(prompts.input).mockReset();
    vi.mocked(prompts.confirm).mockReset();
    vi.mocked(prompts.input)
      .mockResolvedValueOnce('My Project') // project name
      .mockResolvedValueOnce('src/index.ts'); // entry point
    vi.mocked(prompts.confirm).mockResolvedValueOnce(false); // useTemplate

    await cmdInit({ out: testOutDir });

    const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf-8'));
    expect(config.name).toBe('My Project');
    expect(config.entryPoint).toBe('src/index.ts');
    expect(config.layers).toEqual([]);
    expect(config.layerMappings).toEqual([]);
    expect(config.rules).toEqual([]);
  });

  it('should log success message', async () => {
    await cmdInit({ out: testOutDir });

    expect(mockLog).toHaveBeenCalledWith(
      expect.stringContaining('Initialized architecture config at:')
    );
  });

  it('should not overwrite existing config without --force', async () => {
    // Create initial config
    await cmdInit({ out: testOutDir });

    // Mock process.exit to prevent test from exiting
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Try to init again without force
    await expect(async () => {
      await cmdInit({ out: testOutDir });
    }).rejects.toThrow('process.exit called');

    expect(mockError).toHaveBeenCalledWith(
      expect.stringContaining('already exists')
    );

    mockExit.mockRestore();
  });

  it('should create config from template', async () => {
    // Mock template selection
    vi.mocked(prompts.input).mockReset();
    vi.mocked(prompts.confirm).mockReset();
    vi.mocked(prompts.select).mockReset();
    vi.mocked(prompts.input)
      .mockResolvedValueOnce('My Project') // project name
      .mockResolvedValueOnce('src/main.ts'); // entry point
    vi.mocked(prompts.confirm).mockResolvedValue(true); // Use template
    vi.mocked(prompts.select).mockResolvedValue('clean-architecture');

    await cmdInit({ out: testOutDir });

    const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf-8'));
    expect(config.name).toBe('My Project');
    expect(config.entryPoint).toBe('src/main.ts');
    expect(config.layers.length).toBeGreaterThan(0);
    expect(config.rules.length).toBeGreaterThan(0);
    
    // Check that layers don't have path property
    config.layers.forEach((layer: any) => {
      expect(layer).toHaveProperty('name');
      expect(layer).toHaveProperty('description');
      expect(layer).not.toHaveProperty('path');
    });
  });
});
