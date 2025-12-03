import { BaseRule, type RuleContext, type RuleViolation } from '../../types/rules';

export interface AllowedCapabilityConfig {
  allowedCapabilities: string[];
  layer?: string | undefined;
}

/**
 * Rule that enforces a whitelist of allowed capabilities
 * Checks which capabilities (actions) are allowed to be performed by code
 */
export class AllowedCapabilityRule extends BaseRule {
  private allowedCapabilities: Set<string>;
  private layer?: string | undefined;

  constructor(id: string, title: string, description: string, config: AllowedCapabilityConfig) {
    super(id, title, description);
    this.allowedCapabilities = new Set(config.allowedCapabilities);
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

      // Check each capability against the allowlist and create violations with line numbers
      for (const capability of fileInfo.capabilities) {
        if (!this.allowedCapabilities.has(capability.type)) {
          const violation: RuleViolation = {
            ruleId: this.id,
            severity: 'error',
            message: `File uses disallowed capability: ${capability.type}`,
            file: filePath,
            suggestion: `Only the following capabilities are allowed${this.layer ? ` in layer '${this.layer}'` : ''}: ${Array.from(this.allowedCapabilities).join(', ')}. Remove or refactor the disallowed capability usage.`,
            metadata: {
              capability: capability.type,
              action: capability.action,
              allowedCapabilities: Array.from(this.allowedCapabilities),
              layer: fileInfo.layer,
            },
          };
          if (capability.line) {
            violation.line = capability.line;
          }
          violations.push(violation);
        }
      }
    }

    return violations;
  }
}
