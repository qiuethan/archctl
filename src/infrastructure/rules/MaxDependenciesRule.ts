import { BaseRule, type RuleContext, type RuleViolation } from '../../types/rules';

export interface MaxDependenciesConfig {
  maxDependencies: number;
  layer?: string | undefined;
}

/**
 * Rule that enforces a maximum number of dependencies per file
 * Helps prevent god objects and maintain modularity
 */
export class MaxDependenciesRule extends BaseRule {
  private maxDependencies: number;
  private layer?: string | undefined;

  constructor(id: string, title: string, description: string, config: MaxDependenciesConfig) {
    super(id, title, description);
    this.maxDependencies = config.maxDependencies;
    this.layer = config.layer;
  }

  check(ctx: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];

    // Check each file
    for (const [filePath, fileInfo] of ctx.files) {
      // If layer is specified, only check files in that layer
      if (this.layer && fileInfo.layer !== this.layer) {
        continue;
      }

      // Check if file exceeds max dependencies
      if (fileInfo.dependencyCount > this.maxDependencies) {
        violations.push({
          ruleId: this.id,
          severity: 'warning',
          message: `File has ${fileInfo.dependencyCount} dependencies, exceeding the maximum of ${this.maxDependencies}`,
          file: filePath,
          suggestion: `Refactor this file to reduce dependencies. Consider splitting into smaller modules or using dependency injection.`,
          metadata: {
            dependencyCount: fileInfo.dependencyCount,
            maxDependencies: this.maxDependencies,
            layer: fileInfo.layer,
            excessDependencies: fileInfo.dependencyCount - this.maxDependencies,
          },
        });
      }
    }

    return violations;
  }
}
