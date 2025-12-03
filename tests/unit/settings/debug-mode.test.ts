/**
 * Tests for Debug Mode functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import YamlManipulatorPlugin from '../../../src/main';

describe('Debug Mode', () => {
	let consoleLogSpy: any;

	beforeEach(() => {
		consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
	});

	it('should log when debug mode is enabled', () => {
		const plugin = new YamlManipulatorPlugin({} as any, {} as any);
		plugin.data = {
			version: '1.0.0',
			rules: [],
			settings: {
				defaultBackup: true,
				scanTimeout: 30000,
				debug: true, // Debug enabled
			},
		};

		plugin.debugLog('Test message', 123);

		expect(consoleLogSpy).toHaveBeenCalledWith('[YAML Manipulator]', 'Test message', 123);
	});

	it('should NOT log when debug mode is disabled', () => {
		const plugin = new YamlManipulatorPlugin({} as any, {} as any);
		plugin.data = {
			version: '1.0.0',
			rules: [],
			settings: {
				defaultBackup: true,
				maxFilesPerBatch: 100,
				scanTimeout: 30000,
				debug: false, // Debug disabled
			},
		};

		plugin.debugLog('Test message', 123);

		expect(consoleLogSpy).not.toHaveBeenCalled();
	});

	it('should handle missing plugin data gracefully', () => {
		const plugin = new YamlManipulatorPlugin({} as any, {} as any);
		// plugin.data is undefined

		plugin.debugLog('Test message');

		expect(consoleLogSpy).not.toHaveBeenCalled();
	});
});
