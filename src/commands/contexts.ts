import type { ParsedArgs } from '../types';
import * as configService from '../services/configService';
import * as contextsService from '../services/contextsService';
import * as presenter from '../presentation/contextsPresenter';

export function cmdContexts(args: ParsedArgs): void {
  const subcommand = args._?.[0];

  switch (subcommand) {
    case 'list':
      cmdContextsList(args);
      break;
    case 'add':
      cmdContextsAdd(args);
      break;
    case 'remove':
      cmdContextsRemove(args);
      break;
    case 'unmap':
      cmdContextsUnmap(args);
      break;
    case 'visibility':
      cmdContextsVisibility(args);
      break;
    default:
      presenter.displayUnknownSubcommand(subcommand);
      process.exit(1);
  }
}

function loadConfigOrExit() {
  try {
    return configService.findAndLoadConfig();
  } catch {
    presenter.displayConfigNotFound();
    process.exit(1);
  }
}

function cmdContextsList(_args: ParsedArgs): void {
  const { config } = loadConfigOrExit();
  presenter.displayContextsList(config);
}

function cmdContextsAdd(args: ParsedArgs): void {
  const { config, configPath } = loadConfigOrExit();
  const projectRoot = contextsService.getProjectRoot(configPath);
  const currentDir = process.cwd();

  if (!contextsService.validateWithinProject(projectRoot, currentDir)) {
    presenter.displayMustRunFromProject(projectRoot, currentDir);
    process.exit(1);
  }

  try {
    const input = contextsService.parseMappingArguments(
      {
        contextName: typeof args.context === 'string' ? args.context : undefined,
        include:
          Array.isArray(args.include) || typeof args.include === 'string'
            ? args.include
            : undefined,
        exclude:
          Array.isArray(args.exclude) || typeof args.exclude === 'string'
            ? args.exclude
            : undefined,
        public:
          Array.isArray(args.public) || typeof args.public === 'string' ? args.public : undefined,
        priority:
          typeof args.priority === 'string' || typeof args.priority === 'number'
            ? args.priority
            : undefined,
      },
      projectRoot,
      currentDir
    );

    const mapping = contextsService.addContextMapping(config, input);
    configService.saveConfig(configPath, config);
    presenter.displayContextMapped(mapping, configPath);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Missing required argument: --context')) {
        presenter.displayMissingContext();
      } else if (error.message.includes('Missing required argument: --include')) {
        presenter.displayMissingInclude();
      } else {
        console.error(`Failed to add context mapping: ${error.message}`);
      }
    }
    process.exit(1);
  }
}

function cmdContextsRemove(args: ParsedArgs): void {
  const { config, configPath } = loadConfigOrExit();
  try {
    const includeArg =
      typeof args.include === 'string'
        ? args.include
        : Array.isArray(args.include)
          ? (args.include[0] as string)
          : undefined;
    const publicArg =
      typeof args.public === 'string'
        ? args.public
        : Array.isArray(args.public)
          ? (args.public[0] as string)
          : undefined;

    const result = contextsService.removeContextMapping(
      config,
      args.context as string | undefined,
      includeArg,
      publicArg
    );
    configService.saveConfig(configPath, config);
    presenter.displayContextRemoved(result, configPath);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith('Context not found')) {
        presenter.displayContextNotFound(args.context as string);
      } else {
        console.error(`Failed to remove context mapping: ${error.message}`);
      }
    }
    process.exit(1);
  }
}

function cmdContextsUnmap(args: ParsedArgs): void {
  // Alias to remove with explicit include/public flags
  cmdContextsRemove(args);
}

function cmdContextsVisibility(args: ParsedArgs): void {
  const { config, configPath } = loadConfigOrExit();

  const contextName = args.context as string | undefined;
  const allow = args.allow as string | string[] | undefined;

  if (!contextName) {
    presenter.displayMissingContext();
    process.exit(1);
  }

  let allowedContexts: string[] = [];
  if (Array.isArray(allow)) {
    allowedContexts = allow;
  } else if (typeof allow === 'string') {
    allowedContexts = allow
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  } else {
    console.error('Missing required argument: --allow <context1,context2>');
    process.exit(1);
  }

  try {
    contextsService.updateVisibilityRule(config, {
      contextName,
      allowedContexts,
    });
    configService.saveConfig(configPath, config);
    presenter.displayVisibilityUpdated(contextName, allowedContexts, configPath);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to update context visibility: ${error.message}`);
    }
    process.exit(1);
  }
}
