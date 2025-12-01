/**
 * Service for generating interactive HTML reports
 */

import * as fs from 'fs';
import type { GraphReport } from './graphService';
import type { RuleViolation } from '../types/rules';

export interface HtmlReportOptions {
  title?: string;
  includeGraph?: boolean;
  includeViolations?: boolean;
}

export interface HtmlReportData {
  graphReport: GraphReport;
  violations?: RuleViolation[];
  options?: HtmlReportOptions;
}

/**
 * Generate an interactive HTML report
 */
export function generateHtmlReport(data: HtmlReportData): string {
  const { graphReport, violations = [], options = {} } = data;
  const title = options.title || `Architecture Report - ${graphReport.project}`;

  const violationSummary = getViolationSummary(violations);
  const layerData = prepareLayerData(graphReport);
  const graphData = prepareGraphData(graphReport);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    ${getStyles()}
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="header-content">
        <h1>${escapeHtml(title)}</h1>
        <div class="meta">
          <span class="meta-item">Generated: ${new Date(graphReport.generatedAt).toLocaleString()}</span>
        </div>
      </div>
    </header>

    <nav class="tabs">
      <button class="tab-btn active" data-tab="overview">Overview</button>
      <button class="tab-btn" data-tab="violations">Violations (${violations.length})</button>
      <button class="tab-btn" data-tab="dependencies">Dependencies</button>
      <button class="tab-btn" data-tab="layers">Layers</button>
      <button class="tab-btn" data-tab="graph">Graph</button>
    </nav>

    <main class="content">
      ${generateOverviewTab(graphReport, violationSummary)}
      ${generateViolationsTab(violations, violationSummary)}
      ${generateDependenciesTab(graphReport)}
      ${generateLayersTab(layerData)}
      ${generateGraphTab(graphData)}
    </main>
  </div>

  <script>
    ${getScripts(graphData)}
  </script>
</body>
</html>`;
}

/**
 * Save HTML report to file
 */
export function saveHtmlReport(html: string, outputPath: string): void {
  fs.writeFileSync(outputPath, html, 'utf-8');
}

/**
 * Get violation summary statistics
 */
function getViolationSummary(violations: RuleViolation[]) {
  const summary = {
    total: violations.length,
    errors: violations.filter((v) => v.severity === 'error').length,
    warnings: violations.filter((v) => v.severity === 'warning').length,
    info: violations.filter((v) => v.severity === 'info').length,
    filesAffected: new Set(violations.map((v) => v.file)).size,
    byRule: {} as Record<string, number>,
  };

  violations.forEach((v) => {
    summary.byRule[v.ruleId] = (summary.byRule[v.ruleId] || 0) + 1;
  });

  return summary;
}

/**
 * Prepare layer data for visualization
 */
function prepareLayerData(report: GraphReport) {
  const layers = Object.entries(report.summary.layers)
    .filter(([name]) => name !== 'unmapped')
    .map(([name, count]) => ({ name, count }));

  const interactions = report.layerInteractions;

  return { layers, interactions };
}

/**
 * Prepare graph data for visualization
 */
function prepareGraphData(report: GraphReport) {
  const nodes = Object.entries(report.graph.files).map(([id, file]) => ({
    id,
    label: id.split('/').pop() || id,
    layer: file.layer || 'unmapped',
    language: file.language || 'unknown',
  }));

  const edges = report.graph.edges.map((edge) => ({
    from: edge.from,
    to: edge.to,
    kind: edge.kind,
  }));

  return { nodes, edges };
}

/**
 * Generate overview tab content
 */
function generateOverviewTab(
  report: GraphReport,
  violationSummary: ReturnType<typeof getViolationSummary>
): string {
  const healthScore = calculateHealthScore(report, violationSummary);
  const healthClass = healthScore >= 80 ? 'good' : healthScore >= 60 ? 'warning' : 'error';

  return `
    <div class="tab-content active" id="overview">
      <div class="cards">
        <div class="card health-card ${healthClass}">
          <h3>Architecture Health</h3>
          <div class="health-score">${healthScore}%</div>
          <p class="health-label">${getHealthLabel(healthScore)}</p>
        </div>

        <div class="card">
          <h3>Files</h3>
          <div class="stat-value">${report.summary.totalFiles}</div>
          <p class="stat-label">Total source files</p>
        </div>

        <div class="card">
          <h3>Dependencies</h3>
          <div class="stat-value">${report.summary.totalDependencies}</div>
          <p class="stat-label">Avg: ${report.summary.averageDependenciesPerFile} per file</p>
        </div>

        <div class="card ${violationSummary.errors > 0 ? 'error' : violationSummary.warnings > 0 ? 'warning' : 'good'}">
          <h3>Violations</h3>
          <div class="stat-value">${violationSummary.total}</div>
          <p class="stat-label">${violationSummary.errors} errors, ${violationSummary.warnings} warnings</p>
        </div>
      </div>

      <div class="section">
        <h2>Languages</h2>
        <div class="chart-container">
          ${generateBarChart(report.summary.languages, 'Files')}
        </div>
      </div>

      <div class="section">
        <h2>Layers Distribution</h2>
        <div class="chart-container">
          ${generateBarChart(report.summary.layers, 'Files')}
        </div>
      </div>

      <div class="grid-2">
        <div class="section">
          <h2>Top Dependencies</h2>
          <p class="section-desc">Files with most outgoing dependencies</p>
          <div class="list">
            ${report.topDependencies
              .slice(0, 10)
              .map(
                (item) => `
              <div class="list-item">
                <div class="list-item-main">
                  <code class="file-path">${escapeHtml(item.file)}</code>
                  <span class="badge badge-${item.layer}">${escapeHtml(item.layer)}</span>
                </div>
                <span class="list-item-count">${item.dependencies}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="section">
          <h2>Most Imported</h2>
          <p class="section-desc">Files with most incoming dependencies</p>
          <div class="list">
            ${report.topDependents
              .slice(0, 10)
              .map(
                (item) => `
              <div class="list-item">
                <div class="list-item-main">
                  <code class="file-path">${escapeHtml(item.file)}</code>
                  <span class="badge badge-${item.layer}">${escapeHtml(item.layer)}</span>
                </div>
                <span class="list-item-count">${item.dependents}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate violations tab content
 */
function generateViolationsTab(
  violations: RuleViolation[],
  summary: ReturnType<typeof getViolationSummary>
): string {
  const groupedByRule = violations.reduce(
    (acc, v) => {
      if (!acc[v.ruleId]) acc[v.ruleId] = [];
      acc[v.ruleId]!.push(v);
      return acc;
    },
    {} as Record<string, RuleViolation[]>
  );

  return `
    <div class="tab-content" id="violations">
      ${
        violations.length === 0
          ? `
        <div class="empty-state">
          <div class="empty-icon">✓</div>
          <h3>No Violations Found</h3>
          <p>Your architecture is clean and follows all defined rules!</p>
        </div>
      `
          : `
        <div class="section">
          <div class="violation-summary">
            <div class="summary-item error">
              <span class="summary-count">${summary.errors}</span>
              <span class="summary-label">Errors</span>
            </div>
            <div class="summary-item warning">
              <span class="summary-count">${summary.warnings}</span>
              <span class="summary-label">Warnings</span>
            </div>
            <div class="summary-item info">
              <span class="summary-count">${summary.info}</span>
              <span class="summary-label">Info</span>
            </div>
            <div class="summary-item">
              <span class="summary-count">${summary.filesAffected}</span>
              <span class="summary-label">Files Affected</span>
            </div>
          </div>
        </div>

        ${Object.entries(groupedByRule)
          .map(
            ([ruleId, ruleViolations]) => `
          <div class="section">
            <h3 class="rule-title">
              <span class="badge badge-${ruleViolations[0]!.severity}">${ruleViolations[0]!.severity}</span>
              ${escapeHtml(ruleId)}
              <span class="count-badge">${ruleViolations.length}</span>
            </h3>
            <div class="violations-list">
              ${ruleViolations
                .map(
                  (v) => `
                <div class="violation-item ${v.severity}">
                  <div class="violation-header">
                    <code class="file-path">${escapeHtml(v.file)}</code>
                    ${v.line ? `<span class="line-number">Line ${v.line}</span>` : ''}
                  </div>
                  <div class="violation-message">${escapeHtml(v.message)}</div>
                  ${
                    v.suggestion
                      ? `
                    <div class="violation-suggestion">
                      <span class="suggestion-icon">💡</span>
                      ${escapeHtml(v.suggestion)}
                    </div>
                  `
                      : ''
                  }
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
          )
          .join('')}
      `
      }
    </div>
  `;
}

/**
 * Generate dependencies tab content
 */
function generateDependenciesTab(report: GraphReport): string {
  return `
    <div class="tab-content" id="dependencies">
      <div class="grid-2">
        <div class="section">
          <h2>Files with Most Dependencies</h2>
          <p class="section-desc">Files that import many other files</p>
          <div class="list">
            ${report.topDependencies
              .slice(0, 20)
              .map(
                (item, index) => `
              <div class="list-item">
                <span class="list-rank">#${index + 1}</span>
                <div class="list-item-main">
                  <code class="file-path">${escapeHtml(item.file)}</code>
                  <span class="badge badge-${item.layer}">${escapeHtml(item.layer)}</span>
                </div>
                <span class="list-item-count">${item.dependencies}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="section">
          <h2>Most Imported Files</h2>
          <p class="section-desc">Files that are imported by many others</p>
          <div class="list">
            ${report.topDependents
              .slice(0, 20)
              .map(
                (item, index) => `
              <div class="list-item">
                <span class="list-rank">#${index + 1}</span>
                <div class="list-item-main">
                  <code class="file-path">${escapeHtml(item.file)}</code>
                  <span class="badge badge-${item.layer}">${escapeHtml(item.layer)}</span>
                </div>
                <span class="list-item-count">${item.dependents}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate layers tab content
 */
function generateLayersTab(layerData: ReturnType<typeof prepareLayerData>): string {
  const { layers, interactions } = layerData;

  return `
    <div class="tab-content" id="layers">
      <div class="section">
        <h2>Layer Distribution</h2>
        <div class="chart-container">
          ${generateBarChart(Object.fromEntries(layers.map((l) => [l.name, l.count])), 'Files')}
        </div>
      </div>

      <div class="section">
        <h2>Layer Interactions</h2>
        <p class="section-desc">How layers depend on each other</p>
        <div class="interaction-matrix">
          <table class="matrix-table">
            <thead>
              <tr>
                <th>From \ To</th>
                ${layers.map((l) => `<th>${escapeHtml(l.name)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${layers
                .map(
                  (fromLayer) => `
                <tr>
                  <th>${escapeHtml(fromLayer.name)}</th>
                  ${layers
                    .map((toLayer) => {
                      const count = interactions[fromLayer.name]?.[toLayer.name] || 0;
                      const intensity = count > 0 ? Math.min(Math.log10(count + 1) / 2, 1) : 0;
                      return `<td class="matrix-cell" style="background-color: rgba(59, 130, 246, ${intensity})" title="${count} dependencies">${count > 0 ? count : ''}</td>`;
                    })
                    .join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate graph tab content
 */
function generateGraphTab(graphData: ReturnType<typeof prepareGraphData>): string {
  return `
    <div class="tab-content" id="graph">
      <div class="section">
        <h2>Dependency Graph</h2>
        <p class="section-desc">Interactive visualization of file dependencies</p>
        <div class="graph-controls">
          <label>
            <input type="checkbox" id="showLabels" checked> Show labels
          </label>
          <label>
            Filter by layer:
            <select id="layerFilter">
              <option value="">All layers</option>
            </select>
          </label>
          <button id="resetZoom">Reset Zoom</button>
        </div>
        <div id="graph-container" class="graph-container"></div>
      </div>
    </div>
  `;
}

/**
 * Generate a simple bar chart
 */
function generateBarChart(data: Record<string, number>, _label: string): string {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const maxValue = Math.max(...entries.map(([, v]) => v));

  return `
    <div class="bar-chart">
      ${entries
        .map(([key, value]) => {
          const percentage = (value / maxValue) * 100;
          return `
          <div class="bar-row">
            <div class="bar-label">${escapeHtml(key)}</div>
            <div class="bar-container">
              <div class="bar" style="width: ${percentage}%"></div>
              <span class="bar-value">${value}</span>
            </div>
          </div>
        `;
        })
        .join('')}
    </div>
  `;
}

/**
 * Calculate architecture health score
 */
function calculateHealthScore(
  report: GraphReport,
  violationSummary: ReturnType<typeof getViolationSummary>
): number {
  let score = 100;

  // Deduct for violations
  score -= violationSummary.errors * 5;
  score -= violationSummary.warnings * 2;
  score -= violationSummary.info * 0.5;

  // Deduct for high coupling
  const avgDeps = parseFloat(report.summary.averageDependenciesPerFile);
  if (avgDeps > 10) score -= (avgDeps - 10) * 2;

  // Deduct for unmapped files
  const unmappedCount = report.summary.layers.unmapped || 0;
  const unmappedRatio = unmappedCount / report.summary.totalFiles;
  score -= unmappedRatio * 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get health label based on score
 */
function getHealthLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  if (score >= 60) return 'Needs Improvement';
  return 'Critical';
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

/**
 * Get CSS styles for the report
 */
function getStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .header-content h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .meta {
      display: flex;
      gap: 1.5rem;
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .tabs {
      background: white;
      border-bottom: 2px solid #e2e8f0;
      display: flex;
      gap: 0.5rem;
      padding: 0 2rem;
      overflow-x: auto;
    }

    .tab-btn {
      background: none;
      border: none;
      padding: 1rem 1.5rem;
      font-size: 0.95rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: #475569;
      background: #f8fafc;
    }

    .tab-btn.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }

    .content {
      padding: 2rem;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .card {
      background: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #e2e8f0;
    }

    .card.good {
      border-left-color: #10b981;
    }

    .card.warning {
      border-left-color: #f59e0b;
    }

    .card.error {
      border-left-color: #ef4444;
    }

    .card h3 {
      font-size: 0.9rem;
      color: #64748b;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value, .health-score {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0.5rem 0;
    }

    .health-card.good .health-score {
      color: #10b981;
    }

    .health-card.warning .health-score {
      color: #f59e0b;
    }

    .health-card.error .health-score {
      color: #ef4444;
    }

    .stat-label, .health-label {
      font-size: 0.9rem;
      color: #64748b;
    }

    .section {
      background: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 1.5rem;
    }

    .section h2 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
      color: #1e293b;
    }

    .section-desc {
      color: #64748b;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 1.5rem;
    }

    .list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .list-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 0.375rem;
      transition: background 0.2s;
    }

    .list-item:hover {
      background: #f1f5f9;
    }

    .list-rank {
      font-weight: 600;
      color: #94a3b8;
      min-width: 2rem;
    }

    .list-item-main {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .list-item-count {
      font-weight: 600;
      color: #667eea;
      min-width: 2rem;
      text-align: right;
    }

    .file-path {
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 0.85rem;
      color: #475569;
      background: #e2e8f0;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
    }

    .badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .badge-domain {
      background: #dbeafe;
      color: #1e40af;
    }

    .badge-application {
      background: #d1fae5;
      color: #065f46;
    }

    .badge-infrastructure {
      background: #fef3c7;
      color: #92400e;
    }

    .badge-presentation {
      background: #fce7f3;
      color: #9f1239;
    }

    .badge-shared {
      background: #e0e7ff;
      color: #3730a3;
    }

    .badge-unmapped {
      background: #f1f5f9;
      color: #64748b;
    }

    .badge-error {
      background: #fee2e2;
      color: #991b1b;
    }

    .badge-warning {
      background: #fef3c7;
      color: #92400e;
    }

    .badge-info {
      background: #dbeafe;
      color: #1e40af;
    }

    .count-badge {
      display: inline-block;
      background: #e2e8f0;
      color: #475569;
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .chart-container {
      margin-top: 1rem;
    }

    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .bar-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .bar-label {
      min-width: 120px;
      font-weight: 500;
      color: #475569;
    }

    .bar-container {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .bar {
      height: 2rem;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 0.25rem;
      transition: width 0.3s ease;
    }

    .bar-value {
      font-weight: 600;
      color: #475569;
      min-width: 3rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #64748b;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      color: #10b981;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: #1e293b;
    }

    .violation-summary {
      display: flex;
      gap: 2rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      justify-content: center;
    }

    .summary-item {
      text-align: center;
    }

    .summary-count {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
    }

    .summary-item.error .summary-count {
      color: #ef4444;
    }

    .summary-item.warning .summary-count {
      color: #f59e0b;
    }

    .summary-item.info .summary-count {
      color: #3b82f6;
    }

    .summary-label {
      display: block;
      font-size: 0.85rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .rule-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }

    .violations-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .violation-item {
      padding: 1rem;
      border-left: 4px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 0.375rem;
    }

    .violation-item.error {
      border-left-color: #ef4444;
      background: #fef2f2;
    }

    .violation-item.warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }

    .violation-item.info {
      border-left-color: #3b82f6;
      background: #eff6ff;
    }

    .violation-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .line-number {
      font-size: 0.85rem;
      color: #64748b;
    }

    .violation-message {
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .violation-suggestion {
      display: flex;
      align-items: start;
      gap: 0.5rem;
      padding: 0.75rem;
      background: white;
      border-radius: 0.25rem;
      font-size: 0.9rem;
      color: #475569;
    }

    .suggestion-icon {
      flex-shrink: 0;
    }

    .interaction-matrix {
      overflow-x: auto;
    }

    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    .matrix-table th,
    .matrix-table td {
      padding: 0.75rem;
      text-align: center;
      border: 1px solid #e2e8f0;
    }

    .matrix-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
    }

    .matrix-cell {
      font-weight: 600;
      color: #1e293b;
      cursor: help;
    }

    .graph-container {
      width: 100%;
      height: 600px;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      background: #fafafa;
      margin-top: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
    }

    .graph-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      flex-wrap: wrap;
    }

    .graph-controls label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #475569;
    }

    .graph-controls select,
    .graph-controls button {
      padding: 0.375rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.25rem;
      background: white;
      color: #475569;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .graph-controls button:hover {
      background: #f8fafc;
    }

    @media (max-width: 768px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }

      .header-content h1 {
        font-size: 1.5rem;
      }

      .cards {
        grid-template-columns: 1fr;
      }
    }
  `;
}

/**
 * Get JavaScript code for interactivity
 */
function getScripts(graphData: ReturnType<typeof prepareGraphData>): string {
  return `
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');
      });
    });

    // Graph data
    const graphData = ${JSON.stringify(graphData)};

    // Simple graph visualization (placeholder - can be enhanced with a library like D3.js or vis.js)
    const graphContainer = document.getElementById('graph-container');
    if (graphContainer && graphData.nodes.length > 0) {
      graphContainer.innerHTML = '<p>Interactive graph visualization</p><p style="font-size: 0.9rem; margin-top: 0.5rem;">Nodes: ' + graphData.nodes.length + ' | Edges: ' + graphData.edges.length + '</p><p style="font-size: 0.85rem; color: #94a3b8; margin-top: 1rem;">Full interactive graph with zoom/pan can be added using libraries like D3.js or vis.js</p>';
    }

    // Layer filter
    const layerFilter = document.getElementById('layerFilter');
    if (layerFilter) {
      const layers = [...new Set(graphData.nodes.map(n => n.layer))];
      layers.forEach(layer => {
        const option = document.createElement('option');
        option.value = layer;
        option.textContent = layer;
        layerFilter.appendChild(option);
      });
    }

    console.log('Archctl HTML Report loaded');
    console.log('Graph data:', graphData);
  `;
}
