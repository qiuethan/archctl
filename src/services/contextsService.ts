import type { ArchctlConfig, ContextMapping, ContextVisibilityRuleConfig } from '../types/config';
import * as contextInfra from '../infrastructure/contexts/contextService';

export interface ParsedContextMappingArgs {
  contextName?: string | undefined;
  include?: string | string[] | undefined;
  exclude?: string | string[] | undefined;
  public?: string | string[] | undefined;
  priority?: string | number | undefined;
}

export interface AddContextMappingInput {
  contextName: string;
  includePaths: string[];
  excludePaths?: string[] | undefined;
  publicPaths?: string[] | undefined;
  priority?: number | undefined;
  projectRoot: string;
  currentDir: string;
}

export interface RemoveContextMappingResult {
  contextName: string;
  includePath?: string | undefined;
  publicPath?: string | undefined;
  removed: boolean;
}

export interface UpdateVisibilityInput {
  contextName: string;
  allowedContexts: string[];
}

export function getProjectRoot(configPath: string): string {
  return contextInfra.getProjectRoot(configPath);
}

export function validateWithinProject(projectRoot: string, currentDir: string): boolean {
  return contextInfra.validateWithinProject(projectRoot, currentDir);
}

export function parseMappingArguments(
  args: ParsedContextMappingArgs,
  projectRoot: string,
  currentDir: string
): AddContextMappingInput {
  if (!args.contextName) {
    throw new Error('Missing required argument: --context');
  }

  let includePaths: string[];
  if (Array.isArray(args.include)) {
    includePaths = args.include;
  } else if (typeof args.include === 'string') {
    includePaths = [args.include];
  } else {
    throw new Error('Missing required argument: --include');
  }

  let excludePaths: string[] | undefined;
  if (args.exclude) {
    excludePaths = Array.isArray(args.exclude) ? args.exclude : [args.exclude];
  }

  let publicPaths: string[] | undefined;
  if (args.public) {
    publicPaths = Array.isArray(args.public) ? args.public : [args.public];
  }

  let priority: number | undefined;
  if (args.priority !== undefined) {
    const parsed = typeof args.priority === 'string' ? parseInt(args.priority, 10) : args.priority;
    if (!isNaN(parsed)) {
      priority = parsed;
    }
  }

  return {
    contextName: args.contextName,
    includePaths,
    excludePaths,
    publicPaths,
    priority,
    projectRoot,
    currentDir,
  };
}

export function addContextMapping(
  config: ArchctlConfig,
  input: AddContextMappingInput
): ContextMapping {
  const processedIncludes = contextInfra.processPathsForMapping(
    input.projectRoot,
    input.currentDir,
    input.includePaths
  );

  const processedExcludes = input.excludePaths
    ? contextInfra.processPathsForMapping(input.projectRoot, input.currentDir, input.excludePaths)
    : undefined;

  const processedPublics = input.publicPaths
    ? contextInfra.processPathsForMapping(input.projectRoot, input.currentDir, input.publicPaths)
    : undefined;

  const existing = contextInfra.findContextMapping(config, input.contextName);

  if (existing) {
    const merge = (current: string[] | undefined, next: string[] | undefined) => {
      if (!next || next.length === 0) return current;
      const merged = new Set([...(current || []), ...next]);
      return Array.from(merged);
    };

    existing.include = merge(existing.include, processedIncludes) || [];
    const mergedExcludes = merge(existing.exclude, processedExcludes);
    if (mergedExcludes !== undefined) {
      existing.exclude = mergedExcludes;
    }
    const mergedPublic = merge(existing.public, processedPublics);
    if (mergedPublic !== undefined) {
      existing.public = mergedPublic;
    }
    if (input.priority !== undefined && !isNaN(input.priority)) {
      existing.priority = input.priority;
    }
    return existing;
  }

  const mapping: ContextMapping = {
    context: input.contextName,
    include: processedIncludes,
  };

  if (processedExcludes && processedExcludes.length > 0) {
    mapping.exclude = processedExcludes;
  }
  if (processedPublics && processedPublics.length > 0) {
    mapping.public = processedPublics;
  }
  if (input.priority !== undefined && !isNaN(input.priority)) {
    mapping.priority = input.priority;
  }

  contextInfra.addContextMapping(config, mapping);
  return mapping;
}

export function removeContextMapping(
  config: ArchctlConfig,
  contextName?: string,
  includePath?: string,
  publicPath?: string
): RemoveContextMappingResult {
  if (!contextName) {
    throw new Error('Missing required argument: --context');
  }

  const existing = contextInfra.findContextMapping(config, contextName);
  if (!existing) {
    throw new Error(`Context not found: ${contextName}`);
  }

  if (includePath) {
    const removed = contextInfra.removeContextMapping(config, contextName, includePath);
    if (!removed) {
      throw new Error(`No mapping found for context "${contextName}" with path "${includePath}"`);
    }
    return { contextName, includePath, removed };
  }

  if (publicPath) {
    const { updated, removed } = contextInfra.removePatternFromArray(existing.public, publicPath);
    if (!removed) {
      throw new Error(`No public pattern "${publicPath}" found for context "${contextName}"`);
    }
    if (updated !== undefined) {
      existing.public = updated;
    } else {
      delete existing.public;
    }
    return { contextName, publicPath, removed };
  }

  const removed = contextInfra.removeContextMapping(config, contextName);
  if (!removed) {
    throw new Error(`No mappings found for context "${contextName}"`);
  }
  return { contextName, removed };
}

export function updateVisibilityRule(config: ArchctlConfig, input: UpdateVisibilityInput): void {
  if (!config.rules) {
    config.rules = [];
  }
  const existingRule = contextInfra.findContextVisibilityRule(config);

  if (!existingRule) {
    const rule: ContextVisibilityRuleConfig = {
      kind: 'context-visibility',
      id: 'context-visibility',
      title: 'Context Visibility',
      description: 'Controls which contexts can depend on each other',
      contexts: [
        {
          context: input.contextName,
          canDependOn: input.allowedContexts,
        },
      ],
    };
    contextInfra.addContextVisibilityRule(config, rule);
    return;
  }

  contextInfra.upsertContextVisibilityEntry(existingRule, {
    context: input.contextName,
    canDependOn: input.allowedContexts,
  });
}

export function contextExists(config: ArchctlConfig, contextName: string): boolean {
  return contextInfra.contextExists(config, contextName);
}
