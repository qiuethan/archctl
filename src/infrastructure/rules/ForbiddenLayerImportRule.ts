import * as path from 'path';
import { BaseRule, type RuleContext, type RuleViolation } from '../../types/rules';
import {
  findImportPositionForLanguage,
  resolveImportSpecifier,
  getFileStartPosition,
} from '../../utils/astPosition';

export interface ForbiddenLayerImportConfig {
  fromLayer: string;
  toLayer: string;
}

/**
 * Rule that forbids imports from one layer to another
 * Example: Forbid domain layer from importing presentation layer
 */
export class ForbiddenLayerImportRule extends BaseRule {
  private fromLayer: string;
  private toLayer: string;

  constructor(id: string, title: string, description: string, config: ForbiddenLayerImportConfig) {
    super(id, title, description);
    this.fromLayer = config.fromLayer;
    this.toLayer = config.toLayer;
  }

  check(ctx: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];

    // Check each dependency
    for (const dep of ctx.dependencies) {
      const fromFile = ctx.files.get(dep.from);
      const toFile = ctx.files.get(dep.to);

      if (!fromFile || !toFile) continue;

      // Check if this is a forbidden layer import
      if (fromFile.layer === this.fromLayer && toFile.layer === this.toLayer) {
        // Try to find the exact import position
        const importSpecifier = resolveImportSpecifier(dep.from, dep.to, ctx.projectRoot);
        const absolutePath = path.join(ctx.projectRoot, dep.from);
        const range = importSpecifier
          ? findImportPositionForLanguage(
              absolutePath,
              importSpecifier,
              fromFile.language || 'unknown'
            )
          : null;

        violations.push({
          ruleId: this.id,
          severity: 'error',
          message: `File in "${this.fromLayer}" layer cannot import from "${this.toLayer}" layer`,
          file: dep.from,
          range: range || getFileStartPosition(),
          suggestion: `Remove the import of "${dep.to}" or refactor to use an allowed layer`,
          metadata: {
            fromLayer: this.fromLayer,
            toLayer: this.toLayer,
            importedFile: dep.to,
          },
        });
      }
    }

    return violations;
  }
}
