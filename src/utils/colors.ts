import chalk from 'chalk';

/**
 * Centralized color utilities for CLI output
 * Uses chalk for cross-platform terminal colors
 */

export const colors = {
  // Status colors
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.cyan,

  // Emphasis
  bold: chalk.bold,
  dim: chalk.dim,

  // Semantic colors
  primary: chalk.blue,
  secondary: chalk.magenta,

  // Special formatting
  highlight: chalk.bgYellow.black,
  code: chalk.cyan,
  path: chalk.gray,

  // Rule severity colors
  severityError: chalk.red.bold,
  severityWarning: chalk.yellow.bold,
  severityInfo: chalk.blue.bold,

  // Symbols with colors
  symbols: {
    success: chalk.green('✓'),
    error: chalk.red('✗'),
    warning: chalk.yellow('⚠'),
    info: chalk.blue('ℹ'),
    bullet: chalk.gray('•'),
    arrow: chalk.gray('→'),
    check: chalk.green('✅'),
    cross: chalk.red('❌'),
    lightbulb: chalk.yellow('💡'),
  },
};

/**
 * Format a file path with dimmed directory and highlighted filename
 */
export function formatFilePath(filePath: string): string {
  const parts = filePath.split('/');
  if (parts.length === 1) {
    return chalk.cyan(filePath);
  }
  const filename = parts[parts.length - 1];
  const dir = parts.slice(0, -1).join('/');
  return chalk.gray(dir + '/') + chalk.cyan(filename);
}

/**
 * Format a count with color based on value
 */
export function formatCount(count: number, zeroIsGood = true): string {
  if (count === 0) {
    return zeroIsGood ? chalk.green('0') : chalk.gray('0');
  }
  if (count < 5) {
    return chalk.yellow(count.toString());
  }
  return chalk.red(count.toString());
}

/**
 * Format a rule ID
 */
export function formatRuleId(id: string): string {
  return chalk.cyan(`[${id}]`);
}

/**
 * Format a layer name
 */
export function formatLayer(layer: string): string {
  return chalk.magenta(layer);
}

/**
 * Format a package name
 */
export function formatPackage(pkg: string): string {
  return chalk.cyan(pkg);
}
