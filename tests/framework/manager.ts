import fs from 'node:fs/promises';
import path from 'node:path';
import type { TestCase, TestCaseExport } from './types.js';

export class TestCaseManager {
  private dataDir: string;
  private filePath: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.filePath = path.join(dataDir, 'test-cases.json');
  }

  private async readAll(): Promise<TestCase[]> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(raw) as TestCase[];
    } catch {
      return [];
    }
  }

  private async writeAll(cases: TestCase[]): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(cases, null, 2), 'utf8');
  }

  async list(): Promise<TestCase[]> {
    return this.readAll();
  }

  async save(testCase: TestCase): Promise<void> {
    const cases = await this.readAll();
    const index = cases.findIndex((c) => c.id === testCase.id);
    const now = new Date().toISOString();

    if (index >= 0) {
      cases[index] = {
        ...testCase,
        version: cases[index].version + 1,
        updatedAt: now,
      };
    } else {
      cases.push(testCase);
    }

    await this.writeAll(cases);
  }

  async get(id: string): Promise<TestCase | null> {
    const cases = await this.readAll();
    return cases.find((c) => c.id === id) ?? null;
  }

  async remove(id: string): Promise<void> {
    const cases = await this.readAll();
    const filtered = cases.filter((c) => c.id !== id);
    await this.writeAll(filtered);
  }

  async import(data: TestCaseExport): Promise<number> {
    const cases = await this.readAll();
    let count = 0;

    for (const tc of data.testCases) {
      const duplicate = cases.find(
        (c) => c.id === tc.id && c.version === tc.version,
      );
      if (!duplicate) {
        cases.push(tc);
        count++;
      }
    }

    await this.writeAll(cases);
    return count;
  }

  async export(suiteNames?: string[]): Promise<TestCaseExport> {
    const cases = await this.readAll();
    const filtered = suiteNames
      ? cases.filter((c) => suiteNames.includes(c.suite))
      : cases;

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      testCases: filtered,
      suites: [...new Set(filtered.map((c) => c.suite))],
    };
  }

  async getVersions(id: string): Promise<number> {
    const tc = await this.get(id);
    return tc?.version ?? 0;
  }

  async listSuites(): Promise<string[]> {
    const cases = await this.readAll();
    return [...new Set(cases.map((c) => c.suite))];
  }

  async search(query: {
    suite?: string;
    tags?: string[];
    name?: string;
  }): Promise<TestCase[]> {
    const cases = await this.readAll();
    return cases.filter((c) => {
      if (query.suite && c.suite !== query.suite) return false;
      if (query.tags && query.tags.length > 0) {
        if (!query.tags.some((t) => c.tags.includes(t))) return false;
      }
      if (query.name) {
        if (!c.name.toLowerCase().includes(query.name.toLowerCase())) return false;
      }
      return true;
    });
  }
}
