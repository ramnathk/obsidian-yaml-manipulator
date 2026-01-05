/**
 * Obsidian Helper Functions for WDIO Tests
 * Common operations for interacting with Obsidian UI
 */

/**
 * Global screenshot tracking functions
 * Defined in wdio.conf.js and made available globally
 */
declare global {
	var trackScreenshot: (filepath: string) => void;
}

/**
 * Open Obsidian command palette
 */
export async function openCommandPalette() {
	const isMac = process.platform === 'darwin';
	const keys = isMac ? ['Meta', 'p'] : ['Control', 'p'];

	await browser.keys(keys);
	await browser.pause(500); // Wait for palette to appear
}

/**
 * Search for a command in the palette
 */
export async function searchCommand(commandName: string) {
	// Command palette input (adjust selector based on actual Obsidian DOM)
	const input = await $('.prompt-input, .command-palette input, input[placeholder*="command"]');

	if (await input.isExisting()) {
		await input.setValue(commandName);
		await browser.pause(300); // Wait for results to filter
	} else {
		// Fallback: just type
		await browser.keys(commandName.split(''));
		await browser.pause(300);
	}
}

/**
 * Execute a command (assumes command palette is open and command is visible)
 */
export async function executeCommand() {
	await browser.keys(['Enter']);
	await browser.pause(500); // Wait for command to execute
}

/**
 * Wait for modal to appear
 */
export async function waitForModal(className: string = '.yaml-toolkit-modal', timeout: number = 5000) {
	const modal = await $(className);
	await modal.waitForDisplayed({ timeout });
	return modal;
}

/**
 * Wait for Notice to appear
 */
export async function waitForNotice(timeout: number = 5000) {
	const notice = await $('.notice');
	await notice.waitForDisplayed({ timeout });
	return notice;
}

/**
 * Get Notice text
 */
export async function getNoticeText(): Promise<string> {
	const notice = await waitForNotice();
	return await notice.getText();
}

/**
 * Wait for Notice to disappear
 */
export async function waitForNoticeToDisappear(timeout: number = 5000) {
	const notice = await $('.notice');
	await notice.waitForDisplayed({ timeout, reverse: true });
}

/**
 * Take screenshot with descriptive name
 * Automatically tracks screenshots per test for cleanup
 */
export async function screenshot(name: string) {
	const filepath = `./test-results/${name}.png`;
	await browser.saveScreenshot(filepath);

	// Track screenshot for current test (uses global function from wdio.conf.js)
	if (typeof global.trackScreenshot === 'function') {
		global.trackScreenshot(filepath);
	}
}

/**
 * Navigate to settings
 */
export async function openSettings() {
	const isMac = process.platform === 'darwin';
	const keys = isMac ? ['Meta', ','] : ['Control', ','];

	await browser.keys(keys);
	await browser.pause(1000); // Wait for settings to open
}

/**
 * Find plugin in community plugins list
 */
export async function findPluginInSettings(pluginName: string) {
	// Navigate to Community plugins tab
	const communityPluginsTab = await $('*=Community plugins');

	if (await communityPluginsTab.isExisting()) {
		await communityPluginsTab.click();
		await browser.pause(500);
	}

	// Find plugin
	const plugin = await $(`*=${pluginName}`);
	return plugin;
}

/**
 * Read file frontmatter from test vault
 */
export async function readTestVaultFile(fileName: string) {
	const fs = require('fs');
	const path = require('path');
	const matter = require('gray-matter');

	const vaultPath = path.join(__dirname, '../../../test-vaults/default');
	const filePath = path.join(vaultPath, fileName);

	const content = fs.readFileSync(filePath, 'utf8');
	const parsed = matter(content);

	return parsed.data;
}

/**
 * Add file to test vault (for test setup)
 */
export async function addTestVaultFile(fileName: string, frontmatter: any, content: string = '') {
	const fs = require('fs');
	const path = require('path');
	const matter = require('gray-matter');

	const vaultPath = path.join(__dirname, '../../../test-vaults/default');
	const filePath = path.join(vaultPath, fileName);

	// Ensure directory exists
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	const fileContent = matter.stringify(content, frontmatter);
	fs.writeFileSync(filePath, fileContent, 'utf8');
}
