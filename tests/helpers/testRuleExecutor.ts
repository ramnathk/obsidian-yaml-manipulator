/**
 * Test helper to execute rules on plain data objects
 * Used by generated tests from examples.md
 *
 * This is a simplified version of ruleEngine.ts that works without Obsidian App instance
 */

import { parseCondition } from '../../src/parser/conditionParser';
import { parseAction } from '../../src/parser/actionParser';
import { evaluateCondition } from '../../src/evaluator/conditionEvaluator';
import { resolveTestTemplates } from './testTemplateEngine';
import { ActionAST } from '../../src/types';
import { executeSet, executeAdd, executeDelete, executeRename } from '../../src/actions/basicActions';
import {
	executeAppend,
	executePrepend,
	executeInsertAt,
	executeInsertAfter,
	executeInsertBefore,
	executeRemove,
	executeRemoveAll,
	executeRemoveAt,
	executeReplace,
	executeReplaceAll,
	executeDeduplicate,
	executeSort,
	executeSortBy,
	executeMove,
	executeMoveWhere,
	executeUpdateWhere,
} from '../../src/actions/arrayActions';
import { executeMerge, executeMergeOverwrite } from '../../src/actions/objectActions';

export interface TestRule {
	condition?: string;
	action: string;
}

export interface TestRuleResult {
	status: 'success' | 'skipped' | 'error' | 'warning';
	modified: boolean;
	newData: any;
	changes: string[];
	error?: string;
	warning?: string;
}

/**
 * Compare two values with lenient type checking for common edge cases
 * Handles: "1.0" == 1.0, "true" == true, etc.
 */
export function lenientDeepEqual(actual: any, expected: any): boolean {
	// Exact match
	if (actual === expected) return true;

	// Both null/undefined
	if (actual == null && expected == null) return true;
	if (actual == null || expected == null) return false;

	// Type mismatch but value equivalence (string vs number)
	if (typeof actual !== typeof expected) {
		// Try converting to same type
		if (typeof actual === 'string' && typeof expected === 'number') {
			const num = parseFloat(actual);
			if (!isNaN(num) && num === expected) return true;
		}
		if (typeof actual === 'number' && typeof expected === 'string') {
			const num = parseFloat(expected);
			if (!isNaN(num) && num === actual) return true;
		}
		// Boolean string comparisons
		if (typeof actual === 'string' && typeof expected === 'boolean') {
			if ((actual === 'true' && expected === true) || (actual === 'false' && expected === false)) return true;
		}
		if (typeof actual === 'boolean' && typeof expected === 'string') {
			if ((actual === true && expected === 'true') || (actual === false && expected === 'false')) return true;
		}
		return false;
	}

	// Arrays
	if (Array.isArray(actual) && Array.isArray(expected)) {
		if (actual.length !== expected.length) return false;
		return actual.every((item, idx) => lenientDeepEqual(item, expected[idx]));
	}

	// Objects
	if (typeof actual === 'object' && typeof expected === 'object') {
		const actualKeys = Object.keys(actual).sort();
		const expectedKeys = Object.keys(expected).sort();
		if (actualKeys.length !== expectedKeys.length) return false;
		if (actualKeys.some((key, idx) => key !== expectedKeys[idx])) return false;
		return actualKeys.every(key => lenientDeepEqual(actual[key], expected[key]));
	}

	// Primitives
	return actual === expected;
}

/**
 * Execute a rule on plain data object for testing
 */
export function executeTestRule(rule: TestRule, inputData: any): TestRuleResult {
	try {
		// Deep clone input to avoid mutations
		const data = JSON.parse(JSON.stringify(inputData));
		const originalData = JSON.parse(JSON.stringify(inputData));

		// Evaluate condition (if present)
		if (rule.condition && rule.condition.trim() !== '(none)' && rule.condition.trim().length > 0) {
			const conditionAST = parseCondition(rule.condition);
			const matches = evaluateCondition(conditionAST, data);

			if (!matches) {
				return {
					status: 'skipped',
					modified: false,
					newData: data,
					changes: [],
				};
			}
		}

		// Resolve templates in action (for tests, use simple template resolution)
		const resolvedAction = resolveTestTemplates(rule.action, data);

		// Parse and execute action
		const actionAST = parseAction(resolvedAction);
		const actionResult = executeActionForTest(actionAST, data);

		if (!actionResult.success) {
			return {
				status: 'error',
				modified: false,
				newData: data,
				changes: actionResult.changes,
				error: actionResult.error,
			};
		}

		if (!actionResult.modified) {
			return {
				status: actionResult.warning ? 'warning' : 'skipped',
				modified: false,
				newData: data,
				changes: actionResult.changes,
				warning: actionResult.warning,
			};
		}

		return {
			status: actionResult.warning ? 'warning' : 'success',
			modified: true,
			newData: data,
			changes: actionResult.changes,
			warning: actionResult.warning,
		};
	} catch (error) {
		return {
			status: 'error',
			modified: false,
			newData: inputData,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

/**
 * Execute an action AST on data (test version)
 */
function executeActionForTest(ast: ActionAST, data: any): import('../../src/types').ActionResult {
	switch (ast.op) {
		case 'SET': {
			// Handle multi-field SET
			if (ast.fields && ast.fields.length > 1) {
				const changes: string[] = [];
				let allSuccess = true;

				for (const field of ast.fields) {
					const result = executeSet(data, field.path, field.value);
					if (result.success) {
						changes.push(...result.changes);
					} else {
						allSuccess = false;
						if (result.error) {
							return result; // Return first error
						}
					}
				}

				return {
					success: allSuccess,
					modified: allSuccess && changes.length > 0,
					changes,
				};
			}
			// Single field SET
			return executeSet(data, ast.path, ast.value);
		}
		case 'ADD':
			return executeAdd(data, ast.path, ast.value);
		case 'DELETE':
			return executeDelete(data, ast.path);
		case 'RENAME':
			return executeRename(data, ast.oldPath, ast.newPath);
		case 'APPEND':
			return executeAppend(data, ast.path, ast.value);
		case 'PREPEND':
			return executePrepend(data, ast.path, ast.value);
		case 'INSERT_AT':
			return executeInsertAt(data, ast.path, ast.value, ast.index);
		case 'INSERT_AFTER':
			return executeInsertAfter(data, ast.path, ast.value, ast.target);
		case 'INSERT_BEFORE':
			return executeInsertBefore(data, ast.path, ast.value, ast.target);
		case 'REMOVE':
			return executeRemove(data, ast.path, ast.value);
		case 'REMOVE_ALL':
			return executeRemoveAll(data, ast.path, ast.value);
		case 'REMOVE_AT':
			return executeRemoveAt(data, ast.path, ast.index);
		case 'REPLACE':
			return executeReplace(data, ast.path, ast.oldValue, ast.newValue);
		case 'REPLACE_ALL':
			return executeReplaceAll(data, ast.path, ast.oldValue, ast.newValue);
		case 'DEDUPLICATE':
			return executeDeduplicate(data, ast.path);
		case 'SORT':
			return executeSort(data, ast.path, ast.order);
		case 'SORT_BY':
			return executeSortBy(data, ast.path, ast.field, ast.order);
		case 'MOVE':
			return executeMove(data, ast.path, ast.fromIndex, ast.toIndex);
		case 'MOVE_WHERE':
			return executeMoveWhere(data, ast.path, ast.condition, ast.target);
		case 'UPDATE_WHERE':
			return executeUpdateWhere(data, ast.path, ast.condition, ast.updates);
		case 'MERGE':
			return executeMerge(data, ast.path, ast.value);
		case 'MERGE_OVERWRITE':
			return executeMergeOverwrite(data, ast.path, ast.value);
		default:
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Unknown operation: ${(ast as any).op}`,
			};
	}
}
