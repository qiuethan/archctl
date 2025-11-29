import type { GraphAnalysisResult, GraphReport } from '../services/graphService';

/**
 * Display scanning progress
 */
export function displayScanningStart(): void {
  console.log('🔍 Scanning project files...');
}

/**
 * Display exclude information
 */
export function displayExcludeInfo(gitignoreCount: number, configCount: number): void {
  if (gitignoreCount > 0) {
    console.log(`📝 Found ${gitignoreCount} excludes from .gitignore`);
  }
  if (configCount > 0) {
    console.log(`⚙️  Found ${configCount} excludes from config`);
  }
}

/**
 * Display file scan results
 */
export function displayFileScanResults(fileCount: number): void {
  console.log(`📁 Found ${fileCount} source files`);
}

/**
 * Display graph building progress
 */
export function displayGraphBuildingStart(): void {
  console.log('🔨 Building dependency graph...');
}

/**
 * Display analysis complete
 */
export function displayAnalysisComplete(fileCount: number, edgeCount: number): void {
  console.log(`✅ Analyzed ${fileCount} files, found ${edgeCount} dependencies`);
}

/**
 * Display report saved
 */
export function displayReportSaved(outputPath: string): void {
  console.log(`\n📊 Graph analysis saved to: ${outputPath}`);
}

/**
 * Display summary
 */
export function displaySummary(result: GraphAnalysisResult): void {
  const { stats } = result;
  
  console.log('\nSummary:');
  console.log(`  Files analyzed: ${stats.fileCount}`);
  console.log(`  Dependencies: ${stats.edgeCount}`);
  console.log(`  Languages: ${Object.keys(stats.languageCounts).join(', ')}`);
  
  const layers = Object.keys(stats.layerCounts).filter(l => l !== 'unmapped');
  if (layers.length > 0) {
    console.log(`  Layers: ${layers.join(', ')}`);
  }
}

/**
 * Display complete graph analysis results
 */
export function displayGraphAnalysis(result: GraphAnalysisResult, outputPath: string): void {
  displayAnalysisComplete(result.stats.fileCount, result.stats.edgeCount);
  displayReportSaved(outputPath);
  displaySummary(result);
}
