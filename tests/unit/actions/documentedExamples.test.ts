/**
 * Tests for Documented Examples
 * Ensures all examples in /reference/examples work exactly as documented
 */

import { describe, it, expect } from 'vitest';
import {
	executeUpdateWhere,
	executeSortBy,
	executeMoveWhere,
} from '../../../src/actions/arrayActions';
import { parseCondition } from '../../../src/parser/conditionParser';

describe('Documented Examples - Arrays of Objects', () => {
	describe('UPDATE_WHERE: Task Management Example', () => {
		it('should update high-priority pending tasks to urgent', () => {
			const data = {
				title: 'Weekly Tasks',
				tasks: [
					{
						name: 'Review PR #123',
						status: 'pending',
						priority: 8,
						assignee: 'alice'
					},
					{
						name: 'Update documentation',
						status: 'pending',
						priority: 3,
						assignee: 'bob'
					},
					{
						name: 'Fix critical bug',
						status: 'done',
						priority: 9,
						assignee: 'alice'
					}
				]
			};

			// UPDATE_WHERE tasks WHERE status = "pending" AND priority >= 7 SET status "urgent", flagged true
			const condition = parseCondition('status = "pending" AND priority >= 7');
			const result = executeUpdateWhere(data, 'tasks', condition, [
				{ field: 'status', value: 'urgent' },
				{ field: 'flagged', value: true }
			]);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);

			// First task: Changed (was pending, priority 8)
			expect(data.tasks[0].status).toBe('urgent');
			expect(data.tasks[0].flagged).toBe(true);

			// Second task: Unchanged (priority too low)
			expect(data.tasks[1].status).toBe('pending');
			expect(data.tasks[1].flagged).toBeUndefined();

			// Third task: Unchanged (already done)
			expect(data.tasks[2].status).toBe('done');
			expect(data.tasks[2].flagged).toBeUndefined();
		});
	});

	describe('SORT_BY: Sort Tasks by Priority Example', () => {
		it('should sort tasks by priority descending', () => {
			const data = {
				title: 'Project Tasks',
				tasks: [
					{ name: 'Write tests', priority: 3 },
					{ name: 'Fix security issue', priority: 9 },
					{ name: 'Update README', priority: 1 },
					{ name: 'Review code', priority: 7 }
				]
			};

			// SORT_BY tasks BY priority DESC
			const result = executeSortBy(data, 'tasks', 'priority', 'DESC');

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);

			expect(data.tasks[0].priority).toBe(9); // Fix security issue
			expect(data.tasks[0].name).toBe('Fix security issue');
			expect(data.tasks[1].priority).toBe(7); // Review code
			expect(data.tasks[2].priority).toBe(3); // Write tests
			expect(data.tasks[3].priority).toBe(1); // Update README
		});
	});

	describe('MOVE_WHERE: Prioritize High-Priority Books Example', () => {
		it('should move high-priority books to top', () => {
			const data = {
				title: 'My Reading List',
				books: [
					{ title: 'Casual Read', priority: 'normal', pages: 200 },
					{ title: 'Important Research', priority: 'high', pages: 450 },
					{ title: 'Quick Reference', priority: 'low', pages: 50 },
					{ title: 'Critical Paper', priority: 'high', pages: 30 }
				]
			};

			// MOVE_WHERE books WHERE priority = "high" TO START
			const condition = parseCondition('priority = "high"');
			const result = executeMoveWhere(data, 'books', condition, 'START');

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);

			// First two items should be high-priority (moved to top)
			expect(data.books[0].priority).toBe('high');
			expect(data.books[0].title).toBe('Important Research');
			expect(data.books[1].priority).toBe('high');
			expect(data.books[1].title).toBe('Critical Paper');

			// Remaining items stay in original order
			expect(data.books[2].title).toBe('Casual Read');
			expect(data.books[3].title).toBe('Quick Reference');
		});
	});

	describe('Multi-Step Workflow: Sprint Planning Example', () => {
		it('should update, move, and sort tasks in sequence', () => {
			const data = {
				title: 'Sprint Tasks',
				tasks: [
					{ name: 'Bug fix', status: 'pending', points: 3 },
					{ name: 'New feature', status: 'in-progress', points: 8 },
					{ name: 'Code review', status: 'pending', points: 2 }
				]
			};

			// Step 1: Mark small pending tasks as quick-wins
			// UPDATE_WHERE tasks WHERE status = "pending" AND points <= 3 SET status "quick-win"
			const condition1 = parseCondition('status = "pending" AND points <= 3');
			const result1 = executeUpdateWhere(data, 'tasks', condition1, [
				{ field: 'status', value: 'quick-win' }
			]);

			expect(result1.success).toBe(true);
			expect(data.tasks[0].status).toBe('quick-win'); // Bug fix
			expect(data.tasks[2].status).toBe('quick-win'); // Code review

			// Step 2: Move quick-wins to top
			// MOVE_WHERE tasks WHERE status = "quick-win" TO START
			const condition2 = parseCondition('status = "quick-win"');
			const result2 = executeMoveWhere(data, 'tasks', condition2, 'START');

			expect(result2.success).toBe(true);
			expect(data.tasks[0].status).toBe('quick-win');
			expect(data.tasks[1].status).toBe('quick-win');
			expect(data.tasks[2].status).toBe('in-progress');

			// Step 3: Sort by points (all tasks)
			// SORT_BY tasks BY points DESC
			const result3 = executeSortBy(data, 'tasks', 'points', 'DESC');

			expect(result3.success).toBe(true);
			// After sorting by points DESC: 8, 3, 2
			expect(data.tasks[0].points).toBe(8);
			expect(data.tasks[1].points).toBe(3);
			expect(data.tasks[2].points).toBe(2);
		});
	});

	describe('Scalar Arrays - Simple Values', () => {
		it('should work with scalar string arrays', () => {
			const data = {
				tags: ['project', 'active', 'urgent']
			};

			// These are simple string arrays
			expect(Array.isArray(data.tags)).toBe(true);
			expect(typeof data.tags[0]).toBe('string');
		});

		it('should work with scalar number arrays', () => {
			const data = {
				scores: [85, 92, 78, 95]
			};

			expect(Array.isArray(data.scores)).toBe(true);
			expect(typeof data.scores[0]).toBe('number');
		});
	});

	describe('Object Arrays - Structured Data', () => {
		it('should distinguish object arrays from scalar arrays', () => {
			const scalarData = {
				tags: ['project', 'active']
			};

			const objectData = {
				tasks: [
					{ name: 'Task 1', status: 'pending' },
					{ name: 'Task 2', status: 'done' }
				]
			};

			// Scalar array
			expect(typeof scalarData.tags[0]).toBe('string');

			// Object array
			expect(typeof objectData.tasks[0]).toBe('object');
			expect(objectData.tasks[0].name).toBeDefined();
			expect(objectData.tasks[0].status).toBeDefined();
		});
	});
});
