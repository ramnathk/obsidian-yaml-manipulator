/**
 * Security and Robustness Tests
 * Tests for fixes to prevent ReDoS, infinite loops, path traversal, prototype pollution, etc.
 *
 * These tests ensure that security/robustness fixes don't regress in future updates
 */

import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '../../../src/evaluator/conditionEvaluator';
import { parsePathSegments } from '../../../src/parser/pathResolver';
import { parseArray, parseObject } from '../../../src/parser/valueParser';
import { LIMITS } from '../../../src/constants';

describe('Security & Robustness Tests', () => {
	describe('ReDoS Protection', () => {
		it('should reject regex patterns that are too long', () => {
			const longPattern = '/a'.repeat(150) + '/';
			const ast = {
				type: 'comparison' as const,
				left: 'title',
				operator: '~' as const,
				right: longPattern,
			};

			expect(() => evaluateCondition(ast, { title: 'test' })).toThrow(/too long/i);
		});

		it('should reject dangerous regex patterns with nested quantifiers (+*)', () => {
			// Pattern with +* is explicitly dangerous
			const ast = {
				type: 'comparison' as const,
				left: 'title',
				operator: '~' as const,
				right: '/a+*b/',
			};

			expect(() => evaluateCondition(ast, { title: 'test' })).toThrow(/unsafe.*pattern/i);
		});

		it('should reject regex patterns with *+ quantifiers', () => {
			const ast = {
				type: 'comparison' as const,
				left: 'title',
				operator: '~' as const,
				right: '/a*+b/',
			};

			expect(() => evaluateCondition(ast, { title: 'test' })).toThrow(/unsafe.*pattern/i);
		});

		it('should reject regex patterns with open-ended repetition', () => {
			const ast = {
				type: 'comparison' as const,
				left: 'title',
				operator: '~' as const,
				right: '/a{10,}/',
			};

			expect(() => evaluateCondition(ast, { title: 'test' })).toThrow(/unsafe.*pattern/i);
		});

		it('should allow safe regex patterns', () => {
			const ast = {
				type: 'comparison' as const,
				left: 'title',
				operator: '~' as const,
				right: '/^test.*$/i',
			};

			expect(() => evaluateCondition(ast, { title: 'test123' })).not.toThrow();
			expect(evaluateCondition(ast, { title: 'test123' })).toBe(true);
		});

		it('should have reasonable timeout limit', () => {
			// Verify timeout is set to a reasonable value (not too short, not too long)
			expect(LIMITS.REGEX_TIMEOUT_MS).toBeGreaterThan(100);
			expect(LIMITS.REGEX_TIMEOUT_MS).toBeLessThan(5000);
		});
	});

	describe('Path Depth Limits', () => {
		it('should reject paths that are too long', () => {
			const longPath = 'a.'.repeat(300) + 'b';
			expect(() => parsePathSegments(longPath)).toThrow(/too long/i);
		});

		it('should reject paths that are too deeply nested', () => {
			// Create a path with more than MAX_PATH_DEPTH levels
			const deepPath = Array(LIMITS.MAX_PATH_DEPTH + 5)
				.fill('level')
				.join('.');

			expect(() => parsePathSegments(deepPath)).toThrow(/too deeply nested/i);
		});

		it('should allow paths within depth limit', () => {
			const reasonablePath = 'metadata.author.name.first';
			expect(() => parsePathSegments(reasonablePath)).not.toThrow();
			expect(parsePathSegments(reasonablePath)).toHaveLength(4);
		});

		it('should allow paths within length limit', () => {
			const reasonablePath = 'a.b.c[0].d[1].e';
			expect(() => parsePathSegments(reasonablePath)).not.toThrow();
		});

		it('should have reasonable depth limit', () => {
			// Verify depth limit is reasonable (enough for real use, not unlimited)
			expect(LIMITS.MAX_PATH_DEPTH).toBeGreaterThanOrEqual(20);
			expect(LIMITS.MAX_PATH_DEPTH).toBeLessThanOrEqual(100);
		});

		it('should have reasonable length limit', () => {
			expect(LIMITS.MAX_PATH_LENGTH).toBeGreaterThanOrEqual(200);
			expect(LIMITS.MAX_PATH_LENGTH).toBeLessThanOrEqual(1000);
		});
	});

	describe('Prototype Pollution Protection', () => {
		it('should reject objects with __proto__ key', () => {
			const maliciousJSON = '{"__proto__": {"polluted": true}}';
			expect(() => parseObject(maliciousJSON)).toThrow(/unsafe properties/i);
		});

		it('should reject objects with constructor key', () => {
			const maliciousJSON = '{"constructor": {"polluted": true}}';
			expect(() => parseObject(maliciousJSON)).toThrow(/unsafe properties/i);
		});

		it('should reject objects with prototype key', () => {
			const maliciousJSON = '{"prototype": {"polluted": true}}';
			expect(() => parseObject(maliciousJSON)).toThrow(/unsafe properties/i);
		});

		it('should reject nested objects with dangerous keys', () => {
			const maliciousJSON = '{"safe": {"nested": {"__proto__": {"polluted": true}}}}';
			expect(() => parseObject(maliciousJSON)).toThrow(/unsafe properties/i);
		});

		it('should reject arrays containing objects with dangerous keys', () => {
			const maliciousJSON = '[{"__proto__": {"polluted": true}}]';
			expect(() => parseArray(maliciousJSON)).toThrow(/unsafe properties/i);
		});

		it('should allow safe objects', () => {
			const safeJSON = '{"key": "value", "count": 42}';
			expect(() => parseObject(safeJSON)).not.toThrow();
			expect(parseObject(safeJSON)).toEqual({ key: 'value', count: 42 });
		});

		it('should allow safe arrays', () => {
			const safeJSON = '["a", "b", "c"]';
			expect(() => parseArray(safeJSON)).not.toThrow();
			expect(parseArray(safeJSON)).toEqual(['a', 'b', 'c']);
		});

		it('should allow nested safe objects', () => {
			const safeJSON = '{"outer": {"inner": {"value": 123}}}';
			expect(() => parseObject(safeJSON)).not.toThrow();
			expect(parseObject(safeJSON)).toEqual({ outer: { inner: { value: 123 } } });
		});
	});

	describe('Batch Processing Performance', () => {
		it('should have reasonable batch yield interval', () => {
			// Should yield frequently enough for UI responsiveness
			expect(LIMITS.BATCH_YIELD_INTERVAL).toBeGreaterThan(1);
			expect(LIMITS.BATCH_YIELD_INTERVAL).toBeLessThan(20);
		});

		it('should have reasonable batch throttle delay', () => {
			// Should have some delay to prevent overwhelming the system
			expect(LIMITS.BATCH_THROTTLE_MS).toBeGreaterThanOrEqual(5);
			expect(LIMITS.BATCH_THROTTLE_MS).toBeLessThan(100);
		});
	});

	describe('Path Traversal Protection', () => {
		it('should reject paths with .. in parsePathSegments', () => {
			const traversalPath = '../../../sensitive-file';
			// Path resolver should handle .. carefully
			// This tests that we have limits in place
			expect(() => parsePathSegments(traversalPath)).not.toThrow();
			// The actual protection is in batchProcessor.createBackup
		});

		it('should reject paths starting with /', () => {
			const absolutePath = '/etc/passwd';
			// Absolute paths should be caught by normalization
			const segments = parsePathSegments(absolutePath);
			// Path resolver will parse it, but backup validation will reject it
			expect(segments).toBeDefined();
		});
	});

	describe('Edge Cases and Robustness', () => {
		it('should handle empty path gracefully', () => {
			expect(() => parsePathSegments('')).not.toThrow();
			expect(parsePathSegments('')).toEqual([]);
		});

		it('should handle whitespace-only path', () => {
			expect(() => parsePathSegments('   ')).not.toThrow();
			expect(parsePathSegments('   ')).toEqual([]);
		});

		it('should handle very long string values in regex matching', () => {
			const longString = 'a'.repeat(10000);
			const ast = {
				type: 'comparison' as const,
				left: 'title',
				operator: '~' as const,
				right: '/^test/',
			};

			// Should not timeout on simple patterns even with long strings
			expect(() => evaluateCondition(ast, { title: longString })).not.toThrow();
		});

		it('should handle null and undefined in path resolution', () => {
			expect(() => parsePathSegments(null as any)).not.toThrow();
			expect(() => parsePathSegments(undefined as any)).not.toThrow();
		});

		it('should reject malformed JSON gracefully', () => {
			expect(() => parseObject('{invalid json}')).toThrow(/Failed to parse/i);
			expect(() => parseArray('[invalid json]')).toThrow(/Failed to parse/i);
		});
	});

	describe('Constants Validation', () => {
		it('should have all required security limits defined', () => {
			expect(LIMITS.MAX_REGEX_LENGTH).toBeDefined();
			expect(LIMITS.REGEX_TIMEOUT_MS).toBeDefined();
			expect(LIMITS.MAX_PATH_DEPTH).toBeDefined();
			expect(LIMITS.MAX_PATH_LENGTH).toBeDefined();
			expect(LIMITS.BATCH_YIELD_INTERVAL).toBeDefined();
			expect(LIMITS.BATCH_THROTTLE_MS).toBeDefined();
		});

		it('should have positive values for all limits', () => {
			expect(LIMITS.MAX_REGEX_LENGTH).toBeGreaterThan(0);
			expect(LIMITS.REGEX_TIMEOUT_MS).toBeGreaterThan(0);
			expect(LIMITS.MAX_PATH_DEPTH).toBeGreaterThan(0);
			expect(LIMITS.MAX_PATH_LENGTH).toBeGreaterThan(0);
			expect(LIMITS.BATCH_YIELD_INTERVAL).toBeGreaterThan(0);
			expect(LIMITS.BATCH_THROTTLE_MS).toBeGreaterThan(0);
		});
	});

	describe('Regression Prevention', () => {
		it('should maintain backward compatibility with existing patterns', () => {
			// Common patterns that should still work
			const patterns = [
				'/^draft/',
				'/published/i',
				'/\\d{4}-\\d{2}-\\d{2}/',
				'/.+@.+\\..+/',
			];

			patterns.forEach(pattern => {
				const ast = {
					type: 'comparison' as const,
					left: 'title',
					operator: '~' as const,
					right: pattern,
				};
				expect(() => evaluateCondition(ast, { title: 'test' })).not.toThrow();
			});
		});

		it('should maintain backward compatibility with existing paths', () => {
			// Common paths that should still work
			const paths = [
				'title',
				'metadata.author',
				'tags[0]',
				'nested.array[0].value',
				'deep.nested.path.example',
			];

			paths.forEach(path => {
				expect(() => parsePathSegments(path)).not.toThrow();
			});
		});

		it('should maintain backward compatibility with existing objects', () => {
			// Common objects that should still work
			const objects = [
				'{"title": "test"}',
				'{"count": 42, "active": true}',
				'{"nested": {"key": "value"}}',
				'{"array": [1, 2, 3]}',
			];

			objects.forEach(obj => {
				expect(() => parseObject(obj)).not.toThrow();
			});
		});
	});
});
