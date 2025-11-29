import * as path from 'path';
import type { ParsedArgs } from '../types';
import { messages } from '../utils/messages';
import * as configService from '../services/configService';
import * as graphService from '../services/graphService';
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
}
