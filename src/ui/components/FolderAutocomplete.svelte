<script>
	/**
	 * FolderAutocomplete Component
	 * Provides autocomplete suggestions for folder paths in the vault
	 * @type {import('obsidian').App}
	 */
	import { createEventDispatcher } from 'svelte';

	export let app;
	export let value = '';
	export let placeholder = 'Enter folder path...';
	export let testFolders = null; // Optional: for testing, bypasses vault API

	const dispatch = createEventDispatcher();

	let filteredFolders = [];
	let showSuggestions = false;
	let selectedIndex = -1;
	let inputElement;

	// Reactive: Initialize folders from testFolders or vault
	$: folders = testFolders
		? ['/'].concat(testFolders)
		: (app?.vault ? ['/'].concat(app.vault.getAllFolders().map(f => f.path)) : ['/']);

	function handleInput(event) {
		const target = event.target;
		value = target.value;
		dispatch('change', value);

		if (value.length > 0) {
			const searchLower = value.toLowerCase();
			filteredFolders = folders.filter(folder =>
				folder.toLowerCase().includes(searchLower)
			);
			showSuggestions = filteredFolders.length > 0;
			selectedIndex = -1;
		} else {
			showSuggestions = false;
			filteredFolders = [];
		}
	}

	function selectFolder(folder) {
		value = folder;
		dispatch('change', folder);
		showSuggestions = false;
		filteredFolders = [];
		selectedIndex = -1;
	}

	function handleKeydown(event) {
		if (!showSuggestions || filteredFolders.length === 0) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, filteredFolders.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				break;
			case 'Enter':
				event.preventDefault();
				if (selectedIndex >= 0 && selectedIndex < filteredFolders.length) {
					selectFolder(filteredFolders[selectedIndex]);
				}
				break;
			case 'Escape':
				showSuggestions = false;
				selectedIndex = -1;
				break;
		}
	}

	function handleFocus() {
		if (value.length > 0 && filteredFolders.length > 0) {
			showSuggestions = true;
		}
	}

	function handleBlur() {
		// Delay hiding to allow click on suggestion
		setTimeout(() => {
			showSuggestions = false;
			selectedIndex = -1;
		}, 200);
	}
</script>

<div class="folder-autocomplete">
	<input
		bind:this={inputElement}
		type="text"
		bind:value
		{placeholder}
		on:input={handleInput}
		on:keydown={handleKeydown}
		on:focus={handleFocus}
		on:blur={handleBlur}
		autocomplete="off"
	/>

	{#if showSuggestions && filteredFolders.length > 0}
		<div class="suggestions-dropdown">
			{#each filteredFolders as folder, index (folder)}
				<div
					class="suggestion-item"
					class:selected={index === selectedIndex}
					role="button"
					tabindex="0"
					on:mousedown|preventDefault={() => selectFolder(folder)}
					on:mouseenter={() => (selectedIndex = index)}
					on:keydown={(e) => e.key === 'Enter' && selectFolder(folder)}
				>
					<span class="folder-icon">📁</span>
					<span class="folder-path">{folder}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.folder-autocomplete {
		position: relative;
		width: 100%;
	}

	input {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		background: var(--background-primary);
		color: var(--text-normal);
		font-size: 14px;
	}

	input:focus {
		outline: none;
		border-color: var(--interactive-accent);
	}

	.suggestions-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		max-height: 200px;
		overflow-y: auto;
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		margin-top: 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 1000;
	}

	.suggestion-item {
		display: flex;
		align-items: center;
		padding: 8px 12px;
		cursor: pointer;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.suggestion-item:last-child {
		border-bottom: none;
	}

	.suggestion-item:hover,
	.suggestion-item.selected {
		background: var(--background-modifier-hover);
	}

	.folder-icon {
		margin-right: 8px;
		font-size: 14px;
	}

	.folder-path {
		color: var(--text-normal);
		font-size: 13px;
	}
</style>
