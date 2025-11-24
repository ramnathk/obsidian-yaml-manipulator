/**
 * Tests for Rule Storage
 * Covers validation edge cases and data corruption handling
 */

import { describe, it, expect, vi } from 'vitest';
import {
	loadPluginData,
	savePluginData,
	saveRule,
	deleteRule,
	updateLastRun,
	generateRuleId,
	createNewRule,
} from '../../../src/storage/ruleStorage';
import { Rule } from '../../../src/types';
import { DEFAULT_SETTINGS } from '../../../src/settings';

// Mock Plugin
class MockPlugin {
	private data: any = null;

	async loadData() {
		return this.data;
	}

	async saveData(data: any) {
		this.data = data;
	}

	setMockData(data: any) {
		this.data = data;
	}
}

describe('Rule Storage', () => {
	describe('loadPluginData', () => {
		it('should return defaults on first load', async () => {
			const plugin = new MockPlugin();

			const result = await loadPluginData(plugin as any);

			expect(result.version).toBe('1.0');
			expect(result.rules).toEqual([]);
			expect(result.settings).toEqual(DEFAULT_SETTINGS);
		});

		it('should load existing data', async () => {
			const plugin = new MockPlugin();
			const existingData = {
				version: '1.0',
				rules: [
					{
						id: 'rule-1',
						name: 'Test Rule',
						condition: '',
						action: 'SET test true',
						scope: { type: 'vault' },
						options: { backup: false },
						created: '2025-11-20',
					},
				],
				settings: DEFAULT_SETTINGS,
			};
			plugin.setMockData(existingData);

			const result = await loadPluginData(plugin as any);

			expect(result.rules).toHaveLength(1);
			expect(result.rules[0].id).toBe('rule-1');
		});

		it('should handle corrupted data (null object)', async () => {
			const plugin = new MockPlugin();
			plugin.setMockData(null);

			const result = await loadPluginData(plugin as any);

			expect(result.version).toBe('1.0');
			expect(result.rules).toEqual([]);
		});

		it('should handle corrupted data (non-object)', async () => {
			const plugin = new MockPlugin();
			plugin.setMockData('corrupted string data');

			const result = await loadPluginData(plugin as any);

			expect(result.version).toBe('1.0');
			expect(result.rules).toEqual([]);
		});

		it('should filter out invalid rules', async () => {
			const plugin = new MockPlugin();
			const dataWithInvalidRules = {
				version: '1.0',
				rules: [
					// Valid rule
					{
						id: 'rule-1',
						name: 'Valid Rule',
						condition: '',
						action: 'SET test true',
						scope: { type: 'vault' },
						options: { backup: false },
						created: '2025-11-20',
					},
					// Invalid: missing id
					{
						name: 'Invalid Rule',
						condition: '',
						action: 'SET test true',
						scope: { type: 'vault' },
						options: { backup: false },
						created: '2025-11-20',
					},
					// Invalid: null
					null,
					// Invalid: wrong type
					'not a rule',
				],
				settings: DEFAULT_SETTINGS,
			};
			plugin.setMockData(dataWithInvalidRules);

			const result = await loadPluginData(plugin as any);

			expect(result.rules).toHaveLength(1);
			expect(result.rules[0].id).toBe('rule-1');
		});

		it('should reject rules with invalid scope type', async () => {
			const plugin = new MockPlugin();
			const dataWithInvalidScope = {
				version: '1.0',
				rules: [
					{
						id: 'rule-1',
						name: 'Invalid Scope',
						condition: '',
						action: 'SET test true',
						scope: { type: 'invalid-type' }, // Invalid scope type
						options: { backup: false },
						created: '2025-11-20',
					},
				],
				settings: DEFAULT_SETTINGS,
			};
			plugin.setMockData(dataWithInvalidScope);

			const result = await loadPluginData(plugin as any);

			expect(result.rules).toHaveLength(0);
		});
	});

	describe('saveRule', () => {
		it('should add new rule', async () => {
			const plugin = new MockPlugin();
			const rule: Rule = {
				id: 'new-rule',
				name: 'New Rule',
				condition: '',
				action: 'SET test true',
				scope: { type: 'vault' },
				options: { backup: false },
				created: '2025-11-20',
			};

			await saveRule(plugin as any, rule);

			const data = await loadPluginData(plugin as any);
			expect(data.rules).toHaveLength(1);
			expect(data.rules[0].id).toBe('new-rule');
		});

		it('should update existing rule', async () => {
			const plugin = new MockPlugin();
			const initialRule: Rule = {
				id: 'rule-1',
				name: 'Original Name',
				condition: '',
				action: 'SET test true',
				scope: { type: 'vault' },
				options: { backup: false },
				created: '2025-11-20',
			};

			await saveRule(plugin as any, initialRule);

			// Update the rule
			const updatedRule = { ...initialRule, name: 'Updated Name' };
			await saveRule(plugin as any, updatedRule);

			const data = await loadPluginData(plugin as any);
			expect(data.rules).toHaveLength(1);
			expect(data.rules[0].name).toBe('Updated Name');
		});
	});

	describe('deleteRule', () => {
		it('should delete rule by id', async () => {
			const plugin = new MockPlugin();
			const rule: Rule = {
				id: 'rule-to-delete',
				name: 'Delete Me',
				condition: '',
				action: 'SET test true',
				scope: { type: 'vault' },
				options: { backup: false },
				created: '2025-11-20',
			};

			await saveRule(plugin as any, rule);
			await deleteRule(plugin as any, 'rule-to-delete');

			const data = await loadPluginData(plugin as any);
			expect(data.rules).toHaveLength(0);
		});
	});

	describe('updateLastRun', () => {
		it('should update rule lastUsed timestamp', async () => {
			const plugin = new MockPlugin();
			const rule: Rule = {
				id: 'rule-1',
				name: 'Test Rule',
				condition: '',
				action: 'SET test true',
				scope: { type: 'vault' },
				options: { backup: false },
				created: '2025-11-20',
			};

			await saveRule(plugin as any, rule);
			await updateLastRun(plugin as any, 'rule-1');

			const data = await loadPluginData(plugin as any);
			expect(data.rules[0].lastUsed).toBeDefined();
			expect(data.lastRun).toBeDefined();
		});

		it('should handle non-existent rule', async () => {
			const plugin = new MockPlugin();

			// Should not throw error
			await updateLastRun(plugin as any, 'non-existent');

			const data = await loadPluginData(plugin as any);
			expect(data.rules).toHaveLength(0);
		});
	});

	describe('generateRuleId', () => {
		it('should generate unique IDs', () => {
			const id1 = generateRuleId();
			const id2 = generateRuleId();

			expect(id1).toMatch(/^rule-\d+-[a-z0-9]+$/);
			expect(id2).toMatch(/^rule-\d+-[a-z0-9]+$/);
			expect(id1).not.toBe(id2);
		});
	});

	describe('createNewRule', () => {
		it('should create rule with defaults', () => {
			const rule = createNewRule();

			expect(rule.id).toMatch(/^rule-\d+-[a-z0-9]+$/);
			expect(rule.name).toBe('New Rule');
			expect(rule.condition).toBe('');
			expect(rule.action).toBe('');
			expect(rule.scope).toEqual({ type: 'vault' });
			expect(rule.options).toEqual({ backup: true });
			expect(rule.created).toBeDefined();
		});
	});
});
