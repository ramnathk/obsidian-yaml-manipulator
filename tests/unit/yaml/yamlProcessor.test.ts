/**
 * Tests for YAML Processor
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
	readFrontmatter,
	writeFrontmatter,
	hasFrontmatter,
	createFrontmatter,
	parseYamlString,
	objectToYamlString
} from '../../../src/yaml/yamlProcessor';

// Mock App and TFile
class MockApp {
	vault: any;

	constructor() {
		const files = new Map<string, string>();

		this.vault = {
			read: async (file: any) => {
				const content = files.get(file.path);
				if (!content) throw new Error('File not found');
				return content;
			},
			modify: async (file: any, content: string) => {
				files.set(file.path, content);
			},
			_setFileContent: (path: string, content: string) => {
				files.set(path, content);
			},
			_getFileContent: (path: string) => files.get(path),
		};
	}
}

function createMockFile(path: string): any {
	return {
		path,
		basename: path.replace('.md', ''),
		name: path.split('/').pop() || '',
	};
}

describe('YAML Processor', () => {
	let mockApp: MockApp;

	beforeEach(() => {
		mockApp = new MockApp();
	});

	describe('readFrontmatter', () => {
		it('should read simple frontmatter', async () => {
			const file = createMockFile('test.md');
			mockApp.vault._setFileContent('test.md', '---\ntitle: Test\nstatus: draft\n---\nContent here');

			const result = await readFrontmatter(mockApp as any, file);

			expect(result.data).toEqual({ title: 'Test', status: 'draft' });
			expect(result.content).toBe('Content here');
		});

		it('should read empty frontmatter', async () => {
			const file = createMockFile('test.md');
			mockApp.vault._setFileContent('test.md', '---\n---\nContent');

			const result = await readFrontmatter(mockApp as any, file);

			expect(result.data).toEqual({});
			expect(result.content).toBe('Content');
		});

		it('should handle files without frontmatter', async () => {
			const file = createMockFile('test.md');
			mockApp.vault._setFileContent('test.md', 'Just content, no frontmatter');

			const result = await readFrontmatter(mockApp as any, file);

			expect(result.data).toEqual({});
			expect(result.content).toBe('Just content, no frontmatter');
		});

		it('should throw on malformed YAML', async () => {
			const file = createMockFile('test.md');
			mockApp.vault._setFileContent('test.md', '---\ntitle: Test\ninvalid: [unclosed\n---\n');

			await expect(readFrontmatter(mockApp as any, file)).rejects.toThrow();
		});

		it('should handle nested objects', async () => {
			const file = createMockFile('test.md');
			mockApp.vault._setFileContent('test.md', '---\nmetadata:\n  author: John\n  version: 1.0\n---\n');

			const result = await readFrontmatter(mockApp as any, file);

			expect(result.data.metadata).toEqual({ author: 'John', version: 1.0 });
		});

		it('should handle arrays', async () => {
			const file = createMockFile('test.md');
			mockApp.vault._setFileContent('test.md', '---\ntags:\n  - work\n  - urgent\n---\n');

			const result = await readFrontmatter(mockApp as any, file);

			expect(result.data.tags).toEqual(['work', 'urgent']);
		});
	});

	describe('writeFrontmatter', () => {
		it('should write frontmatter to file', async () => {
			const file = createMockFile('test.md');
			const data = { title: 'New Title', status: 'published' };
			const content = 'Content here';

			await writeFrontmatter(mockApp as any, file, data, content);

			const written = mockApp.vault._getFileContent('test.md');
			expect(written).toContain('title: New Title');
			expect(written).toContain('status: published');
			expect(written).toContain('Content here');
		});

		it('should preserve content', async () => {
			const file = createMockFile('test.md');
			const data = { status: 'updated' };
			const content = 'Original content\nWith multiple lines';

			await writeFrontmatter(mockApp as any, file, data, content);

			const written = mockApp.vault._getFileContent('test.md');
			expect(written).toContain('Original content\nWith multiple lines');
		});

		it('should handle empty frontmatter', async () => {
			const file = createMockFile('test.md');
			await writeFrontmatter(mockApp as any, file, {}, 'Content');

			const written = mockApp.vault._getFileContent('test.md');
			expect(written).toBe('Content\n'); // gray-matter adds newline
		});
	});

	describe('hasFrontmatter', () => {
		it('should detect frontmatter', () => {
			expect(hasFrontmatter('---\ntitle: Test\n---\nContent')).toBe(true);
			expect(hasFrontmatter('---\n---\nContent')).toBe(true);
		});

		it('should return false for no frontmatter', () => {
			expect(hasFrontmatter('Just content')).toBe(false);
			expect(hasFrontmatter('Content with --- in middle')).toBe(false);
		});

		it('should return false for unclosed frontmatter', () => {
			expect(hasFrontmatter('---\ntitle: Test\nNo closing')).toBe(false);
		});

		it('should return false for empty string', () => {
			expect(hasFrontmatter('')).toBe(false);
		});
	});

	describe('createFrontmatter', () => {
		it('should create frontmatter string', () => {
			const result = createFrontmatter({ title: 'Test', status: 'draft' }, 'Content');

			expect(result).toContain('---');
			expect(result).toContain('title: Test');
			expect(result).toContain('status: draft');
			expect(result).toContain('Content');
		});

		it('should handle empty data', () => {
			const result = createFrontmatter({}, 'Content');
			expect(result).toBe('Content\n'); // gray-matter adds newline
		});
	});

	describe('parseYamlString', () => {
		it('should parse YAML string to object', () => {
			const result = parseYamlString('title: Test\nstatus: draft');
			expect(result).toEqual({ title: 'Test', status: 'draft' });
		});

		it('should throw on malformed YAML', () => {
			expect(() => parseYamlString('invalid: [unclosed')).toThrow('Malformed YAML');
		});
	});

	describe('objectToYamlString', () => {
		it('should convert object to YAML string', () => {
			const result = objectToYamlString({ title: 'Test', count: 5 });
			expect(result).toContain('title: Test');
			expect(result).toContain('count: 5');
		});

		it('should handle arrays', () => {
			const result = objectToYamlString({ tags: ['work', 'urgent'] });
			expect(result).toContain('tags:');
			expect(result).toContain('- work');
			expect(result).toContain('- urgent');
		});

		it('should handle nested objects', () => {
			const result = objectToYamlString({ metadata: { author: 'John' } });
			expect(result).toContain('metadata:');
			expect(result).toContain('author: John');
		});
	});
});
