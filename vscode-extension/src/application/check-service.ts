/**
 * Application layer - Check orchestration service
 * Coordinates finding archctl directories and running checks
 */

import * as path from 'path';
import { ArchctlCheckResult } from '../domain/types';
import { FileScanner } from '../infrastructure/file-scanner';
import { ArchctlExecutor } from '../infrastructure/archctl-executor';

export class CheckService {
  private fileScanner: FileScanner;
  private archctlExecutor: ArchctlExecutor;

  constructor() {
    this.fileScanner = new FileScanner();
    this.archctlExecutor = new ArchctlExecutor();
  }

  /**
   * Run archctl checks for all projects in the workspace
   */
  async runChecksForWorkspace(workspaceRoot: string): Promise<ArchctlCheckResult[]> {
    // Find all .archctl directories in workspace
    const archctlDirs = await this.fileScanner.findAllArchctlDirs(workspaceRoot);

    if (archctlDirs.length === 0) {
      console.warn('Archctl: No .archctl directories found');
      return [];
    }

    console.log(`Found ${archctlDirs.length} .archctl director${archctlDirs.length === 1 ? 'y' : 'ies'}:`, archctlDirs);

    // Run check for each .archctl directory
    const results: ArchctlCheckResult[] = [];

    for (const archctlDir of archctlDirs) {
      const projectRoot = path.dirname(archctlDir);
      const issues = await this.archctlExecutor.runCheck(projectRoot);
      
      if (issues) {
        results.push({
          issues,
          projectRoot
        });
      }
    }

    return results;
  }
}
