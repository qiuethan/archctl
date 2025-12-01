/**
 * Infrastructure layer - Archctl CLI execution
 * Handles running the archctl command and parsing output
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { ArchctlIssue } from '../domain/types';

const execAsync = promisify(exec);

export class ArchctlExecutor {
  /**
   * Run archctl check for a specific project root
   * Returns array of issues or null if check failed
   */
  async runCheck(projectRoot: string): Promise<ArchctlIssue[] | null> {
    console.log('Running archctl check for:', projectRoot);

    try {
      // Run archctl check with JSON output
      // Try local dev version first, then fall back to npx
      const commands = [
        'node "C:\\Users\\Eeeta\\Projects\\archctl\\dist\\src\\cli.js" lint --format json',
        'npx archctl lint --format json',
      ];

      let stdout: string = '';
      let stderr: string = '';
      let lastError: any;

      for (const cmd of commands) {
        try {
          console.log('Trying command:', cmd);
          const result = await execAsync(cmd, {
            cwd: projectRoot,
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
          });
          stdout = result.stdout;
          stderr = result.stderr;
          console.log('Command succeeded');
          break;
        } catch (error: any) {
          // Exit code 1 is expected when there are violations
          if (error.code === 1 && error.stdout) {
            stdout = error.stdout;
            stderr = error.stderr || '';
            console.log('Archctl found violations (exit code 1)');
            break;
          }
          lastError = error;
          console.warn('Command failed:', cmd, error.message);
        }
      }

      if (!stdout && lastError) {
        throw lastError;
      }

      console.log('Archctl stdout:', stdout);
      console.log('Archctl stderr:', stderr);

      // Parse JSON output
      const issues = this.parseOutput(stdout);
      if (!issues) {
        console.warn('Could not parse output for project:', projectRoot);
        return null;
      }

      // Convert relative paths to absolute
      for (const issue of issues) {
        if (!path.isAbsolute(issue.filePath)) {
          issue.filePath = path.join(projectRoot, issue.filePath);
        }
      }

      return issues;
    } catch (error: any) {
      console.error('Archctl check failed for project:', projectRoot, error);
      return null;
    }
  }

  /**
   * Parse archctl JSON output, handling banners and mixed output
   */
  private parseOutput(stdout: string): ArchctlIssue[] | null {
    let issues: ArchctlIssue[] = [];
    const raw = stdout.trim();
    let jsonText = raw;

    try {
      issues = JSON.parse(jsonText);
      console.log('Parsed issues:', issues.length);
      return issues;
    } catch {
      // Try to extract the JSON array from mixed output (banners + JSON)
      // Look for a line that starts with [ (the JSON array start)
      const lines = raw.split('\n');
      let jsonStartIndex = -1;
      let jsonEndIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('[') && jsonStartIndex === -1) {
          jsonStartIndex = i;
        }
        if (trimmed === ']' && jsonStartIndex !== -1) {
          jsonEndIndex = i;
          break;
        }
      }

      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        jsonText = lines.slice(jsonStartIndex, jsonEndIndex + 1).join('\n');
        try {
          issues = JSON.parse(jsonText);
          console.log('Parsed issues after extracting JSON array:', issues.length);
          return issues;
        } catch (parseError2) {
          console.error('Failed to parse archctl output after cleanup:', parseError2);
          console.error('Extracted JSON was:', jsonText.slice(0, 500));
          return null;
        }
      } else {
        console.error('Failed to parse archctl output - no JSON array found');
        console.error('Output was:', stdout.slice(0, 500));
        return null;
      }
    }
  }
}
