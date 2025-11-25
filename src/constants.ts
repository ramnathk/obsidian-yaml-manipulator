/**
 * Application constants and limits
 * Centralized configuration for security, performance, and robustness
 */

/**
 * Security and performance limits
 */
export const LIMITS = {
	/** Maximum regex pattern length to prevent ReDoS attacks */
	MAX_REGEX_LENGTH: 200,

	/** Regex execution timeout in milliseconds */
	REGEX_TIMEOUT_MS: 500,

	/** Maximum path depth for nested object access */
	MAX_PATH_DEPTH: 50,

	/** Maximum path length in characters */
	MAX_PATH_LENGTH: 500,

	/** Maximum files per batch (default setting) */
	MAX_FILES_PER_BATCH: 1000,

	/** Maximum files per batch (upper limit for user settings) */
	MAX_FILES_PER_BATCH_UPPER: 10000,

	/** Scan timeout in milliseconds */
	SCAN_TIMEOUT_MS: 30000,

	/** Display value truncation length */
	DISPLAY_VALUE_MAX_LENGTH: 50,

	/** Batch processing throttle interval in milliseconds */
	BATCH_THROTTLE_MS: 10,

	/** Files processed before yielding to UI thread */
	BATCH_YIELD_INTERVAL: 5,
} as const;

/**
 * Dangerous regex patterns that could cause ReDoS
 * These patterns involve exponential backtracking
 */
export const DANGEROUS_REGEX_PATTERNS = [
	/(\+\*|\*\+)/,           // Nested quantifiers: +*, *+
	/\{[0-9]+,\}/,           // Open-ended repetition: {n,}
	/(\.\*){2,}/,            // Multiple .* patterns
	/(\+{2,}|\*{2,})/,       // Repeated quantifiers: ++, **
] as const;

/**
 * Dangerous object keys that could cause prototype pollution
 */
export const DANGEROUS_OBJECT_KEYS = [
	'__proto__',
	'constructor',
	'prototype',
] as const;
