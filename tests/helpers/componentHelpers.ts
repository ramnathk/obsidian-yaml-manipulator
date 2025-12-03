/**
 * Shared Test Helpers for Svelte Component Testing
 *
 * Provides reusable mock factories, test data, and utility functions
 * to reduce duplication and speed up component test development.
 */

import { vi } from 'vitest';
import type { TFile } from 'obsidian';
import type { FileResult, Rule } from '../../src/types';

// ============================================================================
// MOCK FACTORIES
// ============================================================================

/**
 * Creates a mock Obsidian plugin with sensible defaults
 *
 * Usage:
 * ```typescript
 * const plugin = createMockPlugin({
 *   data: { rules: [createMockRule()] }
 * });
 * ```
 */
export function createMockPlugin(overrides: Record<string, any> = {}) {
	return {
		app: {
			vault: {
				getMarkdownFiles: vi.fn().mockReturnValue([]),
				read: vi.fn().mockResolvedValue('---\ntitle: Test\n---\nContent'),
				modify: vi.fn().mockResolvedValue(undefined),
				adapter: {
					exists: vi.fn().mockResolvedValue(false),
					write: vi.fn().mockResolvedValue(undefined),
					read: vi.fn().mockResolvedValue('{}'),
					mkdir: vi.fn().mockResolvedValue(undefined)
				}
			}
		},
		data: {
			rules: [],
			settings: {
				defaultBackup: true,
				scanTimeout: 30000,
				debug: false
			}
		},
		loadData: vi.fn().mockResolvedValue({ rules: [], settings: {} }),
		saveData: vi.fn().mockResolvedValue(undefined),
		saveSettings: vi.fn().mockResolvedValue(undefined),
		...overrides
	};
}

/**
 * Creates a mock FileResult for preview/result display testing
 *
 * Usage:
 * ```typescript
 * const result = createMockFileResult({
 *   status: 'error',
 *   error: 'Invalid YAML'
 * });
 * ```
 */
export function createMockFileResult(overrides: Partial<FileResult> = {}): FileResult {
	return {
		file: {
			path: 'test.md',
			basename: 'test',
			name: 'test.md',
			extension: 'md',
			parent: null as any,
			vault: null as any,
			stat: { ctime: 0, mtime: 0, size: 0 }
		} as TFile,
		status: 'success',
		modified: true,
		changes: ['Changed field'],
		originalData: { title: 'Test' },
		newData: { title: 'Test Modified' },
		duration: 10,
		...overrides
	};
}

/**
 * Creates a mock Rule with sensible defaults
 *
 * Usage:
 * ```typescript
 * const rule = createMockRule({
 *   condition: 'status = "draft"',
 *   action: 'SET status "published"'
 * });
 * ```
 */
export function createMockRule(overrides: Partial<Rule> = {}): Rule {
	return {
		id: 'test-rule-' + Math.random().toString(36).substr(2, 9),
		name: 'Test Rule',
		condition: 'status = "draft"',
		action: 'SET status "published"',
		scope: {
			type: 'vault',
			folder: ''
		},
		options: {
			backup: true
		},
		created: new Date().toISOString(),
		lastUsed: null,
		...overrides
	};
}

/**
 * Creates a mock TFile object
 *
 * Usage:
 * ```typescript
 * const file = createMockFile('notes/example.md');
 * ```
 */
export function createMockFile(path: string): TFile {
	const basename = path.split('/').pop()?.replace(/\.md$/, '') || 'untitled';
	return {
		path,
		basename,
		name: path.split('/').pop() || 'untitled.md',
		extension: 'md',
		parent: null as any,
		vault: null as any,
		stat: {
			ctime: Date.now(),
			mtime: Date.now(),
			size: 1024
		}
	} as TFile;
}

// ============================================================================
// SAFETY ASSERTIONS (Negative Tests)
// ============================================================================

/**
 * Asserts that vault was never modified (critical for test isolation)
 *
 * Usage:
 * ```typescript
 * const mockVault = mockPlugin.app.vault;
 * // ... run tests
 * assertVaultNotModified(mockVault);
 * ```
 */
export function assertVaultNotModified(mockVault: any) {
	expect(mockVault.modify).not.toHaveBeenCalled();
	if (mockVault.adapter?.write) {
		expect(mockVault.adapter.write).not.toHaveBeenCalled();
	}
}

/**
 * Asserts that vault was never written to (no new files created)
 */
export function assertVaultNotWritten(mockVault: any) {
	if (mockVault.create) {
		expect(mockVault.create).not.toHaveBeenCalled();
	}
	if (mockVault.adapter?.write) {
		expect(mockVault.adapter.write).not.toHaveBeenCalled();
	}
}

/**
 * Asserts that props were not mutated (immutability check)
 */
export function assertPropsNotMutated(original: any, current: any) {
	expect(current).toEqual(original);
	if (typeof original === 'object' && original !== null) {
		expect(current).not.toBe(original); // Should be different reference
	}
}

// ============================================================================
// PERFORMANCE TEST DATA GENERATORS
// ============================================================================

/**
 * Generates large result sets for performance testing
 *
 * Usage:
 * ```typescript
 * const results = generateLargeResults(500); // 500 file results
 * ```
 */
export function generateLargeResults(count: number): FileResult[] {
	return Array.from({ length: count }, (_, i) =>
		createMockFileResult({
			file: createMockFile(`file${i}.md`),
			duration: Math.floor(Math.random() * 50) + 1
		})
	);
}

/**
 * Generates large YAML data (for testing with many fields)
 */
export function generateLargeYaml(fieldCount: number): Record<string, any> {
	const data: Record<string, any> = {};
	for (let i = 0; i < fieldCount; i++) {
		data[`field${i}`] = `value${i}`;
	}
	return data;
}

/**
 * Generates deeply nested YAML (for testing nested object handling)
 */
export function generateNestedYaml(depth: number): any {
	if (depth === 0) {
		return 'leaf-value';
	}
	return {
		level: depth,
		child: generateNestedYaml(depth - 1)
	};
}

// ============================================================================
// EDGE CASE TEST DATA
// ============================================================================

/**
 * Unicode test cases covering multiple languages and emoji
 */
export const UNICODE_TEST_CASES = {
	emoji: {
		title: '🚀 Project Launch',
		status: '✅ Done',
		tags: ['🎯 goal', '🔥 hot', '⭐ star']
	},
	chinese: {
		title: '项目标题',
		author: '作者名',
		description: '这是一个测试项目'
	},
	arabic: {
		title: 'عنوان المشروع',
		status: 'نشط',
		description: 'وصف المشروع'
	},
	mixed: {
		title: 'Test 测试 🎉',
		tags: ['unicode', 'юникод', 'ユニコード'],
		author: 'José García 李明'
	},
	symbols: {
		formula: 'E = mc²',
		copyright: '© 2025',
		arrows: '→ ← ↑ ↓',
		math: '∑ ∫ √ ∞'
	}
};

/**
 * Edge case YAML samples for various scenarios
 */
export const EDGE_CASE_YAML = {
	empty: '',
	minimal: 'title: Test',

	// Complex nested structure
	complex: {
		title: 'Complex Note',
		tags: ['tag1', 'tag2', 'tag3'],
		metadata: {
			nested: {
				deeply: {
					value: 'here'
				}
			}
		},
		status: 'draft',
		priority: 5
	},

	// Malformed YAML
	malformed: 'title: Test\n  bad: [unclosed',
	malformedQuotes: 'title: "unclosed quote',
	malformedColon: 'title Test (missing colon)',

	// Null and undefined handling
	nullValues: {
		status: null,
		author: null,
		tags: null
	},

	// Boolean values
	booleans: {
		published: true,
		archived: false,
		draft: true
	},

	// Numeric values
	numbers: {
		priority: 5,
		rating: 4.5,
		count: 0,
		negative: -10
	},

	// Arrays
	emptyArray: {
		tags: []
	},
	arrayWithNulls: {
		tags: [null, 'tag1', null, 'tag2']
	},

	// Special characters
	specialChars: {
		colon: 'value: with: colons',
		quotes: 'value "with" quotes',
		newlines: 'value\nwith\nnewlines',
		tabs: 'value\twith\ttabs'
	}

	// Note: For large arrays/long strings/huge YAML, use generators directly in tests:
	// - generateLargeYaml(fieldCount)
	// - Array.from({ length: N }, ...)
	// - 'x'.repeat(N)
};

/**
 * Sample YAML strings for TestTab component
 */
export const SAMPLE_YAML_STRINGS = {
	draft: `---
title: Draft Note
status: draft
tags: [work, urgent]
priority: 5
---`,

	published: `---
title: Published Note
status: published
author: John Doe
date: 2025-01-01
---`,

	minimal: `---
title: Minimal
---`,

	complex: `---
title: Complex Note
tags: [tag1, tag2]
metadata:
  nested: value
  array: [1, 2, 3]
status: draft
---`,

	empty: '',

	malformed: `---
title: Test
  bad: [unclosed
---`,

	withArrays: `---
tags: [tag1, tag2, tag3]
categories: [cat1, cat2]
authors: [Alice, Bob]
---`,

	withObjects: `---
metadata:
  created: 2025-01-01
  modified: 2025-01-02
  author:
    name: John
    email: john@example.com
---`
};

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Wait for a condition to be true (polling utility)
 *
 * Usage:
 * ```typescript
 * await waitForCondition(() => screen.queryByText('Success'));
 * ```
 */
export async function waitForCondition(
	condition: () => any,
	timeoutMs = 3000,
	intervalMs = 100
): Promise<void> {
	const startTime = Date.now();

	while (Date.now() - startTime < timeoutMs) {
		if (condition()) {
			return;
		}
		await new Promise(resolve => setTimeout(resolve, intervalMs));
	}

	throw new Error(`Condition not met within ${timeoutMs}ms`);
}

/**
 * Simulates async delay (for testing loading states)
 */
export function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a mock function that resolves after delay
 */
export function createDelayedMock<T>(returnValue: T, delayMs: number) {
	return vi.fn().mockImplementation(async () => {
		await delay(delayMs);
		return returnValue;
	});
}
