/**
 * Tests for Action Parser
 */

import { describe, it, expect } from 'vitest';
import { parseAction, ActionParserError } from '../../../src/parser/actionParser';

/**
 * Helper: Convert v2 AST to v1-style object for backward-compatible testing
 */
function toV1AST(ast: any): any {
	if (ast.type !== 'action') return ast;

	const operation = ast.operation;

	// Build path from segments
	let path = '';
	if (ast.target?.segments) {
		path = ast.target.segments.map((seg: any) => {
			if (seg.type === 'property') return seg.key;
			if (seg.type === 'index') return `[${seg.index}]`;
			return seg.key;
		}).join('.');
		// Clean up array index formatting
		path = path.replace(/\.\[/g, '[');
	}

	const v1: any = {
		op: operation.type,
		path,
	};

	// Special handling for INSERT → INSERT_AT
	if (operation.type === 'INSERT' && 'index' in operation) {
		v1.op = 'INSERT_AT';
	}

	// Special handling for RENAME
	if (operation.type === 'RENAME') {
		v1.oldPath = path;
		v1.newPath = operation.to;
		delete v1.path;
	}

	// Special handling for MOVE
	if (operation.type === 'MOVE') {
		if ('from' in operation) v1.fromIndex = operation.from;
		if ('to' in operation && typeof operation.to === 'number') v1.toIndex = operation.to;
		if ('to' in operation && typeof operation.to === 'string') v1.target = operation.to;
	}

	// Special handling for MOVE_WHERE
	if (operation.type === 'MOVE' && operation.where) {
		v1.op = 'MOVE_WHERE';
		v1.condition = operation.where;
		if (operation.to === 0) v1.target = 'START';
		else if (typeof operation.to === 'string') v1.target = operation.to;
		else if (typeof operation.to === 'number') v1.target = operation.to;
	}

	// Special handling for UPDATE_WHERE
	if (operation.type === 'SET' && operation.where) {
		v1.op = 'UPDATE_WHERE';
		v1.condition = operation.where;
	}

	// Special handling for SORT_BY
	if (operation.by) {
		v1.op = 'SORT_BY';
		v1.field = operation.by;
	}

	// Copy operation properties to top level
	if ('value' in operation) v1.value = operation.value;
	if ('to' in operation && operation.type !== 'MOVE' && operation.type !== 'RENAME') v1.to = operation.to;
	if ('index' in operation) v1.index = operation.index;
	if ('oldValue' in operation) v1.oldValue = operation.oldValue;
	if ('newValue' in operation) v1.newValue = operation.newValue;
	if ('referenceValue' in operation) v1.referenceValue = operation.referenceValue;
	if ('order' in operation) v1.order = operation.order;
	if ('updates' in operation) v1.updates = operation.updates;

	return v1;
}

describe('Action Parser', () => {
	describe('Basic operations', () => {
		it('should parse SET', () => {
			const ast = parseAction('SET status "published"');
			expect(toV1AST(ast)).toMatchObject({
				op: 'SET',
				path: 'status',
				value: 'published',
			});
		});

		it('should parse SET with number', () => {
			const ast = parseAction('SET priority 5');
			expect(toV1AST(ast)).toMatchObject({
				op: 'SET',
				path: 'priority',
				value: 5,
			});
		});

		it('should parse SET with boolean', () => {
			const ast = parseAction('SET verified true');
			expect(toV1AST(ast)).toMatchObject({
				op: 'SET',
				path: 'verified',
				value: true,
			});
		});

		it('should parse SET with null', () => {
			const ast = parseAction('SET deletedAt null');
			expect(toV1AST(ast)).toMatchObject({
				op: 'SET',
				path: 'deletedAt',
				value: null,
			});
		});

		it('should parse ADD', () => {
			const ast = parseAction('ADD createdDate "2025-11-20"');
			expect(toV1AST(ast)).toMatchObject({
				op: 'ADD',
				path: 'createdDate',
				value: '2025-11-20',
			});
		});

		it('should parse DELETE', () => {
			const ast = parseAction('DELETE draft');
			expect(toV1AST(ast)).toMatchObject({
				op: 'DELETE',
				path: 'draft',
			});
		});

		it('should parse RENAME', () => {
			const ast = parseAction('RENAME oldName newName');
			expect(toV1AST(ast)).toMatchObject({
				op: 'RENAME',
				oldPath: 'oldName',
				newPath: 'newName',
			});
		});
	});

	describe('Nested paths', () => {
		it('should parse SET with nested path', () => {
			const ast = parseAction('SET metadata.author "John"');
			expect(toV1AST(ast)).toMatchObject({
				op: 'SET',
				path: 'metadata.author',
				value: 'John',
			});
		});

		it('should parse SET with array index', () => {
			const ast = parseAction('SET items[0] "first"');
			expect(toV1AST(ast)).toMatchObject({
				op: 'SET',
				path: 'items[0]',
				value: 'first',
			});
		});

		it('should parse SET with nested array path', () => {
			const ast = parseAction('SET countsLog[0].mantra "Great Gatsby"');
			expect(toV1AST(ast)).toMatchObject({
				op: 'SET',
				path: 'countsLog[0].mantra',
				value: 'Great Gatsby',
			});
		});

		it('should parse DELETE with nested path', () => {
			const ast = parseAction('DELETE metadata.tempField');
			expect(toV1AST(ast)).toMatchObject({
				op: 'DELETE',
				path: 'metadata.tempField',
			});
		});
	});

	describe('Array operations - basic', () => {
		it('should parse APPEND', () => {
			const ast = parseAction('FOR tags APPEND "urgent"');
			expect(toV1AST(ast)).toMatchObject({
				op: 'APPEND',
				path: 'tags',
				value: 'urgent',
			});
		});

		it('should parse PREPEND', () => {
			const ast = parseAction('FOR tags PREPEND "important"');
			expect(toV1AST(ast)).toMatchObject({
				op: 'PREPEND',
				path: 'tags',
				value: 'important',
			});
		});

		it('should parse INSERT_AT', () => {
			const ast = parseAction('FOR tags INSERT "middle" AT 2');
			expect(toV1AST(ast)).toMatchObject({
				op: 'INSERT_AT',
				path: 'tags',
				value: 'middle',
				index: 2,
			});
		});

		it('should parse FOR with INSERT negative index', () => {
			const ast = parseAction('FOR tags INSERT "before-last" AT -1');
			expect(toV1AST(ast)).toMatchObject({
				op: 'INSERT_AT',
				path: 'tags',
				value: 'before-last',
				index: -1,
			});
		});


		it('should parse REMOVE', () => {
			const ast = parseAction('FOR tags REMOVE "draft"');
			expect(toV1AST(ast)).toMatchObject({
				op: 'REMOVE',
				path: 'tags',
				value: 'draft',
			});
		});

		it('should parse REMOVE_ALL', () => {
			const ast = parseAction('FOR tags REMOVE_ALL "duplicate"');
			expect(toV1AST(ast)).toMatchObject({
				op: 'REMOVE_ALL',
				path: 'tags',
				value: 'duplicate',
			});
		});


		it('should parse DEDUPLICATE', () => {
			const ast = parseAction('FOR tags DEDUPLICATE');
			expect(toV1AST(ast)).toMatchObject({
				op: 'DEDUPLICATE',
				path: 'tags',
			});
		});
	});

	describe('Array operations - sorting', () => {
		it('should parse SORT with ASC', () => {
			const ast = parseAction('FOR tags SORT ASC');
			expect(toV1AST(ast)).toMatchObject({
				op: 'SORT',
				path: 'tags',
				order: 'ASC',
			});
		});

		it('should parse SORT with DESC', () => {
			const ast = parseAction('FOR priorities SORT DESC');
			expect(toV1AST(ast)).toMatchObject({
				op: 'SORT',
				path: 'priorities',
				order: 'DESC',
			});
		});

		it('should parse SORT without order (defaults to ASC)', () => {
			const ast = parseAction('FOR tags SORT');
			expect(toV1AST(ast)).toMatchObject({
				op: 'SORT',
				path: 'tags',
				order: 'ASC',
			});
		});

		it('should parse SORT_BY with ASC', () => {
			const ast = parseAction('FOR countsLog SORT BY mantra ASC');
			expect(toV1AST(ast)).toMatchObject({
				op: 'SORT_BY',
				path: 'countsLog',
				field: 'mantra',
				order: 'ASC',
			});
		});

		it('should parse SORT_BY with DESC', () => {
			const ast = parseAction('FOR countsLog SORT BY count DESC');
			expect(toV1AST(ast)).toMatchObject({
				op: 'SORT_BY',
				path: 'countsLog',
				field: 'count',
				order: 'DESC',
			});
		});

		it('should parse SORT_BY without order (defaults to ASC)', () => {
			const ast = parseAction('FOR items SORT BY date');
			expect(toV1AST(ast)).toMatchObject({
				op: 'SORT_BY',
				path: 'items',
				field: 'date',
				order: 'ASC',
			});
		});
	});

	describe('Array operations - moving', () => {
		it('should parse MOVE', () => {
			const ast = parseAction('FOR countsLog MOVE FROM 1 TO 0');
			expect(toV1AST(ast)).toMatchObject({
				op: 'MOVE',
				path: 'countsLog',
				fromIndex: 1,
				toIndex: 0,
			});
		});

		it('should parse MOVE with negative indices', () => {
			const ast = parseAction('FOR countsLog MOVE FROM 0 TO -1');
			expect(toV1AST(ast)).toMatchObject({
				op: 'MOVE',
				path: 'countsLog',
				fromIndex: 0,
				toIndex: -1,
			});
		});
	});

	describe('MOVE_WHERE operation', () => {
		it('should parse MOVE_WHERE with TO START', () => {
			const ast = parseAction('FOR countsLog WHERE mantra="Brave New World" MOVE TO START');
			expect(toV1AST(ast)).toMatchObject({
				op: 'MOVE_WHERE',
				path: 'countsLog',
				target: 'START',
			});
			expect(toV1AST(ast).op).toBe('MOVE_WHERE');
			if (ast.operation?.where) {
				expect(ast.operation.where.type).toBe('comparison');
			}
		});

		it('should parse MOVE_WHERE with TO END', () => {
			const ast = parseAction('FOR countsLog WHERE count > 5 MOVE TO END');
			expect(toV1AST(ast)).toMatchObject({
				op: 'MOVE_WHERE',
				path: 'countsLog',
				target: 'END',
			});
		});

		it('should parse MOVE_WHERE with TO index', () => {
			const ast = parseAction('FOR countsLog WHERE mantra="Brave New World" TO 0');
			expect(toV1AST(ast)).toMatchObject({
				op: 'MOVE_WHERE',
				path: 'countsLog',
				target: 'START', // 0 converts to START
			});
		});

		it('should parse MOVE_WHERE with AFTER condition', () => {
			const ast = parseAction('FOR countsLog WHERE mantra="Brave New World" AFTER mantra="Great Gatsby"');
			expect(toV1AST(ast).op).toBe('MOVE_WHERE');
			if (ast.operation?.where) {
				expect(typeof ast.operation.to).toBe('object');
				if (typeof ast.operation.to === 'object') {
					expect(ast.operation.to.position).toBe('AFTER');
					expect(ast.operation.to.reference.type).toBe('comparison');
				}
			}
		});

		it('should parse MOVE_WHERE with BEFORE condition', () => {
			const ast = parseAction('FOR countsLog WHERE mantra="Brave New World" BEFORE mantra="Beloved"');
			expect(toV1AST(ast).op).toBe('MOVE_WHERE');
			if (ast.operation?.where) {
				expect(typeof ast.operation.to).toBe('object');
				if (typeof ast.operation.to === 'object') {
					expect(ast.operation.to.position).toBe('BEFORE');
				}
			}
		});
	});

	describe('UPDATE_WHERE operation', () => {
		it('should parse UPDATE_WHERE with single field', () => {
			const ast = parseAction('FOR countsLog WHERE mantra="Brave New World" SET unit "Meditations"');
			expect(toV1AST(ast).op).toBe('UPDATE_WHERE');
			if (ast.operation?.where) {
				expect(ast.target?.segments?.[0]?.key).toBe('countsLog');
				expect(ast.operation.where.type).toBe('comparison');
				expect(ast.operation.updates).toHaveLength(1);
				expect(ast.operation.updates[0]).toMatchObject({ field: 'unit', value: 'Meditations' });
			}
		});

		it('should parse UPDATE_WHERE with multiple fields', () => {
			const ast = parseAction('FOR countsLog WHERE mantra="Brave New World" SET unit "Meditations", verified true, date "2025-11-19"');
			expect(toV1AST(ast).op).toBe('UPDATE_WHERE');
			if (ast.operation?.where && ast.operation.type === 'SET') {
				expect(ast.operation.updates).toHaveLength(3);
				expect(ast.operation.updates[0]).toMatchObject({ field: 'unit', value: 'Meditations' });
				expect(ast.operation.updates[1]).toMatchObject({ field: 'verified', value: true });
				expect(ast.operation.updates[2]).toMatchObject({ field: 'date', value: '2025-11-19' });
			}
		});

		it('should parse UPDATE_WHERE with complex condition', () => {
			const ast = parseAction('FOR countsLog WHERE count < 10 SET unit "Solitude"');
			expect(toV1AST(ast).op).toBe('UPDATE_WHERE');
			if (ast.operation?.where && ast.operation.type === 'SET') {
				expect(ast.operation.where.type).toBe('comparison');
				if (ast.operation.where.type === 'comparison') {
					expect(ast.operation.where.operator).toBe('<');
				}
			}
		});

		it('should parse UPDATE_WHERE with nested field update', () => {
			const ast = parseAction('FOR items WHERE status="pending" SET status "active", priority 1');
			expect(toV1AST(ast).op).toBe('UPDATE_WHERE');
			if (ast.operation?.where && ast.operation.type === 'SET') {
				expect(ast.operation.updates).toHaveLength(2);
			}
		});
	});

	describe('Object operations', () => {
		it('should parse MERGE', () => {
			const ast = parseAction('FOR metadata MERGE {"editor": "Jane", "reviewed": true}');
			expect(toV1AST(ast)).toMatchObject({
				op: 'MERGE',
				path: 'metadata',
				value: { editor: 'Jane', reviewed: true },
			});
		});

		it('should parse MERGE_OVERWRITE', () => {
			const ast = parseAction('FOR metadata MERGE_OVERWRITE {"editor": "Jane"}');
			expect(toV1AST(ast)).toMatchObject({
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
			expect(() => parseAction('FOR tags INSERT "value" 2')).toThrow(ActionParserError);
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
			expect(() => parseAction('FOR countsLog WHERE mantra="Brave New World" unit "Meditations"')).toThrow();
		});

		it('should throw on FOR with MERGE non-object', () => {
			expect(() => parseAction('FOR metadata MERGE "string"')).toThrow(ActionParserError);
		});
	});

	describe('Case insensitivity', () => {
		it('should parse lowercase operations', () => {
			const ast = parseAction('set status "published"');
			expect(toV1AST(ast).op).toBe('SET');
		});

		it('should parse mixed case operations', () => {
			const ast = parseAction('FOR countsLog sort by mantra asc');
			expect(toV1AST(ast).op).toBe('SORT_BY');
		});
	});

	describe('Real-world examples from requirements', () => {
		it('should parse: SET status "published"', () => {
			const ast = parseAction('SET status "published"');
			expect(toV1AST(ast)).toMatchObject({
				op: 'SET',
				path: 'status',
				value: 'published',
			});
		});

		it('should parse: FOR tags APPEND "urgent"', () => {
			const ast = parseAction('FOR tags APPEND "urgent"');
			expect(toV1AST(ast)).toMatchObject({
				op: 'APPEND',
				path: 'tags',
				value: 'urgent',
			});
		});

		it('should parse: FOR countsLog SORT BY mantra ASC', () => {
			const ast = parseAction('FOR countsLog SORT BY mantra ASC');
			expect(toV1AST(ast)).toMatchObject({
				op: 'SORT_BY',
				path: 'countsLog',
				field: 'mantra',
				order: 'ASC',
			});
		});

		it('should parse: FOR countsLog WHERE mantra="Brave New World" SET unit "Meditations"', () => {
			const ast = parseAction('FOR countsLog WHERE mantra="Brave New World" SET unit "Meditations"');
			expect(toV1AST(ast).op).toBe('UPDATE_WHERE');
		});

		it('should parse: MOVE countsLog FROM 1 TO 0', () => {
			const ast = parseAction('FOR countsLog MOVE FROM 1 TO 0');
			expect(toV1AST(ast)).toMatchObject({
				op: 'MOVE',
				path: 'countsLog',
				fromIndex: 1,
				toIndex: 0,
			});
		});

		it('should parse: DELETE metadata.tempField', () => {
			const ast = parseAction('DELETE metadata.tempField');
			expect(toV1AST(ast)).toMatchObject({
				op: 'DELETE',
				path: 'metadata.tempField',
			});
		});

		it('should parse: RENAME oldName newName', () => {
			const ast = parseAction('RENAME oldName newName');
			expect(toV1AST(ast)).toMatchObject({
				op: 'RENAME',
				oldPath: 'oldName',
				newPath: 'newName',
			});
		});
	});
});
