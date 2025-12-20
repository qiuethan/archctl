import * as path from 'path';
import type { ParsedArgs } from '../types';
import type { RuleViolation } from '../types/rules';
import type { BaselineViolation } from '../types/baseline';
import * as configService from '../services/configService';
import * as graphService from '../services/graphService';
import * as ruleService from '../services/ruleService';
import * as htmlReportService from '../services/htmlReportService';
import { BaselineService } from '../infrastructure/baseline/baselineService';
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
  const isHtmlOutput = format === 'html';
  const outputFile = _args.output as string | undefined;
  const noCache = (_args['no-cache'] as boolean) || false;
  const updateBaseline = (_args['update-baseline'] as boolean) || false;
  const ratchet = (_args.ratchet as boolean) || false;

  // Debug: log the format flag
  if (process.env.DEBUG_ARCHCTL) {
    console.error('DEBUG: _args =', JSON.stringify(_args));
    console.error('DEBUG: format =', format);
    console.error('DEBUG: isJsonOutput =', isJsonOutput);
    console.error('DEBUG: noCache =', noCache);
  }

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

  const isSilent = isJsonOutput || isHtmlOutput;

  if (!isSilent) {
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
    useCache: !noCache,
  });

  const graphAnalysis = graphService.generateGraphReport(result.graph, result.stats, config.name);

  const fileCount = result.stats.fileCount;
  const edgeCount = result.stats.edgeCount;

  if (!isSilent) {
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

  // Update baseline if requested
  if (updateBaseline) {
    const baselineService = new BaselineService(projectRoot);
    baselineService.updateBaseline(violations);
    baselineService.save();

    if (!isSilent) {
      const baseline = baselineService.getBaseline();
      if (baseline) {
        console.log(
          `\n${colors.success('Baseline updated:')} ${colors.bold(baseline.violations.length.toString())} ${colors.dim('violation(s)')}`
        );
        console.log(
          `   ${colors.dim('Errors:')} ${formatCount(baseline.metrics.errors, true)}`
        );
        console.log(
          `   ${colors.dim('Warnings:')} ${formatCount(baseline.metrics.warnings, true)}`
        );
        console.log(
          `   ${colors.dim('Info:')} ${formatCount(baseline.metrics.info, true)}`
        );
        console.log(
          `   ${colors.dim('Files affected:')} ${colors.bold(baseline.metrics.filesAffected.toString())}`
        );
        console.log(
          `\n${colors.success('Baseline saved to:')} ${colors.path(path.join('.archctl', 'baseline.json'))}`
        );
      }
    }

    process.exit(0);
  }

  // Compare against baseline if it exists
  const baselineService = new BaselineService(projectRoot);
  let violationsToReport = violations;
  let comparisonResult: {
    new: RuleViolation[];
    resolved: BaselineViolation[];
    unchanged: RuleViolation[];
  } | null = null;

  if (baselineService.hasBaseline()) {
    comparisonResult = baselineService.compareViolations(violations);
    violationsToReport = comparisonResult.new;
  }

  // Calculate ratchet check once (reused in all exit points)
  const hasResolvedViolations = ratchet && comparisonResult && comparisonResult.resolved.length > 0;

  // HTML output format
  if (isHtmlOutput) {
    const htmlOutput = htmlReportService.generateHtmlReport({
      graphReport: graphAnalysis,
      violations: violationsToReport,
      options: {
        title: `Architecture Report - ${config.name}`,
        includeGraph: true,
        includeViolations: true,
      },
    });

    const defaultOutputPath = path.join(projectRoot, 'archctl-report.html');
    const htmlOutputPath = outputFile || defaultOutputPath;

    htmlReportService.saveHtmlReport(htmlOutput, htmlOutputPath);
    console.log(`\n${colors.success('HTML report generated:')} ${colors.path(htmlOutputPath)}`);
    const hasNewViolations = violationsToReport.some((v) => v.severity === 'error');
    process.exit(hasNewViolations || hasResolvedViolations ? 1 : 0);
  }

  // JSON output format
  if (isJsonOutput) {
    const jsonOutput = violationsToReport.map((v) => ({
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
    const hasNewViolations = violationsToReport.some((v) => v.severity === 'error');
    process.exit(hasNewViolations || hasResolvedViolations ? 1 : 0);
  }

  // Display baseline comparison summary if baseline exists
  if (comparisonResult) {
    if (!isSilent) {
      console.log(
        `\n${colors.dim('Baseline comparison:')}`
      );
      console.log(
        `   ${colors.dim('New violations:')} ${formatCount(comparisonResult.new.length, true)}`
      );
      console.log(
        `   ${colors.dim('Resolved violations:')} ${formatCount(comparisonResult.resolved.length, true)}`
      );
      console.log(
        `   ${colors.dim('Unchanged violations:')} ${formatCount(comparisonResult.unchanged.length, true)}`
      );
      console.log('');
    }

    // Ratchet check: warn/fail if violations were resolved
    if (ratchet && comparisonResult.resolved.length > 0) {
      if (!isSilent) {
        console.log(
          `\n${colors.symbols.warning} ${colors.warning('Ratchet:')} ${colors.bold(comparisonResult.resolved.length.toString())} ${colors.warning('violation(s) resolved!')}`
        );
        console.log(
          `   ${colors.dim('Update baseline to lock in improvements:')}`
        );
        console.log(
          `   ${colors.info('archctl lint --update-baseline')}`
        );
      }
    }
  }

  // Display results
  if (violationsToReport.length === 0) {
    if (comparisonResult && comparisonResult.resolved.length > 0) {
      console.log(
        `${colors.symbols.check} ${colors.success.bold('No new violations!')} ${colors.dim(`(${comparisonResult.resolved.length} resolved)`)}`
      );
    } else {
      console.log(`${colors.symbols.check} ${colors.success.bold('No rule violations found!')}`);
    }
    // Check ratchet: fail if resolved violations exist
    process.exit(hasResolvedViolations ? 1 : 0);
  }

  const summary = ruleService.getViolationSummary(violationsToReport);
  if (comparisonResult) {
    console.log(
      `\n${colors.symbols.warning} ${colors.warning.bold('Found')} ${colors.bold(summary.total.toString())} ${colors.warning.bold('new violation(s):')}`
    );
  } else {
    console.log(
      `\n${colors.symbols.warning} ${colors.warning.bold('Found')} ${colors.bold(summary.total.toString())} ${colors.warning.bold('violation(s):')}`
    );
  }
  console.log(`   ${colors.dim('Errors:')} ${formatCount(summary.errors, true)}`);
  console.log(`   ${colors.dim('Warnings:')} ${formatCount(summary.warnings, true)}`);
  console.log(`   ${colors.dim('Info:')} ${formatCount(summary.info, true)}`);
  console.log(
    `   ${colors.dim('Files affected:')} ${colors.bold(summary.filesAffected.toString())}`
  );

  // Group by severity and display
  const grouped = ruleService.groupViolationsBySeverity(violationsToReport);

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

  // Exit with error code if there are errors or ratchet violations
  const hasNewViolations = grouped.errors.length > 0;

  if (hasNewViolations || hasResolvedViolations) {
    console.log(`\n${colors.symbols.cross} ${colors.error.bold('Architecture validation failed')}`);
    process.exit(1);
  }

  console.log(`\n${colors.symbols.check} ${colors.success.bold('Architecture validation passed')}`);
  process.exit(0);
}
