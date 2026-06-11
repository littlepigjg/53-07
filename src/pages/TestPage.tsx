import { useEffect, useState, useMemo } from 'react';
import {
  FlaskConical,
  Play,
  FileText,
  Database,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Upload,
  Download,
  Trash2,
} from 'lucide-react';
import { TestReportView } from '../components/TestReportView';
import { TestCaseManager } from '../components/TestCaseManager';

interface TestCase {
  id: string;
  name: string;
  suite: string;
  description: string;
  tags: string[];
  fixture?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
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

interface AssertionResult {
  name: string;
  passed: boolean;
  message: string;
  expected?: string;
  actual?: string;
}

interface Baseline {
  id: string;
  testCaseId: string;
  version: number;
  timestamp: string;
}

type Tab = 'cases' | 'run' | 'reports' | 'baselines';

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/tests${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
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
    skipped: Clock,
  };
  const Icon = iconMap[status] || AlertCircle;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${map[status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
      <Icon size={12} />
      {status}
    </span>
  );
}

const TABS: { key: Tab; label: string; icon: typeof FlaskConical }[] = [
  { key: 'cases', label: 'Test Cases', icon: FlaskConical },
  { key: 'run', label: 'Run Tests', icon: Play },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'baselines', label: 'Baselines', icon: Database },
];

export function TestPage() {
  const [tab, setTab] = useState<Tab>('cases');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<TestReport | null>(null);
  const [reports, setReports] = useState<TestReport[]>([]);
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [running, setRunning] = useState(false);
  const [runProgress, setRunProgress] = useState('');
  const [search, setSearch] = useState('');
  const [suiteFilter, setSuiteFilter] = useState('all');

  const loadTestCases = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<TestCase[]>('');
      setTestCases(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const data = await apiFetch<TestReport[]>('/reports');
      setReports(data);
      if (data.length > 0) setReport(data[0]);
    } catch {
      // reports endpoint may not exist yet
    }
  };

  const loadBaselines = async () => {
    try {
      const data = await apiFetch<Baseline[]>('/baselines');
      setBaselines(data);
    } catch {
      // baselines endpoint may not exist yet
    }
  };

  useEffect(() => {
    loadTestCases();
    loadReports();
    loadBaselines();
  }, []);

  const handleRunTests = async () => {
    try {
      setRunning(true);
      setRunProgress('Starting test run...');
      const result = await apiFetch<TestReport>('/run', {
        method: 'POST',
        body: JSON.stringify({ parallel: true }),
      });
      setReport(result);
      setRunProgress('Tests completed!');
      loadReports();
      loadTestCases();
    } catch (e) {
      setRunProgress(`Error: ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleDeleteBaseline = async (id: string) => {
    if (!window.confirm('Delete this baseline?')) return;
    try {
      await apiFetch(`/baselines/${id}`, { method: 'DELETE' });
      loadBaselines();
    } catch (e) {
      console.error('Delete baseline failed:', e);
    }
  };

  const suites = useMemo(
    () => Array.from(new Set(testCases.map((tc) => tc.suite))).sort(),
    [testCases]
  );

  const filteredCases = useMemo(() => {
    return testCases.filter((tc) => {
      if (suiteFilter !== 'all' && tc.suite !== suiteFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return tc.name.toLowerCase().includes(q) || tc.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [testCases, suiteFilter, search]);

  const overallPassRate = useMemo(() => {
    if (!report) return null;
    return (report.passRate * 100).toFixed(1);
  }, [report]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">Loading test framework...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle size={32} strokeWidth={1.2} className="mx-auto mb-2 text-red-400" />
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Failed to Load</h2>
          <p className="mb-5 text-sm text-slate-500">{error}</p>
          <button
            onClick={loadTestCases}
            className="inline-flex items-center gap-1 rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2e4e7a]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e3a5f]/10 text-[#1e3a5f]">
              <FlaskConical size={18} />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Test Framework</h1>
              <p className="text-xs text-slate-500">Document Test Management</p>
            </div>
          </div>
          {overallPassRate && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Pass Rate:</span>
              <span
                className={`text-lg font-bold ${
                  Number(overallPassRate) >= 90
                    ? 'text-emerald-600'
                    : Number(overallPassRate) >= 70
                      ? 'text-amber-600'
                      : 'text-red-600'
                }`}
              >
                {overallPassRate}%
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-[#1e3a5f] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {tab === 'cases' && (
          <div className="space-y-4">
            <TestCaseManager testCases={testCases} onRefresh={loadTestCases} />
          </div>
        )}

        {tab === 'run' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-700">Run Configuration</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRunTests}
                  disabled={running}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2e4e7a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={14} />
                  {running ? 'Running...' : 'Run All Tests'}
                </button>
                <span className="text-xs text-slate-500">
                  {testCases.length} test cases will be executed in parallel
                </span>
              </div>
              {runProgress && (
                <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {runProgress}
                </div>
              )}
            </div>

            {report && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Latest Results</h3>
                <TestReportView report={report} />
              </div>
            )}

            {!report && !runProgress && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                <Play size={32} strokeWidth={1.2} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">Click "Run All Tests" to execute the test suite</p>
              </div>
            )}
          </div>
        )}

        {tab === 'reports' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700">
                <FileText size={12} className="text-slate-400" />
                <select
                  value={report?.id || ''}
                  onChange={(e) => {
                    const found = reports.find((r) => r.id === e.target.value);
                    if (found) setReport(found);
                  }}
                  className="bg-transparent focus:outline-none"
                >
                  {reports.length === 0 && <option value="">No reports</option>}
                  {reports.map((r) => (
                    <option key={r.id} value={r.id}>
                      {new Date(r.timestamp).toLocaleString()} - {r.total} tests ({(r.passRate * 100).toFixed(1)}%)
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <TestReportView report={report} />
          </div>
        )}

        {tab === 'baselines' && (
          <div className="space-y-4">
            {baselines.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                <Database size={32} strokeWidth={1.2} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">No baselines found</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Test Case ID</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Version</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Timestamp</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {baselines.map((bl) => (
                        <tr key={bl.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 font-medium text-slate-800">{bl.testCaseId}</td>
                          <td className="px-4 py-2.5 text-slate-500">v{bl.version}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-400">
                            {new Date(bl.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              onClick={() => handleDeleteBaseline(bl.id)}
                              className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
