/**
 * Tests for Action Parser
 */

import { describe, it, expect } from 'vitest';
import { parseAction, ActionParserError } from '../../../src/parser/actionParser';

describe('Action Parser', () => {
	describe('Basic operations', () => {
		it('should parse SET', () => {
			const ast = parseAction('SET status "published"');
			expect(ast).toMatchObject({
				op: 'SET',
				path: 'status',
				value: 'published',
			});
		});

		it('should parse SET with number', () => {
			const ast = parseAction('SET priority 5');
			expect(ast).toMatchObject({
				op: 'SET',
				path: 'priority',
				value: 5,
			});
		});

		it('should parse SET with boolean', () => {
			const ast = parseAction('SET verified true');
			expect(ast).toMatchObject({
				op: 'SET',
				path: 'verified',
				value: true,
			});
		});

		it('should parse SET with null', () => {
			const ast = parseAction('SET deletedAt null');
			expect(ast).toMatchObject({
				op: 'SET',
				path: 'deletedAt',
				value: null,
			});
		});

		it('should parse ADD', () => {
			const ast = parseAction('ADD createdDate "2025-11-20"');
			expect(ast).toMatchObject({
				op: 'ADD',
				path: 'createdDate',
				value: '2025-11-20',
			});
		});

		it('should parse DELETE', () => {
			const ast = parseAction('DELETE draft');
			expect(ast).toMatchObject({
				op: 'DELETE',
				path: 'draft',
			});
		});

		it('should parse RENAME', () => {
			const ast = parseAction('RENAME oldName newName');
			expect(ast).toMatchObject({
				op: 'RENAME',
				oldPath: 'oldName',
				newPath: 'newName',
			});
		});
	});

	describe('Nested paths', () => {
		it('should parse SET with nested path', () => {
			const ast = parseAction('SET metadata.author "John"');
			expect(ast).toMatchObject({
				op: 'SET',
				path: 'metadata.author',
				value: 'John',
			});
		});

		it('should parse SET with array index', () => {
			const ast = parseAction('SET items[0] "first"');
			expect(ast).toMatchObject({
				op: 'SET',
				path: 'items[0]',
				value: 'first',
			});
		});

		it('should parse SET with nested array path', () => {
			const ast = parseAction('SET countsLog[0].mantra "Great Gatsby"');
			expect(ast).toMatchObject({
				op: 'SET',
				path: 'countsLog[0].mantra',
				value: 'Great Gatsby',
			});
		});

		it('should parse DELETE with nested path', () => {
			const ast = parseAction('DELETE metadata.tempField');
			expect(ast).toMatchObject({
				op: 'DELETE',
				path: 'metadata.tempField',
			});
		});
	});

	describe('Array operations - basic', () => {
		it('should parse APPEND', () => {
			const ast = parseAction('APPEND tags "urgent"');
			expect(ast).toMatchObject({
				op: 'APPEND',
				path: 'tags',
				value: 'urgent',
			});
		});

		it('should parse PREPEND', () => {
			const ast = parseAction('PREPEND tags "important"');
			expect(ast).toMatchObject({
				op: 'PREPEND',
				path: 'tags',
				value: 'important',
			});
		});

		it('should parse INSERT_AT', () => {
			const ast = parseAction('INSERT_AT tags "middle" AT 2');
			expect(ast).toMatchObject({
				op: 'INSERT_AT',
				path: 'tags',
				value: 'middle',
				index: 2,
			});
		});

		it('should parse INSERT_AT with negative index', () => {
			const ast = parseAction('INSERT_AT tags "before-last" AT -1');
			expect(ast).toMatchObject({
				op: 'INSERT_AT',
				path: 'tags',
				value: 'before-last',
				index: -1,
			});
		});

		it('should parse INSERT_AFTER', () => {
			const ast = parseAction('INSERT_AFTER tags "followup" AFTER "urgent"');
			expect(ast).toMatchObject({
				op: 'INSERT_AFTER',
				path: 'tags',
				value: 'followup',
				target: 'urgent',
			});
		});

		it('should parse INSERT_BEFORE', () => {
			const ast = parseAction('INSERT_BEFORE tags "pre-check" BEFORE "processed"');
			expect(ast).toMatchObject({
				op: 'INSERT_BEFORE',
				path: 'tags',
				value: 'pre-check',
				target: 'processed',
			});
		});

		it('should parse REMOVE', () => {
			const ast = parseAction('REMOVE tags "draft"');
			expect(ast).toMatchObject({
				op: 'REMOVE',
				path: 'tags',
				value: 'draft',
			});
		});

		it('should parse REMOVE_ALL', () => {
			const ast = parseAction('REMOVE_ALL tags "duplicate"');
			expect(ast).toMatchObject({
				op: 'REMOVE_ALL',
				path: 'tags',
				value: 'duplicate',
			});
		});

		it('should parse REMOVE_AT', () => {
			const ast = parseAction('REMOVE_AT tags 0');
			expect(ast).toMatchObject({
				op: 'REMOVE_AT',
				path: 'tags',
				index: 0,
			});
		});

		it('should parse REPLACE', () => {
			const ast = parseAction('REPLACE tags "old" WITH "new"');
			expect(ast).toMatchObject({
				op: 'REPLACE',
				path: 'tags',
				oldValue: 'old',
				newValue: 'new',
			});
		});

		it('should parse REPLACE_ALL', () => {
			const ast = parseAction('REPLACE_ALL tags "old-tag" WITH "new-tag"');
			expect(ast).toMatchObject({
				op: 'REPLACE_ALL',
				path: 'tags',
				oldValue: 'old-tag',
				newValue: 'new-tag',
			});
		});

		it('should parse DEDUPLICATE', () => {
			const ast = parseAction('DEDUPLICATE tags');
			expect(ast).toMatchObject({
				op: 'DEDUPLICATE',
				path: 'tags',
			});
		});
	});

	describe('Array operations - sorting', () => {
		it('should parse SORT with ASC', () => {
			const ast = parseAction('SORT tags ASC');
			expect(ast).toMatchObject({
				op: 'SORT',
				path: 'tags',
				order: 'ASC',
			});
		});

		it('should parse SORT with DESC', () => {
			const ast = parseAction('SORT priorities DESC');
			expect(ast).toMatchObject({
				op: 'SORT',
				path: 'priorities',
				order: 'DESC',
			});
		});

		it('should parse SORT without order (defaults to ASC)', () => {
			const ast = parseAction('SORT tags');
			expect(ast).toMatchObject({
				op: 'SORT',
				path: 'tags',
				order: 'ASC',
			});
		});

		it('should parse SORT_BY with ASC', () => {
			const ast = parseAction('SORT_BY countsLog BY mantra ASC');
			expect(ast).toMatchObject({
				op: 'SORT_BY',
				path: 'countsLog',
				field: 'mantra',
				order: 'ASC',
			});
		});

		it('should parse SORT_BY with DESC', () => {
			const ast = parseAction('SORT_BY countsLog BY count DESC');
			expect(ast).toMatchObject({
				op: 'SORT_BY',
				path: 'countsLog',
				field: 'count',
				order: 'DESC',
			});
		});

		it('should parse SORT_BY without order (defaults to ASC)', () => {
			const ast = parseAction('SORT_BY items BY date');
			expect(ast).toMatchObject({
				op: 'SORT_BY',
				path: 'items',
				field: 'date',
				order: 'ASC',
			});
		});
	});

	describe('Array operations - moving', () => {
		it('should parse MOVE', () => {
			const ast = parseAction('MOVE countsLog FROM 1 TO 0');
			expect(ast).toMatchObject({
				op: 'MOVE',
				path: 'countsLog',
				fromIndex: 1,
				toIndex: 0,
			});
		});

		it('should parse MOVE with negative indices', () => {
			const ast = parseAction('MOVE countsLog FROM 0 TO -1');
			expect(ast).toMatchObject({
				op: 'MOVE',
				path: 'countsLog',
				fromIndex: 0,
				toIndex: -1,
			});
		});
	});

	describe('MOVE_WHERE operation', () => {
		it('should parse MOVE_WHERE with TO START', () => {
			const ast = parseAction('MOVE_WHERE countsLog WHERE mantra="Brave New World" TO START');
			expect(ast).toMatchObject({
				op: 'MOVE_WHERE',
				path: 'countsLog',
				target: 'START',
			});
			expect(ast.op).toBe('MOVE_WHERE');
			if (ast.op === 'MOVE_WHERE') {
				expect(ast.condition.type).toBe('comparison');
			}
		});

		it('should parse MOVE_WHERE with TO END', () => {
			const ast = parseAction('MOVE_WHERE countsLog WHERE count > 5 TO END');
			expect(ast).toMatchObject({
				op: 'MOVE_WHERE',
				path: 'countsLog',
				target: 'END',
			});
		});

		it('should parse MOVE_WHERE with TO index', () => {
			const ast = parseAction('MOVE_WHERE countsLog WHERE mantra="Brave New World" TO 0');
			expect(ast).toMatchObject({
				op: 'MOVE_WHERE',
				path: 'countsLog',
				target: 'START', // 0 converts to START
			});
		});

		it('should parse MOVE_WHERE with AFTER condition', () => {
			const ast = parseAction('MOVE_WHERE countsLog WHERE mantra="Brave New World" AFTER mantra="Great Gatsby"');
			expect(ast.op).toBe('MOVE_WHERE');
			if (ast.op === 'MOVE_WHERE') {
				expect(typeof ast.target).toBe('object');
				if (typeof ast.target === 'object') {
					expect(ast.target.position).toBe('AFTER');
					expect(ast.target.reference.type).toBe('comparison');
				}
			}
		});

		it('should parse MOVE_WHERE with BEFORE condition', () => {
			const ast = parseAction('MOVE_WHERE countsLog WHERE mantra="Brave New World" BEFORE mantra="Beloved"');
			expect(ast.op).toBe('MOVE_WHERE');
			if (ast.op === 'MOVE_WHERE') {
				expect(typeof ast.target).toBe('object');
				if (typeof ast.target === 'object') {
					expect(ast.target.position).toBe('BEFORE');
				}
			}
		});
	});

	describe('UPDATE_WHERE operation', () => {
		it('should parse UPDATE_WHERE with single field', () => {
			const ast = parseAction('UPDATE_WHERE countsLog WHERE mantra="Brave New World" SET unit "Meditations"');
			expect(ast.op).toBe('UPDATE_WHERE');
			if (ast.op === 'UPDATE_WHERE') {
				expect(ast.path).toBe('countsLog');
				expect(ast.condition.type).toBe('comparison');
				expect(ast.updates).toHaveLength(1);
				expect(ast.updates[0]).toMatchObject({ field: 'unit', value: 'Meditations' });
			}
		});

		it('should parse UPDATE_WHERE with multiple fields', () => {
			const ast = parseAction('UPDATE_WHERE countsLog WHERE mantra="Brave New World" SET unit "Meditations", verified true, date "2025-11-19"');
			expect(ast.op).toBe('UPDATE_WHERE');
			if (ast.op === 'UPDATE_WHERE') {
				expect(ast.updates).toHaveLength(3);
				expect(ast.updates[0]).toMatchObject({ field: 'unit', value: 'Meditations' });
				expect(ast.updates[1]).toMatchObject({ field: 'verified', value: true });
				expect(ast.updates[2]).toMatchObject({ field: 'date', value: '2025-11-19' });
			}
		});

		it('should parse UPDATE_WHERE with complex condition', () => {
			const ast = parseAction('UPDATE_WHERE countsLog WHERE count < 10 SET unit "Solitude"');
			expect(ast.op).toBe('UPDATE_WHERE');
			if (ast.op === 'UPDATE_WHERE') {
				expect(ast.condition.type).toBe('comparison');
				if (ast.condition.type === 'comparison') {
					expect(ast.condition.operator).toBe('<');
				}
			}
		});

		it('should parse UPDATE_WHERE with nested field update', () => {
			const ast = parseAction('UPDATE_WHERE items WHERE status="pending" SET status "active", priority 1');
			expect(ast.op).toBe('UPDATE_WHERE');
			if (ast.op === 'UPDATE_WHERE') {
				expect(ast.updates).toHaveLength(2);
			}
		});
	});

	describe('Object operations', () => {
		it('should parse MERGE', () => {
			const ast = parseAction('MERGE metadata {"editor": "Jane", "reviewed": true}');
			expect(ast).toMatchObject({
				op: 'MERGE',
				path: 'metadata',
				value: { editor: 'Jane', reviewed: true },
			});
		});

		it('should parse MERGE_OVERWRITE', () => {
			const ast = parseAction('MERGE_OVERWRITE metadata {"editor": "Jane"}');
			expect(ast).toMatchObject({
				op: 'MERGE_OVERWRITE',
				path: 'metadata',
				value: { editor: 'Jane' },
			});
		});
	});

	describe('Error handling', () => {
		it('should throw on missing path', () => {
			expect(() => parseAction('SET')).toThrow(ActionParserError);
		});

		it('should throw on missing value', () => {
			expect(() => parseAction('SET status')).toThrow(ActionParserError);
		});

		it('should throw on missing AT keyword', () => {
			expect(() => parseAction('INSERT_AT tags "value" 2')).toThrow(ActionParserError);
		});

		it('should throw on missing WITH keyword', () => {
			expect(() => parseAction('REPLACE tags "old" "new"')).toThrow(ActionParserError);
		});

		it('should throw on missing BY keyword', () => {
			expect(() => parseAction('SORT_BY items field ASC')).toThrow(ActionParserError);
		});

		it('should throw on missing WHERE keyword', () => {
			expect(() => parseAction('UPDATE_WHERE countsLog mantra="Brave New World" SET unit "Meditations"')).toThrow(ActionParserError);
		});

		it('should throw on missing SET keyword in UPDATE_WHERE', () => {
			// Should throw either ActionParserError or ParserError (from condition parser)
			expect(() => parseAction('UPDATE_WHERE countsLog WHERE mantra="Brave New World" unit "Meditations"')).toThrow();
		});

		it('should throw on MERGE with non-object', () => {
			expect(() => parseAction('MERGE metadata "string"')).toThrow(ActionParserError);
		});
	});

	describe('Case insensitivity', () => {
		it('should parse lowercase operations', () => {
			const ast = parseAction('set status "published"');
			expect(ast.op).toBe('SET');
		});

		it('should parse mixed case operations', () => {
			const ast = parseAction('Sort_By countsLog by mantra asc');
			expect(ast.op).toBe('SORT_BY');
		});
	});

	describe('Real-world examples from requirements', () => {
		it('should parse: SET status "published"', () => {
			const ast = parseAction('SET status "published"');
			expect(ast).toMatchObject({
				op: 'SET',
				path: 'status',
				value: 'published',
			});
		});

		it('should parse: APPEND tags "urgent"', () => {
			const ast = parseAction('APPEND tags "urgent"');
			expect(ast).toMatchObject({
				op: 'APPEND',
				path: 'tags',
				value: 'urgent',
			});
		});

		it('should parse: SORT_BY countsLog BY mantra ASC', () => {
			const ast = parseAction('SORT_BY countsLog BY mantra ASC');
			expect(ast).toMatchObject({
				op: 'SORT_BY',
				path: 'countsLog',
				field: 'mantra',
				order: 'ASC',
			});
		});

		it('should parse: UPDATE_WHERE countsLog WHERE mantra="Brave New World" SET unit "Meditations"', () => {
			const ast = parseAction('UPDATE_WHERE countsLog WHERE mantra="Brave New World" SET unit "Meditations"');
			expect(ast.op).toBe('UPDATE_WHERE');
		});

		it('should parse: MOVE countsLog FROM 1 TO 0', () => {
			const ast = parseAction('MOVE countsLog FROM 1 TO 0');
			expect(ast).toMatchObject({
				op: 'MOVE',
				path: 'countsLog',
				fromIndex: 1,
				toIndex: 0,
			});
		});

		it('should parse: DELETE metadata.tempField', () => {
			const ast = parseAction('DELETE metadata.tempField');
			expect(ast).toMatchObject({
				op: 'DELETE',
				path: 'metadata.tempField',
			});
		});

		it('should parse: RENAME oldName newName', () => {
			const ast = parseAction('RENAME oldName newName');
			expect(ast).toMatchObject({
				op: 'RENAME',
				oldPath: 'oldName',
				newPath: 'newName',
			});
		});
	});
});
