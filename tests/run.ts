import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TestRunner } from './framework/runner.js';
import { formatReportToConsole, saveReport } from './framework/reporter.js';
import { headingSuite } from './suites/heading.test.js';
import { listSuite } from './suites/list.test.js';
import { codeBlockSuite } from './suites/code-block.test.js';
import { boundarySuite } from './suites/boundary.test.js';
import { regressionSuite } from './suites/regression.test.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const BASELINES_DIR = path.join(__dirname, 'baselines');
const REPORTS_DIR = path.join(__dirname, 'reports');

async function main() {
  const args = process.argv.slice(2);
  const parallel = !args.includes('--sequential');
  const suiteFilter = args.find((a) => a.startsWith('--suite='))?.split('=')[1];

  const runner = new TestRunner({
    parallel,
    maxConcurrency: 4,
    timeout: 30000,
    basePath: __dirname,
    fixturesDir: FIXTURES_DIR,
    baselinesDir: BASELINES_DIR,
    reportsDir: REPORTS_DIR,
    useMockFs: true,
  });

  const allSuites = [headingSuite, listSuite, codeBlockSuite, boundarySuite, regressionSuite];

  for (const suite of allSuites) {
    if (!suiteFilter || suite.name === suiteFilter) {
      runner.registerSuite(suite);
    }
  }

  console.log(`\n🧪 Document Test Framework`);
  console.log(`   Mode: ${parallel ? 'Parallel' : 'Sequential'}`);
  console.log(`   Suites: ${allSuites.length}`);
  console.log('');

  const report = await runner.runAll();

  const consoleOutput = formatReportToConsole(report);
  console.log(consoleOutput);

  await saveReport(report, REPORTS_DIR);
  console.log(`\n📄 Reports saved to: ${REPORTS_DIR}`);

  process.exit(report.failed > 0 || report.errored > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(2);
});
