import { describe, it, expect } from 'vitest';
import { generateHtmlReport } from '../../src/services/htmlReportService';
import type { Baseline, BaselineMetrics } from '../../src/types/baseline';
import type { GraphReport } from '../../src/services/graphService';

describe('HTML Report Trends', () => {
  const mockGraphReport: GraphReport = {
    project: 'Test Project',
    generatedAt: new Date().toISOString(),
    summary: {
      totalFiles: 100,
      totalDependencies: 350,
      averageDependenciesPerFile: '3.5',
      languages: { typescript: 80, javascript: 20 },
      layers: { domain: 30, application: 40, infrastructure: 30 },
    },
    topDependencies: [],
    topDependents: [],
    layerInteractions: {},
    graph: {
      files: {},
      edges: [],
    },
  };

  it('should include trends tab when trends data provided', () => {
    // INPUT: HTML report with trends data
    const metricsHistory: BaselineMetrics[] = [
      {
        totalViolations: 100,
        errors: 50,
        warnings: 30,
        info: 20,
        filesAffected: 25,
        timestamp: '2025-01-15T10:00:00Z',
        couplingScore: 3.5,
        violationDensity: 4.0,
        healthScore: 75,
      },
      {
        totalViolations: 90,
        errors: 45,
        warnings: 30,
        info: 15,
        filesAffected: 23,
        timestamp: '2025-01-16T10:00:00Z',
        couplingScore: 3.4,
        violationDensity: 3.9,
        healthScore: 78,
      },
    ];

    const baseline: Baseline = {
      version: '1.0.0',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-17T10:00:00Z',
      violations: [],
      metrics: {
        totalViolations: 80,
        errors: 40,
        warnings: 30,
        info: 10,
        filesAffected: 20,
        timestamp: '2025-01-17T10:00:00Z',
        couplingScore: 3.3,
        violationDensity: 4.0,
        healthScore: 80,
      },
      metricsHistory,
    };

    // EXECUTE
    const html = generateHtmlReport({
      graphReport: mockGraphReport,
      violations: [],
      trends: {
        metricsHistory,
        baseline,
      },
    });

    // EXPECTED OUTPUT:
    // - HTML should contain "Trends" tab button
    // - HTML should contain Chart.js CDN script
    // - HTML should contain trends tab content
    expect(html).toContain('data-tab="trends"');
    expect(html).toContain('Trends');
    expect(html).toContain('chart.js');
    expect(html).toContain('id="trends"');
  });

  it('should not include trends tab when no trends data', () => {
    // INPUT: HTML report without trends data
    // EXECUTE
    const html = generateHtmlReport({
      graphReport: mockGraphReport,
      violations: [],
    });

    // EXPECTED OUTPUT:
    // - HTML should NOT contain "Trends" tab
    // - HTML should NOT contain Chart.js script
    expect(html).not.toContain('data-tab="trends"');
    expect(html).not.toContain('chart.js');
  });

  it('should include Chart.js script when trends present', () => {
    // INPUT: HTML report with trends
    const metricsHistory: BaselineMetrics[] = [
      {
        totalViolations: 100,
        errors: 50,
        warnings: 30,
        info: 20,
        filesAffected: 25,
        timestamp: '2025-01-15T10:00:00Z',
      },
    ];

    const baseline: Baseline = {
      version: '1.0.0',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-16T10:00:00Z',
      violations: [],
      metrics: {
        totalViolations: 90,
        errors: 45,
        warnings: 30,
        info: 15,
        filesAffected: 23,
        timestamp: '2025-01-16T10:00:00Z',
      },
      metricsHistory,
    };

    // EXECUTE
    const html = generateHtmlReport({
      graphReport: mockGraphReport,
      violations: [],
      trends: {
        metricsHistory,
        baseline,
      },
    });

    // EXPECTED OUTPUT:
    // - HTML should contain Chart.js CDN link
    expect(html).toContain('cdn.jsdelivr.net/npm/chart.js');
  });

  it('should generate correct chart data in JavaScript', () => {
    // INPUT: Trends with specific metrics
    const metricsHistory: BaselineMetrics[] = [
      {
        totalViolations: 100,
        errors: 50,
        warnings: 30,
        info: 20,
        filesAffected: 25,
        timestamp: '2025-01-15T10:00:00Z',
        couplingScore: 3.5,
        healthScore: 75,
      },
      {
        totalViolations: 90,
        errors: 45,
        warnings: 30,
        info: 15,
        filesAffected: 23,
        timestamp: '2025-01-16T10:00:00Z',
        couplingScore: 3.4,
        healthScore: 78,
      },
    ];

    const baseline: Baseline = {
      version: '1.0.0',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-17T10:00:00Z',
      violations: [],
      metrics: {
        totalViolations: 80,
        errors: 40,
        warnings: 30,
        info: 10,
        filesAffected: 20,
        timestamp: '2025-01-17T10:00:00Z',
        couplingScore: 3.3,
        healthScore: 80,
      },
      metricsHistory,
    };

    // EXECUTE
    const html = generateHtmlReport({
      graphReport: mockGraphReport,
      violations: [],
      trends: {
        metricsHistory,
        baseline,
      },
    });

    // EXPECTED OUTPUT:
    // - JavaScript should contain metricsHistory data
    // - Should contain totalViolations array: [100, 90, 80]
    // - Should contain errors array: [50, 45, 40]
    expect(html).toContain('metricsHistory');
    expect(html).toContain('100');
    expect(html).toContain('90');
    expect(html).toContain('80');
    expect(html).toContain('50');
    expect(html).toContain('45');
    expect(html).toContain('40');
  });

  it('should include metrics history table', () => {
    // INPUT: Trends with history
    const metricsHistory: BaselineMetrics[] = [
      {
        totalViolations: 100,
        errors: 50,
        warnings: 30,
        info: 20,
        filesAffected: 25,
        timestamp: '2025-01-15T10:00:00Z',
        couplingScore: 3.5,
        violationDensity: 4.0,
        healthScore: 75,
      },
    ];

    const baseline: Baseline = {
      version: '1.0.0',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-16T10:00:00Z',
      violations: [],
      metrics: {
        totalViolations: 90,
        errors: 45,
        warnings: 30,
        info: 15,
        filesAffected: 23,
        timestamp: '2025-01-16T10:00:00Z',
        couplingScore: 3.4,
        violationDensity: 3.9,
        healthScore: 78,
      },
      metricsHistory,
    };

    // EXECUTE
    const html = generateHtmlReport({
      graphReport: mockGraphReport,
      violations: [],
      trends: {
        metricsHistory,
        baseline,
      },
    });

    // EXPECTED OUTPUT:
    // - HTML should contain table with class "metrics-table"
    // - Should contain table headers: Update, Total, Errors, etc.
    // - Should contain table rows with metrics data
    expect(html).toContain('metrics-table');
    expect(html).toContain('<th>Update</th>');
    expect(html).toContain('<th>Total</th>');
    expect(html).toContain('<th>Errors</th>');
    expect(html).toContain('<th>Health</th>');
    expect(html).toContain('<th>Coupling</th>');
    expect(html).toContain('100'); // First history entry
    expect(html).toContain('90'); // Current metrics
  });

  it('should handle trends with missing optional metrics gracefully', () => {
    // INPUT: Trends where some history entries don't have couplingScore/healthScore
    const metricsHistory: BaselineMetrics[] = [
      {
        totalViolations: 100,
        errors: 50,
        warnings: 30,
        info: 20,
        filesAffected: 25,
        timestamp: '2025-01-15T10:00:00Z',
        // No couplingScore or healthScore (old baseline entry)
      },
      {
        totalViolations: 90,
        errors: 45,
        warnings: 30,
        info: 15,
        filesAffected: 23,
        timestamp: '2025-01-16T10:00:00Z',
        couplingScore: 3.4,
        healthScore: 78,
      },
    ];

    const baseline: Baseline = {
      version: '1.0.0',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-17T10:00:00Z',
      violations: [],
      metrics: {
        totalViolations: 80,
        errors: 40,
        warnings: 30,
        info: 10,
        filesAffected: 20,
        timestamp: '2025-01-17T10:00:00Z',
        couplingScore: 3.3,
        healthScore: 80,
      },
      metricsHistory,
    };

    // EXECUTE
    const html = generateHtmlReport({
      graphReport: mockGraphReport,
      violations: [],
      trends: {
        metricsHistory,
        baseline,
      },
    });

    // EXPECTED OUTPUT:
    // - HTML should still generate successfully
    // - Should handle null/undefined values in chart data
    // - Table should show "N/A" for missing metrics
    expect(html).toContain('data-tab="trends"');
    expect(html).toContain('N/A'); // For missing metrics in table
  });
});

