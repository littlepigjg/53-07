import type { TestSuiteDefinition, TestContext } from '../framework/types.js';

export const codeBlockSuite: TestSuiteDefinition = {
  name: 'code-block',
  tests: [
    {
      id: 'code-block-highlight-present',
      name: 'Code block has language highlight identifier',
      description: 'Verifies that code blocks in simple-markdown.md have language identifiers for syntax highlighting',
      tags: ['code-block', 'highlight'],
      fixture: 'valid/simple-markdown.md',
      run: async (ctx: TestContext) => {
        const content = ctx.fixture('valid/simple-markdown.md');
        const doc = await ctx.parseMarkdown(content);
        const result = ctx.assert.codeBlockHighlight(doc);
        if (!result.passed) {
          throw new Error(`codeBlockHighlight assertion failed: ${result.message}`);
        }
      },
    },
    {
      id: 'code-block-unclosed',
      name: 'Unclosed code block is detected',
      description: 'Verifies that an unclosed code fence is detected as a closure failure',
      tags: ['code-block', 'closure', 'boundary'],
      fixture: 'boundary/unclosed-code-block.md',
      run: async (ctx: TestContext) => {
        const content = ctx.fixture('boundary/unclosed-code-block.md');
        const doc = await ctx.parseMarkdown(content);
        const result = ctx.assert.codeBlockClosure(doc);
        if (result.passed) {
          throw new Error('Expected codeBlockClosure to detect unclosed code block but it passed');
        }
      },
    },
    {
      id: 'code-block-highlight-missing',
      name: 'Code block without language tag produces warning',
      description: 'Verifies that a code block without a language identifier passes but includes a warning message',
      tags: ['code-block', 'highlight', 'warning'],
      run: async (ctx: TestContext) => {
        const markdown = '# Test\n\n```\nconst x = 1;\n```\n';
        const doc = await ctx.parseMarkdown(markdown);
        const result = ctx.assert.codeBlockHighlight(doc);
        if (!result.passed) {
          throw new Error(`codeBlockHighlight assertion failed: ${result.message}`);
        }
        if (!result.message.toLowerCase().includes('warning')) {
          throw new Error(`Expected warning in message but got: ${result.message}`);
        }
      },
    },
  ],
};
