import type { TestSuiteDefinition, TestContext } from '../framework/types.js';

export const listSuite: TestSuiteDefinition = {
  name: 'list',
  tests: [
    {
      id: 'list-closure-valid',
      name: 'List closure is valid in simple document',
      description: 'Verifies that list paragraphs in simple-markdown.md have proper list markers',
      tags: ['list', 'closure'],
      fixture: 'valid/simple-markdown.md',
      run: async (ctx: TestContext) => {
        const content = ctx.fixture('valid/simple-markdown.md');
        const doc = await ctx.parseMarkdown(content);
        const result = ctx.assert.listClosure(doc);
        if (!result.passed) {
          throw new Error(`listClosure assertion failed: ${result.message}`);
        }
      },
    },
    {
      id: 'list-closure-deeply-nested',
      name: 'List closure passes for deeply nested lists',
      description: 'Verifies that deeply nested list structures have proper list markers',
      tags: ['list', 'closure', 'boundary', 'nesting'],
      fixture: 'boundary/deeply-nested-list.md',
      run: async (ctx: TestContext) => {
        const content = ctx.fixture('boundary/deeply-nested-list.md');
        const doc = await ctx.parseMarkdown(content);
        const result = ctx.assert.listClosure(doc);
        if (!result.passed) {
          throw new Error(`listClosure assertion failed for deeply nested lists: ${result.message}`);
        }
      },
    },
    {
      id: 'list-boundary-oversized',
      name: 'List closure passes for oversized document',
      description: 'Verifies that list markers are valid in a large document with many list items',
      tags: ['list', 'closure', 'boundary', 'oversized'],
      fixture: 'boundary/oversized-doc.md',
      run: async (ctx: TestContext) => {
        const content = ctx.fixture('boundary/oversized-doc.md');
        const doc = await ctx.parseMarkdown(content);
        const result = ctx.assert.listClosure(doc);
        if (!result.passed) {
          throw new Error(`listClosure assertion failed for oversized document: ${result.message}`);
        }
      },
    },
  ],
};
