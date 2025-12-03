import * as path from 'path';
import * as fs from 'fs';
import type { ArchctlConfig } from '../../types/config';
import type { ProjectGraph, ProjectFileNode, DependencyEdge } from '../../types/graph';
import type { ProjectScanner, FileInfo } from '../../types/scanner';
import { inferLanguageFromPath } from '../../utils/language';
import { resolveLayerForFile } from '../../utils/layers';
import { toForwardSlashes } from '../../utils/path';

// Import scanners
import { tsJsScanner } from '../scanners/tsJsScanner';
import { pythonScanner } from '../scanners/pythonScanner';
import { javaScanner } from '../scanners/javaScanner';

/**
 * Available scanners for dependency detection
 */
const SCANNERS: ProjectScanner[] = [tsJsScanner, pythonScanner, javaScanner];

/**
 * Options for building a project dependency graph
 */
export interface BuildGraphOptions {
  /** Absolute path to project root */
  projectRoot: string;

  /** Project-relative paths to source files */
  files: string[];

  /** Project configuration */
  config: ArchctlConfig;
}

/**
 * Build a complete project dependency graph
 *
 * This function:
 * 1. Creates file nodes for all source files
 * 2. Resolves the language and layer for each file
 * 3. Runs language-specific scanners to detect dependencies
 * 4. Returns a complete graph with nodes and edges
 *
 * @param options - Build options
 * @returns Complete project dependency graph
 */
export async function buildProjectGraph(options: BuildGraphOptions): Promise<ProjectGraph> {
  const { projectRoot, files, config } = options;

  // Initialize empty graph
  const graph: ProjectGraph = {
    files: {},
    edges: [],
  };

  // Process each file
  for (const relPath of files) {
    try {
      // Normalize path to forward slashes (but keep it relative)
      const normalizedPath = toForwardSlashes(relPath);

      // Build absolute path - ensure relPath is not already absolute
      const absPath = path.isAbsolute(relPath) ? relPath : path.join(projectRoot, relPath);
      if (!fs.existsSync(absPath)) {
        console.warn(`File not found: ${absPath}`);
        continue;
      }

      const contents = fs.readFileSync(absPath, 'utf-8');

      // Infer language
      const language = inferLanguageFromPath(normalizedPath);

      // Resolve layer
      const layer = resolveLayerForFile(normalizedPath, config.layers, config.layerMappings || []);

      // Create file node
      const node: ProjectFileNode = {
        id: normalizedPath,
        path: normalizedPath,
        language,
      };

      // Add layer if resolved
      if (layer) {
        node.layer = layer;
      }

      // Add node to graph
      graph.files[normalizedPath] = node;

      // Create FileInfo for scanners
      const fileInfo: FileInfo = {
        path: normalizedPath,
        language,
        contents,
      };

      // Run applicable scanners
      for (const scanner of SCANNERS) {
        if (!scanner.supports(fileInfo)) {
          continue;
        }

        try {
          const scanContext: {
            projectRoot: string;
            capabilityPatterns?: import('../../types/capabilities').CapabilityPattern[];
          } = {
            projectRoot,
          };
          if (config.capabilities) {
            scanContext.capabilityPatterns = config.capabilities;
          }
          const result = await scanner.scan(fileInfo, scanContext);

          // Add edges from scan result
          if (result.edges) {
            graph.edges.push(...result.edges);
          }

          // Merge nodes from scan result (if any)
          if (result.nodes) {
            for (const resultNode of result.nodes) {
              // Merge with existing node or add new one
              const existing = graph.files[resultNode.id];
              if (existing) {
                // Update existing node with new information
                graph.files[resultNode.id] = {
                  ...existing,
                  ...resultNode,
                };
              } else {
                graph.files[resultNode.id] = resultNode;
              }
            }
          }
        } catch (error) {
          console.warn(`Scanner ${scanner.id} failed for ${normalizedPath}:`, error);
        }
      }
    } catch (error) {
      console.warn(`Failed to process file ${relPath}:`, error);
    }
  }

  return graph;
}

/**
 * Get statistics about the project graph
 */
export function getGraphStats(graph: ProjectGraph): {
  fileCount: number;
  edgeCount: number;
  languageCounts: Record<string, number>;
  layerCounts: Record<string, number>;
} {
  const languageCounts: Record<string, number> = {};
  const layerCounts: Record<string, number> = {};

  for (const node of Object.values(graph.files)) {
    // Count by language
    const lang = node.language || 'unknown';
    languageCounts[lang] = (languageCounts[lang] || 0) + 1;

    // Count by layer
    const layer = node.layer || 'unmapped';
    layerCounts[layer] = (layerCounts[layer] || 0) + 1;
  }

  return {
    fileCount: Object.keys(graph.files).length,
    edgeCount: graph.edges.length,
    languageCounts,
    layerCounts,
  };
}

/**
 * Get all dependencies of a file (outgoing edges)
 */
export function getFileDependencies(graph: ProjectGraph, filePath: string): DependencyEdge[] {
  return graph.edges.filter((edge) => edge.from === filePath);
}

/**
 * Get all dependents of a file (incoming edges)
 */
export function getFileDependents(graph: ProjectGraph, filePath: string): DependencyEdge[] {
  return graph.edges.filter((edge) => edge.to === filePath);
}

/**
 * Check if there's a dependency path from one file to another
 */
export function hasDependencyPath(
  graph: ProjectGraph,
  from: string,
  to: string,
  visited: Set<string> = new Set()
): boolean {
  if (from === to) {
    return true;
  }

  if (visited.has(from)) {
    return false; // Avoid infinite loops
  }

  visited.add(from);

  const dependencies = getFileDependencies(graph, from);
  for (const dep of dependencies) {
    if (hasDependencyPath(graph, dep.to, to, visited)) {
      return true;
    }
  }

  return false;
}
