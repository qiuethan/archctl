import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { constants } from '../../utils/constants';
import type { ScanResult } from '../../types/scanner';

/**
 * Interface for cache data stored on disk
 */
export interface CacheStore {
  version: string;
  entries: Record<string, FileCacheEntry>;
}

export interface FileCacheEntry {
  hash: string; // Hash of file content + context
  timestamp: number;
  result: ScanResult; // The scan result
}

/**
 * Service to handle caching of scan results
 *
 * Caches are stored in .archctl/cache.json
 */
export class CacheService {
  private cachePath: string;
  private store: CacheStore;
  private isDirty = false;
  private readonly CACHE_VERSION = '1.0.0';

  constructor(projectRoot: string) {
    this.cachePath = path.join(projectRoot, constants.defaultOutDir, 'cache.json');
    this.store = this.loadStore();
  }

  private loadStore(): CacheStore {
    try {
      if (fs.existsSync(this.cachePath)) {
        const content = fs.readFileSync(this.cachePath, 'utf-8');
        const data = JSON.parse(content) as CacheStore;
        if (data.version === this.CACHE_VERSION) {
          return data;
        }
      }
    } catch (error) {
      // Ignore errors, start with empty cache
    }
    return { version: this.CACHE_VERSION, entries: {} };
  }

  public get(filePath: string, contentHash: string): ScanResult | null {
    const entry = this.store.entries[filePath];
    if (entry && entry.hash === contentHash) {
      return entry.result;
    }
    return null;
  }

  public set(filePath: string, contentHash: string, result: ScanResult): void {
    this.store.entries[filePath] = {
      hash: contentHash,
      result,
      timestamp: Date.now(),
    };
    this.isDirty = true;
  }

  public save(): void {
    if (!this.isDirty) return;

    try {
      const dir = path.dirname(this.cachePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.cachePath, JSON.stringify(this.store, null, 2), 'utf-8');
      this.isDirty = false;
    } catch (error) {
      console.warn('Failed to save cache:', error);
    }
  }

  public clear(): void {
    this.store = { version: this.CACHE_VERSION, entries: {} };
    this.isDirty = true;
    this.save();
  }

  public static computeHash(content: string, extraContext: string = ''): string {
    return crypto.createHash('md5').update(content).update(extraContext).digest('hex');
  }
}
