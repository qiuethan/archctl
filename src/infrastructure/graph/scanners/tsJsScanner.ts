import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import type { ProjectScanner, FileInfo, ScanResult } from '../../../types/scanner';
import type { DependencyEdge } from '../../../types/graph';
import { toForwardSlashes } from '../../../utils/path';

/**
 * TypeScript/JavaScript scanner using the TypeScript compiler API
 * Supports: .ts, .tsx, .js, .jsx, .mjs, .cjs
 */
export const tsJsScanner: ProjectScanner = {
  id: 'ts-js-import',

  supports(file: FileInfo): boolean {
    return file.language === 'typescript' || file.language === 'javascript';
  },

  async scan(file: FileInfo, context: { projectRoot: string }): Promise<ScanResult> {
    const edges: DependencyEdge[] = [];

    try {
      // Parse the file using TypeScript compiler API
      const sourceFile = ts.createSourceFile(
        file.path,
        file.contents,
        ts.ScriptTarget.Latest,
        true
      );

      // Walk the AST to find import statements
      const visit = (node: ts.Node) => {
        // ES6 import declarations: import ... from "module"
        if (ts.isImportDeclaration(node)) {
          const moduleSpecifier = node.moduleSpecifier;
          if (ts.isStringLiteral(moduleSpecifier)) {
            const importPath = moduleSpecifier.text;
            const resolved = resolveImport(importPath, file.path, context.projectRoot);
            if (resolved) {
              edges.push({
                from: file.path,
                to: resolved,
                kind: 'import',
                confidence: 0.99,
                source: 'ts-js-import',
              });
            }
          }
        }

        // ES6 export declarations: export ... from "module"
        if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
          if (ts.isStringLiteral(node.moduleSpecifier)) {
            const importPath = node.moduleSpecifier.text;
            const resolved = resolveImport(importPath, file.path, context.projectRoot);
            if (resolved) {
              edges.push({
                from: file.path,
                to: resolved,
                kind: 'import',
                confidence: 0.99,
                source: 'ts-js-import',
              });
            }
          }
        }

        // Dynamic imports: import("module")
        if (ts.isCallExpression(node)) {
          if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
            const arg = node.arguments[0];
            if (arg && ts.isStringLiteral(arg)) {
              const importPath = arg.text;
              const resolved = resolveImport(importPath, file.path, context.projectRoot);
              if (resolved) {
                edges.push({
                  from: file.path,
                  to: resolved,
                  kind: 'import',
                  confidence: 0.98,
                  source: 'ts-js-import',
                });
              }
            }
          }

          // CommonJS require: require("module")
          if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
            const arg = node.arguments[0];
            if (arg && ts.isStringLiteral(arg)) {
              const importPath = arg.text;
              const resolved = resolveImport(importPath, file.path, context.projectRoot);
              if (resolved) {
                edges.push({
                  from: file.path,
                  to: resolved,
                  kind: 'import',
                  confidence: 0.98,
                  source: 'ts-js-import',
                });
              }
            }
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    } catch (error) {
      // If parsing fails, return empty result rather than crashing
      console.warn(`Failed to parse ${file.path}:`, error);
    }

    return { edges };
  },
};

/**
 * Resolve an import specifier to a project-relative file path
 * Only resolves local imports (relative or absolute within project)
 * Returns null for external modules
 */
function resolveImport(
  specifier: string,
  fromFile: string,
  projectRoot: string
): string | null {
  // Ignore external modules (no leading . or /)
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
    return null;
  }

  // Get the directory of the importing file
  const fromDir = path.dirname(path.join(projectRoot, fromFile));

  // Resolve the specifier relative to the importing file
  let candidatePath: string;
  if (specifier.startsWith('.')) {
    candidatePath = path.resolve(fromDir, specifier);
  } else {
    // Absolute path within project
    candidatePath = path.join(projectRoot, specifier);
  }

  // Try to resolve to an actual file
  const resolved = tryResolveFile(candidatePath);
  if (!resolved) {
    return null;
  }

  // Check if resolved path is within project root
  const relativePath = path.relative(projectRoot, resolved);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null; // Outside project
  }

  // Return normalized project-relative path
  return toForwardSlashes(relativePath);
}

/**
 * Try to resolve a module specifier to an actual file
 * Tries standard Node/TypeScript resolution order
 */
function tryResolveFile(basePath: string): string | null {
  // Extension candidates in priority order
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
  const indexFiles = ['index.ts', 'index.tsx', 'index.js', 'index.jsx'];

  // Try exact path first
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
    return basePath;
  }

  // Try with extensions
  for (const ext of extensions) {
    const withExt = basePath + ext;
    if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
      return withExt;
    }
  }

  // Try as directory with index files
  if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
    for (const indexFile of indexFiles) {
      const indexPath = path.join(basePath, indexFile);
      if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
        return indexPath;
      }
    }
  }

  return null;
}
