"use strict";
/**
 * Infrastructure layer - File system scanning
 * Handles finding .archctl directories in the workspace
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
exports.FileScanner = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class FileScanner {
    /**
     * Find all .archctl directories in the workspace
     * Returns array of paths to .archctl directories
     */
    async findAllArchctlDirs(workspaceRoot) {
        const archctlDirs = [];
        await this.scanDir(workspaceRoot, archctlDirs, 0);
        return archctlDirs;
    }
    async scanDir(dir, archctlDirs, depth = 0) {
        // Limit depth to avoid scanning too deep
        if (depth > 10)
            return;
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isDirectory())
                    continue;
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
        }
        catch (error) {
            // Skip directories we can't read
            console.warn('Could not scan directory:', dir, error);
        }
    }
}
exports.FileScanner = FileScanner;
//# sourceMappingURL=file-scanner.js.map