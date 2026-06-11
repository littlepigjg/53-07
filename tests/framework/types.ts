export type TestStatus = 'passed' | 'failed' | 'skipped' | 'error';

export interface TestCase {
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

export interface AssertionResult {
  name: string;
  passed: boolean;
  message: string;
  expected?: string;
  actual?: string;
}

export interface TestResult {
  testCaseId: string;
  name: string;
  suite: string;
  status: TestStatus;
  duration: number;
  assertions: AssertionResult[];
  error?: string;
  timestamp: string;
}

export interface TestSuiteResult {
  suite: string;
  results: TestResult[];
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  errored: number;
  duration: number;
}

export interface TestReport {
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
  environment: {
    node: string;
    platform: string;
    timestamp: string;
  };
}

export interface BaselineSnapshot {
  testCaseId: string;
  version: number;
  timestamp: string;
  paragraphs: Array<{
    type: string;
    level?: number;
    content: string;
  }>;
}

export interface RegressionDiff {
  testCaseId: string;
  baselineVersion: number;
  currentVersion: number;
  changes: Array<{
    kind: 'added' | 'removed' | 'modified';
    path: string;
    baseline?: string;
    current?: string;
  }>;
  isRegression: boolean;
}

export interface TestConfig {
  parallel: boolean;
  maxConcurrency: number;
  timeout: number;
  basePath: string;
  fixturesDir: string;
  baselinesDir: string;
  reportsDir: string;
  useMockFs: boolean;
}

export interface TestSuiteDefinition {
  name: string;
  tests: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
    fixture?: string;
    run: (ctx: TestContext) => Promise<void>;
  }>;
}

export interface TestContext {
  mockFs: MockFileSystem;
  assert: DocumentAssertions;
  fixture: (name: string) => string;
  parseMarkdown: (content: string) => Promise<import('../../shared/types.js').ParsedDocument>;
  parseHtml: (content: string) => Promise<import('../../shared/types.js').ParsedDocument>;
}

export interface MockFileSystem {
  writeFile(path: string, content: string): void;
  readFile(path: string): string;
  exists(path: string): boolean;
  deleteFile(path: string): void;
  listFiles(dir: string): string[];
  reset(): void;
  snapshot(): Record<string, string>;
}

export interface DocumentAssertions {
  headingLevels(doc: import('../../shared/types.js').ParsedDocument, expected: Array<{ level: number; content: string }>): AssertionResult;
  listClosure(doc: import('../../shared/types.js').ParsedDocument): AssertionResult;
  codeBlockHighlight(doc: import('../../shared/types.js').ParsedDocument): AssertionResult;
  paragraphCount(doc: import('../../shared/types.js').ParsedDocument, expected: number): AssertionResult;
  paragraphTypes(doc: import('../../shared/types.js').ParsedDocument, expected: import('../../shared/types.js').ParagraphType[]): AssertionResult;
  noEmptyParagraphs(doc: import('../../shared/types.js').ParsedDocument): AssertionResult;
  headingSequence(doc: import('../../shared/types.js').ParsedDocument): AssertionResult;
  codeBlockClosure(doc: import('../../shared/types.js').ParsedDocument): AssertionResult;
  noRawHtml(doc: import('../../shared/types.js').ParsedDocument): AssertionResult;
  documentNotEmpty(doc: import('../../shared/types.js').ParsedDocument): AssertionResult;
}

export interface TestCaseExport {
  version: string;
  exportedAt: string;
  testCases: TestCase[];
  suites: string[];
}

export const DEFAULT_CONFIG: TestConfig = {
  parallel: true,
  maxConcurrency: 4,
  timeout: 30000,
  basePath: '',
  fixturesDir: '',
  baselinesDir: '',
  reportsDir: '',
  useMockFs: true,
};
