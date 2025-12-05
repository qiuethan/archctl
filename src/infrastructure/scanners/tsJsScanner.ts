import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import type { ProjectScanner, FileInfo, ScanResult } from '../../types/scanner';
import type { DependencyEdge, ProjectFileNode } from '../../types/graph';
import type { Capability, CapabilityPattern } from '../../types/capabilities';
import { toForwardSlashes } from '../../utils/path';

/**
 * TypeScript/JavaScript scanner using the TypeScript compiler API
 * Supports: .ts, .tsx, .js, .jsx, .mjs, .cjs
 */
export const tsJsScanner: ProjectScanner = {
  id: 'ts-js-import',

  supports(file: FileInfo): boolean {
    return file.language === 'typescript' || file.language === 'javascript';
  },

  async scan(
    file: FileInfo,
    context: {
      projectRoot: string;
      capabilityPatterns?: CapabilityPattern[];
      tsBaseUrl?: string;
      tsPaths?: Record<string, string[]>;
    }
  ): Promise<ScanResult> {
    const edges: DependencyEdge[] = [];
    const externalImports: string[] = [];
    const capabilities: Capability[] = [];
    const detectedCapabilities = new Map<string, Capability>();

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
            const resolved = resolveImport(
              importPath,
              file.path,
              context.projectRoot,
              context.tsBaseUrl,
              context.tsPaths
            );
            if (resolved) {
              edges.push({
                from: file.path,
                to: resolved,
                kind: 'import',
                confidence: 0.99,
                source: 'ts-js-import',
              });
            } else if (isExternalModule(importPath)) {
              // Track external imports
              const packageName = extractPackageName(importPath);
              if (packageName && !externalImports.includes(packageName)) {
                externalImports.push(packageName);
              }
            }
          }
        }

        // ES6 export declarations: export ... from "module"
        if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
          if (ts.isStringLiteral(node.moduleSpecifier)) {
            const importPath = node.moduleSpecifier.text;
            const resolved = resolveImport(
              importPath,
              file.path,
              context.projectRoot,
              context.tsBaseUrl,
              context.tsPaths
            );
            if (resolved) {
              edges.push({
                from: file.path,
                to: resolved,
                kind: 'import',
                confidence: 0.99,
                source: 'ts-js-import',
              });
            } else if (isExternalModule(importPath)) {
              // Track external imports
              const packageName = extractPackageName(importPath);
              if (packageName && !externalImports.includes(packageName)) {
                externalImports.push(packageName);
              }
            }
          }
        }

        // Dynamic imports: import("module")
        if (ts.isCallExpression(node)) {
          if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
            const arg = node.arguments[0];
            if (arg && ts.isStringLiteral(arg)) {
              const importPath = arg.text;
              const resolved = resolveImport(
                importPath,
                file.path,
                context.projectRoot,
                context.tsBaseUrl,
                context.tsPaths
              );
              if (resolved) {
                edges.push({
                  from: file.path,
                  to: resolved,
                  kind: 'import',
                  confidence: 0.98,
                  source: 'ts-js-import',
                });
              } else if (isExternalModule(importPath)) {
                // Track external imports
                const packageName = extractPackageName(importPath);
                if (packageName && !externalImports.includes(packageName)) {
                  externalImports.push(packageName);
                }
              }
            }
          }

          // CommonJS require: require("module")
          if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
            const arg = node.arguments[0];
            if (arg && ts.isStringLiteral(arg)) {
              const importPath = arg.text;
              const resolved = resolveImport(
                importPath,
                file.path,
                context.projectRoot,
                context.tsBaseUrl,
                context.tsPaths
              );
              if (resolved) {
                edges.push({
                  from: file.path,
                  to: resolved,
                  kind: 'import',
                  confidence: 0.98,
                  source: 'ts-js-import',
                });
              } else if (isExternalModule(importPath)) {
                // Track external imports
                const packageName = extractPackageName(importPath);
                if (packageName && !externalImports.includes(packageName)) {
                  externalImports.push(packageName);
                }
              }
            }
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);

      // Detect capabilities if patterns are provided
      if (context.capabilityPatterns && context.capabilityPatterns.length > 0) {
        // Track imported modules for capability detection
        const importedModules = new Set<string>();

        // Collect all imports
        const collectImports = (node: ts.Node) => {
          if (ts.isImportDeclaration(node)) {
            const moduleSpecifier = node.moduleSpecifier;
            if (ts.isStringLiteral(moduleSpecifier)) {
              importedModules.add(moduleSpecifier.text);
            }
          }
          if (ts.isCallExpression(node)) {
            if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
              const arg = node.arguments[0];
              if (arg && ts.isStringLiteral(arg)) {
                importedModules.add(arg.text);
              }
            }
          }
          ts.forEachChild(node, collectImports);
        };
        collectImports(sourceFile);

        // Check imports against capability patterns
        for (const importedModule of importedModules) {
          for (const pattern of context.capabilityPatterns) {
            if (pattern.imports) {
              for (const patternImport of pattern.imports) {
                if (
                  importedModule === patternImport ||
                  importedModule.startsWith(patternImport + '/')
                ) {
                  const key = `${pattern.type}-import-${patternImport}`;
                  if (!detectedCapabilities.has(key)) {
                    detectedCapabilities.set(key, {
                      type: pattern.type,
                      action: `import:${patternImport}`,
                      confidence: 0.95,
                    });
                  }
                }
              }
            }
          }
        }

        // Check for capability-indicating function calls
        const checkCalls = (node: ts.Node) => {
          if (ts.isCallExpression(node)) {
            const callText = getCallExpressionText(node);
            if (callText) {
              for (const pattern of context.capabilityPatterns!) {
                if (pattern.calls) {
                  for (const call of pattern.calls) {
                    if (callText.includes(call)) {
                      const key = `${pattern.type}-${call}`;
                      if (!detectedCapabilities.has(key)) {
                        detectedCapabilities.set(key, {
                          type: pattern.type,
                          action: call,
                          confidence: 0.9,
                          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                        });
                      }
                    }
                  }
                }
              }
            }
          }

          // Check property access (e.g., process.env)
          if (ts.isPropertyAccessExpression(node)) {
            const propText = node.getText(sourceFile);
            for (const pattern of context.capabilityPatterns!) {
              if (pattern.calls) {
                for (const call of pattern.calls) {
                  if (propText === call || propText.startsWith(call + '.')) {
                    const key = `${pattern.type}-${call}`;
                    if (!detectedCapabilities.has(key)) {
                      detectedCapabilities.set(key, {
                        type: pattern.type,
                        action: call,
                        confidence: 0.85,
                        line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                      });
                    }
                  }
                }
              }
            }
          }

          ts.forEachChild(node, checkCalls);
        };
        checkCalls(sourceFile);

        capabilities.push(...detectedCapabilities.values());
      }
    } catch (error) {
      // If parsing fails, return empty result rather than crashing
      console.warn(`Failed to parse ${file.path}:`, error);
    }

    // Build result node if we have imports or capabilities
    if (externalImports.length > 0 || capabilities.length > 0) {
      const node: ProjectFileNode = {
        id: file.path,
        path: file.path,
      };
      if (externalImports.length > 0) {
        node.imports = externalImports;
      }
      if (capabilities.length > 0) {
        node.capabilities = capabilities;
      }
      if (file.language) {
        node.language = file.language;
      }
      return await Promise.resolve({
        edges,
        nodes: [node],
      });
    }

    return await Promise.resolve({ edges });
  },
};

/**
 * Get text representation of a call expression
 */
function getCallExpressionText(node: ts.CallExpression): string | null {
  if (ts.isIdentifier(node.expression)) {
    return node.expression.text;
  }
  if (ts.isPropertyAccessExpression(node.expression)) {
    const obj = getExpressionText(node.expression.expression);
    const prop = node.expression.name.text;
    return obj ? `${obj}.${prop}` : prop;
  }
  return null;
}

/**
 * Get text representation of an expression
 */
function getExpressionText(node: ts.Expression): string | null {
  if (ts.isIdentifier(node)) {
    return node.text;
  }
  if (ts.isPropertyAccessExpression(node)) {
    const obj = getExpressionText(node.expression);
    const prop = node.name.text;
    return obj ? `${obj}.${prop}` : prop;
  }
  return null;
}

/**
 * Resolve an import specifier to a project-relative file path
 * Supports:
 * - Relative imports (./, ../)
 * - Absolute imports within project (/)
 * - TypeScript path aliases (e.g., @/..., @app/...)
 */
function resolveImport(
  specifier: string,
  fromFile: string,
  projectRoot: string,
  tsBaseUrl?: string,
  tsPaths?: Record<string, string[]>
): string | null {
  // 1. Try to resolve TS Path Aliases first
  if (tsPaths) {
    const resolvedAlias = resolveTsAlias(specifier, projectRoot, tsBaseUrl, tsPaths);
    if (resolvedAlias) {
      return resolvedAlias;
    }
  }

  // 2. Handle local relative/absolute imports
  // Ignore external modules (no leading . or /) if they weren't caught by aliases
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
 * Attempt to resolve a specifier using TypeScript paths config
 */
function resolveTsAlias(
  specifier: string,
  projectRoot: string,
  tsBaseUrl: string | undefined,
  tsPaths: Record<string, string[]>
): string | null {
  // We need a baseUrl to resolve non-relative paths
  const effectiveBaseUrl = tsBaseUrl ? path.resolve(projectRoot, tsBaseUrl) : projectRoot;

  for (const pattern in tsPaths) {
    // Normalize pattern for matching
    const isWildcard = pattern.endsWith('*');
    const prefix = isWildcard ? pattern.slice(0, -1) : pattern;

    if (specifier.startsWith(prefix)) {
      // Found a match!
      const mappings = tsPaths[pattern];
      const suffix = specifier.slice(prefix.length);

      if (!mappings) continue;

      for (const mapping of mappings) {
        // Replace wildcard in mapping with the suffix from specifier
        const mappedPath = isWildcard ? mapping.replace('*', suffix) : mapping;

        // Construct full path
        const candidatePath = path.resolve(effectiveBaseUrl, mappedPath);

        // Try to resolve to file
        const resolved = tryResolveFile(candidatePath);
        if (resolved) {
          // Verify it's inside project
          const relative = path.relative(projectRoot, resolved);
          if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
            return toForwardSlashes(relative);
          }
        }
      }
    }
  }
  return null;
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

/**
 * Check if an import specifier is an external module
 */
function isExternalModule(specifier: string): boolean {
  // External modules don't start with . or /
  return !specifier.startsWith('.') && !specifier.startsWith('/');
}

/**
 * Extract the package name from an import specifier
 * Examples:
 * - 'react' -> 'react'
 * - 'react/jsx-runtime' -> 'react'
 * - '@types/node' -> '@types/node'
 * - '@babel/core/lib/config' -> '@babel/core'
 */
function extractPackageName(specifier: string): string | null {
  if (!specifier) return null;

  // Handle scoped packages (@scope/package)
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/');
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return specifier;
  }

  // Handle regular packages
  const parts = specifier.split('/');
  return parts[0] || null;
}
