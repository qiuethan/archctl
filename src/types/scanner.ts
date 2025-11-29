import type { ProjectFileNode, DependencyEdge } from './graph';

/**
 * Information about a file to be scanned
 */
export interface FileInfo {
  /** Project-relative path with forward slashes */
  path: string;
  
  /** Programming language identifier */
  language?: string;
  
  /** File contents as UTF-8 string */
  contents: string;
}

/**
 * Result of scanning a file for dependencies
 */
export interface ScanResult {
  /** Additional or updated file nodes (usually none or one) */
  nodes?: ProjectFileNode[];
  
  /** Discovered dependency edges */
  edges?: DependencyEdge[];
}

/**
 * Scanner interface for language-specific dependency detection
 */
export interface ProjectScanner {
  /** Unique identifier for this scanner */
  id: string;
  
  /**
   * Check if this scanner supports the given file
   */
  supports(file: FileInfo): boolean;
  
  /**
   * Scan a file and extract dependencies
   */
  scan(
    file: FileInfo,
    context: { projectRoot: string }
  ): Promise<ScanResult>;
}
