/**
 * Rule Storage - Save/load/manage rules
 * Based on requirements Section 7
 *
 * Handles rule persistence with validation and corruption detection
 */

import { Plugin } from 'obsidian';
import { PluginData, Rule, YamlToolkitSettings } from '../types';
import { DEFAULT_SETTINGS } from '../settings';

/**
 * Load plugin data (rules and settings)
 */
export async function loadPluginData(plugin: Plugin): Promise<PluginData> {
	const rawData = await plugin.loadData();

	if (!rawData) {
		// First time - return defaults
		return {
			version: '1.0',
			rules: [],
			settings: DEFAULT_SETTINGS,
		};
	}

	// Validate and migrate if needed
	return validateAndMigrate(rawData);
}

/**
 * Save plugin data
 */
export async function savePluginData(plugin: Plugin, data: PluginData): Promise<void> {
	await plugin.saveData(data);
}

/**
 * Save a single rule
 */
export async function saveRule(plugin: Plugin, rule: Rule): Promise<void> {
	const data = await loadPluginData(plugin);

	// Check if rule exists (update) or new (insert)
	const existingIndex = data.rules.findIndex(r => r.id === rule.id);

	if (existingIndex !== -1) {
		data.rules[existingIndex] = rule;
	} else {
		data.rules.push(rule);
	}

	await savePluginData(plugin, data);
}

/**
 * Delete a rule by ID
 */
export async function deleteRule(plugin: Plugin, ruleId: string): Promise<void> {
	const data = await loadPluginData(plugin);
	data.rules = data.rules.filter(r => r.id !== ruleId);
	await savePluginData(plugin, data);
}

/**
 * Update rule's lastUsed timestamp
 */
export async function updateLastRun(plugin: Plugin, ruleId: string): Promise<void> {
	const data = await loadPluginData(plugin);
	const rule = data.rules.find(r => r.id === ruleId);

	if (rule) {
		rule.lastUsed = new Date().toISOString();
		data.lastRun = new Date().toISOString();
		await savePluginData(plugin, data);
	}
}

/**
 * Generate unique rule ID
 */
export function generateRuleId(): string {
	return `rule-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create new rule with defaults
 * @param defaultBackup - Default backup setting (defaults to true if not provided)
 */
export function createNewRule(defaultBackup = true): Rule {
	return {
		id: generateRuleId(),
		name: 'New Rule',
		condition: '',
		action: '',
		scope: { type: 'vault' },
		options: { backup: defaultBackup },
		created: new Date().toISOString(),
	};
}

/**
 * Validate and migrate plugin data
 */
function validateAndMigrate(rawData: any): PluginData {
	// Basic structure validation
	if (typeof rawData !== 'object' || rawData === null) {
		return {
			version: '1.0',
			rules: [],
			settings: DEFAULT_SETTINGS,
		};
	}

	// Ensure required fields
	const data: PluginData = {
		version: rawData.version || '1.0',
		rules: Array.isArray(rawData.rules) ? rawData.rules : [],
		lastRun: rawData.lastRun,
		settings: { ...DEFAULT_SETTINGS, ...rawData.settings },
	};

	// Validate each rule
	data.rules = data.rules.filter(rule => validateRule(rule));

	return data;
}

/**
 * Validate a single rule
 */
function validateRule(rule: any): boolean {
	if (typeof rule !== 'object' || rule === null) {
		return false;
	}

	// Required fields
	if (!rule.id || typeof rule.id !== 'string') return false;
	if (!rule.name || typeof rule.name !== 'string') return false;
	if (typeof rule.condition !== 'string') return false;
	if (typeof rule.action !== 'string') return false;
	if (!rule.scope || typeof rule.scope !== 'object') return false;
	if (!rule.options || typeof rule.options !== 'object') return false;
	if (!rule.created || typeof rule.created !== 'string') return false;

	// Validate scope
	if (rule.scope.type !== 'vault' && rule.scope.type !== 'folder' && rule.scope.type !== 'current') {
		return false;
	}

	return true;
}
