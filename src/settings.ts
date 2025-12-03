/**
 * Plugin settings and defaults
 * Based on requirements Section 12 (Plugin Settings)
 */

import { YamlManipulatorSettings } from './types';

/**
 * Default plugin settings
 */
export const DEFAULT_SETTINGS: YamlManipulatorSettings = {
	/** Create backups by default (safe default) */
	defaultBackup: true,

	/** Timeout for vault scanning in milliseconds
	 * Prevents infinite loops or very slow operations
	 * 30 seconds should be enough for most vaults
	 */
	scanTimeout: 30000,

	/** Show debug information in console
	 * Useful for troubleshooting but disabled by default
	 */
	debug: false,
};
