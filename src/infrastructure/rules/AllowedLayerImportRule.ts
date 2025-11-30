import * as path from 'path';
import { BaseRule, type RuleContext, type RuleViolation } from '../../types/rules';
import {
  findImportPositionForLanguage,
  resolveImportSpecifier,
  getFileStartPosition,
} from '../../utils/astPosition';

export interface AllowedLayerImportConfig {
  fromLayer: string;
  allowedLayers: string[];
}

/**
 * Rule that enforces a whitelist of allowed layer imports
 * Example: Domain layer can only import from domain layer
 */
export class AllowedLayerImportRule extends BaseRule {
  private fromLayer: string;
  private allowedLayers: Set<string>;

  constructor(id: string, title: string, description: string, config: AllowedLayerImportConfig) {
    super(id, title, description);
    this.fromLayer = config.fromLayer;
    this.allowedLayers = new Set(config.allowedLayers);
  }

  check(ctx: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];

    // Check each dependency
    for (const dep of ctx.dependencies) {
      const fromFile = ctx.files.get(dep.from);
      const toFile = ctx.files.get(dep.to);

      if (!fromFile || !toFile) continue;

      // Only check files in the specified fromLayer
      if (fromFile.layer !== this.fromLayer) continue;

      // If importing from a layer not in the allowed list, it's a violation
      if (toFile.layer && !this.allowedLayers.has(toFile.layer)) {
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
          message: `File in "${this.fromLayer}" layer can only import from [${Array.from(this.allowedLayers).join(', ')}], but imports from "${toFile.layer}"`,
          file: dep.from,
          range: range || getFileStartPosition(),
          suggestion: `Remove the import of "${dep.to}" or move it to an allowed layer`,
          metadata: {
            fromLayer: this.fromLayer,
            toLayer: toFile.layer,
            allowedLayers: Array.from(this.allowedLayers),
            importedFile: dep.to,
          },
        });
      }
    }

    return violations;
  }
}
