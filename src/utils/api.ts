import type {
  DocumentMeta,
  ParsedDocument,
  Annotation,
  ReviewSummary,
  AnnotationStatus,
} from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export const documentsApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: form,
    }).then((r) => r.json() as Promise<DocumentMeta>);
  },
  list: () => request<DocumentMeta[]>('/documents'),
  get: (id: string) => request<DocumentMeta>(`/documents/${id}`),
  remove: (id: string) =>
    request<{ ok: true }>(`/documents/${id}`, { method: 'DELETE' }),
  getParsed: (id: string) => request<ParsedDocument>(`/documents/${id}/parsed`),
  createShare: (id: string) =>
    request<{ shareToken: string }>(`/documents/${id}/share`, { method: 'POST' }),
};

export const shareApi = {
  getReviewData: (token: string) =>
    request<{ document: DocumentMeta; parsed: ParsedDocument; annotations: Annotation[] }>(`/share/${token}`),
};

export const annotationsApi = {
  create: (data: {
    documentId: string;
    paragraphId: string;
    type: 'comment' | 'suggestion';
    reviewerName: string;
    reviewerEmail?: string;
    content: string;
    suggestedText?: string;
    originalText?: string;
  }) => request<Annotation>('/annotations', { method: 'POST', body: JSON.stringify(data) }),
  list: (docId: string) => request<Annotation[]>(`/annotations/${docId}`),
  updateStatus: (id: string, status: AnnotationStatus, ownerNote?: string) =>
    request<Annotation>(`/annotations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ownerNote }),
    }),
  remove: (id: string) =>
    request<{ ok: true }>(`/annotations/${id}`, { method: 'DELETE' }),
};

export const reviewApi = {
  summary: (docId: string) => request<ReviewSummary>(`/review/${docId}/summary`),
};

export const exportApi = {
  markdown: (docId: string) =>
    fetch(`${API_BASE}/export/${docId}`).then(async (r) => ({
      filename:
        r.headers.get('Content-Disposition')?.match(/filename="?([^"]+)/)?.[1] ||
        'document.md',
      text: await r.text(),
    })),
};

export interface TestReport {
  id: string;
  timestamp: string;
  suites: TestSuiteResultApi[];
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  errored: number;
  duration: number;
  passRate: number;
}

export interface TestSuiteResultApi {
  suite: string;
  results: TestResultApi[];
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  errored: number;
  duration: number;
}

export interface TestResultApi {
  testCaseId: string;
  name: string;
  suite: string;
  status: string;
  duration: number;
  assertions: AssertionResultApi[];
  error?: string;
  timestamp: string;
}

export interface AssertionResultApi {
  name: string;
  passed: boolean;
  message: string;
  expected?: string;
  actual?: string;
}

export interface TestCaseApi {
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

export interface TestCaseExportApi {
  version: string;
  exportedAt: string;
  testCases: TestCaseApi[];
  suites: string[];
}

export const testsApi = {
  list: () => request<TestCaseApi[]>('/tests'),
  listSuites: () => request<string[]>('/tests/suites'),
  search: (query: { suite?: string; name?: string; tags?: string[] }) => {
    const params = new URLSearchParams();
    if (query.suite) params.set('suite', query.suite);
    if (query.name) params.set('name', query.name);
    if (query.tags?.length) params.set('tags', query.tags.join(','));
    return request<TestCaseApi[]>(`/tests/search?${params.toString()}`);
  },
  run: (options?: { suite?: string; parallel?: boolean }) =>
    request<TestReport>('/tests/run', {
      method: 'POST',
      body: JSON.stringify({ parallel: true, ...options }),
    }),
  import: (data: TestCaseExportApi) =>
    request<{ imported: number }>('/tests/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  export: (suiteNames?: string[]) => {
    const params = suiteNames?.length ? `?suite=${suiteNames.join(',')}` : '';
    return request<TestCaseExportApi>(`/tests/export${params}`);
  },
  remove: (id: string) =>
    request<{ ok: true }>(`/tests/${id}`, { method: 'DELETE' }),
  listBaselines: () => request<string[]>('/tests/baselines'),
  deleteBaseline: (id: string) =>
    request<{ ok: true }>(`/tests/baselines/${id}`, { method: 'DELETE' }),
};
