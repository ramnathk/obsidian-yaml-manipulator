/**
 * Tests for Action Lexer
 */

import { describe, it, expect } from 'vitest';
import { tokenizeAction, ActionTokenType, ActionLexerError } from '../../../src/parser/actionLexer';

describe('Action Lexer', () => {
	describe('Basic operations', () => {
		it('should tokenize SET operation', () => {
			const tokens = tokenizeAction('SET status "published"');
			expect(tokens[0]).toMatchObject({ type: ActionTokenType.SET });
			expect(tokens[1]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'status' });
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.STRING, value: 'published' });
		});

		it('should tokenize DELETE operation', () => {
			const tokens = tokenizeAction('DELETE draft');
			expect(tokens[0]).toMatchObject({ type: ActionTokenType.DELETE });
			expect(tokens[1]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'draft' });
		});

		it('should tokenize RENAME operation', () => {
			const tokens = tokenizeAction('RENAME oldName newName');
			expect(tokens[0]).toMatchObject({ type: ActionTokenType.RENAME });
			expect(tokens[1]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'oldName' });
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'newName' });
		});
	});

	describe('Array operations', () => {
		it('should tokenize APPEND', () => {
			const tokens = tokenizeAction('FOR tags APPEND "urgent"');
			expect(tokens[0]).toMatchObject({ type: ActionTokenType.FOR });
			expect(tokens[1]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'tags' });
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.APPEND });
			expect(tokens[3]).toMatchObject({ type: ActionTokenType.STRING, value: 'urgent' });
		});

		it('should tokenize PREPEND', () => {
			const tokens = tokenizeAction('FOR tags PREPEND "important"');
			expect(tokens[0]).toMatchObject({ type: ActionTokenType.FOR });
			expect(tokens[1]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'tags' });
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.PREPEND });
		});

		it('should tokenize FOR with INSERT AT keyword', () => {
			const tokens = tokenizeAction('FOR tags INSERT "middle" AT 2');
			expect(tokens[0]).toMatchObject({ type: ActionTokenType.FOR });
			expect(tokens[1]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'tags' });
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.INSERT });
			expect(tokens[3]).toMatchObject({ type: ActionTokenType.STRING, value: 'middle' });
			expect(tokens[4]).toMatchObject({ type: ActionTokenType.AT });
			expect(tokens[5]).toMatchObject({ type: ActionTokenType.NUMBER, value: 2 });
		});

		it('should tokenize REMOVE', () => {
			const tokens = tokenizeAction('REMOVE tags "draft"');
			expect(tokens[0]).toMatchObject({ type: ActionTokenType.REMOVE });
		});

		it('should tokenize SORT with order', () => {
			const tokens = tokenizeAction('SORT tags ASC');
			expect(tokens[0]).toMatchObject({ type: ActionTokenType.SORT });
			expect(tokens[1]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'tags' });
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.ASC });
		});

		it('should tokenize FOR with SORT BY keyword', () => {
			const tokens = tokenizeAction('FOR countsLog SORT BY mantra DESC');
			expect(tokens[0]).toMatchObject({ type: ActionTokenType.FOR });
			expect(tokens[1]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'countsLog' });
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.SORT });
			expect(tokens[3]).toMatchObject({ type: ActionTokenType.BY });
			expect(tokens[4]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'mantra' });
			expect(tokens[5]).toMatchObject({ type: ActionTokenType.DESC });
		});

		it('should tokenize MOVE with FROM and TO', () => {
			const tokens = tokenizeAction('MOVE countsLog FROM 1 TO 0');
			expect(tokens[0]).toMatchObject({ type: ActionTokenType.MOVE });
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.FROM });
			expect(tokens[3]).toMatchObject({ type: ActionTokenType.NUMBER, value: 1 });
			expect(tokens[4]).toMatchObject({ type: ActionTokenType.TO });
			expect(tokens[5]).toMatchObject({ type: ActionTokenType.NUMBER, value: 0 });
		});

		it('should tokenize DEDUPLICATE', () => {
			const tokens = tokenizeAction('DEDUPLICATE tags');
			expect(tokens[0]).toMatchObject({ type: ActionTokenType.DEDUPLICATE });
			expect(tokens[1]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'tags' });
		});
	});

	describe('Complex operations', () => {
		it('should tokenize UPDATE_WHERE with single field', () => {
			const tokens = tokenizeAction('FOR countsLog WHERE mantra="Brave New World" SET unit "Meditations"');
			expect(tokens[0]).toMatchObject({ type: ActionTokenType.FOR });
			expect(tokens[1]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'countsLog' });
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.WHERE });
			// mantra="Brave New World" part
			expect(tokens[3]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'mantra' });
			expect(tokens[4]).toMatchObject({ type: ActionTokenType.EQUALS });
			expect(tokens[5]).toMatchObject({ type: ActionTokenType.STRING, value: 'Brave New World' });
			expect(tokens[6]).toMatchObject({ type: ActionTokenType.SET });
		});

		it('should tokenize UPDATE_WHERE with multiple fields', () => {
			const tokens = tokenizeAction('FOR countsLog WHERE mantra="Brave New World" SET unit "Meditations", verified true');
			const setIndex = tokens.findIndex(t => t.type === ActionTokenType.SET);
			const commaIndex = tokens.findIndex(t => t.type === ActionTokenType.COMMA);
			expect(setIndex).toBeGreaterThan(-1);
			expect(commaIndex).toBeGreaterThan(setIndex);
		});

		it('should tokenize MOVE_WHERE with TO', () => {
			const tokens = tokenizeAction('FOR countsLog WHERE mantra="Brave New World" TO 0');
			expect(tokens[0]).toMatchObject({ type: ActionTokenType.FOR });
			expect(tokens[1]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'countsLog' });
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.WHERE });
			const toToken = tokens.find(t => t.type === ActionTokenType.TO);
			expect(toToken).toBeDefined();
		});

		it('should tokenize MOVE_WHERE with AFTER', () => {
			const tokens = tokenizeAction('FOR countsLog WHERE mantra="Brave New World" AFTER mantra="Great Gatsby"');
			expect(tokens[0]).toMatchObject({ type: ActionTokenType.FOR });
			const afterToken = tokens.find(t => t.type === ActionTokenType.AFTER);
			expect(afterToken).toBeDefined();
		});

		it('should tokenize FOR with MERGE JSON object', () => {
			const tokens = tokenizeAction('FOR metadata MERGE {"editor": "Jane", "reviewed": true}');
			expect(tokens[0]).toMatchObject({ type: ActionTokenType.FOR });
			expect(tokens[1]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'metadata' });
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.MERGE });
			expect(tokens[3].type).toBe(ActionTokenType.OBJECT);
			expect(tokens[3].value).toMatchObject({ editor: 'Jane', reviewed: true });
		});
	});

	describe('Path expressions', () => {
		it('should tokenize nested path', () => {
			const tokens = tokenizeAction('SET metadata.author "John"');
			expect(tokens[1]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'metadata' });
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.DOT });
			expect(tokens[3]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'author' });
		});

		it('should tokenize array index', () => {
			const tokens = tokenizeAction('SET items[0] "first"');
			expect(tokens[1]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'items' });
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.LBRACKET });
			expect(tokens[3]).toMatchObject({ type: ActionTokenType.NUMBER, value: 0 });
			expect(tokens[4]).toMatchObject({ type: ActionTokenType.RBRACKET });
		});

		it('should tokenize nested array path', () => {
			const tokens = tokenizeAction('SET countsLog[0].mantra "Great Gatsby"');
			expect(tokens[1]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'countsLog' });
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.LBRACKET });
			expect(tokens[3]).toMatchObject({ type: ActionTokenType.NUMBER, value: 0 });
			expect(tokens[4]).toMatchObject({ type: ActionTokenType.RBRACKET });
			expect(tokens[5]).toMatchObject({ type: ActionTokenType.DOT });
			expect(tokens[6]).toMatchObject({ type: ActionTokenType.IDENTIFIER, value: 'mantra' });
		});
	});

	describe('Value types', () => {
		it('should tokenize strings', () => {
			const tokens = tokenizeAction('SET status "published"');
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.STRING, value: 'published' });
		});

		it('should tokenize numbers', () => {
			const tokens = tokenizeAction('SET priority 5');
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.NUMBER, value: 5 });
		});

		it('should tokenize booleans', () => {
			const tokens = tokenizeAction('SET verified true');
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.BOOLEAN, value: true });
		});

		it('should tokenize null', () => {
			const tokens = tokenizeAction('SET deletedAt null');
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.NULL, value: null });
		});

		it('should handle escape sequences in strings', () => {
			const tokens = tokenizeAction('SET note "Line 1\\nLine 2"');
			expect(tokens[2]).toMatchObject({ type: ActionTokenType.STRING, value: 'Line 1\nLine 2' });
		});
	});

	describe('Case insensitivity', () => {
		it('should handle lowercase operations', () => {
			const tokens = tokenizeAction('set status "published"');
			expect(tokens[0].type).toBe(ActionTokenType.SET);
		});

		it('should handle mixed case operations', () => {
			const tokens = tokenizeAction('FOR countsLog sort by mantra asc');
			expect(tokens[0].type).toBe(ActionTokenType.FOR);
			expect(tokens[2].type).toBe(ActionTokenType.SORT);
			expect(tokens[3].type).toBe(ActionTokenType.BY);
			expect(tokens[5].type).toBe(ActionTokenType.ASC);
		});
	});

	describe('Error handling', () => {
		it('should throw on unterminated string', () => {
			expect(() => tokenizeAction('SET status "unterminated')).toThrow(ActionLexerError);
		});

		it('should throw on invalid JSON object', () => {
			expect(() => tokenizeAction('FOR metadata MERGE {invalid json}')).toThrow(ActionLexerError);
		});

		it('should throw on unexpected character', () => {
			expect(() => tokenizeAction('SET status $ "value"')).toThrow(ActionLexerError);
		});
	});

	describe('Real-world examples', () => {
		it('should tokenize: SET status "published"', () => {
			const tokens = tokenizeAction('SET status "published"');
			expect(tokens).toHaveLength(4); // SET, status, "published", EOF
		});

		it('should tokenize: FOR tags APPEND "urgent"', () => {
			const tokens = tokenizeAction('FOR tags APPEND "urgent"');
			expect(tokens[0].type).toBe(ActionTokenType.FOR);
			expect(tokens[2].type).toBe(ActionTokenType.APPEND);
		});

		it('should tokenize: FOR countsLog SORT BY mantra ASC', () => {
			const tokens = tokenizeAction('FOR countsLog SORT BY mantra ASC');
			expect(tokens[0].type).toBe(ActionTokenType.FOR);
			expect(tokens[2].type).toBe(ActionTokenType.SORT);
			expect(tokens[3].type).toBe(ActionTokenType.BY);
			expect(tokens[5].type).toBe(ActionTokenType.ASC);
		});

		it('should tokenize: FOR countsLog WHERE mantra="Brave New World" SET unit "Meditations"', () => {
			const tokens = tokenizeAction('FOR countsLog WHERE mantra="Brave New World" SET unit "Meditations"');
			expect(tokens[0].type).toBe(ActionTokenType.FOR);
			expect(tokens[2].type).toBe(ActionTokenType.WHERE);
			const setToken = tokens.find(t => t.type === ActionTokenType.SET);
			expect(setToken).toBeDefined();
		});
	});
});
