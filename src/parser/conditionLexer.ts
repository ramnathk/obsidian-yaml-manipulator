/**
 * Condition Lexer - Tokenize condition strings
 * Based on requirements Section 3.2, 3.3
 *
 * Converts condition strings into tokens for parsing
 */

export enum TokenType {
	// Literals
	IDENTIFIER = 'IDENTIFIER',
	STRING = 'STRING',
	NUMBER = 'NUMBER',
	BOOLEAN = 'BOOLEAN',
	NULL = 'NULL',

	// Operators
	EQUALS = 'EQUALS',                    // =
	NOT_EQUALS = 'NOT_EQUALS',            // !=
	GREATER_THAN = 'GREATER_THAN',        // >
	LESS_THAN = 'LESS_THAN',              // <
	GREATER_EQUAL = 'GREATER_EQUAL',      // >=
	LESS_EQUAL = 'LESS_EQUAL',            // <=
	REGEX_MATCH = 'REGEX_MATCH',          // ~

	// Boolean operators
	AND = 'AND',
	OR = 'OR',
	NOT = 'NOT',

	// Keywords
	EXISTS = 'EXISTS',
	EMPTY = 'EMPTY',
	HAS = 'HAS',
	WHERE = 'WHERE',
	ANY = 'ANY',
	ALL = 'ALL',
	LENGTH = 'LENGTH',

	// Type checks
	TYPE_STRING = 'TYPE_STRING',          // :string
	TYPE_NUMBER = 'TYPE_NUMBER',          // :number
	TYPE_BOOLEAN = 'TYPE_BOOLEAN',        // :boolean
	TYPE_ARRAY = 'TYPE_ARRAY',            // :array
	TYPE_OBJECT = 'TYPE_OBJECT',          // :object
	TYPE_NULL = 'TYPE_NULL',              // :null

	// Punctuation
	LPAREN = 'LPAREN',                    // (
	RPAREN = 'RPAREN',                    // )
	LBRACKET = 'LBRACKET',                // [
	RBRACKET = 'RBRACKET',                // ]
	DOT = 'DOT',                          // .
	COMMA = 'COMMA',                      // ,
	EXCLAMATION = 'EXCLAMATION',          // !

	// Special
	EOF = 'EOF',
	REGEX = 'REGEX',                      // /pattern/flags
}

export interface Token {
	type: TokenType;
	value: string | number | boolean | null;
	position: number;
	raw?: string;  // Original text representation
}

export class LexerError extends Error {
	constructor(message: string, public position: number) {
		super(`Lexer error at position ${position}: ${message}`);
		this.name = 'LexerError';
	}
}

/**
 * Tokenize a condition string
 */
export function tokenize(input: string): Token[] {
	const lexer = new ConditionLexer(input);
	return lexer.tokenize();
}

class ConditionLexer {
	private input: string;
	private position: number = 0;
	private tokens: Token[] = [];

	constructor(input: string) {
		this.input = input;
	}

	tokenize(): Token[] {
		while (this.position < this.input.length) {
			this.skipWhitespace();

			if (this.position >= this.input.length) {
				break;
			}

			const char = this.input[this.position];

			// Single character tokens
			if (char === '(') {
				this.tokens.push({ type: TokenType.LPAREN, value: '(', position: this.position });
				this.position++;
				continue;
			}

			if (char === ')') {
				this.tokens.push({ type: TokenType.RPAREN, value: ')', position: this.position });
				this.position++;
				continue;
			}

			if (char === '[') {
				this.tokens.push({ type: TokenType.LBRACKET, value: '[', position: this.position });
				this.position++;
				continue;
			}

			if (char === ']') {
				this.tokens.push({ type: TokenType.RBRACKET, value: ']', position: this.position });
				this.position++;
				continue;
			}

			if (char === '.') {
				this.tokens.push({ type: TokenType.DOT, value: '.', position: this.position });
				this.position++;
				continue;
			}

			if (char === ',') {
				this.tokens.push({ type: TokenType.COMMA, value: ',', position: this.position });
				this.position++;
				continue;
			}

			// Operators
			if (char === '!') {
				if (this.peek() === '=') {
					this.tokens.push({ type: TokenType.NOT_EQUALS, value: '!=', position: this.position });
					this.position += 2;
					continue;
				}
				this.tokens.push({ type: TokenType.EXCLAMATION, value: '!', position: this.position });
				this.position++;
				continue;
			}

			if (char === '=') {
				this.tokens.push({ type: TokenType.EQUALS, value: '=', position: this.position });
				this.position++;
				continue;
			}

			if (char === '>') {
				if (this.peek() === '=') {
					this.tokens.push({ type: TokenType.GREATER_EQUAL, value: '>=', position: this.position });
					this.position += 2;
					continue;
				}
				this.tokens.push({ type: TokenType.GREATER_THAN, value: '>', position: this.position });
				this.position++;
				continue;
			}

			if (char === '<') {
				if (this.peek() === '=') {
					this.tokens.push({ type: TokenType.LESS_EQUAL, value: '<=', position: this.position });
					this.position += 2;
					continue;
				}
				this.tokens.push({ type: TokenType.LESS_THAN, value: '<', position: this.position });
				this.position++;
				continue;
			}

			if (char === '~') {
				this.tokens.push({ type: TokenType.REGEX_MATCH, value: '~', position: this.position });
				this.position++;
				continue;
			}

			// Regex pattern /pattern/flags
			if (char === '/') {
				this.tokenizeRegex();
				continue;
			}

			// Strings
			if (char === '"' || char === "'") {
				this.tokenizeString(char);
				continue;
			}

			// Numbers
			if (this.isDigit(char) || (char === '-' && this.isDigit(this.peek() || ''))) {
				this.tokenizeNumber();
				continue;
			}

			// Type checks (:string, :number, etc.)
			if (char === ':') {
				this.tokenizeTypeCheck();
				continue;
			}

			// Keywords and identifiers (including * for wildcard)
			if (this.isAlpha(char) || char === '*') {
				this.tokenizeIdentifierOrKeyword();
				continue;
			}

			throw new LexerError(`Unexpected character: '${char}'`, this.position);
		}

		this.tokens.push({ type: TokenType.EOF, value: '', position: this.position });
		return this.tokens;
	}

	private skipWhitespace(): void {
		while (this.position < this.input.length && this.isWhitespace(this.input[this.position])) {
			this.position++;
		}
	}

	private peek(offset: number = 1): string | null {
		const pos = this.position + offset;
		return pos < this.input.length ? this.input[pos] : null;
	}

	private tokenizeString(quote: string): void {
		const start = this.position;
		this.position++; // Skip opening quote

		let value = '';
		let escaped = false;

		while (this.position < this.input.length) {
			const char = this.input[this.position];

			if (escaped) {
				// Handle escape sequences
				switch (char) {
					case 'n': value += '\n'; break;
					case 't': value += '\t'; break;
					case 'r': value += '\r'; break;
					case '\\': value += '\\'; break;
					case '"': value += '"'; break;
					case "'": value += "'"; break;
					default: value += char;
				}
				escaped = false;
				this.position++;
				continue;
			}

			if (char === '\\') {
				escaped = true;
				this.position++;
				continue;
			}

			if (char === quote) {
				this.position++; // Skip closing quote
				this.tokens.push({
					type: TokenType.STRING,
					value: value,
					position: start,
					raw: this.input.substring(start, this.position)
				});
				return;
			}

			value += char;
			this.position++;
		}

		throw new LexerError(`Unterminated string starting at position ${start}`, start);
	}

	private tokenizeNumber(): void {
		const start = this.position;
		let numStr = '';

		// Handle negative sign
		if (this.input[this.position] === '-') {
			numStr += '-';
			this.position++;
		}

		// Integer part
		while (this.position < this.input.length && this.isDigit(this.input[this.position])) {
			numStr += this.input[this.position];
			this.position++;
		}

		// Decimal part
		if (this.position < this.input.length && this.input[this.position] === '.') {
			const nextChar = this.peek();
			if (nextChar && this.isDigit(nextChar)) {
				numStr += '.';
				this.position++;

				while (this.position < this.input.length && this.isDigit(this.input[this.position])) {
					numStr += this.input[this.position];
					this.position++;
				}
			}
		}

		const value = parseFloat(numStr);
		if (isNaN(value)) {
			throw new LexerError(`Invalid number: ${numStr}`, start);
		}

		this.tokens.push({
			type: TokenType.NUMBER,
			value: value,
			position: start,
			raw: numStr
		});
	}

	private tokenizeRegex(): void {
		const start = this.position;
		this.position++; // Skip opening /

		let pattern = '';
		let escaped = false;

		// Read pattern until unescaped /
		while (this.position < this.input.length) {
			const char = this.input[this.position];

			if (escaped) {
				pattern += char;
				escaped = false;
				this.position++;
				continue;
			}

			if (char === '\\') {
				pattern += char;
				escaped = true;
				this.position++;
				continue;
			}

			if (char === '/') {
				this.position++; // Skip closing /
				break;
			}

			pattern += char;
			this.position++;
		}

		// Read flags (optional)
		let flags = '';
		while (this.position < this.input.length && /[gimsuvy]/.test(this.input[this.position])) {
			flags += this.input[this.position];
			this.position++;
		}

		const regexStr = flags ? `/${pattern}/${flags}` : `/${pattern}/`;

		this.tokens.push({
			type: TokenType.REGEX,
			value: regexStr,
			position: start,
			raw: regexStr
		});
	}

	private tokenizeTypeCheck(): void {
		const start = this.position;
		this.position++; // Skip :

		const typeStart = this.position;
		while (this.position < this.input.length && this.isAlpha(this.input[this.position])) {
			this.position++;
		}

		const typeName = this.input.substring(typeStart, this.position).toLowerCase();

		const typeMap: Record<string, TokenType> = {
			'string': TokenType.TYPE_STRING,
			'number': TokenType.TYPE_NUMBER,
			'boolean': TokenType.TYPE_BOOLEAN,
			'array': TokenType.TYPE_ARRAY,
			'object': TokenType.TYPE_OBJECT,
			'null': TokenType.TYPE_NULL,
		};

		const tokenType = typeMap[typeName];
		if (!tokenType) {
			throw new LexerError(`Unknown type check: :${typeName}`, start);
		}

		this.tokens.push({
			type: tokenType,
			value: `:${typeName}`,
			position: start
		});
	}

	private tokenizeIdentifierOrKeyword(): void {
		const start = this.position;
		let value = '';

		// Handle * as a special identifier for wildcards
		if (this.input[this.position] === '*') {
			value = '*';
			this.position++;
			this.tokens.push({
				type: TokenType.IDENTIFIER,
				value: '*',
				position: start
			});
			return;
		}

		while (this.position < this.input.length &&
		       (this.isAlphaNumeric(this.input[this.position]) ||
		        this.input[this.position] === '_' ||
		        this.input[this.position] === '-' ||
		        this.input[this.position] === '/')) {
			value += this.input[this.position];
			this.position++;
		}

		// Check for keywords (case-insensitive)
		const lowerValue = value.toLowerCase();

		const keywordMap: Record<string, TokenType> = {
			'and': TokenType.AND,
			'or': TokenType.OR,
			'not': TokenType.NOT,
			'exists': TokenType.EXISTS,
			'empty': TokenType.EMPTY,
			'has': TokenType.HAS,
			'where': TokenType.WHERE,
			'any': TokenType.ANY,
			'all': TokenType.ALL,
			'length': TokenType.LENGTH,
			'true': TokenType.BOOLEAN,
			'false': TokenType.BOOLEAN,
			'null': TokenType.NULL,
		};

		const keywordType = keywordMap[lowerValue];

		if (keywordType) {
			if (keywordType === TokenType.BOOLEAN) {
				this.tokens.push({
					type: TokenType.BOOLEAN,
					value: lowerValue === 'true',
					position: start,
					raw: value
				});
			} else if (keywordType === TokenType.NULL) {
				this.tokens.push({
					type: TokenType.NULL,
					value: null,
					position: start,
					raw: value
				});
			} else {
				this.tokens.push({
					type: keywordType,
					value: value,
					position: start
				});
			}
		} else {
			this.tokens.push({
				type: TokenType.IDENTIFIER,
				value: value,
				position: start
			});
		}
	}

	private isWhitespace(char: string): boolean {
		return /\s/.test(char);
	}

	private isDigit(char: string): boolean {
		return /\d/.test(char);
	}

	private isAlpha(char: string): boolean {
		return /[a-zA-Z]/.test(char);
	}

	private isAlphaNumeric(char: string): boolean {
		return /[a-zA-Z0-9]/.test(char);
	}
}
