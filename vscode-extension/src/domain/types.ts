/**
 * Domain types for Archctl VSCode extension
 * Pure TypeScript interfaces with no external dependencies
 */

export interface ArchctlIssue {
  ruleId: string;
  message: string;
  filePath: string;
  severity: 'error' | 'warning' | 'info';
  range: {
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
  };
  suggestion?: string;
}

export interface ArchctlCheckResult {
  issues: ArchctlIssue[];
  projectRoot: string;
}
