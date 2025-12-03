import { BaseRule, type RuleContext, type RuleViolation } from '../../types/rules';
import type { ContextVisibilityRuleContextConfig } from '../../types/config';
import { resolveContextForFile, isPathInPublicApi } from '../../utils/contexts';
import { findViolationRange, getFileStartPosition } from '../../utils/astPosition';

export interface InternalContextVisibilityConfig {
  contexts?: ContextVisibilityRuleContextConfig[] | undefined;
}

export class ContextVisibilityRule extends BaseRule {
  private contextAllowMap: Map<string, Set<string>>;

  constructor(
    id: string,
    title: string,
    description: string,
    config: InternalContextVisibilityConfig
  ) {
    super(id, title, description);
    this.contextAllowMap = new Map();

    if (config.contexts) {
      for (const ctx of config.contexts) {
        this.contextAllowMap.set(ctx.context, new Set(ctx.canDependOn ?? []));
      }
    }
  }

  check(ctx: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const contextMappings = ctx.contextMappings ?? [];

    for (const dep of ctx.dependencies) {
      const fromFile = ctx.files.get(dep.from);
      const toFile = ctx.files.get(dep.to);

      if (!fromFile || !toFile) continue;

      const fromContext = resolveContextForFile(dep.from, contextMappings);
      const toContext = resolveContextForFile(dep.to, contextMappings);

      // If either file has no context mapping, skip
      if (!fromContext || !toContext) continue;

      // Same-context imports are always allowed
      if (fromContext === toContext) continue;

      const isPublicTarget = isPathInPublicApi(dep.to, contextMappings);

      // If the target is not part of any public API, this is a hard violation
      if (!isPublicTarget) {
        const range = findViolationRange(
          dep.from,
          dep.to,
          fromFile.language || 'unknown',
          ctx.projectRoot
        );

        violations.push({
          ruleId: this.id,
          severity: 'error',
          message: `Vertical Context Boundary Breach: context "${fromContext}" cannot import internal path "${dep.to}" from context "${toContext}". Only the public API of "${toContext}" may be imported.`,
          file: dep.from,
          range: range || getFileStartPosition(),
          suggestion:
            "Import from the target context's public API instead of its internal modules, or expose the required behavior through its API.",
          metadata: {
            fromContext,
            toContext,
            importedFile: dep.to,
            reason: 'non-public-target',
          },
        });

        continue;
      }

      // Target is public - now enforce explicit context dependency declarations if provided
      const allowedTargets = this.contextAllowMap.get(fromContext);

      if (allowedTargets && !allowedTargets.has(toContext)) {
        const range = findViolationRange(
          dep.from,
          dep.to,
          fromFile.language || 'unknown',
          ctx.projectRoot
        );

        violations.push({
          ruleId: this.id,
          severity: 'error',
          message: `Context Dependency Violation: context "${fromContext}" is not permitted to depend on context "${toContext}".`,
          file: dep.from,
          range: range || getFileStartPosition(),
          suggestion: `Update the architecture so that "${fromContext}" no longer depends on "${toContext}", or explicitly allow this by adding "${toContext}" to the canDependOn list for "${fromContext}".`,
          metadata: {
            fromContext,
            toContext,
            importedFile: dep.to,
            reason: 'disallowed-context-dependency',
            allowedDependencies: Array.from(allowedTargets),
          },
        });
      }
    }

    return violations;
  }
}
