/**
 * Command Palette & Plugin Commands - Integration Tests
 * Focus: Plugin command appears in Obsidian and opens modal correctly
 * NOT testing: Parser logic, validation errors, rule execution
 */

import {
	openCommandPalette,
	searchCommand,
	executeCommand,
	waitForModal,
	screenshot,
} from './helpers/obsidian-helpers';

describe('Commands - Integration', () => {
	it('Command palette opens in Obsidian', async () => {
		await openCommandPalette();
		await browser.pause(500);

		const body = await $('body');
		const text = await body.getText();
		expect(text.length).toBeGreaterThan(100);

		await screenshot('command-palette');
		await browser.keys(['Escape']); // Close
	});

	it('Plugin has exactly 1 command (no dev commands)', async () => {
		await openCommandPalette();
		await searchCommand('yaml');
		await browser.pause(500);

		const body = await $('body');
		const text = await body.getText();

		// Verify ONLY "Open Rule Builder" exists
		expect(text).toContain('Open Rule Builder');

		// Should NOT contain dev commands
		const hasShowFrontmatter = text.includes('Show Frontmatter');
		const hasExecuteTest = text.includes('Execute Rule (Test)');

		console.log(`   Has 'Show Frontmatter': ${hasShowFrontmatter}`);
		console.log(`   Has 'Execute Rule (Test)': ${hasExecuteTest}`);
		console.log(`   Has 'Open Rule Builder': ${text.includes('Open Rule Builder')}`);

		expect(hasShowFrontmatter).toBe(false);
		expect(hasExecuteTest).toBe(false);

		await screenshot('single-command-verified');
		await browser.keys(['Escape']); // Close
	});

	it('Plugin command appears in palette', async () => {
		await openCommandPalette();
		await searchCommand('Rule Builder');
		await browser.pause(300);

		const body = await $('body');
		const text = await body.getText();

		// Verify our plugin command is found
		expect(text).toContain('Rule Builder');

		await screenshot('plugin-command-listed');
		await browser.keys(['Escape']); // Close
	});

	it('Open Rule Builder command opens modal', async () => {
		await openCommandPalette();
		await searchCommand('Open Rule Builder');
		await executeCommand();

		const modal = await waitForModal('.yaml-toolkit-modal', 5000);
		expect(await modal.isDisplayed()).toBe(true);

		const header = await modal.$('h2');
		expect(await header.getText()).toBe('YAML Rule Builder');

		await screenshot('modal-opened-via-command');

		await browser.keys(['Escape']); // Close modal
	});
});
