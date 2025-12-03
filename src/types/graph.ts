/**
 * Type definitions for project dependency graph
 */

import type { Capability } from './capabilities';

/**
 * Type of dependency relationship between files
 */
export type DependencyKind = 'import' | 'include' | 'other';

/**
 * A node in the project graph representing a source file
 */
export interface ProjectFileNode {
  /** Unique identifier (project-relative path with forward slashes) */
  id: string;

  /** Project-relative path (same as id for now) */
  path: string;

  /** Programming language of the file */
  language?: string;

  /** Architectural layer this file belongs to */
  layer?: string;

  /** External library imports (e.g., npm packages, pip modules) */
  imports?: string[];

  /** Detected capabilities (actions the code performs) */
  capabilities?: Capability[];
}

/**
 * An edge in the project graph representing a dependency
 */
export interface DependencyEdge {
  /** Source file id (project-relative path) */
  from: string;

  /** Target file id (project-relative path) */
  to: string;

  /** Type of dependency */
  kind: DependencyKind;

  /** Confidence level (0-1); static scanners should use 0.9-1 */
  confidence: number;

  /** Scanner that detected this dependency (e.g., "ts-js-import") */
  source: string;
}

/**
 * Complete project dependency graph
 */
export interface ProjectGraph {
  /** Map of file id to file node */
  files: Record<string, ProjectFileNode>;

  /** List of all dependency edges */
  edges: DependencyEdge[];
}
