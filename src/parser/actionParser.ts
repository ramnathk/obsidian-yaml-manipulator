/**
 * Action Parser - Parse action tokens into Action AST
 * Based on requirements Section 4.1, 4.2, 4.3
 *
 * Handles all 20+ action operations including complex ones like UPDATE_WHERE and MOVE_WHERE
 */

import { ActionToken, ActionTokenType, tokenizeAction } from './actionLexer';
import { parseCondition } from './conditionParser';
import {
	ActionAST,
	SetAction,
	AddAction,
	DeleteAction,
	RenameAction,
	AppendAction,
	PrependAction,
	InsertAction,
	InsertAfterAction,
	InsertBeforeAction,
	RemoveAction,
	RemoveAllAction,
	RemoveAtAction,
	ReplaceAction,
	ReplaceAllAction,
	DeduplicateAction,
	SortAction,
	SortByAction,
	MoveAction,
	MoveWhereAction,
	UpdateWhereAction,
	MergeAction,
	MergeOverwriteAction,
	ConditionAST,
} from '../types';

export class ActionParserError extends Error {
	constructor(message: string, public token?: ActionToken) {
		const position = token ? ` at position ${token.position}` : '';
		super(`Action parser error${position}: ${message}`);
		this.name = 'ActionParserError';
	}
}

/**
 * Parse an action string into an ActionAST
 */
export function parseAction(input: string): ActionAST {
	const tokens = tokenizeAction(input);
	const parser = new ActionParser(tokens);
	return parser.parse();
}

class ActionParser {
	private tokens: ActionToken[];
	private position: number = 0;

	constructor(tokens: ActionToken[]) {
		this.tokens = tokens;
	}

	parse(): ActionAST {
		const operation = this.current();

		switch (operation.type) {
			case ActionTokenType.SET:
				return this.parseSet();
			case ActionTokenType.ADD:
				return this.parseAdd();
			case ActionTokenType.DELETE:
				return this.parseDelete();
			case ActionTokenType.RENAME:
				return this.parseRename();
			case ActionTokenType.APPEND:
				return this.parseAppend();
			case ActionTokenType.PREPEND:
				return this.parsePrepend();
			case ActionTokenType.INSERT_AT:
				return this.parseInsertAt();
			case ActionTokenType.INSERT_AFTER:
				return this.parseInsertAfter();
			case ActionTokenType.INSERT_BEFORE:
				return this.parseInsertBefore();
			case ActionTokenType.REMOVE:
				return this.parseRemove();
			case ActionTokenType.REMOVE_ALL:
				return this.parseRemoveAll();
			case ActionTokenType.REMOVE_AT:
				return this.parseRemoveAt();
			case ActionTokenType.REPLACE:
				return this.parseReplace();
			case ActionTokenType.REPLACE_ALL:
				return this.parseReplaceAll();
			case ActionTokenType.DEDUPLICATE:
				return this.parseDeduplicate();
			case ActionTokenType.SORT:
				return this.parseSort();
			case ActionTokenType.SORT_BY:
				return this.parseSortBy();
			case ActionTokenType.MOVE:
				return this.parseMove();
			case ActionTokenType.MOVE_WHERE:
				return this.parseMoveWhere();
			case ActionTokenType.UPDATE_WHERE:
				return this.parseUpdateWhere();
			case ActionTokenType.MERGE:
				return this.parseMerge();
			case ActionTokenType.MERGE_OVERWRITE:
				return this.parseMergeOverwrite();
			case ActionTokenType.CLEAR:
				return this.parseClear();
			default:
				throw new ActionParserError(`Unknown operation: ${operation.type}`, operation);
		}
	}

	/**
	 * SET path value
	 */
	private parseSet(): SetAction {
		this.advance(); // consume SET
		const path = this.parsePath();
		const value = this.parseValue();
		return { op: 'SET', path, value };
	}

	/**
	 * ADD path value
	 */
	private parseAdd(): AddAction {
		this.advance(); // consume ADD
		const path = this.parsePath();
		const value = this.parseValue();
		return { op: 'ADD', path, value };
	}

	/**
	 * DELETE path
	 */
	private parseDelete(): DeleteAction {
		this.advance(); // consume DELETE
		const path = this.parsePath();
		return { op: 'DELETE', path };
	}

	/**
	 * RENAME oldPath newPath
	 */
	private parseRename(): RenameAction {
		this.advance(); // consume RENAME
		const oldPath = this.parsePath();
		const newPath = this.parsePath();
		return { op: 'RENAME', oldPath, newPath };
	}

	/**
	 * APPEND path value
	 */
	private parseAppend(): AppendAction {
		this.advance(); // consume APPEND
		const path = this.parsePath();
		const value = this.parseValue();
		return { op: 'APPEND', path, value };
	}

	/**
	 * PREPEND path value
	 */
	private parsePrepend(): PrependAction {
		this.advance(); // consume PREPEND
		const path = this.parsePath();
		const value = this.parseValue();
		return { op: 'PREPEND', path, value };
	}

	/**
	 * INSERT_AT path value AT index
	 */
	private parseInsertAt(): InsertAction {
		this.advance(); // consume INSERT_AT
		const path = this.parsePath();
		const value = this.parseValue();
		this.expect(ActionTokenType.AT, 'Expected AT keyword');
		const index = this.expectNumber('Expected index number');
		return { op: 'INSERT_AT', path, index, value };
	}

	/**
	 * INSERT_AFTER path value AFTER target
	 */
	private parseInsertAfter(): InsertAfterAction {
		this.advance(); // consume INSERT_AFTER
		const path = this.parsePath();
		const value = this.parseValue();
		this.expect(ActionTokenType.AFTER, 'Expected AFTER keyword');
		const target = this.parseValue();
		return { op: 'INSERT_AFTER', path, target, value };
	}

	/**
	 * INSERT_BEFORE path value BEFORE target
	 */
	private parseInsertBefore(): InsertBeforeAction {
		this.advance(); // consume INSERT_BEFORE
		const path = this.parsePath();
		const value = this.parseValue();
		this.expect(ActionTokenType.BEFORE, 'Expected BEFORE keyword');
		const target = this.parseValue();
		return { op: 'INSERT_BEFORE', path, target, value };
	}

	/**
	 * REMOVE path value
	 */
	private parseRemove(): RemoveAction {
		this.advance(); // consume REMOVE
		const path = this.parsePath();
		const value = this.parseValue();
		return { op: 'REMOVE', path, value };
	}

	/**
	 * REMOVE_ALL path value
	 */
	private parseRemoveAll(): RemoveAllAction {
		this.advance(); // consume REMOVE_ALL
		const path = this.parsePath();
		const value = this.parseValue();
		return { op: 'REMOVE_ALL', path, value };
	}

	/**
	 * REMOVE_AT path index
	 */
	private parseRemoveAt(): RemoveAtAction {
		this.advance(); // consume REMOVE_AT
		const path = this.parsePath();
		const index = this.expectNumber('Expected index number');
		return { op: 'REMOVE_AT', path, index };
	}

	/**
	 * REPLACE path oldValue WITH newValue
	 */
	private parseReplace(): ReplaceAction {
		this.advance(); // consume REPLACE
		const path = this.parsePath();
		const oldValue = this.parseValue();
		this.expect(ActionTokenType.WITH, 'Expected WITH keyword');
		const newValue = this.parseValue();
		return { op: 'REPLACE', path, oldValue, newValue };
	}

	/**
	 * REPLACE_ALL path oldValue WITH newValue
	 */
	private parseReplaceAll(): ReplaceAllAction {
		this.advance(); // consume REPLACE_ALL
		const path = this.parsePath();
		const oldValue = this.parseValue();
		this.expect(ActionTokenType.WITH, 'Expected WITH keyword');
		const newValue = this.parseValue();
		return { op: 'REPLACE_ALL', path, oldValue, newValue };
	}

	/**
	 * DEDUPLICATE path
	 */
	private parseDeduplicate(): DeduplicateAction {
		this.advance(); // consume DEDUPLICATE
		const path = this.parsePath();
		return { op: 'DEDUPLICATE', path };
	}

	/**
	 * SORT path [ASC|DESC]
	 */
	private parseSort(): SortAction {
		this.advance(); // consume SORT
		const path = this.parsePath();

		// Optional order (defaults to ASC)
		let order: 'ASC' | 'DESC' = 'ASC';
		const token = this.current();
		if (token.type === ActionTokenType.ASC || token.type === ActionTokenType.DESC) {
			order = token.type === ActionTokenType.DESC ? 'DESC' : 'ASC';
			this.advance();
		}

		return { op: 'SORT', path, order };
	}

	/**
	 * SORT_BY path BY field [ASC|DESC]
	 */
	private parseSortBy(): SortByAction {
		this.advance(); // consume SORT_BY
		const path = this.parsePath();
		this.expect(ActionTokenType.BY, 'Expected BY keyword');
		const field = this.expectIdentifier('Expected field name');

		// Optional order (defaults to ASC)
		let order: 'ASC' | 'DESC' = 'ASC';
		const token = this.current();
		if (token.type === ActionTokenType.ASC || token.type === ActionTokenType.DESC) {
			order = token.type === ActionTokenType.DESC ? 'DESC' : 'ASC';
			this.advance();
		}

		return { op: 'SORT_BY', path, field, order };
	}

	/**
	 * MOVE path FROM index TO index
	 */
	private parseMove(): MoveAction {
		this.advance(); // consume MOVE
		const path = this.parsePath();
		this.expect(ActionTokenType.FROM, 'Expected FROM keyword');
		const fromIndex = this.expectNumber('Expected from index');
		this.expect(ActionTokenType.TO, 'Expected TO keyword');
		const toIndex = this.expectNumber('Expected to index');
		return { op: 'MOVE', path, fromIndex, toIndex };
	}

	/**
	 * MOVE_WHERE path WHERE condition TO position
	 * MOVE_WHERE path WHERE condition AFTER/BEFORE condition
	 */
	private parseMoveWhere(): MoveWhereAction {
		this.advance(); // consume MOVE_WHERE
		const path = this.parsePath();
		this.expect(ActionTokenType.WHERE, 'Expected WHERE keyword');

		// Parse condition (collect tokens until TO/AFTER/BEFORE)
		const conditionTokens: ActionToken[] = [];
		while (this.current().type !== ActionTokenType.TO &&
		       this.current().type !== ActionTokenType.AFTER &&
		       this.current().type !== ActionTokenType.BEFORE &&
		       this.current().type !== ActionTokenType.EOF) {
			conditionTokens.push(this.current());
			this.advance();
		}

		const conditionStr = this.reconstructConditionString(conditionTokens);
		const condition = parseCondition(conditionStr);

		// Parse target (TO position or AFTER/BEFORE condition)
		const targetToken = this.current();

		if (targetToken.type === ActionTokenType.TO) {
			this.advance(); // consume TO
			const nextToken = this.current();

			// Check for START/END keywords or numeric index
			if (nextToken.type === ActionTokenType.START) {
				this.advance();
				return { op: 'MOVE_WHERE', path, condition, target: 'START' };
			} else if (nextToken.type === ActionTokenType.END) {
				this.advance();
				return { op: 'MOVE_WHERE', path, condition, target: 'END' };
			} else if (nextToken.type === ActionTokenType.NUMBER) {
				const index = nextToken.value as number;
				this.advance();
				// Convert numeric index to START/END for compatibility
				// Note: Parser returns START/END, but executor will handle numeric positions
				return { op: 'MOVE_WHERE', path, condition, target: index === 0 ? 'START' : 'END' };
			} else {
				throw new ActionParserError('Expected START, END, or number after TO', nextToken);
			}
		} else if (targetToken.type === ActionTokenType.AFTER || targetToken.type === ActionTokenType.BEFORE) {
			const position = targetToken.type === ActionTokenType.AFTER ? 'AFTER' : 'BEFORE';
			this.advance(); // consume AFTER/BEFORE

			// Parse reference condition
			const refTokens: ActionToken[] = [];
			while (this.current().type !== ActionTokenType.EOF) {
				refTokens.push(this.current());
				this.advance();
			}

			const refConditionStr = this.reconstructConditionString(refTokens);
			const reference = parseCondition(refConditionStr);

			return {
				op: 'MOVE_WHERE',
				path,
				condition,
				target: { position, reference }
			};
		} else {
			throw new ActionParserError('Expected TO, AFTER, or BEFORE after WHERE condition', targetToken);
		}
	}

	/**
	 * UPDATE_WHERE path WHERE condition SET field value [, field2 value2, ...]
	 */
	private parseUpdateWhere(): UpdateWhereAction {
		this.advance(); // consume UPDATE_WHERE
		const path = this.parsePath();
		this.expect(ActionTokenType.WHERE, 'Expected WHERE keyword');

		// Parse condition (collect tokens until SET)
		const conditionTokens: ActionToken[] = [];
		while (this.current().type !== ActionTokenType.SET && this.current().type !== ActionTokenType.EOF) {
			conditionTokens.push(this.current());
			this.advance();
		}

		const conditionStr = this.reconstructConditionString(conditionTokens);
		const condition = parseCondition(conditionStr);

		this.expect(ActionTokenType.SET, 'Expected SET keyword');

		// Parse updates (field value pairs, comma-separated)
		const updates: Array<{ field: string; value: any }> = [];

		while (true) {
			const field = this.expectIdentifier('Expected field name');
			const value = this.parseValue();
			updates.push({ field, value });

			// Check for comma (more updates) or EOF (done)
			if (this.current().type === ActionTokenType.COMMA) {
				this.advance(); // consume comma
				continue;
			} else if (this.current().type === ActionTokenType.EOF) {
				break;
			} else {
				throw new ActionParserError('Expected comma or end of action after field update', this.current());
			}
		}

		return { op: 'UPDATE_WHERE', path, condition, updates };
	}

	/**
	 * MERGE path object
	 */
	private parseMerge(): MergeAction {
		this.advance(); // consume MERGE
		const path = this.parsePath();
		const value = this.parseValue();

		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			throw new ActionParserError('MERGE requires an object value', this.current());
		}

		return { op: 'MERGE', path, value };
	}

	/**
	 * MERGE_OVERWRITE path object
	 */
	private parseMergeOverwrite(): MergeOverwriteAction {
		this.advance(); // consume MERGE_OVERWRITE
		const path = this.parsePath();
		const value = this.parseValue();

		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			throw new ActionParserError('MERGE_OVERWRITE requires an object value', this.current());
		}

		return { op: 'MERGE_OVERWRITE', path, value };
	}

	/**
	 * CLEAR path
	 */
	private parseClear(): DeleteAction {
		this.advance(); // consume CLEAR
		const path = this.parsePath();
		// CLEAR is just an alias for DELETE in the AST
		return { op: 'DELETE', path };
	}

	/**
	 * Parse path (supports dot notation and array indices)
	 */
	private parsePath(): string {
		let path = '';

		const startToken = this.current();
		if (startToken.type !== ActionTokenType.IDENTIFIER) {
			throw new ActionParserError('Expected identifier for path', startToken);
		}

		path = String(startToken.value);
		this.advance();

		// Continue building path with dots and brackets
		while (true) {
			const token = this.current();

			// Dot notation: .field
			if (token.type === ActionTokenType.DOT) {
				this.advance();
				const next = this.current();

				if (next.type === ActionTokenType.IDENTIFIER) {
					path += '.' + next.value;
					this.advance();
				} else {
					throw new ActionParserError('Expected identifier after dot', next);
				}
			}
			// Array index: [n]
			else if (token.type === ActionTokenType.LBRACKET) {
				this.advance();
				const indexToken = this.current();

				if (indexToken.type === ActionTokenType.NUMBER) {
					path += `[${indexToken.value}]`;
					this.advance();
				} else {
					throw new ActionParserError('Expected number in array index', indexToken);
				}

				this.expect(ActionTokenType.RBRACKET, 'Expected closing bracket');
			} else {
				break;
			}
		}

		return path;
	}

	/**
	 * Parse value (string, number, boolean, null, object, array)
	 */
	private parseValue(): any {
		const token = this.current();

		if (token.type === ActionTokenType.STRING) {
			this.advance();
			return token.value;
		}

		if (token.type === ActionTokenType.NUMBER) {
			this.advance();
			return token.value;
		}

		if (token.type === ActionTokenType.BOOLEAN) {
			this.advance();
			return token.value;
		}

		if (token.type === ActionTokenType.NULL) {
			this.advance();
			return null;
		}

		if (token.type === ActionTokenType.OBJECT) {
			this.advance();
			return token.value;
		}

		if (token.type === ActionTokenType.ARRAY) {
			this.advance();
			return token.value;
		}

		throw new ActionParserError('Expected value', token);
	}

	/**
	 * Reconstruct condition string from tokens (for embedded conditions)
	 */
	private reconstructConditionString(tokens: ActionToken[]): string {
		return tokens.map(t => {
			if (t.type === ActionTokenType.STRING) {
				return `"${t.value}"`;
			}
			// Map operator tokens back to their string representations
			const operatorMap: Record<string, string> = {
				[ActionTokenType.EQUALS]: '=',
				[ActionTokenType.NOT_EQUALS]: '!=',
				[ActionTokenType.GREATER_THAN]: '>',
				[ActionTokenType.LESS_THAN]: '<',
				[ActionTokenType.GREATER_EQUAL]: '>=',
				[ActionTokenType.LESS_EQUAL]: '<=',
				[ActionTokenType.REGEX_MATCH]: '~',
				[ActionTokenType.EXCLAMATION]: '!',
			};
			if (operatorMap[t.type]) {
				return operatorMap[t.type];
			}
			return String(t.value);
		}).join(' ');
	}

	/**
	 * Get current token
	 */
	private current(): ActionToken {
		return this.tokens[this.position];
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
	private expect(type: ActionTokenType, message: string): void {
		const token = this.current();
		if (token.type !== type) {
			throw new ActionParserError(message, token);
		}
		this.advance();
	}

	/**
	 * Expect an identifier and return its value
	 */
	private expectIdentifier(message: string): string {
		const token = this.current();
		if (token.type !== ActionTokenType.IDENTIFIER) {
			throw new ActionParserError(message, token);
		}
		const value = String(token.value);
		this.advance();
		return value;
	}

	/**
	 * Expect a number and return its value
	 */
	private expectNumber(message: string): number {
		const token = this.current();
		if (token.type !== ActionTokenType.NUMBER) {
			throw new ActionParserError(message, token);
		}
		const value = token.value as number;
		this.advance();
		return value;
	}
}
