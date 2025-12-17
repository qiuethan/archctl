import type { ArchctlConfig } from '../config';

/**
 * Type of layer suggestion based on heuristics
 */
export type LayerType =
  | 'domain'
  | 'application'
  | 'infrastructure'
  | 'presentation'
  | 'shared'
  | 'unknown';

/**
 * Evidence supporting a suggestion
 */
export interface Evidence {
  type: 'topology' | 'semantics' | 'dependencies';
  score: number; // 0 to 1
  reason: string;
}

/**
 * A suggestion for a directory's role
 */
export interface DirectorySuggestion {
  path: string; // Relative path to directory
  suggestedLayer: LayerType;
  confidence: number; // 0 to 1
  evidence: Evidence[];
  stats: {
    files: number;
    incomingEdges: number;
    outgoingEdges: number;
    instability: number; // 0 (stable) to 1 (unstable)
  };
}

/**
 * Result of the suggestion analysis
 */
export interface SuggestionResult {
  suggestions: DirectorySuggestion[];
  proposedConfig: Partial<ArchctlConfig>;
}
