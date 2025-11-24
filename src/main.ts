/**
 * YAML Manipulator Plugin - Main Entry Point
 * Obsidian plugin for bulk YAML frontmatter manipulation
 */

import { Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { PluginData, Rule } from './types';
import { DEFAULT_SETTINGS } from './settings';
import { loadPluginData, savePluginData, saveRule, deleteRule, createNewRule, updateLastRun } from './storage/ruleStorage';
import { scanFiles } from './core/fileScanner';
import { processBatch } from './core/batchProcessor';
import { createLogger, generateLogPath } from './core/logger';

/**
 * Main plugin class
 */
export default class YamlManipulatorPlugin extends Plugin {
	data: PluginData;

	async onload() {
		console.log('Loading YAML Manipulator plugin');

		// Load plugin data
		this.data = await loadPluginData(this);

		// Register commands
		this.registerCommands();

		// Add settings tab
		this.addSettingTab(new YamlManipulatorSettingTab(this.app, this));

		console.log('YAML Manipulator plugin loaded successfully');
	}

	onunload() {
		console.log('Unloading YAML Manipulator plugin');
	}

	registerCommands() {
		// Command: Open Rule Builder
		this.addCommand({
			id: 'open-rule-builder',
			name: 'Open Rule Builder',
			callback: async () => {
				const { RuleBuilderModalWrapper } = await import('./ui/RuleBuilderModalWrapper');
				new RuleBuilderModalWrapper(this).open();
			},
		});

		// Command: Execute a rule manually (for testing)
		this.addCommand({
			id: 'execute-rule',
			name: 'Execute Rule (Test)',
			callback: async () => {
				await this.executeTestRule();
			},
		});

		// Command: Show frontmatter (kept from iterations 1-3)
		this.addCommand({
			id: 'show-frontmatter',
			name: 'Show Frontmatter',
			callback: async () => {
				const file = this.app.workspace.getActiveFile();
				if (!file) {
					new Notice('No active file');
					return;
				}

				const { readFrontmatter } = await import('./yaml/yamlProcessor');
				const { data } = await readFrontmatter(this.app, file);

				new Notice(`Frontmatter: ${JSON.stringify(data, null, 2)}`);
			},
		});
	}

	/**
	 * Execute a test rule on current file or vault
	 */
	async executeTestRule() {
		try {
			const file = this.app.workspace.getActiveFile();
			if (!file) {
				new Notice('No active file');
				return;
			}

			// Create test rule: SET test "executed"
			const rule: Rule = {
				id: 'test-rule',
				name: 'Test Rule',
				condition: '',  // No condition - applies to all
				action: 'SET test "{{today}}"',
				scope: { type: 'current' },
				options: { backup: this.data.settings.defaultBackup },
				created: new Date().toISOString(),
			};

			new Notice('Executing test rule...');

			// Execute on current file
			const { executeRule } = await import('./core/ruleEngine');
			const result = await executeRule(this.app, rule, file);

			if (result.error) {
				new Notice(`Error: ${result.error}`);
				return;
			}

			if (!result.modified) {
				new Notice('No changes made');
				return;
			}

			// Apply changes
			const { writeFrontmatter, readFrontmatter } = await import('./yaml/yamlProcessor');
			const frontmatter = await readFrontmatter(this.app, file);
			await writeFrontmatter(this.app, file, result.newData, frontmatter.content);

			new Notice(`✅ ${result.changes.join(', ')}`);
		} catch (error) {
			console.error('Error executing test rule:', error);
			new Notice(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Save plugin settings
	 */
	async saveSettings() {
		await savePluginData(this, this.data);
	}
}

/**
 * Settings tab
 */
class YamlManipulatorSettingTab extends PluginSettingTab {
	plugin: YamlManipulatorPlugin;

	constructor(app: any, plugin: YamlManipulatorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'YAML Manipulator Settings' });

		new Setting(containerEl)
			.setName('Default Backup')
			.setDesc('Create backup files (.bak) before making changes')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.data.settings.defaultBackup)
					.onChange(async value => {
						this.plugin.data.settings.defaultBackup = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Max Files Per Batch')
			.setDesc('Maximum number of files to process in one operation')
			.addText(text =>
				text
					.setValue(String(this.plugin.data.settings.maxFilesPerBatch))
					.onChange(async value => {
						const num = parseInt(value);
						if (!isNaN(num) && num > 0) {
							this.plugin.data.settings.maxFilesPerBatch = num;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName('Debug Mode')
			.setDesc('Show debug information in console')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.data.settings.debug)
					.onChange(async value => {
						this.plugin.data.settings.debug = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
