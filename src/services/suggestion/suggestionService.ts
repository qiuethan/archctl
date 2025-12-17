import type { ArchctlConfig } from '../../types/config';
import type { SuggestionResult } from '../../types/suggestion';
import { HeuristicStrategy } from '../../infrastructure/suggestion/heuristicStrategy';
import { buildProjectGraph } from '../../infrastructure/graph/graphBuilder';
import { scanProjectFiles, getProjectExcludes } from '../graphService';

export class SuggestionService {
  private strategy: HeuristicStrategy;

  constructor(strategy?: HeuristicStrategy) {
    this.strategy = strategy || new HeuristicStrategy();
  }

  /**
   * Analyze the project and generate architectural suggestions
   */
  public async suggest(projectRoot: string, config: ArchctlConfig): Promise<SuggestionResult> {
    // 1. Build the graph (reuse existing logic from graphService)
    // We need a robust graph, so we scan files similarly to 'analyzeProjectGraph'

    const { allExcludes } = getProjectExcludes(projectRoot, config);
    const files = scanProjectFiles(projectRoot, allExcludes);

    // Build graph without caching to ensure fresh analysis for suggestion
    const graph = await buildProjectGraph({
      projectRoot,
      files,
      config,
      useCache: false, // Always fresh for discovery
    });

    // 2. Run Heuristics
    return this.strategy.analyze(graph, projectRoot);
  }
}

// Singleton export
export const suggestionService = new SuggestionService();
