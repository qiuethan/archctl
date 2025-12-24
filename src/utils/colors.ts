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
    success: chalk.green('[✓]'),
    error: chalk.red('[✗]'),
    warning: chalk.yellow('[!]'),
    info: chalk.blue('[i]'),
    bullet: chalk.gray('•'),
    arrow: chalk.gray('→'),
    check: chalk.green('[✓]'),
    cross: chalk.red('[✗]'),
    lightbulb: chalk.yellow('[→]'),
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
 * Format a context name
 */
export function formatContext(context: string): string {
  return chalk.blue(context);
}

/**
 * Format a package name
 */
export function formatPackage(pkg: string): string {
  return chalk.cyan(pkg);
}

/**
 * Calculate percentage change between two numbers
 */
function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) {
    return newValue === 0 ? 0 : 100;
  }
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Format a trend with arrow and percentage
 */
export function formatTrend(oldValue: number, newValue: number): string {
  const change = calculatePercentageChange(oldValue, newValue);
  const absChange = Math.abs(change);

  if (absChange < 0.1) {
    return `${chalk.gray('→')} ${chalk.gray('stable')}`;
  }

  if (change > 0) {
    return `${chalk.red('↑')} ${chalk.red(`+${absChange.toFixed(1)}%`)}`;
  }

  return `${chalk.green('↓')} ${chalk.green(`${absChange.toFixed(1)}%`)}`;
}

/**
 * Format a series of values with trend
 */
export function formatTrendSeries(values: number[], maxDisplay: number = 5): string {
  if (values.length === 0) {
    return '';
  }

  const displayValues = values.slice(-maxDisplay);
  const valueStr = displayValues.map((v) => v.toString()).join(' → ');

  // Calculate trend from oldest to newest in the displayed range
  if (displayValues.length >= 2) {
    const oldest = displayValues[0];
    const newest = displayValues[displayValues.length - 1];
    if (oldest !== undefined && newest !== undefined) {
      const trend = formatTrend(oldest, newest);
      return `${valueStr} (${trend})`;
    }
  }

  return valueStr;
}
