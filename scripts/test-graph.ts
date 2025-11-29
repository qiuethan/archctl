/**
 * Quick test script to try out the dependency graph builder
 * Run with: npx tsx scripts/test-graph.ts
 */

import * as path from 'path';
import * as fs from 'fs';
import { buildProjectGraph, getGraphStats } from '../src/infrastructure/graph/graphBuilder';
import type { ArchctlConfig } from '../src/types/config';

async function main() {
  // Use the archctl project itself as a test
  const projectRoot = process.cwd();
  
  // Get all TypeScript files in src/
  const srcDir = path.join(projectRoot, 'src');
  const files: string[] = [];
  
  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
        const relativePath = path.relative(projectRoot, fullPath).replace(/\\/g, '/');
        files.push(relativePath);
      }
    }
  }
  
  walkDir(srcDir);
  
  console.log(`Found ${files.length} source files\n`);
  
  // Create a simple config
  const config: ArchctlConfig = {
    name: 'archctl',
    layers: [
      { name: 'commands', description: 'CLI commands' },
      { name: 'services', description: 'Application services' },
      { name: 'infrastructure', description: 'Infrastructure layer' },
      { name: 'utils', description: 'Utilities' },
    ],
    layerMappings: [
      { layer: 'commands', include: ['src/commands/**'] },
      { layer: 'services', include: ['src/services/**'] },
      { layer: 'infrastructure', include: ['src/infrastructure/**'] },
      { layer: 'utils', include: ['src/utils/**'] },
    ],
    rules: [],
  };
  
  console.log('Building dependency graph...\n');
  const graph = await buildProjectGraph({
    projectRoot,
    files,
    config,
  });
  
  // Print statistics
  const stats = getGraphStats(graph);
  console.log('=== Graph Statistics ===');
  console.log(`Files: ${stats.fileCount}`);
  console.log(`Dependencies: ${stats.edgeCount}`);
  console.log('\nLanguages:');
  Object.entries(stats.languageCounts).forEach(([lang, count]) => {
    console.log(`  ${lang}: ${count}`);
  });
  console.log('\nLayers:');
  Object.entries(stats.layerCounts).forEach(([layer, count]) => {
    console.log(`  ${layer}: ${count}`);
  });
  
  // Show some example dependencies
  console.log('\n=== Sample Dependencies ===');
  const sampleEdges = graph.edges.slice(0, 10);
  sampleEdges.forEach(edge => {
    console.log(`${edge.from} → ${edge.to} (${edge.kind}, confidence: ${edge.confidence})`);
  });
  
  // Find files with most dependencies
  console.log('\n=== Files with Most Dependencies ===');
  const fileDeps = new Map<string, number>();
  graph.edges.forEach(edge => {
    fileDeps.set(edge.from, (fileDeps.get(edge.from) || 0) + 1);
  });
  
  const topFiles = Array.from(fileDeps.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  topFiles.forEach(([file, count]) => {
    const node = graph.files[file];
    console.log(`  ${file} (${node.layer || 'unmapped'}): ${count} dependencies`);
  });
}

main().catch(console.error);
