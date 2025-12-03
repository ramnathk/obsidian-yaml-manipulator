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

	export let plugin;
	export let onClose;

	// Debug helper - only log if debug mode is enabled
	$: debugLog = (...args) => {
		if (plugin?.data?.settings?.debug) {
			console.log(...args);
		}
	};

	let selectedRuleId = null;
	let currentRule = createNewRule();
	let scopeType = 'vault';
	let folderPath = '';
	let condition = '';
	let action = '';
	let backup = true;
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
		currentRule = createNewRule();
		selectedRuleId = null;
		scopeType = 'vault';
		folderPath = '';
		condition = '';
		action = '';
		backup = true;
		conditionError = '';
		actionError = '';
	}

	async function save() {
		if (!validate()) return;

		currentRule.name = currentRule.name || 'Unnamed Rule';
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

		new Notice('Rule saved successfully');
	}

	async function deleteCurrentRule() {
		if (!selectedRuleId) return;
		await deleteRule(plugin, selectedRuleId);
		await plugin.saveSettings();
		newRule();

		new Notice('Rule deleted');
	}

	function validate() {
		conditionError = '';
		actionError = '';

		if (condition.trim()) {
			try {
				parseCondition(condition);
			} catch (e) {
				conditionError = e instanceof Error ? e.message : 'Invalid condition';
				debugLog('Condition error:', conditionError);
				return false;
			}
		}

		if (!action.trim()) {
			actionError = 'Action is required';
			debugLog('Action error:', actionError);
			return false;
		}

		try {
			parseAction(action);
		} catch (e) {
			actionError = e instanceof Error ? e.message : 'Invalid action';
			debugLog('Action error:', actionError);
			return false;
		}

		debugLog('Validation passed');
		new Notice('✓ Validation passed - rule is valid');
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
				'⚠️ You haven\'t previewed this rule yet.\n\n' +
				'It\'s recommended to preview before applying to see what changes will be made.\n\n' +
				'Continue anyway?'
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
						new Notice('No files matched the scope');
				return;
			}

				new Notice(`Processing ${scanResult.matched.length} file(s)...`);

			// SAFETY: No dryRun option means writes will happen
			const result = await processBatch(plugin.app, scanResult.matched, rule);

			const msg = `✅ Complete: ${result.summary.success} success, ${result.summary.warnings} warnings, ${result.summary.errors} errors`;
			new Notice(msg, 5000);

			if (selectedRuleId) {
				const { updateLastRun } = await import('../storage/ruleStorage');
				await updateLastRun(plugin, selectedRuleId);
			}

			// Reset preview flag after successful apply
			hasPreviewedRule = false;
		} catch (error) {
				new Notice(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

<div class="yaml-manipulator-modal">
	<h2>YAML Rule Builder</h2>

	<div class="modal-content">
		<div class="rule-selector">
			<label for="saved-rules-select">Saved Rules:</label>
			<select id="saved-rules-select" bind:value={selectedRuleId} on:change={() => selectedRuleId && loadRule(selectedRuleId)}>
				<option value={null}>-- New Rule --</option>
				{#each savedRules as rule (rule.id)}
					<option value={rule.id}>{rule.name}</option>
				{/each}
			</select>
			<button on:click={newRule}>New</button>
			{#if selectedRuleId}
				<button on:click={deleteCurrentRule} class="danger">Delete</button>
			{/if}
		</div>

		<div class="field">
			<label for="rule-name">Rule Name:</label>
			<input id="rule-name" type="text" bind:value={currentRule.name} placeholder="My Rule" />
		</div>

		<fieldset class="field">
			<legend>Scope:</legend>
			<div class="radio-group">
				<label>
					<input type="radio" bind:group={scopeType} value="vault" />
					Entire Vault
				</label>
				<label>
					<input type="radio" bind:group={scopeType} value="folder" />
					Folder
				</label>
				<label>
					<input type="radio" bind:group={scopeType} value="current" />
					Current File
				</label>
			</div>
			{#if scopeType === 'folder'}
				<input type="text" bind:value={folderPath} placeholder="folder/path" />
			{/if}
		</fieldset>

		<div class="field">
			<label for="condition">Condition (optional):</label>
			<textarea
				id="condition"
				bind:value={condition}
				placeholder='status = "draft" AND priority > 5'
				rows="3"
			></textarea>
			{#if conditionError}
				<div class="error">{conditionError}</div>
			{/if}
		</div>

		<div class="field">
			<label for="action">Action (required):</label>
			<textarea
				id="action"
				bind:value={action}
				placeholder='SET status "published"'
				rows="3"
			></textarea>
			{#if actionError}
				<div class="error">{actionError}</div>
			{/if}
		</div>

		<div class="field">
			<label>
				<input type="checkbox" bind:checked={backup} />
				Create backups before modifying
			</label>
		</div>

		<div class="button-group">
			<div class="left-buttons">
				<button on:click={onClose}>Cancel</button>
			</div>
			<div class="right-buttons">
				<button on:click={save}>Save Rule</button>
				<button on:click={validate} class="secondary">Validate</button>
				<button on:click={preview} class="secondary">Preview</button>
				<button on:click={apply} class="cta">Apply</button>
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
							Preview Files
						</button>
						<button
							class="tab-btn {activeTab === 'test' ? 'active' : ''}"
							on:click={() => activeTab = 'test'}
						>
							Test Sample
						</button>
					</div>
					<button
						class="close-validation"
						on:click={() => showValidationSection = false}
						title="Close validation panel"
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
</style>
