import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import type { PositionRange } from '../types/rules';

/**
 * Language-specific position finders
 */

/**
 * Find the position of an import statement in a TypeScript/JavaScript file
 * @param filePath - Absolute path to the file
 * @param importedModule - The module being imported (e.g., '../domain/user', 'react')
 * @returns Position range or null if not found
 */
export function findImportPosition(filePath: string, importedModule: string): PositionRange | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true);

    let foundNode: ts.Node | undefined = undefined;

    const visit = (node: ts.Node): void => {
      // ES6 import declarations
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier) && moduleSpecifier.text === importedModule) {
          foundNode = node;
          return;
        }
      }

      // ES6 export declarations
      if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
        if (
          ts.isStringLiteral(node.moduleSpecifier) &&
          node.moduleSpecifier.text === importedModule
        ) {
          foundNode = node;
          return;
        }
      }

      // Dynamic imports
      if (ts.isCallExpression(node)) {
        if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
          const arg = node.arguments[0];
          if (arg && ts.isStringLiteral(arg) && arg.text === importedModule) {
            foundNode = node;
            return;
          }
        }

        // CommonJS require
        if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
          const arg = node.arguments[0];
          if (arg && ts.isStringLiteral(arg) && arg.text === importedModule) {
            foundNode = node;
            return;
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    if (foundNode) {
      const node = foundNode as ts.Node;
      const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());

      return {
        startLine: start.line + 1, // Convert to 1-indexed
        startCol: start.character,
        endLine: end.line + 1,
        endCol: end.character,
      };
    }

    return null;
  } catch (error) {
    console.warn(`Failed to parse ${filePath} for import position:`, error);
    return null;
  }
}

/**
 * Get the position range for the entire file (fallback)
 */
export function getFileStartPosition(): PositionRange {
  return {
    startLine: 1,
    startCol: 0,
    endLine: 1,
    endCol: 0,
  };
}

/**
 * Resolve a relative import path to match what's in the source code
 * @param fromFile - The file doing the importing (project-relative)
 * @param toFile - The file being imported (project-relative)
 * @param projectRoot - Absolute path to project root
 * @returns The import specifier as it appears in code, or null
 */
export function resolveImportSpecifier(
  fromFile: string,
  toFile: string,
  projectRoot: string
): string | null {
  try {
    const fromAbs = path.join(projectRoot, fromFile);
    const toAbs = path.join(projectRoot, toFile);

    const fromDir = path.dirname(fromAbs);
    let relativePath = path.relative(fromDir, toAbs);

    // Convert to forward slashes
    relativePath = relativePath.replace(/\\/g, '/');

    // Remove extension
    relativePath = relativePath.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '');

    // Add ./ prefix if needed
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }

    return relativePath;
  } catch (error) {
    return null;
  }
}

/**
 * Find the position of an import statement in a Python file
 * @param filePath - Absolute path to the file
 * @param importedModule - The module being imported (e.g., 'infrastructure', 'pydantic')
 * @returns Position range or null if not found
 */
export function findPythonImportPosition(
  filePath: string,
  importedModule: string
): PositionRange | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const lines = sourceCode.split('\n');

    // Match: import module
    // Match: from module import ...
    // Match: from module.submodule import ...
    const importRegex = new RegExp(
      `^\\s*(?:from\\s+)?(${escapeRegex(importedModule)})(?:\\s|\\.|$)`,
      'i'
    );
    const fromImportRegex = new RegExp(
      `^\\s*from\\s+(${escapeRegex(importedModule)})(?:\\s|\\.)`,
      'i'
    );

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const lineNumber = i + 1;

      // Check for "import module" or "from module import"
      if (importRegex.test(line) || fromImportRegex.test(line)) {
        // Find the start column of the module name
        const match = line.match(importRegex) || line.match(fromImportRegex);
        if (match && match.index !== undefined && match[0]) {
          const moduleIndex = match[0].indexOf(importedModule);
          if (moduleIndex === -1) continue;
          const startCol = match.index + moduleIndex;
          const endCol = startCol + importedModule.length;

          return {
            startLine: lineNumber,
            startCol,
            endLine: lineNumber,
            endCol,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.warn(`Failed to parse ${filePath} for Python import position:`, error);
    return null;
  }
}

/**
 * Find the position of an import statement in a Java file
 * @param filePath - Absolute path to the file
 * @param importedClass - The class being imported (e.g., 'com.example.User')
 * @returns Position range or null if not found
 */
export function findJavaImportPosition(
  filePath: string,
  importedClass: string
): PositionRange | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const lines = sourceCode.split('\n');

    // Match: import com.example.User;
    // Match: import static com.example.User.method;
    const importRegex = new RegExp(
      `^\\s*import\\s+(?:static\\s+)?(${escapeRegex(importedClass)})(?:\\s|;|\\.)`,
      'i'
    );

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const lineNumber = i + 1;

      const match = line.match(importRegex);
      if (match && match.index !== undefined) {
        const startCol = match.index + match[0].indexOf(importedClass);
        const endCol = startCol + importedClass.length;

        return {
          startLine: lineNumber,
          startCol,
          endLine: lineNumber,
          endCol,
        };
      }
    }

    return null;
  } catch (error) {
    console.warn(`Failed to parse ${filePath} for Java import position:`, error);
    return null;
  }
}

/**
 * Extract the top-level Python module name from a file path
 * e.g., "infrastructure/__init__.py" -> "infrastructure"
 * e.g., "domain/entities/user.py" -> "domain"
 */
export function extractPythonModuleName(filePath: string): string | null {
  if (!filePath) return null;
  // Remove leading ./
  const clean = filePath.replace(/^\.\//, '');
  // Get first path segment
  const parts = clean.split('/');
  return parts[0] || null;
}

/**
 * Extract the Java package name from a file path
 * e.g., "src/main/java/com/example/domain/User.java" -> "com.example.domain"
 * e.g., "domain/entities/User.java" -> "domain.entities"
 */
export function extractJavaPackageName(filePath: string): string | null {
  if (!filePath) return null;

  // Remove leading ./
  let clean = filePath.replace(/^\.\//, '');

  // Remove common Java source roots
  clean = clean.replace(/^src\/main\/java\//, '');
  clean = clean.replace(/^src\/test\/java\//, '');
  clean = clean.replace(/^src\//, '');

  // Remove the file name (everything after the last /)
  const lastSlash = clean.lastIndexOf('/');
  if (lastSlash === -1) {
    // No package, just a file in root
    return null;
  }

  const packagePath = clean.substring(0, lastSlash);

  // Convert path separators to dots
  const packageName = packagePath.replace(/\//g, '.');

  return packageName || null;
}

/**
 * Extract module/package name based on language
 */
export function extractModuleName(filePath: string, language: string): string | null {
  switch (language) {
    case 'python':
      return extractPythonModuleName(filePath);
    case 'java':
      return extractJavaPackageName(filePath);
    default:
      return null;
  }
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Resolve the import specifier based on language and file paths
 * This handles the differences between how languages reference imports
 */
export function resolveImportSpecifierForLanguage(
  fromFile: string,
  toFile: string,
  language: string,
  projectRoot: string
): string | null {
  switch (language) {
    case 'typescript':
    case 'javascript':
      // Use relative path resolution
      return resolveImportSpecifier(fromFile, toFile, projectRoot);
    case 'python':
    case 'java':
      // Extract module/package name from file path
      return extractModuleName(toFile, language);
    default:
      return null;
  }
}

/**
 * Find import position for any language
 * @param filePath - Absolute path to the file
 * @param importedModule - The module/class being imported
 * @param language - The programming language
 * @returns Position range or null if not found
 */
export function findImportPositionForLanguage(
  filePath: string,
  importedModule: string,
  language: string
): PositionRange | null {
  switch (language) {
    case 'typescript':
    case 'javascript':
      return findImportPosition(filePath, importedModule);
    case 'python':
      return findPythonImportPosition(filePath, importedModule);
    case 'java':
      return findJavaImportPosition(filePath, importedModule);
    default:
      return null;
  }
}

/**
 * Find the position range for an import violation
 * This is the main entry point that handles all language-specific logic
 */
export function findViolationRange(
  fromFilePath: string,
  toFilePath: string,
  language: string,
  projectRoot: string
): PositionRange | null {
  // Resolve what the import specifier looks like in the source code
  const importSpecifier = resolveImportSpecifierForLanguage(
    fromFilePath,
    toFilePath,
    language,
    projectRoot
  );

  if (!importSpecifier) {
    return null;
  }

  // Find the exact position of that import in the file
  const absolutePath = path.join(projectRoot, fromFilePath);
  return findImportPositionForLanguage(absolutePath, importSpecifier, language);
}
