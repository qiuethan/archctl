/**
 * Infrastructure layer - File system scanning
 * Handles finding .archctl directories in the workspace
 */

import * as path from 'path';
import * as fs from 'fs';

export class FileScanner {
  /**
   * Find all .archctl directories in the workspace
   * Returns array of paths to .archctl directories
   */
  async findAllArchctlDirs(workspaceRoot: string): Promise<string[]> {
    const archctlDirs: string[] = [];

    await this.scanDir(workspaceRoot, archctlDirs, 0);
    return archctlDirs;
  }

  private async scanDir(dir: string, archctlDirs: string[], depth: number = 0): Promise<void> {
    // Limit depth to avoid scanning too deep
    if (depth > 10) return;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const fullPath = path.join(dir, entry.name);

        // Skip common directories that shouldn't contain .archctl
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'build') {
          continue;
        }

        // Check if this is an .archctl directory
        if (entry.name === '.archctl') {
          const configPath = path.join(fullPath, 'archctl.config.json');
          if (fs.existsSync(configPath)) {
            archctlDirs.push(fullPath);
          }
          continue; // Don't recurse into .archctl
        }

        // Recurse into subdirectories
        await this.scanDir(fullPath, archctlDirs, depth + 1);
      }
    } catch (error) {
      // Skip directories we can't read
      console.warn('Could not scan directory:', dir, error);
    }
  }
}
