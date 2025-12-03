/**
 * Array Actions - Execute array operations on YAML data
 * Based on requirements Section 4.2
 *
 * Implements all 17 array operations including complex ones like UPDATE_WHERE and MOVE_WHERE
 */

import { ActionResult } from '../types';
import { resolvePath, setPath, pathExists } from '../parser/pathResolver';
import { evaluateCondition } from '../evaluator/conditionEvaluator';
import { ConditionAST, MoveRelativeTarget } from '../types';

/**
 * APPEND - Add to end of array
 */
export function executeAppend(data: any, path: string, value: any): ActionResult {
	try {
		const array = resolvePath(data, path);

		// Create array if doesn't exist
		if (array === undefined) {
			setPath(data, path, [value]);
			return {
				success: true,
				modified: true,
				changes: [`APPEND ${path}: created array with value`],
			};
		}

		// Error if not an array
		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		array.push(value);

		return {
			success: true,
			modified: true,
			changes: [`APPEND ${path}: added value`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in APPEND',
		};
	}
}

/**
 * PREPEND - Add to beginning of array
 */
export function executePrepend(data: any, path: string, value: any): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (array === undefined) {
			setPath(data, path, [value]);
			return {
				success: true,
				modified: true,
				changes: [`PREPEND ${path}: created array with value`],
			};
		}

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		array.unshift(value);

		return {
			success: true,
			modified: true,
			changes: [`PREPEND ${path}: added value to beginning`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in PREPEND',
		};
	}
}

/**
 * INSERT_AT - Insert at specific index
 */
export function executeInsertAt(data: any, path: string, value: any, index: number): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (array === undefined) {
			setPath(data, path, [value]);
			return {
				success: true,
				modified: true,
				changes: [`INSERT_AT ${path}: created array with value`],
			};
		}

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		// Handle negative indices
		const actualIndex = index < 0 ? Math.max(0, array.length + index) : Math.min(index, array.length);

		array.splice(actualIndex, 0, value);

		return {
			success: true,
			modified: true,
			changes: [`INSERT_AT ${path}[${index}]: inserted value`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in INSERT_AT',
		};
	}
}

/**
 * INSERT_AFTER - Insert after first occurrence of target
 */
export function executeInsertAfter(data: any, path: string, value: any, target: any): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		const targetIndex = array.findIndex(item => JSON.stringify(item) === JSON.stringify(target));

		if (targetIndex === -1) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: 'Target value not found',
			};
		}

		array.splice(targetIndex + 1, 0, value);

		return {
			success: true,
			modified: true,
			changes: [`INSERT_AFTER ${path}: inserted value after target`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in INSERT_AFTER',
		};
	}
}

/**
 * INSERT_BEFORE - Insert before first occurrence of target
 */
export function executeInsertBefore(data: any, path: string, value: any, target: any): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		const targetIndex = array.findIndex(item => JSON.stringify(item) === JSON.stringify(target));

		if (targetIndex === -1) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: 'Target value not found',
			};
		}

		array.splice(targetIndex, 0, value);

		return {
			success: true,
			modified: true,
			changes: [`INSERT_BEFORE ${path}: inserted value before target`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in INSERT_BEFORE',
		};
	}
}

/**
 * REMOVE - Remove first occurrence of value
 */
export function executeRemove(data: any, path: string, value: any): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		const index = array.findIndex(item => JSON.stringify(item) === JSON.stringify(value));

		if (index === -1) {
			return {
				success: true,
				modified: false,
				changes: [],
				warning: 'Value not found',
			};
		}

		array.splice(index, 1);

		return {
			success: true,
			modified: true,
			changes: [`REMOVE ${path}: removed value`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in REMOVE',
		};
	}
}

/**
 * REMOVE_ALL - Remove all occurrences of value
 */
export function executeRemoveAll(data: any, path: string, value: any): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		const originalLength = array.length;
		const valueStr = JSON.stringify(value);

		// Filter out all matching values
		const filtered = array.filter(item => JSON.stringify(item) !== valueStr);

		if (filtered.length === originalLength) {
			return {
				success: true,
				modified: false,
				changes: [],
				warning: 'Value not found',
			};
		}

		// Replace array contents
		array.length = 0;
		array.push(...filtered);

		const removedCount = originalLength - filtered.length;

		return {
			success: true,
			modified: true,
			changes: [`REMOVE_ALL ${path}: removed ${removedCount} occurrence(s)`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in REMOVE_ALL',
		};
	}
}

/**
 * REMOVE_AT - Remove item at index
 */
export function executeRemoveAt(data: any, path: string, index: number): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		// Handle negative indices
		const actualIndex = index < 0 ? array.length + index : index;

		if (actualIndex < 0 || actualIndex >= array.length) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: 'Index out of bounds',
			};
		}

		array.splice(actualIndex, 1);

		return {
			success: true,
			modified: true,
			changes: [`REMOVE_AT ${path}[${index}]: removed item`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in REMOVE_AT',
		};
	}
}

/**
 * REPLACE - Replace first occurrence
 */
export function executeReplace(data: any, path: string, oldValue: any, newValue: any): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		const index = array.findIndex(item => JSON.stringify(item) === JSON.stringify(oldValue));

		if (index === -1) {
			return {
				success: true,
				modified: false,
				changes: [],
				warning: 'Value not found',
			};
		}

		array[index] = newValue;

		return {
			success: true,
			modified: true,
			changes: [`REPLACE ${path}: replaced value`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in REPLACE',
		};
	}
}

/**
 * REPLACE_ALL - Replace all occurrences
 */
export function executeReplaceAll(data: any, path: string, oldValue: any, newValue: any): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		const oldValueStr = JSON.stringify(oldValue);
		let replacedCount = 0;

		for (let i = 0; i < array.length; i++) {
			if (JSON.stringify(array[i]) === oldValueStr) {
				array[i] = newValue;
				replacedCount++;
			}
		}

		if (replacedCount === 0) {
			return {
				success: true,
				modified: false,
				changes: [],
				warning: 'Value not found',
			};
		}

		return {
			success: true,
			modified: true,
			changes: [`REPLACE_ALL ${path}: replaced ${replacedCount} occurrence(s)`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in REPLACE_ALL',
		};
	}
}

/**
 * DEDUPLICATE - Remove duplicate values
 */
export function executeDeduplicate(data: any, path: string): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		const originalLength = array.length;
		const seen = new Set<string>();
		const unique: any[] = [];

		for (const item of array) {
			const itemStr = JSON.stringify(item);
			if (!seen.has(itemStr)) {
				seen.add(itemStr);
				unique.push(item);
			}
		}

		if (unique.length === originalLength) {
			return {
				success: true,
				modified: false,
				changes: [],
				warning: 'No duplicates found',
			};
		}

		// Replace array contents
		array.length = 0;
		array.push(...unique);

		const removedCount = originalLength - unique.length;

		return {
			success: true,
			modified: true,
			changes: [`DEDUPLICATE ${path}: removed ${removedCount} duplicate(s)`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in DEDUPLICATE',
		};
	}
}

/**
 * SORT - Sort simple array
 */
export function executeSort(data: any, path: string, order: 'ASC' | 'DESC'): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		array.sort((a, b) => {
			if (typeof a === 'string' && typeof b === 'string') {
				return order === 'ASC' ? a.localeCompare(b) : b.localeCompare(a);
			}
			if (typeof a === 'number' && typeof b === 'number') {
				return order === 'ASC' ? a - b : b - a;
			}
			// Mixed types: convert to string
			return order === 'ASC'
				? String(a).localeCompare(String(b))
				: String(b).localeCompare(String(a));
		});

		return {
			success: true,
			modified: true,
			changes: [`SORT ${path}: sorted ${order}`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in SORT',
		};
	}
}

/**
 * SORT_BY - Sort array of objects by field
 */
export function executeSortBy(data: any, path: string, field: string, order: 'ASC' | 'DESC'): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		array.sort((a, b) => {
			const aVal = a[field];
			const bVal = b[field];

			if (typeof aVal === 'string' && typeof bVal === 'string') {
				return order === 'ASC' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
			}
			if (typeof aVal === 'number' && typeof bVal === 'number') {
				return order === 'ASC' ? aVal - bVal : bVal - aVal;
			}
			// Mixed or undefined: convert to string
			return order === 'ASC'
				? String(aVal).localeCompare(String(bVal))
				: String(bVal).localeCompare(String(aVal));
		});

		return {
			success: true,
			modified: true,
			changes: [`SORT_BY ${path} BY ${field}: sorted ${order}`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in SORT_BY',
		};
	}
}

/**
 * MOVE - Move item from one index to another
 */
export function executeMove(data: any, path: string, fromIndex: number, toIndex: number): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		// Handle negative indices
		const actualFrom = fromIndex < 0 ? array.length + fromIndex : fromIndex;
		const actualTo = toIndex < 0 ? array.length + toIndex : toIndex;

		if (actualFrom < 0 || actualFrom >= array.length) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: 'From index out of bounds',
			};
		}

		if (actualTo < 0 || actualTo >= array.length) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: 'To index out of bounds',
			};
		}

		// Remove item from fromIndex
		const [item] = array.splice(actualFrom, 1);
		// Insert at toIndex
		array.splice(actualTo, 0, item);

		return {
			success: true,
			modified: true,
			changes: [`MOVE ${path}: moved item from ${fromIndex} to ${toIndex}`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in MOVE',
		};
	}
}

/**
 * MOVE_WHERE - Move items matching condition
 */
export function executeMoveWhere(
	data: any,
	path: string,
	condition: ConditionAST,
	target: 'START' | 'END' | MoveRelativeTarget
): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		// For relative positioning, find reference first (before removing items)
		let refIndex = -1;
		if (typeof target === 'object' && 'reference' in target) {
			refIndex = array.findIndex(item => evaluateCondition(target.reference, item));
			if (refIndex === -1) {
				return {
					success: false,
					modified: false,
					changes: [],
					error: 'Target condition matched no items',
				};
			}
		}

		// Find items matching condition (excluding reference if it matches)
		const matchingIndices: number[] = [];
		for (let i = 0; i < array.length; i++) {
			// Skip the reference item itself
			if (i === refIndex) continue;

			if (evaluateCondition(condition, array[i])) {
				matchingIndices.push(i);
			}
		}

		if (matchingIndices.length === 0) {
			return {
				success: true,
				modified: false,
				changes: [],
				warning: 'No items matched WHERE condition',
			};
		}

		// Extract matching items (in reverse order to preserve indices)
		const matchingItems = matchingIndices.reverse().map(i => array.splice(i, 1)[0]).reverse();

		// Adjust refIndex after removals (items before it were removed)
		if (refIndex !== -1) {
			const removedBefore = matchingIndices.filter(idx => idx < refIndex).length;
			refIndex -= removedBefore;
		}

		// Determine target position
		if (target === 'START') {
			array.unshift(...matchingItems);
		} else if (target === 'END') {
			array.push(...matchingItems);
		} else {
			// Relative positioning (AFTER/BEFORE)
			const insertIndex = target.position === 'AFTER' ? refIndex + 1 : refIndex;
			array.splice(insertIndex, 0, ...matchingItems);
		}

		return {
			success: true,
			modified: true,
			changes: [`MOVE_WHERE ${path}: moved ${matchingItems.length} item(s)`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in MOVE_WHERE',
		};
	}
}

/**
 * UPDATE_WHERE - Update fields in items matching condition
 */
export function executeUpdateWhere(
	data: any,
	path: string,
	condition: ConditionAST,
	updates: Array<{ field: string; value: any }>
): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		let updatedCount = 0;

		for (const item of array) {
			if (evaluateCondition(condition, item)) {
				for (const update of updates) {
					item[update.field] = update.value;
				}
				updatedCount++;
			}
		}

		if (updatedCount === 0) {
			return {
				success: true,
				modified: false,
				changes: [],
				warning: 'No items matched condition',
			};
		}

		const fieldNames = updates.map(u => u.field).join(', ');

		return {
			success: true,
			modified: true,
			changes: [`UPDATE_WHERE ${path}: updated ${updatedCount} item(s) (${fieldNames})`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in UPDATE_WHERE',
		};
	}
}
