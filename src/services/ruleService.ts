import type { RuleConfig, ArchctlConfig } from '../types/config';
import type { RuleContext, RuleViolation, FileInfo, BaseRule } from '../types/rules';
import type { GraphReport } from './graphService';
import { ForbiddenLayerImportRule } from '../infrastructure/rules/ForbiddenLayerImportRule';
import { AllowedLayerImportRule } from '../infrastructure/rules/AllowedLayerImportRule';
import { FilePatternLayerRule } from '../infrastructure/rules/FilePatternLayerRule';
import { MaxDependenciesRule } from '../infrastructure/rules/MaxDependenciesRule';
import { CyclicDependencyRule } from '../infrastructure/rules/CyclicDependencyRule';
import { ExternalDependencyRule } from '../infrastructure/rules/ExternalDependencyRule';
import { AllowedCapabilityRule } from '../infrastructure/rules/AllowedCapabilityRule';
import { ForbiddenCapabilityRule } from '../infrastructure/rules/ForbiddenCapabilityRule';
import { ContextVisibilityRule } from '../infrastructure/rules/ContextVisibilityRule';

/**
 * Rule management operations
 */

export interface AddRuleInput {
  ruleConfig: RuleConfig;
}

/**
 * Add a rule to the configuration
 */
export function addRule(config: ArchctlConfig, input: AddRuleInput): RuleConfig {
  // Check if rule with same ID already exists
  if (config.rules.some((r) => r.id === input.ruleConfig.id)) {
    throw new Error(`Rule with ID "${input.ruleConfig.id}" already exists`);
  }

  // Add rule to config
  config.rules.push(input.ruleConfig);

  return input.ruleConfig;
}

/**
 * Remove a rule from the configuration
 */
export function removeRule(config: ArchctlConfig, ruleId: string): void {
  const index = config.rules.findIndex((r) => r.id === ruleId);

  if (index === -1) {
    throw new Error(`Rule with ID "${ruleId}" not found`);
  }

  config.rules.splice(index, 1);
}

/**
 * Get available rule kinds
 */
export function getAvailableRuleKinds(): Array<{
  value: string;
  name: string;
  description: string;
}> {
  return [
    {
      value: 'forbidden-layer-import',
      name: 'Forbidden Layer Import',
      description: 'Block imports from one layer to another',
    },
    {
      value: 'allowed-layer-import',
      name: 'Allowed Layer Import',
      description: 'Whitelist allowed layer imports',
    },
    {
      value: 'file-pattern-layer',
      name: 'File Pattern Layer',
      description: 'Enforce files matching pattern must be in specific layer',
    },
    {
      value: 'max-dependencies',
      name: 'Max Dependencies',
      description: 'Limit dependencies per file',
    },
    {
      value: 'cyclic-dependency',
      name: 'Cyclic Dependency',
      description: 'Detect circular dependencies',
    },
    {
      value: 'external-dependency',
      name: 'External Dependency',
      description: 'Enforce allowed external library imports',
    },
    {
      value: 'allowed-capability',
      name: 'Allowed Capability',
      description: 'Whitelist allowed capabilities (actions code can perform)',
    },
    {
      value: 'forbidden-capability',
      name: 'Forbidden Capability',
      description: 'Block specific capabilities (actions code can perform)',
    },
    {
      value: 'context-visibility',
      name: 'Context Visibility',
      description: 'Enforce vertical context boundaries and public APIs',
    },
  ];
}

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
        rule = new ForbiddenLayerImportRule(config.id, config.title, config.description, {
          fromLayer: config.fromLayer,
          toLayer: config.toLayer,
        });
        break;

      case 'allowed-layer-import':
        rule = new AllowedLayerImportRule(config.id, config.title, config.description, {
          fromLayer: config.fromLayer,
          allowedLayers: config.allowedLayers,
        });
        break;

      case 'file-pattern-layer':
        rule = new FilePatternLayerRule(config.id, config.title, config.description, {
          pattern: config.pattern,
          requiredLayer: config.requiredLayer,
        });
        break;

      case 'max-dependencies':
        rule = new MaxDependenciesRule(config.id, config.title, config.description, {
          maxDependencies: config.maxDependencies,
          layer: config.layer,
        });
        break;

      case 'cyclic-dependency':
        rule = new CyclicDependencyRule(config.id, config.title, config.description, {});
        break;

      case 'external-dependency':
        rule = new ExternalDependencyRule(config.id, config.title, config.description, {
          allowedPackages: config.allowedPackages,
          layer: config.layer,
        });
        break;

      case 'allowed-capability':
        rule = new AllowedCapabilityRule(config.id, config.title, config.description, {
          allowedCapabilities: config.allowedCapabilities,
          layer: config.layer,
        });
        break;

      case 'forbidden-capability':
        rule = new ForbiddenCapabilityRule(config.id, config.title, config.description, {
          forbiddenCapabilities: config.forbiddenCapabilities,
          layer: config.layer,
        });
        break;

      case 'context-visibility':
        rule = new ContextVisibilityRule(config.id, config.title, config.description, {
          contexts: config.contexts,
        });
        break;

      case 'natural-language':
        // TODO: Implement NaturalLanguageRule when AI integration is ready
        console.warn(`Natural language rule "${config.id}" not yet implemented`);
        continue;

      default: {
        // TypeScript exhaustiveness check
        const _exhaustive: never = config;
        throw new Error(`Unknown rule kind: ${(_exhaustive as RuleConfig).kind}`);
      }
    }

    rules.push(rule);
  }

  return rules;
}

/**
 * Build a rule context from graph analysis results
 */
export function buildRuleContext(
  graphAnalysis: GraphReport,
  config: ArchctlConfig,
  projectRoot: string
): RuleContext {
  const files = new Map<string, FileInfo>();

  // Build file info map from graph
  const graphFiles = graphAnalysis.graph.files as Record<
    string,
    { layer?: string; language?: string; imports?: string[]; capabilities?: unknown[] }
  >;
  for (const [filePath, fileData] of Object.entries(graphFiles)) {
    const data = fileData;

    // Count dependencies for this file
    const dependencyCount = (
      graphAnalysis.graph.edges as Array<{ from: string; to: string }>
    ).filter((edge) => edge.from === filePath).length;

    const fileInfo: FileInfo = {
      path: filePath,
      layer: data.layer || null,
      language: data.language || 'unknown',
      imports: data.imports || [],
      dependencyCount,
    };

    if (data.capabilities) {
      fileInfo.capabilities = data.capabilities as import('../types/capabilities').Capability[];
    }

    files.set(filePath, fileInfo);
  }

  return {
    files,
    dependencies: graphAnalysis.graph.edges as Array<{ from: string; to: string }>,
    layers: config.layers || [],
    layerMappings: config.layerMappings || [],
    projectRoot,
    contextMappings: config.contextMappings || [],
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
    errors: violations.filter((v) => v.severity === 'error'),
    warnings: violations.filter((v) => v.severity === 'warning'),
    info: violations.filter((v) => v.severity === 'info'),
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
  const fileSet = new Set(violations.map((v) => v.file));

  return {
    total: violations.length,
    errors: grouped.errors.length,
    warnings: grouped.warnings.length,
    info: grouped.info.length,
    filesAffected: fileSet.size,
  };
}
