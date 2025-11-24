/**
 * Tests for Array Actions
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

describe('Array Actions', () => {
	describe('APPEND', () => {
		it('should append to existing array', () => {
			const data = { tags: ['work', 'project'] };
			const result = executeAppend(data, 'tags', 'urgent');
			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.tags).toEqual(['work', 'project', 'urgent']);
		});

		it('should create array if field does not exist', () => {
			const data = { title: 'Note' };
			const result = executeAppend(data, 'tags', 'urgent');
			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.tags).toEqual(['urgent']);
		});

		it('should error on non-array field', () => {
			const data = { tags: 'not-an-array' };
			const result = executeAppend(data, 'tags', 'urgent');
			expect(result.success).toBe(false);
			expect(result.error).toContain('not an array');
		});
	});

	describe('PREPEND', () => {
		it('should prepend to existing array', () => {
			const data = { tags: ['work', 'project'] };
			const result = executePrepend(data, 'tags', 'urgent');
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['urgent', 'work', 'project']);
		});

		it('should create array if field does not exist', () => {
			const data = { title: 'Note' };
			const result = executePrepend(data, 'tags', 'urgent');
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['urgent']);
		});
	});

	describe('INSERT_AT', () => {
		it('should insert at specific index', () => {
			const data = { tags: ['first', 'third'] };
			const result = executeInsertAt(data, 'tags', 'second', 1);
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['first', 'second', 'third']);
		});

		it('should handle negative index', () => {
			const data = { tags: ['first', 'second', 'last'] };
			const result = executeInsertAt(data, 'tags', 'before-last', -1);
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['first', 'second', 'before-last', 'last']);
		});

		it('should append if index >= length', () => {
			const data = { tags: ['a', 'b'] };
			const result = executeInsertAt(data, 'tags', 'c', 999);
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['a', 'b', 'c']);
		});

		it('should prepend if negative index too large', () => {
			const data = { tags: ['a', 'b'] };
			const result = executeInsertAt(data, 'tags', 'start', -999);
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['start', 'a', 'b']);
		});
	});

	describe('INSERT_AFTER', () => {
		it('should insert after target value', () => {
			const data = { tags: ['work', 'urgent', 'project'] };
			const result = executeInsertAfter(data, 'tags', 'followup', 'urgent');
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['work', 'urgent', 'followup', 'project']);
		});

		it('should error if target not found', () => {
			const data = { tags: ['work', 'project'] };
			const result = executeInsertAfter(data, 'tags', 'followup', 'missing');
			expect(result.success).toBe(false);
			expect(result.error).toContain('not found');
		});
	});

	describe('INSERT_BEFORE', () => {
		it('should insert before target value', () => {
			const data = { tags: ['work', 'urgent', 'project'] };
			const result = executeInsertBefore(data, 'tags', 'pre-check', 'urgent');
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['work', 'pre-check', 'urgent', 'project']);
		});
	});

	describe('REMOVE', () => {
		it('should remove first occurrence', () => {
			const data = { tags: ['work', 'urgent', 'work', 'project'] };
			const result = executeRemove(data, 'tags', 'work');
			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.tags).toEqual(['urgent', 'work', 'project']);
		});

		it('should warn if value not found', () => {
			const data = { tags: ['work', 'project'] };
			const result = executeRemove(data, 'tags', 'missing');
			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
			expect(result.warning).toContain('not found');
		});
	});

	describe('REMOVE_ALL', () => {
		it('should remove all occurrences', () => {
			const data = { tags: ['work', 'urgent', 'work', 'project', 'work'] };
			const result = executeRemoveAll(data, 'tags', 'work');
			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.tags).toEqual(['urgent', 'project']);
		});

		it('should warn if value not found', () => {
			const data = { tags: ['work', 'project'] };
			const result = executeRemoveAll(data, 'tags', 'missing');
			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
			expect(result.warning).toContain('not found');
		});
	});

	describe('REMOVE_AT', () => {
		it('should remove at index', () => {
			const data = { tags: ['first', 'second', 'third'] };
			const result = executeRemoveAt(data, 'tags', 1);
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['first', 'third']);
		});

		it('should handle negative index', () => {
			const data = { tags: ['first', 'second', 'last'] };
			const result = executeRemoveAt(data, 'tags', -1);
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['first', 'second']);
		});

		it('should error on out of bounds', () => {
			const data = { tags: ['first', 'second'] };
			const result = executeRemoveAt(data, 'tags', 999);
			expect(result.success).toBe(false);
			expect(result.error).toContain('out of bounds');
		});
	});

	describe('REPLACE', () => {
		it('should replace first occurrence', () => {
			const data = { tags: ['draft', 'urgent', 'draft'] };
			const result = executeReplace(data, 'tags', 'draft', 'published');
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['published', 'urgent', 'draft']);
		});

		it('should warn if value not found', () => {
			const data = { tags: ['work', 'project'] };
			const result = executeReplace(data, 'tags', 'missing', 'new');
			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
			expect(result.warning).toContain('not found');
		});
	});

	describe('REPLACE_ALL', () => {
		it('should replace all occurrences', () => {
			const data = { tags: ['draft', 'urgent', 'draft', 'project', 'draft'] };
			const result = executeReplaceAll(data, 'tags', 'draft', 'published');
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['published', 'urgent', 'published', 'project', 'published']);
		});
	});

	describe('DEDUPLICATE', () => {
		it('should remove duplicates', () => {
			const data = { tags: ['work', 'urgent', 'work', 'project', 'urgent'] };
			const result = executeDeduplicate(data, 'tags');
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['work', 'urgent', 'project']);
		});

		it('should preserve order of first occurrence', () => {
			const data = { tags: ['a', 'b', 'a', 'c', 'b'] };
			const result = executeDeduplicate(data, 'tags');
			expect(data.tags).toEqual(['a', 'b', 'c']);
		});

		it('should warn if no duplicates', () => {
			const data = { tags: ['work', 'urgent', 'project'] };
			const result = executeDeduplicate(data, 'tags');
			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
			expect(result.warning).toContain('No duplicates');
		});
	});

	describe('SORT', () => {
		it('should sort strings ascending', () => {
			const data = { tags: ['project', 'urgent', 'work'] };
			const result = executeSort(data, 'tags', 'ASC');
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['project', 'urgent', 'work']);
		});

		it('should sort strings descending', () => {
			const data = { tags: ['a', 'c', 'b'] };
			const result = executeSort(data, 'tags', 'DESC');
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['c', 'b', 'a']);
		});

		it('should sort numbers ascending', () => {
			const data = { priorities: [3, 1, 2] };
			const result = executeSort(data, 'priorities', 'ASC');
			expect(result.success).toBe(true);
			expect(data.priorities).toEqual([1, 2, 3]);
		});

		it('should sort numbers descending', () => {
			const data = { priorities: [1, 3, 2] };
			const result = executeSort(data, 'priorities', 'DESC');
			expect(result.success).toBe(true);
			expect(data.priorities).toEqual([3, 2, 1]);
		});
	});

	describe('SORT_BY', () => {
		it('should sort array of objects by field ascending', () => {
			const data = {
				countsLog: [
					{ mantra: 'Great Gatsby', count: 3 },
					{ mantra: 'Brave New World', count: 1 },
					{ mantra: 'Animal Farm', count: 2 }
				]
			};
			const result = executeSortBy(data, 'countsLog', 'mantra', 'ASC');
			expect(result.success).toBe(true);
			expect(data.countsLog[0].mantra).toBe('Animal Farm');
			expect(data.countsLog[1].mantra).toBe('Brave New World');
			expect(data.countsLog[2].mantra).toBe('Great Gatsby');
		});

		it('should sort by numeric field descending', () => {
			const data = {
				countsLog: [
					{ mantra: 'Great Gatsby', count: 3 },
					{ mantra: 'Brave New World', count: 1 },
					{ mantra: 'Beloved', count: 6 }
				]
			};
			const result = executeSortBy(data, 'countsLog', 'count', 'DESC');
			expect(result.success).toBe(true);
			expect(data.countsLog[0].count).toBe(6);
			expect(data.countsLog[1].count).toBe(3);
			expect(data.countsLog[2].count).toBe(1);
		});
	});

	describe('MOVE', () => {
		it('should move item from one index to another', () => {
			const data = {
				countsLog: [
					{ mantra: 'Great Gatsby' },
					{ mantra: 'Brave New World' },
					{ mantra: 'Beloved' }
				]
			};
			const result = executeMove(data, 'countsLog', 1, 0);
			expect(result.success).toBe(true);
			expect(data.countsLog[0].mantra).toBe('Brave New World');
			expect(data.countsLog[1].mantra).toBe('Great Gatsby');
		});

		it('should handle negative indices', () => {
			const data = { tags: ['first', 'second', 'last'] };
			const result = executeMove(data, 'tags', 0, -1);
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['second', 'last', 'first']);
		});

		it('should error on out of bounds from index', () => {
			const data = { tags: ['a', 'b'] };
			const result = executeMove(data, 'tags', 999, 0);
			expect(result.success).toBe(false);
			expect(result.error).toContain('out of bounds');
		});
	});

	describe('MOVE_WHERE', () => {
		it('should move matching items to START', () => {
			const data = {
				countsLog: [
					{ mantra: 'Great Gatsby', count: 3 },
					{ mantra: 'Beloved', count: 6 },
					{ mantra: 'Brave New World', count: 1 }
				]
			};
			const condition = parseCondition('mantra = "Brave New World"');
			const result = executeMoveWhere(data, 'countsLog', condition, 'START');
			expect(result.success).toBe(true);
			expect(data.countsLog[0].mantra).toBe('Brave New World');
		});

		it('should move matching items to END', () => {
			const data = {
				countsLog: [
					{ mantra: 'Brave New World', count: 1 },
					{ mantra: 'Great Gatsby', count: 3 },
					{ mantra: 'Beloved', count: 6 }
				]
			};
			const condition = parseCondition('mantra = "Brave New World"');
			const result = executeMoveWhere(data, 'countsLog', condition, 'END');
			expect(result.success).toBe(true);
			expect(data.countsLog[2].mantra).toBe('Brave New World');
		});

		it('should move AFTER reference', () => {
			const data = {
				countsLog: [
					{ mantra: 'Great Gatsby', count: 3 },
					{ mantra: 'Beloved', count: 6 },
					{ mantra: 'Brave New World', count: 1 }
				]
			};
			const condition = parseCondition('mantra = "Brave New World"');
			const reference = parseCondition('mantra = "Great Gatsby"');
			const result = executeMoveWhere(data, 'countsLog', condition, {
				position: 'AFTER',
				reference
			});
			expect(result.success).toBe(true);
			expect(data.countsLog[0].mantra).toBe('Great Gatsby');
			expect(data.countsLog[1].mantra).toBe('Brave New World');
			expect(data.countsLog[2].mantra).toBe('Beloved');
		});

		it('should move BEFORE reference', () => {
			const data = {
				countsLog: [
					{ mantra: 'Great Gatsby', count: 3 },
					{ mantra: 'Beloved', count: 6 },
					{ mantra: 'Brave New World', count: 1 }
				]
			};
			const condition = parseCondition('mantra = "Brave New World"');
			const reference = parseCondition('mantra = "Beloved"');
			const result = executeMoveWhere(data, 'countsLog', condition, {
				position: 'BEFORE',
				reference
			});
			expect(result.success).toBe(true);
			expect(data.countsLog[0].mantra).toBe('Great Gatsby');
			expect(data.countsLog[1].mantra).toBe('Brave New World');
			expect(data.countsLog[2].mantra).toBe('Beloved');
		});

		it('should preserve order when multiple items match', () => {
			const data = {
				countsLog: [
					{ mantra: 'Great Gatsby', count: 3 },
					{ mantra: 'Beloved', count: 8 },
					{ mantra: 'Kindred', count: 2 },
					{ mantra: 'Dune', count: 7 }
				]
			};
			const condition = parseCondition('count > 5');
			const result = executeMoveWhere(data, 'countsLog', condition, 'START');
			expect(result.success).toBe(true);
			expect(data.countsLog[0].mantra).toBe('Beloved');
			expect(data.countsLog[1].mantra).toBe('Dune');
			expect(data.countsLog[2].mantra).toBe('Great Gatsby');
			expect(data.countsLog[3].mantra).toBe('Kindred');
		});

		it('should warn if no items match', () => {
			const data = { countsLog: [{ mantra: 'Great Gatsby' }] };
			const condition = parseCondition('mantra = "Missing"');
			const result = executeMoveWhere(data, 'countsLog', condition, 'START');
			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
			expect(result.warning).toContain('No items matched');
		});

		it('should error if target reference not found', () => {
			const data = { countsLog: [{ mantra: 'Great Gatsby' }, { mantra: 'Brave New World' }] };
			const condition = parseCondition('mantra = "Brave New World"');
			const reference = parseCondition('mantra = "Missing"');
			const result = executeMoveWhere(data, 'countsLog', condition, {
				position: 'AFTER',
				reference
			});
			expect(result.success).toBe(false);
			expect(result.error).toContain('matched no items');
		});
	});

	describe('UPDATE_WHERE', () => {
		it('should update single field in matching items', () => {
			const data = {
				countsLog: [
					{ mantra: 'Great Gatsby', unit: 'Solitude' },
					{ mantra: 'Brave New World', unit: 'Solitude' },
					{ mantra: 'Beloved', unit: 'Meditations' }
				]
			};
			const condition = parseCondition('mantra = "Brave New World"');
			const result = executeUpdateWhere(data, 'countsLog', condition, [
				{ field: 'unit', value: 'Meditations' }
			]);
			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.countsLog[1].unit).toBe('Meditations');
		});

		it('should update multiple fields in matching items', () => {
			const data = {
				countsLog: [
					{ mantra: 'Brave New World', unit: 'Solitude', verified: false }
				]
			};
			const condition = parseCondition('mantra = "Brave New World"');
			const result = executeUpdateWhere(data, 'countsLog', condition, [
				{ field: 'unit', value: 'Meditations' },
				{ field: 'verified', value: true },
				{ field: 'date', value: '2025-11-20' }
			]);
			expect(result.success).toBe(true);
			expect(data.countsLog[0].unit).toBe('Meditations');
			expect(data.countsLog[0].verified).toBe(true);
			expect(data.countsLog[0].date).toBe('2025-11-20');
		});

		it('should update all matching items', () => {
			const data = {
				items: [
					{ status: 'pending', priority: 1 },
					{ status: 'active', priority: 2 },
					{ status: 'pending', priority: 3 }
				]
			};
			const condition = parseCondition('status = "pending"');
			const result = executeUpdateWhere(data, 'items', condition, [
				{ field: 'status', value: 'active' }
			]);
			expect(result.success).toBe(true);
			expect(data.items[0].status).toBe('active');
			expect(data.items[2].status).toBe('active');
		});

		it('should warn if no items match', () => {
			const data = { countsLog: [{ mantra: 'Great Gatsby' }] };
			const condition = parseCondition('mantra = "Missing"');
			const result = executeUpdateWhere(data, 'countsLog', condition, [
				{ field: 'unit', value: 'Meditations' }
			]);
			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
			expect(result.warning).toContain('No items matched');
		});
	});
});
