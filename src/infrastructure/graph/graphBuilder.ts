import * as path from 'path';
import * as fs from 'fs';
import type { ArchctlConfig } from '../../types/config';
import type { ProjectGraph, ProjectFileNode, DependencyEdge } from '../../types/graph';
import type { ProjectScanner, FileInfo, ScanResult } from '../../types/scanner';
import { inferLanguageFromPath } from '../../utils/language';
import { resolveLayerForFile } from '../../utils/layers';
import { toForwardSlashes } from '../../utils/path';
import { loadTsConfig } from '../../utils/tsconfig';
import { CacheService } from '../cache/cacheService';

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

  /** Whether to use persistent caching (default: true) */
  useCache?: boolean;
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
  const { projectRoot, files, config, useCache = true } = options;

  // Load tsconfig (if any)
  const tsConfig = loadTsConfig(projectRoot);

  // Initialize cache
  const cache = new CacheService(projectRoot);

  // Compute context hash (config + tsconfig)
  const contextHash = CacheService.computeHash(
    JSON.stringify({
      layers: config.layers,
      mappings: config.layerMappings,
      capabilities: config.capabilities,
      tsPaths: tsConfig?.paths,
      tsBaseUrl: tsConfig?.baseUrl,
    })
  );

  if (!useCache) {
    cache.clear();
  }

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
      const fileHash = CacheService.computeHash(contents, contextHash);

      // Check cache
      if (useCache) {
        const cachedResult = cache.get(normalizedPath, fileHash);
        if (cachedResult) {
          // Merge cached result into graph
          if (cachedResult.nodes) {
            for (const node of cachedResult.nodes) {
              graph.files[node.id] = node;
            }
          }
          if (cachedResult.edges) {
            graph.edges.push(...cachedResult.edges);
          }
          continue; // Skip processing
        }
      }

      // --- Start Processing (Cache Miss) ---

      // Infer language
      const language = inferLanguageFromPath(normalizedPath);

      // Resolve layer
      const layer = resolveLayerForFile(normalizedPath, config.layers, config.layerMappings || []);

      // Create base file node
      let currentNode: ProjectFileNode = {
        id: normalizedPath,
        path: normalizedPath,
        language,
      };

      // Add layer if resolved
      if (layer) {
        currentNode.layer = layer;
      }

      // Accumulate edges from all scanners
      const fileEdges: DependencyEdge[] = [];

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
            tsBaseUrl?: string;
            tsPaths?: Record<string, string[]>;
          } = {
            projectRoot,
          };
          if (tsConfig?.baseUrl) {
            scanContext.tsBaseUrl = tsConfig.baseUrl;
          }
          if (tsConfig?.paths) {
            scanContext.tsPaths = tsConfig.paths;
          }
          if (config.capabilities) {
            scanContext.capabilityPatterns = config.capabilities;
          }
          const result = await scanner.scan(fileInfo, scanContext);

          // Collect edges
          if (result.edges) {
            fileEdges.push(...result.edges);
          }

          // Merge nodes (updates to currentNode)
          if (result.nodes) {
            for (const resultNode of result.nodes) {
              if (resultNode.id === normalizedPath) {
                currentNode = { ...currentNode, ...resultNode };
              }
            }
          }
        } catch (error) {
          console.warn(`Scanner ${scanner.id} failed for ${normalizedPath}:`, error);
        }
      }

      // Add to graph
      graph.files[normalizedPath] = currentNode;
      graph.edges.push(...fileEdges);

      // Save to cache
      if (useCache) {
        const resultToCache: ScanResult = {
          nodes: [currentNode],
          edges: fileEdges,
        };
        cache.set(normalizedPath, fileHash, resultToCache);
      }
    } catch (error) {
      console.warn(`Failed to process file ${relPath}:`, error);
    }
  }

  // Persist cache to disk
  if (useCache) {
    cache.save();
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
