import type { ParsedArgs } from '../types';

/**
 * Parse command-line arguments into a structured format
 * Supports:
 * - Commands: archctl <command>
 * - Flags: --flag or --flag=value or --flag value
 * - Boolean flags default to true
 * - Multiple values for same flag: --include a --include b => include: ['a', 'b']
 * - Positional arguments after command: archctl layers list => _: ['list']
 */
export function parseArgs() {
  const [, , cmd, ...rest] = process.argv;
  const args: ParsedArgs = { _: [] };
  let currentKey: string | null = null;

  for (const token of rest) {
    if (token.startsWith('--')) {
      const [rawFlag, value] = token.split('=');
      const key = (rawFlag ?? '').slice(2); // strip leading "--" safely

      if (value !== undefined) {
        // --flag=value
        addArgValue(args, key, value);
        currentKey = null;
      } else {
        // --flag (value might come in the next token)
        currentKey = key;
        args[key] = true; // default boolean true
      }
    } else if (currentKey) {
      // token is the value for the previous flag
      addArgValue(args, currentKey, token);
      currentKey = null;
    } else {
      // Positional argument
      if (!args._) args._ = [];
      args._.push(token);
    }
  }

  return { cmd, args };
}

/**
 * Add a value to args, handling multiple values for the same key
 */
function addArgValue(args: ParsedArgs, key: string, value: string): void {
  const existing = args[key];

  if (existing === undefined || existing === true) {
    // First value for this key
    args[key] = value;
  } else if (Array.isArray(existing)) {
    // Already an array, append
    existing.push(value);
  } else {
    // Convert to array
    args[key] = [existing as string, value];
  }
}
