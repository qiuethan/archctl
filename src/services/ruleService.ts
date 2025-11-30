import type { RuleConfig } from '../types/config';
import type { RuleContext, RuleViolation, FileInfo, BaseRule } from '../types/rules';
import { ForbiddenLayerImportRule } from '../infrastructure/rules/ForbiddenLayerImportRule';
import { AllowedLayerImportRule } from '../infrastructure/rules/AllowedLayerImportRule';
import { FilePatternLayerRule } from '../infrastructure/rules/FilePatternLayerRule';
import { MaxDependenciesRule } from '../infrastructure/rules/MaxDependenciesRule';
import { CyclicDependencyRule } from '../infrastructure/rules/CyclicDependencyRule';

/**
 * Factory function to create rule instances from configuration
 * Uses the discriminated union 'kind' field to instantiate the correct class
 */
export function createRulesFromConfig(configs: RuleConfig[]): BaseRule[] {
  const rules: BaseRule[] = [];

  for (const config of configs) {
    let rule: BaseRule;

    switch (config.kind) {
      case 'forbidden-layer-import':
        rule = new ForbiddenLayerImportRule(
          config.id,
          config.title,
          config.description,
          {
            fromLayer: config.fromLayer,
            toLayer: config.toLayer,
          }
        );
        break;

      case 'allowed-layer-import':
        rule = new AllowedLayerImportRule(
          config.id,
          config.title,
          config.description,
          {
            fromLayer: config.fromLayer,
            allowedLayers: config.allowedLayers,
          }
        );
        break;

      case 'file-pattern-layer':
        rule = new FilePatternLayerRule(
          config.id,
          config.title,
          config.description,
          {
            pattern: config.pattern,
            requiredLayer: config.requiredLayer,
          }
        );
        break;

      case 'max-dependencies':
        rule = new MaxDependenciesRule(
          config.id,
          config.title,
          config.description,
          {
            maxDependencies: config.maxDependencies,
            layer: config.layer,
          }
        );
        break;

      case 'cyclic-dependency':
        rule = new CyclicDependencyRule(
          config.id,
          config.title,
          config.description,
          {}
        );
        break;

      case 'natural-language':
        // TODO: Implement NaturalLanguageRule when AI integration is ready
        console.warn(`Natural language rule "${config.id}" not yet implemented`);
        continue;

      default:
        // TypeScript exhaustiveness check
        const _exhaustive: never = config;
        throw new Error(`Unknown rule kind: ${(_exhaustive as RuleConfig).kind}`);
    }

    rules.push(rule);
  }

  return rules;
}

/**
 * Build a rule context from graph analysis results
 */
export function buildRuleContext(graphAnalysis: any, config: any, projectRoot: string): RuleContext {
  const files = new Map<string, FileInfo>();

  // Build file info map from graph
  for (const [filePath, fileData] of Object.entries(graphAnalysis.graph.files)) {
    const data = fileData as any;
    
    // Count dependencies for this file
    const dependencyCount = graphAnalysis.graph.edges.filter(
      (edge: any) => edge.from === filePath
    ).length;

    files.set(filePath, {
      path: filePath,
      layer: data.layer || null,
      language: data.language || 'unknown',
      imports: data.imports || [],
      dependencyCount,
    });
  }

  return {
    files,
    dependencies: graphAnalysis.graph.edges,
    layers: config.layers || [],
    layerMappings: config.layerMappings || [],
    projectRoot,
  };
}

/**
 * Check all rules against the provided context
 */
export function checkRules(rules: BaseRule[], context: RuleContext): RuleViolation[] {
  const allViolations: RuleViolation[] = [];

  for (const rule of rules) {
    try {
      const violations = rule.check(context);
      allViolations.push(...violations);
    } catch (error) {
      console.error(`Error checking rule ${rule.id}:`, error);
      // Continue checking other rules
    }
  }

  return allViolations;
}

/**
 * Group violations by severity
 */
export function groupViolationsBySeverity(violations: RuleViolation[]): {
  errors: RuleViolation[];
  warnings: RuleViolation[];
  info: RuleViolation[];
} {
  return {
    errors: violations.filter(v => v.severity === 'error'),
    warnings: violations.filter(v => v.severity === 'warning'),
    info: violations.filter(v => v.severity === 'info'),
  };
}

/**
 * Group violations by file
 */
export function groupViolationsByFile(violations: RuleViolation[]): Map<string, RuleViolation[]> {
  const grouped = new Map<string, RuleViolation[]>();

  for (const violation of violations) {
    const existing = grouped.get(violation.file) || [];
    existing.push(violation);
    grouped.set(violation.file, existing);
  }

  return grouped;
}

/**
 * Get a summary of violations
 */
export function getViolationSummary(violations: RuleViolation[]): {
  total: number;
  errors: number;
  warnings: number;
  info: number;
  filesAffected: number;
} {
  const grouped = groupViolationsBySeverity(violations);
  const fileSet = new Set(violations.map(v => v.file));

  return {
    total: violations.length,
    errors: grouped.errors.length,
    warnings: grouped.warnings.length,
    info: grouped.info.length,
    filesAffected: fileSet.size,
  };
}
