/**
 * Value parsing utilities
 * Parses literal values from strings (strings, numbers, booleans, arrays, objects)
 * Based on requirements Section 3.2 and 5.1
 */

/**
 * Parse a value from a string, auto-detecting type
 *
 * @param input - String to parse
 * @returns Parsed value (string, number, boolean, array, object, or null)
 *
 * @example
 * parseValue('"hello"')      // => "hello"
 * parseValue('123')          // => 123
 * parseValue('true')         // => true
 * parseValue('["a", "b"]')   // => ["a", "b"]
 */
export function parseValue(input: string): any {
	if (!input || input.trim().length === 0) {
		return '';
	}

	const trimmed = input.trim();

	// Try parsing as null
	if (trimmed === 'null' || trimmed === 'NULL') {
		return null;
	}

	// Try parsing as boolean
	const boolValue = parseBoolean(trimmed);
	if (boolValue !== null) {
		return boolValue;
	}

	// Try parsing as number
	const numValue = parseNumber(trimmed);
	if (numValue !== null) {
		return numValue;
	}

	// Try parsing as array
	if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
		try {
			return parseArray(trimmed);
		} catch {
			// If array parsing fails, treat as string
		}
	}

	// Try parsing as object
	if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
		try {
			return parseObject(trimmed);
		} catch {
			// If object parsing fails, treat as string
		}
	}

	// Try parsing as quoted string
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return parseString(trimmed);
	}

	// Default: treat as unquoted string
	return trimmed;
}

/**
 * Parse a string value, handling quotes and escape sequences
 *
 * @param input - String to parse (should include quotes)
 * @returns Unquoted string with escape sequences processed
 *
 * @example
 * parseString('"hello"')           // => "hello"
 * parseString("'hello'")           // => "hello"
 * parseString('"He said \\"hi\\"') // => 'He said "hi"'
 * parseString('"Line 1\\nLine 2"') // => "Line 1\nLine 2"
 */
export function parseString(input: string): string {
	if (!input || input.length < 2) {
		return input;
	}

	const trimmed = input.trim();

	// Handle double quotes
	if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
		const content = trimmed.slice(1, -1);
		return processEscapeSequences(content);
	}

	// Handle single quotes
	if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
		const content = trimmed.slice(1, -1);
		return processEscapeSequences(content);
	}

	// No quotes, return as-is
	return trimmed;
}

/**
 * Process escape sequences in a string
 * Handles: \", \', \\, \n, \t, \r
 *
 * @param str - String with escape sequences
 * @returns String with escape sequences processed
 */
function processEscapeSequences(str: string): string {
	return str
		.replace(/\\"/g, '"')
		.replace(/\\'/g, "'")
		.replace(/\\\\/g, '\\')
		.replace(/\\n/g, '\n')
		.replace(/\\t/g, '\t')
		.replace(/\\r/g, '\r');
}

/**
 * Parse a number from string
 *
 * @param input - String to parse
 * @returns Number if valid, null otherwise
 *
 * @example
 * parseNumber('123')      // => 123
 * parseNumber('123.45')   // => 123.45
 * parseNumber('-42')      // => -42
 * parseNumber('not a num') // => null
 */
export function parseNumber(input: string): number | null {
	const trimmed = input.trim();

	// Check if it looks like a number
	if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
		return null;
	}

	const num = Number(trimmed);

	// Check if conversion was successful
	if (isNaN(num)) {
		return null;
	}

	return num;
}

/**
 * Parse a boolean from string
 *
 * @param input - String to parse
 * @returns Boolean if valid, null otherwise
 *
 * @example
 * parseBoolean('true')   // => true
 * parseBoolean('false')  // => false
 * parseBoolean('TRUE')   // => true (case-insensitive)
 * parseBoolean('yes')    // => null (not a JS boolean)
 */
export function parseBoolean(input: string): boolean | null {
	const trimmed = input.trim().toLowerCase();

	if (trimmed === 'true') {
		return true;
	}

	if (trimmed === 'false') {
		return false;
	}

	return null;
}

/**
 * Parse an array from JSON string
 *
 * @param input - JSON array string
 * @returns Parsed array
 * @throws Error if JSON is malformed
 *
 * @example
 * parseArray('["a", "b", "c"]')         // => ["a", "b", "c"]
 * parseArray('[1, 2, 3]')               // => [1, 2, 3]
 * parseArray('[true, false]')           // => [true, false]
 * parseArray('["nested", ["array"]]')   // => ["nested", ["array"]]
 */
export function parseArray(input: string): any[] {
	try {
		const parsed = JSON.parse(input);

		if (!Array.isArray(parsed)) {
			throw new Error('Not an array');
		}

		return parsed;
	} catch (error) {
		throw new Error(`Failed to parse array: ${input}`);
	}
}

/**
 * Parse an object from JSON string
 *
 * @param input - JSON object string
 * @returns Parsed object
 * @throws Error if JSON is malformed
 *
 * @example
 * parseObject('{"key": "value"}')                    // => {key: "value"}
 * parseObject('{"count": 42, "active": true}')       // => {count: 42, active: true}
 * parseObject('{"nested": {"key": "value"}}')        // => {nested: {key: "value"}}
 */
export function parseObject(input: string): any {
	try {
		const parsed = JSON.parse(input);

		if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
			throw new Error('Not an object');
		}

		return parsed;
	} catch (error) {
		throw new Error(`Failed to parse object: ${input}`);
	}
}

/**
 * Check if a string needs quotes when serializing to YAML
 * Useful for generating action strings
 *
 * @param value - String value to check
 * @returns True if quotes are needed
 *
 * @example
 * needsQuotes("hello")           // => false
 * needsQuotes("hello world")     // => false (spaces OK without quotes in YAML)
 * needsQuotes("Key: value")      // => true (contains colon)
 * needsQuotes("[[wikilink]]")    // => true (contains brackets)
 */
export function needsQuotes(value: string): boolean {
	// Check for special characters that require quoting
	const specialChars = /[:\[\]{}#@!|>&%*]/;
	if (specialChars.test(value)) {
		return true;
	}

	// Check if value looks like a boolean or number
	if (
		value === 'true' ||
		value === 'false' ||
		value === 'null' ||
		/^-?\d+(\.\d+)?$/.test(value)
	) {
		return true;
	}

	// Check for leading/trailing whitespace
	if (value !== value.trim()) {
		return true;
	}

	return false;
}
