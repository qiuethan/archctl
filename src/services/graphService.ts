/**
 * Service for analyzing project dependency graph
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import * as path from 'path';
import * as fs from 'fs';
import type { ArchctlConfig } from '../types/config';
import type { ProjectGraph } from '../types/graph';
import { buildProjectGraph, getGraphStats } from '../infrastructure/graph/graphBuilder';
import { parseGitignore, mergeExcludes } from '../utils/gitignore';

export interface GraphAnalysisInput {
  projectRoot: string;
  config: ArchctlConfig;
}

export interface GraphAnalysisResult {
  graph: ProjectGraph;
  stats: {
    fileCount: number;
    edgeCount: number;
    languageCounts: Record<string, number>;
    layerCounts: Record<string, number>;
  };
  files: string[];
  excludeInfo: {
    gitignoreCount: number;
    configCount: number;
  };
}

export interface GraphReport {
  project: string;
  generatedAt: string;
  summary: {
    totalFiles: number;
    totalDependencies: number;
    averageDependenciesPerFile: string;
    languages: Record<string, number>;
    layers: Record<string, number>;
  };
  topDependencies: Array<{ file: string; layer: string; dependencies: number }>;
  topDependents: Array<{ file: string; layer: string; dependents: number }>;
  layerInteractions: Record<string, Record<string, number>>;
  graph: ProjectGraph;
}

/**
 * Get all excludes (from .gitignore and config)
 */
export function getProjectExcludes(
  projectRoot: string,
  config: ArchctlConfig
): {
  allExcludes: string[];
  gitignoreCount: number;
  configCount: number;
} {
  // Parse .gitignore
  const gitignoreExcludes = parseGitignore(projectRoot);

  // Filter config excludes to only include directories that exist
  const configExcludes = (config.exclude || []).filter((dir) => {
    const dirPath = path.join(projectRoot, dir);
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  });

  const allExcludes = mergeExcludes(gitignoreExcludes, configExcludes);

  return {
    allExcludes,
    gitignoreCount: gitignoreExcludes.length,
    configCount: configExcludes.length,
  };
}

/**
 * Scan project files with exclusions
 */
export function scanProjectFiles(
  projectRoot: string,
  excludes: string[],
  extensions: string[] = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.java']
): string[] {
  const files: string[] = [];

  function walkDir(dir: string, depth = 0) {
    // Skip deep nesting
    if (depth > 10) return;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Check if directory should be excluded
          if (excludes.includes(entry.name)) {
            continue;
          }
          walkDir(fullPath, depth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            const relativePath = path.relative(projectRoot, fullPath).replace(/\\/g, '/');
            files.push(relativePath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  walkDir(projectRoot);
  return files;
}

/**
 * Analyze project dependencies and generate graph
 */
export async function analyzeProjectGraph(input: GraphAnalysisInput): Promise<GraphAnalysisResult> {
  const { projectRoot, config } = input;

  // Get excludes
  const { allExcludes, gitignoreCount, configCount } = getProjectExcludes(projectRoot, config);

  // Scan files
  const files = scanProjectFiles(projectRoot, allExcludes);

  // Build graph
  const graph = await buildProjectGraph({
    projectRoot,
    files,
    config,
  });

  const stats = getGraphStats(graph);

  return {
    graph,
    stats,
    files,
    excludeInfo: {
      gitignoreCount,
      configCount,
    },
  };
}

/**
 * Generate analysis report from graph
 */
export function generateGraphReport(
  graph: ProjectGraph,
  stats: {
    fileCount: number;
    edgeCount: number;
    languageCounts: Record<string, number>;
    layerCounts: Record<string, number>;
  },
  projectName: string
): GraphReport {
  // Calculate additional metrics
  const fileDeps = new Map<string, number>();
  const fileDepents = new Map<string, number>();

  graph.edges.forEach((edge) => {
    fileDeps.set(edge.from, (fileDeps.get(edge.from) || 0) + 1);
    fileDepents.set(edge.to, (fileDepents.get(edge.to) || 0) + 1);
  });

  // Find top files by dependencies
  const topDependencies = Array.from(fileDeps.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([file, count]) => ({
      file,
      layer: graph.files[file]?.layer || 'unmapped',
      dependencies: count,
    }));

  // Find top files by dependents (most imported)
  const topDependents = Array.from(fileDepents.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([file, count]) => ({
      file,
      layer: graph.files[file]?.layer || 'unmapped',
      dependents: count,
    }));

  // Layer interaction matrix
  const layerInteractions: Record<string, Record<string, number>> = {};
  graph.edges.forEach((edge) => {
    const fromLayer = graph.files[edge.from]?.layer || 'unmapped';
    const toLayer = graph.files[edge.to]?.layer || 'unmapped';

    if (!layerInteractions[fromLayer]) {
      layerInteractions[fromLayer] = {};
    }
    layerInteractions[fromLayer][toLayer] = (layerInteractions[fromLayer][toLayer] || 0) + 1;
  });

  return {
    project: projectName,
    generatedAt: new Date().toISOString(),
    summary: {
      totalFiles: stats.fileCount,
      totalDependencies: stats.edgeCount,
      averageDependenciesPerFile: (stats.edgeCount / stats.fileCount).toFixed(2),
      languages: stats.languageCounts,
      layers: stats.layerCounts,
    },
    topDependencies,
    topDependents,
    layerInteractions,
    graph: {
      files: graph.files,
      edges: graph.edges,
    },
  };
}

/**
 * Save graph report to file
 */
export function saveGraphReport(report: GraphReport, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
}
