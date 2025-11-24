/**
 * Mock Obsidian Vault API for testing
 * Allows testing without running actual Obsidian
 */

export interface MockFile {
  path: string;
  name: string;
  basename: string;
  extension: string;
  stat: {
    ctime: number;
    mtime: number;
    size: number;
  };
}

export class MockVault {
  private files = new Map<string, string>();
  private stats = new Map<string, any>();

  constructor() {
    this.files = new Map();
    this.stats = new Map();
  }

  /**
   * Add a file to the mock vault
   */
  addFile(path: string, content: string): MockFile {
    this.files.set(path, content);
    this.stats.set(path, {
      ctime: Date.now(),
      mtime: Date.now(),
      size: content.length
    });

    return this.createMockFile(path);
  }

  /**
   * Read file content
   */
  async read(file: MockFile | string): Promise<string> {
    const path = typeof file === 'string' ? file : file.path;
    const content = this.files.get(path);

    if (content === undefined) {
      throw new Error(`File not found: ${path}`);
    }

    return content;
  }

  /**
   * Write/modify file content
   */
  async modify(file: MockFile | string, content: string): Promise<void> {
    const path = typeof file === 'string' ? file : file.path;
    this.files.set(path, content);

    // Update mtime
    const stat = this.stats.get(path);
    if (stat) {
      stat.mtime = Date.now();
      stat.size = content.length;
    }
  }

  /**
   * Create new file
   */
  async create(path: string, content: string): Promise<MockFile> {
    if (this.files.has(path)) {
      throw new Error(`File already exists: ${path}`);
    }

    return this.addFile(path, content);
  }

  /**
   * Delete file
   */
  async delete(file: MockFile | string): Promise<void> {
    const path = typeof file === 'string' ? file : file.path;
    this.files.delete(path);
    this.stats.delete(path);
  }

  /**
   * Get all markdown files
   */
  getMarkdownFiles(): MockFile[] {
    const files: MockFile[] = [];

    for (const [path, _] of this.files) {
      if (path.endsWith('.md')) {
        files.push(this.createMockFile(path));
      }
    }

    return files;
  }

  /**
   * Get file by path
   */
  getFileByPath(path: string): MockFile | null {
    if (!this.files.has(path)) {
      return null;
    }
    return this.createMockFile(path);
  }

  /**
   * Check if file exists
   */
  exists(path: string): boolean {
    return this.files.has(path);
  }

  /**
   * Get file stats
   */
  async stat(file: MockFile | string): Promise<any> {
    const path = typeof file === 'string' ? file : file.path;
    return this.stats.get(path) || null;
  }

  /**
   * Create MockFile object
   */
  private createMockFile(path: string): MockFile {
    const name = path.split('/').pop() || path;
    const basename = name.replace(/\.md$/, '');
    const stat = this.stats.get(path) || {
      ctime: Date.now(),
      mtime: Date.now(),
      size: this.files.get(path)?.length || 0
    };

    return {
      path,
      name,
      basename,
      extension: 'md',
      stat
    };
  }

  /**
   * Clear all files
   */
  clear(): void {
    this.files.clear();
    this.stats.clear();
  }

  /**
   * Get all file paths
   */
  getAllPaths(): string[] {
    return Array.from(this.files.keys());
  }
}

/**
 * Create a mock vault pre-populated with test-vault files
 */
export function createTestVault(): MockVault {
  const vault = new MockVault();

  // Add test-vault files
  vault.addFile('01-simple-note.md', `---
title: Simple Note
status: draft
---

# Simple Note

This is a simple note with basic frontmatter.
`);

  vault.addFile('02-with-tags.md', `---
title: Note with Tags
tags: [work, project, urgent]
status: active
priority: 5
---

# Note with Tags
`);

  // Add more as needed...

  return vault;
}
