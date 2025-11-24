/**
 * End-to-End Integration Tests
 * Tests complete workflow from rule parsing through execution
 */

import { describe, it, expect } from 'vitest';
import { parseCondition } from '../../src/parser/conditionParser';
import { parseAction } from '../../src/parser/actionParser';
import { evaluateCondition } from '../../src/evaluator/conditionEvaluator';
import { executeSet, executeAdd, executeDelete } from '../../src/actions/basicActions';
import { executeAppend, executeUpdateWhere, executeSortBy } from '../../src/actions/arrayActions';
import { executeMerge } from '../../src/actions/objectActions';

describe('End-to-End Integration', () => {
	describe('Complete workflow: Condition → Action', () => {
		it('should execute: IF status="draft" THEN SET status "published"', () => {
			const data = { title: 'My Note', status: 'draft' };

			// Parse and evaluate condition
			const conditionAST = parseCondition('status = "draft"');
			const matches = evaluateCondition(conditionAST, data);
			expect(matches).toBe(true);

			// Parse and execute action
			const actionAST = parseAction('SET status "published"');
			expect(actionAST.op).toBe('SET');

			const result = executeSet(data, actionAST.path, actionAST.value);
			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.status).toBe('published');
		});

		it('should skip: IF priority>10 THEN SET status "high" (condition false)', () => {
			const data = { status: 'draft', priority: 5 };

			const conditionAST = parseCondition('priority > 10');
			const matches = evaluateCondition(conditionAST, data);
			expect(matches).toBe(false);

			// Action should not execute
			expect(data.status).toBe('draft'); // Unchanged
		});
	});

	describe('Array operations workflow', () => {
		it('should execute: IF tags has "urgent" THEN APPEND tags "processed"', () => {
			const data = { tags: ['work', 'urgent'] };

			const conditionAST = parseCondition('tags has "urgent"');
			expect(evaluateCondition(conditionAST, data)).toBe(true);

			const actionAST = parseAction('APPEND tags "processed"');
			const result = executeAppend(data, actionAST.path, actionAST.value);

			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['work', 'urgent', 'processed']);
		});

		it('should execute: UPDATE_WHERE on countsLog', () => {
			const data = {
				countsLog: [
					{ mantra: 'Great Gatsby', unit: 'Solitude' },
					{ mantra: 'Brave New World', unit: 'Solitude' },
				]
			};

			const actionAST = parseAction('UPDATE_WHERE countsLog WHERE mantra="Brave New World" SET unit "Meditations"');
			expect(actionAST.op).toBe('UPDATE_WHERE');

			const result = executeUpdateWhere(
				data,
				actionAST.path,
				actionAST.condition,
				actionAST.updates
			);

			expect(result.success).toBe(true);
			expect(data.countsLog[1].unit).toBe('Meditations');
		});

		it('should execute: SORT_BY countsLog BY mantra ASC', () => {
			const data = {
				countsLog: [
					{ mantra: 'Great Gatsby', count: 3 },
					{ mantra: 'Brave New World', count: 1 },
					{ mantra: 'Animal Farm', count: 2 }
				]
			};

			const actionAST = parseAction('SORT_BY countsLog BY mantra ASC');
			const result = executeSortBy(data, actionAST.path, actionAST.field, actionAST.order);

			expect(result.success).toBe(true);
			expect(data.countsLog[0].mantra).toBe('Animal Farm');
			expect(data.countsLog[1].mantra).toBe('Brave New World');
			expect(data.countsLog[2].mantra).toBe('Great Gatsby');
		});
	});

	describe('Complex conditions', () => {
		it('should evaluate: (tags has "urgent" OR priority > 5) AND status = "draft"', () => {
			const data1 = { tags: ['work', 'urgent'], priority: 3, status: 'draft' };
			const data2 = { tags: ['work'], priority: 8, status: 'draft' };
			const data3 = { tags: ['work'], priority: 3, status: 'draft' };

			const conditionAST = parseCondition('(tags has "urgent" OR priority > 5) AND status = "draft"');

			expect(evaluateCondition(conditionAST, data1)).toBe(true);  // has urgent
			expect(evaluateCondition(conditionAST, data2)).toBe(true);  // priority > 5
			expect(evaluateCondition(conditionAST, data3)).toBe(false); // neither
		});

		it('should evaluate: ANY projects WHERE status = "active"', () => {
			const data = {
				projects: [
					{ name: 'Alpha', status: 'active' },
					{ name: 'Beta', status: 'pending' }
				]
			};

			const conditionAST = parseCondition('ANY projects WHERE status = "active"');
			expect(evaluateCondition(conditionAST, data)).toBe(true);
		});
	});

	describe('Real-world scenarios', () => {
		it('should handle complete note update workflow', () => {
			// Initial note
			const data = {
				title: 'Project Meeting',
				status: 'draft',
				tags: ['work', 'meeting'],
				priority: 5
			};

			// Condition: status = "draft" AND priority > 3
			const condition = parseCondition('status = "draft" AND priority > 3');
			expect(evaluateCondition(condition, data)).toBe(true);

			// Action 1: SET status "reviewed"
			const action1 = parseAction('SET status "reviewed"');
			executeSet(data, action1.path, action1.value);
			expect(data.status).toBe('reviewed');

			// Action 2: APPEND tags "processed"
			const action2 = parseAction('APPEND tags "processed"');
			executeAppend(data, action2.path, action2.value);
			expect(data.tags).toContain('processed');

			// Action 3: ADD reviewDate
			const action3 = parseAction('ADD reviewDate "2025-11-20"');
			executeAdd(data, action3.path, action3.value);
			expect(data.reviewDate).toBe('2025-11-20');
		});

		it('should handle countsLog manipulation', () => {
			const data = {
				countsLog: [
					{ mantra: 'Great Gatsby', count: 3, unit: 'Meditations' },
					{ mantra: 'Brave New World', count: 1, unit: 'Solitude' },
					{ mantra: 'Beloved', count: 6, unit: 'Meditations' }
				]
			};

			// Update Brave New World unit
			const action1 = parseAction('UPDATE_WHERE countsLog WHERE mantra="Brave New World" SET unit "Meditations", verified true');
			executeUpdateWhere(data, action1.path, action1.condition, action1.updates);
			expect(data.countsLog[1].unit).toBe('Meditations');
			expect(data.countsLog[1].verified).toBe(true);

			// Sort by count descending
			const action2 = parseAction('SORT_BY countsLog BY count DESC');
			executeSortBy(data, action2.path, action2.field, action2.order);
			expect(data.countsLog[0].count).toBe(6); // Beloved first
			expect(data.countsLog[2].count).toBe(1); // Brave New World last
		});
	});

	describe('Edge cases and error handling', () => {
		it('should handle missing fields gracefully', () => {
			const data = { title: 'Note' };

			// Condition with missing field should return false
			const condition = parseCondition('status = "draft"');
			expect(evaluateCondition(condition, data)).toBe(false);

			// ADD should work on missing field
			const action = parseAction('ADD status "draft"');
			const result = executeAdd(data, action.path, action.value);
			expect(result.success).toBe(true);
			expect(data.status).toBe('draft');
		});

		it('should warn when ADD field already exists', () => {
			const data = { status: 'published' };

			const action = parseAction('ADD status "draft"');
			const result = executeAdd(data, action.path, action.value);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
			expect(result.warning).toContain('already exists');
			expect(data.status).toBe('published'); // Unchanged
		});

		it('should error when operating on non-array', () => {
			const data = { tags: 'not-an-array' };

			const action = parseAction('APPEND tags "value"');
			const result = executeAppend(data, action.path, action.value);

			expect(result.success).toBe(false);
			expect(result.error).toContain('not an array');
		});
	});
});
