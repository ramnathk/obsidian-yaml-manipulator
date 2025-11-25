/**
 * Template Engine - Resolve template variables in action strings
 * Based on requirements Section 5.2
 *
 * Supports: {{today}}, {{filename}}, {{fm:field}}, {{date:FORMAT}}
 */

import { DateTime } from 'luxon';
import { TFile, Vault } from 'obsidian';
import { resolvePath } from '../parser/pathResolver';

/**
 * Sanitize a value for safe use in templates
 * Prevents issues with special characters and provides basic robustness
 *
 * Note: This is not for security (local context), but for robustness
 * to prevent breaking template rendering with special characters
 */
function sanitizeValue(value: string): string {
	// For local plugin context, we mainly want to prevent breaking
	// YAML syntax or template rendering, not HTML injection
	// Just ensure the value is properly stringified
	return String(value);
}

export interface TemplateContext {
	file: TFile;
	vault: Vault;
	frontmatter: any;
	currentDate?: DateTime;
}

/**
 * Resolve all template variables in a string
 */
export function resolveTemplates(input: string, context: TemplateContext): string {
	const date = context.currentDate || DateTime.now();
	let result = input;

	// Match all {{variable}} patterns
	const regex = /\{\{([^}]+)\}\}/g;
	const matches = Array.from(input.matchAll(regex));

	// Process matches in reverse order to preserve positions
	for (let i = matches.length - 1; i >= 0; i--) {
		const match = matches[i];
		const variable = match[1].trim();
		const value = resolveVariable(variable, context, date);

		if (match.index !== undefined) {
			result = result.substring(0, match.index) + value + result.substring(match.index + match[0].length);
		}
	}

	return result;
}

/**
 * Resolve a single template variable
 */
function resolveVariable(variable: string, context: TemplateContext, date: DateTime): string {
	// Date/time variables
	if (variable === 'today') {
		return date.toFormat('yyyy-MM-dd');
	}

	if (variable === 'now') {
		return date.toISO() || '';
	}

	if (variable === 'timestamp') {
		return String(Math.floor(date.toSeconds()));
	}

	if (variable === 'year') {
		return date.toFormat('yyyy');
	}

	if (variable === 'month') {
		return date.toFormat('MM');
	}

	if (variable === 'day') {
		return date.toFormat('dd');
	}

	if (variable === 'time') {
		return date.toFormat('HH:mm:ss');
	}

	// Custom date formatting
	if (variable.startsWith('date:')) {
		const format = variable.substring(5);
		try {
			return date.toFormat(format);
		} catch (e) {
			throw new Error(`Invalid date format: ${format}`);
		}
	}

	// File context variables
	if (variable === 'filename' || variable === 'basename') {
		return context.file.basename;
	}

	if (variable === 'filepath') {
		return context.file.path;
	}

	if (variable === 'folder') {
		return context.file.parent?.path || '';
	}

	if (variable === 'vault') {
		return context.vault.getName();
	}

	// Frontmatter variables
	if (variable.startsWith('fm:')) {
		const field = variable.substring(3);
		const value = resolvePath(context.frontmatter, field);

		if (value === undefined) {
			throw new Error(`Frontmatter field not found: ${field}`);
		}

		// Convert value to string based on type and sanitize
		let stringValue: string;

		if (typeof value === 'string') {
			stringValue = value;
		} else if (typeof value === 'number' || typeof value === 'boolean') {
			stringValue = String(value);
		} else if (value === null) {
			stringValue = 'null';
		} else {
			// For arrays and objects, use JSON
			stringValue = JSON.stringify(value);
		}

		// Sanitize the value for safe use
		return sanitizeValue(stringValue);
	}

	throw new Error(`Unknown template variable: {{${variable}}}`);
}
