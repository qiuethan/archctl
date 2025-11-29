import * as fs from 'fs';
import * as path from 'path';
import type { ParsedArgs } from '../types';
import { constants } from '../constants';

/**
 * Get the output directory from args, defaulting to configured default
 */
export function getOutDir(args: ParsedArgs): string {
  const out = (args.out as string) || constants.defaultOutDir;
  return path.resolve(process.cwd(), out);
}

/**
 * Ensure a directory exists, creating it recursively if needed
 */
export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
