import { BaseRule, type RuleContext, type RuleViolation } from '../../types/rules';

export interface ExternalDependencyConfig {
  allowedPackages: string[];
  layer?: string | undefined;
}

/**
 * Rule that enforces a whitelist of allowed external library imports
 * Checks which external packages (npm, pip, etc.) are allowed to be imported
 */
export class ExternalDependencyRule extends BaseRule {
  private allowedPackages: Set<string>;
  private layer?: string | undefined;

  constructor(id: string, title: string, description: string, config: ExternalDependencyConfig) {
    super(id, title, description);
    this.allowedPackages = new Set(config.allowedPackages);
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

      // Check if file has external imports
      if (!fileInfo.imports || fileInfo.imports.length === 0) {
        continue;
      }

      // Check each import against the allowlist
      const disallowedImports: string[] = [];
      for (const importedPackage of fileInfo.imports) {
        if (!this.allowedPackages.has(importedPackage)) {
          disallowedImports.push(importedPackage);
        }
      }

      // If there are disallowed imports, create a violation
      if (disallowedImports.length > 0) {
        violations.push({
          ruleId: this.id,
          severity: 'error',
          message: `File imports disallowed external packages: ${disallowedImports.join(', ')}`,
          file: filePath,
          suggestion: `Only the following packages are allowed: ${Array.from(this.allowedPackages).join(', ')}. Remove or replace the disallowed imports.`,
          metadata: {
            disallowedImports,
            allowedPackages: Array.from(this.allowedPackages),
            layer: fileInfo.layer,
            totalImports: fileInfo.imports.length,
          },
        });
      }
    }

    return violations;
  }
}
