import * as path from 'path';

/**
 * Supported language identifiers
 */
export type LanguageId = 'typescript' | 'javascript' | 'python' | 'java' | 'other';

/**
 * Map of file extensions to language IDs
 */
const EXTENSION_MAP: Record<string, LanguageId> = {
  // TypeScript
  '.ts': 'typescript',
  '.tsx': 'typescript',

  // JavaScript
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',

  // Python
  '.py': 'python',

  // Java
  '.java': 'java',
};

/**
 * Infer the language of a file from its path
 * @param filePath - File path (can be absolute or relative)
 * @returns Language identifier
 */
export function inferLanguageFromPath(filePath: string): LanguageId {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_MAP[ext] || 'other';
}

/**
 * Check if a language is supported for dependency scanning
 */
export function isLanguageSupported(language: LanguageId): boolean {
  return language !== 'other';
}

/**
 * Get human-readable language name
 */
export function getLanguageName(language: LanguageId): string {
  const names: Record<LanguageId, string> = {
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    python: 'Python',
    java: 'Java',
    other: 'Other',
  };
  return names[language];
}
