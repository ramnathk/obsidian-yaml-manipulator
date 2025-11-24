/**
 * Object Actions - Execute object operations on YAML data
 * Based on requirements Section 4.3
 *
 * Implements MERGE (deep) and MERGE_OVERWRITE (shallow) operations
 */

import { ActionResult } from '../types';
import { resolvePath, setPath } from '../parser/pathResolver';

/**
 * MERGE - Deep merge objects
 * Objects are recursively merged, arrays are replaced
 */
export function executeMerge(data: any, path: string, value: object): ActionResult {
	try {
		const existing = resolvePath(data, path);

		// Create object if doesn't exist
		if (existing === undefined) {
			setPath(data, path, value);
			return {
				success: true,
				modified: true,
				changes: [`MERGE ${path}: created object with ${Object.keys(value).length} field(s)`],
			};
		}

		// Error if not an object
		if (typeof existing !== 'object' || existing === null || Array.isArray(existing)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an object`,
			};
		}

		// Perform deep merge
		const beforeKeys = Object.keys(existing).length;
		deepMerge(existing, value);
		const afterKeys = Object.keys(existing).length;
		const addedKeys = afterKeys - beforeKeys;

		return {
			success: true,
			modified: true,
			changes: [`MERGE ${path}: merged ${Object.keys(value).length} field(s), added ${addedKeys} new field(s)`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in MERGE',
		};
	}
}

/**
 * MERGE_OVERWRITE - Shallow merge objects
 * All fields from source replace target fields (no recursion)
 */
export function executeMergeOverwrite(data: any, path: string, value: object): ActionResult {
	try {
		const existing = resolvePath(data, path);

		// Create object if doesn't exist
		if (existing === undefined) {
			setPath(data, path, value);
			return {
				success: true,
				modified: true,
				changes: [`MERGE_OVERWRITE ${path}: created object with ${Object.keys(value).length} field(s)`],
			};
		}

		// Error if not an object
		if (typeof existing !== 'object' || existing === null || Array.isArray(existing)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an object`,
			};
		}

		// Shallow merge (Object.assign)
		const beforeKeys = Object.keys(existing).length;
		Object.assign(existing, value);
		const afterKeys = Object.keys(existing).length;
		const addedKeys = afterKeys - beforeKeys;

		return {
			success: true,
			modified: true,
			changes: [`MERGE_OVERWRITE ${path}: merged ${Object.keys(value).length} field(s), added ${addedKeys} new field(s)`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in MERGE_OVERWRITE',
		};
	}
}

/**
 * Deep merge helper - recursively merge objects
 * Arrays are replaced, not merged
 */
function deepMerge(target: any, source: any): void {
	for (const key in source) {
		if (!source.hasOwnProperty(key)) {
			continue;
		}

		const sourceValue = source[key];
		const targetValue = target[key];

		// If source value is an object (but not array or null) and target has same
		if (
			typeof sourceValue === 'object' &&
			sourceValue !== null &&
			!Array.isArray(sourceValue) &&
			typeof targetValue === 'object' &&
			targetValue !== null &&
			!Array.isArray(targetValue)
		) {
			// Recursively merge
			deepMerge(targetValue, sourceValue);
		} else {
			// Replace (for arrays, primitives, or mismatched types)
			target[key] = sourceValue;
		}
	}
}
