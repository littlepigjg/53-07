import { useState, useRef, useMemo } from 'react';
import { Search, Upload, Download, Trash2, FlaskConical } from 'lucide-react';

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

interface Props {
  testCases: TestCase[];
  onRefresh: () => void;
}

const TAG_COLORS = [
  'bg-sky-50 text-sky-700 border-sky-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
];

function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function TestCaseManager({ testCases, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [suiteFilter, setSuiteFilter] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suites = useMemo(
    () => Array.from(new Set(testCases.map((tc) => tc.suite))).sort(),
    [testCases]
  );

  const filtered = useMemo(() => {
    return testCases.filter((tc) => {
      if (suiteFilter !== 'all' && tc.suite !== suiteFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return tc.name.toLowerCase().includes(q) || tc.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [testCases, suiteFilter, search]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await fetch('/api/tests/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      onRefresh();
    } catch (err) {
      console.error('Import failed:', err);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/tests/export');
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-cases-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this test case?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/tests/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search test cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]/30"
          />
        </div>
        <label className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700">
          <FlaskConical size={12} className="text-slate-400" />
          <select
            value={suiteFilter}
            onChange={(e) => setSuiteFilter(e.target.value)}
            className="bg-transparent focus:outline-none"
          >
            <option value="all">All Suites</option>
            {suites.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <Upload size={14} /> Import
        </button>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <Download size={14} /> Export
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Suite</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Tags</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Version</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Updated</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    No test cases found
                  </td>
                </tr>
              ) : (
                filtered.map((tc) => (
                  <tr key={tc.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800">{tc.name}</div>
                      {tc.description && (
                        <div className="mt-0.5 text-xs text-slate-400 line-clamp-1">{tc.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{tc.suite}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {tc.tags.map((tag) => (
                          <span key={tag} className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${tagColor(tag)}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">v{tc.version}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {new Date(tc.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleDelete(tc.id)}
                        disabled={deleting === tc.id}
                        className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        Showing {filtered.length} of {testCases.length} test cases
      </div>
    </div>
  );
}
