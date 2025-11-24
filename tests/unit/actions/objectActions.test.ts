/**
 * Tests for Object Actions
 */

import { describe, it, expect } from 'vitest';
import { executeMerge, executeMergeOverwrite } from '../../../src/actions/objectActions';

describe('Object Actions', () => {
	describe('MERGE - deep merge', () => {
		it('should merge objects deeply', () => {
			const data = {
				metadata: {
					author: 'John',
					version: 1.0
				}
			};
			const result = executeMerge(data, 'metadata', {
				editor: 'Jane',
				reviewed: true
			});
			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.metadata).toEqual({
				author: 'John',
				version: 1.0,
				editor: 'Jane',
				reviewed: true
			});
		});

		it('should overwrite primitives in deep merge', () => {
			const data = {
				metadata: {
					author: 'John',
					version: 1.0
				}
			};
			const result = executeMerge(data, 'metadata', {
				version: 2.0
			});
			expect(result.success).toBe(true);
			expect(data.metadata.version).toBe(2.0);
		});

		it('should replace arrays (not merge)', () => {
			const data = {
				metadata: {
					tags: ['a', 'b'],
					count: 5
				}
			};
			const result = executeMerge(data, 'metadata', {
				tags: ['x', 'y'],
				count: 10
			});
			expect(result.success).toBe(true);
			expect(data.metadata.tags).toEqual(['x', 'y']);
			expect(data.metadata.count).toBe(10);
		});

		it('should recursively merge nested objects', () => {
			const data = {
				config: {
					settings: {
						theme: 'dark',
						size: 'medium'
					}
				}
			};
			const result = executeMerge(data, 'config', {
				settings: {
					size: 'large',
					font: 'mono'
				}
			});
			expect(result.success).toBe(true);
			expect(data.config.settings).toEqual({
				theme: 'dark',
				size: 'large',
				font: 'mono'
			});
		});

		it('should create object if field does not exist', () => {
			const data = { title: 'Note' };
			const result = executeMerge(data, 'metadata', {
				author: 'John',
				version: 1.0
			});
			expect(result.success).toBe(true);
			expect(data.metadata).toEqual({
				author: 'John',
				version: 1.0
			});
		});

		it('should error on non-object field', () => {
			const data = { metadata: 'not-an-object' };
			const result = executeMerge(data, 'metadata', { author: 'John' });
			expect(result.success).toBe(false);
			expect(result.error).toContain('not an object');
		});
	});

	describe('MERGE_OVERWRITE - shallow merge', () => {
		it('should merge objects shallowly', () => {
			const data = {
				metadata: {
					author: 'John',
					version: 1.0
				}
			};
			const result = executeMergeOverwrite(data, 'metadata', {
				editor: 'Jane',
				reviewed: true
			});
			expect(result.success).toBe(true);
			expect(data.metadata).toEqual({
				author: 'John',
				version: 1.0,
				editor: 'Jane',
				reviewed: true
			});
		});

		it('should replace nested objects (not merge)', () => {
			const data = {
				config: {
					settings: {
						theme: 'dark',
						size: 'medium'
					}
				}
			};
			const result = executeMergeOverwrite(data, 'config', {
				settings: {
					size: 'large',
					font: 'mono'
				}
			});
			expect(result.success).toBe(true);
			// Should replace entire settings object
			expect(data.config.settings).toEqual({
				size: 'large',
				font: 'mono'
			});
			// theme should be gone (replaced, not merged)
		});

		it('should create object if field does not exist', () => {
			const data = { title: 'Note' };
			const result = executeMergeOverwrite(data, 'metadata', {
				author: 'John'
			});
			expect(result.success).toBe(true);
			expect(data.metadata).toEqual({ author: 'John' });
		});
	});
});
