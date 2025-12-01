/**
 * Presentation layer - Maps domain issues to VSCode diagnostics
 */

import * as vscode from 'vscode';
import { ArchctlIssue } from '../domain/types';

export class DiagnosticMapper {
  /**
   * Convert archctl issues to VSCode diagnostics grouped by file
   */
  mapIssuesToDiagnostics(issues: ArchctlIssue[]): Map<string, vscode.Diagnostic[]> {
    const diagnosticsByFile = new Map<string, vscode.Diagnostic[]>();

    for (const issue of issues) {
      console.log('Processing issue:', issue);

      const absolutePath = issue.filePath;
      console.log('Absolute path:', absolutePath);

      // Create VS Code range (convert from 1-indexed lines to 0-indexed)
      const range = new vscode.Range(
        new vscode.Position(
          Math.max(0, issue.range.startLine - 1),
          Math.max(0, issue.range.startCol)
        ),
        new vscode.Position(
          Math.max(0, issue.range.endLine - 1),
          Math.max(0, issue.range.endCol)
        )
      );

      console.log('Created range:', range);

      // Map severity
      const severity = this.mapSeverity(issue.severity);

      // Create diagnostic
      const diagnostic = new vscode.Diagnostic(range, issue.message, severity);
      diagnostic.source = 'archctl';
      diagnostic.code = issue.ruleId;

      // Add suggestion as related information if available
      if (issue.suggestion) {
        diagnostic.relatedInformation = [
          new vscode.DiagnosticRelatedInformation(
            new vscode.Location(vscode.Uri.file(absolutePath), range),
            `Suggestion: ${issue.suggestion}`
          ),
        ];
      }

      // Group by file
      if (!diagnosticsByFile.has(absolutePath)) {
        diagnosticsByFile.set(absolutePath, []);
      }
      diagnosticsByFile.get(absolutePath)!.push(diagnostic);
    }

    return diagnosticsByFile;
  }

  private mapSeverity(severity: 'error' | 'warning' | 'info'): vscode.DiagnosticSeverity {
    switch (severity) {
      case 'error':
        return vscode.DiagnosticSeverity.Error;
      case 'warning':
        return vscode.DiagnosticSeverity.Warning;
      case 'info':
        return vscode.DiagnosticSeverity.Information;
      default:
        return vscode.DiagnosticSeverity.Warning;
    }
  }
}
