import path from 'node:path';
import os from 'node:os';
import type { TestSuiteDefinition, TestContext } from '../framework/types.js';
import { BaselineManager } from '../framework/baseline.js';

export const regressionSuite: TestSuiteDefinition = {
  name: 'regression',
  tests: [
    {
      id: 'regression-simple-doc-baseline',
      name: 'Simple document baseline comparison shows no regression',
      description: 'Saves a baseline for simple-markdown.md and verifies that comparing the same content shows no regression',
      tags: ['regression', 'baseline'],
      fixture: 'valid/simple-markdown.md',
      run: async (ctx: TestContext) => {
        const baselinesDir = path.join(os.tmpdir(), 'doc-test-baselines', 'regression-simple-doc');
        const manager = new BaselineManager(baselinesDir);
        const content = ctx.fixture('valid/simple-markdown.md');
        const doc = await ctx.parseMarkdown(content);
        await manager.saveBaseline('regression-simple-doc-baseline', doc);
        const diff = await manager.compareWithBaseline('regression-simple-doc-baseline', doc);
        if (diff.isRegression) {
          throw new Error(`Unexpected regression detected: ${JSON.stringify(diff.changes)}`);
        }
      },
    },
    {
      id: 'regression-heading-skip-detect',
      name: 'Heading skip document baseline comparison matches itself',
      description: 'Saves a baseline for heading-skip-level.md and verifies that parsing the same content again matches the baseline',
      tags: ['regression', 'baseline', 'heading'],
      fixture: 'boundary/heading-skip-level.md',
      run: async (ctx: TestContext) => {
        const baselinesDir = path.join(os.tmpdir(), 'doc-test-baselines', 'regression-heading-skip');
        const manager = new BaselineManager(baselinesDir);
        const content = ctx.fixture('boundary/heading-skip-level.md');
        const doc = await ctx.parseMarkdown(content);
        await manager.saveBaseline('regression-heading-skip-detect', doc);
        const docAgain = await ctx.parseMarkdown(content);
        const diff = await manager.compareWithBaseline('regression-heading-skip-detect', docAgain);
        if (diff.isRegression) {
          throw new Error(`Unexpected regression detected for same content: ${JSON.stringify(diff.changes)}`);
        }
      },
    },
  ],
};
