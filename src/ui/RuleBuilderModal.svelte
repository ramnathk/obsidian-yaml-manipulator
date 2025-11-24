<script>
	import { onMount } from 'svelte';
	import { createNewRule, saveRule, deleteRule } from '../storage/ruleStorage';
	import { scanFiles } from '../core/fileScanner';
	import { processBatch } from '../core/batchProcessor';
	import { parseCondition } from '../parser/conditionParser';
	import { parseAction } from '../parser/actionParser';

	export let plugin;
	export let onClose;

	let selectedRuleId = null;
	let currentRule = createNewRule();
	let savedRules = [];
	let scopeType = 'vault';
	let folderPath = '';
	let condition = '';
	let action = '';
	let backup = true;
	let conditionError = '';
	let actionError = '';

	onMount(() => {
		loadSavedRules();
	});

	function loadSavedRules() {
		savedRules = [...plugin.data.rules].sort((a, b) => {
			if (a.lastUsed && b.lastUsed) return b.lastUsed.localeCompare(a.lastUsed);
			if (a.lastUsed) return -1;
			if (b.lastUsed) return 1;
			return b.created.localeCompare(a.created);
		});
	}

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
		loadSavedRules();
		selectedRuleId = currentRule.id;

		const Notice = require('obsidian').Notice;
		new Notice('Rule saved successfully');
	}

	async function deleteCurrentRule() {
		if (!selectedRuleId) return;
		await deleteRule(plugin, selectedRuleId);
		await plugin.saveSettings();
		loadSavedRules();
		newRule();

		const Notice = require('obsidian').Notice;
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
				return false;
			}
		}

		if (!action.trim()) {
			actionError = 'Action is required';
			return false;
		}

		try {
			parseAction(action);
		} catch (e) {
			actionError = e instanceof Error ? e.message : 'Invalid action';
			return false;
		}

		return true;
	}

	async function preview() {
		if (!validate()) return;
		const Notice = require('obsidian').Notice;
		new Notice('Preview functionality coming soon');
	}

	async function apply() {
		if (!validate()) return;

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
				rule.scope,
				{ maxFiles: plugin.data.settings.maxFilesPerBatch }
			);

			if (scanResult.matched.length === 0) {
				const Notice = require('obsidian').Notice;
				new Notice('No files matched the scope');
				return;
			}

			const Notice = require('obsidian').Notice;
			new Notice(`Processing ${scanResult.matched.length} file(s)...`);

			const result = await processBatch(plugin.app, scanResult.matched, rule);

			const msg = `✅ Complete: ${result.summary.success} success, ${result.summary.warnings} warnings, ${result.summary.errors} errors`;
			new Notice(msg, 5000);

			if (selectedRuleId) {
				const { updateLastRun } = await import('../storage/ruleStorage');
				await updateLastRun(plugin, selectedRuleId);
			}
		} catch (error) {
			const Notice = require('obsidian').Notice;
			new Notice(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}
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
	</div>
</div>
