import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface AssertionResult {
  name: string;
  passed: boolean;
  message: string;
  expected?: string;
  actual?: string;
}

interface TestResult {
  testCaseId: string;
  name: string;
  suite: string;
  status: string;
  duration: number;
  assertions: AssertionResult[];
  error?: string;
  timestamp: string;
}

interface TestSuiteResult {
  suite: string;
  results: TestResult[];
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  errored: number;
  duration: number;
}

interface TestReport {
  id: string;
  timestamp: string;
  suites: TestSuiteResult[];
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  errored: number;
  duration: number;
  passRate: number;
}

interface Props {
  report: TestReport | null;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    passed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    skipped: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  const iconMap: Record<string, typeof CheckCircle2> = {
    passed: CheckCircle2,
    failed: XCircle,
    error: AlertCircle,
    skipped: AlertCircle,
  };
  const Icon = iconMap[status] || AlertCircle;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${map[status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
      <Icon size={12} />
      {status}
    </span>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

function SuiteSection({ suite }: { suite: TestSuiteResult }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          <span className="text-sm font-semibold text-slate-800">{suite.suite}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="text-emerald-600">{suite.passed} passed</span>
          {suite.failed > 0 && <span className="text-red-600">{suite.failed} failed</span>}
          {suite.errored > 0 && <span className="text-red-600">{suite.errored} errors</span>}
          {suite.skipped > 0 && <span className="text-amber-600">{suite.skipped} skipped</span>}
          <span>{(suite.duration / 1000).toFixed(2)}s</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100">
          {suite.results.map((r, i) => (
            <TestResultRow key={r.testCaseId + i} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function TestResultRow({ result }: { result: TestResult }) {
  const [expanded, setExpanded] = useState(false);
  const failedAssertions = result.assertions.filter((a) => !a.passed);
  return (
    <div className="border-b border-slate-50 last:border-b-0">
      <button
        onClick={() => failedAssertions.length > 0 ? setExpanded(!expanded) : undefined}
        className={`flex w-full items-center justify-between px-4 py-2.5 text-left ${failedAssertions.length > 0 ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-center gap-2">
          <StatusBadge status={result.status} />
          <span className="text-sm text-slate-700">{result.name}</span>
        </div>
        <span className="text-xs text-slate-400">{result.duration}ms</span>
      </button>
      {expanded && failedAssertions.length > 0 && (
        <div className="bg-slate-50 px-4 pb-3 pt-1">
          {failedAssertions.map((a, i) => (
            <div key={i} className="mb-2 rounded-lg border border-red-100 bg-white p-3">
              <div className="mb-1 flex items-center gap-1">
                <XCircle size={12} className="text-red-500" />
                <span className="text-xs font-medium text-red-700">{a.name}</span>
              </div>
              <p className="mb-1 text-xs text-slate-600">{a.message}</p>
              {(a.expected || a.actual) && (
                <div className="mt-2 space-y-1">
                  {a.expected && (
                    <div className="text-xs">
                      <span className="font-medium text-emerald-700">Expected: </span>
                      <code className="rounded bg-emerald-50 px-1 py-0.5 text-emerald-800">{a.expected}</code>
                    </div>
                  )}
                  {a.actual && (
                    <div className="text-xs">
                      <span className="font-medium text-red-700">Actual: </span>
                      <code className="rounded bg-red-50 px-1 py-0.5 text-red-800">{a.actual}</code>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TestReportView({ report }: Props) {
  if (!report) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <AlertCircle size={32} strokeWidth={1.2} className="mx-auto mb-2 text-slate-300" />
        <p className="text-sm text-slate-500">No report available. Run tests to generate a report.</p>
      </div>
    );
  }

  const passRatePercent = (report.passRate * 100).toFixed(1);
  const passRateColor =
    report.passRate >= 0.9
      ? 'text-emerald-600'
      : report.passRate >= 0.7
        ? 'text-amber-600'
        : 'text-red-600';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Total" value={report.total} color="text-slate-800" />
        <StatCard label="Passed" value={report.passed} color="text-emerald-600" />
        <StatCard label="Failed" value={report.failed} color="text-red-600" />
        <StatCard label="Skipped" value={report.skipped} color="text-amber-600" />
        <StatCard label="Errors" value={report.errored} color="text-red-600" />
        <StatCard label="Pass Rate" value={`${passRatePercent}%`} color={passRateColor} />
        <StatCard label="Duration" value={`${(report.duration / 1000).toFixed(2)}s`} color="text-slate-800" />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Suite Results</h3>
        <span className="text-xs text-slate-400">{new Date(report.timestamp).toLocaleString()}</span>
      </div>

      <div className="space-y-3">
        {report.suites.map((suite) => (
          <SuiteSection key={suite.suite} suite={suite} />
        ))}
      </div>
    </div>
  );
}
