import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  parsePath,
  normalizePath,
  toRelativePath,
  isWithinDirectory,
  validatePath,
  sanitizePathForConfig,
  isGlobPattern,
  normalizePathPattern,
} from '../../src/utils/path';

describe('parsePath', () => {
  const testDir = path.join(process.cwd(), 'test-path-utils');
  const testFile = path.join(testDir, 'test.txt');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(testFile, 'test content');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it('should parse an absolute path that exists', () => {
    const result = parsePath(testFile);
    expect(result.original).toBe(testFile);
    expect(result.isAbsolute).toBe(true);
    expect(result.exists).toBe(true);
    expect(result.isFile).toBe(true);
    expect(result.isDirectory).toBe(false);
  });

  it('should parse a relative path that exists', () => {
    const relativePath = path.relative(process.cwd(), testFile);
    const result = parsePath(relativePath);
    expect(result.original).toBe(relativePath);
    expect(result.isAbsolute).toBe(false);
    expect(result.exists).toBe(true);
    expect(result.isFile).toBe(true);
  });

  it('should parse a path that does not exist', () => {
    const nonExistent = path.join(testDir, 'nonexistent.txt');
    const result = parsePath(nonExistent);
    expect(result.exists).toBe(false);
    expect(result.isFile).toBe(null);
    expect(result.isDirectory).toBe(null);
  });

  it('should parse a directory path', () => {
    const result = parsePath(testDir);
    expect(result.exists).toBe(true);
    expect(result.isFile).toBe(false);
    expect(result.isDirectory).toBe(true);
  });
});

describe('normalizePath', () => {
  it('should normalize an absolute path', () => {
    const absolutePath = path.join('C:', 'Users', 'test', 'file.txt');
    const result = normalizePath(absolutePath);
    expect(path.isAbsolute(result)).toBe(true);
  });

  it('should resolve a relative path against basePath', () => {
    // Use an absolute path that works cross-platform
    const basePath = path.resolve('/tmp/test');
    const result = normalizePath('src/index.ts', { basePath });
    expect(result).toBe(path.join(basePath, 'src', 'index.ts'));
  });

  it('should convert to forward slashes when requested', () => {
    const result = normalizePath('src\\components\\Button.tsx', {
      forwardSlashes: true,
    });
    expect(result).toContain('/');
    expect(result).not.toContain('\\');
  });
});

describe('toRelativePath', () => {
  it('should convert absolute path to relative', () => {
    const basePath = path.join('C:', 'Users', 'test', 'project');
    const absolutePath = path.join(basePath, 'src', 'index.ts');
    const result = toRelativePath(absolutePath, basePath);
    expect(result).toBe('src/index.ts');
  });

  it('should handle relative input paths', () => {
    const basePath = path.join('C:', 'Users', 'test', 'project');
    const currentDir = path.join(basePath, 'src');
    const result = toRelativePath('components/Button.tsx', basePath, currentDir);
    expect(result).toBe('src/components/Button.tsx');
  });

  it('should use forward slashes', () => {
    const basePath = path.join('C:', 'Users', 'test', 'project');
    const absolutePath = path.join(basePath, 'src', 'components', 'Button.tsx');
    const result = toRelativePath(absolutePath, basePath);
    expect(result).not.toContain('\\');
    expect(result).toContain('/');
  });
});

describe('isWithinDirectory', () => {
  it('should return true for path within directory', () => {
    const baseDir = path.join('C:', 'Users', 'test', 'project');
    const targetPath = path.join(baseDir, 'src', 'index.ts');
    expect(isWithinDirectory(targetPath, baseDir)).toBe(true);
  });

  it('should return false for path outside directory', () => {
    const baseDir = path.join('C:', 'Users', 'test', 'project');
    const targetPath = path.join('C:', 'Users', 'test', 'other', 'file.ts');
    expect(isWithinDirectory(targetPath, baseDir)).toBe(false);
  });

  it('should return false for path that escapes with ..', () => {
    const baseDir = path.join('C:', 'Users', 'test', 'project');
    const targetPath = path.join(baseDir, '..', '..', 'other', 'file.ts');
    expect(isWithinDirectory(targetPath, baseDir)).toBe(false);
  });
});

describe('validatePath', () => {
  const testDir = path.join(process.cwd(), 'test-validate-path');
  const testFile = path.join(testDir, 'test.txt');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(testFile, 'test content');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it('should validate an existing path', () => {
    const result = validatePath(testFile, { mustExist: true });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should fail for non-existent path when mustExist is true', () => {
    const nonExistent = path.join(testDir, 'nonexistent.txt');
    const result = validatePath(nonExistent, { mustExist: true });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('does not exist');
  });

  it('should fail for empty path', () => {
    const result = validatePath('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('cannot be empty');
  });

  it('should validate file type', () => {
    const result = validatePath(testFile, { mustExist: true, mustBeFile: true });
    expect(result.valid).toBe(true);
  });

  it('should fail when path is not a file', () => {
    const result = validatePath(testDir, { mustExist: true, mustBeFile: true });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be a file');
  });

  it('should validate directory type', () => {
    const result = validatePath(testDir, { mustExist: true, mustBeDirectory: true });
    expect(result.valid).toBe(true);
  });

  it('should validate path is within directory', () => {
    const result = validatePath(testFile, {
      mustExist: true,
      mustBeWithin: testDir,
    });
    expect(result.valid).toBe(true);
  });

  it('should fail when path is outside directory', () => {
    const outsidePath = path.join(process.cwd(), 'outside.txt');
    const result = validatePath(outsidePath, {
      mustBeWithin: testDir,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be within project directory');
  });
});

describe('sanitizePathForConfig', () => {
  it('should convert absolute path to relative', () => {
    const projectRoot = path.join('C:', 'Users', 'test', 'project');
    const absolutePath = path.join(projectRoot, 'src', 'index.ts');
    const result = sanitizePathForConfig(absolutePath, projectRoot);
    expect(result).toBe('src/index.ts');
  });

  it('should remove leading ./', () => {
    const projectRoot = path.join('C:', 'Users', 'test', 'project');
    const result = sanitizePathForConfig('./src/index.ts', projectRoot, projectRoot);
    expect(result).toBe('src/index.ts');
  });

  it('should use forward slashes', () => {
    const projectRoot = path.join('C:', 'Users', 'test', 'project');
    const absolutePath = path.join(projectRoot, 'src', 'components', 'Button.tsx');
    const result = sanitizePathForConfig(absolutePath, projectRoot);
    expect(result).not.toContain('\\');
  });
});

describe('isGlobPattern', () => {
  it('should detect asterisk glob', () => {
    expect(isGlobPattern('src/**/*.ts')).toBe(true);
    expect(isGlobPattern('*.js')).toBe(true);
  });

  it('should detect question mark glob', () => {
    expect(isGlobPattern('file?.ts')).toBe(true);
  });

  it('should detect bracket glob', () => {
    expect(isGlobPattern('file[0-9].ts')).toBe(true);
  });

  it('should return false for regular paths', () => {
    expect(isGlobPattern('src/index.ts')).toBe(false);
    expect(isGlobPattern('components/Button.tsx')).toBe(false);
  });
});

describe('normalizePathPattern', () => {
  it('should leave glob patterns unchanged', () => {
    expect(normalizePathPattern('src/**/*.ts')).toBe('src/**/*.ts');
    expect(normalizePathPattern('*.js')).toBe('*.js');
  });

  it('should leave file paths unchanged', () => {
    expect(normalizePathPattern('src/index.ts')).toBe('src/index.ts');
    expect(normalizePathPattern('components/Button.tsx')).toBe('components/Button.tsx');
  });

  it('should append /** to directory paths', () => {
    expect(normalizePathPattern('src')).toBe('src/**');
    expect(normalizePathPattern('components')).toBe('components/**');
  });

  it('should handle trailing slash', () => {
    expect(normalizePathPattern('src/')).toBe('src/**');
  });
});
