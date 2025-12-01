"use strict";
/**
 * Application layer - Check orchestration service
 * Coordinates finding archctl directories and running checks
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
exports.CheckService = void 0;
const path = __importStar(require("path"));
const file_scanner_1 = require("../infrastructure/file-scanner");
const archctl_executor_1 = require("../infrastructure/archctl-executor");
class CheckService {
    constructor() {
        this.fileScanner = new file_scanner_1.FileScanner();
        this.archctlExecutor = new archctl_executor_1.ArchctlExecutor();
    }
    /**
     * Run archctl checks for all projects in the workspace
     */
    async runChecksForWorkspace(workspaceRoot) {
        // Find all .archctl directories in workspace
        const archctlDirs = await this.fileScanner.findAllArchctlDirs(workspaceRoot);
        if (archctlDirs.length === 0) {
            console.warn('Archctl: No .archctl directories found');
            return [];
        }
        console.log(`Found ${archctlDirs.length} .archctl director${archctlDirs.length === 1 ? 'y' : 'ies'}:`, archctlDirs);
        // Run check for each .archctl directory
        const results = [];
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
exports.CheckService = CheckService;
//# sourceMappingURL=check-service.js.map