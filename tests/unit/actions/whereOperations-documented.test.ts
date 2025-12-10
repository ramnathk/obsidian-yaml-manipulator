/**
 * Tests for _WHERE Operations - Based on Documentation Examples
 * Tests both unit-level operations and integration with file-level conditions
 *
 * Documentation references:
 * - docs-site/guide/actions.md - Array of Objects Operations
 * - docs-site/reference/examples.md - Working with Arrays of Objects
 */

import { describe, it, expect } from 'vitest';
import {
	executeUpdateWhere,
	executeMoveWhere,
	executeSortBy,
} from '../../../src/actions/arrayActions';
import { parseCondition } from '../../../src/parser/conditionParser';
import { evaluateCondition } from '../../../src/evaluator/conditionEvaluator';

describe('UPDATE_WHERE - Documented Examples', () => {
	describe('Example: Task Reassignment', () => {
		it('should reassign all of Bob\'s tasks to Alice', () => {
			const data = {
				tasks: [
					{ name: 'Design mockups', assignee: 'Alice' },
					{ name: 'Write tests', assignee: 'Bob' },
					{ name: 'Deploy', assignee: 'Bob' },
				],
			};

			const condition = parseCondition('assignee = "Bob"');
			const result = executeUpdateWhere(data, 'tasks', condition, [
				{ field: 'assignee', value: 'Alice' },
			]);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);

			// Alice's task unchanged
			expect(data.tasks[0].assignee).toBe('Alice');
			// Bob's tasks changed to Alice
			expect(data.tasks[1].assignee).toBe('Alice');
			expect(data.tasks[2].assignee).toBe('Alice');
		});

		it('should update multiple fields at once', () => {
			const data = {
				tasks: [
					{ name: 'Review PR #123', status: 'pending', priority: 8, assignee: 'alice' },
					{ name: 'Update documentation', status: 'pending', priority: 3, assignee: 'bob' },
					{ name: 'Fix critical bug', status: 'done', priority: 9, assignee: 'alice' },
				],
			};

			const condition = parseCondition('status = "pending" AND priority >= 7');
			const result = executeUpdateWhere(data, 'tasks', condition, [
				{ field: 'status', value: 'urgent' },
				{ field: 'flagged', value: true },
				{ field: 'reviewDate', value: '2025-12-03' },
			]);

			expect(result.success).toBe(true);

			// First task matches: pending AND priority >= 7
			expect(data.tasks[0].status).toBe('urgent');
			expect(data.tasks[0].flagged).toBe(true);
			expect(data.tasks[0].reviewDate).toBe('2025-12-03');

			// Second task doesn't match (priority too low)
			expect(data.tasks[1].status).toBe('pending');
			expect(data.tasks[1].flagged).toBeUndefined();

			// Third task doesn't match (already done)
			expect(data.tasks[2].status).toBe('done');
			expect(data.tasks[2].flagged).toBeUndefined();
		});
	});

	describe('Example: Meeting Cancellation', () => {
		it('should cancel scheduled meetings with specific attendee', () => {
			const data = {
				meetings: [
					{ title: 'Planning', status: 'scheduled', attendees: ['Alice', 'Bob', 'Charlie'] },
					{ title: 'Review', status: 'scheduled', attendees: ['Alice', 'Charlie'] },
					{ title: 'Standup', status: 'completed', attendees: ['Alice', 'Bob'] },
				],
			};

			const condition = parseCondition('status = "scheduled" AND attendees HAS "Bob"');
			const result = executeUpdateWhere(data, 'meetings', condition, [
				{ field: 'status', value: 'cancelled' },
				{ field: 'cancelledDate', value: '2025-12-03' },
			]);

			expect(result.success).toBe(true);

			// First meeting: scheduled + has Bob
			expect(data.meetings[0].status).toBe('cancelled');
			expect(data.meetings[0].cancelledDate).toBe('2025-12-03');

			// Second meeting: scheduled but no Bob
			expect(data.meetings[1].status).toBe('scheduled');
			expect(data.meetings[1].cancelledDate).toBeUndefined();

			// Third meeting: has Bob but already completed
			expect(data.meetings[2].status).toBe('completed');
			expect(data.meetings[2].cancelledDate).toBeUndefined();
		});
	});

	describe('Example: Auto-Complete Books (Field Comparison)', () => {
		it.skip('TODO: Field-to-field comparison - mark books as finished when currentPage equals total pages', () => {
			// Feature: Compare two fields in WHERE clause instead of field-to-literal
			// Current syntax: WHERE currentPage = 328 (field compared to literal value)
			// Desired syntax: WHERE currentPage = pages (two fields compared)
			//
			// Use case: Auto-complete books when currentPage reaches total pages
			// Requirements: docs/prp/requirements.md - Example 3
			// Implementation: Extend conditionEvaluator to detect field-to-field comparisons

			const data = {
				readingList: [
					{ title: '1984', pages: 328, currentPage: 328, status: 'reading' },
					{ title: 'Dune', pages: 688, currentPage: 350, status: 'reading' },
					{ title: 'Foundation', pages: 255, currentPage: 255, status: 'reading' },
				],
			};

			// When implemented, this should compare currentPage field to pages field
			// const condition = parseCondition('currentPage = pages');
			// const result = executeUpdateWhere(data, 'readingList', condition, [
			// 	{ field: 'status', value: 'finished' },
			// 	{ field: 'completedDate', value: '2025-12-03' },
			// ]);

			// expect(result.success).toBe(true);
			// expect(data.readingList[0].status).toBe('finished'); // 328 = 328
			// expect(data.readingList[1].status).toBe('reading');   // 350 != 688
			// expect(data.readingList[2].status).toBe('finished');  // 255 = 255
		});

		it('should mark books as finished when currentPage reaches specific value', () => {
			const data = {
				readingList: [
					{ title: '1984', pages: 328, currentPage: 328, status: 'reading' },
					{ title: 'Dune', pages: 688, currentPage: 350, status: 'reading' },
				],
			};

			// Workaround: Use literal value comparison
			const condition = parseCondition('currentPage = 328');
			const result = executeUpdateWhere(data, 'readingList', condition, [
				{ field: 'status', value: 'finished' },
				{ field: 'completedDate', value: '2025-12-03' },
			]);

			expect(result.success).toBe(true);
			expect(data.readingList[0].status).toBe('finished');
			expect(data.readingList[0].completedDate).toBe('2025-12-03');
			expect(data.readingList[1].status).toBe('reading'); // Not 328
		});
	});
});

describe('MOVE_WHERE - Documented Examples', () => {
	describe('Example: Prioritize Unwatched Movies', () => {
		it('should move unwatched movies to top while preserving order', () => {
			const data = {
				watchlist: [
					{ title: 'Inception', watched: true },
					{ title: 'Interstellar', watched: false },
					{ title: 'The Matrix', watched: true },
					{ title: 'Arrival', watched: false },
				],
			};

			const condition = parseCondition('watched = false');
			const result = executeMoveWhere(data, 'watchlist', condition, 'START');

			expect(result.success).toBe(true);

			// Unwatched movies moved to top (preserving their relative order)
			expect(data.watchlist[0].title).toBe('Interstellar');
			expect(data.watchlist[0].watched).toBe(false);
			expect(data.watchlist[1].title).toBe('Arrival');
			expect(data.watchlist[1].watched).toBe(false);

			// Watched movies stay below (preserving their relative order)
			expect(data.watchlist[2].title).toBe('Inception');
			expect(data.watchlist[2].watched).toBe(true);
			expect(data.watchlist[3].title).toBe('The Matrix');
			expect(data.watchlist[3].watched).toBe(true);
		});
	});

	describe('Example: Move High-Priority Tasks to Top', () => {
		it('should move tasks with priority >= 8 to the beginning', () => {
			const data = {
				tasks: [
					{ name: 'Update docs', priority: 3 },
					{ name: 'Fix security bug', priority: 9 },
					{ name: 'Write tests', priority: 5 },
					{ name: 'Review PR', priority: 8 },
				],
			};

			const condition = parseCondition('priority >= 8');
			const result = executeMoveWhere(data, 'tasks', condition, 'START');

			expect(result.success).toBe(true);

			// High priority tasks moved to top
			expect(data.tasks[0].priority).toBe(9); // Fix security bug
			expect(data.tasks[1].priority).toBe(8); // Review PR

			// Lower priority tasks stay below (preserving order)
			expect(data.tasks[2].priority).toBe(3); // Update docs
			expect(data.tasks[3].priority).toBe(5); // Write tests
		});
	});

	describe('Example: Move High-Priority Books to Top', () => {
		it('should prioritize high-priority books while preserving other order', () => {
			const data = {
				books: [
					{ title: 'Casual Read', priority: 'normal', pages: 200 },
					{ title: 'Important Research', priority: 'high', pages: 450 },
					{ title: 'Quick Reference', priority: 'low', pages: 50 },
					{ title: 'Critical Paper', priority: 'high', pages: 30 },
				],
			};

			const condition = parseCondition('priority = "high"');
			const result = executeMoveWhere(data, 'books', condition, 'START');

			expect(result.success).toBe(true);

			// High priority books moved to top (preserving their relative order)
			expect(data.books[0].priority).toBe('high');
			expect(data.books[0].title).toBe('Important Research');
			expect(data.books[1].priority).toBe('high');
			expect(data.books[1].title).toBe('Critical Paper');

			// Other books stay below
			expect(data.books[2].priority).toBe('normal');
			expect(data.books[3].priority).toBe('low');
		});
	});

	describe('Example: Move to END', () => {
		it('should move completed tasks to the end', () => {
			const data = {
				tasks: [
					{ name: 'Task A', status: 'active' },
					{ name: 'Task B', status: 'done' },
					{ name: 'Task C', status: 'active' },
					{ name: 'Task D', status: 'done' },
				],
			};

			const condition = parseCondition('status = "done"');
			const result = executeMoveWhere(data, 'tasks', condition, 'END');

			expect(result.success).toBe(true);

			// Active tasks stay at top
			expect(data.tasks[0].status).toBe('active');
			expect(data.tasks[1].status).toBe('active');

			// Done tasks moved to end
			expect(data.tasks[2].status).toBe('done');
			expect(data.tasks[3].status).toBe('done');
		});
	});

	describe('Example: Relative Positioning (AFTER)', () => {
		it('should move urgent items after a specific item', () => {
			const data = {
				tasks: [
					{ name: 'Planning meeting', priority: 'normal' },
					{ name: 'Code review', priority: 'urgent' },
					{ name: 'Write docs', priority: 'low' },
					{ name: 'Fix bug', priority: 'urgent' },
				],
			};

			const condition = parseCondition('priority = "urgent"');
			const reference = parseCondition('name = "Planning meeting"');
			const result = executeMoveWhere(data, 'tasks', condition, {
				position: 'AFTER',
				reference,
			});

			expect(result.success).toBe(true);

			// Planning meeting stays first
			expect(data.tasks[0].name).toBe('Planning meeting');

			// Urgent items moved after Planning meeting
			expect(data.tasks[1].priority).toBe('urgent');
			expect(data.tasks[2].priority).toBe('urgent');

			// Other items follow
			expect(data.tasks[3].name).toBe('Write docs');
		});
	});
});

describe('SORT_BY - Documented Examples', () => {
	describe('Example: Sort Tasks by Priority', () => {
		it('should sort tasks by priority in descending order', () => {
			const data = {
				tasks: [
					{ name: 'Write tests', priority: 3 },
					{ name: 'Fix security issue', priority: 9 },
					{ name: 'Update README', priority: 1 },
					{ name: 'Review code', priority: 7 },
				],
			};

			const result = executeSortBy(data, 'tasks', 'priority', 'DESC');

			expect(result.success).toBe(true);

			// Sorted from highest to lowest priority
			expect(data.tasks[0].priority).toBe(9); // Fix security issue
			expect(data.tasks[1].priority).toBe(7); // Review code
			expect(data.tasks[2].priority).toBe(3); // Write tests
			expect(data.tasks[3].priority).toBe(1); // Update README
		});
	});
});

describe('Integration Tests - File-level Condition + _WHERE Operations', () => {
	describe('Double Filtering: File condition + UPDATE_WHERE', () => {
		it('should only update tasks in files that have tasks field', () => {
			// File 1: Has tasks
			const file1 = {
				title: 'Project Tasks',
				tasks: [
					{ name: 'Task A', assignee: 'Bob', status: 'pending' },
					{ name: 'Task B', assignee: 'Alice', status: 'pending' },
				],
			};

			// File 2: Has tasks
			const file2 = {
				title: 'Other Tasks',
				tasks: [
					{ name: 'Task C', assignee: 'Bob', status: 'pending' },
				],
			};

			// File 3: No tasks field
			const file3 = {
				title: 'Notes',
				content: 'Some notes',
			};

			const files = [file1, file2, file3];

			// Filter files that have tasks field
			const fileLevelCondition = parseCondition('tasks exists');
			const matchingFiles = files.filter((file) =>
				evaluateCondition(fileLevelCondition, file)
			);

			expect(matchingFiles).toHaveLength(2);
			expect(matchingFiles).toContain(file1);
			expect(matchingFiles).toContain(file2);

			// Apply UPDATE_WHERE to matching files only
			const objectCondition = parseCondition('assignee = "Bob"');
			matchingFiles.forEach((file) => {
				executeUpdateWhere(file, 'tasks', objectCondition, [
					{ field: 'assignee', value: 'Alice' },
					{ field: 'reassignedDate', value: '2025-12-03' },
				]);
			});

			// Verify file1
			expect(file1.tasks[0].assignee).toBe('Alice'); // Was Bob
			expect(file1.tasks[0].reassignedDate).toBe('2025-12-03');
			expect(file1.tasks[1].assignee).toBe('Alice'); // Was already Alice
			expect(file1.tasks[1].reassignedDate).toBeUndefined(); // Not updated

			// Verify file2
			expect(file2.tasks[0].assignee).toBe('Alice'); // Was Bob
			expect(file2.tasks[0].reassignedDate).toBe('2025-12-03');

			// Verify file3 unchanged
			expect(file3.tasks).toBeUndefined();
		});

		it('should handle compound file-level conditions', () => {
			const file1 = {
				title: 'Active Project',
				status: 'active',
				priority: 8,
				tasks: [
					{ name: 'Task A', status: 'pending' },
				],
			};

			const file2 = {
				title: 'Completed Project',
				status: 'completed',
				priority: 9,
				tasks: [
					{ name: 'Task B', status: 'pending' },
				],
			};

			const file3 = {
				title: 'Low Priority',
				status: 'active',
				priority: 3,
				tasks: [
					{ name: 'Task C', status: 'pending' },
				],
			};

			const files = [file1, file2, file3];

			// Only process active projects with priority >= 7
			const fileLevelCondition = parseCondition('status = "active" AND priority >= 7');
			const matchingFiles = files.filter((file) =>
				evaluateCondition(fileLevelCondition, file)
			);

			expect(matchingFiles).toHaveLength(1);
			expect(matchingFiles[0]).toBe(file1);

			// Update tasks in matching files
			const objectCondition = parseCondition('status = "pending"');
			matchingFiles.forEach((file) => {
				executeUpdateWhere(file, 'tasks', objectCondition, [
					{ field: 'status', value: 'urgent' },
					{ field: 'flagged', value: true },
				]);
			});

			// Only file1's tasks should be updated
			expect(file1.tasks[0].status).toBe('urgent');
			expect(file1.tasks[0].flagged).toBe(true);

			// file2 and file3 unchanged
			expect(file2.tasks[0].status).toBe('pending');
			expect(file3.tasks[0].status).toBe('pending');
		});
	});

	describe('Double Filtering: File condition + MOVE_WHERE', () => {
		it('should only move items in files matching condition', () => {
			const file1 = {
				title: 'My Watchlist',
				type: 'media',
				watchlist: [
					{ title: 'Movie A', watched: true },
					{ title: 'Movie B', watched: false },
					{ title: 'Movie C', watched: true },
					{ title: 'Movie D', watched: false },
				],
			};

			const file2 = {
				title: 'Archive',
				type: 'archive',
				watchlist: [
					{ title: 'Old Movie', watched: false },
				],
			};

			const files = [file1, file2];

			// Only process media type files
			const fileLevelCondition = parseCondition('type = "media"');
			const matchingFiles = files.filter((file) =>
				evaluateCondition(fileLevelCondition, file)
			);

			expect(matchingFiles).toHaveLength(1);
			expect(matchingFiles[0]).toBe(file1);

			// Move unwatched to top in matching files only
			const objectCondition = parseCondition('watched = false');
			matchingFiles.forEach((file) => {
				executeMoveWhere(file, 'watchlist', objectCondition, 'START');
			});

			// file1 should have unwatched movies at top
			expect(file1.watchlist[0].watched).toBe(false);
			expect(file1.watchlist[1].watched).toBe(false);
			expect(file1.watchlist[2].watched).toBe(true);
			expect(file1.watchlist[3].watched).toBe(true);

			// file2 unchanged (archive type)
			expect(file2.watchlist[0].title).toBe('Old Movie');
		});
	});

	describe('Real-world workflow: Task Management System', () => {
		it('should process sprint tasks: filter active sprints, flag urgent, prioritize', () => {
			const sprint1 = {
				title: 'Sprint 42',
				status: 'active',
				endDate: '2025-12-10',
				tasks: [
					{ name: 'Bug fix', status: 'pending', points: 3 },
					{ name: 'New feature', status: 'in-progress', points: 8 },
					{ name: 'Code review', status: 'pending', points: 2 },
					{ name: 'Critical fix', status: 'pending', points: 5 },
				],
			};

			const sprint2 = {
				title: 'Sprint 43',
				status: 'planned',
				endDate: '2025-12-24',
				tasks: [
					{ name: 'Planning', status: 'pending', points: 3 },
				],
			};

			const files = [sprint1, sprint2];

			// Step 1: Filter active sprints only
			const fileLevelCondition = parseCondition('status = "active"');
			const activeSprints = files.filter((file) =>
				evaluateCondition(fileLevelCondition, file)
			);

			expect(activeSprints).toHaveLength(1);

			// Step 2: Flag small pending tasks as quick-wins
			activeSprints.forEach((sprint) => {
				const quickWinCondition = parseCondition('status = "pending" AND points <= 3');
				executeUpdateWhere(sprint, 'tasks', quickWinCondition, [
					{ field: 'status', value: 'quick-win' },
				]);
			});

			expect(sprint1.tasks[0].status).toBe('quick-win'); // Bug fix
			expect(sprint1.tasks[1].status).toBe('in-progress'); // Unchanged
			expect(sprint1.tasks[2].status).toBe('quick-win'); // Code review
			expect(sprint1.tasks[3].status).toBe('pending'); // Critical fix (points > 3)

			// Step 3: Move quick-wins to top
			activeSprints.forEach((sprint) => {
				const quickWinCondition = parseCondition('status = "quick-win"');
				executeMoveWhere(sprint, 'tasks', quickWinCondition, 'START');
			});

			expect(sprint1.tasks[0].status).toBe('quick-win');
			expect(sprint1.tasks[1].status).toBe('quick-win');
			expect(sprint1.tasks[2].status).toBe('in-progress');
			expect(sprint1.tasks[3].status).toBe('pending');

			// Step 4: Sort all tasks by points (descending)
			activeSprints.forEach((sprint) => {
				executeSortBy(sprint, 'tasks', 'points', 'DESC');
			});

			// Final order: ALL tasks sorted by points DESC (regardless of status)
			expect(sprint1.tasks[0].points).toBe(8); // in-progress (highest points)
			expect(sprint1.tasks[1].points).toBe(5); // pending
			expect(sprint1.tasks[2].points).toBe(3); // quick-win
			expect(sprint1.tasks[3].points).toBe(2); // quick-win (lowest points)

			// Sprint 2 unchanged (not active)
			expect(sprint2.tasks[0].status).toBe('pending');
		});
	});

	describe('Real-world workflow: Reading List Management', () => {
		it('should process reading lists: filter user lists, mark books by page count, prioritize', () => {
			const user1 = {
				title: 'Alice\'s Reading List',
				owner: 'alice',
				readingList: [
					{ title: 'Book A', pages: 300, currentPage: 300, priority: 'normal' },
					{ title: 'Book B', pages: 450, currentPage: 200, priority: 'high' },
					{ title: 'Book C', pages: 200, currentPage: 200, priority: 'normal' },
				],
			};

			const user2 = {
				title: 'Bob\'s Reading List',
				owner: 'bob',
				readingList: [
					{ title: 'Book D', pages: 500, currentPage: 500, priority: 'low' },
				],
			};

			const files = [user1, user2];

			// Step 1: Filter Alice's lists only
			const fileLevelCondition = parseCondition('owner = "alice"');
			const aliceLists = files.filter((file) =>
				evaluateCondition(fileLevelCondition, file)
			);

			expect(aliceLists).toHaveLength(1);

			// Step 2: Mark books with high page count (workaround for field-to-field comparison)
			aliceLists.forEach((list) => {
				const highPageCondition = parseCondition('currentPage >= 200');
				executeUpdateWhere(list, 'readingList', highPageCondition, [
					{ field: 'status', value: 'significant' },
					{ field: 'markedDate', value: '2025-12-03' },
				]);
			});

			expect(user1.readingList[0].status).toBe('significant'); // Book A (300 pages)
			expect(user1.readingList[1].status).toBe('significant'); // Book B (200 pages)
			expect(user1.readingList[2].status).toBe('significant'); // Book C (200 pages)

			// Step 3: Move high priority to top
			aliceLists.forEach((list) => {
				const highPriorityCondition = parseCondition('priority = "high"');
				executeMoveWhere(list, 'readingList', highPriorityCondition, 'START');
			});

			expect(user1.readingList[0].priority).toBe('high'); // Book B moved to top
			expect(user1.readingList[1].priority).toBe('normal'); // Book A
			expect(user1.readingList[2].priority).toBe('normal'); // Book C

			// Bob's list unchanged
			expect(user2.readingList[0].status).toBeUndefined();
		});
	});
});

describe('Edge Cases and Error Handling', () => {
	it('should handle empty arrays gracefully', () => {
		const data = { tasks: [] };

		const condition = parseCondition('assignee = "Bob"');
		const result = executeUpdateWhere(data, 'tasks', condition, [
			{ field: 'assignee', value: 'Alice' },
		]);

		expect(result.success).toBe(true);
		expect(result.modified).toBe(false); // Nothing to modify
		expect(data.tasks).toHaveLength(0);
	});

	it('should handle missing field gracefully', () => {
		const data = { title: 'Test' }; // No tasks field

		const condition = parseCondition('assignee = "Bob"');
		const result = executeUpdateWhere(data, 'tasks', condition, [
			{ field: 'assignee', value: 'Alice' },
		]);

		expect(result.success).toBe(false);
		expect(result.error).toContain('tasks');
	});

	it('should handle no matches in UPDATE_WHERE', () => {
		const data = {
			tasks: [
				{ name: 'Task A', assignee: 'Alice' },
				{ name: 'Task B', assignee: 'Charlie' },
			],
		};

		const condition = parseCondition('assignee = "Bob"');
		const result = executeUpdateWhere(data, 'tasks', condition, [
			{ field: 'assignee', value: 'Alice' },
		]);

		expect(result.success).toBe(true);
		expect(result.modified).toBe(false); // No items matched

		// Original data unchanged
		expect(data.tasks[0].assignee).toBe('Alice');
		expect(data.tasks[1].assignee).toBe('Charlie');
	});

	it('should handle no matches in MOVE_WHERE', () => {
		const data = {
			tasks: [
				{ name: 'Task A', status: 'active' },
				{ name: 'Task B', status: 'active' },
			],
		};

		const condition = parseCondition('status = "done"');
		const result = executeMoveWhere(data, 'tasks', condition, 'START');

		expect(result.success).toBe(true);
		expect(result.modified).toBe(false); // No items matched

		// Order unchanged
		expect(data.tasks[0].name).toBe('Task A');
		expect(data.tasks[1].name).toBe('Task B');
	});
});
