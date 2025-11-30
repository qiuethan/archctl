import * as path from 'path';
import type { ParsedArgs } from '../types';
import { messages } from '../utils/messages';
import * as configService from '../services/configService';
import * as graphService from '../services/graphService';
import * as ruleService from '../services/ruleService';
import * as presenter from '../presentation/graphPresenter';

/**
 * Graph command - analyze project dependencies
 * Generates a graph analysis file in .archctl/
 */
export async function cmdGraph(args: ParsedArgs): Promise<void> {
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

  const projectRoot = path.dirname(path.dirname(configPath)); // Go up from .archctl/archctl.config.json

  // Presentation: Display scanning start
  presenter.displayScanningStart();

  // Service: Analyze project graph
  const result = await graphService.analyzeProjectGraph({
    projectRoot,
    config,
  });

  // Presentation: Display exclude info
  presenter.displayExcludeInfo(
    result.excludeInfo.gitignoreCount,
    result.excludeInfo.configCount
  );

  // Presentation: Display file scan results
  presenter.displayFileScanResults(result.files.length);

  // Presentation: Display graph building
  presenter.displayGraphBuildingStart();

  // Service: Generate report
  const report = graphService.generateGraphReport(
    result.graph,
    result.stats,
    config.name
  );

  // Service: Save report
  const archctlDir = path.dirname(configPath);
  const outputPath = path.join(archctlDir, 'graph-analysis.json');
  graphService.saveGraphReport(report, outputPath);

  // Presentation: Display results
  presenter.displayGraphAnalysis(result, outputPath);

  // Check rules if any are configured
  if (config.rules && config.rules.length > 0) {
    console.log('\n🔍 Checking architecture rules...');
    
    // Load and instantiate rules
    const rules = ruleService.createRulesFromConfig(config.rules);
    console.log(`📋 Loaded ${rules.length} rules`);
    
    // Build rule context from graph analysis
    const ruleContext = ruleService.buildRuleContext(report, config, projectRoot);
    
    // Check all rules
    const violations = ruleService.checkRules(rules, ruleContext);
    
    // Display results
    if (violations.length === 0) {
      console.log('✅ No rule violations found!');
    } else {
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
        grouped.errors.slice(0, 10).forEach(v => {
          console.log(`   ${v.file}`);
          console.log(`      ${v.message}`);
          if (v.suggestion) {
            console.log(`      💡 ${v.suggestion}`);
          }
        });
        if (grouped.errors.length > 10) {
          console.log(`   ... and ${grouped.errors.length - 10} more errors`);
        }
      }
      
      if (grouped.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        grouped.warnings.slice(0, 5).forEach(v => {
          console.log(`   ${v.file}`);
          console.log(`      ${v.message}`);
        });
        if (grouped.warnings.length > 5) {
          console.log(`   ... and ${grouped.warnings.length - 5} more warnings`);
        }
      }
    }
  }
}
