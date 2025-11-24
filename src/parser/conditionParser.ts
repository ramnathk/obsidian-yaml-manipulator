/**
 * Condition Parser - Parse tokens into Abstract Syntax Tree (AST)
 * Based on requirements Section 3.2, 3.3
 *
 * Operator precedence (highest to lowest):
 * 1. Parentheses ()
 * 2. NOT
 * 3. AND
 * 4. OR
 */

import { Token, TokenType, tokenize } from './conditionLexer';
import {
	ConditionAST,
	ComparisonNode,
	ExistenceNode,
	TypeCheckNode,
	EmptyCheckNode,
	HasNode,
	BooleanNode,
	NotNode,
	QuantifierNode,
} from '../types';

export class ParserError extends Error {
	constructor(message: string, public token?: Token) {
		const position = token ? ` at position ${token.position}` : '';
		super(`Parser error${position}: ${message}`);
		this.name = 'ParserError';
	}
}

/**
 * Parse a condition string into an AST
 */
export function parseCondition(input: string): ConditionAST {
	const tokens = tokenize(input);
	const parser = new ConditionParser(tokens);
	return parser.parse();
}

class ConditionParser {
	private tokens: Token[];
	private position: number = 0;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	parse(): ConditionAST {
		const ast = this.parseOr();

		// Ensure we consumed all tokens (except EOF)
		if (this.current().type !== TokenType.EOF) {
			throw new ParserError('Unexpected token after expression', this.current());
		}

		return ast;
	}

	/**
 * Parse OR expression (lowest precedence)
	 * Grammar: OR -> AND (OR AND)*
	 */
	private parseOr(): ConditionAST {
		let left = this.parseAnd();

		while (this.current().type === TokenType.OR) {
			this.advance(); // consume OR
			const right = this.parseAnd();
			left = {
				type: 'boolean',
				operator: 'OR',
				left,
				right,
			};
		}

		return left;
	}

	/**
	 * Parse AND expression
	 * Grammar: AND -> NOT (AND NOT)*
	 */
	private parseAnd(): ConditionAST {
		let left = this.parseNot();

		while (this.current().type === TokenType.AND) {
			this.advance(); // consume AND
			const right = this.parseNot();
			left = {
				type: 'boolean',
				operator: 'AND',
				left,
				right,
			};
		}

		return left;
	}

	/**
	 * Parse NOT expression
	 * Grammar: NOT -> NOT primary | primary
	 */
	private parseNot(): ConditionAST {
		if (this.current().type === TokenType.NOT) {
			this.advance(); // consume NOT
			const operand = this.parseNot(); // Allow chaining: NOT NOT condition
			return {
				type: 'not',
				operand,
			};
		}

		return this.parsePrimary();
	}

	/**
	 * Parse primary expression (highest precedence)
	 * Grammar: primary -> quantifier | comparison | existence | typeCheck | empty | has | parentheses
	 */
	private parsePrimary(): ConditionAST {
		const token = this.current();

		// Parentheses
		if (token.type === TokenType.LPAREN) {
			this.advance(); // consume (
			const expr = this.parseOr(); // Parse full expression inside
			this.expect(TokenType.RPAREN, 'Expected closing parenthesis');
			return expr;
		}

		// Quantifiers: ANY/ALL
		if (token.type === TokenType.ANY || token.type === TokenType.ALL) {
			return this.parseQuantifier();
		}

		// Path-based expressions
		if (token.type === TokenType.IDENTIFIER) {
			return this.parsePathExpression();
		}

		throw new ParserError('Expected expression', token);
	}

	/**
	 * Parse path-based expressions
	 */
	private parsePathExpression(): ConditionAST {
		const path = this.parsePath();
		const token = this.current();

		// Existence check: path exists / path !exists
		if (token.type === TokenType.EXISTS) {
			this.advance();
			return {
				type: 'existence',
				path,
				operator: 'exists',
			};
		}

		if (token.type === TokenType.EXCLAMATION && this.peek()?.type === TokenType.EXISTS) {
			this.advance(); // consume !
			this.advance(); // consume exists
			return {
				type: 'existence',
				path,
				operator: '!exists',
			};
		}

		// Empty check: path empty / path !empty
		if (token.type === TokenType.EMPTY) {
			this.advance();
			return {
				type: 'empty_check',
				path,
				operator: 'empty',
			};
		}

		if (token.type === TokenType.EXCLAMATION && this.peek()?.type === TokenType.EMPTY) {
			this.advance(); // consume !
			this.advance(); // consume empty
			return {
				type: 'empty_check',
				path,
				operator: '!empty',
			};
		}

		// Has operator: path has value / path !has value
		if (token.type === TokenType.HAS) {
			this.advance();
			const value = this.parseValue();
			return {
				type: 'has',
				path,
				value,
				operator: 'has',
			};
		}

		if (token.type === TokenType.EXCLAMATION && this.peek()?.type === TokenType.HAS) {
			this.advance(); // consume !
			this.advance(); // consume has
			const value = this.parseValue();
			return {
				type: 'has',
				path,
				value,
				operator: '!has',
			};
		}

		// Type check: path :type / path !:type
		if (this.isTypeCheck(token.type)) {
			const typeCheck = this.parseTypeCheckOperator(token.type);
			this.advance();
			return {
				type: 'type_check',
				path,
				typeCheck,
				negated: false,
			};
		}

		if (token.type === TokenType.EXCLAMATION && this.peek() && this.isTypeCheck(this.peek()!.type)) {
			this.advance(); // consume !
			const typeToken = this.current();
			const typeCheck = this.parseTypeCheckOperator(typeToken.type);
			this.advance();
			return {
				type: 'type_check',
				path,
				typeCheck,
				negated: true,
			};
		}

		// Comparison operators: path op value
		if (this.isComparisonOperator(token.type)) {
			const operator = this.parseComparisonOperator(token.type);
			this.advance();
			const right = this.parseValue();
			return {
				type: 'comparison',
				left: path,
				operator,
				right,
			};
		}

		throw new ParserError(`Unexpected token after path '${path}'`, token);
	}

	/**
	 * Parse path (supports dot notation and array indices)
	 * Example: items[0].name or metadata.author.length
	 */
	private parsePath(): string {
		let path = '';
		const startToken = this.current();

		if (startToken.type !== TokenType.IDENTIFIER) {
			throw new ParserError('Expected identifier', startToken);
		}

		path = String(startToken.value);
		this.advance();

		// Continue building path with dots and brackets
		while (true) {
			const token = this.current();

			// Dot notation: .field
			if (token.type === TokenType.DOT) {
				this.advance();
				const next = this.current();

				if (next.type === TokenType.IDENTIFIER) {
					path += '.' + next.value;
					this.advance();
				} else if (next.type === TokenType.LENGTH) {
					path += '.length';
					this.advance();
				} else {
					throw new ParserError('Expected identifier after dot', next);
				}
			}
			// Array index: [n] or [*]
			else if (token.type === TokenType.LBRACKET) {
				this.advance();
				const indexToken = this.current();

				if (indexToken.type === TokenType.NUMBER) {
					path += `[${indexToken.value}]`;
					this.advance();
				} else if (indexToken.type === TokenType.IDENTIFIER && indexToken.value === '*') {
					path += '[*]';
					this.advance();
				} else {
					throw new ParserError('Expected number or * in array index', indexToken);
				}

				this.expect(TokenType.RBRACKET, 'Expected closing bracket');
			} else {
				break;
			}
		}

		return path;
	}

	/**
	 * Parse quantifier expression: ANY/ALL array WHERE condition
	 */
	private parseQuantifier(): QuantifierNode {
		const quantifierToken = this.current();
		const quantifier = quantifierToken.type === TokenType.ANY ? 'ANY' : 'ALL';
		this.advance();

		// Parse array path
		const array = this.parsePath();

		// Expect WHERE
		this.expect(TokenType.WHERE, 'Expected WHERE after array path in quantifier');

		// Parse condition
		const condition = this.parseOr();

		return {
			type: 'quantifier',
			quantifier,
			array,
			condition,
		};
	}

	/**
	 * Parse value (string, number, boolean, null, regex)
	 */
	private parseValue(): any {
		const token = this.current();

		if (token.type === TokenType.STRING) {
			this.advance();
			return token.value;
		}

		if (token.type === TokenType.NUMBER) {
			this.advance();
			return token.value;
		}

		if (token.type === TokenType.BOOLEAN) {
			this.advance();
			return token.value;
		}

		if (token.type === TokenType.NULL) {
			this.advance();
			return null;
		}

		if (token.type === TokenType.REGEX) {
			this.advance();
			return token.value; // Return regex string like "/pattern/flags"
		}

		throw new ParserError('Expected value', token);
	}

	/**
	 * Check if token is a comparison operator
	 */
	private isComparisonOperator(type: TokenType): boolean {
		return [
			TokenType.EQUALS,
			TokenType.NOT_EQUALS,
			TokenType.GREATER_THAN,
			TokenType.LESS_THAN,
			TokenType.GREATER_EQUAL,
			TokenType.LESS_EQUAL,
			TokenType.REGEX_MATCH,
		].includes(type);
	}

	/**
	 * Parse comparison operator token to string
	 */
	private parseComparisonOperator(type: TokenType): '=' | '!=' | '>' | '<' | '>=' | '<=' | '~' {
		const map: Record<string, '=' | '!=' | '>' | '<' | '>=' | '<=' | '~'> = {
			[TokenType.EQUALS]: '=',
			[TokenType.NOT_EQUALS]: '!=',
			[TokenType.GREATER_THAN]: '>',
			[TokenType.LESS_THAN]: '<',
			[TokenType.GREATER_EQUAL]: '>=',
			[TokenType.LESS_EQUAL]: '<=',
			[TokenType.REGEX_MATCH]: '~',
		};
		return map[type];
	}

	/**
	 * Check if token is a type check operator
	 */
	private isTypeCheck(type: TokenType): boolean {
		return [
			TokenType.TYPE_STRING,
			TokenType.TYPE_NUMBER,
			TokenType.TYPE_BOOLEAN,
			TokenType.TYPE_ARRAY,
			TokenType.TYPE_OBJECT,
			TokenType.TYPE_NULL,
		].includes(type);
	}

	/**
	 * Parse type check operator to string
	 */
	private parseTypeCheckOperator(type: TokenType): 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null' {
		const map: Record<string, 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null'> = {
			[TokenType.TYPE_STRING]: 'string',
			[TokenType.TYPE_NUMBER]: 'number',
			[TokenType.TYPE_BOOLEAN]: 'boolean',
			[TokenType.TYPE_ARRAY]: 'array',
			[TokenType.TYPE_OBJECT]: 'object',
			[TokenType.TYPE_NULL]: 'null',
		};
		return map[type];
	}

	/**
	 * Get current token
	 */
	private current(): Token {
		return this.tokens[this.position];
	}

	/**
	 * Peek at next token
	 */
	private peek(): Token | null {
		return this.position + 1 < this.tokens.length ? this.tokens[this.position + 1] : null;
	}

	/**
	 * Advance to next token
	 */
	private advance(): void {
		if (this.position < this.tokens.length - 1) {
			this.position++;
		}
	}

	/**
	 * Expect a specific token type and advance
	 */
	private expect(type: TokenType, message: string): void {
		const token = this.current();
		if (token.type !== type) {
			throw new ParserError(message, token);
		}
		this.advance();
	}
}
