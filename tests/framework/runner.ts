import { readFileSync } from 'node:fs';
import path from 'node:path';
import type {
  TestConfig,
  TestSuiteDefinition,
  TestCase,
  TestResult,
  TestSuiteResult,
  TestReport,
  TestContext,
  AssertionResult,
  DocumentAssertions,
} from './types.js';
import type { ParsedDocument, ParagraphType } from '../../shared/types.js';
import { DocumentParser } from '../../api/services/DocumentParser.js';
import { createMockFs } from './mock-fs.js';
import { createAssertions } from './assertions.js';
import { BaselineManager } from './baseline.js';
import { generateReport } from './reporter.js';

export class AssertionCollector implements DocumentAssertions {
  private results: AssertionResult[] = [];
  private inner: DocumentAssertions;

  constructor(inner: DocumentAssertions) {
    this.inner = inner;
  }

  headingLevels(
    doc: ParsedDocument,
    expected: Array<{ level: number; content: string }>,
  ): AssertionResult {
    const result = this.inner.headingLevels(doc, expected);
    this.results.push(result);
    return result;
  }

  listClosure(doc: ParsedDocument): AssertionResult {
    const result = this.inner.listClosure(doc);
    this.results.push(result);
    return result;
  }

  codeBlockHighlight(doc: ParsedDocument): AssertionResult {
    const result = this.inner.codeBlockHighlight(doc);
    this.results.push(result);
    return result;
  }

  paragraphCount(doc: ParsedDocument, expected: number): AssertionResult {
    const result = this.inner.paragraphCount(doc, expected);
    this.results.push(result);
    return result;
  }

  paragraphTypes(doc: ParsedDocument, expected: ParagraphType[]): AssertionResult {
    const result = this.inner.paragraphTypes(doc, expected);
    this.results.push(result);
    return result;
  }

  noEmptyParagraphs(doc: ParsedDocument): AssertionResult {
    const result = this.inner.noEmptyParagraphs(doc);
    this.results.push(result);
    return result;
  }

  headingSequence(doc: ParsedDocument): AssertionResult {
    const result = this.inner.headingSequence(doc);
    this.results.push(result);
    return result;
  }

  codeBlockClosure(doc: ParsedDocument): AssertionResult {
    const result = this.inner.codeBlockClosure(doc);
    this.results.push(result);
    return result;
  }

  noRawHtml(doc: ParsedDocument): AssertionResult {
    const result = this.inner.noRawHtml(doc);
    this.results.push(result);
    return result;
  }

  documentNotEmpty(doc: ParsedDocument): AssertionResult {
    const result = this.inner.documentNotEmpty(doc);
    this.results.push(result);
    return result;
  }

  getResults(): AssertionResult[] {
    return [...this.results];
  }
}

export async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  maxConcurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      results[index] = await tasks[index]();
    }
  }

  const workerCount = Math.min(maxConcurrency, tasks.length);
  if (workerCount === 0) return results;

  await Promise.all(
    Array.from({ length: workerCount }, () => worker()),
  );

  return results;
}

export class TestRunner {
  private config: TestConfig;
  private baselineManager: BaselineManager;
  private suites: TestSuiteDefinition[] = [];
  private testCases: TestCase[] = [];

  constructor(config: TestConfig) {
    this.config = config;
    this.baselineManager = new BaselineManager(config.baselinesDir);
  }

  registerSuite(suite: TestSuiteDefinition): void {
    this.suites.push(suite);
    const now = new Date().toISOString();
    for (const test of suite.tests) {
      this.testCases.push({
        id: test.id,
        name: test.name,
        suite: suite.name,
        description: test.description,
        tags: test.tags,
        fixture: test.fixture,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  async runAll(): Promise<TestReport> {
    const tasks = this.suites.map(
      (suite) => () => this.runSuite(suite.name),
    );

    let suiteResults: TestSuiteResult[];

    if (this.config.parallel) {
      suiteResults = await runWithConcurrency(tasks, this.config.maxConcurrency);
    } else {
      suiteResults = [];
      for (const task of tasks) {
        suiteResults.push(await task());
      }
    }

    return generateReport(suiteResults);
  }

  async runSuite(suiteName: string): Promise<TestSuiteResult> {
    const suite = this.suites.find((s) => s.name === suiteName);
    if (!suite) {
      throw new Error(`Suite not found: ${suiteName}`);
    }

    const start = Date.now();
    const results: TestResult[] = [];

    for (const test of suite.tests) {
      results.push(await this.executeTest(suite, test));
    }

    const duration = Date.now() - start;
    const passed = results.filter((r) => r.status === 'passed').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;
    const errored = results.filter((r) => r.status === 'error').length;

    return {
      suite: suiteName,
      results,
      total: results.length,
      passed,
      failed,
      skipped,
      errored,
      duration,
    };
  }

  async runSingle(suiteName: string, testId: string): Promise<TestResult> {
    const suite = this.suites.find((s) => s.name === suiteName);
    if (!suite) {
      throw new Error(`Suite not found: ${suiteName}`);
    }
    const test = suite.tests.find((t) => t.id === testId);
    if (!test) {
      throw new Error(`Test not found: ${testId} in suite ${suiteName}`);
    }
    return this.executeTest(suite, test);
  }

  private async executeTest(
    suite: TestSuiteDefinition,
    test: TestSuiteDefinition['tests'][number],
  ): Promise<TestResult> {
    const mockFs = createMockFs();
    const assertions = createAssertions();
    const collector = new AssertionCollector(assertions);

    const fixture = (name: string): string => {
      const filePath = path.join(this.config.fixturesDir, name);
      return readFileSync(filePath, 'utf8');
    };

    const parseMarkdown = (content: string): Promise<ParsedDocument> => {
      return DocumentParser.buildParsedDocument(`test-${test.id}`, content, 'markdown');
    };

    const parseHtml = (content: string): Promise<ParsedDocument> => {
      return DocumentParser.buildParsedDocument(`test-${test.id}`, content, 'markdown');
    };

    const context: TestContext = {
      mockFs,
      assert: collector,
      fixture,
      parseMarkdown,
      parseHtml,
    };

    const start = Date.now();
    let status: 'passed' | 'failed' | 'skipped' | 'error' = 'passed';
    let error: string | undefined;

    try {
      const timeoutMs = this.config.timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Test timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      });
      await Promise.race([test.run(context), timeoutPromise]);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      status = 'failed';
    }

    const duration = Date.now() - start;
    const collectedAssertions = collector.getResults();

    return {
      testCaseId: test.id,
      name: test.name,
      suite: suite.name,
      status,
      duration,
      assertions: collectedAssertions,
      error,
      timestamp: new Date().toISOString(),
    };
  }
}
