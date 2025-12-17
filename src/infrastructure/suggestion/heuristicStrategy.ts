import type { ProjectGraph } from '../../types/graph';
import type {
  DirectorySuggestion,
  Evidence,
  LayerType,
  SuggestionResult,
} from '../../types/suggestion';
import * as path from 'path';

// Heuristic Rules Configuration

const SEMANTIC_PATTERNS: Record<LayerType, RegExp[]> = {
  domain: [
    /domain/,
    /core/,
    /model/,
    /entity/,
    /entities/,
    /value-object/,
    /business/,
    /dto/,
    /enums/,
    /interfaces/,
  ],
  application: [/app/, /application/, /use-case/, /service/, /handler/, /command/, /query/, /impl/],
  infrastructure: [
    /infra/,
    /infrastructure/,
    /data/,
    /repo/,
    /repository/,
    /db/,
    /database/,
    /external/,
    /adapter/,
    /client/,
    /config/,
    /dao/,
    /migrations/,
  ],
  presentation: [
    /present/,
    /presentation/,
    /ui/,
    /view/,
    /component/,
    /page/,
    /screen/,
    /controller/,
    /api/,
    /route/,
    /web/,
    /cli/,
    /serializers/,
    /urls/,
    /resources/,
  ],
  shared: [
    /common/,
    /shared/,
    /util/,
    /lib/,
    /helper/,
    /constant/,
    /type/,
    /interface/,
    /constants/,
    /exceptions/,
  ],
  unknown: [],
};

const DEPENDENCY_PATTERNS: Record<LayerType, string[]> = {
  domain: ['zod', 'uuid', 'decimal.js', 'javax.validation', 'pydantic', 'dataclasses'], // Domain should have few deps, mostly pure util
  application: ['inversify', 'tsyringe', 'org.springframework.stereotype.Service', 'celery'], // DI containers
  infrastructure: [
    'mongoose',
    'typeorm',
    'pg',
    'mysql',
    'redis',
    'aws-sdk',
    'axios',
    'node-fetch',
    'fs-extra',
    'jsonwebtoken',
    'bcrypt',
    'org.springframework.data',
    'javax.persistence',
    'sqlalchemy',
    'django.db',
    'pymongo',
    'boto3',
    'requests',
  ],
  presentation: [
    'react',
    'vue',
    'angular',
    'express',
    'koa',
    'fastify',
    'nestjs',
    'graphql',
    'apollo',
    'commander',
    'inquirer',
    'chalk',
    'org.springframework.web',
    'javax.servlet',
    'flask',
    'django.urls',
    'fastapi',
  ],
  shared: [
    'lodash',
    'ramda',
    'moment',
    'date-fns',
    'rxjs',
    'org.apache.commons',
    'com.google.common',
    'pandas',
    'numpy',
  ],
  unknown: [],
};

// Heuristic Thresholds
const THRESHOLDS = {
  INSTABILITY: {
    STABLE: 0.3,
    UNSTABLE: 0.7,
  },
  SCORES: {
    TOPOLOGY_HIGH: 0.6,
    TOPOLOGY_LOW: 0.4,
    SEMANTICS: 0.8,
    DEPENDENCIES: 0.7,
  },
  CONFIDENCE: {
    MAX: 0.99,
    BOOST: 0.1,
  },
};

/**
 * Aggregated statistics for a directory
 */
interface DirectoryStats {
  path: string;
  files: string[];
  internalDependencies: Set<string>; // Deps within the same directory
  outgoingDependencies: Set<string>; // Deps to other directories
  incomingDependencies: Set<string>; // Deps from other directories
  externalImports: Set<string>; // Imports from node_modules
}

export class HeuristicStrategy {
  public analyze(graph: ProjectGraph, _projectRoot: string): SuggestionResult {
    const dirStats = this.aggregateDirectoryStats(graph);
    const suggestions: DirectorySuggestion[] = [];

    for (const stats of dirStats.values()) {
      // We generally care about top-level directories or significant subdirectories
      // For now, let's analyze all directories that have files
      if (stats.files.length === 0) continue;

      const evidence: Evidence[] = [];

      // 1. Topology Analysis (Instability)
      const fanOut = stats.outgoingDependencies.size;
      const fanIn = stats.incomingDependencies.size;
      const totalConnections = fanIn + fanOut;

      let instability = 0;
      if (totalConnections > 0) {
        instability = fanOut / totalConnections;
      }

      // Stable (I -> 0): Low outgoing, High incoming -> Likely Core/Domain/Shared
      // Unstable (I -> 1): High outgoing, Low incoming -> Likely Presentation/Infrastructure

      if (instability < THRESHOLDS.INSTABILITY.STABLE && fanIn > 0) {
        evidence.push({
          type: 'topology',
          score: THRESHOLDS.SCORES.TOPOLOGY_HIGH,
          reason: `Stable component (Instability: ${instability.toFixed(2)}). High reuse.`,
        });
      } else if (instability > THRESHOLDS.INSTABILITY.UNSTABLE) {
        evidence.push({
          type: 'topology',
          score: THRESHOLDS.SCORES.TOPOLOGY_HIGH,
          reason: `Unstable component (Instability: ${instability.toFixed(2)}). Depends on many others.`,
        });
      }

      // 2. Semantic Analysis (Directory Names)
      const dirName = path.basename(stats.path);
      for (const [layer, patterns] of Object.entries(SEMANTIC_PATTERNS)) {
        if (patterns.some((p) => p.test(dirName))) {
          const semEvidence: Evidence = {
            type: 'semantics',
            score: THRESHOLDS.SCORES.SEMANTICS, // Names are strong indicators
            reason: `Directory name matches pattern for ${layer}`,
          };
          evidence.push(semEvidence);
          // Boost confidence if name matches
          this.addSuggestionVote(
            suggestions,
            stats.path,
            layer as LayerType,
            THRESHOLDS.SCORES.SEMANTICS,
            semEvidence
          );
        }
      }

      // 3. Dependency Analysis (External Imports)
      const externalImports = Array.from(stats.externalImports);
      for (const [layer, packages] of Object.entries(DEPENDENCY_PATTERNS)) {
        const matches = externalImports.filter((imp) =>
          packages.some((pkg) => imp.startsWith(pkg))
        );
        if (matches.length > 0) {
          const depEvidence: Evidence = {
            type: 'dependencies',
            score: THRESHOLDS.SCORES.DEPENDENCIES,
            reason: `Imports typical ${layer} libraries: ${matches.slice(0, 3).join(', ')}`,
          };
          evidence.push(depEvidence);
          this.addSuggestionVote(
            suggestions,
            stats.path,
            layer as LayerType,
            THRESHOLDS.SCORES.DEPENDENCIES,
            depEvidence
          );
        }
      }

      // 4. Synthesize Topology with others
      // If we have no semantic/dep votes, try to guess based on topology alone?
      // Usually risky. But:
      // - No deps + high fan-in -> Shared/Domain
      // - High deps (system) -> Infrastructure

      if (externalImports.length === 0 && fanIn > 0 && instability < 0.1) {
        // Pure code, used by many
        this.addSuggestionVote(suggestions, stats.path, 'domain', THRESHOLDS.SCORES.TOPOLOGY_LOW, {
          type: 'topology',
          score: THRESHOLDS.SCORES.TOPOLOGY_LOW,
          reason: 'Zero external dependencies and highly stable',
        });
      }

      // Finalize the primary suggestion for this directory
      // (The helper addSuggestionVote handles list management, but we need to pick the winner)
    }

    return {
      suggestions: this.resolveBestSuggestions(suggestions),
      proposedConfig: {}, // We'll construct this in the service or presenter
    };
  }

  private aggregateDirectoryStats(graph: ProjectGraph): Map<string, DirectoryStats> {
    const stats = new Map<string, DirectoryStats>();

    // Helper to get/init stats
    const getStats = (dir: string) => {
      if (!stats.has(dir)) {
        stats.set(dir, {
          path: dir,
          files: [],
          internalDependencies: new Set(),
          outgoingDependencies: new Set(),
          incomingDependencies: new Set(),
          externalImports: new Set(),
        });
      }
      return stats.get(dir)!;
    };

    // 1. Map files to directories
    for (const fileNode of Object.values(graph.files)) {
      const dir = path.dirname(fileNode.id);
      // We prefer top-level src dirs usually, but let's capture all dirs first
      // Actually, let's normalize to "first level under src" or root dirs
      // For now, let's use direct parent directory
      const entry = getStats(dir);
      entry.files.push(fileNode.id);

      if (fileNode.imports) {
        fileNode.imports.forEach((imp) => entry.externalImports.add(imp));
      }
    }

    // 2. Map edges to directory dependencies
    for (const edge of graph.edges) {
      const fromDir = path.dirname(edge.from);
      const toDir = path.dirname(edge.to);

      if (fromDir === toDir) {
        getStats(fromDir).internalDependencies.add(edge.to);
      } else {
        getStats(fromDir).outgoingDependencies.add(toDir);
        getStats(toDir).incomingDependencies.add(fromDir);
      }
    }

    return stats;
  }

  private addSuggestionVote(
    list: DirectorySuggestion[],
    dirPath: string,
    layer: LayerType,
    confidence: number,
    evidence: Evidence
  ) {
    const existing = list.find((s) => s.path === dirPath && s.suggestedLayer === layer);
    if (!existing) {
      // Check if we have a suggestion for this dir but different layer
      // If so, we treat them as separate competing suggestions for now
      // But typically we want one object per directory with a "winner"
      // Let's simplified: We push everything and resolve later
      list.push({
        path: dirPath,
        suggestedLayer: layer,
        confidence,
        evidence: [evidence],
        stats: { files: 0, incomingEdges: 0, outgoingEdges: 0, instability: 0 }, // Fill real stats if needed
      });
    } else {
      // Accumulate confidence (simple sum or probabilistic or max?)
      // Let's use max for now + small boost
      existing.confidence = Math.min(
        THRESHOLDS.CONFIDENCE.MAX,
        Math.max(existing.confidence, confidence) + THRESHOLDS.CONFIDENCE.BOOST
      );
      existing.evidence.push(evidence);
    }
  }

  private resolveBestSuggestions(rawSuggestions: DirectorySuggestion[]): DirectorySuggestion[] {
    // Group by directory
    const byDir = new Map<string, DirectorySuggestion[]>();
    for (const s of rawSuggestions) {
      if (!byDir.has(s.path)) byDir.set(s.path, []);
      byDir.get(s.path)!.push(s);
    }

    const resolved: DirectorySuggestion[] = [];
    for (const [_dir, suggestions] of byDir.entries()) {
      if (suggestions.length === 0) continue;
      // Sort by confidence
      suggestions.sort((a, b) => b.confidence - a.confidence);
      // Pick top
      const top = suggestions[0];
      if (top) {
        resolved.push(top);
      }
    }

    // Sort by path
    return resolved.sort((a, b) => a.path.localeCompare(b.path));
  }
}
