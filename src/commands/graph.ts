import * as path from 'path';
import * as fs from 'fs';
import type { ParsedArgs } from '../types';
import { findConfigFile, loadConfig } from '../infrastructure/config/configService';
import { buildProjectGraph, getGraphStats, getFileDependencies, getFileDependents } from '../infrastructure/graph/graphBuilder';
import { messages } from '../messages';
import { parseGitignore, mergeExcludes } from '../utils/gitignore';

/**
 * Temporary graph command - analyze project dependencies
 * Generates a graph analysis file in .archctl/
 */
export async function cmdGraph(args: ParsedArgs): Promise<void> {
  const configPath = findConfigFile();

  if (!configPath) {
    console.error(messages.common.noConfigFound);
    process.exit(1);
  }

  const config = loadConfig(configPath);
  const projectRoot = path.dirname(path.dirname(configPath)); // Go up from .archctl/archctl.config.json

  console.log('🔍 Scanning project files...');

  // Parse .gitignore and merge with config excludes
  const gitignoreExcludes = parseGitignore(projectRoot);
  
  // Filter config excludes to only include directories that exist
  const configExcludes = (config.exclude || []).filter(dir => {
    const dirPath = path.join(projectRoot, dir);
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  });
  
  const allExcludes = mergeExcludes(gitignoreExcludes, configExcludes);
  
  if (gitignoreExcludes.length > 0) {
    console.log(`📝 Found ${gitignoreExcludes.length} excludes from .gitignore`);
  }
  if (configExcludes.length > 0) {
    console.log(`⚙️  Found ${configExcludes.length} excludes from config`);
  }

  // Get all source files in the project
  const files: string[] = [];
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.java'];

  function walkDir(dir: string, depth = 0) {
    // Skip deep nesting and common ignore directories
    if (depth > 10) return;
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Check if directory should be excluded (from .gitignore + config)
          if (allExcludes.includes(entry.name)) {
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
  console.log(`📁 Found ${files.length} source files`);

  console.log('🔨 Building dependency graph...');
  const graph = await buildProjectGraph({
    projectRoot,
    files,
    config,
  });

  const stats = getGraphStats(graph);
  console.log(`✅ Analyzed ${stats.fileCount} files, found ${stats.edgeCount} dependencies`);

  // Generate analysis report
  const report = generateReport(graph, stats, config.name);

  // Write to .archctl/graph-analysis.json
  const archctlDir = path.dirname(configPath);
  const outputPath = path.join(archctlDir, 'graph-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`\n📊 Graph analysis saved to: ${outputPath}`);
  console.log('\nSummary:');
  console.log(`  Files analyzed: ${stats.fileCount}`);
  console.log(`  Dependencies: ${stats.edgeCount}`);
  console.log(`  Languages: ${Object.keys(stats.languageCounts).join(', ')}`);
  
  const layers = Object.keys(stats.layerCounts).filter(l => l !== 'unmapped');
  if (layers.length > 0) {
    console.log(`  Layers: ${layers.join(', ')}`);
  }
}

function generateReport(graph: any, stats: any, projectName: string) {
  // Calculate additional metrics
  const fileDeps = new Map<string, number>();
  const fileDepents = new Map<string, number>();
  
  graph.edges.forEach((edge: any) => {
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
  graph.edges.forEach((edge: any) => {
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
