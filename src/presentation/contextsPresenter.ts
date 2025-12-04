import type { ArchctlConfig, ContextMapping, ContextVisibilityRuleConfig } from '../types/config';
import { messages } from '../utils/messages';
import { colors, formatContext } from '../utils/colors';

export function displayUnknownSubcommand(subcommand: string | undefined): void {
  console.error(`${messages.contexts.help.unknownSubcommand} ${subcommand || '(none)'}`);
  console.log(messages.contexts.help.availableSubcommands);
  console.log(messages.contexts.help.listUsage);
  console.log(messages.contexts.help.addUsage);
  console.log(messages.contexts.help.removeUsage);
  console.log(messages.contexts.help.unmapUsage);
  console.log(messages.contexts.help.visibilityUsage);
}

export function displayConfigNotFound(): void {
  console.error(
    `${colors.symbols.error} ${colors.error('Configuration file not found.')} ${colors.dim('Run')} ${colors.code('archctl init')} ${colors.dim('to initialize.')}`
  );
}

export function displayMustRunFromProject(projectRoot: string, currentDir: string): void {
  console.error('Command must be run from within the project directory.');
  console.error(`Project root: ${projectRoot}`);
  console.error(`Current directory: ${currentDir}`);
}

export function displayContextsList(config: ArchctlConfig): void {
  console.log(`\n${colors.bold(messages.contexts.list.contextMappingsHeader)}`);
  if (!config.contextMappings || config.contextMappings.length === 0) {
    console.log(`  ${colors.dim(messages.contexts.list.noContextMappings)}`);
    console.log(`  ${colors.dim(messages.contexts.list.suggestAdd)}`);
  } else {
    config.contextMappings.forEach((mapping) => {
      printMapping(mapping);
    });
  }

  console.log(`\n${colors.bold(messages.contexts.list.visibilityHeader)}`);
  const visibilityRule = config.rules.find(
    (rule): rule is ContextVisibilityRuleConfig => rule.kind === 'context-visibility'
  );
  if (!visibilityRule || !visibilityRule.contexts?.length) {
    console.log(`  ${colors.dim(messages.contexts.list.noVisibilityRules)}`);
    console.log(`  ${colors.dim(messages.contexts.list.suggestVisibility)}`);
  } else {
    visibilityRule.contexts.forEach((ctx) => {
      console.log(
        `  ${formatContext(ctx.context)} ${colors.dim('can depend on')} ${colors.code(JSON.stringify(ctx.canDependOn || []))}`
      );
    });
  }
}

export function displayContextMapped(mapping: ContextMapping, configPath: string): void {
  const parts = [`include: ${JSON.stringify(mapping.include)}`];
  if (mapping.public) {
    parts.push(`public: ${JSON.stringify(mapping.public)}`);
  }
  if (mapping.exclude) {
    parts.push(`exclude: ${JSON.stringify(mapping.exclude)}`);
  }
  if (mapping.priority !== undefined) {
    parts.push(`priority: ${mapping.priority}`);
  }
  console.log(
    `${colors.symbols.success} ${colors.success(messages.contexts.add.success)} ${formatContext(mapping.context)} ${colors.dim('->')} ${parts.join(', ')}`
  );
  console.log(
    `${colors.symbols.success} ${colors.success(messages.contexts.common.configSaved)} ${colors.path(configPath)}`
  );
}

export function displayContextRemoved(
  result: {
    contextName: string;
    includePath?: string | undefined;
    publicPath?: string | undefined;
    removed: boolean;
  },
  configPath: string
): void {
  if (result.includePath) {
    console.log(
      `${colors.symbols.success} ${colors.success(messages.contexts.remove.removedInclude)} ${formatContext(result.contextName)} ${colors.dim('->')} ${colors.code(result.includePath)}`
    );
  } else if (result.publicPath) {
    console.log(
      `${colors.symbols.success} ${colors.success(messages.contexts.remove.removedPublic)} ${formatContext(result.contextName)} ${colors.dim('->')} ${colors.code(result.publicPath)}`
    );
  } else {
    console.log(
      `${colors.symbols.success} ${colors.success(messages.contexts.remove.removedContext)} ${formatContext(result.contextName)}`
    );
  }
  console.log(
    `${colors.symbols.success} ${colors.success(messages.contexts.common.configSaved)} ${colors.path(configPath)}`
  );
}

export function displayVisibilityUpdated(
  contextName: string,
  allowed: string[],
  configPath: string
) {
  console.log(
    `${colors.symbols.success} ${colors.success(messages.contexts.visibility.updated)} ${formatContext(contextName)} ${colors.dim('->')} ${colors.code(JSON.stringify(allowed))}`
  );
  console.log(
    `${colors.symbols.success} ${colors.success(messages.contexts.common.configSaved)} ${colors.path(configPath)}`
  );
}

export function displayContextNotFound(contextName: string): void {
  console.error(
    `${colors.symbols.error} ${colors.error(messages.contexts.remove.contextNotFound)} ${formatContext(contextName)}`
  );
}

export function displayMissingContext(): void {
  console.error(messages.contexts.add.missingContext);
}

export function displayMissingInclude(): void {
  console.error(messages.contexts.add.missingInclude);
}

function printMapping(mapping: ContextMapping) {
  const parts = [`${colors.dim('include:')} ${colors.code(JSON.stringify(mapping.include))}`];
  if (mapping.public && mapping.public.length) {
    parts.push(`${colors.dim('public:')} ${colors.code(JSON.stringify(mapping.public))}`);
  }
  if (mapping.exclude && mapping.exclude.length) {
    parts.push(`${colors.dim('exclude:')} ${colors.code(JSON.stringify(mapping.exclude))}`);
  }
  if (mapping.priority !== undefined) {
    parts.push(`${colors.dim('priority:')} ${colors.primary(mapping.priority.toString())}`);
  }
  console.log(`  ${formatContext(mapping.context)}: ${parts.join(', ')}`);
}
