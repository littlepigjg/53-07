import type { MockFileSystem } from './types.js';

export class MockFileSystemImpl implements MockFileSystem {
  private storage = new Map<string, string>();

  writeFile(path: string, content: string): void {
    this.storage.set(path, content);
  }

  readFile(path: string): string {
    const content = this.storage.get(path);
    if (content === undefined) {
      throw new Error(`File not found: ${path}`);
    }
    return content;
  }

  exists(path: string): boolean {
    return this.storage.has(path);
  }

  deleteFile(path: string): void {
    this.storage.delete(path);
  }

  listFiles(dir: string): string[] {
    const prefix = dir.endsWith('/') ? dir : dir + '/';
    return [...this.storage.keys()].filter((key) => key.startsWith(prefix));
  }

  reset(): void {
    this.storage.clear();
  }

  snapshot(): Record<string, string> {
    return Object.fromEntries(this.storage);
  }
}

export function createMockFs(): MockFileSystem {
  return new MockFileSystemImpl();
}

export interface FsStubs {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  unlink(path: string): Promise<void>;
  access(path: string): Promise<void>;
  readdir(dir: string): Promise<string[]>;
}

export function injectMockFs(mockFs: MockFileSystem): FsStubs {
  return {
    readFile: async (path: string) => mockFs.readFile(path),
    writeFile: async (path: string, content: string) => {
      mockFs.writeFile(path, content);
    },
    unlink: async (path: string) => {
      mockFs.deleteFile(path);
    },
    access: async (path: string) => {
      if (!mockFs.exists(path)) {
        throw new Error(`ENOENT: no such file or directory, access '${path}'`);
      }
    },
    readdir: async (dir: string) => mockFs.listFiles(dir),
  };
}

export class MockFileStorageService {
  constructor(private mockFs: MockFileSystem) {}

  async readJson<T>(filePath: string, defaultValue: T): Promise<T> {
    try {
      const raw = this.mockFs.readFile(filePath);
      return raw.trim() ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  async writeJson<T>(filePath: string, data: T): Promise<void> {
    this.mockFs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async deleteFile(filePath: string): Promise<void> {
    this.mockFs.deleteFile(filePath);
  }
}
