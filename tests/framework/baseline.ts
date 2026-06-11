import fs from 'node:fs/promises';
import path from 'node:path';
import type { BaselineSnapshot, RegressionDiff } from './types.js';
import type { ParsedDocument } from '../../shared/types.js';

export class BaselineManager {
  private baselinesDir: string;

  constructor(baselinesDir: string) {
    this.baselinesDir = baselinesDir;
  }

  async saveBaseline(testCaseId: string, doc: ParsedDocument): Promise<BaselineSnapshot> {
    await fs.mkdir(this.baselinesDir, { recursive: true });

    const existing = await this.loadBaseline(testCaseId);
    const version = existing ? existing.version + 1 : 1;

    const snapshot: BaselineSnapshot = {
      testCaseId,
      version,
      timestamp: new Date().toISOString(),
      paragraphs: doc.paragraphs.map((p) => ({
        type: p.type,
        ...(p.level !== undefined ? { level: p.level } : {}),
        content: p.content,
      })),
    };

    const filePath = path.join(this.baselinesDir, `${testCaseId}.json`);
    await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf8');

    return snapshot;
  }

  async loadBaseline(testCaseId: string): Promise<BaselineSnapshot | null> {
    const filePath = path.join(this.baselinesDir, `${testCaseId}.json`);
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      return JSON.parse(raw) as BaselineSnapshot;
    } catch {
      return null;
    }
  }

  async compareWithBaseline(testCaseId: string, doc: ParsedDocument): Promise<RegressionDiff> {
    const baseline = await this.loadBaseline(testCaseId);

    if (!baseline) {
      return {
        testCaseId,
        baselineVersion: 0,
        currentVersion: 1,
        changes: doc.paragraphs.map((p, i) => ({
          kind: 'added' as const,
          path: `paragraphs[${i}]`,
          current: `${p.type}${p.level !== undefined ? `:${p.level}` : ''}:${p.content}`,
        })),
        isRegression: false,
      };
    }

    const changes: RegressionDiff['changes'] = [];
    const maxLen = Math.max(baseline.paragraphs.length, doc.paragraphs.length);

    for (let i = 0; i < maxLen; i++) {
      const baseP = baseline.paragraphs[i];
      const currP = doc.paragraphs[i];

      if (!baseP && currP) {
        changes.push({
          kind: 'added',
          path: `paragraphs[${i}]`,
          current: `${currP.type}${currP.level !== undefined ? `:${currP.level}` : ''}:${currP.content}`,
        });
      } else if (baseP && !currP) {
        changes.push({
          kind: 'removed',
          path: `paragraphs[${i}]`,
          baseline: `${baseP.type}${baseP.level !== undefined ? `:${baseP.level}` : ''}:${baseP.content}`,
        });
      } else if (baseP && currP) {
        const baseStr = `${baseP.type}${baseP.level !== undefined ? `:${baseP.level}` : ''}:${baseP.content}`;
        const currStr = `${currP.type}${currP.level !== undefined ? `:${currP.level}` : ''}:${currP.content}`;

        if (baseStr !== currStr) {
          changes.push({
            kind: 'modified',
            path: `paragraphs[${i}]`,
            baseline: baseStr,
            current: currStr,
          });
        }
      }
    }

    const isRegression = changes.some(
      (c) => c.kind === 'removed' || c.kind === 'modified',
    );

    return {
      testCaseId,
      baselineVersion: baseline.version,
      currentVersion: baseline.version + 1,
      changes,
      isRegression,
    };
  }

  async listBaselines(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.baselinesDir);
      return entries
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.slice(0, -'.json'.length));
    } catch {
      return [];
    }
  }

  async deleteBaseline(testCaseId: string): Promise<void> {
    const filePath = path.join(this.baselinesDir, `${testCaseId}.json`);
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore
    }
  }
}
