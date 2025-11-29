import * as path from 'path';
import * as fs from 'fs';

/**
 * Path utility functions for handling user input paths
 * Supports absolute, relative, and non-existent paths
 */

export interface PathInfo {
  /** The original input path */
  original: string;
  /** Absolute path */
  absolute: string;
  /** Whether the path is absolute */
  isAbsolute: boolean;
  /** Whether the path exists */
  exists: boolean;
  /** Whether the path is a file (only if exists) */
  isFile: boolean | null;
  /** Whether the path is a directory (only if exists) */
  isDirectory: boolean | null;
}

export interface NormalizedPathOptions {
  /** Base directory to resolve relative paths against (defaults to cwd) */
  basePath?: string;
  /** Whether to check if the path exists */
  checkExists?: boolean;
  /** Whether to normalize to forward slashes */
  forwardSlashes?: boolean;
}

/**
 * Parse and analyze a path input from the user
 * Handles absolute, relative, and non-existent paths
 */
export function parsePath(inputPath: string, basePath: string = process.cwd()): PathInfo {
  const isAbsolute = path.isAbsolute(inputPath);
  const absolute = isAbsolute ? path.normalize(inputPath) : path.resolve(basePath, inputPath);
  
  let exists = false;
  let isFile: boolean | null = null;
  let isDirectory: boolean | null = null;

  try {
    if (fs.existsSync(absolute)) {
      exists = true;
      const stats = fs.statSync(absolute);
      isFile = stats.isFile();
      isDirectory = stats.isDirectory();
    }
  } catch (error) {
    // Path doesn't exist or can't be accessed
    exists = false;
  }

  return {
    original: inputPath,
    absolute,
    isAbsolute,
    exists,
    isFile,
    isDirectory,
  };
}

/**
 * Normalize a user input path
 * - Resolves relative paths against basePath
 * - Converts to forward slashes if requested
 * - Optionally validates existence
 */
export function normalizePath(
  inputPath: string,
  options: NormalizedPathOptions = {}
): string {
  const {
    basePath = process.cwd(),
    forwardSlashes = false,
  } = options;

  const isAbsolute = path.isAbsolute(inputPath);
  let normalized = isAbsolute ? path.normalize(inputPath) : path.resolve(basePath, inputPath);

  if (forwardSlashes) {
    normalized = normalized.replace(/\\/g, '/');
  }

  return normalized;
}

/**
 * Simple path normalization that only converts backslashes to forward slashes
 * Does NOT resolve relative paths or change the path structure
 * Use this when you want to keep relative paths relative
 */
export function toForwardSlashes(inputPath: string): string {
  return inputPath.replace(/\\/g, '/');
}

/**
 * Convert a path to be relative to a base directory
 * Handles both absolute and relative input paths
 */
export function toRelativePath(
  inputPath: string,
  basePath: string,
  currentDir: string = process.cwd()
): string {
  // First resolve the input path (could be relative to currentDir)
  const absolutePath = path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(currentDir, inputPath);

  // Then make it relative to basePath
  const relativePath = path.relative(basePath, absolutePath);

  // Normalize to forward slashes
  return relativePath.replace(/\\/g, '/');
}

/**
 * Validate that a path is within a project directory
 * Returns true if the path is within the project, false if it escapes
 */
export function isWithinDirectory(targetPath: string, baseDirectory: string): boolean {
  const relative = path.relative(baseDirectory, targetPath);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Validate a path input and provide helpful error messages
 */
export interface PathValidationResult {
  valid: boolean;
  error?: string;
  normalized?: string;
}

export interface PathValidationOptions {
  /** Base path for resolving relative paths */
  basePath?: string;
  /** Whether the path must exist */
  mustExist?: boolean;
  /** Whether the path must be a file */
  mustBeFile?: boolean;
  /** Whether the path must be a directory */
  mustBeDirectory?: boolean;
  /** Whether the path must be within a specific directory */
  mustBeWithin?: string;
  /** Custom error message prefix */
  errorPrefix?: string;
}

/**
 * Validate a user-provided path with various constraints
 */
export function validatePath(
  inputPath: string,
  options: PathValidationOptions = {}
): PathValidationResult {
  const {
    basePath = process.cwd(),
    mustExist = false,
    mustBeFile = false,
    mustBeDirectory = false,
    mustBeWithin,
    errorPrefix = 'Invalid path',
  } = options;

  if (!inputPath || inputPath.trim() === '') {
    return {
      valid: false,
      error: `${errorPrefix}: Path cannot be empty`,
    };
  }

  const pathInfo = parsePath(inputPath, basePath);

  if (mustExist && !pathInfo.exists) {
    return {
      valid: false,
      error: `${errorPrefix}: Path does not exist: ${pathInfo.absolute}`,
    };
  }

  if (mustBeFile && pathInfo.exists && !pathInfo.isFile) {
    return {
      valid: false,
      error: `${errorPrefix}: Path must be a file: ${pathInfo.absolute}`,
    };
  }

  if (mustBeDirectory && pathInfo.exists && !pathInfo.isDirectory) {
    return {
      valid: false,
      error: `${errorPrefix}: Path must be a directory: ${pathInfo.absolute}`,
    };
  }

  if (mustBeWithin) {
    const withinDir = isWithinDirectory(pathInfo.absolute, mustBeWithin);
    if (!withinDir) {
      return {
        valid: false,
        error: `${errorPrefix}: Path must be within project directory: ${mustBeWithin}`,
      };
    }
  }

  return {
    valid: true,
    normalized: pathInfo.absolute,
  };
}

/**
 * Sanitize a path for use in configuration files
 * - Converts to forward slashes
 * - Makes relative to project root if within project
 * - Removes leading ./
 */
export function sanitizePathForConfig(
  inputPath: string,
  projectRoot: string,
  currentDir: string = process.cwd()
): string {
  const relativePath = toRelativePath(inputPath, projectRoot, currentDir);
  
  // Remove leading ./
  const cleaned = relativePath.startsWith('./') 
    ? relativePath.substring(2) 
    : relativePath;

  return cleaned;
}

/**
 * Check if a path looks like a glob pattern
 */
export function isGlobPattern(inputPath: string): boolean {
  return inputPath.includes('*') || inputPath.includes('?') || inputPath.includes('[');
}

/**
 * Normalize a path pattern for layer mapping
 * - If contains glob characters, treat as glob and return as-is
 * - If looks like a file (has extension), return as-is
 * - If looks like a directory, append /**
 */
export function normalizePathPattern(pattern: string): string {
  // Already a glob pattern
  if (isGlobPattern(pattern)) {
    return pattern;
  }

  // Check if it looks like a file (has extension in last segment)
  const lastSegment = pattern.split('/').pop() || '';
  const hasExtension = lastSegment.includes('.');

  if (hasExtension) {
    // Treat as file path
    return pattern;
  }

  // Treat as directory, append /**
  return pattern.endsWith('/') ? `${pattern}**` : `${pattern}/**`;
}
