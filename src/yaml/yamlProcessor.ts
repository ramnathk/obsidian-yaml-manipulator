/**
 * YAML frontmatter processing using gray-matter
 * Based on requirements Section 13.8
 *
 * Handles reading/writing frontmatter while preserving content and field order
 */

import matter from 'gray-matter';
import { App, TFile } from 'obsidian';
import { FrontmatterData } from '../types';

/**
 * Read YAML frontmatter from a file
 *
 * @param app - Obsidian App instance
 * @param file - File to read
 * @returns Parsed frontmatter data and content
 * @throws Error if file cannot be read or YAML is malformed
 *
 * @example
 * const { data, content } = await readFrontmatter(app, file);
 * console.log(data.title);  // Access frontmatter fields
 * console.log(content);     // Access body content
 */
export async function readFrontmatter(
	app: App,
	file: TFile
): Promise<FrontmatterData> {
	try {
		// Read file content
		const fileContent = await app.vault.read(file);

		// Parse with gray-matter
		const parsed = matter(fileContent, {
			// Preserve field order (Section 13.8.1)
			engines: {
				yaml: {
					parse: (str: string) => {
						// Use default YAML parser
						const yaml = require('js-yaml');
						return yaml.load(str, { schema: yaml.DEFAULT_SCHEMA });
					},
				},
			},
		});

		return {
			data: parsed.data || {},
			content: parsed.content || '',
		};
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(
				`Failed to read frontmatter from ${file.path}: ${error.message}`
			);
		}
		throw error;
	}
}

/**
 * Write YAML frontmatter to a file
 *
 * @param app - Obsidian App instance
 * @param file - File to write
 * @param data - Frontmatter data object
 * @param content - Body content
 * @throws Error if file cannot be written
 *
 * @example
 * const data = { title: "My Note", status: "published" };
 * const content = "Note body content";
 * await writeFrontmatter(app, file, data, content);
 */
export async function writeFrontmatter(
	app: App,
	file: TFile,
	data: any,
	content: string
): Promise<void> {
	try {
		// Generate file content with frontmatter
		const fileContent = matter.stringify(content, data);

		// Write to file
		await app.vault.modify(file, fileContent);
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(
				`Failed to write frontmatter to ${file.path}: ${error.message}`
			);
		}
		throw error;
	}
}

/**
 * Check if file content has frontmatter
 *
 * @param fileContent - Raw file content
 * @returns True if file has frontmatter
 *
 * @example
 * const content = await app.vault.read(file);
 * if (hasFrontmatter(content)) {
 *   // Process frontmatter
 * }
 */
export function hasFrontmatter(fileContent: string): boolean {
	if (!fileContent || fileContent.length === 0) {
		return false;
	}

	// Frontmatter must start with ---
	if (!fileContent.startsWith('---')) {
		return false;
	}

	// Must have closing ---
	const contentAfterFirst = fileContent.substring(3);
	const closingIndex = contentAfterFirst.indexOf('---');

	return closingIndex !== -1;
}

/**
 * Create frontmatter string from data and content
 * Useful for creating new files with frontmatter
 *
 * @param data - Frontmatter data object
 * @param content - Body content
 * @returns Complete file content with frontmatter
 *
 * @example
 * const data = { title: "New Note", created: "2025-11-20" };
 * const content = "This is the note body";
 * const fileContent = createFrontmatter(data, content);
 * // Returns:
 * // ---
 * // title: New Note
 * // created: 2025-11-20
 * // ---
 * // This is the note body
 */
export function createFrontmatter(data: any, content: string): string {
	return matter.stringify(content, data);
}

/**
 * Parse YAML string to object
 * Used for testing and manual parsing
 *
 * @param yamlString - YAML string to parse
 * @returns Parsed object
 * @throws Error if YAML is malformed
 *
 * @example
 * const yaml = "title: My Note\nstatus: draft";
 * const data = parseYamlString(yaml);
 * // Returns: { title: "My Note", status: "draft" }
 */
export function parseYamlString(yamlString: string): any {
	try {
		const parsed = matter(`---\n${yamlString}\n---\n`);
		return parsed.data;
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Malformed YAML: ${error.message}`);
		}
		throw error;
	}
}

/**
 * Convert object to YAML string
 * Used for testing and manual serialization
 *
 * @param data - Object to convert
 * @returns YAML string (without delimiters)
 *
 * @example
 * const data = { title: "My Note", tags: ["work", "urgent"] };
 * const yaml = objectToYamlString(data);
 * // Returns: "title: My Note\ntags:\n  - work\n  - urgent\n"
 */
export function objectToYamlString(data: any): string {
	const full = matter.stringify('', data);
	// Remove delimiters and trailing newlines
	return full.replace(/^---\n/, '').replace(/\n---\n$/, '');
}
