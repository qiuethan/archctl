import * as fs from 'fs';
import * as path from 'path';

export function getOutDir(args: Record<string, any>): string {
  const out = (args.out as string) || 'architecture';
  return path.resolve(process.cwd(), out);
}

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
