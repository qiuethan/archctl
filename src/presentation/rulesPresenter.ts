import type { RuleConfig } from '../types/config';

/**
 * Presentation layer for rules command
 */

export function displayRuleAdded(rule: RuleConfig, configPath: string): void {
  console.log(`\n✓ Added rule "${rule.title}"`);
  console.log(`  ID: ${rule.id}`);
  console.log(`  Type: ${rule.kind}`);
  console.log(`✓ Config saved to: ${configPath}`);
  console.log('\n💡 Run `archctl lint` to check your new rule');
}

export function displayRuleRemoved(ruleId: string, configPath: string): void {
  console.log(`\n✓ Removed rule "${ruleId}"`);
  console.log(`✓ Configuration saved to: ${configPath}`);
}

export function displayRulesList(rules: RuleConfig[]): void {
  if (rules.length === 0) {
    console.log('\nNo rules defined yet.');
    console.log('Use `archctl rules add` to add a rule.');
    return;
  }

  console.log(`\nDefined Rules (${rules.length}):\n`);

  for (const rule of rules) {
    console.log(`  [${rule.id}]`);
    console.log(`    Type: ${rule.kind}`);
    console.log(`    Title: ${rule.title}`);
    console.log(`    Description: ${rule.description}`);
    console.log();
  }
}

export function displayConfigNotFound(): void {
  console.error('Configuration file not found. Run `archctl init` to initialize.');
}

export function displayUnknownSubcommand(subcommand: string | undefined): void {
  console.error(`Unknown subcommand: ${subcommand || '(none)'}`);
  console.log('\nAvailable subcommands:');
  console.log('  archctl rules list                    # List all rules');
  console.log('  archctl rules add                     # Add a custom rule (interactive)');
  console.log('  archctl rules remove --id <rule-id>   # Remove a rule');
}
