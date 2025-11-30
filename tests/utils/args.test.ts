import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseArgs } from '../../src/utils/args';

describe('parseArgs', () => {
  let originalArgv: string[];

  beforeEach(() => {
    originalArgv = process.argv;
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('should parse a simple command', () => {
    process.argv = ['node', 'cli.js', 'init'];
    const { cmd, args } = parseArgs();

    expect(cmd).toBe('init');
    expect(args).toEqual({ _: [] });
  });

  it('should parse boolean flags', () => {
    process.argv = ['node', 'cli.js', 'init', '--force'];
    const { cmd, args } = parseArgs();

    expect(cmd).toBe('init');
    expect(args).toEqual({ _: [], force: true });
  });

  it('should parse flags with values (space-separated)', () => {
    process.argv = ['node', 'cli.js', 'init', '--out', '.archctl'];
    const { cmd, args } = parseArgs();

    expect(cmd).toBe('init');
    expect(args).toEqual({ _: [], out: '.archctl' });
  });

  it('should parse flags with values (equals syntax)', () => {
    process.argv = ['node', 'cli.js', 'init', '--out=.archctl'];
    const { cmd, args } = parseArgs();

    expect(cmd).toBe('init');
    expect(args).toEqual({ _: [], out: '.archctl' });
  });

  it('should parse multiple flags', () => {
    process.argv = ['node', 'cli.js', 'init', '--out', 'architecture', '--force'];
    const { cmd, args } = parseArgs();

    expect(cmd).toBe('init');
    expect(args).toEqual({
      _: [],
      out: 'architecture',
      force: true,
    });
  });

  it('should handle commands without flags', () => {
    process.argv = ['node', 'cli.js', 'sync'];
    const { cmd, args } = parseArgs();

    expect(cmd).toBe('sync');
    expect(args).toEqual({ _: [] });
  });

  it('should handle no command', () => {
    process.argv = ['node', 'cli.js'];
    const { cmd, args } = parseArgs();

    expect(cmd).toBeUndefined();
    expect(args).toEqual({ _: [] });
  });

  it('should parse complex flag combinations', () => {
    process.argv = ['node', 'cli.js', 'init', '--out=config/arch', '--force', '--verbose'];
    const { cmd, args } = parseArgs();

    expect(cmd).toBe('init');
    expect(args).toEqual({
      _: [],
      out: 'config/arch',
      force: true,
      verbose: true,
    });
  });
});
