<script>
	import { onMount } from 'svelte';
	import { Notice } from 'obsidian';
	import { createNewRule, saveRule, deleteRule } from '../storage/ruleStorage';
	import { scanFiles } from '../core/fileScanner';
	import { processBatch } from '../core/batchProcessor';
	import { parseCondition } from '../parser/conditionParser';
	import { parseAction } from '../parser/actionParser';
	import PreviewTab from './components/PreviewTab.svelte';
	import TestTab from './components/TestTab.svelte';
	import FolderAutocomplete from './components/FolderAutocomplete.svelte';
	import { t$ } from '../i18n';

	// Use $t for Svelte reactive translations
	$: t = $t$;

	export let plugin;
	export let onClose;

	// Debug helper - only log if debug mode is enabled
	$: debugLog = (...args) => {
		if (plugin?.data?.settings?.debug) {
			console.log(...args);
		}
	};

	let selectedRuleId = null;
	let currentRule = createNewRule(plugin.data.settings.defaultBackup);
	let scopeType = 'vault';
	let folderPath = '';
	let condition = '';
	let action = '';
	let backup = currentRule.options.backup;  // Initialize from currentRule
	let conditionError = '';
	let actionError = '';

	// Validation state
	let showValidationSection = false;
	let activeTab = 'preview';
	let previewResults = [];
	let previewLoading = false;
	let previewError = null;
	let hasPreviewedRule = false;

	// Make savedRules reactive to plugin.data.rules changes
	$: savedRules = (() => {
		// Defensive: ensure plugin.data.rules exists and is an array
		if (!plugin?.data?.rules || !Array.isArray(plugin.data.rules)) {
			return [];
		}

		return [...plugin.data.rules].sort((a, b) => {
			if (a.lastUsed && b.lastUsed) return b.lastUsed.localeCompare(a.lastUsed);
			if (a.lastUsed) return -1;
			if (b.lastUsed) return 1;
			return b.created.localeCompare(a.created);
		});
	})();

	// Keep the onMount for any initialization that might be needed
	onMount(() => {
		// No need to call loadSavedRules() anymore - reactive statement handles it
	});

	function loadRule(ruleId) {
		const rule = savedRules.find(r => r.id === ruleId);
		if (!rule) return;
		currentRule = { ...rule };
		selectedRuleId = ruleId;
		scopeType = rule.scope.type;
		folderPath = rule.scope.folder || '';
		condition = rule.condition;
		action = rule.action;
		backup = rule.options.backup;
		conditionError = '';
		actionError = '';
	}

	function newRule() {
		currentRule = createNewRule(plugin.data.settings.defaultBackup);
		selectedRuleId = null;
		scopeType = 'vault';
		folderPath = '';
		condition = '';
		action = '';
		backup = currentRule.options.backup;  // Reset to match new rule's backup setting
		conditionError = '';
		actionError = '';
	}

	async function save() {
		if (!validate()) return;

		currentRule.name = currentRule.name || t('ruleBuilder.fields.ruleName.default');
		currentRule.scope = {
			type: scopeType,
			folder: scopeType === 'folder' ? folderPath : undefined,
		};
		currentRule.condition = condition;
		currentRule.action = action;
		currentRule.options.backup = backup;

		await saveRule(plugin, currentRule);
		await plugin.saveSettings();
		selectedRuleId = currentRule.id;

		new Notice(t('notices.ruleSaved'));
	}

	async function deleteCurrentRule() {
		if (!selectedRuleId) return;
		await deleteRule(plugin, selectedRuleId);
		await plugin.saveSettings();
		newRule();

		new Notice(t('notices.ruleDeleted'));
	}

	function validate() {
		conditionError = '';
		actionError = '';

		if (condition.trim()) {
			try {
				parseCondition(condition);
			} catch (e) {
				conditionError = e instanceof Error ? e.message : t('ruleBuilder.validation.invalidCondition');
				debugLog('Condition error:', conditionError);
				return false;
			}
		}

		if (!action.trim()) {
			actionError = t('ruleBuilder.fields.action.required');
			debugLog('Action error:', actionError);
			return false;
		}

		try {
			parseAction(action);
		} catch (e) {
			actionError = e instanceof Error ? e.message : t('ruleBuilder.validation.invalidAction');
			debugLog('Action error:', actionError);
			return false;
		}

		debugLog('Validation passed');
		new Notice(t('ruleBuilder.validation.passed'));
		return true;
	}

	async function preview() {
		debugLog('Preview clicked');
		if (!validate()) {
			debugLog('Validation failed');
			return;
		}

		debugLog('Starting preview...');
		previewLoading = true;
		previewError = null;
		showValidationSection = true;
		activeTab = 'preview';

		try {
			const rule = {
				...currentRule,
				condition,
				action,
				scope: {
					type: scopeType,
					folder: scopeType === 'folder' ? folderPath : undefined,
				},
				options: { backup },
			};

			const scanResult = await scanFiles(
				plugin.app.vault,
				rule.scope
			);

			debugLog('Files scanned:', scanResult.matched.length);

			// Execute dry-run (SAFETY: dryRun=true means no writes)
			const result = await processBatch(
				plugin.app,
				scanResult.matched,
				rule,
				undefined,
				{ dryRun: true }
			);

			debugLog('Preview results:', result.results.length);
			previewResults = result.results;
			hasPreviewedRule = true;
		} catch (error) {
			console.error('Preview error:', error);
			previewError = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			previewLoading = false;
		}
	}

	async function apply() {
		if (!validate()) return;

		// Smart warning: show if user hasn't previewed
		if (!hasPreviewedRule) {
				const confirmed = confirm(
				t('confirm.applyWithoutPreview.title') + '\n\n' +
				t('confirm.applyWithoutPreview.message') + '\n\n' +
				t('confirm.applyWithoutPreview.question')
			);
			if (!confirmed) return;
		}

		try {
			const rule = {
				...currentRule,
				condition,
				action,
				scope: {
					type: scopeType,
					folder: scopeType === 'folder' ? folderPath : undefined,
				},
				options: { backup },
			};

			const scanResult = await scanFiles(
				plugin.app.vault,
				rule.scope
			);

			if (scanResult.matched.length === 0) {
						new Notice(t('notices.noFilesMatched'));
				return;
			}

				new Notice(t('notices.processing', { count: scanResult.matched.length }));

			// SAFETY: No dryRun option means writes will happen
			const result = await processBatch(plugin.app, scanResult.matched, rule);

			const msg = t('notices.complete', {
				success: result.summary.success,
				warnings: result.summary.warnings,
				errors: result.summary.errors
			});
			new Notice(msg, 5000);

			if (selectedRuleId) {
				const { updateLastRun } = await import('../storage/ruleStorage');
				await updateLastRun(plugin, selectedRuleId);
			}

			// Reset preview flag after successful apply
			hasPreviewedRule = false;
		} catch (error) {
				new Notice(t('notices.error', { message: error instanceof Error ? error.message : 'Unknown error' }));
		}
	}

	// Track previous values to detect actual changes
	let prevCondition = condition;
	let prevAction = action;
	let prevScopeType = scopeType;
	let prevFolderPath = folderPath;

	// Reset preview flag when rule configuration changes
	$: {
		const configChanged =
			condition !== prevCondition ||
			action !== prevAction ||
			scopeType !== prevScopeType ||
			folderPath !== prevFolderPath;

		if (configChanged && hasPreviewedRule) {
			hasPreviewedRule = false;
		}

		// Update previous values
		prevCondition = condition;
		prevAction = action;
		prevScopeType = scopeType;
		prevFolderPath = folderPath;
	}

	// Build current rule for TestTab
	$: testRule = {
		...currentRule,
		condition,
		action,
		scope: {
			type: scopeType,
			folder: scopeType === 'folder' ? folderPath : undefined,
		},
		options: { backup },
	};
</script>

<div class="yaml-toolkit-modal">
	<h2>{t('ruleBuilder.title')}</h2>

	<div class="modal-content">
		<div class="rule-selector">
			<label for="saved-rules-select">{t('ruleBuilder.savedRules.label')}</label>
			<select id="saved-rules-select" bind:value={selectedRuleId} on:change={() => selectedRuleId && loadRule(selectedRuleId)}>
				<option value={null}>{t('ruleBuilder.savedRules.newRule')}</option>
				{#each savedRules as rule (rule.id)}
					<option value={rule.id}>{rule.name}</option>
				{/each}
			</select>
			<button on:click={newRule}>{t('ruleBuilder.buttons.new')}</button>
			{#if selectedRuleId}
				<button on:click={deleteCurrentRule} class="danger">{t('ruleBuilder.buttons.delete')}</button>
			{/if}
		</div>

		<div class="field">
			<label for="rule-name">{t('ruleBuilder.fields.ruleName.label')}</label>
			<input id="rule-name" type="text" bind:value={currentRule.name} placeholder={t('ruleBuilder.fields.ruleName.placeholder')} />
		</div>

		<fieldset class="field">
			<legend>{t('ruleBuilder.fields.scope.legend')}</legend>
			<div class="radio-group">
				<label>
					<input type="radio" bind:group={scopeType} value="vault" />
					{t('ruleBuilder.fields.scope.vault')}
				</label>
				<label>
					<input type="radio" bind:group={scopeType} value="folder" />
					{t('ruleBuilder.fields.scope.folder')}
				</label>
				<label>
					<input type="radio" bind:group={scopeType} value="current" />
					{t('ruleBuilder.fields.scope.current')}
				</label>
			</div>
			{#if scopeType === 'folder'}
				<FolderAutocomplete
					app={plugin.app}
					bind:value={folderPath}
					placeholder={t('ruleBuilder.fields.scope.folderPlaceholder')}
					on:change={(e) => folderPath = e.detail}
				/>
			{/if}
		</fieldset>

		<div class="field">
			<label for="condition">
				{t('ruleBuilder.fields.condition.label')}
				<span class="help-icon" title={t('ruleBuilder.fields.condition.helpText')}>ℹ️</span>
			</label>
			<textarea
				id="condition"
				bind:value={condition}
				placeholder={t('ruleBuilder.fields.condition.placeholder')}
				rows="3"
			></textarea>
			{#if conditionError}
				<div class="error">{conditionError}</div>
			{/if}
		</div>

		<div class="field">
			<label for="action">{t('ruleBuilder.fields.action.label')}</label>
			<textarea
				id="action"
				bind:value={action}
				placeholder={t('ruleBuilder.fields.action.placeholder')}
				rows="3"
			></textarea>
			{#if actionError}
				<div class="error">{actionError}</div>
			{/if}
		</div>

		<div class="field">
			<label>
				<input type="checkbox" bind:checked={backup} />
				{t('ruleBuilder.fields.backup.label')}
			</label>
		</div>

		<div class="button-group">
			<div class="left-buttons">
				<button on:click={onClose}>{t('ruleBuilder.buttons.cancel')}</button>
			</div>
			<div class="right-buttons">
				<button on:click={save}>{t('ruleBuilder.buttons.save')}</button>
				<button on:click={validate} class="secondary">{t('ruleBuilder.buttons.validate')}</button>
				<button on:click={preview} class="secondary">{t('ruleBuilder.buttons.preview')}</button>
				<button on:click={apply} class="cta">{t('ruleBuilder.buttons.apply')}</button>
			</div>
		</div>

		{#if showValidationSection}
			<div class="validation-section">
				<div class="validation-header">
					<div class="validation-tabs">
						<button
							class="tab-btn {activeTab === 'preview' ? 'active' : ''}"
							on:click={() => activeTab = 'preview'}
						>
							{t('ruleBuilder.tabs.preview')}
						</button>
						<button
							class="tab-btn {activeTab === 'test' ? 'active' : ''}"
							on:click={() => activeTab = 'test'}
						>
							{t('ruleBuilder.tabs.test')}
						</button>
					</div>
					<button
						class="close-validation"
						on:click={() => showValidationSection = false}
						title={t('ruleBuilder.closeValidation')}
					>
						✕
					</button>
				</div>

				<div class="validation-content">
					{#if activeTab === 'preview'}
						<PreviewTab
							results={previewResults}
							isLoading={previewLoading}
							error={previewError}
						/>
					{:else}
						<TestTab rule={testRule} app={plugin.app} />
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Error message styling */
	.error {
		color: var(--text-error);
		font-size: var(--font-ui-smaller);
		margin-top: var(--size-4-2);
		line-height: 1.4;
	}

	/* Validation section */
	.validation-section {
		margin-top: var(--size-4-6);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-s);
		background: var(--background-secondary);
		overflow: hidden;
	}

	.validation-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--background-secondary-alt);
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.validation-tabs {
		display: flex;
		gap: 0;
		flex: 1;
	}

	.tab-btn {
		flex: 1;
		padding: var(--size-4-3) var(--size-4-4);
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		font-weight: var(--font-medium);
		font-size: var(--font-ui-small);
		color: var(--text-muted);
		transition: all 0.2s;
	}

	.tab-btn:hover {
		color: var(--text-normal);
		background: var(--interactive-hover);
	}

	.tab-btn.active {
		background: var(--background-primary);
		color: var(--text-normal);
		border-bottom-color: var(--interactive-accent);
	}

	.close-validation {
		padding: var(--size-4-2) var(--size-4-3);
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		font-size: 18px;
		line-height: 1;
		transition: color 0.1s;
		flex-shrink: 0;
	}

	.close-validation:hover {
		color: var(--text-error);
	}

	.validation-content {
		min-height: 300px;
		max-height: 500px;
		overflow-y: auto;
		background: var(--background-primary);
	}

	/* Help icon styling */
	.help-icon {
		display: inline-block;
		margin-left: var(--size-4-1);
		cursor: help;
		color: var(--text-muted);
		font-size: var(--font-ui-small);
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.help-icon:hover {
		opacity: 1;
		color: var(--interactive-accent);
	}
</style>
