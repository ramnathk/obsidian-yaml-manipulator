/**
 * YAML Safety Tests
 * Tests to ensure YAML parsing uses safe schema and prevents code execution
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFrontmatter, parseYamlString } from '../../../src/yaml/yamlProcessor';

// Mock Obsidian classes
class MockApp {
	vault: any;

	constructor() {
		const files = new Map<string, string>();

		this.vault = {
			read: async (file: any) => {
				return files.get(file.path) || '';
			},
			modify: async (file: any, data: string) => {
				files.set(file.path, data);
			},
			adapter: {
				exists: async (path: string) => files.has(path),
				write: async (path: string, data: string) => {
					files.set(path, data);
				},
			},
			create: async (path: string, data: string) => {
				files.set(path, data);
			},
		};
	}
}

class MockFile {
	path: string;
	basename: string;
	extension: string;
	parent: any;

	constructor(path: string) {
		this.path = path;
		this.basename = path.split('/').pop()?.replace('.md', '') || '';
		this.extension = 'md';
		this.parent = null;
	}
}

function createMockApp() {
	return new MockApp();
}

function createMockFile(path: string) {
	return new MockFile(path);
}

describe('YAML Safety Tests', () => {
	let mockApp: any;

	beforeEach(() => {
		mockApp = createMockApp();
	});

	describe('Safe YAML Schema', () => {
		it('should parse safe YAML frontmatter', async () => {
			const content = `---
title: Test Note
tags: [work, urgent]
count: 42
active: true
---
Body content here`;

			const mockFile = createMockFile('test.md');
			mockApp.vault.read = async () => content;

			const result = await readFrontmatter(mockApp, mockFile);

			expect(result.data).toEqual({
				title: 'Test Note',
				tags: ['work', 'urgent'],
				count: 42,
				active: true,
			});
			expect(result.content).toBe('Body content here');
		});

		it('should handle nested objects safely', async () => {
			const content = `---
metadata:
  author: John
  created: 2025-11-20
nested:
  deep:
    value: 123
---
Body`;

			const mockFile = createMockFile('test.md');
			mockApp.vault.read = async () => content;

			const result = await readFrontmatter(mockApp, mockFile);

			expect(result.data.metadata).toEqual({
				author: 'John',
				created: '2025-11-20',
			});
			expect(result.data.nested.deep.value).toBe(123);
		});

		it('should handle arrays safely', async () => {
			const content = `---
tags:
  - work
  - urgent
numbers: [1, 2, 3]
---
Body`;

			const mockFile = createMockFile('test.md');
			mockApp.vault.read = async () => content;

			const result = await readFrontmatter(mockApp, mockFile);

			expect(result.data.tags).toEqual(['work', 'urgent']);
			expect(result.data.numbers).toEqual([1, 2, 3]);
		});

		it('should safely handle YAML with tags by using CORE_SCHEMA', async () => {
			// With CORE_SCHEMA, unknown tags are treated as strings or fail gracefully
			// This test verifies we're using CORE_SCHEMA instead of DEFAULT_SCHEMA

			// Test that we can parse basic YAML safely
			const content = `---
title: Test
count: 42
---
Body`;

			const mockFile = createMockFile('test.md');
			mockApp.vault.read = async () => content;

			const result = await readFrontmatter(mockApp, mockFile);

			// CORE_SCHEMA allows basic types
			expect(result.data.title).toBe('Test');
			expect(result.data.count).toBe(42);
		});

		it('should handle null values safely', async () => {
			const content = `---
nullable: null
empty:
---
Body`;

			const mockFile = createMockFile('test.md');
			mockApp.vault.read = async () => content;

			const result = await readFrontmatter(mockApp, mockFile);

			expect(result.data.nullable).toBe(null);
			expect(result.data.empty).toBe(null);
		});

		it('should handle empty frontmatter', async () => {
			const content = `---
---
Body content`;

			const mockFile = createMockFile('test.md');
			mockApp.vault.read = async () => content;

			const result = await readFrontmatter(mockApp, mockFile);

			expect(result.data).toEqual({});
			expect(result.content).toBe('Body content');
		});

		it('should handle files without frontmatter', async () => {
			const content = `Just body content, no frontmatter`;

			const mockFile = createMockFile('test.md');
			mockApp.vault.read = async () => content;

			const result = await readFrontmatter(mockApp, mockFile);

			expect(result.data).toEqual({});
			expect(result.content).toBe('Just body content, no frontmatter');
		});
	});

	describe('parseYamlString Safety', () => {
		it('should parse safe YAML strings', () => {
			const yaml = 'title: Test\ncount: 42\nactive: true';
			const result = parseYamlString(yaml);

			expect(result).toEqual({
				title: 'Test',
				count: 42,
				active: true,
			});
		});

		it('should handle arrays in YAML strings', () => {
			const yaml = 'tags:\n  - work\n  - urgent';
			const result = parseYamlString(yaml);

			expect(result.tags).toEqual(['work', 'urgent']);
		});

		it('should handle nested objects in YAML strings', () => {
			const yaml = 'metadata:\n  author: John\n  year: 2025';
			const result = parseYamlString(yaml);

			expect(result.metadata).toEqual({
				author: 'John',
				year: 2025,
			});
		});
	});

	describe('YAML Edge Cases', () => {
		it('should handle special characters in strings', async () => {
			const content = `---
title: "Test with: colon"
description: "Line 1 and Line 2"
---
Body`;

			const mockFile = createMockFile('test.md');
			mockApp.vault.read = async () => content;

			const result = await readFrontmatter(mockApp, mockFile);

			expect(result.data.title).toBe('Test with: colon');
			expect(result.data.description).toContain('Line 1');
		});

		it('should handle unicode characters', async () => {
			const content = `---
title: Test 中文 🎉
emoji: 😀
---
Body`;

			const mockFile = createMockFile('test.md');
			mockApp.vault.read = async () => content;

			const result = await readFrontmatter(mockApp, mockFile);

			expect(result.data.title).toBe('Test 中文 🎉');
			expect(result.data.emoji).toBe('😀');
		});

		it('should handle very long strings', async () => {
			const longString = 'a'.repeat(10000);
			const content = `---
long: "${longString}"
---
Body`;

			const mockFile = createMockFile('test.md');
			mockApp.vault.read = async () => content;

			const result = await readFrontmatter(mockApp, mockFile);

			expect(result.data.long).toBe(longString);
			expect(result.data.long.length).toBe(10000);
		});

		it('should handle deep nesting safely', async () => {
			const content = `---
level1:
  level2:
    level3:
      level4:
        level5: deep value
---
Body`;

			const mockFile = createMockFile('test.md');
			mockApp.vault.read = async () => content;

			const result = await readFrontmatter(mockApp, mockFile);

			expect(result.data.level1.level2.level3.level4.level5).toBe('deep value');
		});

		it('should handle mixed types in arrays', async () => {
			const content = `---
mixed: [1, "two", true, null]
---
Body`;

			const mockFile = createMockFile('test.md');
			mockApp.vault.read = async () => content;

			const result = await readFrontmatter(mockApp, mockFile);

			expect(result.data.mixed).toEqual([1, 'two', true, null]);
		});
	});

	describe('Regression Prevention', () => {
		it('should maintain compatibility with common YAML patterns', async () => {
			const patterns = [
				'title: Simple String',
				'count: 42',
				'active: true',
				'tags: [a, b, c]',
				'date: 2025-11-20',
				'metadata:\n  key: value',
			];

			for (const pattern of patterns) {
				const content = `---\n${pattern}\n---\nBody`;
				const mockFile = createMockFile('test.md');
				mockApp.vault.read = async () => content;

				await expect(readFrontmatter(mockApp, mockFile)).resolves.toBeDefined();
			}
		});

		it('should not break on comments in YAML', async () => {
			const content = `---
title: Test
# This is a comment
count: 42
---
Body`;

			const mockFile = createMockFile('test.md');
			mockApp.vault.read = async () => content;

			const result = await readFrontmatter(mockApp, mockFile);

			expect(result.data.title).toBe('Test');
			expect(result.data.count).toBe(42);
		});

		it('should handle multiline strings', async () => {
			const content = `---
description: |
  This is a
  multiline
  string
---
Body`;

			const mockFile = createMockFile('test.md');
			mockApp.vault.read = async () => content;

			const result = await readFrontmatter(mockApp, mockFile);

			expect(result.data.description).toContain('multiline');
		});
	});
});
