import * as path from 'path';
import * as fs from 'fs';
import type { ProjectScanner, FileInfo, ScanResult } from '../../../types/scanner';
import type { DependencyEdge } from '../../../types/graph';
import { toForwardSlashes } from '../../../utils/path';

/**
 * Java scanner using regex-based parsing
 * Supports: import statements in typical Maven/Gradle layouts
 */
export const javaScanner: ProjectScanner = {
  id: 'java-import',

  supports(file: FileInfo): boolean {
    return file.language === 'java';
  },

  async scan(file: FileInfo, context: { projectRoot: string }): Promise<ScanResult> {
    const edges: DependencyEdge[] = [];

    try {
      // Build index of Java files on first scan (cached)
      const javaFileIndex = buildJavaFileIndex(context.projectRoot);

      const imports = extractJavaImports(file.contents);

      for (const imp of imports) {
        const resolved = resolveJavaImport(imp, javaFileIndex);
        if (resolved) {
          edges.push({
            from: file.path,
            to: resolved,
            kind: 'import',
            confidence: 0.85,
            source: 'java-import',
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to parse Java imports in ${file.path}:`, error);
    }

    return { edges };
  },
};

/**
 * Extract import statements from Java source code
 */
function extractJavaImports(contents: string): string[] {
  const imports: string[] = [];

  // Match: import com.example.Foo;
  // Match: import static com.example.Foo.bar;
  const importRegex = /^\s*import\s+(?:static\s+)?([\w.]+)\s*;/gm;
  let match;
  while ((match = importRegex.exec(contents)) !== null) {
    if (match[1]) {
      imports.push(match[1]);
    }
  }

  return imports;
}

// Cache for Java file index to avoid rebuilding on every scan
let cachedIndex: Map<string, string> | null = null;
let cachedProjectRoot: string | null = null;

/**
 * Build an index of Java files by their fully qualified class name
 * Maps "com.example.Foo" -> "src/main/java/com/example/Foo.java"
 */
function buildJavaFileIndex(projectRoot: string): Map<string, string> {
  // Return cached index if available for same project
  if (cachedIndex && cachedProjectRoot === projectRoot) {
    return cachedIndex;
  }

  const index = new Map<string, string>();

  // Common Java source directories
  const sourceDirs = [
    projectRoot,
    path.join(projectRoot, 'src', 'main', 'java'),
    path.join(projectRoot, 'src'),
  ];

  for (const sourceDir of sourceDirs) {
    if (fs.existsSync(sourceDir)) {
      indexJavaFiles(sourceDir, projectRoot, index);
    }
  }

  // Cache the index
  cachedIndex = index;
  cachedProjectRoot = projectRoot;

  return index;
}

/**
 * Recursively index Java files in a directory
 */
function indexJavaFiles(
  dir: string,
  projectRoot: string,
  index: Map<string, string>
): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip common non-source directories
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'target' || entry.name === 'build') {
        continue;
      }
      indexJavaFiles(fullPath, projectRoot, index);
    } else if (entry.isFile() && entry.name.endsWith('.java')) {
      // Extract fully qualified class name from file path
      const relativePath = path.relative(projectRoot, fullPath);
      const fqcn = extractFQCN(relativePath);
      if (fqcn) {
        index.set(fqcn, toForwardSlashes(relativePath));
      }
    }
  }
}

/**
 * Extract fully qualified class name from a Java file path
 * e.g., "src/main/java/com/example/Foo.java" -> "com.example.Foo"
 */
function extractFQCN(filePath: string): string | null {
  // Normalize to forward slashes
  const normalized = filePath.replace(/\\/g, '/');

  // Remove .java extension
  if (!normalized.endsWith('.java')) {
    return null;
  }
  const withoutExt = normalized.slice(0, -5);

  // Try to find the package structure
  // Look for common Java source roots
  const javaRoots = ['src/main/java/', 'src/test/java/', 'src/'];
  
  for (const root of javaRoots) {
    const index = withoutExt.indexOf(root);
    if (index !== -1) {
      const packagePath = withoutExt.slice(index + root.length);
      return packagePath.replace(/\//g, '.');
    }
  }

  // If no standard root found, use the whole path
  // This handles files directly in project root or custom layouts
  return withoutExt.replace(/\//g, '.');
}

/**
 * Resolve a Java import to a project-relative file path
 */
function resolveJavaImport(
  importName: string,
  index: Map<string, string>
): string | null {
  // Direct lookup in index
  if (index.has(importName)) {
    return index.get(importName) || null;
  }

  // Handle wildcard imports (e.g., com.example.*)
  // We can't resolve these to specific files, so skip them
  if (importName.endsWith('.*')) {
    return null;
  }

  return null;
}
