/**
 * Test modal for displaying frontmatter and messages
 * Used for iterations 1-3 to show plugin is working
 * Will be replaced with more sophisticated UI in later iterations
 */

import { App, Modal } from 'obsidian';

/**
 * Simple modal to display frontmatter data
 * Shows YAML data in a formatted, readable way
 */
export class FrontmatterDisplayModal extends Modal {
	private frontmatterData: any;
	private title: string;

	constructor(app: App, title: string, frontmatterData: any) {
		super(app);
		this.title = title;
		this.frontmatterData = frontmatterData;
	}

	onOpen() {
		const { contentEl } = this;

		// Add title
		contentEl.createEl('h2', { text: this.title });

		// Display frontmatter
		if (this.frontmatterData && Object.keys(this.frontmatterData).length > 0) {
			const pre = contentEl.createEl('pre', {
				cls: 'yaml-manipulator-frontmatter-display',
			});

			pre.style.backgroundColor = 'var(--background-secondary)';
			pre.style.padding = '12px';
			pre.style.borderRadius = '4px';
			pre.style.overflowX = 'auto';
			pre.style.maxHeight = '400px';
			pre.style.overflowY = 'auto';

			pre.textContent = JSON.stringify(this.frontmatterData, null, 2);
		} else {
			contentEl.createEl('p', {
				text: 'No frontmatter found',
				cls: 'yaml-manipulator-empty-message',
			});
		}

		// Add close button
		const buttonContainer = contentEl.createEl('div', {
			cls: 'modal-button-container',
		});
		buttonContainer.style.marginTop = '16px';
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';

		const closeButton = buttonContainer.createEl('button', {
			text: 'Close',
			cls: 'mod-cta',
		});

		closeButton.addEventListener('click', () => {
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

/**
 * Simple modal to display a message
 * Used for showing success/error messages
 */
export class MessageModal extends Modal {
	private message: string;
	private title: string;
	private isError: boolean;

	constructor(app: App, title: string, message: string, isError: boolean = false) {
		super(app);
		this.title = title;
		this.message = message;
		this.isError = isError;
	}

	onOpen() {
		const { contentEl } = this;

		// Add title
		contentEl.createEl('h2', { text: this.title });

		// Display message
		const messageEl = contentEl.createEl('div', {
			cls: 'yaml-manipulator-message',
		});

		messageEl.style.padding = '12px';
		messageEl.style.borderRadius = '4px';
		messageEl.style.marginBottom = '16px';

		if (this.isError) {
			messageEl.style.backgroundColor = 'var(--background-modifier-error)';
			messageEl.style.color = 'var(--text-error)';
		} else {
			messageEl.style.backgroundColor = 'var(--background-secondary)';
		}

		messageEl.textContent = this.message;

		// Add close button
		const buttonContainer = contentEl.createEl('div', {
			cls: 'modal-button-container',
		});
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';

		const closeButton = buttonContainer.createEl('button', {
			text: 'Close',
			cls: 'mod-cta',
		});

		closeButton.addEventListener('click', () => {
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
