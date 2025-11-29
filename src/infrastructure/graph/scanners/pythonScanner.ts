import * as path from 'path';
import * as fs from 'fs';
import type { ProjectScanner, FileInfo, ScanResult } from '../../../types/scanner';
import type { DependencyEdge } from '../../../types/graph';
import { toForwardSlashes } from '../../../utils/path';

/**
 * Python scanner using regex-based parsing
 * Supports: import statements and from...import statements
 */
export const pythonScanner: ProjectScanner = {
  id: 'python-import',

  supports(file: FileInfo): boolean {
    return file.language === 'python';
  },

  async scan(file: FileInfo, context: { projectRoot: string }): Promise<ScanResult> {
    const edges: DependencyEdge[] = [];

    try {
      const imports = extractPythonImports(file.contents);

      for (const imp of imports) {
        const resolved = resolvePythonImport(imp, file.path, context.projectRoot);
        if (resolved) {
          edges.push({
            from: file.path,
            to: resolved,
            kind: 'import',
            confidence: 0.9,
            source: 'python-import',
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to parse Python imports in ${file.path}:`, error);
    }

    return { edges };
  },
};

/**
 * Extract import statements from Python source code
 */
function extractPythonImports(contents: string): string[] {
  const imports: string[] = [];

  // Match: import foo
  // Match: import foo.bar
  // Match: import foo as bar
  const importRegex = /^\s*import\s+([\w.]+)(?:\s+as\s+\w+)?/gm;
  let match;
  while ((match = importRegex.exec(contents)) !== null) {
    if (match[1]) {
      imports.push(match[1]);
    }
  }

  // Match: from foo import bar
  // Match: from foo.bar import baz
  // Match: from foo import bar as baz
  const fromImportRegex = /^\s*from\s+([\w.]+)\s+import\s+/gm;
  while ((match = fromImportRegex.exec(contents)) !== null) {
    if (match[1]) {
      imports.push(match[1]);
    }
  }

  return imports;
}

/**
 * Resolve a Python module name to a project-relative file path
 * Returns null for external modules or unresolved imports
 */
function resolvePythonImport(
  moduleName: string,
  fromFile: string,
  projectRoot: string
): string | null {
  // Convert module name to path candidates
  // e.g., "foo.bar" -> ["foo/bar.py", "foo/bar/__init__.py"]
  const modulePath = moduleName.replace(/\./g, path.sep);
  
  const candidates = [
    `${modulePath}.py`,
    path.join(modulePath, '__init__.py'),
  ];

  // Try resolving from project root
  for (const candidate of candidates) {
    const absolutePath = path.join(projectRoot, candidate);
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
      return toForwardSlashes(candidate);
    }
  }

  // Try resolving from the directory of the importing file
  const fromDir = path.dirname(path.join(projectRoot, fromFile));
  for (const candidate of candidates) {
    const absolutePath = path.join(fromDir, candidate);
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
      // Convert to project-relative path
      const relativePath = path.relative(projectRoot, absolutePath);
      if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
        return toForwardSlashes(relativePath);
      }
    }
  }

  // For simple single-level imports, also try as a direct file
  if (!moduleName.includes('.')) {
    const simpleFile = `${moduleName}.py`;
    const absolutePath = path.join(projectRoot, simpleFile);
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
      return toForwardSlashes(simpleFile);
    }
  }

  return null;
}
