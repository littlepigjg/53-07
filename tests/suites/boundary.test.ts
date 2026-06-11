import type { TestSuiteDefinition, TestContext } from '../framework/types.js';

export const boundarySuite: TestSuiteDefinition = {
  name: 'boundary',
  tests: [
    {
      id: 'boundary-empty-doc',
      name: 'Empty document fails documentNotEmpty',
      description: 'Verifies that a completely empty document fails the documentNotEmpty assertion',
      tags: ['boundary', 'empty'],
      fixture: 'boundary/empty-doc.md',
      run: async (ctx: TestContext) => {
        const content = ctx.fixture('boundary/empty-doc.md');
        const doc = await ctx.parseMarkdown(content);
        const result = ctx.assert.documentNotEmpty(doc);
        if (result.passed) {
          throw new Error('Expected documentNotEmpty to fail for empty document but it passed');
        }
      },
    },
    {
      id: 'boundary-malformed-html',
      name: 'Malformed HTML is detected by noRawHtml',
      description: 'Verifies that raw HTML tags in malformed-html.md are detected by the noRawHtml assertion',
      tags: ['boundary', 'html', 'security'],
      fixture: 'boundary/malformed-html.md',
      run: async (ctx: TestContext) => {
        const content = ctx.fixture('boundary/malformed-html.md');
        const doc = await ctx.parseMarkdown(content);
        const result = ctx.assert.noRawHtml(doc);
        if (result.passed) {
          throw new Error('Expected noRawHtml to detect HTML tags but it passed');
        }
      },
    },
    {
      id: 'boundary-oversized-doc',
      name: 'Oversized document passes documentNotEmpty and has many paragraphs',
      description: 'Verifies that an oversized document passes documentNotEmpty and contains more than 100 paragraphs',
      tags: ['boundary', 'oversized'],
      fixture: 'boundary/oversized-doc.md',
      run: async (ctx: TestContext) => {
        const content = ctx.fixture('boundary/oversized-doc.md');
        const doc = await ctx.parseMarkdown(content);
        const notEmptyResult = ctx.assert.documentNotEmpty(doc);
        if (!notEmptyResult.passed) {
          throw new Error(`documentNotEmpty failed for oversized document: ${notEmptyResult.message}`);
        }
        if (doc.paragraphs.length <= 100) {
          throw new Error(`Expected more than 100 paragraphs but found ${doc.paragraphs.length}`);
        }
      },
    },
    {
      id: 'boundary-deeply-nested',
      name: 'Deeply nested list passes listClosure',
      description: 'Verifies that deeply nested list structures pass the listClosure assertion',
      tags: ['boundary', 'list', 'nesting'],
      fixture: 'boundary/deeply-nested-list.md',
      run: async (ctx: TestContext) => {
        const content = ctx.fixture('boundary/deeply-nested-list.md');
        const doc = await ctx.parseMarkdown(content);
        const result = ctx.assert.listClosure(doc);
        if (!result.passed) {
          throw new Error(`listClosure failed for deeply nested lists: ${result.message}`);
        }
      },
    },
  ],
};
