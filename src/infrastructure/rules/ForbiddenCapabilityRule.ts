import { BaseRule, type RuleContext, type RuleViolation } from '../../types/rules';

export interface ForbiddenCapabilityConfig {
  forbiddenCapabilities: string[];
  layer?: string | undefined;
}

/**
 * Rule that enforces a blacklist of forbidden capabilities
 * Checks which capabilities (actions) are forbidden from being performed by code
 */
export class ForbiddenCapabilityRule extends BaseRule {
  private forbiddenCapabilities: Set<string>;
  private layer?: string | undefined;

  constructor(id: string, title: string, description: string, config: ForbiddenCapabilityConfig) {
    super(id, title, description);
    this.forbiddenCapabilities = new Set(config.forbiddenCapabilities);
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

      // Check if file has capabilities
      if (!fileInfo.capabilities || fileInfo.capabilities.length === 0) {
        continue;
      }

      // Check each capability against the forbidden list
      const foundForbidden: string[] = [];
      for (const capability of fileInfo.capabilities) {
        if (this.forbiddenCapabilities.has(capability.type)) {
          foundForbidden.push(capability.type);
        }
      }

      // If there are forbidden capabilities, create a violation
      if (foundForbidden.length > 0) {
        // Get unique capability types
        const uniqueForbidden = Array.from(new Set(foundForbidden));

        violations.push({
          ruleId: this.id,
          severity: 'error',
          message: `File uses forbidden capabilities: ${uniqueForbidden.join(', ')}`,
          file: filePath,
          suggestion: `The following capabilities are forbidden${this.layer ? ` in layer '${this.layer}'` : ''}: ${Array.from(this.forbiddenCapabilities).join(', ')}. Remove or refactor the forbidden capability usage.`,
          metadata: {
            forbiddenCapabilities: uniqueForbidden,
            allForbiddenCapabilities: Array.from(this.forbiddenCapabilities),
            layer: fileInfo.layer,
          },
        });
      }
    }

    return violations;
  }
}
