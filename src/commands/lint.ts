import * as path from 'path';
import type { ParsedArgs } from '../types';
import * as configService from '../services/configService';
import * as graphService from '../services/graphService';
import * as ruleService from '../services/ruleService';
import { messages } from '../utils/messages';
import { colors, formatFilePath, formatCount } from '../utils/colors';

/**
 * Lint command - enforce architecture rules
 * Analyzes the codebase and checks for rule violations
 */
export async function cmdLint(_args: ParsedArgs): Promise<void> {
  let configPath: string;
  let config;
  const format = (_args.format as string) || 'text';
  const isJsonOutput = format === 'json';

  try {
    const result = configService.findAndLoadConfig();
    configPath = result.configPath;
    config = result.config;
  } catch (error) {
    if (!isJsonOutput) {
      console.error(messages.common.noConfigFound);
    }
    process.exit(1);
  }

  const projectRoot = path.dirname(path.dirname(configPath));

  if (!isJsonOutput) {
    console.log(`${colors.dim('Configuration:')} ${colors.path(configPath)}`);
    console.log(`${colors.dim('Project:')} ${colors.bold(config.name)}`);
    console.log(
      `${colors.info('Checking')} ${colors.bold(config.rules.length.toString())} ${colors.info('architecture rule(s)...')}\n`
    );

    // Build dependency graph
    console.log(`${colors.dim('Analyzing project dependencies...')}`);
  }

  const result = await graphService.analyzeProjectGraph({
    projectRoot,
    config,
  });

  const graphAnalysis = graphService.generateGraphReport(result.graph, result.stats, config.name);

  const fileCount = result.stats.fileCount;
  const edgeCount = result.stats.edgeCount;

  if (!isJsonOutput) {
    console.log(
      `${colors.success('Analyzed')} ${colors.bold(fileCount.toString())} ${colors.dim('file(s) with')} ${colors.bold(edgeCount.toString())} ${colors.dim('dependencies')}\n`
    );
  }

  // Load and instantiate rules
  const rules = ruleService.createRulesFromConfig(config.rules);

  // Build rule context from graph analysis
  const ruleContext = ruleService.buildRuleContext(graphAnalysis, config, projectRoot);

  // Check all rules
  const violations = ruleService.checkRules(rules, ruleContext);

  // JSON output format
  if (isJsonOutput) {
    const jsonOutput = violations.map((v) => ({
      ruleId: v.ruleId,
      message: v.message,
      filePath: v.file,
      severity: v.severity,
      range: v.range || {
        startLine: v.line || 1,
        startCol: 0,
        endLine: v.line || 1,
        endCol: 0,
      },
      suggestion: v.suggestion,
    }));
    console.log(JSON.stringify(jsonOutput, null, 2));
    process.exit(violations.some((v) => v.severity === 'error') ? 1 : 0);
  }

  // Display results
  if (violations.length === 0) {
    console.log(`${colors.symbols.check} ${colors.success.bold('No rule violations found!')}`);
    process.exit(0);
  }

  const summary = ruleService.getViolationSummary(violations);
  console.log(
    `\n${colors.symbols.warning} ${colors.warning.bold('Found')} ${colors.bold(summary.total.toString())} ${colors.warning.bold('violation(s):')}`
  );
  console.log(`   ${colors.dim('Errors:')} ${formatCount(summary.errors, true)}`);
  console.log(`   ${colors.dim('Warnings:')} ${formatCount(summary.warnings, true)}`);
  console.log(`   ${colors.dim('Info:')} ${formatCount(summary.info, true)}`);
  console.log(
    `   ${colors.dim('Files affected:')} ${colors.bold(summary.filesAffected.toString())}`
  );

  // Group by severity and display
  const grouped = ruleService.groupViolationsBySeverity(violations);

  if (grouped.errors.length > 0) {
    console.log(`\n${colors.severityError('Errors:')}`);
    grouped.errors.forEach((v) => {
      console.log(`   ${colors.symbols.error} ${formatFilePath(v.file)}`);
      console.log(`      ${colors.error(v.message)}`);
      if (v.suggestion) {
        console.log(`      ${colors.symbols.lightbulb} ${colors.dim(v.suggestion)}`);
      }
    });
  }

  if (grouped.warnings.length > 0) {
    console.log(`\n${colors.severityWarning('Warnings:')}`);
    grouped.warnings.forEach((v) => {
      console.log(`   ${colors.symbols.warning} ${formatFilePath(v.file)}`);
      console.log(`      ${colors.warning(v.message)}`);
      if (v.suggestion) {
        console.log(`      ${colors.symbols.lightbulb} ${colors.dim(v.suggestion)}`);
      }
    });
  }

  if (grouped.info.length > 0) {
    console.log(`\n${colors.severityInfo('Informational:')}`);
    grouped.info.forEach((v) => {
      console.log(`   ${colors.symbols.info} ${formatFilePath(v.file)}`);
      console.log(`      ${colors.info(v.message)}`);
    });
  }

  // Exit with error code if there are errors
  if (grouped.errors.length > 0) {
    console.log(`\n${colors.symbols.cross} ${colors.error.bold('Architecture validation failed')}`);
    process.exit(1);
  }

  console.log(`\n${colors.symbols.check} ${colors.success.bold('Architecture validation passed')}`);
  process.exit(0);
}
