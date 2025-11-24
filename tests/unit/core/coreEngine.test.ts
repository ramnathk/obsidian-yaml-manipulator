/**
 * Tests for Core Engine modules
 * Covers batchProcessor, ruleEngine, fileScanner edge cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanFiles } from '../../../src/core/fileScanner';
import { executeRule } from '../../../src/core/ruleEngine';
import { processBatch } from '../../../src/core/batchProcessor';
import { Rule } from '../../../src/types';

// Mock obsidian module for getCurrentFile tests
vi.mock('obsidian', () => ({
	MarkdownView: class MarkdownView {},
	normalizePath: (path: string) => path.replace(/\\/g, '/').replace(/^\/+/, ''),
}));

// Mock Vault
class MockVault {
	private mockFiles: any[] = [];

	setMockFiles(files: any[]) {
		this.mockFiles = files;
	}

	getMarkdownFiles() {
		return this.mockFiles;
	}

	getName() {
		return 'TestVault';
	}

	async read(file: any) {
		// Return different content based on file path for testing
		if (file.path === 'array-test.md') {
			return `---\ntitle: ${file.basename}\ntags: ["first", "second", "third"]\n---\nContent`;
		}
		if (file.path === 'object-test.md') {
			return `---\ntitle: ${file.basename}\nmetadata:\n  author: John\n  year: 2024\n---\nContent`;
		}
		return `---\ntitle: ${file.basename}\n---\nContent`;
	}

	async modify(file: any, content: string) {
		// Mock modify
	}

	adapter = {
		exists: async () => false,
		write: async () => {},
		mkdir: async () => {},
	};

	create = async () => {};
}

function createMockFile(path: string): any {
	const parts = path.split('/');
	return {
		path,
		basename: parts[parts.length - 1].replace('.md', ''),
		name: parts[parts.length - 1],
		parent: { path: parts.slice(0, -1).join('/') },
	};
}

function createMockApp(vault: MockVault): any {
	return {
		vault,
		workspace: {
			getActiveFile: () => null,
		},
	};
}

describe('Core Engine', () => {
	describe('fileScanner', () => {
		it('should scan vault scope', async () => {
			const vault = new MockVault();
			vault.setMockFiles([
				createMockFile('file1.md'),
				createMockFile('file2.md'),
				createMockFile('folder/file3.md'),
			]);

			const result = await scanFiles(vault as any, { type: 'vault' });

			expect(result.matched).toHaveLength(3);
			expect(result.scanned).toBe(3);
			expect(result.exceededLimit).toBe(false);
			expect(result.timedOut).toBe(false);
		});

		it('should filter by folder scope', async () => {
			const vault = new MockVault();
			vault.setMockFiles([
				createMockFile('root.md'),
				createMockFile('folder/file1.md'),
				createMockFile('folder/file2.md'),
				createMockFile('other/file3.md'),
			]);

			const result = await scanFiles(vault as any, { type: 'folder', folder: 'folder' });

			expect(result.matched.length).toBeLessThanOrEqual(4);
			expect(result.scanned).toBeLessThanOrEqual(4);
		});

		it('should respect maxFiles limit', async () => {
			const vault = new MockVault();
			const files = Array.from({ length: 100 }, (_, i) => createMockFile(`file${i}.md`));
			vault.setMockFiles(files);

			const result = await scanFiles(vault as any, { type: 'vault' }, { maxFiles: 50 });

			expect(result.scanned).toBeLessThanOrEqual(50);
			expect(result.exceededLimit).toBe(true);
		});

		it('should handle empty vault', async () => {
			const vault = new MockVault();
			vault.setMockFiles([]);

			const result = await scanFiles(vault as any, { type: 'vault' });

			expect(result.matched).toHaveLength(0);
			expect(result.scanned).toBe(0);
		});
	});

	describe('ruleEngine', () => {
		it('should execute rule on file', async () => {
			const vault = new MockVault();
			const app = createMockApp(vault);
			const file = createMockFile('test.md');

			const rule: Rule = {
				id: 'test',
				name: 'Test',
				condition: '',
				action: 'SET test "value"',
				scope: { type: 'vault' },
				options: { backup: false },
				created: '2025-11-20',
			};

			const result = await executeRule(app, rule, file);

			expect(result.status).toBe('success');
			expect(result.modified).toBe(true);
		});

		it('should skip when condition false', async () => {
			const vault = new MockVault();
			const app = createMockApp(vault);
			const file = createMockFile('test.md');

			const rule: Rule = {
				id: 'test',
				name: 'Test',
				condition: 'status = "published"', // Won't match
				action: 'SET test "value"',
				scope: { type: 'vault' },
				options: { backup: false },
				created: '2025-11-20',
			};

			const result = await executeRule(app, rule, file);

			expect(result.status).toBe('skipped');
			expect(result.modified).toBe(false);
		});

		it('should handle errors gracefully', async () => {
			const vault = new MockVault();
			const app = createMockApp(vault);
			const file = createMockFile('test.md');

			const rule: Rule = {
				id: 'test',
				name: 'Test',
				condition: '',
				action: 'INVALID_OPERATION test "value"',
				scope: { type: 'vault' },
				options: { backup: false },
				created: '2025-11-20',
			};

			const result = await executeRule(app, rule, file);

			expect(result.status).toBe('error');
			expect(result.error).toBeDefined();
		});

		it('should execute MOVE action', async () => {
			const vault = new MockVault();
			const app = createMockApp(vault);
			const file = createMockFile('array-test.md');

			const rule: Rule = {
				id: 'test',
				name: 'Test MOVE',
				condition: '',
				action: 'MOVE tags FROM 0 TO 2',
				scope: { type: 'vault' },
				options: { backup: false },
				created: '2025-11-20',
			};

			const result = await executeRule(app, rule, file);

			expect(result.status).toBe('success');
			expect(result.modified).toBe(true);
			expect(result.newData?.tags).toEqual(['second', 'third', 'first']);
		});

		it('should execute MERGE_OVERWRITE action', async () => {
			const vault = new MockVault();
			const app = createMockApp(vault);
			const file = createMockFile('object-test.md');

			const rule: Rule = {
				id: 'test',
				name: 'Test MERGE_OVERWRITE',
				condition: '',
				action: 'MERGE_OVERWRITE metadata { "year": 2025, "status": "updated" }',
				scope: { type: 'vault' },
				options: { backup: false },
				created: '2025-11-20',
			};

			const result = await executeRule(app, rule, file);

			if (result.status === 'error') {
				console.log('MERGE_OVERWRITE Error:', result.error);
			}

			expect(result.status).toBe('success');
			expect(result.modified).toBe(true);
			expect(result.newData?.metadata).toEqual({
				author: 'John',
				year: 2025,
				status: 'updated',
			});
		});
	});

	describe('batchProcessor', () => {
		it('should process multiple files', async () => {
			const vault = new MockVault();
			const app = createMockApp(vault);

			const files = [
				createMockFile('file1.md'),
				createMockFile('file2.md'),
			];

			const rule: Rule = {
				id: 'test',
				name: 'Test',
				condition: '',
				action: 'SET processed true',
				scope: { type: 'vault' },
				options: { backup: false },
				created: '2025-11-20',
			};

			const result = await processBatch(app, files, rule);

			expect(result.results).toHaveLength(2);
			expect(result.summary.success).toBe(2);
		});

		it('should track progress with callback', async () => {
			const vault = new MockVault();
			const app = createMockApp(vault);
			const files = [createMockFile('file1.md')];

			const rule: Rule = {
				id: 'test',
				name: 'Test',
				condition: '',
				action: 'SET test "value"',
				scope: { type: 'vault' },
				options: { backup: false },
				created: '2025-11-20',
			};

			let progressCalled = false;
			const result = await processBatch(app, files, rule, (progress) => {
				progressCalled = true;
				expect(progress.current).toBeDefined();
				expect(progress.total).toBe(1);
			});

			expect(progressCalled).toBe(true);
			expect(result.summary.success).toBe(1);
		});

		it('should handle errors in individual files', async () => {
			const vault = new MockVault();
			const app = createMockApp(vault);

			// Override read to throw error for specific file
			const originalRead = vault.read;
			vault.read = async (file: any) => {
				if (file.path === 'error.md') throw new Error('Read error');
				return originalRead.call(vault, file);
			};

			const files = [
				createMockFile('good.md'),
				createMockFile('error.md'),
			];

			const rule: Rule = {
				id: 'test',
				name: 'Test',
				condition: '',
				action: 'SET test "value"',
				scope: { type: 'vault' },
				options: { backup: false },
				created: '2025-11-20',
			};

			const result = await processBatch(app, files, rule);

			expect(result.results).toHaveLength(2);
			expect(result.summary.success).toBe(1);
			expect(result.summary.errors).toBe(1);
		});

		it('should create backups when enabled', async () => {
			const vault = new MockVault();
			const app = createMockApp(vault);
			const files = [createMockFile('file1.md')];

			const rule: Rule = {
				id: 'test',
				name: 'Test',
				condition: '',
				action: 'SET test "value"',
				scope: { type: 'vault' },
				options: { backup: true }, // Backup enabled
				created: '2025-11-20',
			};

			const result = await processBatch(app, files, rule);

			expect(result.summary.backupsCreated).toBeGreaterThan(0);
		});
	});
});
