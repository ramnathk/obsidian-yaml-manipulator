/**
 * Tests for Condition Evaluator
 */

import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '../../../src/evaluator/conditionEvaluator';
import { parseCondition } from '../../../src/parser/conditionParser';

describe('Condition Evaluator', () => {
	describe('Comparison operators', () => {
		it('should evaluate equality', () => {
			const data = { status: 'draft', priority: 5 };
			const ast = parseCondition('status = "draft"');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('status = "published"');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should evaluate inequality', () => {
			const data = { status: 'draft' };
			const ast = parseCondition('status != "published"');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('status != "draft"');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should evaluate greater than', () => {
			const data = { priority: 5 };
			const ast = parseCondition('priority > 3');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('priority > 10');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should evaluate less than', () => {
			const data = { priority: 5 };
			const ast = parseCondition('priority < 10');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('priority < 3');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should evaluate greater than or equal', () => {
			const data = { priority: 5 };
			const ast = parseCondition('priority >= 5');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('priority >= 10');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should evaluate less than or equal', () => {
			const data = { priority: 5 };
			const ast = parseCondition('priority <= 5');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('priority <= 3');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should handle non-existent fields in comparison', () => {
			const data = { status: 'draft' };
			const ast = parseCondition('priority > 5');
			expect(evaluateCondition(ast, data)).toBe(false);

			// != should return true for non-existent fields
			const ast2 = parseCondition('priority != 5');
			expect(evaluateCondition(ast2, data)).toBe(true);
		});
	});

	describe('Regex matching', () => {
		it('should match regex patterns', () => {
			const data = { title: 'Project Alpha' };
			const ast = parseCondition('title ~ /^Project/');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('title ~ /^Task/');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should handle case-insensitive regex', () => {
			const data = { author: 'John Doe' };
			const ast = parseCondition('author ~ /john/i');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('author ~ /john/');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should match patterns at end', () => {
			const data = { filename: 'document.md' };
			const ast = parseCondition('filename ~ /\\.md$/');
			expect(evaluateCondition(ast, data)).toBe(true);
		});
	});

	describe('Existence checks', () => {
		it('should check if field exists', () => {
			const data = { status: 'draft', tags: [] };
			const ast = parseCondition('status exists');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('author exists');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should check if field does not exist', () => {
			const data = { status: 'draft' };
			const ast = parseCondition('author !exists');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('status !exists');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should treat null as existing', () => {
			const data = { deletedAt: null };
			const ast = parseCondition('deletedAt exists');
			expect(evaluateCondition(ast, data)).toBe(true);
		});
	});

	describe('Type checks', () => {
		it('should check string type', () => {
			const data = { status: 'draft', priority: 5 };
			const ast = parseCondition('status :string');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('priority :string');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should check number type', () => {
			const data = { priority: 5, status: 'draft' };
			const ast = parseCondition('priority :number');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('status :number');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should check boolean type', () => {
			const data = { verified: true, status: 'draft' };
			const ast = parseCondition('verified :boolean');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('status :boolean');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should check array type', () => {
			const data = { tags: ['work', 'urgent'], status: 'draft' };
			const ast = parseCondition('tags :array');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('status :array');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should check object type', () => {
			const data = { metadata: { author: 'John' }, status: 'draft' };
			const ast = parseCondition('metadata :object');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('status :object');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should check null type', () => {
			const data = { deletedAt: null, status: 'draft' };
			const ast = parseCondition('deletedAt :null');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('status :null');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should handle negated type checks', () => {
			const data = { status: 'draft' };
			const ast = parseCondition('status !:number');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('status !:string');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should return false for non-existent fields', () => {
			const data = { status: 'draft' };
			const ast = parseCondition('author :string');
			expect(evaluateCondition(ast, data)).toBe(false);
		});
	});

	describe('Empty checks - truth table from requirements', () => {
		it('should handle missing field', () => {
			const data = { title: 'Note' };
			// Field missing: empty = false
			const ast1 = parseCondition('tags empty');
			expect(evaluateCondition(ast1, data)).toBe(false);

			// Field missing: !empty = true
			const ast2 = parseCondition('tags !empty');
			expect(evaluateCondition(ast2, data)).toBe(true);
		});

		it('should handle empty array', () => {
			const data = { tags: [] };
			// Empty array: empty = true
			const ast1 = parseCondition('tags empty');
			expect(evaluateCondition(ast1, data)).toBe(true);

			// Empty array: !empty = false
			const ast2 = parseCondition('tags !empty');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should handle null field', () => {
			const data = { tags: null };
			// Null: empty = false
			const ast1 = parseCondition('tags empty');
			expect(evaluateCondition(ast1, data)).toBe(false);

			// Null: !empty = true
			const ast2 = parseCondition('tags !empty');
			expect(evaluateCondition(ast2, data)).toBe(true);
		});

		it('should handle non-empty array', () => {
			const data = { tags: ['work'] };
			const ast1 = parseCondition('tags empty');
			expect(evaluateCondition(ast1, data)).toBe(false);

			const ast2 = parseCondition('tags !empty');
			expect(evaluateCondition(ast2, data)).toBe(true);
		});

		it('should handle empty string', () => {
			const data = { note: '' };
			const ast1 = parseCondition('note empty');
			expect(evaluateCondition(ast1, data)).toBe(true);

			const ast2 = parseCondition('note !empty');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should handle non-empty string', () => {
			const data = { note: 'content' };
			const ast1 = parseCondition('note empty');
			expect(evaluateCondition(ast1, data)).toBe(false);

			const ast2 = parseCondition('note !empty');
			expect(evaluateCondition(ast2, data)).toBe(true);
		});

		it('should handle empty object', () => {
			const data = { metadata: {} };
			const ast1 = parseCondition('metadata empty');
			expect(evaluateCondition(ast1, data)).toBe(true);

			const ast2 = parseCondition('metadata !empty');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should handle non-empty object', () => {
			const data = { metadata: { author: 'John' } };
			const ast1 = parseCondition('metadata empty');
			expect(evaluateCondition(ast1, data)).toBe(false);

			const ast2 = parseCondition('metadata !empty');
			expect(evaluateCondition(ast2, data)).toBe(true);
		});
	});

	describe('Has operator', () => {
		it('should check if array has value', () => {
			const data = { tags: ['work', 'urgent', 'project'] };
			const ast = parseCondition('tags has "urgent"');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('tags has "archived"');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should check if array does not have value', () => {
			const data = { tags: ['work', 'urgent'] };
			const ast = parseCondition('tags !has "archived"');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('tags !has "urgent"');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should return false for non-existent array', () => {
			const data = { status: 'draft' };
			const ast = parseCondition('tags has "urgent"');
			expect(evaluateCondition(ast, data)).toBe(false);
		});

		it('should return false for non-array field', () => {
			const data = { tags: 'not-an-array' };
			const ast = parseCondition('tags has "urgent"');
			expect(evaluateCondition(ast, data)).toBe(false);
		});
	});

	describe('Boolean operators', () => {
		it('should evaluate AND', () => {
			const data = { status: 'draft', priority: 5 };
			const ast = parseCondition('status = "draft" AND priority > 3');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('status = "draft" AND priority > 10');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should evaluate OR', () => {
			const data = { status: 'draft', priority: 2 };
			const ast = parseCondition('status = "published" OR priority > 1');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('status = "published" OR priority > 10');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should evaluate NOT', () => {
			const data = { status: 'draft' };
			const ast = parseCondition('NOT status = "published"');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('NOT status = "draft"');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should handle complex boolean expressions', () => {
			const data = { tags: ['urgent'], priority: 3, status: 'draft' };
			const ast = parseCondition('(tags has "urgent" OR priority > 5) AND status = "draft"');
			expect(evaluateCondition(ast, data)).toBe(true);
		});
	});

	describe('Quantifiers', () => {
		it('should evaluate ANY - at least one match', () => {
			const data = {
				projects: [
					{ status: 'active', name: 'Alpha' },
					{ status: 'archived', name: 'Beta' },
					{ status: 'pending', name: 'Gamma' }
				]
			};
			const ast = parseCondition('ANY projects WHERE status = "active"');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('ANY projects WHERE status = "completed"');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should evaluate ALL - all items match', () => {
			const data = {
				projects: [
					{ verified: true, name: 'Alpha' },
					{ verified: true, name: 'Beta' }
				]
			};
			const ast = parseCondition('ALL projects WHERE verified = true');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('ALL projects WHERE status = "active"');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should return false for empty array', () => {
			const data = { projects: [] };
			const ast = parseCondition('ANY projects WHERE status = "active"');
			expect(evaluateCondition(ast, data)).toBe(false);

			const ast2 = parseCondition('ALL projects WHERE status = "active"');
			expect(evaluateCondition(ast2, data)).toBe(false);
		});

		it('should return false for non-existent array', () => {
			const data = { title: 'Note' };
			const ast = parseCondition('ANY projects WHERE status = "active"');
			expect(evaluateCondition(ast, data)).toBe(false);
		});

		it('should evaluate nested ANY', () => {
			const data = {
				projects: [
					{ name: 'Alpha', tasks: [{ status: 'pending' }, { status: 'done' }] },
					{ name: 'Beta', tasks: [{ status: 'done' }] }
				]
			};
			const ast = parseCondition('ANY projects WHERE ANY tasks WHERE status = "pending"');
			expect(evaluateCondition(ast, data)).toBe(true);
		});
	});

	describe('Nested paths', () => {
		it('should evaluate nested object paths', () => {
			const data = { metadata: { author: 'John', version: 1.0 } };
			const ast = parseCondition('metadata.author = "John"');
			expect(evaluateCondition(ast, data)).toBe(true);
		});

		it('should evaluate array index paths', () => {
			const data = { tags: ['work', 'urgent', 'project'] };
			const ast = parseCondition('tags[0] = "work"');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('tags[-1] = "project"');
			expect(evaluateCondition(ast2, data)).toBe(true);
		});

		it('should evaluate nested array paths', () => {
			const data = {
				countsLog: [
					{ mantra: 'Great Gatsby', count: 3 },
					{ mantra: 'Brave New World', count: 1 }
				]
			};
			const ast = parseCondition('countsLog[0].mantra = "Great Gatsby"');
			expect(evaluateCondition(ast, data)).toBe(true);

			const ast2 = parseCondition('countsLog[1].count < 5');
			expect(evaluateCondition(ast2, data)).toBe(true);
		});
	});

	describe('Real-world examples', () => {
		it('should evaluate: tags has "urgent" AND priority > 5', () => {
			const data = { tags: ['work', 'urgent'], priority: 8 };
			const ast = parseCondition('tags has "urgent" AND priority > 5');
			expect(evaluateCondition(ast, data)).toBe(true);
		});

		it('should evaluate: status = "draft" OR status = "pending"', () => {
			const data = { status: 'pending' };
			const ast = parseCondition('status = "draft" OR status = "pending"');
			expect(evaluateCondition(ast, data)).toBe(true);
		});

		it('should evaluate: metadata.author :string AND tags.length > 0', () => {
			const data = { metadata: { author: 'John' }, tags: ['work'] };
			const ast = parseCondition('metadata.author :string AND tags.length > 0');
			expect(evaluateCondition(ast, data)).toBe(true);
		});

		it('should evaluate: countsLog[0].mantra = "Great Gatsby"', () => {
			const data = {
				countsLog: [
					{ mantra: 'Great Gatsby', count: 108 }
				]
			};
			const ast = parseCondition('countsLog[0].mantra = "Great Gatsby"');
			expect(evaluateCondition(ast, data)).toBe(true);
		});
	});
});
