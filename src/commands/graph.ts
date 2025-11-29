import * as path from 'path';
import type { ParsedArgs } from '../types';
import { findConfigFile, loadConfig } from '../infrastructure/config/configService';
import { messages } from '../messages';
import * as graphService from '../services/graphService';
import * as presenter from '../presentation/graphPresenter';

/**
 * Graph command - analyze project dependencies
 * Generates a graph analysis file in .archctl/
 */
export async function cmdGraph(args: ParsedArgs): Promise<void> {
  const configPath = findConfigFile();

  if (!configPath) {
    console.error(messages.common.noConfigFound);
    process.exit(1);
  }

  const config = loadConfig(configPath);
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
}
