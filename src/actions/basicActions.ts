/**
 * Basic actions: SET, ADD, DELETE, RENAME
 * Based on requirements Section 4.1
 *
 * For iterations 1-3, we focus on SET operation
 * Other operations will be expanded in later iterations
 */

import { ActionResult } from '../types';
import { setPath, deletePath, pathExists, resolvePath } from '../parser/pathResolver';

/**
 * SET - Set a field value (creates or overwrites)
 *
 * Behavior:
 * - Creates the field if it doesn't exist
 * - Overwrites the field if it exists
 * - Creates parent objects if needed
 * - Always succeeds
 *
 * @param data - Frontmatter data object to modify
 * @param path - Dot notation path to field
 * @param value - Value to set
 * @returns ActionResult with success/modified/changes
 *
 * @example
 * const data = { title: "My Note" };
 * executeSet(data, "status", "published");
 * // data is now: { title: "My Note", status: "published" }
 * // Returns: { success: true, modified: true, changes: ["SET status: published"] }
 *
 * @example
 * const data = { status: "draft" };
 * executeSet(data, "status", "published");
 * // data is now: { status: "published" }
 * // Returns: { success: true, modified: true, changes: ["SET status: draft → published"] }
 */
export function executeSet(
	data: any,
	path: string,
	value: any
): ActionResult {
	try {
		// Check if field exists (to track if we're creating or updating)
		const exists = pathExists(data, path);
		const oldValue = exists ? resolvePath(data, path) : undefined;

		// Set the value (creates parents if needed)
		setPath(data, path, value);

		// Format change message
		const valueStr = formatValue(value);
		let changeMessage: string;

		if (exists) {
			const oldValueStr = formatValue(oldValue);
			changeMessage = `SET ${path}: ${oldValueStr} → ${valueStr}`;
		} else {
			changeMessage = `SET ${path}: ${valueStr}`;
		}

		return {
			success: true,
			modified: true,
			changes: [changeMessage],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in SET operation',
		};
	}
}

/**
 * ADD - Add a field only if it doesn't exist (safe add)
 *
 * Behavior:
 * - Creates the field if it doesn't exist
 * - Does NOT overwrite if field exists (returns warning)
 * - Creates parent objects if needed
 *
 * @param data - Frontmatter data object to modify
 * @param path - Dot notation path to field
 * @param value - Value to add
 * @returns ActionResult with success/modified/changes/warning
 *
 * @example
 * const data = { title: "My Note" };
 * executeAdd(data, "status", "draft");
 * // data is now: { title: "My Note", status: "draft" }
 * // Returns: { success: true, modified: true, changes: ["ADD status: draft"] }
 *
 * @example
 * const data = { title: "My Note", status: "published" };
 * executeAdd(data, "status", "draft");
 * // data unchanged: { title: "My Note", status: "published" }
 * // Returns: { success: true, modified: false, changes: [], warning: "Field 'status' already exists" }
 */
export function executeAdd(
	data: any,
	path: string,
	value: any
): ActionResult {
	try {
		// Check if field already exists
		if (pathExists(data, path)) {
			return {
				success: true,
				modified: false,
				changes: [],
				warning: `Field '${path}' already exists`,
			};
		}

		// Field doesn't exist, add it
		setPath(data, path, value);

		const valueStr = formatValue(value);

		return {
			success: true,
			modified: true,
			changes: [`ADD ${path}: ${valueStr}`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in ADD operation',
		};
	}
}

/**
 * DELETE - Remove a field
 *
 * Behavior:
 * - Deletes the field if it exists
 * - Silent success if field doesn't exist (no warning/error)
 *
 * @param data - Frontmatter data object to modify
 * @param path - Dot notation path to field
 * @returns ActionResult with success/modified/changes
 *
 * @example
 * const data = { title: "My Note", draft: true, status: "pending" };
 * executeDelete(data, "draft");
 * // data is now: { title: "My Note", status: "pending" }
 * // Returns: { success: true, modified: true, changes: ["DELETE draft"] }
 *
 * @example
 * const data = { title: "My Note" };
 * executeDelete(data, "status");
 * // data unchanged: { title: "My Note" }
 * // Returns: { success: true, modified: false, changes: [] }
 */
export function executeDelete(
	data: any,
	path: string
): ActionResult {
	try {
		// Attempt to delete
		const deleted = deletePath(data, path);

		if (deleted) {
			return {
				success: true,
				modified: true,
				changes: [`DELETE ${path}`],
			};
		} else {
			// Field didn't exist, silent success
			return {
				success: true,
				modified: false,
				changes: [],
			};
		}
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in DELETE operation',
		};
	}
}

/**
 * RENAME - Rename a field
 *
 * Behavior:
 * - Copies value from old path to new path
 * - Deletes old path
 * - Overwrites new path if it exists
 * - Silent if old path doesn't exist
 *
 * @param data - Frontmatter data object to modify
 * @param oldPath - Current field path
 * @param newPath - New field path
 * @returns ActionResult with success/modified/changes
 *
 * @example
 * const data = { oldName: "value", status: "active" };
 * executeRename(data, "oldName", "newName");
 * // data is now: { newName: "value", status: "active" }
 * // Returns: { success: true, modified: true, changes: ["RENAME oldName → newName"] }
 */
export function executeRename(
	data: any,
	oldPath: string,
	newPath: string
): ActionResult {
	try {
		// Check if source exists
		if (!pathExists(data, oldPath)) {
			// Source doesn't exist, silent success
			return {
				success: true,
				modified: false,
				changes: [],
			};
		}

		// Get old value
		const value = resolvePath(data, oldPath);

		// Set new value
		setPath(data, newPath, value);

		// Delete old path
		deletePath(data, oldPath);

		return {
			success: true,
			modified: true,
			changes: [`RENAME ${oldPath} → ${newPath}`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in RENAME operation',
		};
	}
}

/**
 * Format a value for display in change messages
 * Limits length and handles various types
 *
 * @param value - Value to format
 * @returns Formatted string representation
 */
function formatValue(value: any): string {
	if (value === null) {
		return 'null';
	}

	if (value === undefined) {
		return 'undefined';
	}

	if (typeof value === 'string') {
		// Truncate long strings
		if (value.length > 50) {
			return `"${value.substring(0, 47)}..."`;
		}
		return `"${value}"`;
	}

	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}

	if (Array.isArray(value)) {
		return `[${value.length} items]`;
	}

	if (typeof value === 'object') {
		const keys = Object.keys(value);
		return `{${keys.length} fields}`;
	}

	return String(value);
}
