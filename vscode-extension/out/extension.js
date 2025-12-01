"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let diagnosticCollection;
function activate(context) {
    console.log('Archctl extension is now active');
    // Create diagnostic collection
    diagnosticCollection = vscode.languages.createDiagnosticCollection('archctl');
    context.subscriptions.push(diagnosticCollection);
    // Register commands
    const runCheckCommand = vscode.commands.registerCommand('archctl.runCheck', async () => {
        console.log('archctl.runCheck invoked');
        await runArchctlCheck();
    });
    const clearDiagnosticsCommand = vscode.commands.registerCommand('archctl.clearDiagnostics', () => {
        diagnosticCollection.clear();
        vscode.window.showInformationMessage('Archctl diagnostics cleared');
    });
    context.subscriptions.push(runCheckCommand, clearDiagnosticsCommand);
    // Run check on activation if config exists
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        const configPath = path.join(workspaceFolders[0].uri.fsPath, '.archctl', 'archctl.config.json');
        const fs = require('fs');
        if (fs.existsSync(configPath)) {
            // Run check after a short delay to let workspace settle
            setTimeout(() => runArchctlCheck(), 2000);
        }
    }
    // Watch for file changes and re-run check
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,tsx,js,jsx,mjs,cjs,py,java}');
    let debounceTimer;
    const debouncedCheck = () => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => runArchctlCheck(), 1000);
    };
    fileWatcher.onDidChange(debouncedCheck);
    fileWatcher.onDidCreate(debouncedCheck);
    fileWatcher.onDidDelete(debouncedCheck);
    context.subscriptions.push(fileWatcher);
}
async function runArchctlCheck() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showWarningMessage('Archctl: No workspace folder open. Open your project and try again.');
        console.warn('Archctl: No workspaceFolder');
        return;
    }
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    // Check if archctl config exists
    const configPath = path.join(workspaceRoot, '.archctl', 'archctl.config.json');
    const fs = require('fs');
    if (!fs.existsSync(configPath)) {
        vscode.window.showWarningMessage('Archctl: No .archctl/archctl.config.json found in this workspace. Run `archctl init` or open the correct folder.');
        console.warn('Archctl: Config not found at', configPath);
        return;
    }
    try {
        vscode.window.setStatusBarMessage('Running Archctl check...', 2000);
        // Run archctl check with JSON output
        // Try local dev version first, then fall back to npx
        const commands = [
            'node "C:\\Users\\Eeeta\\Projects\\archctl\\dist\\src\\cli.js" lint --format json',
            'npx archctl lint --format json',
        ];
        let stdout = '';
        let stderr = '';
        let lastError;
        for (const cmd of commands) {
            try {
                console.log('Trying command:', cmd);
                const result = await execAsync(cmd, {
                    cwd: workspaceRoot,
                    maxBuffer: 10 * 1024 * 1024, // 10MB buffer
                });
                stdout = result.stdout;
                stderr = result.stderr;
                console.log('Command succeeded');
                break;
            }
            catch (error) {
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
        // Parse JSON output (tolerate banners by extracting the JSON array)
        let issues = [];
        let raw = stdout.trim();
        let jsonText = raw;
        try {
            issues = JSON.parse(jsonText);
            console.log('Parsed issues:', issues.length);
        }
        catch {
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
                }
                catch (parseError2) {
                    console.error('Failed to parse archctl output after cleanup:', parseError2);
                    console.error('Extracted JSON was:', jsonText.slice(0, 500));
                    vscode.window.showErrorMessage('Archctl: failed to parse JSON output. Ensure archctl supports --format json.');
                    return;
                }
            }
            else {
                console.error('Failed to parse archctl output - no JSON array found');
                console.error('Output was:', stdout.slice(0, 500));
                vscode.window.showErrorMessage('Archctl: no JSON array found in output. Ensure archctl supports --format json.');
                return;
            }
        }
        // Clear previous diagnostics
        diagnosticCollection.clear();
        // Group issues by file
        const diagnosticsByFile = new Map();
        for (const issue of issues) {
            console.log('Processing issue:', issue);
            // Convert relative path to absolute
            let absolutePath;
            if (path.isAbsolute(issue.filePath)) {
                absolutePath = issue.filePath;
            }
            else {
                absolutePath = path.join(workspaceRoot, issue.filePath);
            }
            console.log('Absolute path:', absolutePath);
            // Create VS Code range (convert from 1-indexed lines to 0-indexed)
            const range = new vscode.Range(new vscode.Position(Math.max(0, issue.range.startLine - 1), Math.max(0, issue.range.startCol)), new vscode.Position(Math.max(0, issue.range.endLine - 1), Math.max(0, issue.range.endCol)));
            console.log('Created range:', range);
            // Map severity
            let severity;
            switch (issue.severity) {
                case 'error':
                    severity = vscode.DiagnosticSeverity.Error;
                    break;
                case 'warning':
                    severity = vscode.DiagnosticSeverity.Warning;
                    break;
                case 'info':
                    severity = vscode.DiagnosticSeverity.Information;
                    break;
                default:
                    severity = vscode.DiagnosticSeverity.Warning;
            }
            // Create diagnostic
            const diagnostic = new vscode.Diagnostic(range, issue.message, severity);
            diagnostic.source = 'archctl';
            diagnostic.code = issue.ruleId;
            // Add suggestion as related information if available
            if (issue.suggestion) {
                diagnostic.relatedInformation = [
                    new vscode.DiagnosticRelatedInformation(new vscode.Location(vscode.Uri.file(absolutePath), range), `Suggestion: ${issue.suggestion}`),
                ];
            }
            // Group by file
            if (!diagnosticsByFile.has(absolutePath)) {
                diagnosticsByFile.set(absolutePath, []);
            }
            diagnosticsByFile.get(absolutePath).push(diagnostic);
        }
        // Apply diagnostics to each file
        for (const [filePath, diagnostics] of diagnosticsByFile.entries()) {
            diagnosticCollection.set(vscode.Uri.file(filePath), diagnostics);
        }
        // Show status message
        const errorCount = issues.filter((i) => i.severity === 'error').length;
        const warningCount = issues.filter((i) => i.severity === 'warning').length;
        if (issues.length === 0) {
            vscode.window.setStatusBarMessage('Archctl: No issues found', 5000);
            vscode.window.showInformationMessage('Archctl: No issues found');
        }
        else {
            const message = `Archctl: ${errorCount} error(s), ${warningCount} warning(s)`;
            vscode.window.setStatusBarMessage(message, 5000);
            vscode.window.showInformationMessage(message);
        }
    }
    catch (error) {
        // Check if it's a non-zero exit (which is expected for violations)
        if (error.code === 1 && error.stdout) {
            // Try to parse the output anyway
            try {
                const issues = JSON.parse(error.stdout);
                // Clear previous diagnostics
                diagnosticCollection.clear();
                // Group issues by file
                const diagnosticsByFile = new Map();
                for (const issue of issues) {
                    let absolutePath;
                    if (path.isAbsolute(issue.filePath)) {
                        absolutePath = issue.filePath;
                    }
                    else {
                        absolutePath = path.join(workspaceRoot, issue.filePath);
                    }
                    const range = new vscode.Range(new vscode.Position(Math.max(0, issue.range.startLine - 1), Math.max(0, issue.range.startCol)), new vscode.Position(Math.max(0, issue.range.endLine - 1), Math.max(0, issue.range.endCol)));
                    let severity;
                    switch (issue.severity) {
                        case 'error':
                            severity = vscode.DiagnosticSeverity.Error;
                            break;
                        case 'warning':
                            severity = vscode.DiagnosticSeverity.Warning;
                            break;
                        case 'info':
                            severity = vscode.DiagnosticSeverity.Information;
                            break;
                        default:
                            severity = vscode.DiagnosticSeverity.Warning;
                    }
                    const diagnostic = new vscode.Diagnostic(range, issue.message, severity);
                    diagnostic.source = 'archctl';
                    diagnostic.code = issue.ruleId;
                    if (issue.suggestion) {
                        diagnostic.relatedInformation = [
                            new vscode.DiagnosticRelatedInformation(new vscode.Location(vscode.Uri.file(absolutePath), range), `Suggestion: ${issue.suggestion}`),
                        ];
                    }
                    if (!diagnosticsByFile.has(absolutePath)) {
                        diagnosticsByFile.set(absolutePath, []);
                    }
                    diagnosticsByFile.get(absolutePath).push(diagnostic);
                }
                for (const [filePath, diagnostics] of diagnosticsByFile.entries()) {
                    diagnosticCollection.set(vscode.Uri.file(filePath), diagnostics);
                }
                const errorCount = issues.filter((i) => i.severity === 'error').length;
                const warningCount = issues.filter((i) => i.severity === 'warning').length;
                const message = `Archctl: ${errorCount} error(s), ${warningCount} warning(s)`;
                vscode.window.setStatusBarMessage(message, 5000);
                return;
            }
            catch (parseError) {
                // Fall through to error handling
            }
        }
        console.error('Archctl check failed:', error);
        vscode.window.showErrorMessage(`Archctl check failed: ${error.message}`);
    }
}
function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}
//# sourceMappingURL=extension.js.map