/**
 * Saved Rules Workflow Integration Tests
 * Tests the complete user workflow: Create → Save → Load → Execute
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
	loadPluginData,
	savePluginData,
	saveRule,
	deleteRule,
	createNewRule,
	generateRuleId,
	updateLastRun
} from '../../src/storage/ruleStorage';
import { executeRule } from '../../src/core/ruleEngine';
import { Rule } from '../../src/types';

// Mock Plugin for testing
class MockPlugin {
	private storage: any = null;

	async loadData() {
		return this.storage;
	}

	async saveData(data: any) {
		this.storage = data;
	}
}

describe('Saved Rules Workflow', () => {
	let mockPlugin: MockPlugin;

	beforeEach(() => {
		mockPlugin = new MockPlugin();
	});

	describe('Rule creation and storage', () => {
		it('should create a new rule with defaults', () => {
			const rule = createNewRule();

			expect(rule.id).toBeDefined();
			expect(rule.id).toMatch(/^rule-/);
			expect(rule.name).toBe('New Rule');
			expect(rule.condition).toBe('');
			expect(rule.action).toBe('');
			expect(rule.scope.type).toBe('vault');
			expect(rule.options.backup).toBe(true);
			expect(rule.created).toBeDefined();
		});

		it('should generate unique rule IDs', () => {
			const id1 = generateRuleId();
			const id2 = generateRuleId();

			expect(id1).not.toBe(id2);
			expect(id1).toMatch(/^rule-\d+-[a-z0-9]+$/);
		});
	});

	describe('Save and load workflow', () => {
		it('should save and load a rule', async () => {
			const rule: Rule = {
				id: generateRuleId(),
				name: 'Mark drafts as reviewed',
				condition: 'status = "draft"',
				action: 'SET status "reviewed"',
				scope: { type: 'vault' },
				options: { backup: true },
				created: new Date().toISOString(),
			};

			// Save rule
			await saveRule(mockPlugin as any, rule);

			// Load and verify
			const data = await loadPluginData(mockPlugin as any);
			expect(data.rules).toHaveLength(1);
			expect(data.rules[0]).toMatchObject({
				id: rule.id,
				name: rule.name,
				condition: rule.condition,
				action: rule.action,
			});
		});

		it('should save multiple rules', async () => {
			const rule1: Rule = {
				...createNewRule(),
				name: 'Rule 1',
				action: 'SET test "value1"',
			};

			const rule2: Rule = {
				...createNewRule(),
				name: 'Rule 2',
				action: 'SET test "value2"',
			};

			await saveRule(mockPlugin as any, rule1);
			await saveRule(mockPlugin as any, rule2);

			const data = await loadPluginData(mockPlugin as any);
			expect(data.rules).toHaveLength(2);
			expect(data.rules.map(r => r.name)).toEqual(['Rule 1', 'Rule 2']);
		});

		it('should update existing rule', async () => {
			const rule: Rule = {
				...createNewRule(),
				name: 'Original Name',
				action: 'SET test "original"',
			};

			// Save initial
			await saveRule(mockPlugin as any, rule);

			// Update
			rule.name = 'Updated Name';
			rule.action = 'SET test "updated"';
			await saveRule(mockPlugin as any, rule);

			// Verify update
			const data = await loadPluginData(mockPlugin as any);
			expect(data.rules).toHaveLength(1);
			expect(data.rules[0].name).toBe('Updated Name');
			expect(data.rules[0].action).toBe('SET test "updated"');
		});

		it('should delete a rule', async () => {
			const rule1 = { ...createNewRule(), name: 'Rule 1' };
			const rule2 = { ...createNewRule(), name: 'Rule 2' };

			await saveRule(mockPlugin as any, rule1);
			await saveRule(mockPlugin as any, rule2);

			// Delete rule1
			await deleteRule(mockPlugin as any, rule1.id);

			// Verify only rule2 remains
			const data = await loadPluginData(mockPlugin as any);
			expect(data.rules).toHaveLength(1);
			expect(data.rules[0].id).toBe(rule2.id);
		});

		it('should update lastUsed timestamp', async () => {
			const rule = { ...createNewRule(), name: 'Test Rule' };
			await saveRule(mockPlugin as any, rule);

			// Initially no lastUsed
			let data = await loadPluginData(mockPlugin as any);
			expect(data.rules[0].lastUsed).toBeUndefined();

			// Update lastUsed
			await updateLastRun(mockPlugin as any, rule.id);

			// Verify lastUsed is set
			data = await loadPluginData(mockPlugin as any);
			expect(data.rules[0].lastUsed).toBeDefined();
			expect(data.lastRun).toBeDefined();
		});
	});

	describe('Complete workflow: Save → Load → Execute', () => {
		it('should execute a saved rule: SET operation', async () => {
			// Step 1: Create and save rule
			const rule: Rule = {
				...createNewRule(),
				name: 'Set status to published',
				condition: 'status = "draft"',
				action: 'SET status "published"',
			};

			await saveRule(mockPlugin as any, rule);

			// Step 2: Load rules
			const data = await loadPluginData(mockPlugin as any);
			const loadedRule = data.rules[0];

			expect(loadedRule).toBeDefined();
			expect(loadedRule.name).toBe(rule.name);

			// Step 3: Verify rule would execute correctly (simulate)
			const testData = { title: 'Note', status: 'draft' };

			// Parse and evaluate condition
			const { parseCondition } = await import('../../src/parser/conditionParser');
			const { evaluateCondition } = await import('../../src/evaluator/conditionEvaluator');
			const conditionAST = parseCondition(loadedRule.condition);
			const matches = evaluateCondition(conditionAST, testData);
			expect(matches).toBe(true);

			// Parse and execute action
			const { parseAction } = await import('../../src/parser/actionParser');
			const { executeSet } = await import('../../src/actions/basicActions');
			const actionAST = parseAction(loadedRule.action);
			const result = executeSet(testData, actionAST.path, actionAST.value);

			expect(result.success).toBe(true);
			expect(testData.status).toBe('published');
		});

		it('should execute saved rule: Array operation with condition', async () => {
			const rule: Rule = {
				...createNewRule(),
				name: 'Update Brave New World mantras',
				condition: 'ANY countsLog WHERE mantra = "Brave New World"',
				action: 'UPDATE_WHERE countsLog WHERE mantra="Brave New World" SET unit "Meditations", verified true',
			};

			await saveRule(mockPlugin as any, rule);

			const data = await loadPluginData(mockPlugin as any);
			const loadedRule = data.rules[0];

			// Test data
			const testData = {
				countsLog: [
					{ mantra: 'Great Gatsby', unit: 'Meditations' },
					{ mantra: 'Brave New World', unit: 'Solitude' },
				]
			};

			// Evaluate condition
			const { parseCondition } = await import('../../src/parser/conditionParser');
			const { evaluateCondition } = await import('../../src/evaluator/conditionEvaluator');
			const conditionAST = parseCondition(loadedRule.condition);
			expect(evaluateCondition(conditionAST, testData)).toBe(true);

			// Execute action
			const { parseAction } = await import('../../src/parser/actionParser');
			const { executeUpdateWhere } = await import('../../src/actions/arrayActions');
			const actionAST = parseAction(loadedRule.action);
			const result = executeUpdateWhere(
				testData,
				actionAST.path,
				actionAST.condition,
				actionAST.updates
			);

			expect(result.success).toBe(true);
			expect(testData.countsLog[1].unit).toBe('Meditations');
			expect(testData.countsLog[1].verified).toBe(true);
		});

		it('should execute saved rule: SORT_BY operation', async () => {
			const rule: Rule = {
				...createNewRule(),
				name: 'Sort countsLog alphabetically',
				condition: 'countsLog exists',
				action: 'SORT_BY countsLog BY mantra ASC',
			};

			await saveRule(mockPlugin as any, rule);
			const data = await loadPluginData(mockPlugin as any);
			const loadedRule = data.rules[0];

			const testData = {
				countsLog: [
					{ mantra: 'Great Gatsby', count: 3 },
					{ mantra: 'Brave New World', count: 1 },
					{ mantra: 'Animal Farm', count: 2 }
				]
			};

			// Execute
			const { parseCondition } = await import('../../src/parser/conditionParser');
			const { evaluateCondition } = await import('../../src/evaluator/conditionEvaluator');
			const { parseAction } = await import('../../src/parser/actionParser');
			const { executeSortBy } = await import('../../src/actions/arrayActions');

			const conditionAST = parseCondition(loadedRule.condition);
			expect(evaluateCondition(conditionAST, testData)).toBe(true);

			const actionAST = parseAction(loadedRule.action);
			const result = executeSortBy(testData, actionAST.path, actionAST.field, actionAST.order);

			expect(result.success).toBe(true);
			expect(testData.countsLog[0].mantra).toBe('Animal Farm');
			expect(testData.countsLog[1].mantra).toBe('Brave New World');
			expect(testData.countsLog[2].mantra).toBe('Great Gatsby');
		});

		it('should handle multiple saved rules independently', async () => {
			const rule1: Rule = {
				...createNewRule(),
				name: 'Add urgent tag',
				condition: 'priority > 5',
				action: 'APPEND tags "urgent"',
			};

			const rule2: Rule = {
				...createNewRule(),
				name: 'Mark as reviewed',
				condition: 'status = "draft"',
				action: 'SET status "reviewed"',
			};

			await saveRule(mockPlugin as any, rule1);
			await saveRule(mockPlugin as any, rule2);

			const data = await loadPluginData(mockPlugin as any);
			expect(data.rules).toHaveLength(2);

			// Execute rule 1
			const testData1 = { tags: ['work'], priority: 8 };
			const { parseCondition } = await import('../../src/parser/conditionParser');
			const { evaluateCondition } = await import('../../src/evaluator/conditionEvaluator');
			const { parseAction } = await import('../../src/parser/actionParser');
			const { executeAppend } = await import('../../src/actions/arrayActions');

			const cond1 = parseCondition(data.rules[0].condition);
			expect(evaluateCondition(cond1, testData1)).toBe(true);
			const act1 = parseAction(data.rules[0].action);
			executeAppend(testData1, act1.path, act1.value);
			expect(testData1.tags).toContain('urgent');

			// Execute rule 2
			const testData2 = { status: 'draft' };
			const { executeSet } = await import('../../src/actions/basicActions');

			const cond2 = parseCondition(data.rules[1].condition);
			expect(evaluateCondition(cond2, testData2)).toBe(true);
			const act2 = parseAction(data.rules[1].action);
			executeSet(testData2, act2.path, act2.value);
			expect(testData2.status).toBe('reviewed');
		});
	});

	describe('Rule persistence and validation', () => {
		it('should persist rules across load/save cycles', async () => {
			const rule = {
				...createNewRule(),
				name: 'Persistent Rule',
				action: 'SET test "value"',
			};

			// Save
			await saveRule(mockPlugin as any, rule);

			// Load
			let data = await loadPluginData(mockPlugin as any);
			expect(data.rules[0].name).toBe('Persistent Rule');

			// Modify and save again
			data.rules[0].name = 'Modified Name';
			await savePluginData(mockPlugin as any, data);

			// Load again and verify
			data = await loadPluginData(mockPlugin as any);
			expect(data.rules[0].name).toBe('Modified Name');
		});

		it('should handle empty storage on first load', async () => {
			const data = await loadPluginData(mockPlugin as any);

			expect(data).toBeDefined();
			expect(data.version).toBe('1.0');
			expect(data.rules).toEqual([]);
			expect(data.settings).toBeDefined();
		});

		it('should validate and filter invalid rules', async () => {
			// Manually set corrupted data
			await mockPlugin.saveData({
				version: '1.0',
				rules: [
					{ id: 'valid-1', name: 'Valid Rule', condition: '', action: 'SET test "value"', scope: { type: 'vault' }, options: { backup: true }, created: '2025-11-20' },
					{ id: 'invalid', name: 'Missing fields' }, // Invalid - missing required fields
					{ id: 'valid-2', name: 'Another Valid', condition: '', action: 'DELETE test', scope: { type: 'vault' }, options: { backup: false }, created: '2025-11-20' },
				],
				settings: {},
			});

			const data = await loadPluginData(mockPlugin as any);

			// Should only load valid rules
			expect(data.rules).toHaveLength(2);
			expect(data.rules[0].id).toBe('valid-1');
			expect(data.rules[1].id).toBe('valid-2');
		});
	});

	describe('Examples from requirements - saved rules flow', () => {
		it('Example 1.1.1: SET status "published" - via saved rule', async () => {
			const rule: Rule = {
				...createNewRule(),
				name: 'Publish drafts',
				condition: '',
				action: 'SET status "published"',
			};

			await saveRule(mockPlugin as any, rule);
			const data = await loadPluginData(mockPlugin as any);
			const savedRule = data.rules[0];

			// Execute on test data
			const { parseAction } = await import('../../src/parser/actionParser');
			const { executeSet } = await import('../../src/actions/basicActions');

			const testData = { title: 'My Note' };
			const actionAST = parseAction(savedRule.action);
			const result = executeSet(testData, actionAST.path, actionAST.value);

			expect(result.success).toBe(true);
			expect(testData.status).toBe('published');
		});

		it('Example 3.1.1: APPEND tags - via saved rule with condition', async () => {
			const rule: Rule = {
				...createNewRule(),
				name: 'Add urgent tag to high priority',
				condition: 'priority > 5',
				action: 'APPEND tags "urgent"',
			};

			await saveRule(mockPlugin as any, rule);
			const data = await loadPluginData(mockPlugin as any);
			const savedRule = data.rules[0];

			// Test with matching condition
			const { parseCondition } = await import('../../src/parser/conditionParser');
			const { evaluateCondition } = await import('../../src/evaluator/conditionEvaluator');
			const { parseAction } = await import('../../src/parser/actionParser');
			const { executeAppend } = await import('../../src/actions/arrayActions');

			const testData = { tags: ['work'], priority: 8 };

			const conditionAST = parseCondition(savedRule.condition);
			const matches = evaluateCondition(conditionAST, testData);
			expect(matches).toBe(true);

			const actionAST = parseAction(savedRule.action);
			const result = executeAppend(testData, actionAST.path, actionAST.value);

			expect(result.success).toBe(true);
			expect(testData.tags).toEqual(['work', 'urgent']);
		});

		it('Example: UPDATE_WHERE countsLog - via saved rule', async () => {
			const rule: Rule = {
				...createNewRule(),
				name: 'Update Brave New World entries',
				condition: 'ANY countsLog WHERE mantra = "Brave New World"',
				action: 'UPDATE_WHERE countsLog WHERE mantra="Brave New World" SET unit "Meditations", verified true',
			};

			await saveRule(mockPlugin as any, rule);
			const data = await loadPluginData(mockPlugin as any);
			const savedRule = data.rules[0];

			const testData = {
				countsLog: [
					{ mantra: 'Great Gatsby', unit: 'Meditations' },
					{ mantra: 'Brave New World', unit: 'Solitude', verified: false },
				]
			};

			// Evaluate condition
			const { parseCondition } = await import('../../src/parser/conditionParser');
			const { evaluateCondition } = await import('../../src/evaluator/conditionEvaluator');
			const conditionAST = parseCondition(savedRule.condition);
			expect(evaluateCondition(conditionAST, testData)).toBe(true);

			// Execute action
			const { parseAction } = await import('../../src/parser/actionParser');
			const { executeUpdateWhere } = await import('../../src/actions/arrayActions');
			const actionAST = parseAction(savedRule.action);
			const result = executeUpdateWhere(
				testData,
				actionAST.path,
				actionAST.condition,
				actionAST.updates
			);

			expect(result.success).toBe(true);
			expect(testData.countsLog[1].unit).toBe('Meditations');
			expect(testData.countsLog[1].verified).toBe(true);
		});

		it('Example: SORT_BY - via saved rule', async () => {
			const rule: Rule = {
				...createNewRule(),
				name: 'Sort mantras alphabetically',
				condition: 'countsLog.length > 0',
				action: 'SORT_BY countsLog BY mantra ASC',
			};

			await saveRule(mockPlugin as any, rule);
			const data = await loadPluginData(mockPlugin as any);
			const savedRule = data.rules[0];

			const testData = {
				countsLog: [
					{ mantra: 'Great Gatsby', count: 3 },
					{ mantra: 'Brave New World', count: 1 },
					{ mantra: 'Animal Farm', count: 2 }
				]
			};

			const { parseCondition } = await import('../../src/parser/conditionParser');
			const { evaluateCondition } = await import('../../src/evaluator/conditionEvaluator');
			const { parseAction } = await import('../../src/parser/actionParser');
			const { executeSortBy } = await import('../../src/actions/arrayActions');

			const conditionAST = parseCondition(savedRule.condition);
			expect(evaluateCondition(conditionAST, testData)).toBe(true);

			const actionAST = parseAction(savedRule.action);
			const result = executeSortBy(testData, actionAST.path, actionAST.field, actionAST.order);

			expect(result.success).toBe(true);
			expect(testData.countsLog.map(c => c.mantra)).toEqual(['Animal Farm', 'Brave New World', 'Great Gatsby']);
		});

		it('Example: MOVE_WHERE - via saved rule', async () => {
			const rule: Rule = {
				...createNewRule(),
				name: 'Move Brave New World to start',
				condition: '',
				action: 'MOVE_WHERE countsLog WHERE mantra="Brave New World" TO START',
			};

			await saveRule(mockPlugin as any, rule);
			const data = await loadPluginData(mockPlugin as any);
			const savedRule = data.rules[0];

			const testData = {
				countsLog: [
					{ mantra: 'Great Gatsby', count: 3 },
					{ mantra: 'Beloved', count: 6 },
					{ mantra: 'Brave New World', count: 1 }
				]
			};

			const { parseAction } = await import('../../src/parser/actionParser');
			const { executeMoveWhere } = await import('../../src/actions/arrayActions');

			const actionAST = parseAction(savedRule.action);
			const result = executeMoveWhere(
				testData,
				actionAST.path,
				actionAST.condition,
				actionAST.target
			);

			expect(result.success).toBe(true);
			expect(testData.countsLog[0].mantra).toBe('Brave New World');
		});
	});
});
