/**
 * Tests for Path Normalizer
 */

import { describe, it, expect } from 'vitest';
import {
	normalizePath,
	joinPath,
	getParentFolder,
	isValidPath,
	getFileName,
	getExtension
} from '../../../src/utils/pathNormalizer';

describe('Path Normalizer', () => {
	describe('normalizePath', () => {
		it('should normalize forward slashes', () => {
			expect(normalizePath('folder/subfolder/file.md')).toBe('folder/subfolder/file.md');
		});

		it('should normalize backslashes to forward slashes', () => {
			expect(normalizePath('folder\\subfolder\\file.md')).toBe('folder/subfolder/file.md');
		});

		it('should handle mixed slashes', () => {
			expect(normalizePath('folder\\subfolder/file.md')).toBe('folder/subfolder/file.md');
		});

		it('should handle empty string', () => {
			expect(normalizePath('')).toBe('');
		});

		it('should handle trailing slashes', () => {
			// Obsidian's normalizePath preserves trailing slashes
			expect(normalizePath('folder/')).toBe('folder/');
			expect(normalizePath('folder/subfolder/')).toBe('folder/subfolder/');
		});
	});

	describe('joinPath', () => {
		it('should join path segments', () => {
			expect(joinPath('folder', 'file.md')).toBe('folder/file.md');
			expect(joinPath('folder', 'subfolder', 'file.md')).toBe('folder/subfolder/file.md');
		});

		it('should handle leading slashes', () => {
			expect(joinPath('folder/', '/subfolder')).toBe('folder/subfolder');
		});

		it('should handle trailing slashes', () => {
			expect(joinPath('folder/', 'subfolder/')).toBe('folder/subfolder');
		});

		it('should handle empty parts', () => {
			expect(joinPath('folder', '', 'file.md')).toBe('folder/file.md');
		});

		it('should handle no arguments', () => {
			expect(joinPath()).toBe('');
		});

		it('should handle single argument', () => {
			expect(joinPath('file.md')).toBe('file.md');
		});
	});

	describe('getParentFolder', () => {
		it('should get parent folder', () => {
			expect(getParentFolder('folder/subfolder/file.md')).toBe('folder/subfolder');
			expect(getParentFolder('folder/file.md')).toBe('folder');
		});

		it('should return empty for root files', () => {
			expect(getParentFolder('file.md')).toBe('');
		});

		it('should handle empty string', () => {
			expect(getParentFolder('')).toBe('');
		});

		it('should handle backslashes', () => {
			expect(getParentFolder('folder\\subfolder\\file.md')).toBe('folder/subfolder');
		});
	});

	describe('isValidPath', () => {
		it('should validate correct paths', () => {
			expect(isValidPath('folder/file.md')).toBe(true);
			expect(isValidPath('folder/subfolder/file.md')).toBe(true);
			expect(isValidPath('file.md')).toBe(true);
		});

		it('should reject empty paths', () => {
			expect(isValidPath('')).toBe(false);
			expect(isValidPath('   ')).toBe(false);
		});

		it('should reject paths with invalid characters', () => {
			expect(isValidPath('folder/<>file.md')).toBe(false);
			expect(isValidPath('folder/file:test.md')).toBe(false);
			expect(isValidPath('folder/file|test.md')).toBe(false);
			expect(isValidPath('folder/file?.md')).toBe(false);
			expect(isValidPath('folder/file*.md')).toBe(false);
		});

		it('should reject paths with dots', () => {
			expect(isValidPath('folder/./file.md')).toBe(false);
			expect(isValidPath('folder/../file.md')).toBe(false);
		});

		it('should allow hyphens and underscores', () => {
			expect(isValidPath('my-folder/my_file.md')).toBe(true);
		});
	});

	describe('getFileName', () => {
		it('should get file name from path', () => {
			expect(getFileName('folder/subfolder/file.md')).toBe('file.md');
			expect(getFileName('folder/file.md')).toBe('file.md');
			expect(getFileName('file.md')).toBe('file.md');
		});

		it('should handle empty string', () => {
			expect(getFileName('')).toBe('');
		});

		it('should handle backslashes', () => {
			expect(getFileName('folder\\file.md')).toBe('file.md');
		});
	});

	describe('getExtension', () => {
		it('should get file extension', () => {
			expect(getExtension('file.md')).toBe('.md');
			expect(getExtension('document.txt')).toBe('.txt');
		});

		it('should handle files without extension', () => {
			expect(getExtension('file')).toBe('');
		});

		it('should handle multiple dots', () => {
			expect(getExtension('file.tar.gz')).toBe('.gz');
		});

		it('should handle hidden files', () => {
			expect(getExtension('.gitignore')).toBe('');
		});

		it('should handle paths with folders', () => {
			expect(getExtension('folder/file.md')).toBe('.md');
		});
	});
});
