import type { AssertionResult, DocumentAssertions } from './types.js';
import type { ParsedDocument, ParagraphType } from '../../shared/types.js';

export class DocumentAssertionsImpl implements DocumentAssertions {
  headingLevels(
    doc: ParsedDocument,
    expected: Array<{ level: number; content: string }>,
  ): AssertionResult {
    const headings = doc.paragraphs.filter((p) => p.type === 'heading');
    const actual = headings.map((h) => ({ level: h.level ?? 0, content: h.content }));

    if (actual.length !== expected.length) {
      return {
        name: 'headingLevels',
        passed: false,
        message: `Expected ${expected.length} headings but found ${actual.length}`,
        expected: JSON.stringify(expected),
        actual: JSON.stringify(actual),
      };
    }

    for (let i = 0; i < expected.length; i++) {
      if (actual[i].level !== expected[i].level || actual[i].content !== expected[i].content) {
        return {
          name: 'headingLevels',
          passed: false,
          message: `Heading at index ${i} mismatch`,
          expected: JSON.stringify(expected[i]),
          actual: JSON.stringify(actual[i]),
        };
      }
    }

    return {
      name: 'headingLevels',
      passed: true,
      message: 'All heading levels and content match',
    };
  }

  listClosure(doc: ParsedDocument): AssertionResult {
    const listParagraphs = doc.paragraphs.filter((p) => p.type === 'list');
    const invalid: string[] = [];
    const listMarkerRegex = /^(\s*[-*+]\s|\s*\d+\.\s)/;

    for (const p of listParagraphs) {
      const lines = p.content.split('\n');
      for (const line of lines) {
        if (line.trim().length > 0 && !listMarkerRegex.test(line)) {
          invalid.push(`Paragraph ${p.id}: "${line.substring(0, 50)}"`);
          break;
        }
      }
    }

    if (invalid.length > 0) {
      return {
        name: 'listClosure',
        passed: false,
        message: `List paragraphs with invalid markers: ${invalid.join('; ')}`,
        expected: 'Proper list markers (-, *, +, or digit.)',
        actual: `Found ${invalid.length} invalid list paragraph(s)`,
      };
    }

    return {
      name: 'listClosure',
      passed: true,
      message: 'All list paragraphs have proper markers',
    };
  }

  codeBlockHighlight(doc: ParsedDocument): AssertionResult {
    const codeParagraphs = doc.paragraphs.filter((p) => p.type === 'code');
    const warnings: string[] = [];

    for (const p of codeParagraphs) {
      const lines = p.content.split('\n');
      const openingLine = lines[0];
      if (openingLine && openingLine.startsWith('```') && openingLine.trim().length === 3) {
        warnings.push(`Paragraph ${p.id}: code block without language identifier`);
      }
    }

    if (warnings.length > 0) {
      return {
        name: 'codeBlockHighlight',
        passed: true,
        message: `Warnings: ${warnings.join('; ')}`,
      };
    }

    return {
      name: 'codeBlockHighlight',
      passed: true,
      message: 'All code blocks have language identifiers',
    };
  }

  paragraphCount(doc: ParsedDocument, expected: number): AssertionResult {
    const actual = doc.paragraphs.length;
    return {
      name: 'paragraphCount',
      passed: actual === expected,
      message:
        actual === expected
          ? 'Paragraph count matches'
          : `Expected ${expected} paragraphs but found ${actual}`,
      expected: String(expected),
      actual: String(actual),
    };
  }

  paragraphTypes(doc: ParsedDocument, expected: ParagraphType[]): AssertionResult {
    const actual = doc.paragraphs.map((p) => p.type);

    if (actual.length !== expected.length) {
      return {
        name: 'paragraphTypes',
        passed: false,
        message: `Expected ${expected.length} paragraph types but found ${actual.length}`,
        expected: expected.join(', '),
        actual: actual.join(', '),
      };
    }

    for (let i = 0; i < expected.length; i++) {
      if (actual[i] !== expected[i]) {
        return {
          name: 'paragraphTypes',
          passed: false,
          message: `Paragraph type at index ${i} mismatch`,
          expected: expected[i],
          actual: actual[i],
        };
      }
    }

    return {
      name: 'paragraphTypes',
      passed: true,
      message: 'Paragraph types match expected sequence',
    };
  }

  noEmptyParagraphs(doc: ParsedDocument): AssertionResult {
    const empty = doc.paragraphs.filter((p) => p.content.trim().length === 0);

    if (empty.length > 0) {
      return {
        name: 'noEmptyParagraphs',
        passed: false,
        message: `Found ${empty.length} empty paragraph(s): ${empty.map((p) => p.id).join(', ')}`,
        expected: 'No empty paragraphs',
        actual: `${empty.length} empty paragraph(s)`,
      };
    }

    return {
      name: 'noEmptyParagraphs',
      passed: true,
      message: 'No empty paragraphs found',
    };
  }

  headingSequence(doc: ParsedDocument): AssertionResult {
    const headings = doc.paragraphs.filter((p) => p.type === 'heading');

    if (headings.length <= 1) {
      return {
        name: 'headingSequence',
        passed: true,
        message: 'Heading sequence is valid',
      };
    }

    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1].level ?? 1;
      const curr = headings[i].level ?? 1;
      if (Math.abs(curr - prev) > 1) {
        return {
          name: 'headingSequence',
          passed: false,
          message: `Heading level skip from H${prev} to H${curr} at paragraph ${headings[i].id}`,
          expected: 'No heading level skips (max change of 1)',
          actual: `H${prev} -> H${curr}`,
        };
      }
    }

    return {
      name: 'headingSequence',
      passed: true,
      message: 'Heading sequence is valid',
    };
  }

  codeBlockClosure(doc: ParsedDocument): AssertionResult {
    const codeParagraphs = doc.paragraphs.filter((p) => p.type === 'code');
    let count = 0;

    for (const p of codeParagraphs) {
      const matches = p.content.match(/```/g);
      if (matches) {
        count += matches.length;
      }
    }

    if (count % 2 !== 0) {
      return {
        name: 'codeBlockClosure',
        passed: false,
        message: `Unclosed code block detected: found ${count} fence markers (odd number)`,
        expected: 'Even number of code fence markers',
        actual: `${count} markers`,
      };
    }

    return {
      name: 'codeBlockClosure',
      passed: true,
      message: 'All code blocks are properly closed',
    };
  }

  noRawHtml(doc: ParsedDocument): AssertionResult {
    const htmlRegex = /<[a-zA-Z][^>]*>/;
    const suspicious = doc.paragraphs.filter((p) => htmlRegex.test(p.content));

    if (suspicious.length > 0) {
      return {
        name: 'noRawHtml',
        passed: false,
        message: `Found raw HTML in ${suspicious.length} paragraph(s): ${suspicious.map((p) => p.id).join(', ')}`,
        expected: 'No raw HTML tags',
        actual: `HTML found in ${suspicious.length} paragraph(s)`,
      };
    }

    return {
      name: 'noRawHtml',
      passed: true,
      message: 'No raw HTML tags found',
    };
  }

  documentNotEmpty(doc: ParsedDocument): AssertionResult {
    if (doc.paragraphs.length === 0) {
      return {
        name: 'documentNotEmpty',
        passed: false,
        message: 'Document has no paragraphs',
        expected: 'At least 1 paragraph',
        actual: '0 paragraphs',
      };
    }

    return {
      name: 'documentNotEmpty',
      passed: true,
      message: `Document has ${doc.paragraphs.length} paragraph(s)`,
    };
  }
}

export function createAssertions(): DocumentAssertions {
  return new DocumentAssertionsImpl();
}
