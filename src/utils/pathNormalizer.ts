/**
 * Cross-platform path normalization utilities
 * Based on requirements Section 15.4 and 14.3
 *
 * Ensures consistent path handling across Windows, Mac, and Linux
 */

import { normalizePath as obsidianNormalizePath } from 'obsidian';

/**
 * Normalize a file path to use forward slashes
 * Handles Windows backslashes and ensures consistent format
 *
 * @param path - Path to normalize
 * @returns Normalized path with forward slashes
 *
 * @example
 * normalizePath("folder\\subfolder\\file.md") // => "folder/subfolder/file.md"
 * normalizePath("folder/subfolder/file.md")   // => "folder/subfolder/file.md"
 */
export function normalizePath(path: string): string {
	if (!path) return '';
	// Use Obsidian's built-in normalization
	return obsidianNormalizePath(path);
}

/**
 * Join path segments into a single normalized path
 *
 * @param parts - Path segments to join
 * @returns Joined and normalized path
 *
 * @example
 * joinPath("folder", "subfolder", "file.md") // => "folder/subfolder/file.md"
 * joinPath("folder/", "/subfolder")          // => "folder/subfolder"
 */
export function joinPath(...parts: string[]): string {
	if (parts.length === 0) return '';

	// Remove empty parts and trim slashes
	const cleaned = parts
		.filter(part => part && part.length > 0)
		.map(part => part.replace(/^\/+|\/+$/g, ''));

	const joined = cleaned.join('/');
	return normalizePath(joined);
}

/**
 * Get the parent folder of a file path
 *
 * @param path - File path
 * @returns Parent folder path, or empty string if at root
 *
 * @example
 * getParentFolder("folder/subfolder/file.md") // => "folder/subfolder"
 * getParentFolder("file.md")                  // => ""
 */
export function getParentFolder(path: string): string {
	if (!path) return '';

	const normalized = normalizePath(path);
	const lastSlash = normalized.lastIndexOf('/');

	if (lastSlash === -1) {
		return ''; // File is at root
	}

	return normalized.substring(0, lastSlash);
}

/**
 * Check if a path is valid (not empty, no invalid characters)
 *
 * @param path - Path to validate
 * @returns True if path is valid
 *
 * @example
 * isValidPath("folder/file.md") // => true
 * isValidPath("")               // => false
 * isValidPath("folder/<>file")  // => false (invalid characters)
 */
export function isValidPath(path: string): boolean {
	if (!path || path.trim().length === 0) {
		return false;
	}

	// Check for invalid characters (Windows restrictions apply to all platforms for consistency)
	const invalidChars = /[<>:"|?*\x00-\x1f]/;
	if (invalidChars.test(path)) {
		return false;
	}

	// Check for invalid path segments
	const segments = path.split('/');
	for (const segment of segments) {
		// Empty segments (except for first/last which might be slashes)
		if (segment === '.' || segment === '..') {
			return false;
		}
	}

	return true;
}

/**
 * Get the file name from a path (without folder)
 *
 * @param path - File path
 * @returns File name
 *
 * @example
 * getFileName("folder/subfolder/file.md") // => "file.md"
 * getFileName("file.md")                  // => "file.md"
 */
export function getFileName(path: string): string {
	if (!path) return '';

	const normalized = normalizePath(path);
	const lastSlash = normalized.lastIndexOf('/');

	if (lastSlash === -1) {
		return normalized; // No folder, just filename
	}

	return normalized.substring(lastSlash + 1);
}

/**
 * Get the file extension from a path
 *
 * @param path - File path
 * @returns File extension (including dot), or empty string if no extension
 *
 * @example
 * getExtension("file.md")    // => ".md"
 * getExtension("file")       // => ""
 * getExtension("file.tar.gz") // => ".gz"
 */
export function getExtension(path: string): string {
	const fileName = getFileName(path);
	const lastDot = fileName.lastIndexOf('.');

	if (lastDot === -1 || lastDot === 0) {
		return ''; // No extension or hidden file
	}

	return fileName.substring(lastDot);
}
