import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { buildProjectGraph, getGraphStats } from '../../../src/infrastructure/graph/graphBuilder';
import type { ArchctlConfig } from '../../../src/types/config';

describe('buildProjectGraph', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = path.join(process.cwd(), '.test-graph-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should build graph for TypeScript files', async () => {
    // Create test files
    const file1 = path.join(tempDir, 'file1.ts');
    const file2 = path.join(tempDir, 'file2.ts');

    fs.writeFileSync(file1, `import { foo } from './file2';\nexport const bar = 1;`);
    fs.writeFileSync(file2, `export const foo = 2;`);

    const config: ArchctlConfig = {
      name: 'test',
      layers: [],
      layerMappings: [],
      rules: [],
    };

    const graph = await buildProjectGraph({
      projectRoot: tempDir,
      files: ['file1.ts', 'file2.ts'],
      config,
    });

    expect(Object.keys(graph.files)).toHaveLength(2);
    expect(graph.files['file1.ts']).toBeDefined();
    expect(graph.files['file1.ts'].language).toBe('typescript');
    expect(graph.files['file2.ts']).toBeDefined();
    
    // Should have one edge from file1 to file2
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].from).toBe('file1.ts');
    expect(graph.edges[0].to).toBe('file2.ts');
    expect(graph.edges[0].kind).toBe('import');
  });

  it('should resolve layers for files', async () => {
    // Create test files
    const domainFile = path.join(tempDir, 'domain', 'user.ts');
    fs.mkdirSync(path.dirname(domainFile), { recursive: true });
    fs.writeFileSync(domainFile, `export class User {}`);

    const config: ArchctlConfig = {
      name: 'test',
      layers: [
        { name: 'domain', description: 'Domain layer' },
      ],
      layerMappings: [
        { layer: 'domain', include: ['domain/**'] },
      ],
      rules: [],
    };

    const graph = await buildProjectGraph({
      projectRoot: tempDir,
      files: ['domain/user.ts'],
      config,
    });

    expect(graph.files['domain/user.ts'].layer).toBe('domain');
  });

  it('should handle Python files', async () => {
    const file1 = path.join(tempDir, 'main.py');
    const file2 = path.join(tempDir, 'utils.py');

    fs.writeFileSync(file1, `import utils\nfrom utils import helper`);
    fs.writeFileSync(file2, `def helper():\n    pass`);

    const config: ArchctlConfig = {
      name: 'test',
      layers: [],
      layerMappings: [],
      rules: [],
    };

    const graph = await buildProjectGraph({
      projectRoot: tempDir,
      files: ['main.py', 'utils.py'],
      config,
    });

    expect(graph.files['main.py'].language).toBe('python');
    expect(graph.files['utils.py'].language).toBe('python');
    
    // Should detect import
    const edges = graph.edges.filter(e => e.from === 'main.py');
    expect(edges.length).toBeGreaterThan(0);
  });

  it('should handle Java files', async () => {
    const file1 = path.join(tempDir, 'src', 'main', 'java', 'com', 'example', 'Main.java');
    const file2 = path.join(tempDir, 'src', 'main', 'java', 'com', 'example', 'Utils.java');

    fs.mkdirSync(path.dirname(file1), { recursive: true });
    fs.writeFileSync(file1, `package com.example;\nimport com.example.Utils;\npublic class Main {}`);
    fs.writeFileSync(file2, `package com.example;\npublic class Utils {}`);

    const config: ArchctlConfig = {
      name: 'test',
      layers: [],
      layerMappings: [],
      rules: [],
    };

    const graph = await buildProjectGraph({
      projectRoot: tempDir,
      files: ['src/main/java/com/example/Main.java', 'src/main/java/com/example/Utils.java'],
      config,
    });

    expect(graph.files['src/main/java/com/example/Main.java'].language).toBe('java');
    expect(graph.files['src/main/java/com/example/Utils.java'].language).toBe('java');
  });

  it('should compute graph statistics', async () => {
    const tsFile = path.join(tempDir, 'file.ts');
    const pyFile = path.join(tempDir, 'file.py');

    fs.writeFileSync(tsFile, `export const x = 1;`);
    fs.writeFileSync(pyFile, `x = 1`);

    const config: ArchctlConfig = {
      name: 'test',
      layers: [
        { name: 'app', description: 'App layer' },
      ],
      layerMappings: [
        { layer: 'app', include: ['*.ts'] },
      ],
      rules: [],
    };

    const graph = await buildProjectGraph({
      projectRoot: tempDir,
      files: ['file.ts', 'file.py'],
      config,
    });

    const stats = getGraphStats(graph);
    expect(stats.fileCount).toBe(2);
    expect(stats.languageCounts.typescript).toBe(1);
    expect(stats.languageCounts.python).toBe(1);
    expect(stats.layerCounts.app).toBe(1);
    expect(stats.layerCounts.unmapped).toBe(1);
  });
});
