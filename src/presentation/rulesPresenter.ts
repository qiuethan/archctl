import type { RuleConfig } from '../types/config';
import { colors, formatRuleId } from '../utils/colors';

/**
 * Presentation layer for rules command
 */

export function displayRuleAdded(rule: RuleConfig, configPath: string): void {
  console.log(
    `\n${colors.symbols.success} ${colors.success('Added rule')} ${colors.bold(rule.title)}`
  );
  console.log(`  ${colors.dim('ID:')} ${formatRuleId(rule.id)}`);
  console.log(`  ${colors.dim('Type:')} ${colors.primary(rule.kind)}`);
  console.log(
    `${colors.symbols.success} ${colors.success('Config saved to:')} ${colors.path(configPath)}`
  );
  console.log(
    `\n${colors.symbols.lightbulb} ${colors.info('Run')} ${colors.code('archctl lint')} ${colors.info('to check your new rule')}`
  );
}

export function displayRuleRemoved(ruleId: string, configPath: string): void {
  console.log(
    `\n${colors.symbols.success} ${colors.success('Removed rule')} ${formatRuleId(ruleId)}`
  );
  console.log(
    `${colors.symbols.success} ${colors.success('Configuration saved to:')} ${colors.path(configPath)}`
  );
}

export function displayRulesList(rules: RuleConfig[]): void {
  if (rules.length === 0) {
    console.log(`\n${colors.warning('No rules defined yet.')}`);
    console.log(
      `${colors.dim('Use')} ${colors.code('archctl rules add')} ${colors.dim('to add a rule.')}`
    );
    return;
  }

  console.log(`\n${colors.bold('Defined Rules')} ${colors.dim(`(${rules.length})`)}\n`);

  for (const rule of rules) {
    console.log(`  ${formatRuleId(rule.id)}`);
    console.log(`    ${colors.dim('Type:')} ${colors.primary(rule.kind)}`);
    console.log(`    ${colors.dim('Title:')} ${rule.title}`);
    console.log(`    ${colors.dim('Description:')} ${colors.dim(rule.description)}`);
    console.log();
  }
}

export function displayConfigNotFound(): void {
  console.error(
    `${colors.symbols.error} ${colors.error('Configuration file not found.')} ${colors.dim('Run')} ${colors.code('archctl init')} ${colors.dim('to initialize.')}`
  );
}

export function displayUnknownSubcommand(subcommand: string | undefined): void {
  console.error(
    `${colors.symbols.error} ${colors.error('Unknown subcommand:')} ${colors.bold(subcommand || '(none)')}`
  );
  console.log(`\n${colors.bold('Available subcommands:')}`);
  console.log(
    `  ${colors.code('archctl rules list')}                    ${colors.dim('# List all rules')}`
  );
  console.log(
    `  ${colors.code('archctl rules add')}                     ${colors.dim('# Add a custom rule (interactive)')}`
  );
  console.log(
    `  ${colors.code('archctl rules remove --id <rule-id>')}   ${colors.dim('# Remove a rule')}`
  );
}
