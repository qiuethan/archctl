/**
 * Presentation layer - VSCode extension entry point
 * Handles extension lifecycle, commands, and UI integration
 */

import * as vscode from 'vscode';
import { CheckService } from './application/check-service';
import { DiagnosticMapper } from './presentation/diagnostic-mapper';
import { ConfigHelper } from './shared/config-helper';
import { ArchctlIssue } from './domain/types';

let diagnosticCollection: vscode.DiagnosticCollection;
let checkService: CheckService;
let diagnosticMapper: DiagnosticMapper;
let configHelper: ConfigHelper;

export function activate(context: vscode.ExtensionContext) {
  console.log('Archctl extension is now active');

  // Initialize services
  checkService = new CheckService();
  diagnosticMapper = new DiagnosticMapper();
  configHelper = new ConfigHelper();

  // Create diagnostic collection
  diagnosticCollection = vscode.languages.createDiagnosticCollection('archctl');
  context.subscriptions.push(diagnosticCollection);

  // Register commands
  const runCheckCommand = vscode.commands.registerCommand('archctl.runCheck', async () => {
    console.log('archctl.runCheck invoked');
    await runArchctlCheck();
  });

  const clearDiagnosticsCommand = vscode.commands.registerCommand(
    'archctl.clearDiagnostics',
    () => {
      diagnosticCollection.clear();
      vscode.window.showInformationMessage('Archctl diagnostics cleared');
    }
  );

  context.subscriptions.push(runCheckCommand, clearDiagnosticsCommand);

  // Run check on activation if any .archctl configs exist
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    // Run check after a short delay to let workspace settle
    setTimeout(async () => {
      const results = await checkService.runChecksForWorkspace(workspaceFolders[0].uri.fsPath);
      if (results.length > 0) {
        await runArchctlCheck();
      }
    }, 2000);
  }

  // Watch for file changes and re-run check
  const fileWatcher = vscode.workspace.createFileSystemWatcher(
    '**/*.{ts,tsx,js,jsx,mjs,cjs,py,java}'
  );

  let debounceTimer: NodeJS.Timeout | undefined;
  const debouncedCheck = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    const delay = configHelper.getDebounceDelay();
    debounceTimer = setTimeout(() => runArchctlCheck(), delay);
  };

  fileWatcher.onDidChange(debouncedCheck);
  fileWatcher.onDidCreate(debouncedCheck);
  fileWatcher.onDidDelete(debouncedCheck);

  context.subscriptions.push(fileWatcher);
}

async function runArchctlCheck(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showWarningMessage('Archctl: No workspace folder open. Open your project and try again.');
    console.warn('Archctl: No workspaceFolder');
    return;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;

  // Run checks for all projects in workspace
  const results = await checkService.runChecksForWorkspace(workspaceRoot);
  
  if (results.length === 0) {
    vscode.window.showWarningMessage('Archctl: No .archctl/archctl.config.json found in this workspace. Run `archctl init` or open the correct folder.');
    console.warn('Archctl: No .archctl directories found');
    return;
  }
  
  // Clear previous diagnostics
  diagnosticCollection.clear();
  
  // Collect all issues from all projects
  const allIssues: ArchctlIssue[] = [];
  for (const result of results) {
    allIssues.push(...result.issues);
  }
  
  // Process all issues
  if (allIssues.length === 0) {
    vscode.window.setStatusBarMessage('Archctl: No issues found', 5000);
    vscode.window.showInformationMessage('Archctl: No issues found');
    return;
  }
  
  // Map issues to diagnostics
  const diagnosticsByFile = diagnosticMapper.mapIssuesToDiagnostics(allIssues);

  // Apply diagnostics to each file
  for (const [filePath, diagnostics] of diagnosticsByFile.entries()) {
    diagnosticCollection.set(vscode.Uri.file(filePath), diagnostics);
  }

  // Show status message
  const errorCount = allIssues.filter((i) => i.severity === 'error').length;
  const warningCount = allIssues.filter((i) => i.severity === 'warning').length;
  const message = `Archctl: ${errorCount} error(s), ${warningCount} warning(s)`;
  vscode.window.setStatusBarMessage(message, 5000);
  vscode.window.showInformationMessage(message);
}


export function deactivate() {
  if (diagnosticCollection) {
    diagnosticCollection.dispose();
  }
}
