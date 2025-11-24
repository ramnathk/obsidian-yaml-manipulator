/**
 * Rule Builder Modal Wrapper
 * Wraps the Svelte component in an Obsidian Modal
 */

import { Modal } from 'obsidian';
import RuleBuilderModal from './RuleBuilderModal.svelte';
import type YamlManipulatorPlugin from '../main';

export class RuleBuilderModalWrapper extends Modal {
	private component: RuleBuilderModal | null = null;
	private plugin: YamlManipulatorPlugin;

	constructor(plugin: YamlManipulatorPlugin) {
		super(plugin.app);
		this.plugin = plugin;
		this.modalEl.addClass('yaml-rule-builder-modal');
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		this.component = new RuleBuilderModal({
			target: contentEl,
			props: {
				plugin: this.plugin,
				onClose: () => this.close(),
			},
		});
	}

	onClose() {
		if (this.component) {
			this.component.$destroy();
			this.component = null;
		}
		const { contentEl } = this;
		contentEl.empty();
	}
}
