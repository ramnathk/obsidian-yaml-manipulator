/**
 * Path resolution utilities for dot notation paths
 * Handles nested object access like "metadata.author" or "items[0].name"
 * Based on requirements Section 3.1
 */

/**
 * Resolve a path in an object and return the value
 *
 * @param data - Object to traverse
 * @param path - Dot notation path (e.g., "metadata.author" or "items[0]")
 * @returns Value at path, or undefined if path doesn't exist
 *
 * @example
 * const data = { metadata: { author: "John" } };
 * resolvePath(data, "metadata.author")  // => "John"
 * resolvePath(data, "metadata.version") // => undefined
 * resolvePath(data, "items[0].name")    // => value at items[0].name
 */
export function resolvePath(data: any, path: string): any {
	if (!data || !path) {
		return undefined;
	}

	const segments = parsePathSegments(path);
	let current = data;

	for (const segment of segments) {
		if (current === null || current === undefined) {
			return undefined;
		}

		if (segment.type === 'property') {
			if (segment.key === undefined) {
				return undefined;
			}
			current = current[segment.key];
		} else if (segment.type === 'index') {
			if (!Array.isArray(current)) {
				return undefined;
			}

			if (segment.index === undefined) {
				return undefined;
			}

			const index = segment.index;
			// Handle negative indices
			const actualIndex = index < 0 ? current.length + index : index;

			if (actualIndex < 0 || actualIndex >= current.length) {
				return undefined;
			}

			current = current[actualIndex];
		}
	}

	return current;
}

/**
 * Set a value at a path in an object
 * Creates parent objects if they don't exist
 *
 * @param data - Object to modify
 * @param path - Dot notation path
 * @param value - Value to set
 *
 * @example
 * const data = {};
 * setPath(data, "metadata.author", "John");
 * // data is now: { metadata: { author: "John" } }
 *
 * setPath(data, "metadata.version", "1.0");
 * // data is now: { metadata: { author: "John", version: "1.0" } }
 */
export function setPath(data: any, path: string, value: any): void {
	if (!data || !path) {
		return;
	}

	const segments = parsePathSegments(path);

	if (segments.length === 0) {
		return;
	}

	let current = data;

	// Traverse to parent of final segment
	for (let i = 0; i < segments.length - 1; i++) {
		const segment = segments[i];

		if (segment.type === 'property') {
			if (segment.key === undefined) {
				throw new Error(`Property key is undefined at segment ${i}`);
			}
			// Create parent object if missing
			if (!current[segment.key] || typeof current[segment.key] !== 'object') {
				// Check if next segment is an index (create array) or property (create object)
				const nextSegment = segments[i + 1];
				current[segment.key] = nextSegment.type === 'index' ? [] : {};
			}
			current = current[segment.key];
		} else if (segment.type === 'index') {
			if (!Array.isArray(current)) {
				throw new Error(`Cannot index into non-array at segment ${i}`);
			}

			if (segment.index === undefined) {
				throw new Error(`Array index is undefined at segment ${i}`);
			}

			const index = segment.index < 0 ? current.length + segment.index : segment.index;

			// Extend array if needed
			while (current.length <= index) {
				current.push(null);
			}

			// Create object/array at index if needed
			if (!current[index] || typeof current[index] !== 'object') {
				const nextSegment = segments[i + 1];
				current[index] = nextSegment.type === 'index' ? [] : {};
			}

			current = current[index];
		}
	}

	// Set the final value
	const finalSegment = segments[segments.length - 1];

	if (finalSegment.type === 'property') {
		if (finalSegment.key === undefined) {
			throw new Error('Property key is undefined in final segment');
		}
		current[finalSegment.key] = value;
	} else if (finalSegment.type === 'index') {
		if (!Array.isArray(current)) {
			throw new Error('Cannot set array index on non-array');
		}

		if (finalSegment.index === undefined) {
			throw new Error('Array index is undefined in final segment');
		}

		const index = finalSegment.index < 0 ? current.length + finalSegment.index : finalSegment.index;

		// Extend array if needed
		while (current.length <= index) {
			current.push(null);
		}

		current[index] = value;
	}
}

/**
 * Delete a value at a path in an object
 *
 * @param data - Object to modify
 * @param path - Dot notation path
 * @returns True if something was deleted, false if path didn't exist
 *
 * @example
 * const data = { metadata: { author: "John", version: "1.0" } };
 * deletePath(data, "metadata.version");  // Returns true
 * // data is now: { metadata: { author: "John" } }
 *
 * deletePath(data, "metadata.missing");  // Returns false
 */
export function deletePath(data: any, path: string): boolean {
	if (!data || !path) {
		return false;
	}

	const segments = parsePathSegments(path);

	if (segments.length === 0) {
		return false;
	}

	if (segments.length === 1) {
		// Top-level delete
		const segment = segments[0];
		if (segment.type === 'property' && segment.key !== undefined) {
			if (segment.key in data) {
				delete data[segment.key];
				return true;
			}
		}
		return false;
	}

	// Navigate to parent
	const parentPath = segments.slice(0, -1);
	let current = data;

	for (const segment of parentPath) {
		if (current === null || current === undefined) {
			return false;
		}

		if (segment.type === 'property') {
			if (segment.key === undefined) {
				return false;
			}
			current = current[segment.key];
		} else if (segment.type === 'index') {
			if (!Array.isArray(current)) {
				return false;
			}
			if (segment.index === undefined) {
				return false;
			}
			const index = segment.index < 0 ? current.length + segment.index : segment.index;
			current = current[index];
		}
	}

	// Delete from parent
	const finalSegment = segments[segments.length - 1];

	if (finalSegment.type === 'property') {
		if (current && finalSegment.key !== undefined && finalSegment.key in current) {
			delete current[finalSegment.key];
			return true;
		}
	} else if (finalSegment.type === 'index') {
		if (Array.isArray(current) && finalSegment.index !== undefined) {
			const index = finalSegment.index < 0 ? current.length + finalSegment.index : finalSegment.index;
			if (index >= 0 && index < current.length) {
				current.splice(index, 1);
				return true;
			}
		}
	}

	return false;
}

/**
 * Check if a path exists in an object
 *
 * @param data - Object to check
 * @param path - Dot notation path
 * @returns True if path exists
 *
 * @example
 * const data = { metadata: { author: "John" } };
 * pathExists(data, "metadata.author")  // => true
 * pathExists(data, "metadata.version") // => false
 */
export function pathExists(data: any, path: string): boolean {
	const value = resolvePath(data, path);
	return value !== undefined;
}

/**
 * Path segment types
 */
interface PathSegment {
	type: 'property' | 'index';
	key?: string;    // For property access
	index?: number;  // For array index access
}

/**
 * Parse a path string into segments
 *
 * @param path - Dot notation path (e.g., "metadata.author" or "items[0].name")
 * @returns Array of path segments
 *
 * @example
 * parsePathSegments("metadata.author")
 * // => [{ type: 'property', key: 'metadata' }, { type: 'property', key: 'author' }]
 *
 * parsePathSegments("items[0].name")
 * // => [{ type: 'property', key: 'items' }, { type: 'index', index: 0 }, { type: 'property', key: 'name' }]
 */
export function parsePathSegments(path: string): PathSegment[] {
	if (!path || path.trim().length === 0) {
		return [];
	}

	const segments: PathSegment[] = [];
	let current = '';
	let i = 0;

	while (i < path.length) {
		const char = path[i];

		if (char === '.') {
			// End of property segment
			if (current.length > 0) {
				segments.push({ type: 'property', key: current });
				current = '';
			}
			i++;
		} else if (char === '[') {
			// Start of index segment
			if (current.length > 0) {
				segments.push({ type: 'property', key: current });
				current = '';
			}

			// Find closing ]
			const closeIndex = path.indexOf(']', i);
			if (closeIndex === -1) {
				throw new Error(`Unclosed bracket in path: ${path}`);
			}

			const indexStr = path.substring(i + 1, closeIndex);
			const index = parseInt(indexStr, 10);

			if (isNaN(index)) {
				throw new Error(`Invalid array index: ${indexStr}`);
			}

			segments.push({ type: 'index', index });
			i = closeIndex + 1;
		} else {
			// Regular character
			current += char;
			i++;
		}
	}

	// Add final segment
	if (current.length > 0) {
		segments.push({ type: 'property', key: current });
	}

	return segments;
}
