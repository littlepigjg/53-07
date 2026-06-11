import fs from 'node:fs/promises';
import path from 'node:path';
import type { TestSuiteResult, TestReport, TestResult } from './types.js';

export function generateReport(suiteResults: TestSuiteResult[]): TestReport {
  const timestamp = new Date().toISOString();
  const total = suiteResults.reduce((s, r) => s + r.total, 0);
  const passed = suiteResults.reduce((s, r) => s + r.passed, 0);
  const failed = suiteResults.reduce((s, r) => s + r.failed, 0);
  const skipped = suiteResults.reduce((s, r) => s + r.skipped, 0);
  const errored = suiteResults.reduce((s, r) => s + r.errored, 0);
  const duration = suiteResults.reduce((s, r) => s + r.duration, 0);
  const passRate = total > 0 ? (passed / total) * 100 : 0;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    timestamp,
    suites: suiteResults,
    total,
    passed,
    failed,
    skipped,
    errored,
    duration,
    passRate,
    environment: {
      node: process.version,
      platform: process.platform,
      timestamp,
    },
  };
}

export function formatReportToConsole(report: TestReport): string {
  const lines: string[] = [];

  lines.push('═'.repeat(60));
  lines.push('  TEST REPORT');
  lines.push('═'.repeat(60));
  lines.push('');
  lines.push(`  ${report.passed}/${report.total} passed, ${report.passRate.toFixed(1)}% pass rate`);
  lines.push(`  Duration: ${report.duration}ms`);
  lines.push(`  Failed: ${report.failed} | Skipped: ${report.skipped} | Errored: ${report.errored}`);
  lines.push('');

  for (const suite of report.suites) {
    lines.push('─'.repeat(60));
    lines.push(`  Suite: ${suite.suite}`);
    lines.push(`  ${suite.passed}/${suite.total} passed (${suite.duration}ms)`);
    lines.push('');

    const failedOrError = suite.results.filter(
      (r) => r.status === 'failed' || r.status === 'error',
    );

    for (const result of failedOrError) {
      const label = result.status === 'error' ? 'ERROR' : 'FAIL';
      lines.push(`    ✗ [${label}] ${result.name}`);
      if (result.error) {
        lines.push(`      Error: ${result.error}`);
      }
      for (const assertion of result.assertions) {
        if (!assertion.passed) {
          lines.push(`      Assert: ${assertion.message}`);
          if (assertion.expected) {
            lines.push(`        Expected: ${assertion.expected}`);
          }
          if (assertion.actual) {
            lines.push(`        Actual:   ${assertion.actual}`);
          }
        }
      }
      lines.push('');
    }
  }

  lines.push('═'.repeat(60));
  return lines.join('\n');
}

export function formatReportToJson(report: TestReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatReportToHtml(report: TestReport): string {
  const suiteRows = report.suites.map((suite) => {
    const rate = suite.total > 0 ? ((suite.passed / suite.total) * 100).toFixed(1) : '0.0';
    const statusClass = suite.failed > 0 || suite.errored > 0 ? 'badge-fail' : 'badge-pass';

    let detailsHtml = '';
    const problematic = suite.results.filter(
      (r: TestResult) => r.status === 'failed' || r.status === 'error',
    );

    if (problematic.length > 0) {
      detailsHtml = problematic
        .map((r: TestResult) => {
          const label = r.status === 'error' ? 'ERROR' : 'FAIL';
          const assertionsHtml = r.assertions
            .filter((a) => !a.passed)
            .map((a) => {
              let detail = `<div class="assertion-detail">${escapeHtml(a.message)}`;
              if (a.expected) detail += `<br>Expected: <code>${escapeHtml(a.expected)}</code>`;
              if (a.actual) detail += `<br>Actual: <code>${escapeHtml(a.actual)}</code>`;
              detail += '</div>';
              return detail;
            })
            .join('');
          const errorHtml = r.error ? `<div class="error-detail">${escapeHtml(r.error)}</div>` : '';
          return `<div class="test-detail"><span class="badge badge-fail">${label}</span> ${escapeHtml(r.name)}${errorHtml}${assertionsHtml}</div>`;
        })
        .join('');
    }

    return `<tr>
      <td>${escapeHtml(suite.suite)}</td>
      <td>${suite.total}</td>
      <td>${suite.passed}</td>
      <td>${suite.failed}</td>
      <td>${suite.skipped}</td>
      <td>${suite.errored}</td>
      <td>${suite.duration}ms</td>
      <td><span class="badge ${statusClass}">${rate}%</span></td>
    </tr>
    ${problematic.length > 0 ? `<tr><td colspan="8">${detailsHtml}</td></tr>` : ''}`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Test Report - ${escapeHtml(report.id)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; padding: 1rem; }
  .container { max-width: 960px; margin: 0 auto; }
  header { background: #1a1a2e; color: #fff; padding: 1.5rem; border-radius: 8px 8px 0 0; }
  header h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
  header .meta { font-size: 0.875rem; opacity: 0.8; }
  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; padding: 1.5rem; background: #fff; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
  .summary-item { text-align: center; }
  .summary-item .value { font-size: 1.75rem; font-weight: 700; }
  .summary-item .label { font-size: 0.75rem; text-transform: uppercase; color: #666; }
  .value-pass { color: #22c55e; }
  .value-fail { color: #ef4444; }
  .value-skip { color: #f59e0b; }
  .value-error { color: #dc2626; }
  .value-rate { color: #3b82f6; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
  th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #eee; font-size: 0.875rem; }
  th { background: #f9fafb; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; color: #666; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
  .badge-pass { background: #dcfce7; color: #166534; }
  .badge-fail { background: #fee2e2; color: #991b1b; }
  .test-detail { padding: 0.5rem 0.75rem; margin: 0.25rem 0; background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 4px; font-size: 0.8125rem; }
  .assertion-detail, .error-detail { padding: 0.25rem 0 0.25rem 1rem; color: #555; }
  .error-detail { color: #dc2626; }
  code { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-size: 0.8rem; }
  footer { background: #fff; padding: 1rem 1.5rem; border-radius: 0 0 8px 8px; border: 1px solid #ddd; font-size: 0.75rem; color: #999; }
  @media (max-width: 600px) {
    body { padding: 0; }
    .summary { grid-template-columns: repeat(3, 1fr); }
    th, td { padding: 0.5rem; font-size: 0.75rem; }
  }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>Test Report</h1>
    <div class="meta">
      ID: ${escapeHtml(report.id)} &middot; ${escapeHtml(report.timestamp)} &middot; Node ${escapeHtml(report.environment.node)} &middot; ${escapeHtml(report.environment.platform)}
    </div>
  </header>
  <div class="summary">
    <div class="summary-item"><div class="value">${report.total}</div><div class="label">Total</div></div>
    <div class="summary-item"><div class="value value-pass">${report.passed}</div><div class="label">Passed</div></div>
    <div class="summary-item"><div class="value value-fail">${report.failed}</div><div class="label">Failed</div></div>
    <div class="summary-item"><div class="value value-skip">${report.skipped}</div><div class="label">Skipped</div></div>
    <div class="summary-item"><div class="value value-error">${report.errored}</div><div class="label">Errors</div></div>
    <div class="summary-item"><div class="value value-rate">${report.passRate.toFixed(1)}%</div><div class="label">Pass Rate</div></div>
    <div class="summary-item"><div class="value">${report.duration}ms</div><div class="label">Duration</div></div>
  </div>
  <table>
    <thead>
      <tr><th>Suite</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Errors</th><th>Duration</th><th>Rate</th></tr>
    </thead>
    <tbody>
      ${suiteRows}
    </tbody>
  </table>
  <footer>Generated at ${escapeHtml(report.timestamp)}</footer>
</div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function saveReport(report: TestReport, dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
  const ts = report.timestamp.replace(/[:.]/g, '-');
  await Promise.all([
    fs.writeFile(path.join(dir, `report-${ts}.json`), formatReportToJson(report), 'utf8'),
    fs.writeFile(path.join(dir, `report-${ts}.html`), formatReportToHtml(report), 'utf8'),
  ]);
}
