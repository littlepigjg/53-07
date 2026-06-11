import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TestRunner } from '../../tests/framework/runner.js';
import { TestCaseManager } from '../../tests/framework/manager.js';
import { BaselineManager } from '../../tests/framework/baseline.js';
import { generateReport } from '../../tests/framework/reporter.js';
import type { TestCase, TestCaseExport, TestReport, TestConfig } from '../../tests/framework/types.js';
import { headingSuite } from '../../tests/suites/heading.test.js';
import { listSuite } from '../../tests/suites/list.test.js';
import { codeBlockSuite } from '../../tests/suites/code-block.test.js';
import { boundarySuite } from '../../tests/suites/boundary.test.js';
import { regressionSuite } from '../../tests/suites/regression.test.js';

export { TestRunner } from '../../tests/framework/runner.js';
export { TestCaseManager } from '../../tests/framework/manager.js';
export { BaselineManager } from '../../tests/framework/baseline.js';
export { generateReport, formatReportToConsole, formatReportToJson, formatReportToHtml, saveReport } from '../../tests/framework/reporter.js';
export type { TestCase, TestCaseExport, TestReport, TestConfig, TestResult, TestSuiteResult, AssertionResult, TestStatus, BaselineSnapshot, RegressionDiff, TestSuiteDefinition, TestContext } from '../../tests/framework/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');
const testDataDir = path.join(projectRoot, 'tests', 'data');

const allSuites = [headingSuite, listSuite, codeBlockSuite, boundarySuite, regressionSuite];

function createConfig(parallel: boolean): TestConfig {
  return {
    parallel,
    maxConcurrency: 4,
    timeout: 30000,
    basePath: projectRoot,
    fixturesDir: path.join(projectRoot, 'tests', 'fixtures'),
    baselinesDir: path.join(testDataDir, 'baselines'),
    reportsDir: path.join(testDataDir, 'reports'),
    useMockFs: true,
  };
}

function createRunner(parallel: boolean): TestRunner {
  const runner = new TestRunner(createConfig(parallel));
  for (const suite of allSuites) {
    runner.registerSuite(suite);
  }
  return runner;
}

let defaultRunner: TestRunner | null = null;
let manager: TestCaseManager | null = null;
let baselineManager: BaselineManager | null = null;

function getRunner(): TestRunner {
  if (!defaultRunner) {
    defaultRunner = createRunner(true);
  }
  return defaultRunner;
}

function getManager(): TestCaseManager {
  if (!manager) {
    manager = new TestCaseManager(testDataDir);
  }
  return manager;
}

function getBaselineManager(): BaselineManager {
  if (!baselineManager) {
    baselineManager = new BaselineManager(path.join(testDataDir, 'baselines'));
  }
  return baselineManager;
}

export class TestFrameworkService {
  static async runTests(options?: { suite?: string; parallel?: boolean }): Promise<TestReport> {
    const parallel = options?.parallel ?? true;
    if (options?.suite) {
      const runner = getRunner();
      const suiteResult = await runner.runSuite(options.suite);
      return generateReport([suiteResult]);
    }
    if (parallel) {
      return getRunner().runAll();
    }
    return createRunner(false).runAll();
  }

  static async listTestCases(): Promise<TestCase[]> {
    return getManager().list();
  }

  static async getTestCase(id: string): Promise<TestCase | null> {
    return getManager().get(id);
  }

  static async searchTestCases(query: { suite?: string; tags?: string[]; name?: string }): Promise<TestCase[]> {
    return getManager().search(query);
  }

  static async importTestCases(data: TestCaseExport): Promise<number> {
    return getManager().import(data);
  }

  static async exportTestCases(suiteNames?: string[]): Promise<TestCaseExport> {
    return getManager().export(suiteNames);
  }

  static async deleteTestCase(id: string): Promise<void> {
    return getManager().remove(id);
  }

  static async listBaselines(): Promise<string[]> {
    return getBaselineManager().listBaselines();
  }

  static async deleteBaseline(id: string): Promise<void> {
    return getBaselineManager().deleteBaseline(id);
  }

  static async listSuites(): Promise<string[]> {
    return allSuites.map((s) => s.name);
  }
}
