/**
 * Tests for Condition Parser
 */

import { describe, it, expect } from 'vitest';
import { parseCondition, ParserError } from '../../../src/parser/conditionParser';
import { ConditionAST } from '../../../src/types';

describe('Condition Parser', () => {
	describe('Basic comparisons', () => {
		it('should parse equality comparison', () => {
			const ast = parseCondition('status = "draft"');
			expect(ast).toMatchObject({
				type: 'comparison',
				left: 'status',
				operator: '=',
				right: 'draft',
			});
		});

		it('should parse inequality comparison', () => {
			const ast = parseCondition('status != "published"');
			expect(ast).toMatchObject({
				type: 'comparison',
				left: 'status',
				operator: '!=',
				right: 'published',
			});
		});

		it('should parse greater than', () => {
			const ast = parseCondition('priority > 5');
			expect(ast).toMatchObject({
				type: 'comparison',
				left: 'priority',
				operator: '>',
				right: 5,
			});
		});

		it('should parse less than or equal', () => {
			const ast = parseCondition('count <= 100');
			expect(ast).toMatchObject({
				type: 'comparison',
				left: 'count',
				operator: '<=',
				right: 100,
			});
		});

		it('should parse regex match', () => {
			const ast = parseCondition('title ~ /^Project/');
			expect(ast).toMatchObject({
				type: 'comparison',
				left: 'title',
				operator: '~',
				right: '/^Project/',
			});
		});
	});

	describe('Existence checks', () => {
		it('should parse exists', () => {
			const ast = parseCondition('tags exists');
			expect(ast).toMatchObject({
				type: 'existence',
				path: 'tags',
				operator: 'exists',
			});
		});

		it('should parse !exists', () => {
			const ast = parseCondition('author !exists');
			expect(ast).toMatchObject({
				type: 'existence',
				path: 'author',
				operator: '!exists',
			});
		});
	});

	describe('Type checks', () => {
		it('should parse :string', () => {
			const ast = parseCondition('status :string');
			expect(ast).toMatchObject({
				type: 'type_check',
				path: 'status',
				typeCheck: 'string',
				negated: false,
			});
		});

		it('should parse :number', () => {
			const ast = parseCondition('count :number');
			expect(ast).toMatchObject({
				type: 'type_check',
				path: 'count',
				typeCheck: 'number',
			});
		});

		it('should parse :array', () => {
			const ast = parseCondition('tags :array');
			expect(ast).toMatchObject({
				type: 'type_check',
				path: 'tags',
				typeCheck: 'array',
			});
		});

		it('should parse negated type check !:null', () => {
			const ast = parseCondition('value !:null');
			expect(ast).toMatchObject({
				type: 'type_check',
				path: 'value',
				typeCheck: 'null',
				negated: true,
			});
		});
	});

	describe('Empty checks', () => {
		it('should parse empty', () => {
			const ast = parseCondition('tags empty');
			expect(ast).toMatchObject({
				type: 'empty_check',
				path: 'tags',
				operator: 'empty',
			});
		});

		it('should parse !empty', () => {
			const ast = parseCondition('tags !empty');
			expect(ast).toMatchObject({
				type: 'empty_check',
				path: 'tags',
				operator: '!empty',
			});
		});
	});

	describe('Has operator', () => {
		it('should parse has with string value', () => {
			const ast = parseCondition('tags has "urgent"');
			expect(ast).toMatchObject({
				type: 'has',
				path: 'tags',
				value: 'urgent',
				operator: 'has',
			});
		});

		it('should parse !has', () => {
			const ast = parseCondition('tags !has "archived"');
			expect(ast).toMatchObject({
				type: 'has',
				path: 'tags',
				value: 'archived',
				operator: '!has',
			});
		});
	});

	describe('Path expressions', () => {
		it('should parse nested path', () => {
			const ast = parseCondition('metadata.author = "John"');
			expect(ast).toMatchObject({
				type: 'comparison',
				left: 'metadata.author',
				operator: '=',
				right: 'John',
			});
		});

		it('should parse array index', () => {
			const ast = parseCondition('items[0] = "first"');
			expect(ast).toMatchObject({
				type: 'comparison',
				left: 'items[0]',
				operator: '=',
				right: 'first',
			});
		});

		it('should parse negative array index', () => {
			const ast = parseCondition('items[-1] = "last"');
			expect(ast).toMatchObject({
				type: 'comparison',
				left: 'items[-1]',
				operator: '=',
				right: 'last',
			});
		});

		it('should parse nested array path', () => {
			const ast = parseCondition('countsLog[0].mantra = "Great Gatsby"');
			expect(ast).toMatchObject({
				type: 'comparison',
				left: 'countsLog[0].mantra',
				operator: '=',
				right: 'Great Gatsby',
			});
		});

		it('should parse length property', () => {
			const ast = parseCondition('tags.length > 0');
			expect(ast).toMatchObject({
				type: 'comparison',
				left: 'tags.length',
				operator: '>',
				right: 0,
			});
		});

		it('should parse wildcard array access', () => {
			const ast = parseCondition('items[*] :object');
			expect(ast).toMatchObject({
				type: 'type_check',
				path: 'items[*]',
				typeCheck: 'object',
			});
		});
	});

	describe('Boolean operators', () => {
		it('should parse AND expression', () => {
			const ast = parseCondition('status = "draft" AND priority > 5');
			expect(ast).toMatchObject({
				type: 'boolean',
				operator: 'AND',
				left: { type: 'comparison', left: 'status', operator: '=', right: 'draft' },
				right: { type: 'comparison', left: 'priority', operator: '>', right: 5 },
			});
		});

		it('should parse OR expression', () => {
			const ast = parseCondition('status = "draft" OR status = "pending"');
			expect(ast).toMatchObject({
				type: 'boolean',
				operator: 'OR',
			});
		});

		it('should parse NOT expression', () => {
			const ast = parseCondition('NOT status = "archived"');
			expect(ast).toMatchObject({
				type: 'not',
				operand: { type: 'comparison', left: 'status', operator: '=', right: 'archived' },
			});
		});

		it('should handle operator precedence: OR < AND < NOT', () => {
			// tags has "urgent" OR priority > 5 AND status = "draft"
			// Should parse as: tags has "urgent" OR (priority > 5 AND status = "draft")
			const ast = parseCondition('tags has "urgent" OR priority > 5 AND status = "draft"');
			expect(ast.type).toBe('boolean');
			if (ast.type === 'boolean') {
				expect(ast.operator).toBe('OR');
				expect(ast.right).toMatchObject({ type: 'boolean', operator: 'AND' });
			}
		});

		it('should respect parentheses', () => {
			const ast = parseCondition('(tags has "urgent" OR priority > 5) AND status = "draft"');
			expect(ast.type).toBe('boolean');
			if (ast.type === 'boolean') {
				expect(ast.operator).toBe('AND');
				expect(ast.left).toMatchObject({ type: 'boolean', operator: 'OR' });
			}
		});

		it('should handle nested NOT', () => {
			const ast = parseCondition('NOT NOT status = "draft"');
			expect(ast).toMatchObject({
				type: 'not',
				operand: {
					type: 'not',
					operand: { type: 'comparison' },
				},
			});
		});
	});

	describe('Quantifiers', () => {
		it('should parse ANY quantifier', () => {
			const ast = parseCondition('ANY projects WHERE status = "active"');
			expect(ast).toMatchObject({
				type: 'quantifier',
				quantifier: 'ANY',
				array: 'projects',
				condition: { type: 'comparison', left: 'status', operator: '=', right: 'active' },
			});
		});

		it('should parse ALL quantifier', () => {
			const ast = parseCondition('ALL projects WHERE verified = true');
			expect(ast).toMatchObject({
				type: 'quantifier',
				quantifier: 'ALL',
				array: 'projects',
			});
		});

		it('should parse nested ANY', () => {
			const ast = parseCondition('ANY projects WHERE ANY tasks WHERE status = "pending"');
			expect(ast.type).toBe('quantifier');
			if (ast.type === 'quantifier') {
				expect(ast.quantifier).toBe('ANY');
				expect(ast.condition.type).toBe('quantifier');
			}
		});

		it('should parse ANY with complex condition', () => {
			const ast = parseCondition('ANY projects WHERE status = "active" AND tags has "urgent"');
			expect(ast.type).toBe('quantifier');
			if (ast.type === 'quantifier') {
				expect(ast.condition.type).toBe('boolean');
			}
		});
	});

	describe('Complex expressions', () => {
		it('should parse multi-level boolean expression', () => {
			const ast = parseCondition('(status = "draft" OR status = "pending") AND priority > 3 AND author exists');
			expect(ast.type).toBe('boolean');
		});

		it('should parse condition with multiple operators', () => {
			const ast = parseCondition('tags !empty AND priority >= 5 AND status != "archived"');
			expect(ast.type).toBe('boolean');
		});
	});

	describe('Error handling', () => {
		it('should throw on unexpected token', () => {
			expect(() => parseCondition('status = "draft" = "pending"')).toThrow(ParserError);
		});

		it('should throw on missing closing parenthesis', () => {
			expect(() => parseCondition('(status = "draft"')).toThrow(ParserError);
		});

		it('should throw on missing WHERE in quantifier', () => {
			expect(() => parseCondition('ANY projects status = "active"')).toThrow(ParserError);
		});

		it('should throw on missing value in comparison', () => {
			expect(() => parseCondition('status =')).toThrow(ParserError);
		});

		it('should throw on empty input', () => {
			expect(() => parseCondition('')).toThrow();
		});
	});

	describe('Real-world examples from requirements', () => {
		it('should parse: tags has "urgent" AND priority > 5', () => {
			const ast = parseCondition('tags has "urgent" AND priority > 5');
			expect(ast.type).toBe('boolean');
			if (ast.type === 'boolean') {
				expect(ast.operator).toBe('AND');
				expect(ast.left.type).toBe('has');
				expect(ast.right.type).toBe('comparison');
			}
		});

		it('should parse: metadata.reviewDate !exists AND status = "ready"', () => {
			const ast = parseCondition('metadata.reviewDate !exists AND status = "ready"');
			expect(ast.type).toBe('boolean');
		});

		it('should parse: items[*] :object AND status = "active"', () => {
			const ast = parseCondition('items[*] :object AND status = "active"');
			expect(ast.type).toBe('boolean');
		});

		it('should parse: countsLog[0].mantra = "Great Gatsby"', () => {
			const ast = parseCondition('countsLog[0].mantra = "Great Gatsby"');
			expect(ast).toMatchObject({
				type: 'comparison',
				left: 'countsLog[0].mantra',
				operator: '=',
				right: 'Great Gatsby',
			});
		});
	});
});
