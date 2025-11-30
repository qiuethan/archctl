import * as fs from 'fs';
import * as path from 'path';

/**
 * Parse .gitignore file and extract directory patterns
 * Returns an array of directory names to exclude
 * Only includes directories that actually exist in the project
 */
export function parseGitignore(projectRoot: string): string[] {
  const gitignorePath = path.join(projectRoot, '.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    const lines = content.split('\n');
    const excludes: string[] = [];

    for (let line of lines) {
      // Remove comments and trim
      const commentSplit = line.split('#');
      line = (commentSplit[0] || '').trim();

      // Skip empty lines
      if (!line) continue;

      // Skip negation patterns (!)
      if (line.startsWith('!')) continue;

      // Skip file patterns (contains extension or wildcard in filename)
      if (line.includes('*.') || line.includes('.')) {
        // Check if it's a file pattern vs directory pattern
        const lastSegment = line.split('/').pop() || '';
        if (lastSegment.includes('.') && !lastSegment.endsWith('/')) {
          continue; // Skip file patterns
        }
      }

      // Extract directory name
      // Remove leading/trailing slashes
      line = line.replace(/^\/+|\/+$/g, '');

      // Skip patterns with path separators (we only want top-level dirs)
      if (line.includes('/')) continue;

      // Skip glob patterns for now (could be enhanced later)
      if (line.includes('*') || line.includes('?') || line.includes('[')) continue;

      // Only add if the directory actually exists
      if (line) {
        const dirPath = path.join(projectRoot, line);
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
          excludes.push(line);
        }
      }
    }

    return excludes;
  } catch (error) {
    console.warn('Failed to parse .gitignore:', error);
    return [];
  }
}

/**
 * Merge gitignore excludes with config excludes
 * Config excludes take precedence (can override gitignore)
 */
export function mergeExcludes(
  gitignoreExcludes: string[],
  configExcludes: string[] = []
): string[] {
  // Use Set to deduplicate
  const merged = new Set([...gitignoreExcludes, ...configExcludes]);
  return Array.from(merged);
}
