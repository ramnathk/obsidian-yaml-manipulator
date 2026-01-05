/**
 * YAML Toolkit - Main Entry Point
 * Obsidian plugin for bulk YAML frontmatter manipulation
 */

import { Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { PluginData, Rule } from './types';
import { DEFAULT_SETTINGS } from './settings';
import { loadPluginData, savePluginData, saveRule, deleteRule, createNewRule, updateLastRun } from './storage/ruleStorage';
import { scanFiles } from './core/fileScanner';
import { processBatch } from './core/batchProcessor';
import { createLogger, generateLogPath } from './core/logger';
import { initI18n, t } from './i18n';

/**
 * Main plugin class
 */
export default class YamlToolkitPlugin extends Plugin {
	data: PluginData;

	/** Debug logging helper - only logs if debug mode is enabled */
	debugLog(...args: any[]) {
		if (this.data?.settings?.debug) {
			console.log('[YAML Toolkit]', ...args);
		}
	}

	async onload() {
		// Initialize i18n system
		initI18n();

		// Always log loading (before settings are loaded)
		console.log(t('plugin.loading'));

		// Load plugin data
		this.data = await loadPluginData(this);

		// Register commands
		this.registerCommands();

		// Add settings tab
		this.addSettingTab(new YamlToolkitSettingTab(this.app, this));

		this.debugLog('Plugin loaded successfully');
	}

	onunload() {
		this.debugLog('Plugin unloading');
	}

	registerCommands() {
		// Command: Open Rule Builder (main user-facing feature)
		this.addCommand({
			id: 'open-rule-builder',
			name: t('commands.openRuleBuilder'),
			callback: async () => {
				const { RuleBuilderModalWrapper } = await import('./ui/RuleBuilderModalWrapper');
				new RuleBuilderModalWrapper(this).open();
			},
		});
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
class YamlToolkitSettingTab extends PluginSettingTab {
	plugin: YamlToolkitPlugin;

	constructor(app: any, plugin: YamlToolkitPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: t('settings.title') });

		new Setting(containerEl)
			.setName(t('settings.defaultBackup.name'))
			.setDesc(t('settings.defaultBackup.description'))
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.data.settings.defaultBackup)
					.onChange(async value => {
						this.plugin.data.settings.defaultBackup = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t('settings.debugMode.name'))
			.setDesc(t('settings.debugMode.description'))
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
