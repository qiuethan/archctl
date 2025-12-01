"use strict";
/**
 * Presentation layer - VSCode extension entry point
 * Handles extension lifecycle, commands, and UI integration
 */
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
const check_service_1 = require("./application/check-service");
const diagnostic_mapper_1 = require("./presentation/diagnostic-mapper");
const config_helper_1 = require("./shared/config-helper");
let diagnosticCollection;
let checkService;
let diagnosticMapper;
let configHelper;
function activate(context) {
    console.log('Archctl extension is now active');
    // Initialize services
    checkService = new check_service_1.CheckService();
    diagnosticMapper = new diagnostic_mapper_1.DiagnosticMapper();
    configHelper = new config_helper_1.ConfigHelper();
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
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,tsx,js,jsx,mjs,cjs,py,java}');
    let debounceTimer;
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
async function runArchctlCheck() {
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
    const allIssues = [];
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
function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}
//# sourceMappingURL=extension.js.map