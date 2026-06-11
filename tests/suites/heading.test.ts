import type { TestSuiteDefinition, TestContext } from '../framework/types.js';

export const headingSuite: TestSuiteDefinition = {
  name: 'heading',
  tests: [
    {
      id: 'heading-levels-correct',
      name: 'Heading levels are correctly parsed',
      description: 'Verifies that heading levels and content are parsed correctly from a well-formed markdown document',
      tags: ['heading', 'parsing'],
      fixture: 'valid/simple-markdown.md',
      run: async (ctx: TestContext) => {
        const content = ctx.fixture('valid/simple-markdown.md');
        const doc = await ctx.parseMarkdown(content);
        const result = ctx.assert.headingLevels(doc, [
          { level: 1, content: 'Document Title' },
          { level: 2, content: 'Section One' },
          { level: 3, content: 'Subsection' },
        ]);
        if (!result.passed) {
          throw new Error(`headingLevels assertion failed: ${result.message}`);
        }
      },
    },
    {
      id: 'heading-sequence-valid',
      name: 'Heading sequence is valid in simple document',
      description: 'Verifies that headings in simple-markdown.md follow a valid sequence without skipping levels',
      tags: ['heading', 'sequence'],
      fixture: 'valid/simple-markdown.md',
      run: async (ctx: TestContext) => {
        const content = ctx.fixture('valid/simple-markdown.md');
        const doc = await ctx.parseMarkdown(content);
        const result = ctx.assert.headingSequence(doc);
        if (!result.passed) {
          throw new Error(`headingSequence assertion failed: ${result.message}`);
        }
      },
    },
    {
      id: 'heading-skip-level-invalid',
      name: 'Heading skip level is detected as invalid',
      description: 'Verifies that heading sequence detects skipped levels in heading-skip-level.md',
      tags: ['heading', 'sequence', 'boundary'],
      fixture: 'boundary/heading-skip-level.md',
      run: async (ctx: TestContext) => {
        const content = ctx.fixture('boundary/heading-skip-level.md');
        const doc = await ctx.parseMarkdown(content);
        const result = ctx.assert.headingSequence(doc);
        if (result.passed) {
          throw new Error('Expected headingSequence to detect level skip but it passed');
        }
      },
    },
    {
      id: 'heading-empty-doc',
      name: 'Empty document has no headings',
      description: 'Verifies that an empty document fails the documentNotEmpty assertion',
      tags: ['heading', 'boundary', 'empty'],
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
  ],
};
