"use strict";
/**
 * Presentation layer - Maps domain issues to VSCode diagnostics
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
exports.DiagnosticMapper = void 0;
const vscode = __importStar(require("vscode"));
class DiagnosticMapper {
    /**
     * Convert archctl issues to VSCode diagnostics grouped by file
     */
    mapIssuesToDiagnostics(issues) {
        const diagnosticsByFile = new Map();
        for (const issue of issues) {
            console.log('Processing issue:', issue);
            const absolutePath = issue.filePath;
            console.log('Absolute path:', absolutePath);
            // Create VS Code range (convert from 1-indexed lines to 0-indexed)
            const range = new vscode.Range(new vscode.Position(Math.max(0, issue.range.startLine - 1), Math.max(0, issue.range.startCol)), new vscode.Position(Math.max(0, issue.range.endLine - 1), Math.max(0, issue.range.endCol)));
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
                    new vscode.DiagnosticRelatedInformation(new vscode.Location(vscode.Uri.file(absolutePath), range), `Suggestion: ${issue.suggestion}`),
                ];
            }
            // Group by file
            if (!diagnosticsByFile.has(absolutePath)) {
                diagnosticsByFile.set(absolutePath, []);
            }
            diagnosticsByFile.get(absolutePath).push(diagnostic);
        }
        return diagnosticsByFile;
    }
    mapSeverity(severity) {
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
exports.DiagnosticMapper = DiagnosticMapper;
//# sourceMappingURL=diagnostic-mapper.js.map