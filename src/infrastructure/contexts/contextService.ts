import * as path from 'path';
import * as fs from 'fs';
import type {
  ArchctlConfig,
  ContextMapping,
  ContextVisibilityRuleConfig,
  ContextVisibilityRuleContextConfig,
  RuleConfig,
} from '../../types/config';
import { toRelativePath, isWithinDirectory, normalizePathPattern } from '../../utils/path';

/**
 * Low-level operations for context mappings and visibility rules
 */

export function getProjectRoot(configPath: string): string {
  return path.dirname(path.dirname(configPath));
}

export function validateWithinProject(projectRoot: string, currentDir: string): boolean {
  return isWithinDirectory(currentDir, projectRoot);
}

export function contextExists(config: ArchctlConfig, contextName: string): boolean {
  return Boolean(
    config.contextMappings?.some(
      (mapping) => mapping.context.toLowerCase() === contextName.toLowerCase()
    )
  );
}

export function findContextMapping(
  config: ArchctlConfig,
  contextName: string
): ContextMapping | undefined {
  return config.contextMappings?.find(
    (mapping) => mapping.context.toLowerCase() === contextName.toLowerCase()
  );
}

export function addContextMapping(config: ArchctlConfig, mapping: ContextMapping): void {
  if (!config.contextMappings) {
    config.contextMappings = [];
  }
  config.contextMappings.push(mapping);
}

export function removeContextMapping(
  config: ArchctlConfig,
  contextName: string,
  includePath?: string
): boolean {
  if (!config.contextMappings || config.contextMappings.length === 0) {
    return false;
  }

  const initialLength = config.contextMappings.length;

  if (includePath) {
    const normalizedInput = normalizePathPattern(includePath);
    config.contextMappings = config.contextMappings.filter((mapping) => {
      if (mapping.context.toLowerCase() !== contextName.toLowerCase()) return true;
      return !mapping.include.some((pattern) => {
        const normalizedPattern = normalizePathPattern(pattern);
        return (
          normalizedPattern === normalizedInput ||
          pattern === includePath ||
          normalizedPattern === includePath ||
          pattern === normalizedInput
        );
      });
    });
  } else {
    config.contextMappings = config.contextMappings.filter((mapping) => {
      return mapping.context.toLowerCase() !== contextName.toLowerCase();
    });
  }

  return config.contextMappings.length < initialLength;
}

export function removePatternFromArray(
  patterns: string[] | undefined,
  target: string
): { updated: string[] | undefined; removed: boolean } {
  if (!patterns || patterns.length === 0) {
    return { updated: patterns, removed: false };
  }
  const normalizedTarget = normalizePathPattern(target);
  const filtered = patterns.filter((pattern) => {
    const normalizedPattern = normalizePathPattern(pattern);
    return !(
      normalizedPattern === normalizedTarget ||
      pattern === target ||
      normalizedPattern === target ||
      pattern === normalizedTarget
    );
  });
  return {
    updated: filtered.length ? filtered : undefined,
    removed: filtered.length < patterns.length,
  };
}

export function processPathsForMapping(
  projectRoot: string,
  currentDir: string,
  paths: string[]
): string[] {
  return paths.map((p) => {
    const absolutePath = path.isAbsolute(p) ? p : path.resolve(currentDir, p);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Path does not exist: ${p}`);
    }
    const relativePath = toRelativePath(p, projectRoot, currentDir);
    return normalizePathPattern(relativePath);
  });
}

export function findContextVisibilityRule(
  config: ArchctlConfig
): ContextVisibilityRuleConfig | undefined {
  return config.rules.find(
    (rule): rule is ContextVisibilityRuleConfig => rule.kind === 'context-visibility'
  );
}

export function addContextVisibilityRule(config: ArchctlConfig, rule: ContextVisibilityRuleConfig) {
  config.rules.push(rule as RuleConfig);
}

export function upsertContextVisibilityEntry(
  rule: ContextVisibilityRuleConfig,
  entry: ContextVisibilityRuleContextConfig
): ContextVisibilityRuleConfig {
  if (!rule.contexts) {
    rule.contexts = [];
  }

  const existing = rule.contexts.find(
    (ctx) => ctx.context.toLowerCase() === entry.context.toLowerCase()
  );

  if (existing) {
    if (entry.canDependOn !== undefined) {
      existing.canDependOn = entry.canDependOn;
    }
  } else {
    const newEntry: ContextVisibilityRuleContextConfig = { context: entry.context };
    if (entry.canDependOn !== undefined) {
      newEntry.canDependOn = entry.canDependOn;
    }
    rule.contexts.push(newEntry);
  }

  return rule;
}
