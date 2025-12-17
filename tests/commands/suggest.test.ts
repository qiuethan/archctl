import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { cmdSuggest } from '../../src/commands/suggest';
import { suggestionService } from '../../src/services/suggestion/suggestionService';
import * as suggestPresenter from '../../src/presentation/suggestPresenter';
import * as configService from '../../src/services/configService';
import { constants } from '../../src/utils/constants';

// Mocks
vi.mock('fs');
vi.mock('../../src/services/suggestion/suggestionService');
vi.mock('../../src/presentation/suggestPresenter');
vi.mock('../../src/services/configService');
vi.mock('../../src/utils/colors', () => ({
  colors: {
    error: (msg: string) => msg,
    info: (msg: string) => msg,
    success: (msg: string) => msg,
  },
}));

describe('cmdSuggest', () => {
  const projectRoot = process.cwd();
  const configPath = path.join(projectRoot, constants.defaultOutDir, constants.configFileName);
  const mockConfig = {
    name: 'test-project',
    layers: [],
    layerMappings: [],
    rules: [],
  };
  const mockSuggestionResult = {
    suggestions: [],
    proposedConfig: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fail if archctl is not initialized', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await cmdSuggest({});

    expect(fs.existsSync).toHaveBeenCalledWith(configPath);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('archctl is not initialized'));
  });

  it('should fail if config cannot be loaded', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(configService, 'loadConfig').mockReturnValue(
      null as unknown as import('../../src/types/config').ArchctlConfig
    );
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await cmdSuggest({});

    expect(configService.loadConfig).toHaveBeenCalledWith(configPath);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load configuration.');
  });

  it('should run suggestion analysis and present results', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(configService, 'loadConfig').mockReturnValue(mockConfig);
    const suggestSpy = vi
      .spyOn(suggestionService, 'suggest')
      .mockResolvedValue(mockSuggestionResult);
    const presentSpy = vi.spyOn(suggestPresenter, 'presentAndApply');

    await cmdSuggest({});

    expect(suggestSpy).toHaveBeenCalledWith(projectRoot, mockConfig);
    expect(presentSpy).toHaveBeenCalledWith(mockSuggestionResult, mockConfig, configPath);
  });

  it('should handle analysis errors gracefully', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(configService, 'loadConfig').mockReturnValue(mockConfig);
    vi.spyOn(suggestionService, 'suggest').mockRejectedValue(new Error('Analysis failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await cmdSuggest({});

    expect(consoleSpy).toHaveBeenCalledWith('Analysis failed: Analysis failed');
  });
});
