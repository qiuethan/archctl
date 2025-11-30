import * as path from 'path';
import type { ParsedArgs } from '../types';
import * as configService from '../services/configService';
import * as graphService from '../services/graphService';
import * as ruleService from '../services/ruleService';
import { messages } from '../utils/messages';

/**
 * Lint command - enforce architecture rules
 * Analyzes the codebase and checks for rule violations
 */
export async function cmdLint(args: ParsedArgs): Promise<void> {
  let configPath: string;
  let config;
  
  try {
    const result = configService.findAndLoadConfig();
    configPath = result.configPath;
    config = result.config;
  } catch (error) {
    console.error(messages.common.noConfigFound);
    process.exit(1);
  }

  const projectRoot = path.dirname(path.dirname(configPath));

  console.log(`📋 Found config: ${configPath}`);
  console.log(`📦 Project: ${config.name}`);
  console.log(`🔍 Checking ${config.rules.length} rules...\n`);

  // Build dependency graph
  console.log('🔨 Building dependency graph...');
  const result = await graphService.analyzeProjectGraph({
    projectRoot,
    config,
  });
  
  const graphAnalysis = graphService.generateGraphReport(
    result.graph,
    result.stats,
    config.name
  );
  
  console.log(`✅ Analyzed ${result.stats.fileCount} files, ${result.stats.edgeCount} dependencies\n`);

  // Load and instantiate rules
  const rules = ruleService.createRulesFromConfig(config.rules);
  
  // Build rule context from graph analysis
  const ruleContext = ruleService.buildRuleContext(graphAnalysis, config, projectRoot);
  
  // Check all rules
  const violations = ruleService.checkRules(rules, ruleContext);
  
  // Display results
  if (violations.length === 0) {
    console.log('✅ No rule violations found!');
    process.exit(0);
  }

  const summary = ruleService.getViolationSummary(violations);
  console.log(`\n⚠️  Found ${summary.total} violation(s):`);
  console.log(`   Errors: ${summary.errors}`);
  console.log(`   Warnings: ${summary.warnings}`);
  console.log(`   Info: ${summary.info}`);
  console.log(`   Files affected: ${summary.filesAffected}`);
  
  // Group by severity and display
  const grouped = ruleService.groupViolationsBySeverity(violations);
  
  if (grouped.errors.length > 0) {
    console.log('\n❌ Errors:');
    grouped.errors.forEach(v => {
      console.log(`   ${v.file}`);
      console.log(`      ${v.message}`);
      if (v.suggestion) {
        console.log(`      💡 ${v.suggestion}`);
      }
    });
  }
  
  if (grouped.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    grouped.warnings.forEach(v => {
      console.log(`   ${v.file}`);
      console.log(`      ${v.message}`);
      if (v.suggestion) {
        console.log(`      💡 ${v.suggestion}`);
      }
    });
  }

  if (grouped.info.length > 0) {
    console.log('\nℹ️  Info:');
    grouped.info.forEach(v => {
      console.log(`   ${v.file}`);
      console.log(`      ${v.message}`);
    });
  }

  // Exit with error code if there are errors
  if (grouped.errors.length > 0) {
    console.log('\n❌ Linting failed due to errors');
    process.exit(1);
  }
  
  console.log('\n✅ Linting passed (warnings only)');
  process.exit(0);
}
