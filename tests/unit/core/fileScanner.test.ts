/**
 * Tests for File Scanner - Folder matching logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { scanFiles } from '../../../src/core/fileScanner';
import { RuleScope } from '../../../src/types';
import { TFile, Vault } from 'obsidian';

// Mock Vault with test files
function createMockVault(filePaths: string[]): Vault {
	const mockFiles = filePaths.map(path => ({
		path,
		basename: path.split('/').pop()?.replace('.md', '') || '',
		extension: 'md',
		name: path.split('/').pop() || '',
	} as TFile));

	return {
		getMarkdownFiles: () => mockFiles,
	} as unknown as Vault;
}

describe('File Scanner - Folder Matching', () => {
	describe('Exact folder matching (no trailing slash)', () => {
		it('should match files in exact folder without trailing slash', async () => {
			const vault = createMockVault([
				'docs/samples/file1.md',
				'docs/samples/file2.md',
				'docs/samples-old/file3.md',
				'docs/samples2/file4.md',
			]);

			const scope: RuleScope = {
				type: 'folder',
				folder: 'docs/samples',
			};

			const result = await scanFiles(vault, scope);

			expect(result.matched).toHaveLength(2);
			expect(result.matched.map(f => f.path)).toEqual([
				'docs/samples/file1.md',
				'docs/samples/file2.md',
			]);
		});

		it('should NOT match similarly-named folders without trailing slash', async () => {
			const vault = createMockVault([
				'docs/samples/file1.md',
				'docs/samples-old/file2.md',
				'docs/samples-backup/file3.md',
				'docs/samples2/file4.md',
			]);

			const scope: RuleScope = {
				type: 'folder',
				folder: 'docs/samples',
			};

			const result = await scanFiles(vault, scope);

			expect(result.matched).toHaveLength(1);
			expect(result.matched[0].path).toBe('docs/samples/file1.md');
		});
	});

	describe('Exact folder matching (with trailing slash)', () => {
		it('should match files in exact folder with trailing slash', async () => {
			const vault = createMockVault([
				'docs/samples/file1.md',
				'docs/samples/file2.md',
				'docs/samples-old/file3.md',
			]);

			const scope: RuleScope = {
				type: 'folder',
				folder: 'docs/samples/',
			};

			const result = await scanFiles(vault, scope);

			expect(result.matched).toHaveLength(2);
			expect(result.matched.map(f => f.path)).toEqual([
				'docs/samples/file1.md',
				'docs/samples/file2.md',
			]);
		});

		it('should NOT match similarly-named folders with trailing slash', async () => {
			const vault = createMockVault([
				'docs/samples/file1.md',
				'docs/samples-old/file2.md',
				'docs/samples2/file3.md',
			]);

			const scope: RuleScope = {
				type: 'folder',
				folder: 'docs/samples/',
			};

			const result = await scanFiles(vault, scope);

			expect(result.matched).toHaveLength(1);
			expect(result.matched[0].path).toBe('docs/samples/file1.md');
		});
	});

	describe('Nested folder matching', () => {
		it('should match files in nested folders', async () => {
			const vault = createMockVault([
				'docs/samples/subfolder/file1.md',
				'docs/samples/deep/nested/file2.md',
				'docs/samples-old/subfolder/file3.md',
			]);

			const scope: RuleScope = {
				type: 'folder',
				folder: 'docs/samples',
			};

			const result = await scanFiles(vault, scope);

			expect(result.matched).toHaveLength(2);
			expect(result.matched.map(f => f.path).sort()).toEqual([
				'docs/samples/deep/nested/file2.md',
				'docs/samples/subfolder/file1.md',
			]);
		});

		it('should match specific nested folder only', async () => {
			const vault = createMockVault([
				'docs/samples/subfolder/file1.md',
				'docs/samples/other/file2.md',
				'docs/samples/subfolder-old/file3.md',
			]);

			const scope: RuleScope = {
				type: 'folder',
				folder: 'docs/samples/subfolder',
			};

			const result = await scanFiles(vault, scope);

			expect(result.matched).toHaveLength(1);
			expect(result.matched[0].path).toBe('docs/samples/subfolder/file1.md');
		});
	});

	describe('Root folder matching', () => {
		it('should match files in root folder', async () => {
			const vault = createMockVault([
				'samples/file1.md',
				'samples/file2.md',
				'samples-old/file3.md',
			]);

			const scope: RuleScope = {
				type: 'folder',
				folder: 'samples',
			};

			const result = await scanFiles(vault, scope);

			expect(result.matched).toHaveLength(2);
			expect(result.matched.map(f => f.path)).toEqual([
				'samples/file1.md',
				'samples/file2.md',
			]);
		});
	});

	describe('Edge cases', () => {
		it('should handle empty folder', async () => {
			const vault = createMockVault([
				'docs/other/file1.md',
			]);

			const scope: RuleScope = {
				type: 'folder',
				folder: 'docs/samples',
			};

			const result = await scanFiles(vault, scope);

			expect(result.matched).toHaveLength(0);
		});

		it('should handle folder with hyphens and underscores', async () => {
			const vault = createMockVault([
				'my-folder/my_file.md',
				'my-folder-backup/file.md',
				'my_folder/file.md',
			]);

			const scope: RuleScope = {
				type: 'folder',
				folder: 'my-folder',
			};

			const result = await scanFiles(vault, scope);

			expect(result.matched).toHaveLength(1);
			expect(result.matched[0].path).toBe('my-folder/my_file.md');
		});

		it('should handle vault scope (match all files)', async () => {
			const vault = createMockVault([
				'file1.md',
				'docs/file2.md',
				'docs/samples/file3.md',
			]);

			const scope: RuleScope = {
				type: 'vault',
			};

			const result = await scanFiles(vault, scope);

			expect(result.matched).toHaveLength(3);
		});
	});
});
