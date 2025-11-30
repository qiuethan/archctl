import { BaseRule, type RuleContext, type RuleViolation } from '../../types/rules';
import { minimatch } from 'minimatch';

export interface FilePatternLayerConfig {
  pattern: string;
  requiredLayer: string;
}

/**
 * Rule that enforces files matching a pattern must be in a specific layer
 * Example: All files matching repository pattern must be in infrastructure layer
 */
export class FilePatternLayerRule extends BaseRule {
  private pattern: string;
  private requiredLayer: string;

  constructor(id: string, title: string, description: string, config: FilePatternLayerConfig) {
    super(id, title, description);
    this.pattern = config.pattern;
    this.requiredLayer = config.requiredLayer;
  }

  check(ctx: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];

    // Check each file
    for (const [filePath, fileInfo] of ctx.files) {
      // Check if file matches the pattern
      if (minimatch(filePath, this.pattern)) {
        // Check if it's in the required layer
        if (fileInfo.layer !== this.requiredLayer) {
          violations.push({
            ruleId: this.id,
            severity: 'warning',
            message: `File matching pattern "${this.pattern}" must be in "${this.requiredLayer}" layer, but is in "${fileInfo.layer || 'unmapped'}"`,
            file: filePath,
            suggestion: `Move this file to the "${this.requiredLayer}" layer or update layer mappings`,
            metadata: {
              pattern: this.pattern,
              requiredLayer: this.requiredLayer,
              actualLayer: fileInfo.layer,
            },
          });
        }
      }
    }

    return violations;
  }
}
