/**
 * Folder Autocomplete E2E Tests
 * Tests folder autocomplete functionality in real Obsidian with multi-level test folders
 *
 * Test Vault Structure:
 * - Projects/Work/Active
 * - Projects/Work/Archive/2024
 * - Projects/Work/Completed
 * - Projects/Personal/Health
 * - Projects/Personal/Finance
 * - Notes/Daily
 * - Notes/Weekly
 * - Notes/Monthly
 * - Reference/Books
 * - Reference/Articles/Tech
 * - Archive
 */

import {
	openCommandPalette,
	searchCommand,
	executeCommand,
	waitForModal,
	screenshot,
} from './helpers/obsidian-helpers';

describe('Folder Autocomplete - E2E', () => {
	beforeEach(async () => {
		// Open Rule Builder modal
		await openCommandPalette();
		await searchCommand('Open Rule Builder');
		await executeCommand();
		await waitForModal();
		await browser.pause(500); // Wait for modal to fully render
	});

	afterEach(async () => {
		// Close modal
		await browser.keys(['Escape']);
		await browser.pause(300);
	});

	describe('Filtering by Immediate Subfolder', () => {
		it('should find immediate subfolder "Work" when typing "work"', async () => {
			// Select Folder scope
			const folderRadio = await $('input[value="folder"]');
			await folderRadio.click();
			await browser.pause(300);

			// Get folder input
			const folderInput = await $('input[placeholder*="folder"]');
			expect(await folderInput.isDisplayed()).toBe(true);

			// Type "work" to find Projects/Work
			await folderInput.setValue('work');

			// Wait for dropdown to appear (reactive update takes time)
			const dropdown = await $('.suggestions-dropdown');
			await browser.waitUntil(
				async () => await dropdown.isExisting(),
				{ timeout: 3000, timeoutMsg: 'Dropdown did not appear after typing' }
			);
			expect(await dropdown.isDisplayed()).toBe(true);

			// Get all suggestions
			const suggestions = await $$('.folder-path');
			const folderTexts = [];
			for (const s of suggestions) {
				folderTexts.push(await s.getText());
			}

			// MUST include Projects/Work and its subfolders
			expect(folderTexts).toContain('Projects/Work');
			expect(folderTexts).toContain('Projects/Work/Active');
			expect(folderTexts).toContain('Projects/Work/Archive');
			expect(folderTexts).toContain('Projects/Work/Completed');
			expect(folderTexts).toContain('Projects/Work/Archive/2024');

			// MUST NOT include non-matching folders
			expect(folderTexts).not.toContain('Projects/Personal');
			expect(folderTexts).not.toContain('Notes/Daily');
			expect(folderTexts).not.toContain('Reference/Books');

			await screenshot('filter-immediate-subfolder-work');
		});
	});

	describe('Filtering by Leaf Folder (2+ levels deep)', () => {
		it('should find deep leaf folder "2024" in Projects/Work/Archive/2024', async () => {
			// Select Folder scope
			const folderRadio = await $('input[value="folder"]');
			await folderRadio.click();
			await browser.pause(300);

			// Get folder input
			const folderInput = await $('input[placeholder*="folder"]');

			// Type "2024" to find the deep folder
			await folderInput.setValue('2024');
			await browser.pause(1000); // Extra time for reactive update

			// Wait for dropdown to appear
			const dropdown = await $('.suggestions-dropdown');
			await browser.waitUntil(
				async () => await dropdown.isExisting(),
				{ timeout: 5000, timeoutMsg: 'Dropdown did not appear for "2024" search' }
			);

			// Get suggestions
			const suggestions = await $$('.folder-path');
			const folderTexts = [];
			for (const s of suggestions) {
				folderTexts.push(await s.getText());
			}

			// MUST include the deep folder
			expect(folderTexts).toContain('Projects/Work/Archive/2024');

			// MUST NOT include unrelated folders
			expect(folderTexts).not.toContain('Projects/Work/Active');
			expect(folderTexts).not.toContain('Projects/Personal/Health');
			expect(folderTexts).not.toContain('Notes/Daily');

			// Should only have 1 match
			expect(folderTexts.length).toBe(1);

			await screenshot('filter-deep-leaf-2024');
		});

		it('should find leaf folder "Tech" in Reference/Articles/Tech', async () => {
			// Select Folder scope
			const folderRadio = await $('input[value="folder"]');
			await folderRadio.click();
			await browser.pause(300);

			// Get folder input
			const folderInput = await $('input[placeholder*="folder"]');

			// Type "tech"
			await folderInput.setValue('tech');
			await browser.pause(500);

			// Wait for dropdown to appear
			const dropdown = await $('.suggestions-dropdown');
			await browser.waitUntil(
				async () => await dropdown.isExisting(),
				{ timeout: 3000, timeoutMsg: 'Dropdown did not appear' }
			);

			// Get suggestions
			const suggestions = await $$('.folder-path');
			const folderTexts = [];
			for (const s of suggestions) {
				folderTexts.push(await s.getText());
			}

			// MUST include Tech folder
			expect(folderTexts).toContain('Reference/Articles/Tech');

			// Should only have 1 match
			expect(folderTexts.length).toBe(1);

			await screenshot('filter-deep-leaf-tech');
		});
	});

	describe('Filtering by Intermediate Folder', () => {
		it('should find intermediate folder "Archive" at multiple levels', async () => {
			// Select Folder scope
			const folderRadio = await $('input[value="folder"]');
			await folderRadio.click();
			await browser.pause(300);

			// Get folder input
			const folderInput = await $('input[placeholder*="folder"]');

			// Type "archive"
			await folderInput.setValue('archive');
			await browser.pause(500);

			// Wait for dropdown to appear
			const dropdown = await $('.suggestions-dropdown');
			await browser.waitUntil(
				async () => await dropdown.isExisting(),
				{ timeout: 3000, timeoutMsg: 'Dropdown did not appear' }
			);

			// Get suggestions
			const suggestions = await $$('.folder-path');
			const folderTexts = [];
			for (const s of suggestions) {
				folderTexts.push(await s.getText());
			}

			// MUST include both Archive folders
			expect(folderTexts).toContain('Archive'); // Root level
			expect(folderTexts).toContain('Projects/Work/Archive'); // Intermediate
			expect(folderTexts).toContain('Projects/Work/Archive/2024'); // Contains "archive"

			// MUST NOT include non-matching folders
			expect(folderTexts).not.toContain('Projects/Work/Active');
			expect(folderTexts).not.toContain('Notes/Daily');
			expect(folderTexts).not.toContain('Reference/Books');

			// Should have exactly 3 matches
			expect(folderTexts.length).toBe(3);

			await screenshot('filter-intermediate-archive');
		});

		it('should find intermediate folder "Articles" in Reference/Articles', async () => {
			// Select Folder scope
			const folderRadio = await $('input[value="folder"]');
			await folderRadio.click();
			await browser.pause(300);

			// Get folder input
			const folderInput = await $('input[placeholder*="folder"]');

			// Type "articles"
			await folderInput.setValue('articles');
			await browser.pause(500);

			// Wait for dropdown to appear
			const dropdown = await $('.suggestions-dropdown');
			await browser.waitUntil(
				async () => await dropdown.isExisting(),
				{ timeout: 3000, timeoutMsg: 'Dropdown did not appear' }
			);

			// Get suggestions
			const suggestions = await $$('.folder-path');
			const folderTexts = [];
			for (const s of suggestions) {
				folderTexts.push(await s.getText());
			}

			// MUST include Articles folder and its children
			expect(folderTexts).toContain('Reference/Articles');
			expect(folderTexts).toContain('Reference/Articles/Tech');

			// MUST NOT include unrelated folders
			expect(folderTexts).not.toContain('Reference/Books');
			expect(folderTexts).not.toContain('Projects/Work');

			// Should have exactly 2 matches
			expect(folderTexts.length).toBe(2);

			await screenshot('filter-intermediate-articles');
		});
	});

	describe('Case-Insensitive Filtering', () => {
		it('should match regardless of case', async () => {
			// Select Folder scope
			const folderRadio = await $('input[value="folder"]');
			await folderRadio.click();
			await browser.pause(300);

			// Get folder input
			const folderInput = await $('input[placeholder*="folder"]');

			// Type "HEALTH" in all caps
			await folderInput.setValue('HEALTH');
			await browser.pause(500);

			// Wait for dropdown to appear
			const dropdown = await $('.suggestions-dropdown');
			await browser.waitUntil(
				async () => await dropdown.isExisting(),
				{ timeout: 3000, timeoutMsg: 'Dropdown did not appear' }
			);

			// Get suggestions
			const suggestions = await $$('.folder-path');
			const folderTexts = [];
			for (const s of suggestions) {
				folderTexts.push(await s.getText());
			}

			// MUST match case-insensitively
			expect(folderTexts).toContain('Projects/Personal/Health');

			// Should only have 1 match
			expect(folderTexts.length).toBe(1);

			await screenshot('filter-case-insensitive');
		});
	});

	describe('Multiple Matches at Different Depths', () => {
		it('should show all folders containing "work" at any depth', async () => {
			// Select Folder scope
			const folderRadio = await $('input[value="folder"]');
			await folderRadio.click();
			await browser.pause(300);

			// Get folder input
			const folderInput = await $('input[placeholder*="folder"]');

			// Type "work"
			await folderInput.setValue('work');
			await browser.pause(500);

			// Wait for dropdown to appear
			const dropdown = await $('.suggestions-dropdown');
			await browser.waitUntil(
				async () => await dropdown.isExisting(),
				{ timeout: 3000, timeoutMsg: 'Dropdown did not appear' }
			);

			// Get suggestions
			const suggestions = await $$('.folder-path');
			const folderTexts = [];
			for (const s of suggestions) {
				folderTexts.push(await s.getText());
			}

			// MUST include Work and all its descendants
			expect(folderTexts).toContain('Projects/Work');
			expect(folderTexts).toContain('Projects/Work/Active');
			expect(folderTexts).toContain('Projects/Work/Archive');
			expect(folderTexts).toContain('Projects/Work/Archive/2024');
			expect(folderTexts).toContain('Projects/Work/Completed');

			// MUST NOT include folders without "work"
			expect(folderTexts).not.toContain('Projects/Personal');
			expect(folderTexts).not.toContain('Notes/Daily');
			expect(folderTexts).not.toContain('Reference/Books');
			expect(folderTexts).not.toContain('Archive');

			// Should have exactly 5 matches (Projects/Work + 4 children)
			expect(folderTexts.length).toBe(5);

			await screenshot('filter-multiple-depths-work');
		});
	});

	describe('Keyboard Navigation and Selection', () => {
		it('should navigate dropdown with arrow keys and select with Enter', async () => {
			// Select Folder scope
			const folderRadio = await $('input[value="folder"]');
			await folderRadio.click();
			await browser.pause(300);

			// Get folder input
			const folderInput = await $('input[placeholder*="folder"]');

			// Type to trigger autocomplete
			await folderInput.setValue('notes');
			await browser.pause(500);

			// Wait for dropdown to appear
			const dropdown = await $('.suggestions-dropdown');
			await browser.waitUntil(
				async () => await dropdown.isExisting(),
				{ timeout: 3000, timeoutMsg: 'Dropdown did not appear' }
			);

			// Get suggestions count
			const suggestions = await $$('.folder-path');
			expect(suggestions.length).toBeGreaterThanOrEqual(3); // Notes, Notes/Daily, Notes/Weekly, Notes/Monthly

			// Press ArrowDown to navigate
			await browser.keys(['ArrowDown']);
			await browser.pause(200);

			// Check if an item is selected
			const selectedItem = await $('.suggestion-item.selected');
			expect(await selectedItem.isExisting()).toBe(true);

			await screenshot('keyboard-navigation-arrow-down');

			// Press Enter to select
			await browser.keys(['Enter']);
			await browser.pause(300);

			// Dropdown should close
			expect(await dropdown.isExisting()).toBe(false);

			// Input should have the selected folder
			const value = await folderInput.getValue();
			expect(value).toMatch(/Notes/); // Should contain "Notes"

			await screenshot('folder-selected-via-keyboard');
		});
	});

	describe('Mouse Click Selection', () => {
		it('should select folder by clicking on suggestion', async () => {
			// Select Folder scope
			const folderRadio = await $('input[value="folder"]');
			await folderRadio.click();
			await browser.pause(300);

			// Get folder input
			const folderInput = await $('input[placeholder*="folder"]');

			// Type to trigger autocomplete
			await folderInput.setValue('personal');
			await browser.pause(500);

			// Wait for dropdown to appear
			const dropdown = await $('.suggestions-dropdown');
			await browser.waitUntil(
				async () => await dropdown.isExisting(),
				{ timeout: 3000, timeoutMsg: 'Dropdown did not appear' }
			);

			// Get first suggestion
			const firstSuggestion = await $('.suggestion-item');
			const folderPath = await firstSuggestion.$('.folder-path');
			const folderText = await folderPath.getText();

			// Folder text MUST be Projects/Personal or one of its children
			expect(folderText).toMatch(/Projects\/Personal/);

			// Click the suggestion
			await firstSuggestion.click();
			await browser.pause(300);

			// Dropdown should close
			expect(await dropdown.isExisting()).toBe(false);

			// Input value should be the selected folder
			expect(await folderInput.getValue()).toBe(folderText);

			await screenshot('folder-selected-by-click');
		});
	});

	describe('Root Folder Support', () => {
		it('should show root folder (/) when typing "/"', async () => {
			// Select Folder scope
			const folderRadio = await $('input[value="folder"]');
			await folderRadio.click();
			await browser.pause(300);

			// Get folder input
			const folderInput = await $('input[placeholder*="folder"]');

			// Type "/" to show root
			await folderInput.setValue('/');
			await browser.pause(500);

			// Wait for dropdown to appear
			const dropdown = await $('.suggestions-dropdown');
			await browser.waitUntil(
				async () => await dropdown.isExisting(),
				{ timeout: 3000, timeoutMsg: 'Dropdown did not appear' }
			);

			// Get suggestions
			const suggestions = await $$('.folder-path');
			const folderTexts = [];
			for (const s of suggestions) {
				folderTexts.push(await s.getText());
			}

			// MUST include root folder
			expect(folderTexts).toContain('/');

			// Should also include all folders (since "/" is in every path)
			expect(folderTexts.length).toBeGreaterThan(1);

			await screenshot('root-folder-in-suggestions');
		});
	});

	describe('No False Positives', () => {
		it('should only show folders matching "finance" (no partial matches)', async () => {
			// Select Folder scope
			const folderRadio = await $('input[value="folder"]');
			await folderRadio.click();
			await browser.pause(300);

			// Get folder input
			const folderInput = await $('input[placeholder*="folder"]');

			// Type "finance"
			await folderInput.setValue('finance');
			await browser.pause(500);

			// Wait for dropdown to appear
			const dropdown = await $('.suggestions-dropdown');
			await browser.waitUntil(
				async () => await dropdown.isExisting(),
				{ timeout: 3000, timeoutMsg: 'Dropdown did not appear' }
			);

			// Get suggestions
			const suggestions = await $$('.folder-path');
			const folderTexts = [];
			for (const s of suggestions) {
				folderTexts.push(await s.getText());
			}

			// MUST include ONLY Finance folder
			expect(folderTexts).toContain('Projects/Personal/Finance');

			// Should have exactly 1 match
			expect(folderTexts.length).toBe(1);

			// MUST NOT show any other folders
			expect(folderTexts).not.toContain('Projects/Personal/Health');
			expect(folderTexts).not.toContain('Projects/Work');
			expect(folderTexts).not.toContain('Notes/Daily');

			await screenshot('no-false-positives-finance');
		});

		it('should show NO results for non-existent folder', async () => {
			// Select Folder scope
			const folderRadio = await $('input[value="folder"]');
			await folderRadio.click();
			await browser.pause(300);

			// Get folder input
			const folderInput = await $('input[placeholder*="folder"]');

			// Type something that doesn't exist
			await folderInput.setValue('xyz123notfound');
			await browser.pause(500);

			// Dropdown should NOT appear (no matches)
			const dropdown = await $('.suggestions-dropdown');
			expect(await dropdown.isExisting()).toBe(false);

			await screenshot('no-matches-no-dropdown');
		});
	});

	describe('Complex Path Matching', () => {
		it('should find all folders containing substring "per" (Personal, Completed)', async () => {
			// Select Folder scope
			const folderRadio = await $('input[value="folder"]');
			await folderRadio.click();
			await browser.pause(300);

			// Get folder input
			const folderInput = await $('input[placeholder*="folder"]');

			// Type "per" to match Personal and Completed (comPlEted has "pe")
			await folderInput.setValue('person');
			await browser.pause(500);

			// Wait for dropdown to appear
			const dropdown = await $('.suggestions-dropdown');
			await browser.waitUntil(
				async () => await dropdown.isExisting(),
				{ timeout: 3000, timeoutMsg: 'Dropdown did not appear' }
			);

			// Get suggestions
			const suggestions = await $$('.folder-path');
			const folderTexts = [];
			for (const s of suggestions) {
				folderTexts.push(await s.getText());
			}

			// MUST include Personal and its children
			expect(folderTexts).toContain('Projects/Personal');
			expect(folderTexts).toContain('Projects/Personal/Health');
			expect(folderTexts).toContain('Projects/Personal/Finance');

			// MUST NOT include Projects/Work/Completed (doesn't contain "person")
			expect(folderTexts).not.toContain('Projects/Work/Completed');

			await screenshot('filter-substring-person');
		});
	});
});
