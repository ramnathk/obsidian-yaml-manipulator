/**
 * Action Lexer - Tokenize action strings
 * Based on requirements Section 4.1, 4.2, 4.3
 *
 * Simpler than condition lexer because actions have more structured syntax
 */

export enum ActionTokenType {
	// Operations
	SET = 'SET',
	ADD = 'ADD',
	DELETE = 'DELETE',
	RENAME = 'RENAME',
	APPEND = 'APPEND',
	PREPEND = 'PREPEND',
	INSERT_AT = 'INSERT_AT',
	INSERT_AFTER = 'INSERT_AFTER',
	INSERT_BEFORE = 'INSERT_BEFORE',
	REMOVE = 'REMOVE',
	REMOVE_ALL = 'REMOVE_ALL',
	REMOVE_AT = 'REMOVE_AT',
	REPLACE = 'REPLACE',
	REPLACE_ALL = 'REPLACE_ALL',
	DEDUPLICATE = 'DEDUPLICATE',
	SORT = 'SORT',
	SORT_BY = 'SORT_BY',
	MOVE = 'MOVE',
	MOVE_WHERE = 'MOVE_WHERE',
	UPDATE_WHERE = 'UPDATE_WHERE',
	MERGE = 'MERGE',
	MERGE_OVERWRITE = 'MERGE_OVERWRITE',
	CLEAR = 'CLEAR',

	// Keywords
	WHERE = 'WHERE',
	AT = 'AT',
	TO = 'TO',
	FROM = 'FROM',
	WITH = 'WITH',
	BY = 'BY',
	AFTER = 'AFTER',
	BEFORE = 'BEFORE',
	ASC = 'ASC',
	DESC = 'DESC',
	START = 'START',
	END = 'END',

	// Literals
	IDENTIFIER = 'IDENTIFIER',
	STRING = 'STRING',
	NUMBER = 'NUMBER',
	BOOLEAN = 'BOOLEAN',
	NULL = 'NULL',
	OBJECT = 'OBJECT',       // JSON object
	ARRAY = 'ARRAY',         // JSON array

	// Punctuation
	COMMA = 'COMMA',
	DOT = 'DOT',
	LBRACKET = 'LBRACKET',
	RBRACKET = 'RBRACKET',

	// Operators (for embedded conditions in UPDATE_WHERE/MOVE_WHERE)
	EQUALS = 'EQUALS',
	NOT_EQUALS = 'NOT_EQUALS',
	GREATER_THAN = 'GREATER_THAN',
	LESS_THAN = 'LESS_THAN',
	GREATER_EQUAL = 'GREATER_EQUAL',
	LESS_EQUAL = 'LESS_EQUAL',
	REGEX_MATCH = 'REGEX_MATCH',
	EXCLAMATION = 'EXCLAMATION',

	// Special
	EOF = 'EOF',
}

export interface ActionToken {
	type: ActionTokenType;
	value: string | number | boolean | null | object;
	position: number;
	raw?: string;
}

export class ActionLexerError extends Error {
	constructor(message: string, public position: number) {
		super(`Action lexer error at position ${position}: ${message}`);
		this.name = 'ActionLexerError';
	}
}

/**
 * Tokenize an action string
 */
export function tokenizeAction(input: string): ActionToken[] {
	const lexer = new ActionLexer(input);
	return lexer.tokenize();
}

class ActionLexer {
	private input: string;
	private position: number = 0;
	private tokens: ActionToken[] = [];

	constructor(input: string) {
		this.input = input;
	}

	tokenize(): ActionToken[] {
		while (this.position < this.input.length) {
			this.skipWhitespace();

			if (this.position >= this.input.length) {
				break;
			}

			const char = this.input[this.position];

			// Punctuation
			if (char === ',') {
				this.tokens.push({ type: ActionTokenType.COMMA, value: ',', position: this.position });
				this.position++;
				continue;
			}

			if (char === '.') {
				this.tokens.push({ type: ActionTokenType.DOT, value: '.', position: this.position });
				this.position++;
				continue;
			}

			// Handle [ - could be array indexing or array literal
			if (char === '[') {
				const nextChar = this.peek();
				// If next char is a digit, it's array indexing (e.g., field[0])
				// Otherwise, it's an array literal (e.g., ["value1", "value2"])
				const isArrayIndexing = nextChar !== null && this.isDigit(nextChar);

				if (isArrayIndexing) {
					// Array indexing: create LBRACKET token
					this.tokens.push({ type: ActionTokenType.LBRACKET, value: '[', position: this.position });
					this.position++;
					continue;
				} else {
					// Array literal: tokenize entire array
					this.tokenizeArray();
					continue;
				}
			}

			if (char === ']') {
				this.tokens.push({ type: ActionTokenType.RBRACKET, value: ']', position: this.position });
				this.position++;
				continue;
			}

			// Comparison operators
			if (char === '!') {
				if (this.peek() === '=') {
					this.tokens.push({ type: ActionTokenType.NOT_EQUALS, value: '!=', position: this.position });
					this.position += 2;
					continue;
				}
				this.tokens.push({ type: ActionTokenType.EXCLAMATION, value: '!', position: this.position });
				this.position++;
				continue;
			}

			if (char === '=') {
				this.tokens.push({ type: ActionTokenType.EQUALS, value: '=', position: this.position });
				this.position++;
				continue;
			}

			if (char === '>') {
				if (this.peek() === '=') {
					this.tokens.push({ type: ActionTokenType.GREATER_EQUAL, value: '>=', position: this.position });
					this.position += 2;
					continue;
				}
				this.tokens.push({ type: ActionTokenType.GREATER_THAN, value: '>', position: this.position });
				this.position++;
				continue;
			}

			if (char === '<') {
				if (this.peek() === '=') {
					this.tokens.push({ type: ActionTokenType.LESS_EQUAL, value: '<=', position: this.position });
					this.position += 2;
					continue;
				}
				this.tokens.push({ type: ActionTokenType.LESS_THAN, value: '<', position: this.position });
				this.position++;
				continue;
			}

			if (char === '~') {
				this.tokens.push({ type: ActionTokenType.REGEX_MATCH, value: '~', position: this.position });
				this.position++;
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

			// JSON objects
			if (char === '{') {
				this.tokenizeObject();
				continue;
			}

			// Keywords, operations, and identifiers
			if (this.isAlpha(char)) {
				this.tokenizeKeywordOrIdentifier();
				continue;
			}

			throw new ActionLexerError(`Unexpected character: '${char}'`, this.position);
		}

		this.tokens.push({ type: ActionTokenType.EOF, value: '', position: this.position });
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
					type: ActionTokenType.STRING,
					value: value,
					position: start,
					raw: this.input.substring(start, this.position)
				});
				return;
			}

			value += char;
			this.position++;
		}

		throw new ActionLexerError(`Unterminated string starting at position ${start}`, start);
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
			throw new ActionLexerError(`Invalid number: ${numStr}`, start);
		}

		this.tokens.push({
			type: ActionTokenType.NUMBER,
			value: value,
			position: start,
			raw: numStr
		});
	}

	private tokenizeObject(): void {
		const start = this.position;
		let braceCount = 0;
		let jsonStr = '';

		// Collect the entire JSON string
		while (this.position < this.input.length) {
			const char = this.input[this.position];
			jsonStr += char;

			if (char === '{') braceCount++;
			if (char === '}') braceCount--;

			this.position++;

			if (braceCount === 0) {
				break;
			}
		}

		if (braceCount !== 0) {
			throw new ActionLexerError('Unclosed JSON object', start);
		}

		try {
			const value = JSON.parse(jsonStr);
			this.tokens.push({
				type: ActionTokenType.OBJECT,
				value: value,
				position: start,
				raw: jsonStr
			});
		} catch (e) {
			throw new ActionLexerError(`Invalid JSON object: ${jsonStr}`, start);
		}
	}

	private tokenizeArray(): void {
		const start = this.position;
		let bracketCount = 0;
		let jsonStr = '';

		// Collect the entire JSON array string
		while (this.position < this.input.length) {
			const char = this.input[this.position];
			jsonStr += char;

			if (char === '[') bracketCount++;
			if (char === ']') bracketCount--;

			this.position++;

			if (bracketCount === 0) {
				break;
			}
		}

		if (bracketCount !== 0) {
			throw new ActionLexerError('Unclosed JSON array', start);
		}

		try {
			const value = JSON.parse(jsonStr);
			if (!Array.isArray(value)) {
				throw new Error('Not an array');
			}
			this.tokens.push({
				type: ActionTokenType.ARRAY,
				value: value,
				position: start,
				raw: jsonStr
			});
		} catch (e) {
			throw new ActionLexerError(`Invalid JSON array: ${jsonStr}`, start);
		}
	}

	private tokenizeKeywordOrIdentifier(): void {
		const start = this.position;
		let value = '';

		while (this.position < this.input.length &&
		       (this.isAlphaNumeric(this.input[this.position]) ||
		        this.input[this.position] === '_' ||
		        this.input[this.position] === '-' ||
		        this.input[this.position] === '/')) {
			value += this.input[this.position];
			this.position++;
		}

		// Check for operation keywords (case-insensitive)
		const upper = value.toUpperCase();

		const operationMap: Record<string, ActionTokenType> = {
			'SET': ActionTokenType.SET,
			'ADD': ActionTokenType.ADD,
			'DELETE': ActionTokenType.DELETE,
			'RENAME': ActionTokenType.RENAME,
			'APPEND': ActionTokenType.APPEND,
			'PREPEND': ActionTokenType.PREPEND,
			'INSERT_AT': ActionTokenType.INSERT_AT,
			'INSERT_AFTER': ActionTokenType.INSERT_AFTER,
			'INSERT_BEFORE': ActionTokenType.INSERT_BEFORE,
			'REMOVE': ActionTokenType.REMOVE,
			'REMOVE_ALL': ActionTokenType.REMOVE_ALL,
			'REMOVE_AT': ActionTokenType.REMOVE_AT,
			'REPLACE': ActionTokenType.REPLACE,
			'REPLACE_ALL': ActionTokenType.REPLACE_ALL,
			'DEDUPLICATE': ActionTokenType.DEDUPLICATE,
			'SORT': ActionTokenType.SORT,
			'SORT_BY': ActionTokenType.SORT_BY,
			'MOVE': ActionTokenType.MOVE,
			'MOVE_WHERE': ActionTokenType.MOVE_WHERE,
			'UPDATE_WHERE': ActionTokenType.UPDATE_WHERE,
			'MERGE': ActionTokenType.MERGE,
			'MERGE_OVERWRITE': ActionTokenType.MERGE_OVERWRITE,
			'CLEAR': ActionTokenType.CLEAR,
		};

		const keywordMap: Record<string, ActionTokenType> = {
			'WHERE': ActionTokenType.WHERE,
			'AT': ActionTokenType.AT,
			'TO': ActionTokenType.TO,
			'FROM': ActionTokenType.FROM,
			'WITH': ActionTokenType.WITH,
			'BY': ActionTokenType.BY,
			'AFTER': ActionTokenType.AFTER,
			'BEFORE': ActionTokenType.BEFORE,
			'ASC': ActionTokenType.ASC,
			'DESC': ActionTokenType.DESC,
			'START': ActionTokenType.START,
			'END': ActionTokenType.END,
			'TRUE': ActionTokenType.BOOLEAN,
			'FALSE': ActionTokenType.BOOLEAN,
			'NULL': ActionTokenType.NULL,
		};

		if (operationMap[upper]) {
			this.tokens.push({
				type: operationMap[upper],
				value: value,
				position: start
			});
		} else if (keywordMap[upper]) {
			if (upper === 'TRUE' || upper === 'FALSE') {
				this.tokens.push({
					type: ActionTokenType.BOOLEAN,
					value: upper === 'TRUE',
					position: start,
					raw: value
				});
			} else if (upper === 'NULL') {
				this.tokens.push({
					type: ActionTokenType.NULL,
					value: null,
					position: start,
					raw: value
				});
			} else {
				this.tokens.push({
					type: keywordMap[upper],
					value: value,
					position: start
				});
			}
		} else {
			this.tokens.push({
				type: ActionTokenType.IDENTIFIER,
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
