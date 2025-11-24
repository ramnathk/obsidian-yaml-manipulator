/**
 * Tests for Condition Lexer
 */

import { describe, it, expect } from 'vitest';
import { tokenize, TokenType, LexerError } from '../../../src/parser/conditionLexer';

describe('Condition Lexer', () => {
	describe('Basic tokenization', () => {
		it('should tokenize simple equality', () => {
			const tokens = tokenize('status = "draft"');
			expect(tokens).toHaveLength(4); // identifier, equals, string, EOF
			expect(tokens[0]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'status' });
			expect(tokens[1]).toMatchObject({ type: TokenType.EQUALS, value: '=' });
			expect(tokens[2]).toMatchObject({ type: TokenType.STRING, value: 'draft' });
			expect(tokens[3]).toMatchObject({ type: TokenType.EOF });
		});

		it('should tokenize existence check', () => {
			const tokens = tokenize('tags exists');
			expect(tokens).toHaveLength(3);
			expect(tokens[0]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'tags' });
			expect(tokens[1]).toMatchObject({ type: TokenType.EXISTS, value: 'exists' });
		});

		it('should tokenize negated existence', () => {
			const tokens = tokenize('tags !exists');
			expect(tokens).toHaveLength(4);
			expect(tokens[0]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'tags' });
			expect(tokens[1]).toMatchObject({ type: TokenType.EXCLAMATION, value: '!' });
			expect(tokens[2]).toMatchObject({ type: TokenType.EXISTS, value: 'exists' });
		});
	});

	describe('Operators', () => {
		it('should tokenize comparison operators', () => {
			const tests = [
				{ input: 'a > 5', op: TokenType.GREATER_THAN },
				{ input: 'a < 5', op: TokenType.LESS_THAN },
				{ input: 'a >= 5', op: TokenType.GREATER_EQUAL },
				{ input: 'a <= 5', op: TokenType.LESS_EQUAL },
				{ input: 'a = 5', op: TokenType.EQUALS },
				{ input: 'a != 5', op: TokenType.NOT_EQUALS },
			];

			tests.forEach(({ input, op }) => {
				const tokens = tokenize(input);
				expect(tokens[1].type).toBe(op);
			});
		});

		it('should tokenize regex match operator', () => {
			const tokens = tokenize('title ~ /^Project/');
			expect(tokens[1]).toMatchObject({ type: TokenType.REGEX_MATCH, value: '~' });
		});
	});

	describe('Boolean operators', () => {
		it('should tokenize AND (case-insensitive)', () => {
			const tests = ['status = "draft" AND priority > 5', 'status = "draft" and priority > 5'];
			tests.forEach(input => {
				const tokens = tokenize(input);
				const andToken = tokens.find(t => t.type === TokenType.AND);
				expect(andToken).toBeDefined();
			});
		});

		it('should tokenize OR', () => {
			const tokens = tokenize('status = "draft" OR status = "pending"');
			const orToken = tokens.find(t => t.type === TokenType.OR);
			expect(orToken).toBeDefined();
		});

		it('should tokenize NOT', () => {
			const tokens = tokenize('NOT status = "archived"');
			expect(tokens[0]).toMatchObject({ type: TokenType.NOT });
		});
	});

	describe('String literals', () => {
		it('should tokenize double-quoted strings', () => {
			const tokens = tokenize('"hello world"');
			expect(tokens[0]).toMatchObject({ type: TokenType.STRING, value: 'hello world' });
		});

		it('should tokenize single-quoted strings', () => {
			const tokens = tokenize("'hello world'");
			expect(tokens[0]).toMatchObject({ type: TokenType.STRING, value: 'hello world' });
		});

		it('should handle escape sequences', () => {
			const tokens = tokenize('"He said \\"hello\\""');
			expect(tokens[0]).toMatchObject({ type: TokenType.STRING, value: 'He said "hello"' });
		});

		it('should handle newlines in strings', () => {
			const tokens = tokenize('"Line 1\\nLine 2"');
			expect(tokens[0]).toMatchObject({ type: TokenType.STRING, value: 'Line 1\nLine 2' });
		});

		it('should throw on unterminated string', () => {
			expect(() => tokenize('"unterminated')).toThrow(LexerError);
		});
	});

	describe('Number literals', () => {
		it('should tokenize integers', () => {
			const tokens = tokenize('123');
			expect(tokens[0]).toMatchObject({ type: TokenType.NUMBER, value: 123 });
		});

		it('should tokenize floats', () => {
			const tokens = tokenize('123.45');
			expect(tokens[0]).toMatchObject({ type: TokenType.NUMBER, value: 123.45 });
		});

		it('should tokenize negative numbers', () => {
			const tokens = tokenize('-42');
			expect(tokens[0]).toMatchObject({ type: TokenType.NUMBER, value: -42 });
		});
	});

	describe('Boolean and null literals', () => {
		it('should tokenize true', () => {
			const tokens = tokenize('true');
			expect(tokens[0]).toMatchObject({ type: TokenType.BOOLEAN, value: true });
		});

		it('should tokenize false', () => {
			const tokens = tokenize('false');
			expect(tokens[0]).toMatchObject({ type: TokenType.BOOLEAN, value: false });
		});

		it('should tokenize null', () => {
			const tokens = tokenize('null');
			expect(tokens[0]).toMatchObject({ type: TokenType.NULL, value: null });
		});
	});

	describe('Type checks', () => {
		it('should tokenize type check operators', () => {
			const tests = [
				{ input: ':string', type: TokenType.TYPE_STRING },
				{ input: ':number', type: TokenType.TYPE_NUMBER },
				{ input: ':boolean', type: TokenType.TYPE_BOOLEAN },
				{ input: ':array', type: TokenType.TYPE_ARRAY },
				{ input: ':object', type: TokenType.TYPE_OBJECT },
				{ input: ':null', type: TokenType.TYPE_NULL },
			];

			tests.forEach(({ input, type }) => {
				const tokens = tokenize(`field ${input}`);
				expect(tokens[1].type).toBe(type);
			});
		});
	});

	describe('Regex patterns', () => {
		it('should tokenize regex without flags', () => {
			const tokens = tokenize('/^Project/');
			expect(tokens[0]).toMatchObject({ type: TokenType.REGEX, value: '/^Project/' });
		});

		it('should tokenize regex with flags', () => {
			const tokens = tokenize('/john/i');
			expect(tokens[0]).toMatchObject({ type: TokenType.REGEX, value: '/john/i' });
		});

		it('should handle escaped forward slashes in regex', () => {
			const tokens = tokenize('/path\\/to\\/file/');
			expect(tokens[0].type).toBe(TokenType.REGEX);
		});
	});

	describe('Quantifiers', () => {
		it('should tokenize ANY', () => {
			const tokens = tokenize('ANY projects WHERE status = "active"');
			expect(tokens[0]).toMatchObject({ type: TokenType.ANY });
			const whereToken = tokens.find(t => t.type === TokenType.WHERE);
			expect(whereToken).toBeDefined();
		});

		it('should tokenize ALL', () => {
			const tokens = tokenize('ALL projects WHERE verified = true');
			expect(tokens[0]).toMatchObject({ type: TokenType.ALL });
		});
	});

	describe('Array and object access', () => {
		it('should tokenize array indices', () => {
			const tokens = tokenize('items[0].name');
			expect(tokens).toMatchObject([
				{ type: TokenType.IDENTIFIER, value: 'items' },
				{ type: TokenType.LBRACKET },
				{ type: TokenType.NUMBER, value: 0 },
				{ type: TokenType.RBRACKET },
				{ type: TokenType.DOT },
				{ type: TokenType.IDENTIFIER, value: 'name' },
				{ type: TokenType.EOF },
			]);
		});

		it('should tokenize dot notation', () => {
			const tokens = tokenize('metadata.author');
			expect(tokens).toMatchObject([
				{ type: TokenType.IDENTIFIER, value: 'metadata' },
				{ type: TokenType.DOT },
				{ type: TokenType.IDENTIFIER, value: 'author' },
				{ type: TokenType.EOF },
			]);
		});
	});

	describe('Special operators', () => {
		it('should tokenize has operator', () => {
			const tokens = tokenize('tags has "urgent"');
			expect(tokens[1]).toMatchObject({ type: TokenType.HAS });
		});

		it('should tokenize empty operator', () => {
			const tokens = tokenize('tags empty');
			expect(tokens[1]).toMatchObject({ type: TokenType.EMPTY });
		});

		it('should tokenize length property', () => {
			const tokens = tokenize('tags.length > 0');
			expect(tokens[2]).toMatchObject({ type: TokenType.LENGTH });
		});
	});

	describe('Complex expressions', () => {
		it('should tokenize complex AND/OR expression', () => {
			const tokens = tokenize('tags has "urgent" AND priority > 5 OR status = "critical"');
			expect(tokens.filter(t => t.type === TokenType.AND)).toHaveLength(1);
			expect(tokens.filter(t => t.type === TokenType.OR)).toHaveLength(1);
		});

		it('should tokenize expression with parentheses', () => {
			const tokens = tokenize('(tags has "urgent" OR priority > 5) AND status = "draft"');
			expect(tokens.filter(t => t.type === TokenType.LPAREN)).toHaveLength(1);
			expect(tokens.filter(t => t.type === TokenType.RPAREN)).toHaveLength(1);
		});

		it('should tokenize nested ANY expression', () => {
			const tokens = tokenize('ANY projects WHERE ANY tasks WHERE status = "pending"');
			expect(tokens.filter(t => t.type === TokenType.ANY)).toHaveLength(2);
			expect(tokens.filter(t => t.type === TokenType.WHERE)).toHaveLength(2);
		});
	});

	describe('Whitespace handling', () => {
		it('should handle multiple spaces', () => {
			const tokens1 = tokenize('status = "draft"');
			const tokens2 = tokenize('status  =  "draft"');
			expect(tokens1.length).toBe(tokens2.length);
		});

		it('should handle tabs', () => {
			const tokens = tokenize('status\t=\t"draft"');
			expect(tokens).toHaveLength(4);
		});
	});

	describe('Error handling', () => {
		it('should throw on invalid character', () => {
			expect(() => tokenize('status $ "draft"')).toThrow(LexerError);
		});

		it('should throw on unknown type check', () => {
			expect(() => tokenize('field :unknown')).toThrow(LexerError);
		});
	});

	describe('Real-world examples from requirements', () => {
		it('should tokenize: status = "draft"', () => {
			const tokens = tokenize('status = "draft"');
			expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
			expect(tokens[1].type).toBe(TokenType.EQUALS);
			expect(tokens[2]).toMatchObject({ type: TokenType.STRING, value: 'draft' });
		});

		it('should tokenize: priority > 3', () => {
			const tokens = tokenize('priority > 3');
			expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
			expect(tokens[1].type).toBe(TokenType.GREATER_THAN);
			expect(tokens[2]).toMatchObject({ type: TokenType.NUMBER, value: 3 });
		});

		it('should tokenize: tags has "urgent"', () => {
			const tokens = tokenize('tags has "urgent"');
			expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
			expect(tokens[1].type).toBe(TokenType.HAS);
			expect(tokens[2].type).toBe(TokenType.STRING);
		});

		it('should tokenize: metadata.author :string', () => {
			const tokens = tokenize('metadata.author :string');
			expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
			expect(tokens[1].type).toBe(TokenType.DOT);
			expect(tokens[2].type).toBe(TokenType.IDENTIFIER);
			expect(tokens[3].type).toBe(TokenType.TYPE_STRING);
		});
	});
});
