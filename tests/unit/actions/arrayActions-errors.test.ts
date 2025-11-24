/**
 * Array Actions - Error Handling and Edge Cases
 * Targets uncovered error paths to reach 95%+ coverage
 */

import { describe, it, expect } from 'vitest';
import {
	executeAppend,
	executePrepend,
	executeInsertAt,
	executeInsertAfter,
	executeInsertBefore,
	executeRemove,
	executeRemoveAll,
	executeRemoveAt,
	executeReplace,
	executeReplaceAll,
	executeDeduplicate,
	executeSort,
	executeSortBy,
	executeMove,
	executeMoveWhere,
	executeUpdateWhere,
} from '../../../src/actions/arrayActions';
import { parseCondition } from '../../../src/parser/conditionParser';

describe('Array Actions - Error Handling', () => {
	describe('Error on non-array fields', () => {
		it('APPEND should error on non-array', () => {
			const data = { field: 'not-array' };
			const result = executeAppend(data, 'field', 'value');
			expect(result.success).toBe(false);
			expect(result.error).toContain('not an array');
		});

		it('PREPEND should error on non-array', () => {
			const data = { field: 'string' };
			const result = executePrepend(data, 'field', 'value');
			expect(result.success).toBe(false);
		});

		it('INSERT_AT should error on non-array', () => {
			const data = { field: 123 };
			const result = executeInsertAt(data, 'field', 'value', 0);
			expect(result.success).toBe(false);
		});

		it('REMOVE should error on non-array', () => {
			const data = { field: true };
			const result = executeRemove(data, 'field', 'value');
			expect(result.success).toBe(false);
		});

		it('DEDUPLICATE should error on non-array', () => {
			const data = { field: { not: 'array' } };
			const result = executeDeduplicate(data, 'field');
			expect(result.success).toBe(false);
		});

		it('SORT should error on non-array', () => {
			const data = { field: null };
			const result = executeSort(data, 'field', 'ASC');
			expect(result.success).toBe(false);
		});

		it('SORT_BY should error on non-array', () => {
			const data = { items: 'string' };
			const result = executeSortBy(data, 'items', 'field', 'ASC');
			expect(result.success).toBe(false);
		});

		it('MOVE should error on non-array', () => {
			const data = { items: 42 };
			const result = executeMove(data, 'items', 0, 1);
			expect(result.success).toBe(false);
		});

		it('MOVE_WHERE should error on non-array', () => {
			const data = { items: [] };
			const condition = parseCondition('field = "value"');
			const result = executeMoveWhere(data, 'nonexistent', condition, 'START');
			expect(result.success).toBe(false);
		});

		it('UPDATE_WHERE should error on non-array', () => {
			const data = { items: 'string' };
			const condition = parseCondition('field = "value"');
			const result = executeUpdateWhere(data, 'items', condition, [{ field: 'test', value: 'val' }]);
			expect(result.success).toBe(false);
		});
	});

	describe('Edge cases and boundary conditions', () => {
		it('INSERT_AT with very large positive index should append', () => {
			const data = { items: ['a', 'b'] };
			const result = executeInsertAt(data, 'items', 'c', 1000);
			expect(result.success).toBe(true);
			expect(data.items).toEqual(['a', 'b', 'c']);
		});

		it('INSERT_AT with very large negative index should prepend', () => {
			const data = { items: ['a', 'b'] };
			const result = executeInsertAt(data, 'items', 'start', -1000);
			expect(result.success).toBe(true);
			expect(data.items[0]).toBe('start');
		});

		it('REMOVE_AT with very negative index should error', () => {
			const data = { items: ['a', 'b'] };
			const result = executeRemoveAt(data, 'items', -100);
			expect(result.success).toBe(false);
			expect(result.error).toContain('out of bounds');
		});

		it('MOVE with invalid from index', () => {
			const data = { items: ['a', 'b'] };
			const result = executeMove(data, 'items', 100, 0);
			expect(result.success).toBe(false);
			expect(result.error).toContain('out of bounds');
		});

		it('MOVE with invalid to index', () => {
			const data = { items: ['a', 'b'] };
			const result = executeMove(data, 'items', 0, 100);
			expect(result.success).toBe(false);
			expect(result.error).toContain('out of bounds');
		});

		it('INSERT_AFTER when target not found', () => {
			const data = { tags: ['a', 'b'] };
			const result = executeInsertAfter(data, 'tags', 'new', 'missing');
			expect(result.success).toBe(false);
			expect(result.error).toContain('not found');
		});

		it('INSERT_BEFORE when target not found', () => {
			const data = { tags: ['a', 'b'] };
			const result = executeInsertBefore(data, 'tags', 'new', 'missing');
			expect(result.success).toBe(false);
			expect(result.error).toContain('not found');
		});

		it('REMOVE when value not found should warn', () => {
			const data = { tags: ['a', 'b'] };
			const result = executeRemove(data, 'tags', 'missing');
			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
			expect(result.warning).toContain('not found');
		});

		it('REMOVE_ALL when value not found should warn', () => {
			const data = { tags: ['a', 'b'] };
			const result = executeRemoveAll(data, 'tags', 'missing');
			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
			expect(result.warning).toContain('not found');
		});

		it('REPLACE when value not found should warn', () => {
			const data = { tags: ['a', 'b'] };
			const result = executeReplace(data, 'tags', 'missing', 'new');
			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
			expect(result.warning).toContain('not found');
		});

		it('REPLACE_ALL when value not found should warn', () => {
			const data = { tags: ['a', 'b'] };
			const result = executeReplaceAll(data, 'tags', 'missing', 'new');
			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
			expect(result.warning).toContain('not found');
		});

		it('DEDUPLICATE with no duplicates should warn', () => {
			const data = { tags: ['a', 'b', 'c'] };
			const result = executeDeduplicate(data, 'tags');
			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
			expect(result.warning).toContain('No duplicates');
		});

		it('MOVE_WHERE when no items match should warn', () => {
			const data = { items: [{ status: 'active' }] };
			const condition = parseCondition('status = "missing"');
			const result = executeMoveWhere(data, 'items', condition, 'START');
			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
			expect(result.warning).toContain('No items matched');
		});

		it('MOVE_WHERE with AFTER when target not found', () => {
			const data = { items: [{ id: 1 }, { id: 2 }] };
			const condition = parseCondition('id = 2');
			const reference = parseCondition('id = 999');
			const result = executeMoveWhere(data, 'items', condition, {
				position: 'AFTER',
				reference
			});
			expect(result.success).toBe(false);
			expect(result.error).toContain('matched no items');
		});

		it('UPDATE_WHERE when no items match should warn', () => {
			const data = { items: [{ status: 'active' }] };
			const condition = parseCondition('status = "missing"');
			const result = executeUpdateWhere(data, 'items', condition, [{ field: 'test', value: 'val' }]);
			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
			expect(result.warning).toContain('No items matched');
		});
	});

	describe('Array operations on complex data', () => {
		it('should handle arrays with objects', () => {
			const data = { items: [{ id: 1 }, { id: 2 }] };
			const result = executeAppend(data, 'items', { id: 3 });
			expect(result.success).toBe(true);
			expect(data.items).toHaveLength(3);
		});

		it('should remove objects by deep equality', () => {
			const data = { items: [{ id: 1 }, { id: 2 }, { id: 1 }] };
			const result = executeRemove(data, 'items', { id: 1 });
			expect(result.success).toBe(true);
			expect(data.items).toHaveLength(2);
			expect(data.items[0].id).toBe(2);
		});

		it('should deduplicate objects', () => {
			const data = { items: [{ id: 1 }, { id: 2 }, { id: 1 }] };
			const result = executeDeduplicate(data, 'items');
			expect(result.success).toBe(true);
			expect(data.items).toHaveLength(2);
		});

		it('should replace objects by deep equality', () => {
			const data = { items: [{ id: 1, name: 'old' }, { id: 2 }] };
			const result = executeReplace(data, 'items', { id: 1, name: 'old' }, { id: 1, name: 'new' });
			expect(result.success).toBe(true);
			expect(data.items[0].name).toBe('new');
		});
	});
});
