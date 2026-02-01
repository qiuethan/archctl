/**
 * Service for generating interactive HTML reports
 */

import * as fs from 'fs';
import type { GraphReport } from './graphService';
import type { RuleViolation } from '../types/rules';
import type { Baseline, BaselineMetrics } from '../types/baseline';

export interface HtmlReportOptions {
  title?: string;
  includeGraph?: boolean;
  includeViolations?: boolean;
}

export interface HtmlReportData {
  graphReport: GraphReport;
  violations?: RuleViolation[];
  options?: HtmlReportOptions;
  trends?: {
    metricsHistory: BaselineMetrics[];
    baseline: Baseline;
  };
}

/**
 * Generate an interactive HTML report
 */
export function generateHtmlReport(data: HtmlReportData): string {
  const { graphReport, violations = [], options = {}, trends } = data;
  const title = options.title || `Architecture Report - ${graphReport.project}`;

  const violationSummary = getViolationSummary(violations);
  const layerData = prepareLayerData(graphReport);
  const graphData = prepareGraphData(graphReport);
  const hasTrends = trends && trends.metricsHistory && trends.metricsHistory.length > 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    ${getStyles()}
  </style>
  ${hasTrends ? '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>' : ''}
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
      ${hasTrends ? '<button class="tab-btn" data-tab="trends">Trends</button>' : ''}
      <button class="tab-btn" data-tab="dependencies">Dependencies</button>
      <button class="tab-btn" data-tab="layers">Layers</button>
      <button class="tab-btn" data-tab="graph">Graph</button>
    </nav>

    <main class="content">
      ${generateOverviewTab(graphReport, violationSummary)}
      ${generateViolationsTab(violations, violationSummary)}
      ${hasTrends ? generateTrendsTab(trends!) : ''}
      ${generateDependenciesTab(graphReport)}
      ${generateLayersTab(layerData)}
      ${generateGraphTab(graphData)}
    </main>
  </div>

  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script>
    ${getScripts(graphData, trends)}
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
    source: edge.from,
    target: edge.to,
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
                <th>From \\ To</th>
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
                      return `<td class="matrix-cell" style="background-color: rgba(0, 0, 0, ${intensity})" title="${count} dependencies">${count > 0 ? count : ''}</td>`;
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
 * Generate trends tab content
 */
function generateTrendsTab(trends: {
  metricsHistory: BaselineMetrics[];
  baseline: Baseline;
}): string {
  const { metricsHistory, baseline } = trends;
  const allMetrics = [...metricsHistory, baseline.metrics];

  // Prepare data for charts
  const labels = allMetrics.map((_, i) => `Update ${i + 1}`);
  const totalViolations = allMetrics.map((m) => m.totalViolations);
  const errors = allMetrics.map((m) => m.errors);
  const warnings = allMetrics.map((m) => m.warnings);
  const info = allMetrics.map((m) => m.info);
  const filesAffected = allMetrics.map((m) => m.filesAffected);
  const couplingScores = allMetrics.map((m) => m.couplingScore ?? null).filter((v) => v !== null);
  const violationDensities = allMetrics
    .map((m) => m.violationDensity ?? null)
    .filter((v) => v !== null);
  const healthScores = allMetrics.map((m) => m.healthScore ?? null).filter((v) => v !== null);

  const hasCouplingScore = couplingScores.length > 0;
  const hasViolationDensity = violationDensities.length > 0;
  const hasHealthScore = healthScores.length > 0;

  return `
    <div class="tab-content" id="trends">
      <div class="section">
        <h2>Metrics Trends</h2>
        <p class="section-desc">Track architecture health over time (last ${allMetrics.length} updates)</p>
      </div>

      <div class="grid-2">
        <div class="section">
          <h3>Total Violations</h3>
          <canvas id="chart-total-violations" class="trend-chart"></canvas>
        </div>

        <div class="section">
          <h3>Violations by Severity</h3>
          <canvas id="chart-severity" class="trend-chart"></canvas>
        </div>

        <div class="section">
          <h3>Files Affected</h3>
          <canvas id="chart-files-affected" class="trend-chart"></canvas>
        </div>

        ${
          hasHealthScore
            ? `
        <div class="section">
          <h3>Health Score</h3>
          <canvas id="chart-health-score" class="trend-chart"></canvas>
        </div>
        `
            : ''
        }

        ${
          hasCouplingScore
            ? `
        <div class="section">
          <h3>Coupling Score</h3>
          <canvas id="chart-coupling-score" class="trend-chart"></canvas>
        </div>
        `
            : ''
        }

        ${
          hasViolationDensity
            ? `
        <div class="section">
          <h3>Violation Density</h3>
          <canvas id="chart-violation-density" class="trend-chart"></canvas>
        </div>
        `
            : ''
        }
      </div>

      <div class="section">
        <h2>Metrics History Table</h2>
        <div class="table-container">
          <table class="metrics-table">
            <thead>
              <tr>
                <th>Update</th>
                <th>Total</th>
                <th>Errors</th>
                <th>Warnings</th>
                <th>Info</th>
                <th>Files</th>
                ${hasHealthScore ? '<th>Health</th>' : ''}
                ${hasCouplingScore ? '<th>Coupling</th>' : ''}
                ${hasViolationDensity ? '<th>Density</th>' : ''}
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${allMetrics
                .map((m, i) => {
                  const prev = i > 0 ? allMetrics[i - 1] : null;
                  const trendIndicator = (oldVal: number, newVal: number) => {
                    if (!prev) return '';
                    const change = ((newVal - oldVal) / oldVal) * 100;
                    if (Math.abs(change) < 0.1) return '<span class="trend-stable">→</span>';
                    return change > 0
                      ? `<span class="trend-worse">↑</span>`
                      : `<span class="trend-better">↓</span>`;
                  };

                  return `
                <tr>
                  <td>${i + 1}</td>
                  <td>${m.totalViolations} ${trendIndicator(prev?.totalViolations ?? m.totalViolations, m.totalViolations)}</td>
                  <td>${m.errors} ${trendIndicator(prev?.errors ?? m.errors, m.errors)}</td>
                  <td>${m.warnings} ${trendIndicator(prev?.warnings ?? m.warnings, m.warnings)}</td>
                  <td>${m.info} ${trendIndicator(prev?.info ?? m.info, m.info)}</td>
                  <td>${m.filesAffected} ${trendIndicator(prev?.filesAffected ?? m.filesAffected, m.filesAffected)}</td>
                  ${hasHealthScore ? `<td>${m.healthScore ?? 'N/A'}</td>` : ''}
                  ${hasCouplingScore ? `<td>${m.couplingScore !== undefined ? m.couplingScore.toFixed(1) : 'N/A'}</td>` : ''}
                  ${hasViolationDensity ? `<td>${m.violationDensity !== undefined ? m.violationDensity.toFixed(2) : 'N/A'}</td>` : ''}
                  <td>${new Date(m.timestamp).toLocaleDateString()}</td>
                </tr>
              `;
                })
                .reverse()
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
function generateGraphTab(_graphData: ReturnType<typeof prepareGraphData>): string {
  return `
    <div class="tab-content" id="graph">
      <div class="section">
        <h2>Dependency Graph</h2>
        <p class="section-desc">Interactive visualization of file dependencies</p>
        <div class="graph-controls">
          <label>
            <input type="checkbox" id="showLabels" checked> Show labels
          </label>
          <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 500;">Layers:</span>
            <div id="layerCheckboxes" style="display: flex; gap: 1rem; flex-wrap: wrap;"></div>
          </div>
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
      background: white;
      color: #000;
      line-height: 1.6;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      background: white;
      color: #000;
      padding: 2rem;
      border-bottom: 2px solid #000;
    }

    .header-content h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .meta {
      display: flex;
      gap: 1.5rem;
      font-size: 0.9rem;
      color: #666;
    }

    .tabs {
      background: white;
      border-bottom: 1px solid #ddd;
      display: flex;
      gap: 0;
      padding: 0 2rem;
      overflow-x: auto;
    }

    .tab-btn {
      background: none;
      border: none;
      padding: 1rem 1.5rem;
      font-size: 0.95rem;
      font-weight: 500;
      color: #666;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: #000;
      background: #f5f5f5;
    }

    .tab-btn.active {
      color: #000;
      border-bottom-color: #000;
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
      border: 1px solid #ddd;
      margin-bottom: 1rem;
    }

    .card.good {
      border-left: 3px solid #000;
    }

    .card.warning {
      border-left: 3px solid #666;
    }

    .card.error {
      border-left: 3px solid #000;
    }

    .card h3 {
      font-size: 0.75rem;
      color: #666;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value, .health-score {
      font-size: 2.5rem;
      font-weight: 700;
      color: #000;
      margin: 0.5rem 0;
    }

    .health-card.good .health-score {
      color: #000;
    }

    .health-card.warning .health-score {
      color: #000;
    }

    .health-card.error .health-score {
      color: #000;
    }

    .stat-label, .health-label {
      font-size: 0.9rem;
      color: #666;
    }

    .section {
      background: white;
      padding: 1.5rem;
      border: 1px solid #ddd;
      margin-bottom: 1.5rem;
    }

    .section h2 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
      color: #000;
      font-weight: 600;
    }

    .section-desc {
      color: #666;
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
      border-bottom: 1px solid #eee;
    }

    .list-item:hover {
      background: #f9f9f9;
    }

    .list-rank {
      font-weight: 600;
      color: #999;
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
      color: #000;
      min-width: 2rem;
      text-align: right;
    }

    .file-path {
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 0.85rem;
      color: #000;
      background: #f5f5f5;
      padding: 0.125rem 0.375rem;
    }

    .badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      border: 1px solid #ddd;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      background: white;
      color: #000;
    }

    .badge-domain {
      background: white;
      color: #000;
    }

    .badge-application {
      background: white;
      color: #000;
    }

    .badge-infrastructure {
      background: white;
      color: #000;
    }

    .badge-presentation {
      background: white;
      color: #000;
    }

    .badge-shared {
      background: white;
      color: #000;
    }

    .badge-unmapped {
      background: white;
      color: #666;
    }

    .badge-error {
      background: #000;
      color: white;
    }

    .badge-warning {
      background: #666;
      color: white;
    }

    .badge-info {
      background: white;
      color: #000;
    }

    .count-badge {
      display: inline-block;
      background: #f5f5f5;
      color: #000;
      padding: 0.125rem 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      border: 1px solid #ddd;
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
      color: #000;
    }

    .bar-container {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .bar {
      height: 2rem;
      background: #000;
      transition: width 0.3s ease;
    }

    .bar-value {
      font-weight: 600;
      color: #000;
      min-width: 3rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      color: #000;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: #000;
    }

    .violation-summary {
      display: flex;
      gap: 2rem;
      padding: 1rem;
      background: #f9f9f9;
      border: 1px solid #ddd;
      justify-content: center;
    }

    .summary-item {
      text-align: center;
    }

    .summary-count {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: #000;
    }

    .summary-item.error .summary-count {
      color: #000;
    }

    .summary-item.warning .summary-count {
      color: #000;
    }

    .summary-item.info .summary-count {
      color: #000;
    }

    .summary-label {
      display: block;
      font-size: 0.75rem;
      color: #666;
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
      border: 1px solid #ddd;
      border-left: 3px solid #ddd;
      background: white;
      margin-bottom: 0.5rem;
    }

    .violation-item.error {
      border-left-color: #000;
    }

    .violation-item.warning {
      border-left-color: #666;
    }

    .violation-item.info {
      border-left-color: #999;
    }

    .violation-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .line-number {
      font-size: 0.85rem;
      color: #666;
    }

    .violation-message {
      color: #000;
      margin-bottom: 0.5rem;
    }

    .violation-suggestion {
      display: flex;
      align-items: start;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #f9f9f9;
      border: 1px solid #eee;
      font-size: 0.9rem;
      color: #000;
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
      border: 1px solid #ddd;
    }

    .matrix-table th {
      background: #f5f5f5;
      font-weight: 600;
      color: #000;
    }

    .matrix-cell {
      font-weight: 600;
      color: #000;
      cursor: help;
    }

    .graph-container {
      width: 100%;
      height: 600px;
      border: 1px solid #ddd;
      background: #f9f9f9;
      margin-top: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
    }

    .graph-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      background: #f5f5f5;
      border: 1px solid #ddd;
      flex-wrap: wrap;
    }

    .graph-controls label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #000;
    }

    .graph-controls select,
    .graph-controls button {
      padding: 0.375rem 0.75rem;
      border: 1px solid #ddd;
      background: white;
      color: #000;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .graph-controls button:hover {
      background: #f5f5f5;
    }

    .trend-chart {
      max-height: 300px;
      margin-top: 1rem;
    }

    .table-container {
      overflow-x: auto;
      margin-top: 1rem;
    }

    .metrics-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .metrics-table th,
    .metrics-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .metrics-table th {
      background: #f5f5f5;
      font-weight: 600;
      color: #000;
      position: sticky;
      top: 0;
    }

    .metrics-table td {
      color: #000;
    }

    .metrics-table tbody tr:hover {
      background: #f9f9f9;
    }

    .trend-better {
      color: #000;
      font-weight: 600;
      margin-left: 0.25rem;
    }

    .trend-worse {
      color: #000;
      font-weight: 600;
      margin-left: 0.25rem;
    }

    .trend-stable {
      color: #666;
      margin-left: 0.25rem;
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
function getScripts(
  graphData: ReturnType<typeof prepareGraphData>,
  trends?: { metricsHistory: BaselineMetrics[]; baseline: Baseline }
): string {
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

    let svg;
    let g;
    let link;
    let node;
    let label;
    let showLabels = true;
    let selectedLayers = new Set();

    function initGraph() {
      const container = document.getElementById('graph-container');
      if (!container) {
        console.error('Graph container not found');
        return;
      }
      
      if (graphData.nodes.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">No graph data available</div>';
        return;
      }

      console.log('Initializing graph with container width:', container.clientWidth);

      // Clear container
      container.innerHTML = '';
      svg = null;

      const width = container.clientWidth;
      const height = 600;

      // Create SVG
      svg = d3.select('#graph-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', '#f9f9f9')
        .style('border', '1px solid #ddd');

      // Add arrow marker for directed edges
      svg.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#999');

      // Add zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      svg.call(zoom);

      // Create container group
      g = svg.append('g');

      // Filter data based on selected layers
      const filteredNodes = selectedLayers.size === 0
        ? graphData.nodes
        : graphData.nodes.filter(n => selectedLayers.has(n.layer));
      
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      
      // Create fresh copies of edges to avoid D3 mutation issues
      const filteredEdges = graphData.edges
        .filter(e => {
          const sourceId = typeof e.source === 'object' ? e.source.id : e.source;
          const targetId = typeof e.target === 'object' ? e.target.id : e.target;
          return nodeIds.has(sourceId) && nodeIds.has(targetId);
        })
        .map(e => ({
          source: typeof e.source === 'object' ? e.source.id : e.source,
          target: typeof e.target === 'object' ? e.target.id : e.target,
          kind: e.kind
        }));

      console.log('Filtered nodes:', filteredNodes.length, 'Filtered edges:', filteredEdges.length);

      // Build forest (multiple trees) from graph data
      // Find root nodes (nodes with no incoming edges)
      const nodesWithIncoming = new Set(filteredEdges.map(e => e.target));
      const rootNodes = filteredNodes.filter(n => !nodesWithIncoming.has(n.id));
      
      console.log('Root nodes found:', rootNodes.length);
      
      if (rootNodes.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">No root nodes found</div>';
        return;
      }

      // Build children map
      const childrenMap = new Map();
      filteredEdges.forEach(edge => {
        if (!childrenMap.has(edge.source)) {
          childrenMap.set(edge.source, []);
        }
        childrenMap.get(edge.source).push(edge.target);
      });

      // Convert to tree structure
      const visited = new Set();
      function buildTree(nodeId) {
        if (visited.has(nodeId)) return null;
        visited.add(nodeId);
        
        const node = filteredNodes.find(n => n.id === nodeId);
        if (!node) return null;
        
        const children = childrenMap.get(nodeId) || [];
        const childNodes = children.map(buildTree).filter(c => c !== null);
        
        return {
          ...node,
          children: childNodes.length > 0 ? childNodes : undefined
        };
      }

      // Build all trees
      const trees = rootNodes.map(root => buildTree(root.id)).filter(t => t !== null);
      
      console.log('Built', trees.length, 'trees');

      // Create a virtual root to hold all trees
      const forestData = {
        id: '__forest_root__',
        label: 'Root',
        layer: 'root',
        language: 'none',
        children: trees
      };

      // Create tree layout
      const treeLayout = d3.tree()
        .size([height - 100, width - 200])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2));

      const root = d3.hierarchy(forestData);
      treeLayout(root);

      console.log('Forest has', root.descendants().length, 'total nodes');

      // Adjust for horizontal layout (rotate 90 degrees)
      root.descendants().forEach(d => {
        const x = d.x;
        d.x = d.y;
        d.y = x;
      });

      // Create links (tree edges)
      link = g.append('g')
        .attr('class', 'links')
        .selectAll('path')
        .data(root.links())
        .join('path')
        .attr('d', d3.linkHorizontal()
          .x(d => d.x + 100)
          .y(d => d.y + 50))
        .attr('fill', 'none')
        .attr('stroke', '#999')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.8)
        .attr('marker-end', 'url(#arrowhead)'); // Add arrow to end of line

      // Filter out the virtual root node from display
      const displayNodes = root.descendants().filter(d => d.data.id !== '__forest_root__');

      // Create nodes
      node = g.append('g')
        .selectAll('circle')
        .data(displayNodes)
        .join('circle')
        .attr('cx', d => d.x + 100)
        .attr('cy', d => d.y + 50)
        .attr('r', 6)
        .attr('fill', '#000')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          d3.select(this)
            .attr('r', 8)
            .attr('fill', '#666');
          
          // Show tooltip
          d3.select('body').append('div')
            .attr('class', 'graph-tooltip')
            .style('position', 'absolute')
            .style('background', 'white')
            .style('border', '1px solid #ddd')
            .style('padding', '8px')
            .style('pointer-events', 'none')
            .style('font-size', '12px')
            .style('z-index', '1000')
            .html('<strong>' + d.data.id + '</strong><br/>Layer: ' + d.data.layer)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
          d3.select(this)
            .attr('r', 6)
            .attr('fill', '#000');
          d3.selectAll('.graph-tooltip').remove();
        });

      // Create labels (positioned above nodes to avoid line overlap)
      label = g.append('g')
        .selectAll('text')
        .data(displayNodes)
        .join('text')
        .attr('x', d => d.x + 100)
        .attr('y', d => d.y + 50)
        .text(d => d.data.label)
        .attr('font-size', 10)
        .attr('dx', 0)
        .attr('dy', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#000')
        .attr('font-weight', '500')
        .style('pointer-events', 'none')
        .style('display', showLabels ? 'block' : 'none');
    }


    // Initialize graph when graph tab is shown
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.tab === 'graph') {
          setTimeout(() => {
            if (!svg) {
              console.log('Initializing graph with', graphData.nodes.length, 'nodes and', graphData.edges.length, 'edges');
              initGraph();
            }
          }, 100);
        }
      });
    });

    // Show labels toggle
    const showLabelsCheckbox = document.getElementById('showLabels');
    if (showLabelsCheckbox) {
      showLabelsCheckbox.addEventListener('change', (e) => {
        showLabels = e.target.checked;
        if (label) {
          label.style('display', showLabels ? 'block' : 'none');
        }
      });
    }

    // Layer checkboxes
    const layerCheckboxContainer = document.getElementById('layerCheckboxes');
    if (layerCheckboxContainer) {
      const layers = [...new Set(graphData.nodes.map(n => n.layer))].sort();
      
      layers.forEach(layer => {
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '0.25rem';
        label.style.cursor = 'pointer';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = layer;
        checkbox.checked = true;
        selectedLayers.add(layer);
        
        checkbox.addEventListener('change', (e) => {
          if (e.target.checked) {
            selectedLayers.add(layer);
          } else {
            selectedLayers.delete(layer);
          }
          initGraph();
        });
        
        const text = document.createTextNode(layer);
        
        label.appendChild(checkbox);
        label.appendChild(text);
        layerCheckboxContainer.appendChild(label);
      });
    }

    // Reset zoom
    const resetZoomBtn = document.getElementById('resetZoom');
    if (resetZoomBtn) {
      resetZoomBtn.addEventListener('click', () => {
        if (svg) {
          svg.transition().duration(750).call(
            d3.zoom().transform,
            d3.zoomIdentity
          );
        }
      });
    }

    console.log('Archctl HTML Report loaded');
    console.log('Graph data:', graphData);

    // Initialize trends charts if available
    ${trends ? initializeTrendsCharts(trends) : ''}
  `;
}

/**
 * Generate JavaScript to initialize Chart.js charts for trends
 */
function initializeTrendsCharts(trends: {
  metricsHistory: BaselineMetrics[];
  baseline: Baseline;
}): string {
  const { metricsHistory, baseline } = trends;
  const allMetrics = [...metricsHistory, baseline.metrics];
  const labels = allMetrics.map((_, i) => `Update ${i + 1}`);

  const chartConfig = (
    label: string,
    data: (number | null)[],
    color: string,
    yAxisLabel?: string
  ) => {
    const validData = data.filter((v) => v !== null) as number[];
    if (validData.length === 0) return '';

    return `
      {
        type: 'line',
        data: {
          labels: ${JSON.stringify(labels)},
          datasets: [{
            label: '${label}',
            data: ${JSON.stringify(data)},
            borderColor: '${color}',
            backgroundColor: '${color}33',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ${yAxisLabel ? `title: { display: true, text: '${yAxisLabel}' }` : ''}
            }
          }
        }
      }
    `;
  };

  const totalViolations = allMetrics.map((m) => m.totalViolations);
  const errors = allMetrics.map((m) => m.errors);
  const warnings = allMetrics.map((m) => m.warnings);
  const info = allMetrics.map((m) => m.info);
  const filesAffected = allMetrics.map((m) => m.filesAffected);
  const couplingScores = allMetrics.map((m) => m.couplingScore ?? null);
  const violationDensities = allMetrics.map((m) => m.violationDensity ?? null);
  const healthScores = allMetrics.map((m) => m.healthScore ?? null);

  return `
    const trendsData = ${JSON.stringify({ metricsHistory, baseline })};
    
    function initTrendsCharts() {
      if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded, skipping trends charts');
        return;
      }

      // Total Violations Chart
      const totalViolationsCtx = document.getElementById('chart-total-violations');
      if (totalViolationsCtx) {
        new Chart(totalViolationsCtx, ${chartConfig('Total Violations', totalViolations, '#000')});
      }

      // Severity Chart
      const severityCtx = document.getElementById('chart-severity');
      if (severityCtx) {
        new Chart(severityCtx, {
          type: 'line',
          data: {
            labels: ${JSON.stringify(labels)},
            datasets: [
              {
                label: 'Errors',
                data: ${JSON.stringify(errors)},
                borderColor: '#000',
                backgroundColor: '#00033',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              },
              {
                label: 'Warnings',
                data: ${JSON.stringify(warnings)},
                borderColor: '#666',
                backgroundColor: '#66633',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              },
              {
                label: 'Info',
                data: ${JSON.stringify(info)},
                borderColor: '#999',
                backgroundColor: '#99933',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }

      // Files Affected Chart
      const filesAffectedCtx = document.getElementById('chart-files-affected');
      if (filesAffectedCtx) {
        new Chart(filesAffectedCtx, ${chartConfig('Files Affected', filesAffected, '#000')});
      }

      // Health Score Chart
      const healthScoreCtx = document.getElementById('chart-health-score');
      if (healthScoreCtx) {
        new Chart(healthScoreCtx, ${chartConfig('Health Score', healthScores, '#000', 'Score (0-100)')});
      }

      // Coupling Score Chart
      const couplingScoreCtx = document.getElementById('chart-coupling-score');
      if (couplingScoreCtx) {
        new Chart(couplingScoreCtx, ${chartConfig('Coupling Score', couplingScores, '#000', 'Avg Dependencies')});
      }

      // Violation Density Chart
      const violationDensityCtx = document.getElementById('chart-violation-density');
      if (violationDensityCtx) {
        new Chart(violationDensityCtx, ${chartConfig('Violation Density', violationDensities, '#000', 'Violations per File')});
      }
    }

    // Initialize charts when trends tab is shown
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.tab === 'trends') {
          setTimeout(() => {
            initTrendsCharts();
          }, 100);
        }
      });
    });
  `;
}
